import './BottomBar.css'
import stepLeftPng from './assets/step-left.png'
import playButtonPng from './assets/play-button.png'
import pauseButtonPng from './assets/pause-button.png'
import stepRightPng from './assets/step-right.png'
import { CanvasFuncs } from './Canvas'
import { useState } from 'react'


interface ProgressBarProps {
  width: number
}

function ProgressBar({width}: ProgressBarProps) {
  
  return (
    <div className="progress-bar-wrapper">
      <div className="progress-bar-bar" style={{
        width: width
      }}></div>
    </div>
  )
}

export interface BottomBarFuncs {
  setIsPausedP: (paused: boolean) => void
  setPBarWidthP: (width: number) => void;
}

interface Props {
  bottomBarFuncs: BottomBarFuncs;
  canvasFuncs: CanvasFuncs
}


export default function BottomBar({bottomBarFuncs, canvasFuncs}: Props) {

  const [pbarWidth, setPBarWidth] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  function setPBarWidthP(width: number) {
    setPBarWidth(width);
  }
  bottomBarFuncs.setPBarWidthP = setPBarWidthP

  function setIsPausedP(paused: boolean) {
    setIsPaused(paused)
  }
  bottomBarFuncs.setIsPausedP = setIsPausedP

  return (
    <div className="bottom-bar">
      <img
        src={stepLeftPng}
        onClick={() => canvasFuncs.goBackInstruction()}
      ></img>
      <img 
        src={isPaused ? playButtonPng : pauseButtonPng}
        onClick={() => {
          let newIsPaused = !isPaused;
          setIsPaused(newIsPaused)
          canvasFuncs.setPaused(newIsPaused);
        }}
      ></img>
      <img
        src={stepRightPng}
        onClick={() => canvasFuncs.goForwardInstruction()}  
      ></img>
      <ProgressBar width={pbarWidth}></ProgressBar>
      <button className="skip-button" onClick={() => canvasFuncs.skipValue()}>skip value</button>
      <button className="skip-button" onClick={() => canvasFuncs.skipAll()}>skip values</button>
    </div>
  )
}