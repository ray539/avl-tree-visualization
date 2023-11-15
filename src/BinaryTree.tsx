import { CANVASWIDTH, Coord, MINWIDTH } from "./common";

interface N {
  value: number;
  id: string;
  left: TreeNode;
  right: TreeNode;
  position: Coord;
  height: number;
  parent: TreeNode;
}

type TreeNode = N | null;

export interface CreateNodeInstruction {
  type: "create_node";
  attatchedTo: string;
  id: string;
  value: number;
  position: Coord;
  stepExplanation: string;
}

export interface CompareWithInstruction {
  type: "compare_with";
  id: string;
  goTo: string;
  stepExplanation: string;
}

export interface MoveNodeInstruction {
  type: "move_node";
  id: string;
  to: Coord;
  stepExplanation: string | undefined;
}

export interface ValueFoundInstruction {
  type: "value_found";
  id: string;
  stepExplanation: string;
}

export interface RotationInstruction {
  type: "rotate";
  linksToRemove: string[]; // series of 'id1-id2'
  linksToAdd: string[]; //series of 'id1-id2'
  nodeMoveMent: MoveNodeInstruction[]
  stepExplanation: string;
  n1: TreeNode;
  n2: TreeNode;
}

export type Instruction =
  | CreateNodeInstruction
  | CompareWithInstruction
  | ValueFoundInstruction
  | RotationInstruction;

export interface Command {
  name: string;
  steps: Instruction[];
}

export class BinaryTree {
  root: TreeNode = null;
  idGen = 0;
  HALFWIDTH: number = CANVASWIDTH / 2;

  private doClone(root: TreeNode, parent: TreeNode) {
    if (!root) return null;

    let cloneRoot: N = {
      value: root.value,
      id: root.id,
      left: null,
      right: null,
      position: root?.position,
      height: root.height,
      parent: parent
    }
    cloneRoot.left = this.doClone(root.left, root);
    cloneRoot.right = this.doClone(root.right, root);
    return cloneRoot;
  }

  public clone() {
    let newTree = new BinaryTree();
    newTree.root = this.doClone(this.root, null)
    newTree.idGen = this.idGen;
    newTree.HALFWIDTH = this.HALFWIDTH;
    return newTree;
  }

  private newId() {
    return (this.idGen++).toString();
  }

  private doAddValue(
    value: number,
    root: TreeNode,
    pos: Coord,
    gap: number,
    parent: TreeNode,
    steps: Instruction[]
  ): {newRoot: TreeNode, rotationInstruction: RotationInstruction | null} {
    if (!root) {
      let newId = this.newId();
      steps.push({
        type: "create_node",
        attatchedTo: parent ? parent.id : '',
        id: newId,
        value: value,
        position: pos,
        stepExplanation: `Empty node found, inserting ${value}`,
      });

      return {
        newRoot:
        {
          value: value,
          id: newId,
          left: null,
          right: null,
          parent: root,
          position: pos,
          height: 0
        },
        rotationInstruction: null
      }

    }

    let compareInstruction: CompareWithInstruction = {
      type: "compare_with",
      id: root.id,
      goTo: "",
      stepExplanation: "",
    };

    if (value > root.value) {
      let newGap = gap / 2;
      let newPos = { x: root.position.x + newGap, y: root.position.y + 50 };
      compareInstruction.stepExplanation = `${value} > ${root.value}, insert right`;
      if (root.right) {
        compareInstruction.goTo = root.right.id;
      }
      steps.push(compareInstruction);

      root.right = this.doAddValue(
        value,
        root.right,
        newPos,
        newGap,
        root,
        steps
      ).newRoot;
    } else if (value < root.value) {
      let newGap = gap / 2;
      let newPos = { x: root.position.x - newGap, y: root.position.y + 50 };
      compareInstruction.stepExplanation = `${value} < ${root.value}, insert left`;
      if (root.left) {
        compareInstruction.goTo = root.left.id;
      }
      steps.push(compareInstruction);

      root.left = this.doAddValue(
        value,
        root.left,
        newPos,
        newGap,
        root,
        steps
      ).newRoot;
    } else {
      steps.push({
        type: 'value_found',
        id: root.id,
        stepExplanation: `${root.value} found, nothing added`
      })
    }

    let leftHeight = root.left ? root.left.height : -1;
    let rightHeight = root.right ? root.right.height : -1;
    root.height = Math.max(leftHeight, rightHeight) + 1;
    let rotationInstruction = null;

    let newRoot = root;
    if (leftHeight - rightHeight > 1) {
      if (root.left && value > root.left.value) {
        this.handleLeftRotation(root.left, root, gap / 2, steps)
      }
      newRoot = this.handleRightRotation(root, parent, gap, steps)!;
    } else if (leftHeight - rightHeight < -1) {
      if (root.right && value < root.right.value) {
        this.handleRightRotation(root.right, root, gap / 2, steps)
      }
      newRoot = this.handleLeftRotation(root, parent, gap, steps)!;
    }

    return {
      newRoot: newRoot,
      rotationInstruction: rotationInstruction
    };
  }

