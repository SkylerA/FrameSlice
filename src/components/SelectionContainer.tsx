import type { NextComponentType } from "next";
import React, { useRef, useState } from "react";

// TODO make selections resizable

export type Box = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type Ratio = {
  w_ratio: number;
  h_ratio: number;
};

type Props = {
  children?: React.ReactNode;
  selecting?: boolean;
  onSelectionChange?: (selections: Box[]) => void;
  showSelections?: boolean;
  selections: Box[];
  setSelections?: (selections: Box[]) => void;
  ratio?: Ratio;
  className?: string;
};

function validRatio(ratio: Ratio | undefined) {
  let { w_ratio = 1, h_ratio = 1 } = ratio ?? {};
  w_ratio = isFinite(w_ratio) ? w_ratio : 0;
  h_ratio = isFinite(h_ratio) ? h_ratio : 0;
  return { w_ratio, h_ratio };
}

function boxToCss(box: Box, ratio: Ratio, idx: number) {
  const { x = 0, y = 0, width = 0, height = 0 } = box;
  const { w_ratio, h_ratio } = validRatio(ratio);

  return {
    left: x * w_ratio,
    top: y * h_ratio,
    width: width * w_ratio,
    height: height * h_ratio,
  };
}

// Convert a click event to relative x,y coords and then pass them to the given callback
const handleRelativeClick = (
  e: React.MouseEvent<HTMLDivElement>,
  cb: (x: number, y: number) => void
) => {
  const { x, y } = getRelativeMousePoint(e);
  cb(x, y);
};

// Convert a touch event to relative x,y coords and then pass them to the given callback
const handleRelativeTouch = (
  e: React.TouchEvent<HTMLDivElement>,
  cb: (x: number, y: number) => void
) => {
  const point = getRelativeTouchPoint(e);
  if (point) {
    const { x, y } = point;
    cb(x, y);
  }
};

// Return x,y coords relative to the clicked div
const getRelativeMousePoint = (e: React.MouseEvent<HTMLDivElement>) => {
  return {
    x: e.clientX - e.currentTarget.getBoundingClientRect().left,
    y: e.clientY - e.currentTarget.getBoundingClientRect().top,
  };
};

// Return x,y coords relative to the touched div
const getRelativeTouchPoint = (e: React.TouchEvent<HTMLDivElement>) => {
  const touch = e.changedTouches[0];
  return touch
    ? {
        x: touch.clientX - e.currentTarget.getBoundingClientRect().left,
        y: touch.clientY - e.currentTarget.getBoundingClientRect().top,
      }
    : undefined;
};

let cropCount = 0;

// TODO change to next component?
const SelectionContainer: NextComponentType<
  Record<string, never>,
  unknown,
  Props
> = (props: Props) => {
  const [boxes, setBoxes] = useState<Box[]>([]);
  const [drawing, setDrawing] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startY, setStartY] = useState(0);
  const [endX, setEndX] = useState(0);
  const [endY, setEndY] = useState(0);
  const mainDivRef = useRef<HTMLDivElement>(null);

  const handleSelectStart = (x: number, y: number) => {
    const canvas = mainDivRef.current;
    if (!canvas) return;

    setDrawing(true);
    setEndX(-1);
    setEndY(-1);
    setStartX(x);
    setStartY(y);
  };
  const handleSelectMove = (x: number, y: number) => {
    const canvas = mainDivRef.current;
    if (!canvas || !drawing) return;
    setEndX(x);
    setEndY(y);
  };

  const handleSelectEnd = (x: number, y: number) => {
    const canvas = mainDivRef.current;
    if (!canvas || !drawing) return;

    setDrawing(false);
    const { w_ratio, h_ratio } = validRatio(props.ratio);

    const newBox = {
      x: Math.ceil(Math.min(startX, x) / w_ratio),
      y: Math.ceil(Math.min(startY, y) / h_ratio),
      width: Math.ceil(Math.abs(x - startX) / w_ratio),
      height: Math.ceil(Math.abs(y - startY) / h_ratio),
      name: `crop-${++cropCount}`,
    };

    props.onSelectionChange?.([...props.selections, newBox]);
  };

  // Click Handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    handleRelativeClick(e, handleSelectStart);
  };
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    handleRelativeClick(e, handleSelectMove);
  };
  const handleMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
    handleRelativeClick(e, handleSelectEnd);
  };

  // Touch Handlers
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    handleRelativeTouch(e, handleSelectStart);
  };
  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    handleRelativeTouch(e, handleSelectMove);
  };
  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    handleRelativeTouch(e, handleSelectEnd);
  };

  const eventHandlers = props?.selecting
    ? {
        onMouseDown: handleMouseDown,
        onMouseMove: handleMouseMove,
        onMouseUp: handleMouseUp,
        onTouchStart: handleTouchStart,
        onTouchMove: handleTouchMove,
        onTouchEnd: handleTouchEnd,
      }
    : {};

  return (
    <div
      className={props.className}
      style={{
        position: "relative",
        touchAction: props.selecting ? "none" : "initial",
      }}
      {...eventHandlers}
      ref={mainDivRef}
    >
      {props.children}
      {props.selecting && drawing && endX > -1 && endY > -1 && (
        <div
          style={{
            position: "absolute",
            left: Math.min(startX, endX),
            top: Math.min(startY, endY),
            width: Math.abs(endX - startX),
            height: Math.abs(endY - startY),
            outline: "2px dashed #e40492",
            overflow: "hidden", // Fixes issue on iOS where one border wouldn't draw
            opacity: 1,
          }}
        />
      )}
      {props?.showSelections &&
        props?.selections?.map((box, index) => {
          const css = boxToCss(
            box,
            props.ratio ?? { w_ratio: 0, h_ratio: 0 },
            index
          );
          return (
            <div
              key={index}
              style={{
                ...css,
                position: "absolute",
                outline: "2px dashed #e40492",
                opacity: 1,
                pointerEvents: "none",
              }}
            />
          );
        })}
    </div>
  );
};

export default SelectionContainer;
