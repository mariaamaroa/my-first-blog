const path = require('path');
const fs = require('fs');
const { newPage, login } = require('./browser');
const config = require('./config');

async function fillForm(page, fields, values) {
  for (const field of fields) {
    const value = values[field.name];
    if (value === undefined || value === null) continue;

    try {
      let locator;
      if (field.name && field.name !== '(sin nombre)') {
        locator = page.locator(`[name="${field.name}"]`).first();
      } else if (field.label) {
        locator = page.getByLabel(field.label).first();
      }
      if (!locator || await locator.count() === 0) continue;

      if (field.type === 'select') {
        if (value) await locator.selectOption(value);
      } else if (field.type === 'checkbox') {
        const checked = await locator.isChecked();
        if (value && !checked) await locator.check();
        if (!value && checked) await locator.uncheck();
      } else {
        await locator.fill(String(value));
      }
    } catch (_) {
      // field not interactable, skip
    }
  }
}

async function detectOutcome(page, beforeUrl) {
  const afterUrl = page.url();
  const bodyText = await page.evaluate(() => document.body.innerText).catch(() => '');

  // Success indicators
  if (afterUrl !== beforeUrl && !afterUrl.includes('new') && !afterUrl.includes('add')) {
    return 'success';
  }
  const successPatterns = [/guardado|saved|created|creado|success|éxito/i];
  if (successPatterns.some(p => p.test(bodyText))) return 'success';

  // Validation error indicators
  const errorPatterns = [/error|inválido|invalid|required|obligatorio|requerido/i];
  if (errorPatterns.some(p => p.test(bodyText))) return 'validation-error';

  // Duplicate indicators
  const dupPatterns = [/duplicado|duplicate|already exists|ya existe/i];
  if (dupPatterns.some(p => p.test(bodyText))) return 'duplicate-error';

  return 'unknown';
}

async function runCase(platform, fields, testCase, outputDir) {
  const page = await newPage();
  const result = {
    id: testCase.id,
    name: testCase.name,
    platform: platform.name,
    expect: testCase.expect,
    actual: null,
    passed: false,
    screenshot: null,
    error: null,
    duration: 0,
  };

  const start = Date.now();
  try {
    await login(page, platform.loginStart);
    await page.goto(platform.contactForm, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    const beforeUrl = page.url();
    await fillForm(page, fields, testCase.values);
    await page.waitForTimeout(500);

    // Try to submit
    const submitBtn = page.locator('button[type="submit"], button:has-text("Guardar"), button:has-text("Save"), button:has-text("Crear"), button:has-text("Create")').first();
    if (await submitBtn.count() > 0) {
      await submitBtn.click();
      await page.waitForTimeout(2000);
    }

    result.actual = await detectOutcome(page, beforeUrl);

    // Normalize: sanitized-or-error accepts both outcomes
    if (testCase.expect === 'sanitized-or-error') {
      result.passed = ['success', 'validation-error'].includes(result.actual);
    } else {
      result.passed = result.actual === testCase.expect;
    }

    const screenshotName = `${platform.name.replace(/[^a-z0-9]/gi, '-')}-${testCase.id}.png`;
    const screenshotPath = path.join(outputDir, screenshotName);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    result.screenshot = screenshotName;

  } catch (err) {
    result.error = err.message;
    result.actual = 'error';
    result.passed = false;
  } finally {
    result.duration = Date.now() - start;
    await page.context().close();
  }

  return result;
}

async function runAllCases(platform, fields, cases, outputDir) {
  fs.mkdirSync(outputDir, { recursive: true });
  const results = [];
  for (const testCase of cases) {
    process.stdout.write(`    [${platform.name}] ${testCase.name}... `);
    const result = await runCase(platform, fields, testCase, outputDir);
    process.stdout.write(result.passed ? '✅\n' : `❌ (expected: ${result.expect}, got: ${result.actual})\n`);
    results.push(result);
  }
  return results;
}

module.exports = { runAllCases };
