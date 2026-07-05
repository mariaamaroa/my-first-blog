const { chromium } = require('@playwright/test');
const config = require('./config');

let browser = null;

async function getBrowser() {
  if (!browser) {
    browser = await chromium.launch({
      headless: config.browser.headless,
      args: ['--ignore-certificate-errors'],
    });
  }
  return browser;
}

async function newPage() {
  const b = await getBrowser();
  const ctx = await b.newContext({
    viewport: config.browser.viewport,
    ignoreHTTPSErrors: true,
  });
  return ctx.newPage();
}

async function login(page) {
  const { email, password } = config.auth;
  // Start from CRM to avoid root URL issues
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
}

async function closeBrowser() {
  if (browser) {
    await browser.close();
    browser = null;
  }
}

module.exports = { newPage, login, closeBrowser };
