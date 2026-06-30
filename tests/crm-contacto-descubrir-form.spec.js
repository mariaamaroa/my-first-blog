const { test } = require('@playwright/test');
const fs = require('fs');

const NEW_BASE = 'https://saas.test.fideltour.com';
const OLD_BASE = 'https://grm.test.fideltour.com';
const EMAIL = 'mamaroa@fideltour.com';
const PASSWORD = process.env.FIDELTOUR_PASSWORD || '';

async function login(page, baseUrl) {
  await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  const emailInput = page.locator('input[type="email"], input[name="email"], input[name="username"], input[type="text"]').first();
  const passInput = page.locator('input[type="password"]').first();
  if (await passInput.count() > 0) {
    await emailInput.fill(EMAIL);
    await passInput.fill(PASSWORD);
    await page.locator('button[type="submit"]').first().click();
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);
  }
}

async function descubrirFormulario(page) {
  return await page.evaluate(() => {
    const campos = [];
    document.querySelectorAll('input, select, textarea').forEach(el => {
      if (el.type === 'hidden' || el.type === 'submit') return;
      campos.push({
        tipo: el.tagName.toLowerCase() === 'select' ? 'select' : el.type || 'text',
        nombre: el.name || el.id || el.getAttribute('aria-label') || el.placeholder || '(sin nombre)',
        placeholder: el.placeholder || '',
        obligatorio: el.required,
        maxLength: el.maxLength > 0 ? el.maxLength : null,
        opciones: el.tagName === 'SELECT' ? [...el.options].map(o => o.text) : null,
      });
    });
    return campos;
  });
}

test('Nueva — descubrir formulario nuevo contacto', async ({ page }) => {
  fs.mkdirSync('screenshots/contacto-form', { recursive: true });

  await login(page, NEW_BASE);
  await page.goto(`${NEW_BASE}/crm/contacts`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);

  // Buscar botón nuevo contacto
  const btnNuevo = page.locator('button, a').filter({ hasText: /contacto|contact/i }).filter({ visible: true }).first();
  if (await btnNuevo.count() > 0) {
    await btnNuevo.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/contacto-form/nueva-formulario.png', fullPage: true });

    const campos = await descubrirFormulario(page);
    fs.writeFileSync('screenshots/contacto-form/nueva-campos.json', JSON.stringify(campos, null, 2));

    console.log('\n=== CAMPOS FORMULARIO NUEVA ===');
    campos.forEach(c => {
      const req = c.obligatorio ? ' [OBLIGATORIO]' : '';
      const max = c.maxLength ? ` [max:${c.maxLength}]` : '';
      console.log(`  ${c.tipo.padEnd(10)} ${c.nombre}${req}${max}`);
    });
    console.log(`\nTotal: ${campos.length} campos`);
  } else {
    console.log('⚠️ No se encontró botón de nuevo contacto');
    await page.screenshot({ path: 'screenshots/contacto-form/nueva-sin-boton.png', fullPage: true });
  }
});

test('Antigua — descubrir formulario nuevo contacto', async ({ page }) => {
  fs.mkdirSync('screenshots/contacto-form', { recursive: true });

  await login(page, OLD_BASE);
  await page.goto(`${OLD_BASE}/contacts/`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);

  const btnNuevo = page.locator('button, a').filter({ hasText: /contacto|contact/i }).filter({ visible: true }).first();
  if (await btnNuevo.count() > 0) {
    await btnNuevo.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/contacto-form/antigua-formulario.png', fullPage: true });

    const campos = await descubrirFormulario(page);
    fs.writeFileSync('screenshots/contacto-form/antigua-campos.json', JSON.stringify(campos, null, 2));

    console.log('\n=== CAMPOS FORMULARIO ANTIGUA ===');
    campos.forEach(c => {
      const req = c.obligatorio ? ' [OBLIGATORIO]' : '';
      const max = c.maxLength ? ` [max:${c.maxLength}]` : '';
      console.log(`  ${c.tipo.padEnd(10)} ${c.nombre}${req}${max}`);
    });
    console.log(`\nTotal: ${campos.length} campos`);
  } else {
    console.log('⚠️ No se encontró botón de nuevo contacto');
    await page.screenshot({ path: 'screenshots/contacto-form/antigua-sin-boton.png', fullPage: true });
  }
});
