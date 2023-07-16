import { GG_BTN_PREFIX, GG_Input_Crops } from "@/gamedata/GG_ST";
import { Crop } from "@/hooks/useFFmpeg";

export type FramesCrop = {
  cropH?: string;
  cropW?: string;
  xOff?: string;
  yOff?: string;
};

export type FramesParseObj = {
  crop?: FramesCrop;
  filterName?: string;
  presetName?: string;
  UID?: string;
  procParams?: { parseProcName: string; proc_kwargs: unknown };
  name?: string;
  x?: string;
  y?: string;
  width?: string;
  height?: string;
};

export const ParseGames = ["GG Strive", "SF6"] as const;
export const ParseSides = ["P1", "P2", "Both"] as const;
export type ParseSettings = {
  game: (typeof ParseGames)[number];
  side: (typeof ParseSides)[number];
};

export type GameInfo = {
  crops: FramesParseObj[][];
  btnPrefix: string;
};

export function FramesParseObjToCrop(obj: FramesParseObj): Crop {
  const { crop, filterName, presetName, UID, name, x, y, width, height } = obj;
  const tempName = filterName ?? presetName ?? name ?? UID ?? "";
  return {
    x: crop?.xOff ?? x ?? "-1",
    y: crop?.yOff ?? y ?? "-1",
    width: crop?.cropW ?? width ?? "-1",
    height: crop?.cropH ?? height ?? "-1",
    name: tempName,
  };
}

export const CropData = new Map([
  ["GG Strive", { crops: GG_Input_Crops, btnPrefix: GG_BTN_PREFIX }],
]);

type CropDataType = typeof CropData;

export function GetCrops(settings: ParseSettings) {
  const parseObjs = GetCropsFromData(CropData, settings);
  return parseObjs.map(FramesParseObjToCrop);
}

export function GetBtnPrefix(settings: ParseSettings) {
  return CropData.get(settings.game)?.btnPrefix;
}

export function GetCropsFromData(
  data: CropDataType,
  settings: ParseSettings
): FramesParseObj[] {
  const idx = ["P1", "P2"].indexOf(settings.side);
  const gameData = CropData.get(settings.game);
  const crops = gameData?.crops;
  const sideData = crops?.[idx] ?? undefined;
  console.log(idx, settings, CropData, gameData, sideData);

  return sideData ?? crops?.flat() ?? [];
}
