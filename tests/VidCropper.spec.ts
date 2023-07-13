import { test, expect } from "@playwright/test";
import {
  SingleCropBootstrap,
  TestPath,
  confirmRowMatch,
  confirmTableMatch,
  loadCrops,
  loadVid,
} from "./helpers";
import fs from "fs";
import { JsonObject } from "@/utils/data";

// TODO see about dealing with playwright flakiness https://hackernoon.com/how-to-fix-flaky-end-to-end-tests-with-playwright-and-reflow

// NOTE: Playwright uses chromium without codecs so this has to be run in Firefox for video loading to work

// Playwright seems to ignore this if the `Show Browser` option is ticked
test.describe.configure({ mode: "parallel" });

test.afterEach(async ({ page }) => {
  // This is required or playwright will fail to run any tests after the first
  page.close();
});

test("Slider Range Updates on Vid Load", async ({ page }) => {
  // This test is to ensure the range slider displays and updates on video load. For awhile there were some useEffect conflicts that caused the component to fail to render after range info was updates after video selection.
  await page.goto("http://localhost:3000/");
  await loadVid("gg1-short.mp4", page);

  const endTime = await page.locator("div.slider__right-value");
  expect(await endTime.evaluate((node) => node.textContent)).toBe(
    "00:00:00.35"
  );

  page.close();
});

test("Click/Drag on video creates a crop", async ({ page }) => {
  // Crops get converted from sizes dragged on a scaled video to their native resolution size
  // To help keep results consitent we'll fix the viewport size so the click location is always the same
  await page.setViewportSize({ width: 640, height: 480 });
  await page.goto("http://localhost:3000/");
  await loadVid("gg1-short.mp4", page);
  await page.getByText("Select Crop Areas").click();

  // Click and drag over the video to create a crop region
  const vid = await page.locator("video");
  await vid.dragTo(vid, {
    sourcePosition: { x: 1, y: 1 },
    targetPosition: { x: 25, y: 25 },
  });

  const x = await page.locator("table td:nth-child(2) input");
  const y = await page.locator("table td:nth-child(3) input");
  const w = await page.locator("table td:nth-child(4) input");
  const h = await page.locator("table td:nth-child(5) input");
  // Values are relative to available screen size when the drag was made
  // TODO i think playwright has a snapshot feature, might be better to snapshot these values on a blessed run and then run with the snapshot
  await expect(x).toHaveValue("3");
  await expect(y).toHaveValue("3");
  await expect(w).toHaveValue("72");
  await expect(h).toHaveValue("72");
});

test("Crop dragging is properly offset when scrolled", async ({ page }) => {
  // Crops get converted from sizes dragged on a scaled video to their native resolution size
  // To help keep results consitent we'll fix the viewport size so the click location is always the same
  await page.setViewportSize({ width: 640, height: 480 });
  await page.goto("http://localhost:3000/");
  await loadVid("gg1-short.mp4", page);
  await page.getByText("Select Crop Areas").click();
  await page.mouse.wheel(0, -1000);
  // Have to manually wait for playwright to scroll. It claims you can monitor scrollY, but this tip didn't work at all https://github.com/microsoft/playwright/issues/10002
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Guides say you can do this to scroll, but it doesn't seem to work at all
  // await page.evaluate(() => window.scrollTo(10, 10));

  // Might be able to do the click and drag easier with this, but i don't trust playwright to actually emulate a offset click and drag after a scroll with this syntax. Instead we'll use manual page level mouse commands to hopefully send real coordinates.
  // const vid = await page.locator("video");
  // await vid.dragTo(vid, {
  //   sourcePosition: { x: 1, y: 1 },
  //   targetPosition: { x: 25, y: 25 },
  // });

  // Drag a 50x50 crop region
  const size = 50;
  const startX = 20;
  const startY = 200;
  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(startX + size, startY + size);
  await page.mouse.up();

  // Scroll page
  const offset = 100;
  await page.mouse.wheel(0, offset);
  // Have to manually wait for playwright to scroll. It claims you can monitor scrollY, but this tip didn't work at all https://github.com/microsoft/playwright/issues/10002
  // TODO find a better way to programatically await the scroll. This will lead to flaky tets on laggy runs
  // TODO already had to increase delay because playwright is so unreliable, really need to programatically delay this
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Drag the same region after scrolling
  await page.mouse.move(startX, startY - offset);
  await page.mouse.down();
  await page.mouse.move(startX + size, startY + size - offset);
  await page.mouse.up();

  // Verify that the 1st and 2nd row of crop values match
  const xCol = 1;
  const heightCol = 4;
  await confirmTableMatch(0, 1, xCol, heightCol, page);
});

test("Crop Delete", async ({ page }) => {
  await page.setViewportSize({ width: 640, height: 480 });
  await page.goto("http://localhost:3000/");
  const rows = page.locator("table tbody tr");

  // Create a crop
  await SingleCropBootstrap(page);
  await expect(rows).toHaveCount(1);

  // Click Delete
  await page.getByRole("table").getByRole("button").first().click();
  await expect(rows).toHaveCount(0);
});

test("Crop Load", async ({ page }) => {
  await page.setViewportSize({ width: 640, height: 480 });
  await page.goto("http://localhost:3000/");
  await loadVid("gg1-short.mp4", page);
  const file = "gg_L_full_row_0.json";
  await loadCrops(file, page);
  // TODO crop file format is kinda loose so the json parsing of the test file might need some updating if things change
  // This attempts to load the FrameSlice save format and then falls back to the Frames server format.
  var json = JSON.parse(fs.readFileSync(`${TestPath}${file}`).toString());
  const promises = json.map((obj: JsonObject, row: number) => {
    const { name, x, y, width, height, presetName, crop } = obj;
    const cropObj = crop as JsonObject;
    const { xOff, yOff, cropW, cropH } = cropObj;
    const vals = {
      name: (name ?? presetName ?? "NO_VAL_FOUND") as string,
      x: String(x ?? xOff ?? "NO_VALFOUND"),
      y: String(y ?? yOff ?? "NO_VALFOUND"),
      width: String(width ?? cropW ?? "NO_VALFOUND"),
      height: String(height ?? cropH ?? "NO_VALFOUND"),
    };

    return confirmRowMatch(
      row,
      0,
      4,
      [vals.name, vals.x, vals.y, vals.width, vals.height],
      page
    );
  });

  // Wait for all values to be checked
  await Promise.all(promises);
});

test("Crop Output", async ({ page }) => {
  await page.goto("http://localhost:3000/");

  // Load video and Crops
  await loadVid("gg1-short.mp4", page);
  const file = "gg_L_full_row_0.json";
  await loadCrops(file, page);

  // Crop Vid
  await page.getByRole("button", { name: "Crop Video" }).click();

  const LabelCrops = page
    .locator("div")
    .filter({ hasText: /^Crop Results$/ })
    .getByRole("button", { name: "Label Crops" });
  const DlCrops = page.getByRole("button", { name: "Download Crops" });

  // Check for expected crop results (this is specific to the cropFile we loaded).
  const crops = page.getByText(
    "gg_dir_L_0_0gg_dir_L_0_1gg_dir_L_0_2gg_dir_L_0_3"
  );
  await crops.waitFor(); // Playwright dies on the next line w/o this.
  await expect(crops).toBeVisible();

  // Ensure Download and Label Crops buttons are shown
  await expect(DlCrops).toBeVisible();
  await expect(LabelCrops).toBeVisible();

  await expect(crops).toHaveScreenshot(`CropOutput.png`, { timeout: 10000 });
});

// TODO add a test for label editor and download labels
