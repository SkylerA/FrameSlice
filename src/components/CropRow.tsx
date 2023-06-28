import type { NextComponentType } from "next";
import type { Crop } from "@/hooks/useFFmpeg";
import ButtonBase from "@mui/material/ButtonBase";
import CloseIcon from "@mui/icons-material/Close";
import { emojiBtnStyle } from "@/styles/MuiStyleObjs";

type Props = {
  crop: Crop;
  editCb?: (crop: Crop) => void;
  deleteCb?: (crop: Crop) => void;
  videoW: number;
  videoH: number;
};

const CropRow: NextComponentType<Record<string, never>, unknown, Props> = (
  props: Props
) => {
  function handleNumberEdit(
    event: React.ChangeEvent<HTMLInputElement>,
    cropField: string
  ): void {
    // This generically stores the updated value under cropField
    // This also replaces values of -1 with the max of the field which is set to x/y - videoW/videoH so that -1 will always return the max crop width within the video dimensions
    const max = event.currentTarget.max;
    const editObj = {
      [cropField]: event.currentTarget.value.replace("-1", max),
      // sma i have no clue why i was regexing this field to remove inval chars when this is a number field.... perhaps i was using a generic string for awhile?
      // [cropField]: event.currentTarget.value.replace(/[^a-zA-Z0-9-_]/g, "_"),
    };
    props.editCb?.({ ...props.crop, ...editObj });
  }

  return (
    <tr>
      <td className="name">
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
          min={-1}
          max={props.videoW - Number(props.crop.x)}
          value={props.crop.width}
          onChange={(e) => handleNumberEdit(e, "width")}
        />
      </td>
      <td>
        <input
          type="number"
          min={-1}
          max={props.videoH - Number(props.crop.y)}
          value={props.crop.height}
          onChange={(e) => handleNumberEdit(e, "height")}
        />
      </td>
      <td>
        <ButtonBase focusRipple onClick={() => props.deleteCb?.(props.crop)}>
          <CloseIcon
            sx={{ ...emojiBtnStyle, width: "1.25rem", height: "1.25rem" }}
          />
        </ButtonBase>
        {/* <button onClick={() => props.deleteCb?.(props.crop)}>
        </button> */}
      </td>
    </tr>
  );
};

export default CropRow;
