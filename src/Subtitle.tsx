import { useState } from "react";
import './Subtitle.css'

export interface SubtitleFuncs {
  setSubtitleP: (value: string) => void;
}

interface Props {
  subtitleFuncs: SubtitleFuncs;
}

export default function Subtitle({subtitleFuncs}: Props) {
  const [subtitle, setSubtitle] = useState('command will be shown here')

  function setSubtitleP(value: string) {
    setSubtitle(value)
  }
  subtitleFuncs.setSubtitleP = setSubtitleP;

  return (
    <>
    <div className="subtitle">
        {subtitle}
    </div>
    </>
  )
}