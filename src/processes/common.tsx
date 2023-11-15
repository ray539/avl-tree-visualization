import { Command } from "../BinaryTree";
import { RefObj } from "../common";
import { Link, TreeNode } from "../render/TreeObjects";
import { RenderObject } from "../render/render";
import { CommandState } from "./InsertValuesProcess";

export abstract class Process {
  abstract run(): void;
  abstract pause(): void;
  abstract skipStep(): void;
  abstract skipAll(): void;
  abstract jumpToStep(pointer: Pointer): void;
  abstract goBackInstruction(): void;
  abstract goForwardInstruction(): void;
}

export interface Pointer {
  commandIndex: number;
  stepIndex: number;
}

/**
 * pointer is null
 * @param p
 * @param commands
 * @returns
 */
export function pointerAtEnd(p: Pointer, commands: Command[]) {
  let numCommands = commands.length;
  return p.commandIndex >= numCommands;
}

export function getCommandLengths(commands: Command[]) {
  let lengths = [];
  for (let command of commands) {
    lengths.push(command.steps.length);
  }
  return lengths;
}

/**
 *
 * @param p
 * @param commands
 * @returns true if successfuly incremented
 */
export function incrementPointer(p: Pointer, commands: Command[]) {
  let instructions = commands[p.commandIndex];
  let temp = p.stepIndex + 1;
  if (temp >= instructions.steps.length) {
    p.commandIndex++;
    p.stepIndex = 0;
  } else {
    p.stepIndex++;
  }
  // if (p.commandIndex >= commands.length) {
  //   p.commandIndex = commands.length - 1;
  //   p.stepIndex = commands[commands.length - 1].steps.length - 1;
  // }
}

export function decrementPointer(p: Pointer, commands: Command[]) {
  let temp = p.stepIndex - 1;
  if (temp < 0) {
    p.commandIndex--;
    if (p.commandIndex >= 0) p.stepIndex = commands[p.commandIndex].steps.length - 1;
  } else {
    p.stepIndex--;
  }

  if (p.commandIndex < 0) {
    p.commandIndex = 0;
    p.stepIndex = 0;
  }
}

export function comparePointers(p1: Pointer, p2: Pointer) {
  let d1 = p1.commandIndex - p2.commandIndex;
  if (d1 != 0) return d1;
  return p1.stepIndex - p2.stepIndex;
}

export function getInstruction(p: Pointer, commands: Command[]) {
  return commands[p.commandIndex].steps[p.stepIndex];
}

export function getInstructionState(p: Pointer, commandStates: CommandState[]) {
  return commandStates[p.commandIndex].instructionStates[p.stepIndex];
}

export function getCommandName(p: Pointer, commands: Command[]) {
  return commands[p.commandIndex].name;
}

export function calculateCompletionPercentage(p: Pointer, commands: Command[]) {
  let commandLengths = getCommandLengths(commands);
  let total = commandLengths.reduce( (a, b) => a + b, 0)
  let progress = 0;
  let i;
  for (i = 0; i < p.commandIndex; i++) {
    progress += commandLengths[i]
  }
  progress += p.stepIndex + 1;
  return progress / total;
}

export function getTreeNode(id: string, toRender2: RenderObject[]) {
  return toRender2.find(
    (n) => n instanceof TreeNode && n.id == id
  ) as TreeNode;
}

/**
 * creates deep clone of this.toRender1 and this.toRender2
 */
export function cloneToRenderArrays(toRender1: RenderObject[], toRender2: RenderObject[]) {
  let newToRender1 = []
  let newToRender2 = []

  // clone the nodes
  for (let obj of toRender2) {
    if (obj instanceof TreeNode) {
      newToRender2.push(obj.clone())
    }
  }

  // clone the links
  for (let obj of toRender1) {
    if (obj instanceof Link) {
      let n1Id = getTreeNode(obj.n1.id, newToRender2)
      let n2Id = getTreeNode((obj.n2 as TreeNode).id, newToRender2)
      let newLink = new Link(n1Id, n2Id)
      newToRender1.push(newLink)
    }
  }
  let res = {
    newToRender1: newToRender1,
    newToRender2: newToRender2
  }
  return res;
}

export function findLink(n1Id: string, n2Id: string, toRender1: RenderObject[]) {
  return toRender1.find(l => l instanceof Link && l.n1.id == n1Id && (l.n2 as TreeNode).id == n2Id)
}
