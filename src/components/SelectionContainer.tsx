import { NextComponentType } from "next";
import React, { useRef, useState } from "react";

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

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const canvas = mainDivRef.current;
    if (!canvas) return;

    setDrawing(true);
    setStartX(e.clientX - canvas.offsetLeft);
    setStartY(e.clientY - canvas.offsetTop);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const canvas = mainDivRef.current;
    if (!canvas || !drawing) return;

    setEndX(e.clientX - canvas.offsetLeft);
    setEndY(e.clientY - canvas.offsetTop);
  };

  const handleMouseUp = () => {
    setDrawing(false);
    console.log(startX, startY, endX, endY);
    const { w_ratio, h_ratio } = validRatio(props.ratio);

    const newBox = {
      x: Math.ceil(Math.min(startX, endX) / w_ratio),
      y: Math.ceil(Math.min(startY, endY) / h_ratio),
      width: Math.ceil(Math.abs(endX - startX) / w_ratio),
      height: Math.ceil(Math.abs(endY - startY) / h_ratio),
      name: `crop-${++cropCount}`,
    };
    setBoxes([...boxes, newBox]);

    props.onSelectionChange?.([...boxes, newBox]);
  };

  const eventHandlers = props?.selecting
    ? {
        onMouseDown: handleMouseDown,
        onMouseMove: handleMouseMove,
        onMouseUp: handleMouseUp,
      }
    : {};

  console.log("redraw: selection container");

  return (
    <div style={{ position: "relative" }} {...eventHandlers} ref={mainDivRef}>
      {props.children}
      {props.selecting && drawing && (
        <div
          style={{
            position: "absolute",
            left: Math.min(startX, endX),
            top: Math.min(startY, endY),
            width: Math.abs(endX - startX),
            height: Math.abs(endY - startY),
            outline: "2px dashed red",
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
                outline: "2px dashed red",
                opacity: 1,
              }}
            />
          );
        })}
    </div>
  );
};

export default SelectionContainer;
