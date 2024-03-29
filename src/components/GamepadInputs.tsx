import React, { useRef, useState } from "react";
import GG_Timeline from "@/components/GG_Timeline";
import { useWindowSize } from "usehooks-ts";
import type { FixedSizeGrid } from "react-window";
import Tooltip from "@mui/material/Tooltip";
import {
  FrameResult,
  LabelLookupCb,
  LookupInfo,
  frameResultsToTimelineFrames,
} from "@/utils/gamepad";
import InputReader from "@/components/InputReader";
import Button from "./Button";
import useComputedFontSize from "@/hooks/useComputedFontSize";
import { TimelineFrame } from "./Timeline";

// TODO this will eventually need to support custom mappings

type Props = {
  lookupCb?: LabelLookupCb;
};

// Looks up a btn label, add's _h for held values, returns fgc btn index for dirs
function getLabelStr(btnLabels: string[], info: LookupInfo) {
  const { btnIdx, held, fgcDir } = info;
  const idxStr = String(btnIdx);
  const heldStr = held ? "_h" : "";
  // Use fgc dir str or lookup btn label and default to btnIdx as a str if out of bounds
  const labelStr = fgcDir ? idxStr : btnLabels[btnIdx] ?? String(btnIdx);
  return `${labelStr}${heldStr}`;
}

function XBOX_btnLookup(info: LookupInfo) {
  const labels = [
    "A",
    "B",
    "X",
    "Y",
    "LB",
    "RB",
    "LT",
    "RT",
    "View",
    "Menu",
    "LS",
    "RS",
  ];
  return getLabelStr(labels, info);
}

function GG_btnLookup(info: LookupInfo) {
  const labels = [
    "K",
    "HS",
    "P",
    "S",
    "RC",
    "D",
    "LT",
    "Dash",
    "View",
    "Menu",
    "LS",
    "RS",
  ];

  return getLabelStr(labels, info);
}

function SF6_btnLookup(info: LookupInfo) {
  const labels = [
    "LK",
    "MK",
    "LP",
    "MP",
    "DR",
    "HP",
    "DP",
    "HK",
    "View",
    "Menu",
    "LS",
    "RS",
  ];

  return getLabelStr(labels, info);
}

const resetFrameIdxs = (frames: FrameResult[]) => {
  // this assumes the frames are in order
  // Get first frameIdx
  const firstIdx = frames[0]?.frameIdx;
  if (firstIdx) {
    // Make frames relative to first frameIdx
    return frames.map((frame) => ({
      ...frame,
      frameIdx: frame.frameIdx - firstIdx,
    }));
  } else {
    return frames;
  }
};

const GamepadInput = (props: Props) => {
  const { lookupCb } = props;
  const winSize = useWindowSize();
  const [results, setResults] = useState<TimelineFrame[][]>([]);
  const [currInputs, setCurrInputs] = useState<TimelineFrame[]>([]);
  const previewGridRef = useRef<FixedSizeGrid<any>>(null);
  const [enabled, setEnabled] = useState<boolean>(false);
  const [controllerConnected, setControllerConnected] =
    useState<boolean>(false);

  const frameW = useComputedFontSize() * 1.25;

  // Default to xbox inputs if no lookup is provided
  // const lookup = lookupCb ?? XBOX_btnLookup;
  const lookup = lookupCb ?? GG_btnLookup;

  let tempResults: FrameResult[] = [];
  let emptyCount = 0;
  let inputReceived = false;

  function frameCb(result: FrameResult): void {
    const { frameIdx, buttons } = result;
    const hasBtns = (buttons?.length ?? -1) > 0;

    const reset = () => {
      tempResults = [];
      inputReceived = false;
      setCurrInputs(
        frameResultsToTimelineFrames(resetFrameIdxs(tempResults), lookup)
      );
    };

    // Only record a frame if it has buttons OR we've already received an input and are still in the accepting inputs range
    if (hasBtns || inputReceived) {
      tempResults.push(result);

      if (hasBtns) {
        // reset timeout counter
        emptyCount = 0;
        // mark these inputs for storage
        inputReceived = true;
      } else {
        // Increate timeout counter
        emptyCount++;
      }

      if (emptyCount > 60) {
        // Store current inputs as a new clip
        // a lot happening in this line, converting to ObjArray, setting frameIdx values realtive to 0 and first input of current chunk, and finally converting btn display values
        const clip = frameResultsToTimelineFrames(
          resetFrameIdxs([...tempResults]),
          lookup
        );
        // Remove the empty frames
        clip.splice(-61);
        setResults((prev) => [clip, ...prev]);
        // Clear saved results
        reset();
      }
    }

    if (inputReceived) {
      const inputs = frameResultsToTimelineFrames(
        resetFrameIdxs(tempResults),
        lookup
      );
      setCurrInputs(inputs);
      const idx = inputs.length - 1;
      previewGridRef.current?.scrollToItem({ columnIndex: idx });
    }
  }
  return (
    <div>
      {!enabled && (
        <Tooltip arrow title="Use a connected gamepad to practice inputs">
          <Button onClick={() => setEnabled((prev) => !prev)}>Practice</Button>
        </Tooltip>
      )}

      {enabled && (
        <div>
          <InputReader
            frameCb={frameCb}
            connectionCb={(val) => setControllerConnected(val)}
            enableHeld
          />
          {controllerConnected && <span>Controller Connected</span>}
          {!controllerConnected && <span>Please connect a controller</span>}
          {currInputs.length > 0 && (
            <div className="timelineContainer">
              <GG_Timeline
                gridRef={previewGridRef}
                containerW={winSize.width}
                frameW={frameW}
                frames={currInputs}
                showDupes={true}
                // clickCb={(idx) => seekToFrame(idx)}
                // hoverCb={(idx) => handleCellHover(idx)}
              />
            </div>
          )}

          {results.map((result, idx) => (
            <div key={idx}>
              {result.length > 0 && (
                <GG_Timeline
                  containerW={winSize.width}
                  frameW={frameW}
                  frames={result}
                  showDupes={true}
                  // clickCb={(idx) => seekToFrame(idx)}
                  // hoverCb={(idx) => handleCellHover(idx)}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GamepadInput;
