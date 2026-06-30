const { test } = require('@playwright/test');
const fs = require('fs');

const NEW_BASE = 'https://saas.test.fideltour.com';
const OLD_BASE = 'https://grm.test.fideltour.com';
const EMAIL = 'mamaroa@fideltour.com';
const PASSWORD = process.env.FIDELTOUR_PASSWORD || '';

async function login(page, startUrl) {
  await page.goto(startUrl, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  const passInput = page.locator('input[type="password"]').first();
  if (await passInput.count() > 0) {
    const emailInput = page.locator('input[type="email"], input[name="email"], input[name="username"], input[type="text"]').first();
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

  // Login starting from CRM contacts (avoids root URL crash)
  await login(page, `${NEW_BASE}/crm/contacts`);

  // Navigate directly to new contact form
  await page.goto(`${NEW_BASE}/crm/contacts/new`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);
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
});

test('Antigua — descubrir formulario nuevo contacto', async ({ page }) => {
  fs.mkdirSync('screenshots/contacto-form', { recursive: true });

  await login(page, `${OLD_BASE}/contacts/`);

  // Click the create new contact button to open the form/modal
  const btnNuevo = page.locator('a[href*="add"], a[href*="new"], a[href*="create"]').filter({ visible: true }).first();
  if (await btnNuevo.count() > 0) {
    await btnNuevo.click();
  } else {
    // Try button with text
    const btnTexto = page.locator('button, a').filter({ hasText: /^\+?\s*(contacto|contact|nuevo|new)$/i }).filter({ visible: true }).first();
    if (await btnTexto.count() > 0) {
      await btnTexto.click();
    }
  }

  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'screenshots/contacto-form/antigua-formulario.png', fullPage: true });

  // Scope to the form or main content, excluding sidebars/filters
  const campos = await page.evaluate(() => {
    // Prefer a <form> with POST method or an add/create/edit page container
    const form = document.querySelector('form[method="post"], form[action*="add"], form[action*="create"], form[action*="new"]')
      || document.querySelector('main form, .content form, #content form, [class*="form-container"], [class*="add-form"]')
      || document.querySelector('form');
    const container = form || document.body;
    const campos = [];
    container.querySelectorAll('input, select, textarea').forEach(el => {
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

  fs.writeFileSync('screenshots/contacto-form/antigua-campos.json', JSON.stringify(campos, null, 2));

  console.log('\n=== CAMPOS FORMULARIO ANTIGUA ===');
  campos.forEach(c => {
    const req = c.obligatorio ? ' [OBLIGATORIO]' : '';
    const max = c.maxLength ? ` [max:${c.maxLength}]` : '';
    console.log(`  ${c.tipo.padEnd(10)} ${c.nombre}${req}${max}`);
  });
  console.log(`\nTotal: ${campos.length} campos`);
});
