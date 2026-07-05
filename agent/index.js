#!/usr/bin/env node
const path = require('path');
const fs = require('fs');
const config = require('./config');
const { newPage, login, closeBrowser } = require('./browser');
const { discoverTabs, discoverActions, discoverFields, discoverPageElements } = require('./discover');
const { generateCases } = require('./cases');
const { runModuleCases } = require('./executor');
const { generateReport } = require('./report');

const RESULTS_DIR = path.join(__dirname, '..', config.output.dir);
const REPORT_PATH = path.join(__dirname, '..', config.output.report);

async function processModule(mod) {
  console.log(`\n  📦 ${mod.name}`);
  const modDir = path.join(RESULTS_DIR, mod.id);
  fs.mkdirSync(modDir, { recursive: true });

  const page = await newPage();
  const modResult = { id: mod.id, name: mod.name, tabs: [], fields: [], cases: [], results: [] };

  try {
    await login(page);
    await page.goto(mod.url, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2500);

    // Screenshot main page
    await page.screenshot({ path: path.join(modDir, 'main.png'), fullPage: true });

    // Discover tabs
    const tabs = await discoverTabs(page);
    modResult.tabs = tabs;
    console.log(`     Pestañas: ${tabs.length > 0 ? tabs.map(t => t.text).join(', ') : 'ninguna detectada'}`);

    // Screenshot each tab
    for (const [i, tab] of tabs.entries()) {
      try {
        await page.goto(tab.href, { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(1500);
        await page.screenshot({ path: path.join(modDir, `tab-${i}.png`), fullPage: true });
        const elements = await discoverPageElements(page);
        modResult.tabs[i] = { ...tab, elements, screenshot: `tab-${i}.png` };
      } catch (_) {}
    }

    // Back to main to find forms
    await page.goto(mod.url, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    // Look for create/new actions
    const actions = await discoverActions(page);

    if (actions.length > 0) {
      const action = actions[0];
      console.log(`     Acción encontrada: "${action.text}"`);

      if (action.href) {
        await page.goto(action.href, { waitUntil: 'domcontentloaded' });
      } else {
        const btn = page.locator('button, a').filter({ hasText: new RegExp(action.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') }).filter({ visible: true }).first();
        if (await btn.count() > 0) {
          await btn.click();
          await page.waitForTimeout(2000);
        }
      }
      await page.waitForTimeout(2000);

      const fields = await discoverFields(page);
      modResult.fields = fields;
      console.log(`     Campos: ${fields.length}`);

      if (fields.length > 0) {
        const cases = generateCases(fields);
        modResult.cases = cases;
        console.log(`     Tests generados: ${cases.length}`);
        await page.context().close();

        // Run cases
        modResult.results = await runModuleCases(mod, fields, cases, RESULTS_DIR);
      } else {
        await page.context().close();
      }
    } else {
      console.log(`     Sin formulario de creación detectado`);
      await page.context().close();
    }
  } catch (err) {
    console.log(`     ⚠️  Error: ${err.message.slice(0, 100)}`);
    await page.context().close().catch(() => {});
  }

  // Save module JSON
  fs.writeFileSync(
    path.join(modDir, 'result.json'),
    JSON.stringify(modResult, null, 2)
  );

  return modResult;
}

async function run() {
  if (!config.auth.password) {
    console.error('❌ Falta FIDELTOUR_PASSWORD\n   Ejecuta: FIDELTOUR_PASSWORD=xxx npm run qa:headed');
    process.exit(1);
  }

  console.log('\n🤖 Agente QA — Fideltour saas.test');
  console.log(`   Usuario: ${config.auth.email}`);
  console.log(`   Módulos: ${config.modules.length}`);
  console.log('='.repeat(50));

  fs.mkdirSync(RESULTS_DIR, { recursive: true });

  const moduleResults = [];
  for (const mod of config.modules) {
    const result = await processModule(mod);
    moduleResults.push(result);
  }

  console.log('\n📊 Generando informe...');
  generateReport({ moduleResults, reportPath: REPORT_PATH });

  await closeBrowser();

  // Summary
  const totalTests = moduleResults.reduce((s, m) => s + m.results.length, 0);
  const totalPassed = moduleResults.reduce((s, m) => s + m.results.filter(r => r.passed).length, 0);

  console.log('\n' + '='.repeat(50));
  console.log(`\n✅ Tests: ${totalPassed}/${totalTests} pasados`);
  moduleResults.forEach(m => {
    if (m.results.length > 0) {
      const p = m.results.filter(r => r.passed).length;
      console.log(`   ${p === m.results.length ? '✅' : '❌'} ${m.name}: ${p}/${m.results.length}`);
    } else {
      console.log(`   ⚪ ${m.name}: sin formulario`);
    }
  });
  console.log(`\n📄 Informe: ${REPORT_PATH}`);
  console.log('   xdg-open qa-report.html\n');
}

run().catch(err => {
  console.error('\n❌ Error fatal:', err.message);
  closeBrowser().finally(() => process.exit(1));
});
