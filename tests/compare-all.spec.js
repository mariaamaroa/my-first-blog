const { test } = require('@playwright/test');
const path = require('path');
const fs = require('fs');
const MODULES = require('../config/modules');

const EMAIL = 'mamaroa@fideltour.com';
const PASSWORD = process.env.FIDELTOUR_PASSWORD || '';

// Guarda sesiones para no hacer login en cada módulo
const sessions = {};

async function login(page, baseUrl) {
  const origin = new URL(baseUrl).origin;
  await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);

  const emailInput = page.locator('input[type="email"], input[name="email"], input[name="username"], input[type="text"]').first();
  if (await emailInput.count() > 0 && page.url().includes('login') || page.url().includes('signin') || page.url() === baseUrl + '/') {
    const passInput = page.locator('input[type="password"]').first();
    if (await passInput.count() > 0) {
      await emailInput.fill(EMAIL);
      await passInput.fill(PASSWORD);
      await page.locator('button[type="submit"]').first().click();
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(3000);
    }
  }
}

async function descubrirPestanas(page) {
  return await page.evaluate(() => {
    const tabs = [];
    // Buscar pestañas en barra horizontal superior
    const selectors = [
      '.menu-nav > .menu-item > .menu-link',
      'nav a',
      '[class*="tab"] a',
      '[class*="nav"] a',
    ];
    for (const sel of selectors) {
      document.querySelectorAll(sel).forEach(el => {
        const texto = el.innerText?.trim();
        const href = el.href;
        if (texto && href && !href.includes('javascript') && texto.length < 50) {
          tabs.push({ texto, href });
        }
      });
      if (tabs.length > 0) break;
    }
    return [...new Map(tabs.map(t => [t.texto, t])).values()];
  });
}

async function capturarElementos(page) {
  return await page.evaluate(() => {
    const elementos = { botones: [], columnas: [], inputs: [], enlaces: [] };
    document.querySelectorAll('button, a.btn, [class*="btn-"]').forEach(el => {
      const t = el.innerText?.trim();
      if (t && t.length < 60) elementos.botones.push(t);
    });
    document.querySelectorAll('th').forEach(el => {
      const t = el.innerText?.trim();
      if (t) elementos.columnas.push(t);
    });
    document.querySelectorAll('input, select').forEach(el => {
      const t = el.placeholder || el.getAttribute('aria-label') || el.name;
      if (t) elementos.inputs.push(t);
    });
    Object.keys(elementos).forEach(k => {
      elementos[k] = [...new Set(elementos[k])].filter(Boolean);
    });
    return elementos;
  });
}

for (const modulo of MODULES) {
  test(`[${modulo.id}] Nueva — ${modulo.nombre}`, async ({ page }) => {
    const dir = `screenshots/comparacion/${modulo.id}/nueva`;
    fs.mkdirSync(dir, { recursive: true });

    await login(page, modulo.nueva);
    await page.screenshot({ path: `${dir}/00-home.png`, fullPage: true });

    const pestanas = await descubrirPestanas(page);
    const resultado = { modulo: modulo.nombre, plataforma: 'nueva', url: modulo.nueva, pestanas: [] };

    for (const [i, tab] of pestanas.entries()) {
      try {
        await page.goto(tab.href, { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(2000);
        const filename = `${String(i+1).padStart(2,'0')}-${tab.texto.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
        await page.screenshot({ path: `${dir}/${filename}.png`, fullPage: true });
        const elementos = await capturarElementos(page);
        resultado.pestanas.push({ nombre: tab.texto, url: tab.href, screenshot: `${filename}.png`, elementos });
        console.log(`  ✅ Nueva/${modulo.nombre} — ${tab.texto}`);
      } catch (e) {
        console.log(`  ⚠️  Nueva/${modulo.nombre} — ${tab.texto} error: ${e.message}`);
      }
    }

    fs.writeFileSync(`${dir}/resultado.json`, JSON.stringify(resultado, null, 2));
  });

  if (modulo.antigua) {
    test(`[${modulo.id}] Antigua — ${modulo.nombre}`, async ({ page }) => {
      const dir = `screenshots/comparacion/${modulo.id}/antigua`;
      fs.mkdirSync(dir, { recursive: true });

      await login(page, modulo.antigua);
      await page.screenshot({ path: `${dir}/00-home.png`, fullPage: true });

      const pestanas = await descubrirPestanas(page);
      const resultado = { modulo: modulo.nombre, plataforma: 'antigua', url: modulo.antigua, pestanas: [] };

      for (const [i, tab] of pestanas.entries()) {
        try {
          await page.goto(tab.href, { waitUntil: 'domcontentloaded' });
          await page.waitForTimeout(2000);
          const filename = `${String(i+1).padStart(2,'0')}-${tab.texto.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
          await page.screenshot({ path: `${dir}/${filename}.png`, fullPage: true });
          const elementos = await capturarElementos(page);
          resultado.pestanas.push({ nombre: tab.texto, url: tab.href, screenshot: `${filename}.png`, elementos });
          console.log(`  ✅ Antigua/${modulo.nombre} — ${tab.texto}`);
        } catch (e) {
          console.log(`  ⚠️  Antigua/${modulo.nombre} — ${tab.texto} error: ${e.message}`);
        }
      }

      fs.writeFileSync(`${dir}/resultado.json`, JSON.stringify(resultado, null, 2));
    });
  }
}
