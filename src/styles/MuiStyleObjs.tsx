export const toggleStyle = {
  backgroundColor: "var(--card-bg)",
  color: "var(--card-fg)",
  borderColor: "var(--card-fg)",
  textTransform: "none",
  "&.Mui-selected": {
    background: "var(--gradient-bg)",
    color: "white",
  },
  "&:hover": {
    background: "var(--gradient-bg)",
    color: "var(--card-fg)",
  },
};

export const baseColor = {
  "& .MuiInputBase-root": {
    color: "var(--card-fg)",
  },
};

export const textFieldStyle = {
  ...baseColor,
  "& .MuiOutlinedInput-root": {
    "& fieldset": {
      borderColor: "var(--card-fg)",
    },
    "&:hover fieldset": {
      borderColor: "primary.main",
    },
    "&.Mui-focused fieldset": {
      borderColor: "primary.dark",
    },
  },
};

export const labelStyle = {
  color: "var(--card-fg)",
  whiteSpace: "unset",
};

export const selectStyle = {
  color: "var(--card-fg)",
  "& .MuiOutlinedInput-notchedOutline": {
    borderColor: "var(--card-fg)",
  },
  "&:hover .MuiOutlinedInput-notchedOutline": {
    borderColor: "var(--card-fg)",
  },
  "& .MuiSvgIcon-root": {
    color: "var(--card-fg)",
  },
};
