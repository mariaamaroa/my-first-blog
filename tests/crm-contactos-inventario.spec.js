const { test } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

const OLD_BASE = 'https://grm.test.fideltour.com';
const EMAIL = 'mamaroa@fideltour.com';
const PASSWORD = process.env.FIDELTOUR_PASSWORD || '';

test('Antigua - inventario completo pestaña Contactos', async ({ page }) => {
  fs.mkdirSync('screenshots/contactos-inventario', { recursive: true });

  // Login
  await page.goto(OLD_BASE, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  const emailInput = page.locator('input[type="email"], input[name="email"], input[name="username"]').first();
  if (await emailInput.count() > 0) {
    await emailInput.fill(EMAIL);
    await page.locator('input[type="password"]').first().fill(PASSWORD);
    await page.locator('button[type="submit"]').click();
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);
  }

  // Ir a Contactos
  await page.goto(`${OLD_BASE}/contacts/`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);

  // Captura completa
  await page.screenshot({ path: 'screenshots/contactos-inventario/antigua-contactos-completa.png', fullPage: true });

  // Extraer inventario de elementos
  const inventario = await page.evaluate(() => {
    const resultado = {
      botones: [],
      columnas: [],
      filtros: [],
      enlaces: [],
      inputs: [],
    };

    // Botones
    document.querySelectorAll('button, a.btn, [class*="btn"]').forEach(el => {
      const texto = el.innerText?.trim();
      if (texto) resultado.botones.push(texto);
    });

    // Columnas de tabla
    document.querySelectorAll('th, [class*="column-header"], [class*="col-header"]').forEach(el => {
      const texto = el.innerText?.trim();
      if (texto) resultado.columnas.push(texto);
    });

    // Filtros
    document.querySelectorAll('select, input[type="search"], [class*="filter"], [class*="filtro"]').forEach(el => {
      const texto = el.placeholder || el.getAttribute('aria-label') || el.name || el.id;
      if (texto) resultado.filtros.push(texto);
    });

    // Inputs
    document.querySelectorAll('input, select').forEach(el => {
      const texto = el.placeholder || el.getAttribute('aria-label') || el.name || el.id;
      if (texto) resultado.inputs.push(texto);
    });

    // Eliminar duplicados
    Object.keys(resultado).forEach(k => {
      resultado[k] = [...new Set(resultado[k])].filter(Boolean);
    });

    return resultado;
  });

  // Guardar inventario en JSON y texto
  fs.writeFileSync('screenshots/contactos-inventario/inventario.json', JSON.stringify(inventario, null, 2));

  const resumen = Object.entries(inventario)
    .map(([k, v]) => `## ${k.toUpperCase()}\n${v.map(i => `- ${i}`).join('\n')}`)
    .join('\n\n');

  fs.writeFileSync('screenshots/contactos-inventario/inventario.txt', resumen);

  console.log('\n=== INVENTARIO CONTACTOS (ANTIGUA) ===');
  console.log(resumen);
  console.log('\n✅ Inventario guardado en screenshots/contactos-inventario/');
});
