import { Builder, By, Capabilities, logging, until } from "selenium-webdriver";
import chrome from "selenium-webdriver/chrome.js";

const BASE_URL = process.env.SELENIUM_BASE_URL ?? "https://surmakuulutus.ee";
const CHROME_BINARY =
  process.env.CHROME_BINARY ?? "C:/Program Files/Google/Chrome/Application/chrome.exe";
const HEADLESS = process.env.SELENIUM_HEADLESS === "1";
const KEEP_OPEN = process.env.SELENIUM_KEEP_OPEN === "1";
const TURNSTILE_INIT_TIMEOUT_MS = Number(process.env.TURNSTILE_INIT_TIMEOUT_MS ?? 30000);
const TURNSTILE_TOKEN_TIMEOUT_MS = Number(process.env.TURNSTILE_TOKEN_TIMEOUT_MS ?? 30000);

const results = [];

function record(name, passed, details = {}) {
  results.push({ name, passed, details });
  console.log(`${passed ? "PASS" : "FAIL"} ${name}`);
  if (Object.keys(details).length > 0) {
    console.log(JSON.stringify(details, null, 2));
  }
}

function skip(name, details = {}) {
  results.push({ name, skipped: true, details });
  console.log(`SKIP ${name}`);
  if (Object.keys(details).length > 0) {
    console.log(JSON.stringify(details, null, 2));
  }
}

function validAdPayload(turnstileToken) {
  return {
    name: "Selenium Test",
    email: "selenium@example.com",
    topText: "Teatame kurbusega",
    bottomText: "Leinavad omaksed",
    poem: "",
    turnstileToken,
    website: "",
  };
}

async function turnstileState(driver) {
  return driver.executeScript(() => {
    const field = document.querySelector(".turnstile-field");
    const responseInput = document.querySelector("input[name='cf-turnstile-response']");
    const frames = [
      ...document.querySelectorAll(
        "iframe[src*='challenges.cloudflare.com'], iframe[src*='turnstile']",
      ),
    ];
    const scripts = [...document.scripts].map((script) => script.src).filter(Boolean);

    return {
      windowTurnstileType: typeof window.turnstile,
      fieldPresent: Boolean(field),
      fieldHtml: field?.innerHTML ?? null,
      iframeCount: frames.length,
      iframeSources: frames.map((frame) => frame.src),
      responseInputPresent: Boolean(responseInput),
      responseTokenLength: responseInput?.value.length ?? 0,
      scriptUrls: scripts.filter((src) => src.includes("turnstile") || src.includes("cloudflare")),
    };
  });
}

function isTurnstileUrl(url = "") {
  return (
    url.includes("challenges.cloudflare.com") ||
    url.includes("turnstile") ||
    url.includes("/cdn-cgi/challenge-platform/")
  );
}

async function collectTurnstileDiagnostics(driver) {
  const diagnostics = {
    browserLogs: [],
    failedNetworkRequests: [],
    turnstileNetworkResponses: [],
  };

  try {
    const browserLogs = await driver.manage().logs().get(logging.Type.BROWSER);
    diagnostics.browserLogs = browserLogs
      .filter((entry) => {
        const message = entry.message ?? "";
        return isTurnstileUrl(message) || message.toLowerCase().includes("turnstile");
      })
      .map((entry) => ({
        level: entry.level?.name ?? String(entry.level),
        message: entry.message,
      }));
  } catch (error) {
    diagnostics.browserLogs = [{
      level: "WARNING",
      message: `Browser logs unavailable: ${error instanceof Error ? error.message : String(error)}`,
    }];
  }

  try {
    const performanceLogs = await driver.manage().logs().get(logging.Type.PERFORMANCE);

    for (const entry of performanceLogs) {
      const event = JSON.parse(entry.message).message;
      const params = event.params ?? {};
      const requestUrl =
        params.request?.url ??
        params.response?.url ??
        params.url ??
        "";

      if (!isTurnstileUrl(requestUrl)) {
        continue;
      }

      if (event.method === "Network.loadingFailed") {
        diagnostics.failedNetworkRequests.push({
          url: requestUrl,
          blockedReason: params.blockedReason,
          errorText: params.errorText,
          type: params.type,
        });
      }

      if (event.method === "Network.responseReceived") {
        diagnostics.turnstileNetworkResponses.push({
          url: requestUrl,
          status: params.response?.status,
          mimeType: params.response?.mimeType,
          fromDiskCache: params.response?.fromDiskCache,
        });
      }
    }
  } catch (error) {
    diagnostics.failedNetworkRequests.push({
      url: "performance-log",
      errorText: `Performance logs unavailable: ${error instanceof Error ? error.message : String(error)}`,
    });
  }

  return diagnostics;
}

async function fillRequiredFormFields(driver) {
  await driver.executeScript(() => {
    const visible = (element) => Boolean(
      element.offsetWidth ||
      element.offsetHeight ||
      element.getClientRects().length,
    );
    const setValue = (element, value) => {
      if (!element) {
        return false;
      }

      const descriptor = Object.getOwnPropertyDescriptor(element.constructor.prototype, "value");
      descriptor?.set?.call(element, value);
      element.dispatchEvent(new Event("input", { bubbles: true }));
      element.dispatchEvent(new Event("change", { bubbles: true }));
      return true;
    };
    const textInputs = [...document.querySelectorAll("input.mantine-Input-input")]
      .filter((element) => element.type === "text" && visible(element));
    const textareas = [...document.querySelectorAll("textarea.mantine-Input-input")]
      .filter(visible);

    setValue(textareas[0], "Teatame kurbusega");
    setValue(textInputs[0], "Selenium Test");
    setValue(textareas[2], "Leinavad omaksed");
    setValue(textInputs[3], "selenium@example.com");
  });
}

