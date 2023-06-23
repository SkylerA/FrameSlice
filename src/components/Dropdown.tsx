// Mui Select with a simple label added and default site styles
import { selectStyle } from "@/styles/MuiStyleObjs";
import MenuItem from "@mui/material/MenuItem";
import Select, { SelectProps } from "@mui/material/Select";
import React from "react";

type Props = SelectProps & {
  entries: string[];
  onChangeCb: (newVal: string) => void;
};

const MenuEntry = (name: string) => (
  <MenuItem key={name} value={name}>
    {name}
  </MenuItem>
);

const Dropdown = (props: Props) => {
  const { entries, label, ...rest } = props;
  return (
    <>
      {props.label && (
        <span style={{ marginRight: "var(--gap)" }}>{props.label}</span>
      )}
      <Select
        onChange={(e) => props.onChangeCb((e.target?.value as string) ?? "")}
        sx={selectStyle}
        size="small"
        {...rest}
      >
        {entries.map((entry) => MenuEntry(entry))}
      </Select>
    </>
  );
};

export default Dropdown;
