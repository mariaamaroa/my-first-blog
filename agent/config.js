module.exports = {
  platforms: {
    nueva: {
      name: 'Nueva (saas)',
      base: 'https://saas.test.fideltour.com',
      contactForm: 'https://saas.test.fideltour.com/crm/contacts/new',
      loginStart: 'https://saas.test.fideltour.com/crm/contacts',
    },
    antigua: {
      name: 'Antigua (grm)',
      base: 'https://grm.test.fideltour.com',
      contactForm: 'https://grm.test.fideltour.com/contacts/add/',
      loginStart: 'https://grm.test.fideltour.com/contacts/',
    },
  },
  auth: {
    email: process.env.FIDELTOUR_EMAIL || 'mamaroa@fideltour.com',
    password: process.env.FIDELTOUR_PASSWORD || '',
  },
  browser: {
    headless: process.env.QA_HEADLESS !== 'false',
    viewport: { width: 1440, height: 900 },
  },
  output: {
    dir: 'qa-results',
    report: 'qa-report.html',
  },
};
