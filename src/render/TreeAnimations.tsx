import {
  CompareWithInstruction,
  CreateNodeInstruction,
  RotationInstruction,
  ValueFoundInstruction,
} from "../BinaryTree";
import { DrawLineAnimation, ExpandingCircleAnimation } from "./ElementaryAnimations";
import { Link, TreeNode } from "./TreeObjects";
import { ANIMATIONTIME, Coord, DT, NODERADIUS, RefObj, add, dotProduct, length2, mult, normalize, subtract } from "../common";
import { Animation } from './ElementaryAnimations'
import { cloneToRenderArrays, findLink, getTreeNode } from "../processes/common";
import { RenderObject } from "./render";

export abstract class TreeAnimation extends Animation {
  abstract skip(): void;
  abstract running: boolean;
}

export class CompareWithAnimation extends TreeAnimation {
  running: boolean = false;
  instruction: CompareWithInstruction;
  toRender1: RefObj;
  toRender2: RefObj;
  node: TreeNode;
  drawLineAnimation: DrawLineAnimation | undefined;

  constructor(
    instruction: CompareWithInstruction,
    toRender1: RefObj,
    toRender2: RefObj
  ) {
    super();
    this.instruction = instruction;
    this.toRender1 = toRender1;
    this.toRender2 = toRender2;
    this.node = this.getTreeNode(this.instruction.id);
    if (this.instruction.goTo) {
      let fromPos = { ...this.getTreeNode(this.instruction.id).position };
      let toPos = { ...this.getTreeNode(this.instruction.goTo).position };
      this.drawLineAnimation = new DrawLineAnimation(
        fromPos,
        toPos,
        this.toRender1,
        4,
        "orange",
        ANIMATIONTIME
      );
    }
  }

  cancelled: boolean = false;
  cancel(): void {
    this.cancelled = true;
    this.node.cancelGlow();
    this.drawLineAnimation?.cancel();
  }

  skip(): void {
    this.cancel();
  }

  run() {
    return new Promise<void>(async (resolve) => {
      this.running = true;
      await this.node.glow();
      if (this.cancelled) {
        this.running = false;
        resolve();
        return;
      }
      if (this.instruction.goTo) {
        await this.drawLineAnimation?.run();
      }
      this.running = false;
      resolve();
    });
  }

  getTreeNode(id: string) {
    return this.toRender2.current.find(
      (n) => n instanceof TreeNode && n.id == id
    ) as TreeNode;
  }
}

export class ValueFoundAnimation extends TreeAnimation {

  node: TreeNode
  instruction: ValueFoundInstruction
  toRender1: RefObj;
  toRender2: RefObj;
  constructor(instruction: ValueFoundInstruction, toRender1: RefObj, toRender2: RefObj) {
    super();
    this.toRender1 = toRender1;
    this.toRender2 = toRender2;
    this.node = this.getTreeNode(instruction.id);
    this.instruction = instruction;

  }

  skip(): void {
    this.cancel()
  }

  running: boolean = false;
  cancel(): void {
    this.node.cancelGlow()
  }
  
  run(): Promise<void> {
    return new Promise<void>(async (resolve) => {
      this.running = true;
      await this.node.glow();
      this.running = false;
      resolve();
    })
  }

  getTreeNode(id: string) {
    return this.toRender2.current.find(
      (n) => n instanceof TreeNode && n.id == id
    ) as TreeNode;
  }
  
}

export class CreateNodeAnimation extends TreeAnimation {
  running: boolean = false;
  instruction: CreateNodeInstruction;
  toRender1: RefObj;
  toRender2: RefObj;
  animation1: DrawLineAnimation | undefined;
  animation2: ExpandingCircleAnimation;
  link: Link | undefined;
  newNode: TreeNode;

  constructor(
    instruction: CreateNodeInstruction,
    toRender1: RefObj,
    toRender2: RefObj
  ) {
    super();
    this.instruction = instruction;
    this.toRender1 = toRender1;
    this.toRender2 = toRender2;
    if (this.instruction.attatchedTo) {
      let fromPos = {
        ...this.getTreeNode(this.instruction.attatchedTo).position,
      };
      let toPos = this.instruction.position;
      this.animation1 = new DrawLineAnimation(
        fromPos,
        toPos,
        this.toRender1,
        4,
        "grey",
        ANIMATIONTIME
      );
      this.link = new Link(
        this.getTreeNode(this.instruction.attatchedTo),
        toPos
      );
    }
    this.animation2 = new ExpandingCircleAnimation(
      this.toRender2,
      this.instruction.position,
      NODERADIUS,
      "grey",
      ANIMATIONTIME * 0.5
    );
    this.newNode = new TreeNode(
      instruction.id,
      instruction.position,
      instruction.value
    );
    if (this.link) this.link.setN2(this.newNode);
  }

  skip(): void {
    this.cancel();
    this.newNode = new TreeNode(
      this.instruction.id,
      this.instruction.position,
      this.instruction.value
    );
    this.link = new Link(
      this.getTreeNode(this.instruction.attatchedTo),
      this.newNode
    );
    this.toRender1.current.push(this.link);
    this.toRender2.current.push(this.newNode);
  }

  cancelled: boolean = false;
  cancel(): void {
    this.cancelled = true;
    this.animation1?.cancel();
    this.animation2.cancel();
  }

  removeObjects() {
    this.toRender1.current = this.toRender1.current.filter(
      (o) => o != this.link
    );
    this.toRender2.current = this.toRender2.current.filter(
      (o) => o != this.newNode
    );
  }

