// TODO add browser support check for controllers
import React, { useEffect, useRef } from "react";
import { FrameCb, createGamepadWorker } from "@/utils/gamepad";

type Props = {
  frameCb: FrameCb;
  connectionCb?: (connected: boolean) => void;
  enableHeld?: boolean;
};

export default function InputReader(props: Props) {
  const { frameCb, enableHeld, connectionCb } = props;
  const workerRef = useRef<Worker>();

  // TODO replace useEffect with useExternalSyncStore https://react.dev/learn/you-might-not-need-an-effect#subscribing-to-an-external-store
  useEffect(() => {
    console.log("Installing gamepad listener");
    // install_gamepad_listener();
    if (frameCb) {
      workerRef.current = createGamepadWorker(frameCb, enableHeld ?? false);
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
