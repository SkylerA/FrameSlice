import React, { useEffect, useRef } from "react";

// This component will request the browser to scroll to it on first mount

type Props = {};

function ScrollOnShow({}: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  return <div style={{ visibility: "hidden" }} ref={ref}></div>;
}

export default ScrollOnShow;
