import assert from "node:assert/strict";
import { spawn, execFile } from "node:child_process";
import { promisify } from "node:util";
import { createServer } from "node:net";
import { setTimeout as delay } from "node:timers/promises";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import mongoose from "mongoose";
import { Builder, By, until } from "selenium-webdriver";
import chrome from "selenium-webdriver/chrome.js";

// Always creates its own database/server. Never accepts a remote site or database URI.
const database = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
const socket = createServer();
await new Promise((resolve) => socket.listen(0, "127.0.0.1", resolve));
const port = socket.address().port;
await new Promise((resolve) => socket.close(resolve));
const baseURL = `http://localhost:${port}`;
const env = {
  ...process.env, NODE_ENV: "development", MONGO_URI: database.getUri("browser_tests"),
  ADMIN_EMAIL: "browser@example.test", ADMIN_PASSWORD: "isolated-browser-password-123",
  BETTER_AUTH_SECRET: "isolated-browser-secret-at-least-32-characters", BETTER_AUTH_URL: baseURL,
  NEXT_PUBLIC_SITE_URL: baseURL, NEXT_PUBLIC_TURNSTILE_SITE_KEY: "",
};
let server;
let driver;
let serverOutput = "";
try {
  await promisify(execFile)(process.execPath, ["scripts/setup-admin.mjs"], { env });
  await mongoose.connect(env.MONGO_URI);
  const inserted = await mongoose.connection.db.collection("ads").insertOne({
    name: "Browser Pending", email: "submitter@example.test", slug: "browser-pending", status: "pending",
    topText: "Mälestuseks", bottomText: "Leinavad lähedased", poem: "Esimene rida\\nTeine rida", aiGenerated: false,
    createdAt: new Date(), updatedAt: new Date(), __v: 0,
  });
  const id = inserted.insertedId.toString();
  server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "dev", "--port", String(port)], {
    env, windowsHide: true, stdio: ["ignore", "pipe", "pipe"],
  });
  for (const stream of [server.stdout, server.stderr]) stream.on("data", (chunk) => { serverOutput = (serverOutput + chunk).slice(-8000); });
  let ready = false;
  for (let i = 0; i < 60; i++) {
    try { if ((await fetch(`${baseURL}/admin`)).ok) { ready = true; break; } } catch { /* Wait for local server startup. */ }
    await delay(500);
  }
  assert(ready, "Local admin server did not start");
  const options = new chrome.Options().addArguments("--headless=new", "--window-size=1365,1000");
  options.setChromeBinaryPath(process.env.CHROME_BINARY ?? "C:/Program Files/Google/Chrome/Application/chrome.exe");
  driver = await new Builder().forBrowser("chrome").setChromeOptions(options).build();
  const button = (label) => driver.findElement(By.xpath(`//button[normalize-space(.)='${label}']`));
  const waitText = (text) => driver.wait(async () => (await driver.findElement(By.css("body")).getText()).includes(text), 20_000);

  await driver.get(`${baseURL}/admin/kuulutused`);
  await driver.wait(until.elementLocated(By.css("input[name=email]")), 20_000);
  assert.equal(await driver.getCurrentUrl(), `${baseURL}/admin`);
  assert.equal((await fetch(`${baseURL}/api/admin/kuulutused`)).status, 401);
  assert.equal((await fetch(`${baseURL}/api/ads/browser-pending`)).status, 404);
  await driver.findElement(By.css("input[name=email]")).sendKeys(env.ADMIN_EMAIL);
  await driver.findElement(By.css("input[name=password]")).sendKeys(env.ADMIN_PASSWORD);
  await (await button("Logi sisse")).click();
  await waitText("Ülevaade");
  await driver.wait(until.elementLocated(By.css(".admin-nav")), 20_000);
  await driver.wait(until.elementLocated(By.css(".newspaper-nav-actions a[href='/admin']")), 10_000);
  await waitText("Browser Pending");
  assert((await fetch(`${baseURL}/admin`)).headers.get("cache-control").includes("no-store"));

  await driver.get(`${baseURL}/admin/kuulutused?search=Browser&status=pending&source=manual&sort=oldest`);
  await driver.wait(until.elementLocated(By.css("table tbody tr")), 20_000);
  assert.equal((await driver.findElements(By.css("table tbody tr"))).length, 1);
  await driver.findElement(By.linkText("Halda")).click();
  await driver.wait(until.elementLocated(By.css(".newspaper-form")), 20_000);
  await (await button("Avalda")).click();
  await waitText("Muudatused salvestatud.");
  assert.equal((await fetch(`${baseURL}/api/ads/browser-pending`)).status, 200);
  await driver.get(`${baseURL}/kuulutused/browser-pending`);
  const poem = await driver.wait(until.elementLocated(By.css(".newspaper-poem")), 20_000);
  assert.equal(await poem.getText(), "Esimene rida\nTeine rida");
  await driver.get(`${baseURL}/admin/kuulutused/${id}`);
  await driver.wait(until.elementLocated(By.css(".newspaper-form")), 20_000);
  await (await button("Arhiveeri")).click();
  await waitText("Muudatused salvestatud.");
  assert.equal((await fetch(`${baseURL}/api/ads/browser-pending`)).status, 404);
  await (await button("Kustuta")).click();
  await driver.wait(until.elementLocated(By.css("[role=dialog]")), 5000);
  await (await button("Kinnita kustutamine")).click();
  await driver.wait(until.elementLocated(By.xpath("//button[normalize-space(.)='Taasta arhiivi']")), 10_000);
  await (await button("Taasta arhiivi")).click();
  await driver.wait(until.elementLocated(By.css(".newspaper-form")), 10_000);
  await driver.get(`${baseURL}/admin/logi`);
  await waitText("archive");
  await waitText("delete");
  await waitText("restore");
  await driver.findElement(By.css(".theme-image-button")).click();
  await driver.wait(async () => (await driver.findElement(By.css("html")).getAttribute("data-mantine-color-scheme")) === "light", 5000);
  await driver.manage().window().setRect({ width: 390, height: 844 });
  assert.equal(await driver.executeScript("return document.documentElement.scrollWidth <= window.innerWidth"), true);
  await (await button("Logi välja")).click();
  await driver.wait(until.elementLocated(By.css("input[name=password]")), 10_000);
  assert.equal((await driver.findElements(By.css(".newspaper-nav-actions a[href='/admin']"))).length, 0);
  await driver.get(`${baseURL}/admin/kuulutused`);
  await driver.wait(until.elementLocated(By.css("input[name=password]")), 10_000);
  await (await button("EN")).click();
  await driver.wait(async () => await driver.findElement(By.css("html")).getAttribute("lang") === "en", 5000);
  console.log("PASS isolated browser smoke: access, login, dashboard, combined filters, approval, public detail, poem breaks, archive, confirmed deletion, recovery, audit log, logout, language, theme, mobile overflow.");
} catch (error) {
  console.error(error);
  console.error(serverOutput);
  process.exitCode = 1;
} finally {
  await driver?.quit();
  server?.kill();
  await mongoose.disconnect();
  await database.stop();
}
