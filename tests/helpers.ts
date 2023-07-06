import { expect, type Page } from "@playwright/test";

export const TestPath = "./tests/resources/";

export async function SingleCropBootstrap(page: Page) {
  await loadVid("gg1-short.mp4", page);
  await page.getByText("Select Crop Areas").click();

  // Click and drag over the video to create a crop region
  const vid = await page.locator("video");
  await vid.dragTo(vid, {
    sourcePosition: { x: 1, y: 1 },
    targetPosition: { x: 25, y: 25 },
  });
}

export const getCropTableInputVal = (row: number, col: number, page: Page) => {
  // note: row and col use 1-based index to match css syntax
  return page.locator(`table tr:nth-child(${row}) td:nth-child(${col}) input`);
};

export const confirmTableMatch = async (
  row1: number,
  row2: number,
  colStart: number,
  colStop: number,
  page: Page
) => {
  for (let col = colStart; col <= colStop; col++) {
    const input1 = await getCropTableInputVal(row1 + 1, col + 1, page);
    const input2 = await getCropTableInputVal(row2 + 1, col + 1, page);
    await expect(input1).not.toBeUndefined();
    await expect(input1).toHaveValue(await input2.inputValue());
  }
};

export const confirmRowMatch = async (
  row: number,
  colStart: number,
  colStop: number,
  expectedVals: string[],
  page: Page
) => {
  let count = 0;
  for (let col = colStart; col <= colStop; col++) {
    const input = await getCropTableInputVal(row + 1, col + 1, page);
    const inputStr = await input.inputValue();
    await expect(inputStr).toBe(String(expectedVals[count])); // Have to explicitly cast to string even thought the type is string because playwright complains if a number is passed as string
    count++;
  }
};

export const loadVid = async (file: string, page: Page) => {
  const fileChooserPromise = page.waitForEvent("filechooser");
  await page.getByText("Click to select a file").click();
  const fileChooser = await fileChooserPromise;
  await fileChooser.setFiles(`${TestPath}${file}`);
};

export const loadCrops = async (file: string, page: Page) => {
  const fileChooserPromise = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: "Load Crop File" }).click();
  const fileChooser = await fileChooserPromise;
  await fileChooser.setFiles(`${TestPath}${file}`);
};
