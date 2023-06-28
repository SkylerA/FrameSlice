import type { NextComponentType } from "next";
import { ComponentProps } from "react";
import styles from "@/styles/Card.module.css";
import classnames from "classnames";

type Props = ComponentProps<"div"> & {};

const Card: NextComponentType<Record<string, never>, unknown, Props> = (
  props: Props
) => {
  const { className, children, ...rest } = props;

  return (
    <div className={classnames(styles.Card, className)} {...rest}>
      {children}
    </div>
  );
};

export default Card;
