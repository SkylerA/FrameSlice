import { NextComponentType } from "next";
import { Crop } from "./VidCropper";

type Props = {
  crop: Crop;
  editCb?: (crop: Crop) => void;
  deleteCb?: (crop: Crop) => void;
};

const CropRow: NextComponentType<Record<string, never>, unknown, Props> = (
  props: Props
) => {
  function handleNumberEdit(
    event: React.ChangeEvent<HTMLInputElement>,
    cropField: string
  ): void {
    const editObj = {
      [cropField]: event.currentTarget.value.replace(/[^a-zA-Z0-9-_]/g, "_"),
    };
    props.editCb?.({ ...props.crop, ...editObj });
  }

  return (
    <tr>
      <td className="name">
        {" "}
        <input
          type="text"
          value={props.crop.name}
          onChange={(e) => handleNumberEdit(e, "name")}
        />
      </td>
      <td>
        <input
          type="number"
          value={props.crop.x}
          onChange={(e) => handleNumberEdit(e, "x")}
        />
      </td>
      <td>
        <input
          type="number"
          value={props.crop.y}
          onChange={(e) => handleNumberEdit(e, "y")}
        />
      </td>
      <td>
        <input
          type="number"
          value={props.crop.width}
          onChange={(e) => handleNumberEdit(e, "width")}
        />
      </td>
      <td>
        <input
          type="number"
          value={props.crop.height}
          onChange={(e) => handleNumberEdit(e, "height")}
        />
      </td>
      <td>
        <button onClick={() => props.deleteCb?.(props.crop)}>❌</button>
      </td>
    </tr>
  );
};

export default CropRow;
