const { newPage, login } = require('./browser');

async function discoverFields(platform) {
  const page = await newPage();
  try {
    console.log(`  → Login en ${platform.name}...`);
    await login(page, platform.loginStart);

    console.log(`  → Navegando al formulario...`);
    await page.goto(platform.contactForm, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);

    const screenshot = `${platform.name.replace(/[^a-z0-9]/gi, '-')}-form.png`;

    const fields = await page.evaluate(() => {
      const result = [];
      // Scope to form or main content area
      const container = document.querySelector('form[method="post"], main form, .content form, form') || document.body;
      container.querySelectorAll('input, select, textarea').forEach(el => {
        if (el.type === 'hidden' || el.type === 'submit') return;
        const label = (() => {
          if (el.id) {
            const lbl = document.querySelector(`label[for="${el.id}"]`);
            if (lbl) return lbl.innerText.trim();
          }
          const parent = el.closest('.field, .form-group, .form-row, [class*="field"]');
          if (parent) {
            const lbl = parent.querySelector('label');
            if (lbl) return lbl.innerText.trim();
          }
          return null;
        })();

        result.push({
          type: el.tagName.toLowerCase() === 'select' ? 'select'
              : el.tagName.toLowerCase() === 'textarea' ? 'textarea'
              : el.type || 'text',
          name: el.name || el.id || el.getAttribute('aria-label') || el.placeholder || '(sin nombre)',
          label: label || el.placeholder || el.getAttribute('aria-label') || el.name || null,
          placeholder: el.placeholder || '',
          required: el.required,
          maxLength: el.maxLength > 0 ? el.maxLength : null,
          options: el.tagName === 'SELECT' ? [...el.options].map(o => ({ value: o.value, text: o.text })) : null,
        });
      });
      return result;
    });

    return { platform: platform.name, fields, screenshot, error: null };
  } catch (err) {
    return { platform: platform.name, fields: [], screenshot: null, error: err.message };
  } finally {
    await page.context().close();
  }
}

module.exports = { discoverFields };
