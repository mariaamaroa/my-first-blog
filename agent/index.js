#!/usr/bin/env node
const path = require('path');
const fs = require('fs');
const config = require('./config');
const { newPage, loginOnce, closeBrowser } = require('./browser');
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

    // Search for create actions: main page + each tab + URL patterns
    let formUrl = null;
    let foundAction = null;

    // 1) Try common URL suffixes
    const urlCandidates = [
      `${mod.url.replace(/\/$/, '')}/new`,
      `${mod.url.replace(/\/$/, '')}/create`,
    ];
    for (const candidate of urlCandidates) {
      try {
        const resp = await page.goto(candidate, { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(1500);
        // Valid if we weren't redirected back to the same list
        if (page.url() === candidate || page.url().startsWith(candidate)) {
          const fields = await discoverFields(page);
          if (fields.length > 0) {
            formUrl = candidate;
            console.log(`     Formulario en: ${candidate} (${fields.length} campos)`);
            modResult.fields = fields;
            break;
          }
        }
      } catch (_) {}
    }

    // 2) Search for create button on main page and each tab
    if (!formUrl) {
      const pagesToSearch = [mod.url, ...tabs.map(t => t.href)];
      for (const searchUrl of pagesToSearch) {
        try {
          await page.goto(searchUrl, { waitUntil: 'domcontentloaded' });
          await page.waitForTimeout(1500);
          const actions = await discoverActions(page);
          if (actions.length > 0) {
            foundAction = actions[0];
            console.log(`     Acción encontrada: "${foundAction.text}" en ${searchUrl}`);
            break;
          }
        } catch (_) {}
      }
    }

    // 3) Navigate to form via action button
    if (!formUrl && foundAction) {
      if (foundAction.href && !foundAction.href.includes('javascript')) {
        await page.goto(foundAction.href, { waitUntil: 'domcontentloaded' });
      } else {
        const btn = page.locator('button, a, [role="button"]')
          .filter({ hasText: new RegExp(foundAction.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') })
          .filter({ visible: true }).first();
        if (await btn.count() > 0) await btn.click();
      }
      await page.waitForTimeout(2500);
      const fields = await discoverFields(page);
      if (fields.length > 0) {
        modResult.fields = fields;
        console.log(`     Campos: ${fields.length}`);
      }
    }

    if (modResult.fields.length > 0) {
      const cases = generateCases(modResult.fields);
      modResult.cases = cases;
      console.log(`     Tests generados: ${cases.length}`);
      await page.close();
      // Pass the discovered form URL directly so executor doesn't re-discover
      const effectiveFormUrl = formUrl || mod.url;
      modResult.results = await runModuleCases(mod, effectiveFormUrl, modResult.fields, cases, RESULTS_DIR);
    } else {
      console.log(`     Sin formulario de creación detectado`);
      await page.close();
    }
  } catch (err) {
    console.log(`     ⚠️  Error: ${err.message.slice(0, 100)}`);
    await page.close().catch(() => {});
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

  // Login once, reuse session for all modules
  console.log('\n🔐 Iniciando sesión...');
  await loginOnce();

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
