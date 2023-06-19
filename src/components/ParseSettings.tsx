import React, { useState } from "react";
import Dropdown from "./Dropdown";

import styles from "@/styles/ParseSettings.module.css";

type Props = {};

const games = ["GG Strive", "SF6"];
const sides = ["P1", "P2", "Both"];

const ParseSettings = (props: Props) => {
  const [game, setGame] = useState<string>(() => games[0]);
  const [side, setSide] = useState<string>(() => sides[0]);

  return (
    <div className={styles.settingsPane}>
      <Dropdown
        label="Game"
        value={game}
        onChangeCb={(val) => setGame(val)}
        entries={games}
      />
      <Dropdown
        label="Player"
        value={side}
        onChangeCb={(val) => setSide(val)}
        entries={sides}
      />
    </div>
  );
};

export default ParseSettings;
