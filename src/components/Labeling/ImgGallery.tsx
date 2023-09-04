import classnames from "classnames";
import React, { useEffect, useState } from "react";

type Props = {
  urls: string[];
  selectedIdxs?: number[];
  multiSelect?: boolean;
  onSelectionChanged?: (selection: number[]) => void;
  style?: React.CSSProperties;
  className?: string;
};

function ImgGallery(props: Props) {
  const [selection, setSelection] = useState<number[]>(
    props.selectedIdxs ?? []
  );

  // handle selection changes from parent props
  useEffect(() => {
    setSelection(props.selectedIdxs ?? []);
  }, [props.selectedIdxs]);

  // Handle click, ctrl+click, and shift+click selection
  const handleImgClick = (
    e: React.MouseEvent<HTMLImageElement, MouseEvent>,
    imgIdx: number
  ) => {
    if (props.onSelectionChanged) {
      const tempSet = new Set(selection);
      const multiEnabled = props.multiSelect ?? true;

      if (multiEnabled && e.ctrlKey) {
        /* Ctrl+click, toggle single selection  */

        tempSet.has(imgIdx) ? tempSet.delete(imgIdx) : tempSet.add(imgIdx);
      } else if (multiEnabled && e.shiftKey) {
        /* Shift+click, add range between last and new point */

        // Get the last added value or use start of array if no prev selections
        const prevIdx = selection.at(-1) ?? 0;

        // Generate range data
        const startIdx = Math.min(prevIdx, imgIdx);
        const extra = prevIdx < imgIdx ? 1 : 0; // When shift clicking from left to right, add 1 extra value to include the clicked item
        const range = Math.abs(prevIdx - imgIdx) + extra;
        const rangeArray = [...Array(range).keys()];

        // Add values relative to startIdx
        rangeArray.map((val) => tempSet.add(startIdx + val));
      } else {
        /* Plain click, new single selection or toggle existing */

        // Toggle off if clicking a single item that has already been selected
        if (tempSet.has(imgIdx) && tempSet.size < 2) {
          tempSet.delete(imgIdx);
        } else {
          // Otherwise treat as a new single selection
          tempSet.clear();
          tempSet.add(imgIdx);
        }
      }

      setSelection(Array.from(tempSet));
      props.onSelectionChanged(Array.from(tempSet));
    }
  };

  return (
    <div
      className={classnames("image-gallery", props.className)}
      style={props.style}
    >
      <>
        {props.urls.map((url, idx) => (
          <img
            src={url}
            key={idx}
            alt={`img ${idx}`}
            onClick={(e) => handleImgClick(e, idx)}
            className={selection.includes(idx) ? "selected" : ""}
          />
        ))}
      </>
    </div>
  );
}

export default ImgGallery;