  private handleLeftRotation(root: TreeNode, receiver: TreeNode, gap: number, steps: Instruction[]) {
    if (!root) return;
    if (!root.right) return;

    let rot = this.rotateLeft(root, steps) as RotationInstruction;
    // handle add link instructions regarding parent of root

    this.reattachToReceiver(rot, receiver);
    rot.n2!.position = {...rot.n1!.position};
    this.recalculatePositions(rot.n2, rot.n2!.position, gap, rot.nodeMoveMent);
    return rot.n2;
  }

  private handleRightRotation(root: TreeNode, receiver: TreeNode, gap: number, steps: Instruction[]) {
    if (!root) return;
    if (!root.left) return;
    let rot = this.rotateRight(root, steps) as RotationInstruction;
    // handle add link instructions regarding parent of root
    this.reattachToReceiver(rot, receiver);
    rot.n2!.position = {...rot.n1!.position};
    this.recalculatePositions(rot.n2, rot.n2!.position, gap, rot.nodeMoveMent);
    return rot.n2;
  }

  private reattachToReceiver(rotationInstruction: RotationInstruction, receiver: TreeNode) {
    let inst = rotationInstruction;
    if (!inst) return;
    inst.n2!.parent = receiver;
    if (!receiver) return;
    let rcvId = receiver.id;

    inst.linksToRemove.push(`${rcvId}-${inst.n1!.id}`);
    inst.linksToAdd.push(`${rcvId}-${inst.n2!.id}`);
    
    if (receiver.left == inst.n1) {
      receiver.left = inst.n2
    } else if (receiver.right == inst.n1) {
      receiver.right = inst.n2
    }
    this.recalculateHeights(receiver);
  }

  /**
   * recalculate the position of all nodes descending from root
   * add the 'moveNode' instructions
   * return the new root
   * @param root
   * @param currWidth 
   */
  private rotateRight(root: TreeNode, steps: Instruction[]): RotationInstruction | null {
    if (!root) return null;
    if (!root.left) return null;
    let rotationInstruction: RotationInstruction = {
      type: "rotate",
      linksToRemove: [],
      linksToAdd: [],
      nodeMoveMent: [],
      stepExplanation: "",
      n1: root,
      n2: root.left
    }

    let n1 = root;
    let n2 = root.left;
    let b = n2.right;
    rotationInstruction.linksToRemove.push(`${n1.id}-${n2.id}`)
    if (b) {
      rotationInstruction.linksToRemove.push(`${n2.id}-${b.id}`)
    }

    n1.left = b;
    if (b) {
      b.parent = n1;
    }

    n2.right = n1;
    n1.parent = n2;

    this.recalculateHeights(n1);
    this.recalculateHeights(n2);

    rotationInstruction.linksToAdd.push(`${n2.id}-${n1.id}`)
    if (b) {
      rotationInstruction.linksToAdd.push(`${n1.id}-${b.id}`)
    }
    rotationInstruction.stepExplanation = `rotate right, bringing ${n2.value} to ${n1.value}`
    // this.recalculatePositions(n2, root.position, gap, rotationInstruction.nodeMoveMent)
    steps.push(rotationInstruction)
    return rotationInstruction
  }

