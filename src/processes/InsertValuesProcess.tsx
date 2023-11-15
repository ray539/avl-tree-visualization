import {
  BinaryTree,
  Command,
  CompareWithInstruction,
  CreateNodeInstruction,
  Instruction,
  RotationInstruction,
  ValueFoundInstruction,
} from "../BinaryTree";
import { BottomBarFuncs } from "../BottomBar";
import { RightMenuFuncs } from "../RightMenu";
import {
  Pointer,
  Process,
  calculateCompletionPercentage,
  cloneToRenderArrays,
  comparePointers,
  decrementPointer,
  getCommandLengths,
  getInstructionState,
  incrementPointer,
  pointerAtEnd,
} from "./common";
import {
  CompareWithAnimation,
  CreateNodeAnimation,
  RotateAnimation,
  TreeAnimation,
  ValueFoundAnimation,
} from "../render/TreeAnimations";
import { RenderObject } from "../render/render";
import { PROGRESSBARWIDTH, RefObj } from "../common";
import { SubtitleFuncs } from "../Subtitle";
import { Command as RMCommand } from '../RightMenu'

/**
 * store state of tree before each command
 */
export interface CommandState {
  commandName: string;
  instructionStates: InstructionState[];
}

/**
 * store state of tree before each instruction
 */
export interface InstructionState {
  btRef: BinaryTree;
  toRender1: RenderObject[];
  toRender2: RenderObject[];
}

export class PointerManager {
  pointer: Pointer;
  furthestPointer: Pointer;
  rightMenuFuncs: RightMenuFuncs;
  commands: Command[]

  constructor(commandIndex: number, stepIndex: number, rightMenuFuncs: RightMenuFuncs, commands: Command[]) {
    this.pointer = {commandIndex: commandIndex, stepIndex: stepIndex}
    this.furthestPointer = {commandIndex: commandIndex, stepIndex: stepIndex};
    this.rightMenuFuncs = rightMenuFuncs;
    this.commands = commands;
    this.rightMenuFuncs.selectStep({...this.pointer})
  }

  set (commandIndex: number, stepIndex: number) {
    this.pointer = {commandIndex: commandIndex, stepIndex: stepIndex}
    this.rightMenuFuncs.selectStep({...this.pointer})
  }

  increment () {
    incrementPointer(this.pointer, this.commands);
    if (comparePointers(this.pointer, this.furthestPointer) > 0) {
      this.furthestPointer = {...this.pointer};
    }
    this.rightMenuFuncs.selectStep({...this.pointer})
  }

  /**
   * increment without updating selection arrow
   */
  incrementNoUpdate() {
    incrementPointer(this.pointer, this.commands);
    if (comparePointers(this.pointer, this.furthestPointer) > 0) {
      this.furthestPointer = {...this.pointer};
    }
  }

  decrement() {
    decrementPointer(this.pointer, this.commands);
    this.rightMenuFuncs.selectStep({...this.pointer});
  }

  decrementNoUpdate() {
    decrementPointer(this.pointer, this.commands);
  }

  /**
   * whether the pointer is currently the furthest it's been
   */
  atFurthest() {
    return this.pointer.commandIndex == this.furthestPointer.commandIndex && this.pointer.stepIndex == this.furthestPointer.stepIndex;
  }

  /**
   * use after a series of calls to 'incrementNoUpdate()'
   */
  update() {
    this.rightMenuFuncs.selectStep({...this.pointer})
  }

  atEnd() {
    return pointerAtEnd(this.pointer, this.commands)
  }

  getInstruction() {
    return this.commands[this.pointer.commandIndex].steps[this.pointer.stepIndex];
  }

  getCommandIndex = () => this.pointer.commandIndex;
  getStepIndex = () => this.pointer.stepIndex;
  getPointer = () => this.pointer;
}

/**
 * encapsulates process of node insertion
 * takes in received instructions
 *
 */