  run() {
    return new Promise<void>(async (resolve) => {
      this.running = true;
      if (this.animation1) {
        await this.animation1.run();
        this.toRender1.current.push(this.link!);
      }
      if (this.cancelled) {
        this.running = false;
        this.removeObjects();
        resolve();
        return;
      }

      await this.animation2.run();
      this.toRender2.current.push(this.newNode);
      if (this.cancelled) {
        this.running = false;
        this.removeObjects();
        resolve();
        return;
      }
      this.running = false;
      resolve();
    });
  }

  getTreeNode(id: string) {
    return this.toRender2.current.find(
      (n) => n instanceof TreeNode && n.id == id
    ) as TreeNode;
  }
}

export class MoveNodeAnimation extends TreeAnimation {

  running: boolean = false;
  toRender!: RefObj;
  to: Coord;
  from: Coord;
  increment: number;
  direction: { x: number; y: number };
  animationId!: number;
  node: TreeNode;

  /**
   *
   * @param from
   * @param to
   * @param toRender
   * @param lineWidth
   * @param strokeStyle
   * @param time time in seconds for animation to finish
   */
  constructor(to: Coord, node: TreeNode, time: number) {
    super();
    this.from = node.position;
    this.to = to;
    this.node = node;
    let distance = Math.sqrt(length2(subtract(this.to, this.from)));
    this.increment = (distance * (DT / 1000)) / time;
    this.direction = normalize(subtract(this.to, this.from));
  }

  skip(): void {
    this.cancel()
    this.node.position = {...this.to}
  }

  cancelled: boolean = false;
  cancel(): void {
    this.cancelled = true;
    this.node.position = {...this.from}
  }

  run() {
    return new Promise<void>((resolve) => {
      this.running = true;
      this.animationId = setInterval(() => {
        if (this.cancelled) {
          clearInterval(this.animationId);
          this.running = false;
          resolve();
          return;
        }

        this.node.position = add(
          this.node.position,
          mult(this.direction, this.increment)
        );
        let dp = dotProduct(
          subtract(this.to, this.node.position),
          this.direction
        );
        if (dp <= 0) {
          // passed the destination
          this.running = false;
          clearInterval(this.animationId);
          resolve();
        }
      }, DT);
    });
  }
}

export class RotateAnimation extends TreeAnimation {
  running: boolean = false;
  instruction: RotationInstruction
  toRender1: RefObj
  toRender2: RefObj

  // save what the arrays were like so we can revert back upon cancellation
  toRender1_s: RenderObject[]
  toRender2_s: RenderObject[]

  toRender1_a: RenderObject[];
  toRender2_a: RenderObject[];

  linksToRemove: Link[]
  linksToAdd: Link[]

  movementAnimations: MoveNodeAnimation[]

  constructor(instruction: RotationInstruction, toRender1: RefObj, toRender2: RefObj) {
    super();
    this.instruction = instruction;
    this.toRender1 = toRender1;
    this.toRender2 = toRender2;

    // store save
    let res = cloneToRenderArrays(toRender1.current, toRender2.current);
    this.toRender1_s = res.newToRender1;
    this.toRender2_s = res.newToRender2;

    // store what render arrays will look like after the animations
    res = cloneToRenderArrays(toRender1.current, toRender2.current);
    this.toRender1_a = res.newToRender1;
    this.toRender2_a = res.newToRender2;

    this.linksToRemove = [];
    for (let linkS of instruction.linksToRemove) {
      let [n1Id, n2Id] = linkS.split('-');
      let link = findLink(n1Id, n2Id, toRender1.current) as Link;
      this.linksToRemove.push(link);

      // store future
      let link_a = findLink(n1Id, n2Id, this.toRender1_a) as Link;
      this.toRender1_a = this.toRender1_a.filter(o => o != link_a);
    }

    this.linksToAdd = [];
    for (let linkS of instruction.linksToAdd) {
      let [n1Id, n2Id] = linkS.split('-')
      let n1 = getTreeNode(n1Id, this.toRender2.current)
      let n2 = getTreeNode(n2Id, this.toRender2.current)
      this.linksToAdd.push(new Link(n1, n2));

      // store future
      let n1_a = getTreeNode(n1Id, this.toRender2_a);
      let n2_a = getTreeNode(n2Id, this.toRender2_a)
      this.toRender1_a.push(new Link(n1_a, n2_a));
    }

    this.movementAnimations = [];
    for (let mi of instruction.nodeMoveMent) {
      this.movementAnimations.push(
        new MoveNodeAnimation(
          {...mi.to}, 
          getTreeNode(mi.id, this.toRender2.current),
          ANIMATIONTIME)
      )

      // console.log(this.toRender2_a, mi.id)
      let tn = getTreeNode(mi.id, this.toRender2_a);
      tn.position = {...mi.to}
    }
  }

  skip(): void {
    this.cancel();
    this.toRender1.current = this.toRender1_a
    this.toRender2.current = this.toRender2_a
  }

  cancelled = false;
  cancel(): void {
    this.cancelled = true;
    for (let a of this.movementAnimations) {
      a.cancel()
    }
    this.toRender1.current = this.toRender1_s;
    this.toRender2.current = this.toRender2_s;
  }

  run(): Promise<void> {
    return new Promise<void>(async (resolve) => {
      this.running = true;
      for (let link of this.linksToRemove) {
        this.toRender1.current = this.toRender1.current.filter(o => o != link);
      }
      for (let link of this.linksToAdd) {
        this.toRender1.current.push(link);
      }

      let promises: Promise<void>[] = []
      for (let movementAnimation of this.movementAnimations) {
        promises.push(movementAnimation.run());
      }
      await Promise.all(promises)
      this.running = false;
      resolve();
    })
  }
  
}