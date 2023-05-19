import { NextComponentType } from "next";
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
    setStartX(x - canvas.offsetLeft + document.documentElement.scrollLeft);
    setStartY(y - canvas.offsetTop + document.documentElement.scrollTop);
  };
  const handleSelectMove = (x: number, y: number) => {
    const canvas = mainDivRef.current;
    if (!canvas || !drawing) return;

    setEndX(x - canvas.offsetLeft + document.documentElement.scrollLeft);
    setEndY(y - canvas.offsetTop + document.documentElement.scrollTop);
  };

  const handleSelectEnd = (x: number, y: number) => {
    const canvas = mainDivRef.current;
    if (!canvas || !drawing) return;

    const tempEndX =
      x - canvas.offsetLeft + document.documentElement.scrollLeft;
    const tempEndY = y - canvas.offsetTop + document.documentElement.scrollTop;

    setDrawing(false);
    const { w_ratio, h_ratio } = validRatio(props.ratio);

    const newBox = {
      x: Math.ceil(Math.min(startX, tempEndX) / w_ratio),
      y: Math.ceil(Math.min(startY, tempEndY) / h_ratio),
      width: Math.ceil(Math.abs(tempEndX - startX) / w_ratio),
      height: Math.ceil(Math.abs(tempEndY - startY) / h_ratio),
      name: `crop-${++cropCount}`,
    };

    props.onSelectionChange?.([...props.selections, newBox]);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    handleSelectStart(e.clientX, e.clientY);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    handleSelectMove(e.clientX, e.clientY);
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
    handleSelectEnd(e.clientX, e.clientY);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    const touch = e.changedTouches[0];
    if (touch) {
      handleSelectStart(touch.clientX, touch.clientY);
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    const touch = e.changedTouches[0];
    if (touch) {
      handleSelectMove(touch.clientX, touch.clientY);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    const touch = e.changedTouches[0];
    if (touch) {
      handleSelectEnd(touch.clientX, touch.clientY);
    }
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
      style={{ position: "relative" }}
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