export class InsertValueProcess extends Process {
  currentAnimation: TreeAnimation | undefined;
  receivedCommands: Command[];
  toRender1: RefObj;
  toRender2: RefObj;
  pointerM: PointerManager;
  rightMenuFuncs: RightMenuFuncs;
  commandStates: CommandState[];
  // isExplanationsComplete: boolean;
  bottomBarFuncs: BottomBarFuncs;
  subtitleFuncs: SubtitleFuncs;
  btRef: BinaryTree;


  constructor(
    values: number[],
    toRender1: RefObj,
    toRender2: RefObj,
    btRef: BinaryTree,
    rightMenuFuncs: RightMenuFuncs,
    bottomBarFuncs: BottomBarFuncs,
    subtitleFuncs: SubtitleFuncs
  ) {
    super();
    this.btRef = btRef;
    this.receivedCommands = this.btRef.insertValues(values);
    this.toRender1 = toRender1;
    this.toRender2 = toRender2;
    this.rightMenuFuncs = rightMenuFuncs;
    this.bottomBarFuncs = bottomBarFuncs;
    this.subtitleFuncs = subtitleFuncs;
    this.pointerM = new PointerManager(0, 0, rightMenuFuncs, this.receivedCommands)
    this.commandStates = [];
    // this.isExplanationsComplete = false;
  }

  getAnimation(
    _instruction: Instruction
  ): CreateNodeAnimation | CompareWithAnimation | ValueFoundAnimation | RotateAnimation {
    if (_instruction.type == "create_node") {
      let instruction = _instruction as CreateNodeInstruction;
      return new CreateNodeAnimation(
        instruction,
        this.toRender1,
        this.toRender2
      );
    } else if (_instruction.type == 'compare_with') {
      let instruction = _instruction as CompareWithInstruction;
      return new CompareWithAnimation(
        instruction,
        this.toRender1,
        this.toRender2
      );
    } else if (_instruction.type == 'value_found') {
      let instruction = _instruction as ValueFoundInstruction;
      return new ValueFoundAnimation (
        instruction,
        this.toRender1,
        this.toRender2
      )
    } else {
      let instruction = _instruction as RotationInstruction;
      return new RotateAnimation (
        instruction,
        this.toRender1,
        this.toRender2
      )
    }
  }

  existsState() {
    if (this.commandStates[this.pointerM.getCommandIndex()]) {
      if (
        this.commandStates[this.pointerM.getCommandIndex()].instructionStates[
          this.pointerM.getStepIndex()
        ]
      ) {
        return true;
      }
    }
    return false;
  }

  /**
   * add current values of btRef, toRender1, toRender2 to the states array
   */
  saveState() {
    let cmdI = this.pointerM.getCommandIndex();

    if (!this.commandStates[cmdI]) {
      this.commandStates.push({
        commandName: this.receivedCommands[cmdI].name,
        instructionStates: [],
        })
    }

    if (this.existsState()) return;
    let clonedArrs = cloneToRenderArrays(this.toRender1.current, this.toRender2.current)
    this.commandStates[cmdI].instructionStates.push({
      btRef: this.btRef.clone(),
      toRender1: clonedArrs.newToRender1,
      toRender2: clonedArrs.newToRender2
    })

  }

  /**
   * sync right menu steps with the pointer
   * @returns
   */
  syncSteps() {
    if (!this.pointerM.atFurthest()) return;
    let commandLengths = getCommandLengths(this.receivedCommands);
    let numCommands = commandLengths.length
    let rmCommands: RMCommand[] = [];
    let pointer: Pointer = {...this.pointerM.getPointer()}
    if (pointerAtEnd(pointer, this.receivedCommands)) {
      pointer = {commandIndex: numCommands - 1, stepIndex: commandLengths[numCommands - 1] - 1}
    }

    // commands for everything up to commandIndex
    for (let i = 0; i < pointer.commandIndex; i++) {
      let rmCommand: RMCommand = {
        name: this.receivedCommands[i].name,
        steps: []
      }
      for (let j = 0; j < commandLengths[i]; j++) {
        rmCommand.steps.push(this.receivedCommands[i].steps[j].stepExplanation)
      }
      rmCommands.push(rmCommand)
    }

    // command at cmdIndex
    let cmdIndex = pointer.commandIndex;
    let stepIndex = pointer.stepIndex
    let rmCommand: RMCommand = {
      name: this.receivedCommands[cmdIndex].name,
      steps: []
    }
    for (let j = 0; j <= stepIndex; j++) {
      rmCommand.steps.push(this.receivedCommands[cmdIndex].steps[j].stepExplanation);
    }
    rmCommands.push(rmCommand)
    this.rightMenuFuncs.setCommandsP(rmCommands)
  }