  recalculateHeights(root: N) {
    let lh = root.left ? root.left.height : -1;
    let rh = root.right ? root.right.height : -1;
    root.height = Math.max(lh, rh) + 1;
  }

  /**
   * Adds / removes relevant links only. Does not move the nodes
   * @param root 
   * @param gap 
   * @param steps 
   * @returns 
   */
  private rotateLeft(root: TreeNode, steps: Instruction[]): RotationInstruction | null {
    if (!root) return null
    if (!root.right) return null
    let rotationInstruction: RotationInstruction = {
      type: "rotate",
      linksToRemove: [],
      linksToAdd: [],
      nodeMoveMent: [],
      stepExplanation: "",
      n1: root,
      n2: root.right
    }

    let n1 = root;
    let n2 = root.right;
    let b = n2.left;
    rotationInstruction.linksToRemove.push(`${n1.id}-${n2.id}`)
    if (b) {
      rotationInstruction.linksToRemove.push(`${n2.id}-${b.id}`)
    }

    n1.right = b;
    if (b) {
      b.parent = n1;
    }
    n2.left = n1;
    n1.parent = n2;

    this.recalculateHeights(n1);
    this.recalculateHeights(n2);

    rotationInstruction.linksToAdd.push(`${n2.id}-${n1.id}`)
    if (b) {
      rotationInstruction.linksToAdd.push(`${n1.id}-${b.id}`)
    }
    rotationInstruction.stepExplanation = `rotate left, bringing ${n2.value} to ${n1.value}`
    // this.recalculatePositions(n2, root.position, gap, rotationInstruction.nodeMoveMent)
    steps.push(rotationInstruction)
    return rotationInstruction
  }

  /**
   * recalculate the position of all nodes descending from root
   * add the 'moveNode' instructions
   * return the new root
   * @param root
   * @param currWidth 
   */
  private recalculatePositions(root: TreeNode, pos: Coord, gap: number, steps: MoveNodeInstruction[]) {
    if (!root) return;
    // console.log(`recalculating for ${root.value}`)
    root.position = {...pos}
    steps.push({
      type: "move_node",
      id: root.id,
      to: pos,
      stepExplanation: undefined
    })

    let newGap = gap / 2;
    // console.log(root.position)
    let newPosLeft = {x: root.position.x - newGap, y: root.position.y + 50};
    // console.log(newPosLeft)
    let newPosRight = {x: root.position.x + newGap, y: root.position.y + 50};
    // console.log(newPosRight)
    this.recalculatePositions(root.left, newPosLeft, newGap, steps);
    this.recalculatePositions(root.right, newPosRight, newGap, steps);

  } 

  private addValue(value: number, steps: Instruction[]) {
    // console.log('value added: ' + value)
    this.root = this.doAddValue(
      value,
      this.root,
      { x: 0, y: 0 },
      this.HALFWIDTH,
      null,
      steps
    ).newRoot;
    // console.log('traversing...')
    // this.traverse()
  }

  public insertValues(values: number[]) {
    let commands: Command[] = [];
    for (let value of values) {
      let newCommand: Command = {
        name: "INSERT " + String(value),
        steps: [],
      };
      this.addValue(value, newCommand.steps);
      commands.push(newCommand);
    }
    return commands;
  }

  public doDetectCrowding(root: TreeNode): boolean {
    if (!root) {
      return false;
    }

    if (root.right && root.left) {
      if (root.right.position.x - root.left.position.x < MINWIDTH) {
        return true;
      }
    }

    if (this.doDetectCrowding(root.left)) return true;
    if (this.doDetectCrowding(root.right)) return true;
    return false;
  }

  public detectCrowding() {
    return this.doDetectCrowding(this.root);
  }

  private doTraverse(root: TreeNode) {
    if (!root) return;
    console.log(root);
    this.doTraverse(root.left);
    this.doTraverse(root.right);
  }

  public traverse() {
    this.doTraverse(this.root);
  }
}
