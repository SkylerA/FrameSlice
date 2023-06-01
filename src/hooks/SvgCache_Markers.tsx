import React from "react";

export const generic_svg_fn = (label: string, size: number) => {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" height={size} width={size}>
      <circle cx="50%" cy="50%" r="50%" fill="#000"></circle>
      <text
        x="50%"
        y="50%"
        fontFamily="Arial, Helvetica, sans-serif"
        fontSize={size}
        fontWeight={"bold"}
        dominantBaseline="central"
        textAnchor="middle"
        fill="#F00"
      >
        {"?"}
      </text>
    </svg>
  );
};

export type MarkerParamType = {
  bg_color: string;
  label: string;
  text_ratio: number;
  tag: string;
  text_color?: string;
  hue?: string;
  saturation?: string;
  lightness?: string;
};

// prettier-ignore
export const ggst_markers: MarkerParamType[] = [
  { bg_color: "#5b5b5b", hue: "300", label: "P", text_ratio: 0.8, tag: "gg-st" },
  { bg_color: "#5b5b5b", hue: "200", label: "K", text_ratio: 0.8, tag: "gg-st" },
  { bg_color: "#5b5b5b", hue: "155", label: "S", text_ratio: 0.8, tag: "gg-st" },
  { bg_color: "#5b5b5b", hue: "155", label: "FD", text_ratio: 0.6, tag: "gg-st" },
  { bg_color: "#5b5b5b", hue: "0", label: "HS", text_ratio: 0.6, tag: "gg-st" },
  { bg_color: "#5b5b5b", hue: "0", label: "RC", text_ratio: 0.6, tag: "gg-st" },
  { bg_color: "#5b5b5b", hue: "31", label: "D", text_ratio: 0.75, tag: "gg-st" },
  { bg_color: "#5b5b5b", hue: "31", label: "🡿", text_ratio: 0.75, tag: "gg-st" },
  { bg_color: "#5b5b5b", hue: "31", label: "🡻", text_ratio: 0.75, tag: "gg-st" },
  { bg_color: "#5b5b5b", hue: "31", label: "🡾", text_ratio: 0.75, tag: "gg-st" },
  { bg_color: "#5b5b5b", hue: "31", label: "🡸", text_ratio: 0.75, tag: "gg-st" },
  { bg_color: "#5b5b5b", hue: "31", label: "🡺", text_ratio: 0.75, tag: "gg-st" },
  { bg_color: "#5b5b5b", hue: "31", label: "🡼", text_ratio: 0.75, tag: "gg-st" },
  { bg_color: "#5b5b5b", hue: "31", label: "🡹", text_ratio: 0.75, tag: "gg-st" },
  { bg_color: "#5b5b5b", hue: "31", label: "🡽", text_ratio: 0.75, tag: "gg-st" },
  { bg_color: "#5b5b5b", hue: "0", saturation: "0%", lightness: "100%", label: "Dash", text_ratio: 0.38, tag: "gg-st" },
  // The following just has a field for possible values so typescript can infer correctly
  { label: "DUMMY ENTRY", bg_color: "", text_color: "", hue: "", saturation: "", lightness: "", text_ratio: 0.38, tag: "gg-st" },
];
export type ggst_markerParams = (typeof ggst_markers)[number];

export const ggColorForParams = (params: MarkerParamType, held: boolean) => {
  const hue = params.hue;
  const paramLightness = params.lightness ?? "55%";
  const heldLightness = `${parseInt(paramLightness) - 30}%`; // This doens't account for lightness going below 0
  const lightness = held ? heldLightness : paramLightness;
  const saturation = params.saturation ?? "70%";
  // Use specific color if specified, otherwise generate hsl value
  return params.text_color ?? `hsl(${hue}, ${saturation}, ${lightness})`;
};

// Function to create a customized svg circle w/ a label in the center
export const ggst_marker_fn = (
  params: MarkerParamType,
  size: number,
  held: boolean
) => {
  const color = ggColorForParams(params, held);

  return (
    <svg xmlns="http://www.w3.org/2000/svg" height={size} width={size}>
      <circle cx="50%" cy="50%" r="50%" fill={params.bg_color}></circle>
      <text
        x="50%"
        y="50%"
        fontFamily="Arial, Helvetica, sans-serif"
        fontSize={size * params.text_ratio}
        fontWeight={"bold"}
        dominantBaseline="central"
        textAnchor="middle"
        fill={color}
      >
        {params.label ?? "?"}
      </text>
    </svg>
  );
};

type MarkerLookup = Record<
  string,
  {
    markers: MarkerParamType[];
    createFn: (
      params: MarkerParamType,
      size: number,
      held: boolean
    ) => JSX.Element;
  }
>;

// TODO seems like there is some overlap between this and addSvgCreateFn. Also too many instances of the tag need to be set currently, this should be cleaned up and isolated to as few files as possible.
export const markerParams: MarkerLookup = {
  "gg-st": { markers: ggst_markers, createFn: ggst_marker_fn },
};