  loadState(pointer: Pointer) {
    let instructionState = getInstructionState(pointer, this.commandStates);
    let clonedArrs = cloneToRenderArrays(instructionState.toRender1, instructionState.toRender2)

    this.btRef = instructionState.btRef.clone();
    this.toRender1.current = clonedArrs.newToRender1;
    this.toRender2.current = clonedArrs.newToRender2;
  }

  skipStep() {
    this.killSession();
    let cmdI = this.pointerM.getCommandIndex();
    if (cmdI >= this.receivedCommands.length) return;
    while (this.pointerM.getCommandIndex() < cmdI + 1) {
      let instruction = this.pointerM.getInstruction();
      let animation = this.getAnimation(instruction);
      this.saveState();
      animation.skip();
      this.pointerM.incrementNoUpdate();
    }
    this.updateProgressBar();
    this.pointerM.update();
    this.syncSteps();
    if (!this.paused) this.run();
  }

  goBackInstruction() {
    this.killSession();
    this.pointerM.decrement();
    this.updateProgressBar();
    this.loadState(this.pointerM.getPointer())
    if (!this.paused) this.run();
  }

  goForwardInstruction() {
    if (this.pointerM.atEnd()) return;
    this.killSession();
    let instruction = this.pointerM.getInstruction();
    let animation = this.getAnimation(instruction);
    this.saveState();
    animation.skip();
    this.pointerM.increment();
    this.syncSteps();
    this.updateProgressBar();
    if (!this.paused) this.run();
  }

  /**
   * skip to the end of the received instructions
   */
  skipAll() {
    this.killSession();
    while (!this.pointerM.atEnd()) {
      let instruction = this.pointerM.getInstruction()
      let animation = this.getAnimation(instruction);
      this.saveState();
      animation.skip();
      this.pointerM.incrementNoUpdate()
      console.log(this.pointerM.getPointer())
    }
    
    this.updateProgressBar();
    this.syncSteps();
    this.pointerM.update();
    if (!this.paused) this.run();
  }

  async jumpToStep(pointer: Pointer) {
    this.killSession();
    this.pointerM.set(pointer.commandIndex, pointer.stepIndex);
    this.updateProgressBar();
    this.loadState(this.pointerM.getPointer())
    if (!this.paused) this.run();
  }

  updateProgressBar() {
    let percentage = calculateCompletionPercentage(
      this.pointerM.pointer,
      this.receivedCommands
    );
    if (percentage > 1) percentage = 1;
    this.bottomBarFuncs.setPBarWidthP(percentage * PROGRESSBARWIDTH);
  }

  paused = false;
  pause(): void {
    console.log('paused')
    this.killSession();
    this.paused = true;
  }

  killed = false;
  killSession() {
    if (!this.currentAnimation?.running) return;
    this.currentAnimation?.cancel();
    this.killed = true;
  }

  run(): Promise<void> {
    return new Promise<void>(async (resolve) => {
      this.paused = false;
      while (!this.pointerM.atEnd()) {
        let instruction = this.pointerM.getInstruction()
        this.currentAnimation = this.getAnimation(instruction);
        this.saveState();
        this.syncSteps();
        await this.currentAnimation.run();
        if (this.killed) {
          this.killed = false
          resolve();
          return;
        }
        
        this.updateProgressBar();
        this.pointerM.increment();
      }
      resolve();
    });
  }
}
