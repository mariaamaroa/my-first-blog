# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: crm-compare.spec.js >> CRM - Comparativa plataforma nueva vs antigua >> Antigua plataforma - CRM Contactos
- Location: tests/crm-compare.spec.js:37:3

# Error details

```
Test timeout of 60000ms exceeded.
```

```
Error: page.waitForNavigation: Test timeout of 60000ms exceeded.
=========================== logs ===========================
waiting for navigation until "networkidle"
============================================================
```

# Page snapshot

```yaml
- generic [ref=e1]:
  - generic [ref=e3]:
    - generic [ref=e5]:
      - link [ref=e6] [cursor=pointer]:
        - /url: "#"
      - heading [level=3] [ref=e7]: Connect, get to know and retain your customers
    - generic [ref=e9]:
      - generic [ref=e12]:
        - heading [level=3] [ref=e14]: Welcome to Fideltour
        - generic [ref=e15]:
          - generic [ref=e16]: Email
          - textbox [ref=e17]: mamaroa@fideltour.com
        - generic [ref=e18]:
          - generic [ref=e20]: Password
          - generic [ref=e21]:
            - textbox [ref=e22]
            - button [ref=e23] [cursor=pointer]:
              - generic [ref=e24]: 
          - link [ref=e25] [cursor=pointer]:
            - /url: /recover-password/
            - text: ¿Has olvidado la contraseña?
        - button [ref=e27] [cursor=pointer]: Continue
      - generic [ref=e28]:
        - generic [ref=e29]:
          - text: 2026©
          - link [ref=e30] [cursor=pointer]:
            - /url: http://fideltour.com/
            - text: Fideltour
        - link [ref=e31] [cursor=pointer]:
          - /url: https://www.fideltour.com/terminos-y-condiciones
          - text: Terms
        - link [ref=e32] [cursor=pointer]:
          - /url: https://www.fideltour.com/fideltour-es-infinito
          - text: Plans
        - link [ref=e33] [cursor=pointer]:
          - /url: https://www.fideltour.com/contacto
          - text: Contact us
  - dialog "Error" [ref=e35]:
    - heading "Error" [level=2] [ref=e41]
    - generic [ref=e42]:
      - generic [ref=e43]: Incorrect email and/or password
      - text: "!"
    - button "Understood" [active] [ref=e45] [cursor=pointer]
  - img
```

# Test source

```ts
  1  | const { test, expect } = require('@playwright/test');
  2  | const path = require('path');
  3  | 
  4  | const NEW_PLATFORM = 'https://saas.test.fideltour.com';
  5  | const OLD_PLATFORM = 'https://marketing.fideltour.com';
  6  | 
  7  | const CREDENTIALS = {
  8  |   email: 'mamaroa@fideltour.com',
  9  |   password: process.env.FIDELTOUR_PASSWORD || '',
  10 | };
  11 | 
  12 | test.describe('CRM - Comparativa plataforma nueva vs antigua', () => {
  13 | 
  14 |   test('Nueva plataforma - CRM Contactos', async ({ page }) => {
  15 |     await page.goto(`${NEW_PLATFORM}/crm/contacts`, { waitUntil: 'networkidle' });
  16 | 
  17 |     // Si hay login, intentar autenticar
  18 |     if (page.url().includes('login') || page.url().includes('signin')) {
  19 |       await page.fill('input[type="email"], input[name="email"], input[name="username"]', CREDENTIALS.email);
  20 |       if (CREDENTIALS.password) {
  21 |         await page.fill('input[type="password"]', CREDENTIALS.password);
  22 |         await page.click('button[type="submit"]');
  23 |         await page.waitForNavigation({ waitUntil: 'networkidle' });
  24 |       } else {
  25 |         console.log('⚠️  Se requiere contraseña. Pasa FIDELTOUR_PASSWORD como variable de entorno.');
  26 |       }
  27 |     }
  28 | 
  29 |     await page.screenshot({
  30 |       path: path.join('screenshots', 'nueva-crm-contactos.png'),
  31 |       fullPage: true,
  32 |     });
  33 | 
  34 |     console.log('✅ Captura nueva plataforma CRM guardada');
  35 |   });
  36 | 
  37 |   test('Antigua plataforma - CRM Contactos', async ({ page }) => {
  38 |     await page.goto(`${OLD_PLATFORM}`, { waitUntil: 'networkidle' });
  39 | 
  40 |     // Si hay login, intentar autenticar
  41 |     if (page.url().includes('login') || page.url().includes('signin')) {
  42 |       await page.fill('input[type="email"], input[name="email"], input[name="username"]', CREDENTIALS.email);
  43 |       if (CREDENTIALS.password) {
  44 |         await page.fill('input[type="password"]', CREDENTIALS.password);
  45 |         await page.click('button[type="submit"]');
> 46 |         await page.waitForNavigation({ waitUntil: 'networkidle' });
     |                    ^ Error: page.waitForNavigation: Test timeout of 60000ms exceeded.
  47 |       } else {
  48 |         console.log('⚠️  Se requiere contraseña. Pasa FIDELTOUR_PASSWORD como variable de entorno.');
  49 |       }
  50 |     }
  51 | 
  52 |     // Navegar al módulo CRM si hay menú
  53 |     const crmLink = page.locator('a:has-text("CRM"), a:has-text("Contactos"), nav a[href*="crm"], nav a[href*="contact"]').first();
  54 |     if (await crmLink.count() > 0) {
  55 |       await crmLink.click();
  56 |       await page.waitForLoadState('networkidle');
  57 |     }
  58 | 
  59 |     await page.screenshot({
  60 |       path: path.join('screenshots', 'antigua-crm-contactos.png'),
  61 |       fullPage: true,
  62 |     });
  63 | 
  64 |     console.log('✅ Captura antigua plataforma CRM guardada');
  65 |   });
  66 | 
  67 | });
  68 | 
```