async function postProductionAd(body) {
  const response = await fetch(new URL("/api/ads", BASE_URL), {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: BASE_URL,
    },
    body: JSON.stringify(body),
  });

  return {
    status: response.status,
    body: await response.json().catch(() => null),
  };
}

async function runProductionApiChecks() {
  const missing = await postProductionAd(validAdPayload(undefined));
  record("production API rejects missing Turnstile token", missing.status === 400, missing);

  const honeypot = await postProductionAd({
    ...validAdPayload(undefined),
    website: "bot-filled-field",
  });
  record("production API rejects honeypot submissions", honeypot.status === 400, honeypot);

  skip("production API invalid-token rejection", {
    reason:
      "Skipped because sending a syntactically valid obituary with an invalid token could create a real production obituary if this protection were broken. The test suite must keep production data unchanged.",
  });

  skip("production API reused-token rejection", {
    reason:
      "Skipped because verifying token reuse requires a valid production Turnstile token and a first submit would create a real obituary.",
  });
}

const options = new chrome.Options()
  .setChromeBinaryPath(CHROME_BINARY)
  .addArguments(
    "--disable-gpu",
    "--no-sandbox",
    "--window-size=1365,900",
  );

if (HEADLESS) {
  options.addArguments("--headless=new");
}

const capabilities = Capabilities.chrome();
capabilities.set("goog:loggingPrefs", {
  browser: "ALL",
  performance: "ALL",
});

const driver = await new Builder()
  .forBrowser("chrome")
  .withCapabilities(capabilities)
  .setChromeOptions(options)
  .build();

try {
  await driver.get(BASE_URL);
  await driver.wait(until.elementLocated(By.css("h1")), 15000);

  const homeTitle = await driver.getTitle();
  const homeHeading = await driver.findElement(By.css("h1")).getText();
  record("production home page loads", homeHeading.length > 0, {
    baseUrl: BASE_URL,
    homeTitle,
    homeHeading,
  });

  await driver.get(new URL("/lisa-kuulutus", BASE_URL).toString());
  await driver.wait(until.elementLocated(By.css("form.newspaper-form")), 15000);

  const formHeading = await driver.findElement(By.css("h1")).getText();
  const fields = await driver.findElements(By.css("input, textarea"));
  const submitButton = await driver.findElement(By.css("button[type='submit']"));
  record("production obituary form loads", fields.length > 0, {
    formHeading,
    fieldCount: fields.length,
    submitText: await submitButton.getText(),
  });

  const initialized = await driver.wait(async () => {
    const state = await turnstileState(driver);
    return state.windowTurnstileType === "object" && state.responseInputPresent;
  }, TURNSTILE_INIT_TIMEOUT_MS).then(
    () => true,
    () => false,
  );

  const initializedState = await turnstileState(driver);
  record("Turnstile initializes", initialized, initializedState);

  const tokenGenerated = await driver.wait(async () => {
    const state = await turnstileState(driver);
    return state.responseTokenLength > 0;
  }, TURNSTILE_TOKEN_TIMEOUT_MS).then(
    () => true,
    () => false,
  );

  const finalTurnstileState = await turnstileState(driver);
  const turnstileDiagnostics = await collectTurnstileDiagnostics(driver);
  const turnstileDetails = {
    ...finalTurnstileState,
    diagnostics: turnstileDiagnostics,
  };

  record("Turnstile iframe is rendered", finalTurnstileState.iframeCount > 0, turnstileDetails);
  record("Turnstile response token is generated", tokenGenerated, turnstileDetails);

  if (finalTurnstileState.responseTokenLength === 0) {
    await fillRequiredFormFields(driver);
    await submitButton.click();

    const alert = await driver.wait(async () => {
      const alerts = await driver.findElements(By.css(".turnstile-error, [role='alert']"));
      for (const element of alerts) {
        const text = (await element.getText()).trim();
        if (text.length > 0) {
          return text;
        }
      }

      return false;
    }, 5000).then(
      (text) => text,
      () => "",
    );

    record("form blocks submission without Turnstile token", alert.length > 0, { alert });
  } else {
    skip("form blocks submission without Turnstile token", {
      reason:
        "A Turnstile token was already generated; the production test will not tamper with or bypass it.",
      responseTokenLength: finalTurnstileState.responseTokenLength,
    });
  }
} finally {
  if (!KEEP_OPEN) {
    await driver.quit();
  }
}

await runProductionApiChecks();

const failed = results.filter((result) => !result.passed && !result.skipped);
console.log(JSON.stringify({
  passed: results.filter((result) => result.passed).length,
  failed: failed.length,
  skipped: results.filter((result) => result.skipped).length,
}, null, 2));

if (failed.length > 0) {
  process.exitCode = 1;
}
