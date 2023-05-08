import { NextComponentType } from "next";
import type { Crop } from "@/components/VidCropper";
import { useRef } from "react";

export type Props = {
  parseJsonCb?: JsonCallback;
};

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonObject
  | JsonArray;
export type JsonObject = { [key: string]: JsonValue };
export type JsonArray = JsonValue[];
export type Json = JsonObject | JsonArray | null;

export interface JsonCallback {
  (json: Json): void;
}

function handleCropFileChange(
  e: React.ChangeEvent<HTMLInputElement>,
  cb: JsonCallback | undefined
) {
  const file = e.currentTarget.files?.[0];
  if (file) {
    loadJson(file, cb);
  }
}

function loadJson(file: File, callback: JsonCallback | undefined) {
  if (file) {
    const reader = new FileReader();
    reader.onload = function (event) {
      try {
        const json = JSON.parse(event.target?.result as string) as unknown;
        callback?.(json as JsonObject | JsonArray);
      } catch (error) {
        console.error("Error while loading JSON: ", error);
        callback?.(null);
      }
    };
    reader.readAsText(file);
  }
}

const VidCropper: NextComponentType<Record<string, never>, unknown, Props> = (
  props: Props
) => {
  const cropFileRef = useRef<HTMLInputElement>(null);

  return (
    <div>
      <label>
        Load Crop File
        <input
          type="file"
          accept="application/json"
          ref={cropFileRef}
          onChange={(e) => handleCropFileChange(e, props.parseJsonCb)}
          multiple
        />
      </label>
    </div>
  );
};

export default VidCropper;
