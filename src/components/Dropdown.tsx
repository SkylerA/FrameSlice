import { selectStyle } from "@/styles/MuiStyleObjs";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import React from "react";

type Props = {
  value: string;
  entries: string[];
  label?: string;
  onChangeCb: (newVal: string) => void;
};

const MenuEntry = (name: string) => (
  <MenuItem key={name} value={name}>
    {name}
  </MenuItem>
);

const Dropdown = (props: Props) => {
  return (
    <>
      {props.label && <span>{props.label}</span>}
      <Select
        labelId={`${props.label}LabelId`}
        id={`${props.label}Select`}
        value={props.value}
        onChange={(e) => props.onChangeCb(e.target?.value ?? "")}
        sx={selectStyle}
        size="small"
      >
        {props.entries.map((entry) => MenuEntry(entry))}
      </Select>
    </>
  );
};

export default Dropdown;
