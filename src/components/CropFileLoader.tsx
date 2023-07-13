import type { NextComponentType } from "next";
import { JsonCallback, loadJson } from "@/utils/data";
import FileLoaderBtn from "./FileLoaderBtn";

export type Props = {
  parseJsonCb?: JsonCallback;
};

function handleCropFileChange(
  e: React.ChangeEvent<HTMLInputElement>,
  cb: JsonCallback | undefined
) {
  const file = e.currentTarget.files?.[0];
  if (file) {
    loadJson(file, cb);
  }
}

const CropFileLoader: NextComponentType<
  Record<string, never>,
  unknown,
  Props
> = (props: Props) => {
  return (
    <FileLoaderBtn
      accept="application/json"
      multiple
      onChange={(e) => handleCropFileChange(e, props.parseJsonCb)}
    >
      Load Crop File
    </FileLoaderBtn>
  );
};

export default CropFileLoader;
