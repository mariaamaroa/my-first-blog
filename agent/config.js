module.exports = {
  platform: {
    name: 'Nueva (saas)',
    base: 'https://saas.test.fideltour.com',
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
  modules: [
    { id: 'crm',          name: 'CRM',          url: 'https://saas.test.fideltour.com/crm/contacts' },
    { id: 'campaigns',    name: 'Campaigns',    url: 'https://saas.test.fideltour.com/marketing/campaigns' },
    { id: 'automations',  name: 'Automations',  url: 'https://saas.test.fideltour.com/automations' },
    { id: 'landings',     name: 'Landings',     url: 'https://saas.test.fideltour.com/landings/' },
    { id: 'reviews',      name: 'Reviews',      url: 'https://saas.test.fideltour.com/reviews/polls' },
    { id: 'social',       name: 'Social',       url: 'https://saas.test.fideltour.com/social/' },
    { id: 'rewards',      name: 'Rewards',      url: 'https://saas.test.fideltour.com/rewards/dashboard' },
    { id: 'experiences',  name: 'Experiences',  url: 'https://saas.test.fideltour.com/experiences/dashboard' },
    { id: 'identity',     name: 'Identity',     url: 'https://saas.test.fideltour.com/identity/' },
    { id: 'whatsapp',     name: 'WhatsApp',     url: 'https://saas.test.fideltour.com/whatsapp/' },
    { id: 'ai-agents',    name: 'AI Agents',    url: 'https://saas.test.fideltour.com/agents' },
    { id: 'connect',      name: 'Connect',      url: 'https://saas.test.fideltour.com/connect/connections' },
    { id: 'management',   name: 'Management',   url: 'https://saas.test.fideltour.com/management/dashboard' },
  ],
};
