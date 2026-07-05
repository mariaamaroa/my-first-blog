const path = require('path');
const fs = require('fs');
const { newPage } = require('./browser');
const { FAKE } = require('./cases');

async function fillForm(page, fields, values) {
  for (const field of fields) {
    const val = values[field.name];
    if (val === undefined || val === null) continue;
    try {
      const loc = field.name && field.name !== '(sin nombre)'
        ? page.locator(`[name="${field.name}"]`).first()
        : page.getByLabel(field.label || '').first();
      if (!loc || await loc.count() === 0) continue;

      if (field.type === 'select') {
        if (val) await loc.selectOption(String(val));
      } else if (field.type === 'checkbox') {
        const checked = await loc.isChecked();
        if (val && !checked) await loc.check();
        if (!val && checked) await loc.uncheck();
      } else {
        await loc.clear();
        await loc.fill(String(val));
      }
    } catch (_) {}
  }
}

async function detectOutcome(page, urlBefore) {
  await page.waitForTimeout(1500);
  const urlAfter = page.url();
  const body = await page.evaluate(() => document.body.innerText).catch(() => '');

  if (urlAfter !== urlBefore && !urlAfter.includes('new') && !urlAfter.includes('add') && !urlAfter.includes('create')) {
    return 'success';
  }
  if (/guardado|saved|created|creado|success|éxito|actualizado|updated/i.test(body)) return 'success';
  if (/duplicado|duplicate|already exists|ya existe/i.test(body)) return 'duplicate-error';
  if (/error|inválido|invalid|required|obligatorio|requerido/i.test(body)) return 'validation-error';
  return 'unknown';
}

async function findAndClickAction(page, patterns) {
  for (const pattern of patterns) {
    try {
      const btn = page.locator('button, a, [role="button"]')
        .filter({ hasText: new RegExp(pattern, 'i') })
        .filter({ visible: true }).first();
      if (await btn.count() > 0) {
        await btn.click();
        await page.waitForTimeout(1500);
        return true;
      }
    } catch (_) {}
  }
  return false;
}

