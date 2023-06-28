// Local overload of the MUI button to set some default values for this site

import MuiButton, { ButtonProps } from "@mui/material/Button";
import classnames from "classnames";
import React, { ForwardedRef } from "react";

interface Props extends ButtonProps {}

const Button = React.forwardRef<typeof MuiButton, Props>(
  (props: Props, ref: ForwardedRef<typeof MuiButton>) => {
    const { className, children, ...rest } = props;
    return (
      <MuiButton
        {...rest}
        sx={{ textTransform: "none" }}
        className={classnames("gradient-bg", className)}
        variant="contained"
      >
        {children}
      </MuiButton>
    );
  }
);

Button.displayName = "Button";

export default Button;
