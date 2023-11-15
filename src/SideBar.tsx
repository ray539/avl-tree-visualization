import { useState } from "react";
import "./SideBar.css";
import { CanvasFuncs } from "./Canvas";

interface Props {
  canvasFuncs: CanvasFuncs;
}

export default function SideBar({ canvasFuncs }: Props) {
  const [showPlus, setShowPlus] = useState(false);
  const [value, setValue] = useState("");

  return (
    <>
      <div className="side-bar">
        <div className="spacer"></div>
        <div className="actions">
          <div className="action-wrapper">
            <div className="icon" onClick={() => setShowPlus(!showPlus)}>
              +
            </div>
            {showPlus && (
              <form
                className="popout"
                onSubmit={(e) => {
                  e.preventDefault()
                  setShowPlus(false);
                  setValue("");
                  canvasFuncs.processInsertCommand(value);
                }}
              >
                <div className="text-area">
                  <label htmlFor="input">insert values</label>
                  <input
                    type="text"
                    id="input"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                  ></input>
                </div>
                <button type="submit">GO</button>
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