async function runCreate(page, modUrl, fields, values) {
  await page.goto(modUrl, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);

  const created = await findAndClickAction(page, ['nuevo|new|crear|create|\\+\\s', '\\+']);
  if (!created) {
    // Try direct /new URL
    await page.goto(`${modUrl.replace(/\/$/, '')}/new`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
  }

  const urlBefore = page.url();
  await fillForm(page, fields, values);

  const submitBtn = page.locator('button[type="submit"], button:has-text("Guardar"), button:has-text("Save"), button:has-text("Crear"), button:has-text("Create")').filter({ visible: true }).first();
  if (await submitBtn.count() > 0) await submitBtn.click();

  return detectOutcome(page, urlBefore);
}

async function runSearch(page, modUrl, searchTerm) {
  await page.goto(modUrl, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);

  const searchInput = page.locator('input[type="search"], input[placeholder*="buscar"], input[placeholder*="search"], input[placeholder*="Search"], input[name*="search"], input[name*="filter"]').first();
  if (await searchInput.count() === 0) return 'no-search-field';

  await searchInput.fill(searchTerm);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(2000);

  const rows = await page.locator('tr, [class*="row"], [class*="item"], [class*="card"]').count();
  return rows > 0 ? 'results-filtered' : 'no-results';
}

async function runPaginate(page, modUrl) {
  await page.goto(modUrl, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);

  const urlBefore = page.url();
  const nextBtn = page.locator('a, button').filter({ hasText: /siguiente|next|›|>>/i }).filter({ visible: true }).first();
  const pageNum = page.locator('a, button').filter({ hasText: /^2$/ }).filter({ visible: true }).first();

  if (await nextBtn.count() > 0) {
    await nextBtn.click();
    await page.waitForTimeout(2000);
    return page.url() !== urlBefore ? 'page-changed' : 'unknown';
  }
  if (await pageNum.count() > 0) {
    await pageNum.click();
    await page.waitForTimeout(2000);
    return page.url() !== urlBefore ? 'page-changed' : 'unknown';
  }
  return 'no-pagination';
}

async function runEdit(page, modUrl, fields, values, searchTerm) {
  await page.goto(modUrl, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);

  // Search for the created record
  const searchInput = page.locator('input[type="search"], input[placeholder*="buscar"], input[placeholder*="search"], input[placeholder*="Search"]').first();
  if (await searchInput.count() > 0) {
    await searchInput.fill(searchTerm);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(2000);
  }

  // Click first result row to open it
  const firstRow = page.locator('tr[class*="clickable"], tr:has(td), [class*="row"]:has-text("QA"), [class*="item"]:has-text("QA")').first();
  if (await firstRow.count() > 0) {
    await firstRow.click();
    await page.waitForTimeout(2000);
  }

  // Find edit button
  const edited = await findAndClickAction(page, ['editar|edit|modificar|update']);
  if (!edited) return 'no-edit-button';

  await page.waitForTimeout(1500);
  const urlBefore = page.url();
  await fillForm(page, fields, values);

  const submitBtn = page.locator('button[type="submit"], button:has-text("Guardar"), button:has-text("Save"), button:has-text("Actualizar"), button:has-text("Update")').filter({ visible: true }).first();
  if (await submitBtn.count() > 0) await submitBtn.click();

  return detectOutcome(page, urlBefore);
}

async function runDelete(page, modUrl, searchTerm) {
  await page.goto(modUrl, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);

  // Search for the created record
  const searchInput = page.locator('input[type="search"], input[placeholder*="buscar"], input[placeholder*="search"], input[placeholder*="Search"]').first();
  if (await searchInput.count() > 0) {
    await searchInput.fill(searchTerm);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(2000);
  }

  // Click first result
  const firstRow = page.locator('tr[class*="clickable"], tr:has(td), [class*="row"]:has-text("QA"), [class*="item"]:has-text("QA")').first();
  if (await firstRow.count() > 0) await firstRow.click();
  await page.waitForTimeout(1500);

  // Find delete button
  const deleted = await findAndClickAction(page, ['eliminar|delete|borrar|remove']);
  if (!deleted) return 'no-delete-button';

  await page.waitForTimeout(1000);

  // Confirm dialog if appears
  const confirmBtn = page.locator('button').filter({ hasText: /confirmar|confirm|sí|yes|ok|aceptar/i }).filter({ visible: true }).first();
  if (await confirmBtn.count() > 0) await confirmBtn.click();
  await page.waitForTimeout(2000);

  // Verify record is gone
  const body = await page.evaluate(() => document.body.innerText).catch(() => '');
  if (/eliminado|deleted|removed|borrado/i.test(body)) return 'deleted';
  if (!/QA Test/.test(body)) return 'deleted';
  return 'unknown';
}

async function runCase(modUrl, fields, testCase, outputDir) {
  const page = await newPage();
  const result = {
    id: testCase.id,
    name: testCase.name,
    expect: testCase.expect,
    actual: null,
    passed: false,
    screenshot: null,
    error: null,
    duration: 0,
  };

  const t0 = Date.now();
  try {
    switch (testCase.action) {
      case 'create':
        result.actual = await runCreate(page, modUrl, fields, testCase.values);
        break;
      case 'search':
        result.actual = await runSearch(page, modUrl, testCase.searchTerm);
        break;
      case 'paginate':
        result.actual = await runPaginate(page, modUrl);
        break;
      case 'edit':
        result.actual = await runEdit(page, modUrl, fields, testCase.values, testCase.searchTerm);
        break;
      case 'delete':
        result.actual = await runDelete(page, modUrl, testCase.searchTerm);
        break;
      default:
        result.actual = 'unknown-action';
    }

    const expects = testCase.expect.split('-or-');
    result.passed = expects.some(e => result.actual === e || result.actual?.startsWith(e));

    const fname = `${testCase.id}.png`;
    await page.screenshot({ path: path.join(outputDir, fname), fullPage: true });
    result.screenshot = fname;
  } catch (err) {
    result.error = err.message.slice(0, 200);
    result.actual = 'error';
  } finally {
    result.duration = Date.now() - t0;
    await page.close();
  }
  return result;
}

async function runModuleCases(mod, fields, cases, baseDir) {
  const dir = path.join(baseDir, mod.id);
  fs.mkdirSync(dir, { recursive: true });
  const results = [];
  for (const c of cases) {
    process.stdout.write(`      · ${c.name}... `);
    const r = await runCase(mod.url, fields, c, dir);
    process.stdout.write(r.passed ? '✅\n' : `❌ (got: ${r.actual})\n`);
    results.push(r);
  }
  return results;
}

module.exports = { runModuleCases };
