import {
  Dispatch,
  ReactNode,
  SetStateAction,
  createContext,
  useEffect,
  useMemo,
  useState,
} from "react";

type Props = {
  children: ReactNode;
};

type ParseSettings = {
  game: string;
  side: string;
};

type ContextValue = {
  parseSettings: ParseSettings;
  setParseSettings: Dispatch<SetStateAction<ParseSettings>>;
};

const defaultValue: ContextValue = {
  parseSettings: { game: "", side: "" },
  setParseSettings: () => {},
};

const ParseSettingsKey = "ParseSettings";

export const ParseSettingsContext = createContext<ContextValue>(defaultValue);

export const ParseSettingsContextProvider = (props: Props) => {
  const [parseSettings, setParseSettings] = useState<ParseSettings>(() => {
    return { game: "", side: "" };
  });

  // TODO need a way to load/init this without server/client execution getting in the wayi'm not
  //   useEffect(() => {
  //     localStorage.setItem(ParseSettingsKey, JSON.stringify(parseSettings));
  //   }, [parseSettings]);

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
