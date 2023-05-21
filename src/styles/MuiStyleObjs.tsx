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
    color: "white",
  },
};

export const textFieldStyle = {
  "& .MuiInputBase-root": {
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
