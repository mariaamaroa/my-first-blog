const fs = require('fs');
const path = require('path');

function img64(p) {
  try { return `data:image/png;base64,${fs.readFileSync(p).toString('base64')}`; }
  catch { return null; }
}

function statusIcon(passed) {
  return passed ? '✅' : '❌';
}

function generateReport({ moduleResults, reportPath }) {
  const totalModules = moduleResults.length;
  const modulesWithForms = moduleResults.filter(m => m.cases.length > 0).length;
  const totalTests = moduleResults.reduce((s, m) => s + m.cases.length, 0);
  const totalPassed = moduleResults.reduce((s, m) => s + m.results.filter(r => r.passed).length, 0);
  const totalFailed = totalTests - totalPassed;
  const pct = totalTests > 0 ? Math.round((totalPassed / totalTests) * 100) : 0;

  const modulesSections = moduleResults.map(mod => {
    const modPassed = mod.results.filter(r => r.passed).length;
    const modTotal = mod.results.length;
    const modPct = modTotal > 0 ? Math.round((modPassed / modTotal) * 100) : null;
    const estado = modTotal === 0 ? 'sin-form' : modPassed === modTotal ? 'ok' : 'fail';

    const tabsHtml = mod.tabs.map((tab, i) => {
      const imgSrc = tab.screenshot ? img64(path.join(path.dirname(reportPath), 'qa-results', mod.id, `tab-${i}.png`)) : null;
      return `<div class="tab-block">
        <div class="tab-name">${tab.text}</div>
        ${imgSrc ? `<img class="thumb" src="${imgSrc}" onclick="openLb(this.src)">` : '<div class="no-cap">Sin captura</div>'}
      </div>`;
    }).join('');

    const testsHtml = mod.cases.map((c, i) => {
      const r = mod.results[i];
      if (!r) return '';
      const imgSrc = r.screenshot ? img64(path.join(path.dirname(reportPath), 'qa-results', mod.id, r.screenshot)) : null;
      return `<tr class="${r.passed ? 'row-ok' : 'row-fail'}">
        <td>${statusIcon(r.passed)}</td>
        <td class="td-name">${c.name}</td>
        <td class="td-desc">${c.description}</td>
        <td><code>${r.actual || 'error'}</code></td>
        <td><code>${c.expect}</code></td>
        <td class="td-dur">${r.duration}ms</td>
        <td>${imgSrc ? `<img class="thumb-sm" src="${imgSrc}" onclick="openLb(this.src)">` : '—'}</td>
      </tr>`;
    }).join('');

    return `<section class="mod-section" id="${mod.id}">
      <div class="mod-header estado-${estado}">
        <div class="mod-title">
          <span class="mod-name">${mod.name}</span>
          ${modTotal > 0
            ? `<span class="mod-stats">${modPassed}/${modTotal} tests · ${modPct}%</span>`
            : `<span class="mod-stats no-form">Sin formulario detectado</span>`}
        </div>
        <div class="mod-badges">
          ${mod.tabs.length > 0 ? `<span class="badge-tab">${mod.tabs.length} pestañas</span>` : ''}
          ${mod.fields.length > 0 ? `<span class="badge-field">${mod.fields.length} campos</span>` : ''}
        </div>
      </div>

      ${mod.tabs.length > 0 ? `
      <div class="tabs-row">${tabsHtml}</div>` : ''}

      ${modTotal > 0 ? `
      <div class="tests-wrap">
        <table class="tests-table">
          <thead><tr>
            <th></th><th>Test</th><th>Descripción</th>
            <th>Resultado</th><th>Esperado</th><th>Tiempo</th><th>Captura</th>
          </tr></thead>
          <tbody>${testsHtml}</tbody>
        </table>
      </div>` : ''}
    </section>`;
  }).join('');

  const sidebarHtml = moduleResults.map(mod => {
    const modPassed = mod.results.filter(r => r.passed).length;
    const modTotal = mod.results.length;
    const estado = modTotal === 0 ? 'sin-form' : modPassed === modTotal ? 'ok' : 'fail';
    return `<a href="#${mod.id}" class="sb-item sb-${estado}">
      <span class="sb-icon">${estado === 'ok' ? '✅' : estado === 'fail' ? '❌' : '⚪'}</span>
      <span class="sb-name">${mod.name}</span>
      ${modTotal > 0 ? `<span class="sb-count">${modPassed}/${modTotal}</span>` : ''}
    </a>`;
  }).join('');

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>QA Report — Fideltour saas</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f0f3f8;color:#0f1e35;font-size:13.5px}
a{text-decoration:none;color:inherit}

header{background:#0f1e35;color:white;padding:18px 28px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:100}
header h1{font-size:1.2rem;font-weight:700}
header p{opacity:.55;font-size:.78rem;margin-top:3px}
.header-stats{display:flex;gap:20px;text-align:center}
.hs{color:white}
.hs-num{font-size:1.5rem;font-weight:700;display:block}
.hs-label{font-size:.65rem;opacity:.6;text-transform:uppercase;letter-spacing:.06em}
.hs.ok .hs-num{color:#4ade80}
.hs.fail .hs-num{color:#f87171}

.progress-bar{height:4px;background:#1a2e48}
.progress-fill{height:100%;background:#4ade80;transition:width .5s}

.layout{display:flex;min-height:calc(100vh - 72px)}

.sidebar{width:200px;min-width:200px;background:white;border-right:1px solid #dde3ec;position:sticky;top:68px;height:calc(100vh - 68px);overflow-y:auto;padding:12px 0}
.sb-title{font-size:.65rem;text-transform:uppercase;letter-spacing:.08em;color:#8a97a8;padding:8px 16px 4px;font-weight:700}
.sb-item{display:flex;align-items:center;gap:7px;padding:7px 16px;border-bottom:none;font-size:.82rem;cursor:pointer;transition:background .1s}
.sb-item:hover{background:#f0f3f8}
.sb-ok{border-left:3px solid #4ade80}
.sb-fail{border-left:3px solid #f87171}
.sb-sin-form{border-left:3px solid #d1d5db}
.sb-name{flex:1}
.sb-count{font-size:.7rem;color:#8a97a8}

.main{flex:1;padding:24px 28px;overflow-x:hidden}

.summary-cards{display:flex;gap:14px;margin-bottom:24px;flex-wrap:wrap}
.sc{background:white;border-radius:10px;border:1px solid #dde3ec;padding:14px 20px;min-width:130px}
.sc-num{font-size:1.8rem;font-weight:700}
.sc-label{font-size:.7rem;text-transform:uppercase;letter-spacing:.06em;color:#8a97a8;margin-top:3px}
.sc-ok .sc-num{color:#16a34a}
.sc-fail .sc-num{color:#dc2626}
.sc-pct .sc-num{color:#2563eb}

.mod-section{background:white;border-radius:10px;border:1px solid #dde3ec;margin-bottom:20px;overflow:hidden}
.mod-header{padding:14px 20px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #eef0f3}
.estado-ok{border-left:4px solid #4ade80}
.estado-fail{border-left:4px solid #f87171}
.estado-sin-form{border-left:4px solid #d1d5db}
.mod-name{font-weight:700;font-size:.95rem;margin-right:10px}
.mod-stats{font-size:.78rem;color:#4a5a70}
.mod-stats.no-form{color:#9ca3af;font-style:italic}
.mod-badges{display:flex;gap:8px}
.badge-tab,.badge-field{font-size:.7rem;padding:2px 8px;border-radius:20px;background:#f0f3f8;color:#4a5a70}

.tabs-row{display:flex;gap:12px;padding:16px 20px;overflow-x:auto;border-bottom:1px solid #eef0f3}
.tab-block{min-width:220px;max-width:260px;flex-shrink:0}
.tab-name{font-size:.72rem;font-weight:600;color:#4a5a70;margin-bottom:6px;text-transform:uppercase;letter-spacing:.04em}
.thumb{width:100%;border-radius:6px;border:1px solid #dde3ec;cursor:pointer;transition:transform .15s}
.thumb:hover{transform:scale(1.02)}
.no-cap{padding:30px;text-align:center;background:#f9fafb;border-radius:6px;color:#9ca3af;font-size:.78rem}

.tests-wrap{padding:0;overflow-x:auto}
.tests-table{width:100%;border-collapse:collapse;font-size:.8rem}
.tests-table th{padding:9px 12px;text-align:left;font-size:.7rem;text-transform:uppercase;letter-spacing:.05em;color:#8a97a8;border-bottom:1px solid #eef0f3;background:#fafbfc;font-weight:600}
.tests-table td{padding:10px 12px;border-bottom:1px solid #f3f4f6;vertical-align:middle}
.tests-table tr:last-child td{border-bottom:none}
.row-ok{background:#fafffe}
.row-fail{background:#fff8f8}
.td-name{font-weight:500;max-width:180px}
.td-desc{color:#4a5a70;max-width:200px}
.td-dur{color:#9ca3af;white-space:nowrap}
code{background:#f0f3f8;padding:1px 6px;border-radius:4px;font-size:.75rem;font-family:monospace}
.thumb-sm{width:60px;border-radius:4px;cursor:pointer;border:1px solid #dde3ec}

.lightbox{display:none;position:fixed;inset:0;background:rgba(0,0,0,.88);z-index:999;align-items:center;justify-content:center}
.lightbox.on{display:flex}
.lightbox img{max-width:90vw;max-height:90vh;border-radius:8px}
.lb-close{position:fixed;top:16px;right:22px;color:white;font-size:2rem;cursor:pointer;line-height:1}
</style>
</head>
<body>
<header>
  <div>
    <h1>QA Report — Fideltour saas</h1>
    <p>Generado el ${new Date().toLocaleString('es-ES')} · saas.test.fideltour.com</p>
  </div>
  <div class="header-stats">
    <div class="hs"><span class="hs-num">${totalModules}</span><span class="hs-label">Módulos</span></div>
    <div class="hs ok"><span class="hs-num">${totalPassed}</span><span class="hs-label">Pasados</span></div>
    <div class="hs fail"><span class="hs-num">${totalFailed}</span><span class="hs-label">Fallidos</span></div>
    <div class="hs"><span class="hs-num">${pct}%</span><span class="hs-label">Completado</span></div>
  </div>
</header>
<div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>

<div class="layout">
  <nav class="sidebar">
    <div class="sb-title">Módulos</div>
    ${sidebarHtml}
  </nav>
  <main class="main">
    <div class="summary-cards">
      <div class="sc"><div class="sc-num">${totalModules}</div><div class="sc-label">Módulos</div></div>
      <div class="sc"><div class="sc-num">${modulesWithForms}</div><div class="sc-label">Con formulario</div></div>
      <div class="sc"><div class="sc-num">${totalTests}</div><div class="sc-label">Tests totales</div></div>
      <div class="sc sc-ok"><div class="sc-num">${totalPassed}</div><div class="sc-label">Pasados</div></div>
      <div class="sc sc-fail"><div class="sc-num">${totalFailed}</div><div class="sc-label">Fallidos</div></div>
      <div class="sc sc-pct"><div class="sc-num">${pct}%</div><div class="sc-label">Éxito</div></div>
    </div>
    ${modulesSections}
  </main>
</div>

<div class="lightbox" id="lb" onclick="closeLb()">
  <span class="lb-close">✕</span>
  <img id="lb-img" src="">
</div>
<script>
function openLb(src){document.getElementById('lb-img').src=src;document.getElementById('lb').classList.add('on')}
function closeLb(){document.getElementById('lb').classList.remove('on')}
</script>
</body>
</html>`;

  fs.writeFileSync(reportPath, html);
}

module.exports = { generateReport };
