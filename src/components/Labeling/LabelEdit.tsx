import React, { useEffect, useState } from "react";
import ButtonBase from "@mui/material/ButtonBase";
import DoneIcon from "@mui/icons-material/Done";
import CloseIcon from "@mui/icons-material/Close";
import FloatingLabelDropdown from "../FloatingLabelDropdown";
import TextField from "@mui/material/TextField";
import { emojiBtnStyle, textFieldStyle } from "@/styles/MuiStyleObjs";

type Props = {
  classes: string[];
  defaultClass?: string;
  onClassChange: (newClass: string) => void;
  className?: string;
};

const NEW = "(New Class)";

function LabelEdit(props: Props) {
  const [newClass, setNewClass] = useState<string>("");
  const [classVal, setClassVal] = useState<string>(
    props.defaultClass ?? props.classes[0] ?? ""
  );

  // listen for updates from parent prop
  useEffect(() => {
    setClassVal(props.defaultClass ?? "");
  }, [props.defaultClass]);

  const handleEditOk = () => {
    let val = classVal !== NEW ? classVal : newClass;
    val = val !== "" ? val : window.prompt("New Class Name:") ?? "unlabeled";
    props.onClassChange(val);
  };

  const handleEditCancel = () => {
    props.onClassChange("");
  };

  return (
    <div
      className={props.className ?? "label-edit"}
      style={{
        display: "flex",
        gap: "var(--gap)",
        // justifyContent: "end",
        alignItems: "center",
      }}
    >
      <FloatingLabelDropdown
        entries={[NEW, ...props.classes]}
        value={classVal}
        label="Class"
        onChange={(e) => setClassVal(e.target.value as string)}
      />
      {classVal === NEW && (
        <TextField
          aria-label="New Class"
          placeholder="new class name"
          size="small"
          value={newClass}
          sx={{ ...textFieldStyle, width: "initial" }} // textFieldStyle sets width to 100%, so this resets it
          onChange={(e) => setNewClass(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleEditOk();
            }
          }}
        />
      )}
      <ButtonBase focusRipple onClick={handleEditOk}>
        <DoneIcon
          sx={{
            ...emojiBtnStyle,
            // width: "1.25rem",
            // height: "1.25rem",
          }}
        />
      </ButtonBase>
      <ButtonBase focusRipple onClick={handleEditCancel}>
        <CloseIcon
          sx={{
            ...emojiBtnStyle,
            // width: "1.25rem",
            // height: "1.25rem",
          }}
        />
      </ButtonBase>
    </div>
  );
}

export default LabelEdit;
