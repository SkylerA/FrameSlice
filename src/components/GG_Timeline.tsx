import React from "react";
import Timeline, { TimelineProps } from "./Timeline";
import GGBtnColumn from "./GGBtnColumn";

const GG_Timeline = (props: TimelineProps) => {
  return <Timeline btnColumnCb={GGBtnColumn} {...props} />;
};

export default GG_Timeline;
