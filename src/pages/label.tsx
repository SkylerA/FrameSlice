import GamepadInput from "@/components/GamepadInputs";
import ClassLabelEditor from "@/components/Labeling/ClassLabelEditor";
import React, { useEffect, useState } from "react";

type Props = {};

const Label = (props: Props) => {
  return (
    <>
      <ClassLabelEditor showLoadFolder />
    </>
  );
};

export default Label;
