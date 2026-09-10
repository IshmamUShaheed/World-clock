const { chromium } = require("C:/Users/iushs/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");
const TEST_URL = process.env.TEST_URL || "http://localhost:3000";

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"
  });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 }, deviceScaleFactor: 1 });
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(TEST_URL, { waitUntil: "networkidle" });
  await page.selectOption("#anchor-select", "ottawa");
  await page.fill("#time-input", "2026-12-18T09:30");
  await page.locator("#time-input").dispatchEvent("change");
  await page.screenshot({ path: "qa-home.png", fullPage: true });
  const cards = await page.locator(".clock-card").count();
  const dialogOpened = await page.locator("#capture-button").click().then(async () => {
    await page.locator("#share-dialog[open]").waitFor();
    return true;
  });
  const previewReady = (await page.locator("#snapshot-preview").getAttribute("src"))?.startsWith("blob:");
  await page.locator("#dialog-close").click();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: "qa-mobile.png", fullPage: true });
  const hasHorizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  console.log(JSON.stringify({ cards, dialogOpened, previewReady, hasHorizontalOverflow, errors }));
  await browser.close();
  if (cards !== 4 || !dialogOpened || !previewReady || hasHorizontalOverflow || errors.length) process.exitCode = 1;
})();
