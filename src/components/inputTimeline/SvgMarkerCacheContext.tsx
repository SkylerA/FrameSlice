import React, { createContext, useEffect } from "react";
import {
  useSvgCache,
  getImgIntf,
  addSvgCreateIntf,
  svgCreateIntf,
} from "@/hooks/useSvgCache";

type cacheContext = {
  getImg: getImgIntf;
  addSvgCreateFn: addSvgCreateIntf;
};

const svgMarkerCacheContext = createContext({} as cacheContext);

type Props = {
  children: React.ReactNode;
  svgFns: { key: string; createFn: svgCreateIntf }[];
};

// Wrapper for our context provider
// We'll create an svg cache and then provide a custom hook to get/add to the cache
export const SvgMarkerCacheContextProvider = (props: Props) => {
  const { children, svgFns } = props;
  const [getImg, addSvgCreateFn] = useSvgCache();

  // Register passed in svg drawing functions
  useEffect(() => {
    svgFns.map((svgFn) => {
      addSvgCreateFn(svgFn.key, svgFn.createFn);
    });
  }, [svgFns, addSvgCreateFn]);

  return (
    <svgMarkerCacheContext.Provider
      value={{
        getImg: getImg,
        addSvgCreateFn: addSvgCreateFn,
      }}
    >
      {children}
    </svgMarkerCacheContext.Provider>
  );
};

export const useMarkerCache = () => React.useContext(svgMarkerCacheContext);
