// Mui Select with floating label and site styling
import { labelStyle, selectStyle } from "@/styles/MuiStyleObjs";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select, { SelectProps } from "@mui/material/Select";
import React from "react";

type Props = SelectProps & {
  entries: string[];
};

const MenuEntry = (name: string) => (
  <MenuItem key={name} value={name}>
    {name}
  </MenuItem>
);

const FloatingLabelDropdown = (props: Props) => {
  const { entries, ...rest } = props;
  const labelId = `${props.label ?? "unknown"}-label`;
  return (
    <>
      <FormControl size="small">
        <InputLabel id={labelId} sx={selectStyle}>
          {props.label}
        </InputLabel>
        <Select labelId={labelId} sx={selectStyle} size="small" {...rest}>
          {entries.map((entry) => MenuEntry(entry))}
        </Select>
      </FormControl>
    </>
  );
};

export default FloatingLabelDropdown;
