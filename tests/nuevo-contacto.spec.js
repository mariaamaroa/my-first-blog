const { test } = require('@playwright/test');
const path = require('path');

const NEW_PLATFORM = 'https://saas.test.fideltour.com';
const OLD_PLATFORM = 'https://grm.test.fideltour.com';

const EMAIL = 'mamaroa@fideltour.com';
const PASSWORD = process.env.FIDELTOUR_PASSWORD || '';

async function login(page, baseUrl) {
  await page.goto(baseUrl, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  const emailInput = page.locator('input[type="email"], input[name="email"], input[name="username"]').first();
  if (await emailInput.count() > 0) {
    await emailInput.fill(EMAIL);
    await page.locator('input[type="password"]').first().fill(PASSWORD);
    await page.locator('button[type="submit"]').click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
  }
}

test('Nueva plataforma - Formulario nuevo contacto', async ({ page }) => {
  await login(page, NEW_PLATFORM);

  // Ir a contactos
  await page.goto(`${NEW_PLATFORM}/crm/contacts`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join('screenshots', 'nueva-contactos-lista.png'), fullPage: true });

  // Pulsar botón nuevo contacto
  const btnNuevo = page.locator('button:has-text("Nuevo"), button:has-text("New"), button:has-text("Crear"), a:has-text("Nuevo contacto"), a:has-text("New contact")').first();
  if (await btnNuevo.count() > 0) {
    await btnNuevo.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join('screenshots', 'nueva-nuevo-contacto-form.png'), fullPage: true });
    console.log('✅ Nueva — formulario nuevo contacto capturado');
  } else {
    console.log('⚠️  Nueva — no se encontró botón de nuevo contacto');
    await page.screenshot({ path: path.join('screenshots', 'nueva-nuevo-contacto-debug.png'), fullPage: true });
  }
});

test('Antigua plataforma - Formulario nuevo contacto', async ({ page }) => {
  await login(page, OLD_PLATFORM);

  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join('screenshots', 'antigua-contactos-lista.png'), fullPage: true });

  // Buscar enlace CRM/Contactos en el menú
  const crmLink = page.locator('a:has-text("CRM"), a:has-text("Contactos"), nav a[href*="crm"], nav a[href*="contact"]').first();
  if (await crmLink.count() > 0) {
    await crmLink.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join('screenshots', 'antigua-contactos-lista2.png'), fullPage: true });
  }

  // Pulsar botón nuevo contacto
  const btnNuevo = page.locator('button:has-text("Nuevo"), button:has-text("New"), button:has-text("Crear"), a:has-text("Nuevo contacto"), a:has-text("New contact")').first();
  if (await btnNuevo.count() > 0) {
    await btnNuevo.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join('screenshots', 'antigua-nuevo-contacto-form.png'), fullPage: true });
    console.log('✅ Antigua — formulario nuevo contacto capturado');
  } else {
    console.log('⚠️  Antigua — no se encontró botón de nuevo contacto');
    await page.screenshot({ path: path.join('screenshots', 'antigua-nuevo-contacto-debug.png'), fullPage: true });
  }
});
