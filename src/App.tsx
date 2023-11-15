import { useEffect, useRef, useState } from "react";
import "./App.css";
import { BinaryTree } from "./BinaryTree";
import {Command} from "./RightMenu.tsx"
import SideBar from "./SideBar.tsx";
import BottomBar, { BottomBarFuncs } from "./BottomBar.tsx";
import Canvas, { CanvasFuncs } from "./Canvas.tsx";
import RightMenu, { RightMenuFuncs } from "./RightMenu.tsx";
import Subtitle, { SubtitleFuncs } from "./Subtitle.tsx";
import { Pointer } from "./processes/common.tsx";

export default function App() {
  useEffect(() => {
    let bt = new BinaryTree()
    console.log(bt.insertValues([3,1,2]))
    let bt2 = bt.clone()
    console.log(bt2)
  }, [])

  let canvasFuncs: CanvasFuncs = {
    updateState: function (): void {
      throw new Error("Function not implemented.");
    },
    saveState: function (): void {
      throw new Error("Function not implemented.");
    },
    calculateCompletionPercentage: function (): number | undefined {
      throw new Error("Function not implemented.");
    },
    skipAll: function (): void {
      throw new Error("Function not implemented.");
    },
    skipValue: function (): void {
      throw new Error("Function not implemented.");
    },
    jumpToStep: function (commandIndex: number, stepIndex: number): void {
      throw new Error("Function not implemented.");
    },
    processInsertCommand: function (value: string): void {
      throw new Error("Function not implemented.");
    },
    setPaused: function (paused: boolean): void {
      throw new Error("Function not implemented.");
    },
    goBackInstruction: function (): void {
      throw new Error("Function not implemented.");
    },
    goForwardInstruction: function (): void {
      throw new Error("Function not implemented.");
    }
  };

  let rightMenuFuncs: RightMenuFuncs = {
    addSteps: function (stepStrs: string[], commandIndex: number): void {
      throw new Error("Function not implemented.");
    },
    selectStep: function (pointer: Pointer): void {
      throw new Error("Function not implemented.");
    },
    addCommand: function (commandStr: string): void {
      throw new Error("Function not implemented.");
    },
    setCommandsP: function (newCommands: Command[]): void {
      throw new Error("Function not implemented.");
    },
    clearCommands: function (): void {
      throw new Error("Function not implemented.");
    },
    addStep: function (stepStr: string, commandIndex: number): void {
      throw new Error("Function not implemented.");
    }
  };

  let subtitleFuncs: SubtitleFuncs = {
    setSubtitleP: function (value: string): void {
    }
  }

  let bottomBarFuncs: BottomBarFuncs = {
    setPBarWidthP: function (width: number): void {
      throw new Error("Function not implemented.");
    },
    setIsPausedP: function (paused: boolean): void {
      throw new Error("Function not implemented.");
    }
  }


  return (
    <>
      <header
        style={{
          zIndex: 1,
        }}
      >
        <div>AVL TREE VISUALIZATION</div>
        <Subtitle subtitleFuncs={subtitleFuncs} />
      </header>
      
      <SideBar canvasFuncs={canvasFuncs}></SideBar>
      <Canvas
        canvasFuncs={canvasFuncs}
        rightMenuFuncs={rightMenuFuncs}
        subtitleFuncs={subtitleFuncs}
        bottomBarFuncs={bottomBarFuncs}      
      ></Canvas>
      <BottomBar bottomBarFuncs={bottomBarFuncs} canvasFuncs={canvasFuncs}></BottomBar>
      <RightMenu
        rightMenuFuncs={rightMenuFuncs}
        canvasFuncs={canvasFuncs}
      ></RightMenu>
    </>
  );
}
