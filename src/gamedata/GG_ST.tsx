import { FramesParseObj } from "@/utils/parse";

export const GG_BTN_PREFIX = "gg_btn_";
const Crops_GG_Strive_P1_Row1: FramesParseObj[] = [
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

const Crops_GG_Strive_P2_Row1: FramesParseObj[] = [
  {
    presetName: `${GG_BTN_PREFIX}R_0_0`,
    crop: {
      xOff: "1879",
      yOff: "219",
      cropW: "34",
      cropH: "34",
    },
  },
  {
    presetName: `${GG_BTN_PREFIX}R_0_1`,
    crop: {
      xOff: "1835",
      yOff: "219",
      cropW: "34",
      cropH: "34",
    },
  },
  {
    presetName: `${GG_BTN_PREFIX}R_0_2`,
    crop: {
      xOff: "1789",
      yOff: "219",
      cropW: "34",
      cropH: "34",
    },
  },
  {
    presetName: `${GG_BTN_PREFIX}R_0_3`,
    crop: {
      xOff: "1744",
      yOff: "219",
      cropW: "34",
      cropH: "34",
    },
  },
  // {
  //   presetName: `${GG_BTN_PREFIX}R_0_4`,
  //   crop: {
  //     xOff: "1699",
  //     yOff: "219",
  //     cropW: "34",
  //     cropH: "34",
  //   },
  // },
  // {
  //   presetName: `${GG_BTN_PREFIX}R_0_5`,
  //   crop: {
  //     xOff: "1654",
  //     yOff: "219",
  //     cropW: "34",
  //     cropH: "34",
  //   },
  // },
  // {
  //   presetName: `${GG_BTN_PREFIX}R_0_6`,
  //   crop: {
  //     xOff: "1609",
  //     yOff: "219",
  //     cropW: "34",
  //     cropH: "34",
  //   },
  // },
  // {
  //   presetName: "gg-st_clock",
  //   crop: {
  //     xOff: "917",
  //     yOff: "116",
  //     cropW: "82",
  //     cropH: "59",
  //   },
  // },
];

export const GG_Input_Crops = [
  Crops_GG_Strive_P1_Row1,
  Crops_GG_Strive_P2_Row1,
];
