import React, { useContext, useEffect } from "react";
import Dropdown from "./Dropdown";

import styles from "@/styles/ParseSettings.module.css";
import { ParseSettingsContext } from "./contexts/parseSettingsContext";
import { ParseSettings } from "@/utils/parse";

type Props = {
  children?: React.ReactNode;
};

const games = ["GG Strive", "SF6"];
const sides = ["P1", "P2", "Both"];

const ParseSettings = (props: Props) => {
  const { children, ...rest } = props;
  const { parseSettings, setParseSettings } = useContext(ParseSettingsContext);
  const { game } = parseSettings;
  const side = parseSettings.side;

  useEffect(() => {
    setParseSettings((prev) => ({ ...prev, game, side }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // one time init

  return (
    <div className={styles.settingsPane}>
      <Dropdown
        label="Game"
        value={game}
        onChange={(e) => {
          setParseSettings(
            (prev) => ({ ...prev, game: e.target.value } as ParseSettings)
          );
        }}
        entries={games}
      />
      <Dropdown
        label="Player"
        value={side}
        onChange={(e) => {
          setParseSettings(
            (prev) => ({ ...prev, side: e.target.value } as ParseSettings)
          );
        }}
        entries={sides}
      />
      {children}
    </div>
  );
};

export default ParseSettings;
