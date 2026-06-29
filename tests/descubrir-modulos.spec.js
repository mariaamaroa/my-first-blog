const { test } = require('@playwright/test');
const fs = require('fs');

const OLD_BASE = 'https://grm.test.fideltour.com';
const NEW_BASE = 'https://saas.test.fideltour.com';
const EMAIL = 'mamaroa@fideltour.com';
const PASSWORD = process.env.FIDELTOUR_PASSWORD || '';

test('Descubrir todos los módulos y URLs', async ({ page }) => {
  // Login antigua
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

  await page.screenshot({ path: 'screenshots/descubrir-antigua-home.png', fullPage: true });

  // Extraer todos los enlaces del menú lateral izquierdo
  const modulosAntigua = await page.evaluate(() => {
    const links = [];
    document.querySelectorAll('a').forEach(a => {
      const href = a.href;
      const texto = a.innerText?.trim();
      if (href && texto && !href.includes('javascript') && !href.includes('#')) {
        links.push({ texto, href });
      }
    });
    // Eliminar duplicados por href
    const vistos = new Set();
    return links.filter(l => {
      if (vistos.has(l.href)) return false;
      vistos.add(l.href);
      return true;
    });
  });

  // Nueva plataforma - abrir en nueva pestaña y hacer login
  const page2 = await page.context().newPage();
  await page2.goto(NEW_BASE, { waitUntil: 'domcontentloaded' });
  await page2.waitForTimeout(3000);

  // El login de la nueva puede ser un form normal o redirigir a SSO
  const anyInput = page2.locator('input').first();
  if (await anyInput.count() > 0) {
    const emailInput2 = page2.locator('input[type="email"], input[name="email"], input[name="username"], input[type="text"]').first();
    await emailInput2.fill(EMAIL);
    const passInput2 = page2.locator('input[type="password"]');
    if (await passInput2.count() > 0) {
      await passInput2.fill(PASSWORD);
      await page2.locator('button[type="submit"], button:has-text("Login"), button:has-text("Entrar"), button:has-text("Iniciar")').first().click();
      await page2.waitForLoadState('domcontentloaded');
      await page2.waitForTimeout(3000);
    }
  }

  await page2.screenshot({ path: 'screenshots/descubrir-nueva-home.png', fullPage: true });

  const modulosNueva = await page2.evaluate(() => {
    const links = [];
    document.querySelectorAll('a').forEach(a => {
      const href = a.href;
      const texto = a.innerText?.trim();
      if (href && texto && !href.includes('javascript') && !href.includes('#')) {
        links.push({ texto, href });
      }
    });
    const vistos = new Set();
    return links.filter(l => {
      if (vistos.has(l.href)) return false;
      vistos.add(l.href);
      return true;
    });
  });

  // Guardar resultados
  fs.mkdirSync('screenshots', { recursive: true });
  fs.writeFileSync('screenshots/modulos-antigua.json', JSON.stringify(modulosAntigua, null, 2));
  fs.writeFileSync('screenshots/modulos-nueva.json', JSON.stringify(modulosNueva, null, 2));

  console.log('\n=== MÓDULOS ANTIGUA ===');
  modulosAntigua.forEach(m => console.log(`${m.texto} → ${m.href}`));

  console.log('\n=== MÓDULOS NUEVA ===');
  modulosNueva.forEach(m => console.log(`${m.texto} → ${m.href}`));

  console.log('\n✅ Guardado en screenshots/modulos-antigua.json y modulos-nueva.json');
});
