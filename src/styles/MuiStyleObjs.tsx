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
  minWidth: "5rem",
  width: "100%", // Fixes fps input field not filling area
  "& .MuiInputLabel-root": {
    color: "var(--card-fg)",
  },
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

export const emojiBtnStyle = {
  background: "var(--gradient-small-btn-bg)",
  borderRadius: ".25rem",
  color: "var(--card-fg)",
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
