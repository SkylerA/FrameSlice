import { ComponentProps, useRef } from "react";
import Button from "./Button";

// This is a hidden file input with a button to trigger the file dialog
// children will be passed a children to the button to allow normal button text setting
// ...rest will be sent to input to allow any desired input changes

export type Props = ComponentProps<"input"> & {
  children: React.ReactNode;
};

const FileLoaderBtn = (props: Props) => {
  const { children, ...rest } = props;
  const cropFileRef = useRef<HTMLInputElement>(null);
  const triggerFileInput = () => {
    if (cropFileRef.current) {
      cropFileRef.current.value = "";
      cropFileRef.current.click();
    }
  };

  return (
    <div>
      <Button onClick={triggerFileInput}>{children}</Button>
      <input type="file" ref={cropFileRef} hidden {...rest} />
    </div>
  );
};

export default FileLoaderBtn;
