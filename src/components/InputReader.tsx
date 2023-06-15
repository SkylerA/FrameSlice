import React, { useEffect, useRef } from "react";
import { ObjArray } from "./Timeline";

export type FrameCb = (result: FrameResult) => void;

type Props = {
  frameCb: FrameCb;
  connectionCb?: (connected: boolean) => void;
  enableHeld?: boolean;
};

export type FrameResult = { frameIdx: number; buttons: number[] };

export const frameResultsToObjArray = (
  frames: FrameResult[],
  labelLookupCb: (btnIdx: number) => string
): ObjArray => {
  const retArr = [] as ObjArray;
  frames.map(({ frameIdx, buttons }) => {
    retArr[frameIdx] = { btns: buttons?.map(labelLookupCb) ?? [] } as {
      [key: string]: any;
    };
  });
  return retArr;
};

export const InputHeldModifier = 100;
const markHeldButtons = (
  prevBtns: number[],
  btns: number[],
  modifier: number
) => {
  return btns?.map((btn) => {
    // Check if this button was pressed in the previous frame
    const held = prevBtns.includes(btn);
    // If button is held this frame, add a modified larger than our btn index range that can be eaisly detected and removed when handled
    const newVal = held ? btn + modifier : btn;
    return newVal;
  });
};

function install_gamepad_listener(frameCb: FrameCb, enableHeld: boolean) {
  // High resolution timer that will fire at 60hz by default, might be overkill
  const worker = new Worker(
    new URL("../workers/controller.worker.ts", import.meta.url)
  );

  // Read button inputs on each worker timer message
  worker.onmessage = function (e) {
    const gamepads = navigator.getGamepads();
    const frameIdx: number = e.data.frame;

    // Poll each button
    // TODO decide if other controller slots need to be considered
    const buttons: number[] = [];
    gamepads[0]?.buttons.forEach((btn, idx) => {
      if (btn.pressed) {
        buttons.push(idx);
      }
    });

    // Convert any held buttons
    const adjustedBtns = enableHeld
      ? markHeldButtons(prevBtns, buttons, InputHeldModifier)
      : [...buttons];
    prevBtns = [...buttons];

    const retObj: FrameResult = { frameIdx, buttons: adjustedBtns };

    // Let parent component handle newest frame even if no buttons were pressed
    frameCb?.(retObj);
  };

  return worker;
}

let prevBtns: number[] = [];
export default function InputReader(props: Props) {
  const { frameCb, enableHeld, connectionCb } = props;
  const workerRef = useRef<Worker>();

  // TODO replace useEffect with useExternalSyncStore https://react.dev/learn/you-might-not-need-an-effect#subscribing-to-an-external-store
  useEffect(() => {
    console.log("Installing gamepad listener");
    // install_gamepad_listener();
    if (frameCb) {
      workerRef.current = install_gamepad_listener(
        frameCb,
        enableHeld ?? false
      );
    } else {
      // TODO error about frameCb not being passed
    }

    // Install user connect/disconnect listeners
    const handleConnect = (event: GamepadEvent) => {
      // console.log("A gamepad connected:", event.gamepad);
      connectionCb?.(true);
    };
    window.addEventListener("gamepadconnected", handleConnect);
    const handleDisconnect = (event: GamepadEvent) => {
      // console.log("A gamepad disconnected:", event.gamepad);
      connectionCb?.(false);
    };
    window.addEventListener("gamepaddisconnected", handleDisconnect);

    // Start gamepad listener
    workerRef.current?.postMessage({ cmd: "start" });

    // Clean up various connections
    return () => {
      workerRef.current?.postMessage({ cmd: "stop" });
      window.removeEventListener("gamepadconnected", handleConnect);
      window.removeEventListener("gamepaddisconnected", handleDisconnect);
    };
  }, []);

  // TODO not sure if a no render component like this is proper or if i should make this a useHook of some sort, still need the prop inputs though
  return <></>;
}
