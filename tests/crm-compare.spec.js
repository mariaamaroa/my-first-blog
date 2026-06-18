const { test, expect } = require('@playwright/test');
const path = require('path');

const NEW_PLATFORM = 'https://saas.test.fideltour.com';
const OLD_PLATFORM = 'https://marketing.fideltour.com';

const CREDENTIALS = {
  email: 'mamaroa@fideltour.com',
  password: process.env.FIDELTOUR_PASSWORD || '',
};

test.describe('CRM - Comparativa plataforma nueva vs antigua', () => {

  test('Nueva plataforma - CRM Contactos', async ({ page }) => {
    await page.goto(`${NEW_PLATFORM}/crm/contacts`, { waitUntil: 'networkidle' });

    // Si hay login, intentar autenticar
    if (page.url().includes('login') || page.url().includes('signin')) {
      await page.fill('input[type="email"], input[name="email"], input[name="username"]', CREDENTIALS.email);
      if (CREDENTIALS.password) {
        await page.fill('input[type="password"]', CREDENTIALS.password);
        await page.click('button[type="submit"]');
        await page.waitForNavigation({ waitUntil: 'networkidle' });
      } else {
        console.log('⚠️  Se requiere contraseña. Pasa FIDELTOUR_PASSWORD como variable de entorno.');
      }
    }

    await page.screenshot({
      path: path.join('screenshots', 'nueva-crm-contactos.png'),
      fullPage: true,
    });

    console.log('✅ Captura nueva plataforma CRM guardada');
  });

  test('Antigua plataforma - CRM Contactos', async ({ page }) => {
    await page.goto(`${OLD_PLATFORM}`, { waitUntil: 'networkidle' });

    // Si hay login, intentar autenticar
    if (page.url().includes('login') || page.url().includes('signin')) {
      await page.fill('input[type="email"], input[name="email"], input[name="username"]', CREDENTIALS.email);
      if (CREDENTIALS.password) {
        await page.fill('input[type="password"]', CREDENTIALS.password);
        await page.click('button[type="submit"]');
        await page.waitForNavigation({ waitUntil: 'networkidle' });
      } else {
        console.log('⚠️  Se requiere contraseña. Pasa FIDELTOUR_PASSWORD como variable de entorno.');
      }
    }

    // Navegar al módulo CRM si hay menú
    const crmLink = page.locator('a:has-text("CRM"), a:has-text("Contactos"), nav a[href*="crm"], nav a[href*="contact"]').first();
    if (await crmLink.count() > 0) {
      await crmLink.click();
      await page.waitForLoadState('networkidle');
    }

    await page.screenshot({
      path: path.join('screenshots', 'antigua-crm-contactos.png'),
      fullPage: true,
    });

    console.log('✅ Captura antigua plataforma CRM guardada');
  });

});
