#!/usr/bin/env node
const path = require('path');
const fs = require('fs');
const config = require('./config');
const { discoverFields } = require('./discover');
const { generateCases } = require('./cases');
const { runAllCases } = require('./executor');
const { generateReport } = require('./report');
const { closeBrowser } = require('./browser');

const OUTPUT_DIR = path.join(__dirname, '..', config.output.dir, 'contacto');
const REPORT_PATH = path.join(__dirname, '..', config.output.report);

async function run() {
  if (!config.auth.password) {
    console.error('❌ Falta FIDELTOUR_PASSWORD. Ejecuta: FIDELTOUR_PASSWORD=xxx node agent/index.js');
    process.exit(1);
  }

  console.log('\n🤖 Agente QA — Formulario nuevo contacto');
  console.log('='.repeat(50));

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  // ─── FASE 1: Descubrir campos ─────────────────────
  console.log('\n📋 Fase 1: Descubriendo campos...');
  const discoveries = [];
  for (const [key, platform] of Object.entries(config.platforms)) {
    console.log(`\n  Plataforma: ${platform.name}`);
    const result = await discoverFields(platform);
    if (result.error) {
      console.log(`  ⚠️  Error: ${result.error}`);
    } else {
      console.log(`  ✅ ${result.fields.length} campos encontrados`);
      fs.writeFileSync(
        path.join(OUTPUT_DIR, `${key}-fields.json`),
        JSON.stringify(result.fields, null, 2)
      );
    }
    discoveries.push(result);
  }

  // Use nueva platform fields to generate cases (most complete)
  const primaryFields = discoveries[0].fields;
  if (primaryFields.length === 0) {
    console.error('\n❌ No se encontraron campos en la plataforma nueva. Abortando.');
    await closeBrowser();
    process.exit(1);
  }

  // ─── FASE 2: Generar casos de test ───────────────
  console.log('\n🧪 Fase 2: Generando casos de test...');
  const cases = generateCases(primaryFields);
  console.log(`  ✅ ${cases.length} casos generados:`);
  cases.forEach(c => console.log(`     · ${c.name}`));

  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'test-cases.json'),
    JSON.stringify(cases, null, 2)
  );

  // ─── FASE 3: Ejecutar tests ───────────────────────
  console.log('\n🚀 Fase 3: Ejecutando tests...');
  const allResults = {};
  for (const [key, platform] of Object.entries(config.platforms)) {
    console.log(`\n  → ${platform.name}`);
    const discovery = discoveries.find(d => d.platform === platform.name);
    const fields = discovery?.fields || primaryFields;
    allResults[platform.name] = await runAllCases(platform, fields, cases, OUTPUT_DIR);
  }

  // ─── FASE 4: Generar informe ──────────────────────
  console.log('\n📊 Fase 4: Generando informe...');
  generateReport({
    discoveries,
    cases,
    results: allResults,
    outputDir: OUTPUT_DIR,
    reportPath: REPORT_PATH,
  });

  await closeBrowser();

  // Summary
  console.log('\n' + '='.repeat(50));
  for (const [platform, results] of Object.entries(allResults)) {
    const passed = results.filter(r => r.passed).length;
    console.log(`  ${platform}: ${passed}/${results.length} tests pasados`);
  }
  console.log(`\n✅ Informe: ${REPORT_PATH}`);
  console.log('   Abre con: xdg-open qa-report.html\n');
}

run().catch(err => {
  console.error('\n❌ Error fatal:', err.message);
  closeBrowser().finally(() => process.exit(1));
});
