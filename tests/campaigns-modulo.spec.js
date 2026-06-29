const { test } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

const NEW_BASE = 'https://saas.test.fideltour.com';
const OLD_BASE = 'https://marketing.test.fideltour.com';
const EMAIL = 'mamaroa@fideltour.com';
const PASSWORD = process.env.FIDELTOUR_PASSWORD || '';

const TABS = ['Dashboard', 'Analytics', 'Campañas', 'Plantillas', 'Configuración'];

async function login(page, baseUrl) {
  await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  const emailInput = page.locator('input[type="email"], input[name="email"], input[name="username"]').first();
  if (await emailInput.count() > 0) {
    await emailInput.fill(EMAIL);
    await page.locator('input[type="password"]').first().fill(PASSWORD);
    await page.locator('button[type="submit"]').click();
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);
  }
}

test('Nueva plataforma - Campaigns todas las pestañas', async ({ page }) => {
  fs.mkdirSync('screenshots/campaigns-nueva', { recursive: true });

  await login(page, NEW_BASE);
  await page.goto(`${NEW_BASE}/marketing/campaigns`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);

  for (const tab of TABS) {
    const tabLink = page.locator(`a:has-text("${tab}"), button:has-text("${tab}")`).filter({ visible: true }).first();
    if (await tabLink.count() > 0) {
      await tabLink.click();
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(2000);
      const filename = tab.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, '-');
      await page.screenshot({ path: path.join('screenshots/campaigns-nueva', `${filename}.png`), fullPage: true });
      console.log(`✅ Nueva — ${tab} capturado`);
    } else {
      console.log(`⚠️  Nueva — pestaña "${tab}" no encontrada`);
      await page.screenshot({ path: path.join('screenshots/campaigns-nueva', `${tab.toLowerCase()}-no-encontrado.png`), fullPage: true });
    }
  }
});

test('Antigua plataforma - Campaigns todas las pestañas', async ({ page }) => {
  fs.mkdirSync('screenshots/campaigns-antigua', { recursive: true });

  await login(page, OLD_BASE);
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'screenshots/campaigns-antigua/home.png', fullPage: true });

  for (const tab of TABS) {
    const tabLink = page.locator(`a.menu-link:has(span.menu-text:text-is("${tab}"))`).filter({ visible: true }).first();
    if (await tabLink.count() > 0) {
      await tabLink.click();
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(2000);
      const filename = tab.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, '-');
      await page.screenshot({ path: path.join('screenshots/campaigns-antigua', `${filename}.png`), fullPage: true });
      console.log(`✅ Antigua — ${tab} capturado`);
    } else {
      console.log(`⚠️  Antigua — pestaña "${tab}" no encontrada`);
      await page.screenshot({ path: path.join('screenshots/campaigns-antigua', `${tab.toLowerCase()}-no-encontrado.png`), fullPage: true });
    }
  }
});
