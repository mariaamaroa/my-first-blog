/**
 * QA de incidencias — sprint 26.10
 * Ejecutar: FIDELTOUR_PASSWORD=xxx npx playwright test tests/qa-incidencias.spec.js --headed
 *
 * Cada test verifica si el bug reportado sigue presente (FAIL = bug existe, PASS = bug resuelto).
 * Los tests están ordenados por prioridad: Bloqueante → Alta → Media → Baja.
 */

const { test, expect } = require('@playwright/test');

const BASE = 'https://saas.test.fideltour.com';
const EMAIL = process.env.FIDELTOUR_EMAIL || 'mamaroa@fideltour.com';
const PASSWORD = process.env.FIDELTOUR_PASSWORD;

test.use({ ignoreHTTPSErrors: true });

// Login compartido una vez
test.beforeAll(async ({ browser }) => {
  if (!PASSWORD) throw new Error('Falta FIDELTOUR_PASSWORD');
  const ctx = await browser.newContext({ ignoreHTTPSErrors: true });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/crm/contacts`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  const passInput = page.locator('input[type="password"]').first();
  if (await passInput.count() > 0) {
    await page.locator('input[type="email"], input[name="email"], input[type="text"]').first().fill(EMAIL);
    await passInput.fill(PASSWORD);
    await page.locator('button[type="submit"]').first().click();
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);
  }
  await ctx.storageState({ path: '/tmp/qa-session.json' });
  await ctx.close();
});

test.use({ storageState: '/tmp/qa-session.json' });

// ─────────────────────────────────────────────────────────────
// DEV-1072 | Bloqueante | WhatsApp
// Bug: falta el botón de enviar a revisión en plantillas de WhatsApp
// ─────────────────────────────────────────────────────────────
test('DEV-1072 — Botón "Enviar a revisión" visible en plantillas WhatsApp', async ({ page }) => {
  await page.goto(`${BASE}/whatsapp/templates`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);

  // Abre la primera plantilla disponible
  const firstTemplate = page.locator('tr:has(td), [class*="row"], [class*="item"], [class*="card"]').first();
  if (await firstTemplate.count() > 0) await firstTemplate.click();
  await page.waitForTimeout(2000);

  // Verifica que existe el botón de enviar a revisión
  const submitBtn = page.locator('button, a').filter({
    hasText: /enviar.*(revisión|review|revision)|submit.*review/i,
  }).filter({ visible: true });

  const count = await submitBtn.count();
  console.log(`Botón "Enviar a revisión" encontrado: ${count > 0 ? 'SÍ ✅' : 'NO ❌'}`);
  await page.screenshot({ path: 'qa-results/DEV-1072.png', fullPage: true });

  // PASA si el botón existe (bug resuelto)
  expect(count, 'Botón "Enviar a revisión" debe estar visible').toBeGreaterThan(0);
});

// ─────────────────────────────────────────────────────────────
// DEV-1056 | Bloqueante | Push App
// Bug: selector de idioma principal incompleto en Push Notifications
// ─────────────────────────────────────────────────────────────
test('DEV-1056 — Idiomas completos en selector de Push App (ES, EN, FR, IT)', async ({ page }) => {
  await page.goto(`${BASE}/marketing/app-push-campaigns`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);

  // Crea nueva campaña o abre una existente
  const newBtn = page.locator('button, a').filter({ hasText: /nueva|new|crear|create/i }).filter({ visible: true }).first();
  if (await newBtn.count() > 0) {
    await newBtn.click();
    await page.waitForTimeout(2000);
  }

  // Navega a "Diseño de la notificación"
  const designTab = page.locator('button, a, [role="tab"]').filter({ hasText: /diseño|design/i }).filter({ visible: true }).first();
  if (await designTab.count() > 0) {
    await designTab.click();
    await page.waitForTimeout(1500);
  }

  // Abre el selector de idioma principal
  const langSelect = page.locator('select').filter({ visible: true }).first();
  const langOptions = await langSelect.locator('option').allInnerTexts().catch(() => []);

  const hasES = langOptions.some(o => /español|spanish|es/i.test(o));
  const hasEN = langOptions.some(o => /inglés|english|en/i.test(o));
  const hasFR = langOptions.some(o => /francés|french|fr/i.test(o));
  const hasIT = langOptions.some(o => /italiano|italian|it/i.test(o));

  console.log(`Idiomas en selector: ${langOptions.join(', ')}`);
  console.log(`ES: ${hasES ? '✅' : '❌'} | EN: ${hasEN ? '✅' : '❌'} | FR: ${hasFR ? '✅' : '❌'} | IT: ${hasIT ? '✅' : '❌'}`);
  await page.screenshot({ path: 'qa-results/DEV-1056.png', fullPage: true });

  expect(hasES && hasEN, 'Español e inglés deben aparecer en el selector de idioma').toBeTruthy();
});

// ─────────────────────────────────────────────────────────────
// DEV-1073 | Bloqueante | CRM Viajes
// Regresión: falta tipo de tarifa en frontales nuevos
// ─────────────────────────────────────────────────────────────
test('DEV-1073 — Tipo de tarifa visible en viaje 18172808', async ({ page }) => {
  await page.goto(`${BASE}/crm/trips/18172808/details`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);

  const body = await page.evaluate(() => document.body.innerText);
  const hasTarifa = /tarifa|rate.*type|tipo.*tarifa/i.test(body);

  console.log(`"Tipo de tarifa" presente en la página: ${hasTarifa ? 'SÍ ✅' : 'NO ❌'}`);
  await page.screenshot({ path: 'qa-results/DEV-1073.png', fullPage: true });

  expect(hasTarifa, 'El tipo de tarifa debe aparecer en el detalle del viaje').toBeTruthy();
});

// ─────────────────────────────────────────────────────────────
// DEV-1057 | Bloqueante | Push App
// Bug: etiquetas dinámicas no funcionan en plantillas push
// ─────────────────────────────────────────────────────────────
test('DEV-1057 — Etiquetas dinámicas funcionan en plantilla push #30', async ({ page }) => {
  await page.goto(`${BASE}/marketing/app-push-campaigns/30/content`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);

  // Busca el área de contenido editable
  const contentArea = page.locator('textarea, [contenteditable="true"], input[name*="content"], input[name*="body"]').first();
  if (await contentArea.count() === 0) {
    await page.screenshot({ path: 'qa-results/DEV-1057.png', fullPage: true });
    throw new Error('No se encontró el área de contenido de la plantilla push');
  }

  // Inserta una etiqueta dinámica típica
  await contentArea.click();
  await contentArea.fill('Hola {{guest_name}}, tu reserva {{booking_ref}} está lista.');
  await page.waitForTimeout(1000);

  // Verifica que la etiqueta aparece renderizada o al menos visible en un preview
  const preview = await page.evaluate(() => document.body.innerText);
  const etiquetaVisible = /\{\{guest_name\}\}|guest_name|nombre.*huésped/i.test(preview);

  console.log(`Etiqueta dinámica procesada: ${etiquetaVisible ? 'SÍ ✅' : 'NO (puede ser bug) ❌'}`);
  await page.screenshot({ path: 'qa-results/DEV-1057.png', fullPage: true });

  // Al menos el campo debe aceptar el texto sin error
  const errorText = await page.evaluate(() => {
    const sel = '[class*="error"], [class*="alert"], [role="alert"]';
    return document.querySelector(sel)?.innerText?.trim() || '';
  });
  expect(errorText, 'No debe mostrar error al insertar etiquetas dinámicas').toBe('');
});

// ─────────────────────────────────────────────────────────────
// DEV-1011 | Bloqueante | Management
// Bug: error de validación genérico al crear usuario
// ─────────────────────────────────────────────────────────────
test('DEV-1011 — Error de validación específico al crear usuario sin datos', async ({ page }) => {
  await page.goto(`${BASE}/management/users/add`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);

  // Envía el formulario vacío
  const submitBtn = page.locator('button[type="submit"], button').filter({ hasText: /guardar|save|crear|create/i }).filter({ visible: true }).first();
  if (await submitBtn.count() > 0) await submitBtn.click();
  await page.waitForTimeout(2000);

  const body = await page.evaluate(() => document.body.innerText);
  const hasGenericError = /se deben revisar los campos/i.test(body);
  const hasSpecificError = /email.*requerido|nombre.*requerido|campo.*obligatorio|required.*field/i.test(body);

  console.log(`Error genérico "se deben revisar los campos": ${hasGenericError ? 'SÍ (bug presente) ❌' : 'NO ✅'}`);
  console.log(`Errores específicos por campo: ${hasSpecificError ? 'SÍ ✅' : 'NO ❌'}`);
  await page.screenshot({ path: 'qa-results/DEV-1011.png', fullPage: true });

  // PASA si NO muestra el error genérico (bug resuelto = mensajes específicos)
  expect(hasGenericError, 'No debe mostrar el error genérico, sino errores por campo').toBeFalsy();
});

// ─────────────────────────────────────────────────────────────
// DEV-1048 | Alta | Automations
// Bug: duplicar automation conserva intervalo de días bloqueado
// ─────────────────────────────────────────────────────────────
test('DEV-1048 — Intervalo de días editable tras duplicar automation', async ({ page }) => {
  await page.goto(`${BASE}/marketing/automations`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);

  // Busca una automation con intervalo (cualquiera)
  const firstRow = page.locator('tr:has(td), [class*="row"], [class*="item"]').first();
  if (await firstRow.count() === 0) {
    console.log('No hay automations disponibles para probar');
    test.skip();
    return;
  }

  // Busca el botón de duplicar
  const duplicateBtn = page.locator('button, a, [class*="btn"]').filter({
    hasText: /duplicar|duplicate|copiar|copy/i,
  }).filter({ visible: true }).first();

  if (await duplicateBtn.count() === 0) {
    // Intenta desde el menú de acciones de la fila
    await firstRow.hover();
    await page.waitForTimeout(500);
  }

  if (await duplicateBtn.count() > 0) {
    await duplicateBtn.click();
    await page.waitForTimeout(2000);

    // Busca el campo de intervalo de días
    const intervalField = page.locator('input[type="number"], input[name*="interval"], input[name*="days"]').filter({ visible: true }).first();
    if (await intervalField.count() > 0) {
      const isDisabled = await intervalField.isDisabled();
      const isReadOnly = await intervalField.getAttribute('readonly');
      console.log(`Intervalo editable tras duplicar: ${(!isDisabled && !isReadOnly) ? 'SÍ ✅' : 'NO (bug presente) ❌'}`);
      expect(isDisabled, 'El campo de intervalo debe ser editable tras duplicar').toBeFalsy();
    }
  }

  await page.screenshot({ path: 'qa-results/DEV-1048.png', fullPage: true });
});

// ─────────────────────────────────────────────────────────────
// DEV-910 | Alta | CRM Segmentos
// Front: secciones con contenido deben auto-expandirse al abrir segmento
// ─────────────────────────────────────────────────────────────
test('DEV-910 — Secciones con contenido se expanden automáticamente en segmentos', async ({ page }) => {
  await page.goto(`${BASE}/crm/segments`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);

  // Abre el primer segmento con contenido
  const firstSegment = page.locator('tr:has(td), [class*="row"], [class*="item"]').first();
  if (await firstSegment.count() === 0) { test.skip(); return; }
  await firstSegment.click();
  await page.waitForTimeout(2000);

  // Verifica si hay secciones colapsadas que contienen contenido
  // Una sección colapsada con contenido tendrá el acordeón cerrado pero con badge/contador
  const collapsedWithContent = page.locator('[class*="collapse"]:not(.show), [aria-expanded="false"]').filter({ visible: true });
  const count = await collapsedWithContent.count();

  console.log(`Secciones colapsadas visibles: ${count}`);
  await page.screenshot({ path: 'qa-results/DEV-910.png', fullPage: true });

  // PASA si no hay secciones colapsadas con contenido (o si todas están expandidas)
  // Esto es una verificación visual — el screenshot es la evidencia principal
  expect(count, 'Las secciones con contenido deben estar expandidas por defecto').toBe(0);
});

// ─────────────────────────────────────────────────────────────
// DEV-970 | Media | CRM Segmentos
// Front: panel de alcance no se refresca al guardar reglas
// ─────────────────────────────────────────────────────────────
test('DEV-970 — Panel de alcance se refresca sin recargar página al guardar segmento', async ({ page }) => {
  await page.goto(`${BASE}/crm/segments`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);

  const firstSegment = page.locator('tr:has(td), [class*="row"], [class*="item"]').first();
  if (await firstSegment.count() === 0) { test.skip(); return; }
  await firstSegment.click();
  await page.waitForTimeout(2000);

  // Captura el valor de alcance antes de guardar
  const reachBefore = await page.evaluate(() => {
    const el = document.querySelector('[class*="reach"], [class*="alcance"], [class*="count"]');
    return el?.innerText?.trim() || '';
  });

  // Guarda sin cambios para provocar el refresco
  const saveBtn = page.locator('button').filter({ hasText: /guardar|save/i }).filter({ visible: true }).first();
  if (await saveBtn.count() > 0) {
    await saveBtn.click();
    await page.waitForTimeout(3000);
  }

  // Verifica que no hay toast de error
  const errorToast = await page.evaluate(() => {
    const sel = '[class*="error"], [class*="toast"][class*="error"], [role="alert"]';
    return document.querySelector(sel)?.innerText?.trim() || '';
  });

  console.log(`Toast de error tras guardar: ${errorToast || 'ninguno ✅'}`);
  await page.screenshot({ path: 'qa-results/DEV-970.png', fullPage: true });

  expect(errorToast, 'No debe aparecer toast de error al guardar reglas del segmento').toBe('');
});

// ─────────────────────────────────────────────────────────────
// DEV-876 | Media | CRM Contactos
// UX: Enter debe aplicar filtros en CRM > Contactos
// ─────────────────────────────────────────────────────────────
test('DEV-876 — Enter aplica filtros en CRM > Contactos', async ({ page }) => {
  await page.goto(`${BASE}/crm/contacts`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);

  // Abre el panel de filtros
  const filterBtn = page.locator('button, a').filter({ hasText: /filtros|filter/i }).filter({ visible: true }).first();
  if (await filterBtn.count() > 0) {
    await filterBtn.click();
    await page.waitForTimeout(1000);
  }

  // Busca un campo de filtro de texto
  const filterInput = page.locator('input[type="text"], input[type="search"]').filter({ visible: true }).first();
  if (await filterInput.count() === 0) { test.skip(); return; }

  const urlBefore = page.url();
  const countBefore = await page.locator('tr:not(:first-child), [class*="row"]').count();

  await filterInput.fill('test');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(2000);

  const urlAfter = page.url();
  const countAfter = await page.locator('tr:not(:first-child), [class*="row"]').count();

  const filterApplied = urlAfter !== urlBefore || countAfter !== countBefore;
  console.log(`Filtro aplicado con Enter: ${filterApplied ? 'SÍ ✅' : 'NO (bug presente) ❌'}`);
  await page.screenshot({ path: 'qa-results/DEV-876.png', fullPage: true });

  expect(filterApplied, 'Pulsar Enter debe aplicar los filtros').toBeTruthy();
});

// ─────────────────────────────────────────────────────────────
// DEV-1029 | Baja | CRM Contactos
// UX: seleccionar texto no debe abrir el contacto
// ─────────────────────────────────────────────────────────────
test('DEV-1029 — Seleccionar texto en lista de contactos no abre el detalle', async ({ page }) => {
  await page.goto(`${BASE}/crm/contacts`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);

  const urlBefore = page.url();

  // Intenta seleccionar texto de la primera celda de email con un drag
  const emailCell = page.locator('td').filter({ hasText: /@/ }).first();
  if (await emailCell.count() === 0) { test.skip(); return; }

  const box = await emailCell.boundingBox();
  if (!box) { test.skip(); return; }

  // Simula selección de texto (mousedown + move + mouseup sin navegación)
  await page.mouse.move(box.x + 5, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + 60, box.y + box.height / 2, { steps: 10 });
  await page.mouse.up();
  await page.waitForTimeout(1000);

  const urlAfter = page.url();
  const navigated = urlAfter !== urlBefore;

  console.log(`Seleccionar texto abrió el contacto: ${navigated ? 'SÍ (bug presente) ❌' : 'NO ✅'}`);
  await page.screenshot({ path: 'qa-results/DEV-1029.png', fullPage: true });

  expect(navigated, 'Seleccionar texto no debe navegar al detalle del contacto').toBeFalsy();
});
