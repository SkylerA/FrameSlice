import { NextComponentType } from "next";
import { ComponentProps } from "react";
import styles from "@/styles/Card.module.css";

type Props = ComponentProps<"div"> & {};

const Card: NextComponentType<Record<string, never>, unknown, Props> = (
  props: Props
) => {
  return <div className={styles.Card}>{props.children}</div>;
};

export default Card;
