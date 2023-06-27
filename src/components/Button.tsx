// Local overload of the MUI button to set some default values for this site

import MuiButton, { ButtonProps } from "@mui/material/Button";
import classnames from "classnames";
import React from "react";

interface Props extends ButtonProps {}

const Button = (props: Props) => {
  return (
    <MuiButton
      sx={{ textTransform: "none" }}
      className={classnames("gradient-bg", props.className)}
      variant="contained"
      onClick={props.onClick}
      style={props.style}
    >
      {props.children}
    </MuiButton>
  );
};

export default Button;
