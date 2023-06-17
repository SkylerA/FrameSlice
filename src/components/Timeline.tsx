import React, { CSSProperties, useMemo } from "react";
import { FixedSizeGrid } from "react-window";
import { useDevicePixelRatio } from "use-device-pixel-ratio";
import styles from "@/styles/Timeline.module.css";
import { ObjArray } from "@/utils/data";

export type BtnColProps = {
  colIdx: number;
  frames: ObjArray;
  noDupes: boolean;
};

type BtnColumnCb = ({
  colIdx,
  frames,
  noDupes,
}: {
  colIdx: number;
  frames: ObjArray;
  noDupes: boolean;
}) => React.JSX.Element;

export type CellCbType = ({
  columnIndex,
  rowIndex,
  style,
}: {
  columnIndex: number;
  rowIndex: number;
  style: CSSProperties;
}) => React.JSX.Element;

export type TimelineProps = {
  frames: ObjArray;
  frameW: number; // FixedSizeGrid requires fixed widths
  containerW: number; // Currently need window size to grow object to fit space
  btnColumnCb?: BtnColumnCb; // return content for default cell
  cellCb?: CellCbType; // render entire cell, negates btnColumnCb
  clickCb?: (frameIdx: number) => void;
  hoverCb?: (frameIdx: number) => void;
  showDupes?: boolean;
  gridRef?: React.LegacyRef<FixedSizeGrid<any>>;
};

function getMaxBtnRows(array: ObjArray) {
  function maxBtnCount(maxRows: number, currCol: { [key: string]: any }) {
    const count = currCol["btns"]?.length ?? 0;
    return Math.max(count, maxRows);
  }

  return array.reduce(maxBtnCount, 0);
}

const BtnColumn = ({ colIdx, frames, noDupes }: BtnColProps) => {
  const btns = frames[colIdx]?.["btns"] ?? [];
  const prevBtns = frames[colIdx - 1]?.["btns"] ?? [];
  const diff = btns.toString() !== prevBtns.toString();
  const show = noDupes ? diff : true;

  return (
    <span>
      {show &&
        btns.map((btnStr: string, idx: number) => (
          <div key={idx} className={`btn`}>
            {btnStr}
          </div>
        ))}
    </span>
  );
};

const Timeline = (props: TimelineProps) => {
  const {
    frames,
    frameW,
    containerW,
    clickCb,
    hoverCb,
    cellCb,
    btnColumnCb,
    showDupes,
    gridRef,
  } = props;
  const pixelRatio = useDevicePixelRatio({ maxDpr: +Infinity, round: false });
  const remToPixels = 16;
  const rowCount = useMemo(() => {
    return getMaxBtnRows(frames);
  }, [frames.length]);

  const newTimelineHeight = Math.max(
    (rowCount + 1) * pixelRatio * remToPixels,
    0
  );

  // Determine timeline visibility vals
  const { maxTimelineW, scrollbarVis } = useMemo(() => {
    const timelineW = frameW * frames.length;
    const winMaxW = containerW * 0.9;
    const maxTimelineW = Math.min(timelineW, winMaxW);
    const scrollbarVis = timelineW > winMaxW;
    return { maxTimelineW, scrollbarVis };
  }, [frameW, containerW, frames.length]);

  // Use default or user cb to render btn column
  const RenderColumn: BtnColumnCb = ({ colIdx, frames, noDupes }) => {
    if (btnColumnCb) {
      return btnColumnCb({ colIdx, frames, noDupes });
    } else {
      return <BtnColumn colIdx={colIdx} frames={frames} noDupes={noDupes} />;
    }
  };

  const Cell: CellCbType = ({
    // clipIdx,
    columnIndex,
    rowIndex,
    style,
  }) => {
    // Provide a tick label for all values below 100 and every 5th after that
    const tickLbl =
      columnIndex < 100 || !(columnIndex % 5) ? columnIndex : undefined;

    return (
      <div
        onClick={() => clickCb?.(columnIndex)}
        onMouseOver={() => hoverCb?.(columnIndex)}
        // TODO classname is from example, this could be done in css assuming the cells are displayed normally and contiguous
        className={
          columnIndex % 2
            ? rowIndex % 2 === 0
              ? "GridItemOdd"
              : "GridItemEven"
            : rowIndex % 2
            ? "GridItemOdd"
            : "GridItemEven"
        }
        style={style}
      >
        <RenderColumn
          colIdx={columnIndex}
          frames={frames}
          noDupes={!showDupes ?? true}
        />
        <div
          style={{ ["--frameW" as any]: `${frameW}px` }}
          className={styles.timeTick}
          data-count={tickLbl}
        ></div>
      </div>
    );
  };

  return (
    // TODO See about replacing with Single List from same module
    <FixedSizeGrid
      ref={gridRef}
      style={{
        // minWidth: "90vw",
        maxWidth: frames.length * frameW,
        overflowY: "hidden",
      }}
      className={styles.Timeline}
      columnCount={frames.length}
      columnWidth={frameW}
      height={newTimelineHeight + (scrollbarVis ? 20 : 10)}
      rowCount={1}
      rowHeight={newTimelineHeight}
      width={maxTimelineW}
    >
      {cellCb ?? Cell}
    </FixedSizeGrid>
  );
};

export default Timeline;
