// Local overload of the MUI button to set some default values for this site

import MuiButton, { ButtonProps } from "@mui/material/Button";
import React from "react";

interface Props extends ButtonProps {}

const Button = (props: Props) => {
  return (
    <MuiButton
      sx={{ textTransform: "none" }}
      className="gradient-bg"
      variant="contained"
      onClick={props.onClick}
    >
      {props.children}
    </MuiButton>
  );
};

export default Button;
