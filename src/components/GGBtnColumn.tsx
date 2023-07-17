import type { BtnColProps } from "./Timeline";
import styles from "@/styles/GGBtnColumn.module.css";

const convertLabel = (label: string) => {
  // dummy values for 0 and 5 because they are never used in read fgc inputs
  const directionLookup = [
    "dummy",
    "🡿",
    "🡻",
    "🡾",
    "🡸",
    "dummy",
    "🡺",
    "🡼",
    "🡹",
    "🡽",
  ];
  const heldSuffix = "_h";
  const held = label?.toLowerCase().endsWith(heldSuffix);

  const intLabel = parseInt(label);
  // If the label was a low int, replace it with a direction, otherwise use original label
  const newLabel =
    intLabel && intLabel <= 9
      ? // If a direction, lookup the arrow and then add _h if button was held
        `${directionLookup[intLabel]}${held ? "_h" : ""}`
      : label;

  return newLabel;
};

// Returns the buttons for a given frame in individual divs
// noDupes will skip a frame's buttons if they match the previous frame;
const GGBtnColumn = ({ colIdx, frames, noDupes }: BtnColProps) => {
  const btns = frames[colIdx]?.["btns"] ?? [];
  const prevBtns = frames[colIdx - 1]?.["btns"] ?? [];
  const diff = btns.toString() !== prevBtns.toString();
  const show = noDupes ? diff : true;

  return (
    <span className={styles.gg}>
      {show &&
        btns.map((btnStr: string, idx: number) => (
          <div
            key={`${idx}_${btnStr}`}
            className={`${styles.btn} ${styles[btnStr]}`}
          >
            {convertLabel(btnStr)?.replace("_h", "")}
          </div>
        ))}
    </span>
  );
};

export default GGBtnColumn;
