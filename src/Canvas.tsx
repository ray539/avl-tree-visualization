import { useEffect, useRef } from "react";
import {
  CANVASWIDTH,
  Camera,
  Coord,
  MouseData,
  add,
  subtract,
} from "./common";
import { RightMenuFuncs } from "./RightMenu";
import { SubtitleFuncs } from "./Subtitle";
import { BottomBarFuncs } from "./BottomBar";
import { Process } from "./processes/common";
import { InsertValueProcess } from "./processes/InsertValuesProcess";
import { RenderObject, screenToWorld } from "./render/render";
import { BinaryTree } from "./BinaryTree";

let camera: Camera = {
  x: -CANVASWIDTH / 2,
  y: -50,
  r: 1,
};

function zoom(mid: Coord, r2: number) {
  let xm = mid.x;
  let xc = camera.x;
  let r1 = camera.r;
  let xres = xm + ((xc - xm) * r1) / r2;

  let ym = mid.y;
  let yc = camera.y;
  let yres = ym + ((yc - ym) * r1) / r2;

  camera.x = xres;
  camera.y = yres;
  camera.r = r2;
}

export interface CanvasFuncs {
  goBackInstruction: () => void;
  goForwardInstruction: () => void;
  setPaused: (paused: boolean) => void;
  updateState: () => void;
  saveState: () => void;
  calculateCompletionPercentage: () => number | undefined;
  skipAll: () => void;
  skipValue: () => void;
  jumpToStep: (commandIndex: number, stepIndex: number) => void;
  processInsertCommand: (value: string) => void;
}

interface Props {
  canvasFuncs: CanvasFuncs;
  rightMenuFuncs: RightMenuFuncs;
  subtitleFuncs: SubtitleFuncs;
  bottomBarFuncs: BottomBarFuncs;
}

export default function Canvas({
  canvasFuncs,
  rightMenuFuncs,
  subtitleFuncs,
  bottomBarFuncs,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const toRender1 = useRef<RenderObject[]>([]);
  const toRender2 = useRef<RenderObject[]>([]);
  const mouseRef = useRef<MouseData>({ pos: { x: 0, y: 0 }, drag: false });
  const zoomRef = useRef<number>(1);
  const anchor = useRef<Coord>({ x: 0, y: 0 }); // when drag, fix vector from mousePos to camera

  const currentProcess = useRef<Process>();
  const btRef = useRef<BinaryTree>(new BinaryTree);

  function processInsertCommand(_values: string) {
    let values = _values.split(",").filter(v => v).map((v) => Number(v));
    currentProcess.current?.skipAll();
    subtitleFuncs.setSubtitleP("insert values " + values.toString());
    currentProcess.current = new InsertValueProcess(values, toRender1, toRender2, btRef.current, rightMenuFuncs, bottomBarFuncs, subtitleFuncs);
    bottomBarFuncs.setIsPausedP(false)
    bottomBarFuncs.setPBarWidthP(0)
    currentProcess.current.run();
  }
  canvasFuncs.processInsertCommand = processInsertCommand;

  function jumpToStep(commandIndex: number, stepIndex: number) {;
    currentProcess.current?.jumpToStep({commandIndex: commandIndex, stepIndex: stepIndex});
  }
  canvasFuncs.jumpToStep = jumpToStep;

  function skipValue() {
    currentProcess.current?.skipStep();
  }
  canvasFuncs.skipValue = skipValue;

  function setPaused(paused: boolean) {
    if (paused) {
      currentProcess.current?.pause();
    } else {
      currentProcess.current?.run();
    }
  }
  canvasFuncs.setPaused = setPaused;

  function skipAll() {
    currentProcess.current?.skipAll();
  }
  canvasFuncs.skipAll = skipAll;

  function goBackInstruction() {
    currentProcess.current?.goBackInstruction()
  }
  canvasFuncs.goBackInstruction = goBackInstruction;
  

  function goForwardInstruction() {
    currentProcess.current?.goForwardInstruction()
  }
  canvasFuncs.goForwardInstruction = goForwardInstruction;

  function render(c: CanvasRenderingContext2D) {
    c.canvas.width = window.innerWidth;
    c.canvas.height = window.innerHeight;
    c.clearRect(0, 0, window.innerWidth, window.innerHeight);
    for (let obj of toRender1.current) {
      obj.render(camera, c);
    }
    for (let obj of toRender2.current) {
      obj.render(camera, c);
    }
    requestAnimationFrame(() => render(c));
  }

  useEffect(() => {
    const canvas = canvasRef.current! as HTMLCanvasElement;
    const c = canvas.getContext("2d") as CanvasRenderingContext2D;
    camera.x = -window.innerWidth / 2;
    camera.y = -100;
    render(c);
  }, []);

  return (
    <>
      <canvas
        ref={canvasRef}
        onMouseMove={(e) => {
          mouseRef.current.pos = { x: e.clientX, y: e.clientY };
          let mousePosW = screenToWorld(mouseRef.current.pos, camera);
          if (mouseRef.current.drag) {
            let mouseToAnchor = subtract(anchor.current, mousePosW);
            let ncameraPos = add({ x: camera.x, y: camera.y }, mouseToAnchor);
            camera.x = ncameraPos.x;
            camera.y = ncameraPos.y;
          }
        }}
        onMouseDown={(e) => {
          if (!(e.nativeEvent.button == 0)) return;
          canvasRef!.current!.style.cursor = "grab";
          mouseRef.current.drag = true;
          anchor.current = screenToWorld(mouseRef.current.pos, camera);
        }}
        onMouseUp={() => {
          canvasRef!.current!.style.cursor = "auto";
          mouseRef.current.drag = false;
        }}
        onWheel={(e) => {
          if (e.deltaY > 0) {
            zoomRef.current -= 0.01;
            zoom(screenToWorld(mouseRef.current.pos, camera), zoomRef.current);
          } else if (e.deltaY < 0) {
            zoomRef.current += 0.01;
            zoom(screenToWorld(mouseRef.current.pos, camera), zoomRef.current);
          }
        }}
      ></canvas>
    </>
  );
}
