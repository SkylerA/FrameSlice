import { Crop } from "@/hooks/useFFmpeg";

export type FramesCrop = {
  cropH: string;
  cropW: string;
  xOff: string;
  yOff: string;
};

export type FramesParseObj = {
  crop: FramesCrop;
  filterName?: string;
  presetName?: string;
  UID?: string;
  procParams?: { parseProcName: string; proc_kwargs: unknown };
};

export function FramesParseObjToCrop(obj: FramesParseObj): Crop {
  const { crop, filterName, presetName, UID } = obj;
  const name = filterName ?? presetName ?? UID ?? "";
  return {
    x: crop.xOff,
    y: crop.yOff,
    width: crop.cropW,
    height: crop.cropH,
    name,
  };
}

// TODO this should eventually live elsewhere
export const GG_BTN_PREFIX = "gg_btn_";
export const Crops_GG_Strive_P1_Row1: FramesParseObj[] = [
  {
    UID: "a308c3b5-0122-46a7-88ba-093f305a4f02",
    presetName: `${GG_BTN_PREFIX}L_0_0`,
    crop: {
      xOff: "49",
      yOff: "220",
      cropW: "34",
      cropH: "34",
    },
  },
  {
    UID: "142ae62b-7537-49d2-b1ad-0ae41148981d",
    presetName: `${GG_BTN_PREFIX}L_0_1`,
    crop: {
      xOff: "94",
      yOff: "220",
      cropW: "34",
      cropH: "34",
    },
  },
  {
    UID: "da23ac18-d7db-454a-a5b6-a711e40026ce",
    presetName: `${GG_BTN_PREFIX}L_0_2`,
    crop: {
      xOff: "139",
      yOff: "220",
      cropW: "34",
      cropH: "34",
    },
  },
  {
    UID: "1f6d8c7c-cc71-4355-95ee-eb9c1a4a3421",
    presetName: `${GG_BTN_PREFIX}L_0_3`,
    crop: {
      xOff: "184",
      yOff: "220",
      cropW: "34",
      cropH: "34",
    },
  },
];
