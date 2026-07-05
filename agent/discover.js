/**
 * Autodiscovers tabs, forms, and fields for a module page.
 */

async function discoverTabs(page) {
  return page.evaluate(() => {
    const tabs = [];
    const selectors = [
      'nav a', '.nav a', '[class*="tab"] a', '[class*="nav"] a',
      '.menu-nav > .menu-item > .menu-link',
      '[role="tablist"] [role="tab"]',
      '[class*="header"] a', '[class*="topbar"] a',
    ];
    for (const sel of selectors) {
      document.querySelectorAll(sel).forEach(el => {
        const text = el.innerText?.trim();
        const href = el.href;
        if (text && href && !href.includes('javascript') && text.length < 60
          && !href.includes('logout') && !href.includes('login')) {
          tabs.push({ text, href });
        }
      });
      if (tabs.length > 2) break;
    }
    return [...new Map(tabs.map(t => [t.text, t])).values()];
  });
}

async function discoverActions(page) {
  return page.evaluate(() => {
    const actions = [];
    document.querySelectorAll('button, a, [role="button"]').forEach(el => {
      const text = el.innerText?.trim();
      const href = el.href || '';
      if (!text || text.length > 80) return;
      // Match create/new patterns in text OR href
      const textMatch = /nuevo|new|crear|create|add|añadir|\+\s/i.test(text) || text === '+';
      const hrefMatch = /\/(new|create|add|nuevo|crear)(\/|$)/i.test(href);
      if (textMatch || hrefMatch) {
        actions.push({
          text,
          href: href || null,
          tag: el.tagName.toLowerCase(),
        });
      }
    });
    return actions.slice(0, 5);
  });
}

async function discoverFields(page) {
  return page.evaluate(() => {
    // Must have a real <form> element with a submit button
    const form = document.querySelector('form');
    if (!form) return [];

    const hasSubmit = form.querySelector('button[type="submit"], input[type="submit"], button:not([type="button"]):not([type="reset"])');
    if (!hasSubmit) return [];
    const fields = [];
    form.querySelectorAll('input, select, textarea').forEach(el => {
      if (el.type === 'hidden' || el.type === 'submit' || el.type === 'search') return;
      // Skip nav/header inputs (search boxes, etc.)
      if (el.closest('nav, header, [class*="navbar"], [class*="header"], [class*="topbar"], [class*="sidebar"]')) return;
      const labelEl = el.id
        ? document.querySelector(`label[for="${el.id}"]`)
        : el.closest('.field, .form-group, [class*="field-"]')?.querySelector('label');
      fields.push({
        type: el.tagName === 'SELECT' ? 'select' : el.tagName === 'TEXTAREA' ? 'textarea' : el.type || 'text',
        name: el.name || el.id || el.getAttribute('aria-label') || el.placeholder || '(sin nombre)',
        label: labelEl?.innerText?.trim() || el.placeholder || el.getAttribute('aria-label') || null,
        placeholder: el.placeholder || '',
        required: el.required,
        maxLength: el.maxLength > 0 ? el.maxLength : null,
        options: el.tagName === 'SELECT' ? [...el.options].map(o => ({ value: o.value, text: o.text })) : null,
      });
    });
    return fields;
  });
}

async function discoverPageElements(page) {
  return page.evaluate(() => {
    const buttons = [];
    const columns = [];
    document.querySelectorAll('button, a.btn, [class*="btn"]').forEach(el => {
      const t = el.innerText?.trim();
      if (t && t.length < 60) buttons.push(t);
    });
    document.querySelectorAll('th').forEach(el => {
      const t = el.innerText?.trim();
      if (t) columns.push(t);
    });
    return {
      buttons: [...new Set(buttons)].filter(Boolean).slice(0, 20),
      columns: [...new Set(columns)].filter(Boolean).slice(0, 20),
    };
  });
}

module.exports = { discoverTabs, discoverActions, discoverFields, discoverPageElements };
