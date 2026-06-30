# Fideltour QA — Comparativa de plataformas

Proyecto de QA automatizado para comparar la plataforma antigua (grm.test.fideltour.com) con la nueva (saas.test.fideltour.com).

## Contexto

- **Plataforma nueva**: https://saas.test.fideltour.com
- **Plataforma antigua**: https://grm.test.fideltour.com
- **Acceso**: requiere VPN activa y la variable `FIDELTOUR_PASSWORD`
- **Usuario**: mamaroa@fideltour.com

## Comandos principales

```bash
# Agente QA completo (descubre, genera tests, ejecuta, informe)
FIDELTOUR_PASSWORD=xxx npm run qa:headed

# Comparación visual de todos los módulos
FIDELTOUR_PASSWORD=xxx npm run comparar

# Generar informe HTML de comparación
npm run informe
```

## Estructura

```
agent/          → Agente QA automatizado
  index.js      → Orquestador principal (4 fases)
  config.js     → URLs y configuración de plataformas
  discover.js   → Descubre campos de formularios
  cases.js      → Genera test cases dinámicamente
  executor.js   → Ejecuta cada test con Playwright
  report.js     → Genera informe HTML

config/
  modules.js    → Los 13 módulos a comparar (CRM, Campaigns, etc.)

tests/
  compare-all.spec.js              → Comparación visual de todos los módulos
  crm-contacto-descubrir-form.spec.js  → Descubrimiento del formulario de contacto

scripts/
  generate-report.js  → Genera informe-comparacion.html

qa-results/     → Resultados del agente QA (generado al ejecutar)
qa-report.html  → Informe del agente QA (generado al ejecutar)
informe-comparacion.html  → Informe de comparación de módulos
```

## Módulos configurados

CRM, Campaigns, Automations, Landings, Reviews, Social, Rewards, Experiences, Identity, WhatsApp, AI Agents, Connect, Management.

## Notas

- Las plataformas solo son accesibles con VPN desde la máquina local
- Playwright usa Chromium headless por defecto; usa `qa:headed` para ver el navegador
- Los resultados en `qa-results/` no se commitean (están en .gitignore)
