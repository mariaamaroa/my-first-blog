const path = require('path');
const fs = require('fs');
const { newPage } = require('./browser');

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
    await page.goto(modUrl, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    // Find and click a "new/create" button if exists
    const createBtn = page.locator('button, a').filter({ hasText: /nuevo|new|crear|create|\+ /i }).filter({ visible: true }).first();
    if (await createBtn.count() > 0) {
      await createBtn.click();
      await page.waitForTimeout(2000);
    }

    const urlBefore = page.url();
    await fillForm(page, fields, testCase.values);

    // Submit
    const submitBtn = page.locator('button[type="submit"], button:has-text("Guardar"), button:has-text("Save"), button:has-text("Crear"), button:has-text("Create")').filter({ visible: true }).first();
    if (await submitBtn.count() > 0) {
      await submitBtn.click();
    }

    result.actual = await detectOutcome(page, urlBefore);

    const expects = testCase.expect.split('-or-');
    result.passed = expects.some(e => result.actual === e || result.actual.startsWith(e));

    const fname = `${testCase.id}.png`;
    await page.screenshot({ path: path.join(outputDir, fname), fullPage: true });
    result.screenshot = fname;
  } catch (err) {
    result.error = err.message.slice(0, 200);
    result.actual = 'error';
  } finally {
    result.duration = Date.now() - t0;
    await page.context().close();
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
