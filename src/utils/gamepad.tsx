import { ObjArray } from "./data";

export type FrameCb = (result: FrameResult) => void;
export type FrameResult = { frameIdx: number; buttons: number[] };
export type LookupInfo = {
  btnIdx: number;
  held: boolean;
  fgcDir?: boolean;
};
export type LabelLookupCb = (info: LookupInfo) => string;

export const U = 12;
export const D = 13;
export const L = 14;
export const R = 15;

export const InputHeldModifier = 1000;
export const DirModifier = 100;

// replace cardinal direction idx's (12-15, U,D,L,R) with fgc idx's (1-9)
export function convertDirs(dirs: number[], offset: number) {
  let newBtns = [...dirs];
  if (dirs.includes(U)) {
    if (dirs.includes(R)) {
      newBtns.push(offset + 9);
    } else if (dirs.includes(L)) {
      newBtns.push(offset + 7);
    } else {
      newBtns.push(offset + 8);
    }
  } else if (dirs.includes(D)) {
    if (dirs.includes(R)) {
      newBtns.push(offset + 3);
    } else if (dirs.includes(L)) {
      newBtns.push(offset + 1);
    } else {
      newBtns.push(offset + 2);
    }
  } else if (dirs.includes(L)) {
    newBtns.push(offset + 4);
  } else if (dirs.includes(R)) {
    newBtns.push(offset + 6);
  }

  // remove old number indexes and return new dir value
  return newBtns.filter((idx) => idx < U || idx > R);
}

export function pollButtons(btns: readonly GamepadButton[]) {
  // Poll each button
  // TODO decide if other controller slots need to be considered
  const buttons: number[] = [];
  const dirs: number[] = [];

  btns.forEach((btn, idx) => {
    if (btn.pressed) {
      if (idx >= U && idx <= R) {
        dirs.push(idx);
      } else {
        buttons.push(idx);
      }
    }
  });

  return { buttons, dirs };
}

// TODO current use of prevBtns probably isn't safe if multiple sources use this call at the same time
let prevBtns: number[] = [];
export function createGamepadWorker(frameCb: FrameCb, enableHeld: boolean) {
  // High resolution timer that will fire at 60hz by default, might be overkill
  const worker = new Worker(
    new URL("../workers/controller.worker.ts", import.meta.url)
  );

  // Read button inputs on each worker timer message
  worker.onmessage = function (e) {
    const gamepads = navigator.getGamepads();
    const frameIdx: number = e.data.frame;

    const { buttons, dirs } = pollButtons(gamepads[0]?.buttons ?? []);

    let retObj: FrameResult = { frameIdx, buttons: [] };
    // Skip no-input frames
    if (buttons.length + dirs.length > 0) {
      const newDirs = convertDirs(dirs, DirModifier);
      // Convert any held buttons
      const adjustedBtns = enableHeld
        ? markHeldButtons(prevBtns, [...buttons, ...newDirs], InputHeldModifier)
        : [...buttons];
      prevBtns = [...buttons];

      retObj = { frameIdx, buttons: adjustedBtns };
    }

    // Let parent component handle newest frame even if no buttons were pressed
    frameCb?.(retObj);
  };

  return worker;
}

// better look away, from the train wreck
export function ButtonCheck(btnIdx: number): LookupInfo {
  // TODO would probably be better to this as bitmasks
  // This currently checks known ranges of values, stripping off the larger ranges and moving to the lower
  let tempIdx = btnIdx;

  // Check if idx is in held range, adjust the index if so
  const held = tempIdx >= InputHeldModifier;
  if (held) tempIdx = tempIdx - InputHeldModifier;

  // Check if idx is in held range, adjust the index if so
  const isDir = tempIdx >= DirModifier;
  if (isDir) tempIdx = tempIdx - DirModifier;

  // Return updated idx, held state, and fgc dir state
  return { btnIdx: tempIdx, held, fgcDir: isDir };
}

export function markHeldButtons(
  prevBtns: number[],
  btns: number[],
  modifier: number
) {
  return btns?.map((btn) => {
    // Check if this button was pressed in the previous frame
    const held = prevBtns.includes(btn);
    // If button is held this frame, add a modified larger than our btn index range that can be eaisly detected and removed when handled
    const newVal = held ? btn + modifier : btn;
    return newVal;
  });
}

export const frameResultsToObjArray = (
  frames: FrameResult[],
  labelLookupCb: LabelLookupCb
): ObjArray => {
  // Wrap the passed lookup cb so we can call ButtonCheck first
  function BtnLookup(btnIdx: number) {
    return labelLookupCb(ButtonCheck(btnIdx));
  }
  const retArr = [] as ObjArray;
  frames.map(({ frameIdx, buttons }) => {
    retArr[frameIdx] = { btns: buttons?.map(BtnLookup) ?? [] } as {
      [key: string]: any;
    };
  });
  return retArr;
};
