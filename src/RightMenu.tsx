import { useEffect, useRef, useState } from 'react';
import rightArrowTall from './assets/right-arrow-tall.png'
import './RightMenu.css'
import { flushSync } from 'react-dom';
import { CanvasFuncs } from './Canvas'
import pointer from './assets/pointer.png'
import { Pointer } from './processes/common';

export interface RightMenuFuncs {
  addSteps: (stepStrs: string[], commandIndex: number) => void;
  selectStep: (pointer: Pointer) => void;
  addCommand: (commandStr: string) => void;
  setCommandsP: (newCommands: Command[]) => void;
  clearCommands: () => void;
  /**
   * 
   * add step to existing command
   */
  addStep: (stepStr: string, commandIndex: number) => void
}

interface Props {
  rightMenuFuncs: RightMenuFuncs
  canvasFuncs: CanvasFuncs
}

export interface Command {
  name: string,
  steps: string[]
}

export default function RightMenu({rightMenuFuncs, canvasFuncs}: Props) {
  let listRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    listRef.current?.scrollTo(0, listRef.current.scrollHeight)
  }, [])

  const [showList, setShowList] = useState(false);
  let transform = showList ? '' : 'rotate(180deg)';
  const [commands, setCommands] = useState<Command[]>([{
    name: 'step explanations show up here',
    steps: []
  }])

  function addCommand(commandStr: string) {
    flushSync(() => {
      let newCommands: Command[] = JSON.parse(JSON.stringify(commands))
      let command: Command = {
        name: commandStr,
        steps: []
      }
      newCommands.push(command)
      setCommands(newCommands)
    })
    listRef.current?.scrollTo(0, listRef.current.scrollHeight)
  }
  rightMenuFuncs.addCommand = addCommand

  function addStep(stepStr: string, commandIndex: number) {
    flushSync(() => {
      let newCommands: Command[] = JSON.parse(JSON.stringify(commands))
      newCommands[commandIndex].steps.push(stepStr)
      setCommands(newCommands)
    })
    listRef.current?.scrollTo(0, listRef.current.scrollHeight)
  }
  rightMenuFuncs.addStep = addStep;

  function addSteps(stepStrs: string[], commandIndex: number) {
    flushSync(() => {
      let newCommands: Command[] = JSON.parse(JSON.stringify(commands))
      newCommands[commandIndex].steps.concat(stepStrs)
      setCommands(newCommands)
    })
    listRef.current?.scrollTo(0, listRef.current.scrollHeight)
  }
  rightMenuFuncs.addSteps = addSteps;

  function setCommandsP(newCommands: Command[]) {
    flushSync(() => {
      setCommands(newCommands)
    })
    listRef.current?.scrollTo(0, listRef.current.scrollHeight)
  }
  rightMenuFuncs.setCommandsP = setCommandsP;

  function clearCommands() {
    flushSync(() => {
      setCommands([])
    })
  }
  rightMenuFuncs.clearCommands = clearCommands;

  const [selectedStep, setSelectedStep] = useState<Pointer>({
    commandIndex: -1,
    stepIndex: -1
  })

  function selectStep(pointer: Pointer) {
    setSelectedStep({...pointer})
  }
  rightMenuFuncs.selectStep = selectStep

  interface ListItem {
    clickable: boolean,
    commandIndex: number,
    stepIndex: number,
    label: string,
    indent: number,
    isPointedAt: boolean
  }
  function getFlattenedCommands() {
    let res: ListItem[] = []
    let i = 0
    for (let command of commands) {
      res.push({
        clickable: false,
        commandIndex: i,
        stepIndex: -1,
        label: command.name,
        indent: 0,
        isPointedAt: false
      })

      let j = 0
      for (let step of command.steps) {
        res.push({
          clickable: true,
          commandIndex: i,
          stepIndex: j,
          label: step,
          indent: 1,
          isPointedAt: i == selectedStep.commandIndex && j == selectedStep.stepIndex
        })
        j++
      }
      i++
    }
    return res
  }

  return(
    <div className="wrapper">
      {
        showList &&
        <div className="action-list-wrapper">
        <div className="action-list" ref={listRef}>
          {getFlattenedCommands().map((item) => 
          <div
            className="action-list-item"
            onClick={item.clickable ? () => canvasFuncs.jumpToStep(item.commandIndex, item.stepIndex) : () => {}}
            key={crypto.randomUUID()}
            style={{
              marginLeft: item.indent ? '1em' : 5,
              backgroundColor: item.isPointedAt ? 'blanchedalmond' : ''
            }}
          >
          {item.label} {item.isPointedAt ? <img src={pointer}></img> : <div className='image-filler'></div>}
          </div>)}
        </div>
      </div>
      }

      <div className="arrow-block"
        onClick={() => setShowList(!showList)}
      
      >
        <img src={rightArrowTall} style={{
          height: 75,
          transform: transform
        }}></img>
      </div>
    </div>

  )
}