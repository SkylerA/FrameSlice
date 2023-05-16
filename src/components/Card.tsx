import { NextComponentType } from "next";
import { ComponentProps } from "react";
import styles from "@/styles/Card.module.css";
import classnames from "classnames";

type Props = ComponentProps<"div"> & {};

const Card: NextComponentType<Record<string, never>, unknown, Props> = (
  props: Props
) => {
  return (
    <div className={classnames(styles.Card, props.className)}>
      {props.children}
    </div>
  );
};

export default Card;
