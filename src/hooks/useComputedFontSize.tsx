import React, { useState, useEffect } from "react";

const useComputedFontSize = () => {
  const [fontSize, setFontSize] = useState<number>(0);

  useEffect(() => {
    const resizeObserver = new ResizeObserver((entries) => {
      const computedFontSize = getComputedStyle(
        document.documentElement
      ).fontSize;
      const parsedFontSize = parseFloat(computedFontSize);
      if (!isNaN(parsedFontSize)) {
        setFontSize(parsedFontSize);
      }
    });

    resizeObserver.observe(document.documentElement);

    return () => {
      resizeObserver.unobserve(document.documentElement);
    };
  }, []);

  return fontSize;
};

export default useComputedFontSize;
