const { chromium } = require('@playwright/test');
const config = require('./config');

let browser = null;
let sharedContext = null; // single browser context shared across all modules

async function getBrowser() {
  if (!browser) {
    browser = await chromium.launch({
      headless: config.browser.headless,
      args: ['--ignore-certificate-errors'],
    });
  }
  return browser;
}

async function getSharedContext() {
  if (!sharedContext) {
    const b = await getBrowser();
    sharedContext = await b.newContext({
      viewport: config.browser.viewport,
      ignoreHTTPSErrors: true,
    });
  }
  return sharedContext;
}

// Returns a new tab inside the shared (already logged-in) context
async function newPage() {
  const ctx = await getSharedContext();
  return ctx.newPage();
}

// Login once — called only at startup
async function loginOnce() {
  const { email, password } = config.auth;
  const ctx = await getSharedContext();
  const page = await ctx.newPage();

  await page.goto('https://saas.test.fideltour.com/crm/contacts', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);

  const passInput = page.locator('input[type="password"]').first();
  if (await passInput.count() > 0) {
    const emailInput = page.locator('input[type="email"], input[name="email"], input[name="username"], input[type="text"]').first();
    await emailInput.fill(email);
    await passInput.fill(password);
    await page.locator('button[type="submit"]').first().click();
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);
  }

  await page.close();
  console.log(`   ✅ Sesión iniciada como ${email}`);
}

async function closeBrowser() {
  if (browser) {
    await browser.close();
    browser = null;
    sharedContext = null;
  }
}

module.exports = { newPage, loginOnce, closeBrowser };
