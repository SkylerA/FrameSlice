import { NextComponentType } from "next";
import { Crop } from "@/hooks/useFFmpeg";
import SvgIcon from "@mui/material/SvgIcon";
import ButtonBase from "@mui/material/ButtonBase";

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
          <SvgIcon
            sx={{
              background: "var(--gradient-small-btn-bg)",
              borderRadius: ".25rem",
              width: "1.25rem",
              height: "1.25rem",
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
              <path d="M0 0h24v24H0z" fill="none" />
              <path
                d="M18.3 5.71a.996.996 0 0 0-1.41 0L12 10.59l-4.89-4.88a.996.996 0 1 0-1.41 1.41L10.59 12l-4.88 4.89a.996.996 0 1 0 1.41 1.41L12 13.41l4.89 4.88a.996.996 0 1 0 1.41-1.41L13.41 12l4.88-4.89c.38-.38.38-1.02 0-1.4z"
                fill="white"
              />
            </svg>
          </SvgIcon>
        </ButtonBase>
        {/* <button onClick={() => props.deleteCb?.(props.crop)}>
        </button> */}
      </td>
    </tr>
  );
};

export default CropRow;
