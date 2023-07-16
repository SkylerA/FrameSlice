import { ParseGames, ParseSettings, ParseSides } from "@/utils/parse";
import {
  Dispatch,
  ReactNode,
  SetStateAction,
  createContext,
  useMemo,
  useState,
} from "react";

type Props = {
  children: ReactNode;
};

type ContextValue = {
  parseSettings: ParseSettings;
  setParseSettings: Dispatch<SetStateAction<ParseSettings>>;
};

const defaultValue: ContextValue = {
  parseSettings: { game: ParseGames[0], side: ParseSides[0] },
  setParseSettings: () => {},
};

const ParseSettingsKey = "ParseSettings";

export const ParseSettingsContext = createContext<ContextValue>(defaultValue);

export const ParseSettingsContextProvider = (props: Props) => {
  const [parseSettings, setParseSettings] = useState<ParseSettings>(() => {
    return defaultValue.parseSettings;
  });

  const memoizedState = useMemo(
    () => ({ parseSettings, setParseSettings }),
    [parseSettings]
  );

  return (
    <ParseSettingsContext.Provider value={memoizedState}>
      {props.children}
    </ParseSettingsContext.Provider>
  );
};
