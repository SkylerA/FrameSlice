import React, { useContext, useEffect } from "react";
import Dropdown from "./Dropdown";

import styles from "@/styles/ParseSettings.module.css";
import { ParseSettingsContext } from "./contexts/parseSettingsContext";

type Props = {};

const games = ["GG Strive", "SF6"];
const sides = ["P1", "P2", "Both"];

const ParseSettings = (props: Props) => {
  const { parseSettings, setParseSettings } = useContext(ParseSettingsContext);
  const game = parseSettings.game !== "" ? parseSettings.game : games[0];
  const side = parseSettings.side !== "" ? parseSettings.side : sides[0];

  useEffect(() => {
    setParseSettings((prev) => ({ ...prev, game, side }));
  }, []); // one time init

  return (
    <div className={styles.settingsPane}>
      <Dropdown
        label="Game"
        value={game}
        onChangeCb={(val) =>
          setParseSettings((prev) => ({ ...prev, game: val }))
        }
        entries={games}
      />
      <Dropdown
        label="Player"
        value={side}
        onChangeCb={(val) =>
          setParseSettings((prev) => ({ ...prev, side: val }))
        }
        entries={sides}
      />
    </div>
  );
};

export default ParseSettings;
