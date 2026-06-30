const fs = require('fs');
const path = require('path');

function img64(filePath) {
  try {
    return `data:image/png;base64,${fs.readFileSync(filePath).toString('base64')}`;
  } catch { return null; }
}

function badge(passed) {
  return passed
    ? `<span class="badge ok">✅ Pasado</span>`
    : `<span class="badge fail">❌ Fallido</span>`;
}

function generateReport({ discoveries, cases, results, outputDir, reportPath }) {
  const platforms = Object.keys(results);
  const allCaseIds = [...new Set(cases.map(c => c.id))];

  // Stats
  const stats = {};
  for (const p of platforms) {
    const r = results[p];
    stats[p] = {
      total: r.length,
      passed: r.filter(x => x.passed).length,
      failed: r.filter(x => !x.passed).length,
    };
  }

  // Field comparison
  const fieldMap = {};
  for (const { platform, fields } of discoveries) {
    for (const f of fields) {
      if (!fieldMap[f.name]) fieldMap[f.name] = {};
      fieldMap[f.name][platform] = f;
    }
  }
  const platformNames = discoveries.map(d => d.platform);
  const onlyInNew = Object.entries(fieldMap).filter(([, p]) => p[platformNames[0]] && !p[platformNames[1]]);
  const onlyInOld = Object.entries(fieldMap).filter(([, p]) => !p[platformNames[0]] && p[platformNames[1]]);
  const inBoth = Object.entries(fieldMap).filter(([, p]) => p[platformNames[0]] && p[platformNames[1]]);

  // Results table rows
  let tableRows = '';
  for (const caseId of allCaseIds) {
    const c = cases.find(x => x.id === caseId);
    tableRows += `<tr><td class="case-name">${c.name}</td><td class="case-desc">${c.description}</td>`;
    for (const p of platforms) {
      const r = results[p].find(x => x.id === caseId);
      if (!r) { tableRows += `<td>—</td>`; continue; }
      const imgSrc = r.screenshot ? img64(path.join(outputDir, r.screenshot)) : null;
      tableRows += `<td class="${r.passed ? 'cell-ok' : 'cell-fail'}">
        ${badge(r.passed)}
        <div class="outcome">Resultado: <code>${r.actual || 'error'}</code></div>
        ${r.error ? `<div class="err-msg">${r.error.slice(0, 120)}</div>` : ''}
        ${imgSrc ? `<img class="thumb" src="${imgSrc}" onclick="openLightbox(this.src)">` : ''}
      </td>`;
    }
    tableRows += `</tr>`;
  }

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>QA — Formulario nuevo contacto</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f0f3f8;color:#0f1e35;font-size:14px}
  header{background:#0f1e35;color:white;padding:20px 32px}
  header h1{font-size:1.3rem;font-weight:700}
  header p{opacity:.6;font-size:.8rem;margin-top:4px}
  .container{max-width:1300px;margin:0 auto;padding:28px 32px}
  .stats{display:flex;gap:16px;margin-bottom:28px;flex-wrap:wrap}
  .stat{background:white;border-radius:10px;padding:16px 22px;border:1px solid #dde3ec;min-width:160px}
  .stat-platform{font-size:.7rem;text-transform:uppercase;letter-spacing:.06em;color:#8a97a8;margin-bottom:6px}
  .stat-nums{display:flex;gap:16px;align-items:baseline}
  .stat-total{font-size:2rem;font-weight:700}
  .stat-ok{color:#1db87a;font-size:1.1rem;font-weight:600}
  .stat-fail{color:#e8334a;font-size:1.1rem;font-weight:600}
  .progress{height:5px;background:#e5e7eb;border-radius:3px;margin-top:10px;overflow:hidden}
  .progress-fill{height:100%;background:#1db87a;border-radius:3px}
  h2{font-size:1rem;font-weight:700;margin-bottom:14px;margin-top:28px;color:#0f1e35}
  .fields-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px;margin-bottom:28px}
  .fields-card{background:white;border-radius:10px;border:1px solid #dde3ec;padding:16px}
  .fields-card h3{font-size:.75rem;text-transform:uppercase;letter-spacing:.06em;margin-bottom:10px}
  .fields-card.ok h3{color:#1db87a}
  .fields-card.warn h3{color:#e8334a}
  .fields-card.neutral h3{color:#2a6ef5}
  .field-pill{display:inline-block;background:#f0f3f8;border-radius:5px;padding:3px 9px;font-size:.78rem;margin:2px;font-family:monospace}
  .table-wrap{overflow-x:auto}
  table{width:100%;border-collapse:collapse;background:white;border-radius:10px;overflow:hidden;border:1px solid #dde3ec}
  th{background:#0f1e35;color:white;padding:12px 14px;text-align:left;font-size:.78rem;font-weight:600;white-space:nowrap}
  td{padding:12px 14px;border-bottom:1px solid #eef0f3;vertical-align:top;font-size:.82rem}
  tr:last-child td{border-bottom:none}
  .case-name{font-weight:600;max-width:200px}
  .case-desc{color:#4a5a70;max-width:220px;font-size:.78rem}
  .cell-ok{background:#f0fdf8}
  .cell-fail{background:#fff5f5}
  .badge{display:inline-block;padding:2px 9px;border-radius:20px;font-size:.72rem;font-weight:700}
  .badge.ok{background:#dcfce7;color:#15803d}
  .badge.fail{background:#fee2e2;color:#b91c1c}
  .outcome{font-size:.72rem;color:#4a5a70;margin-top:4px}
  .err-msg{font-size:.7rem;color:#b91c1c;margin-top:3px;font-family:monospace;word-break:break-all}
  .thumb{width:100%;max-width:260px;border-radius:6px;border:1px solid #dde3ec;margin-top:8px;cursor:pointer;transition:transform .15s}
  .thumb:hover{transform:scale(1.03)}
  code{background:#f0f3f8;padding:1px 5px;border-radius:4px;font-size:.78rem}
  .lightbox{display:none;position:fixed;inset:0;background:rgba(0,0,0,.85);z-index:999;align-items:center;justify-content:center}
  .lightbox.on{display:flex}
  .lightbox img{max-width:92vw;max-height:92vh;border-radius:8px}
  .lightbox-close{position:fixed;top:18px;right:24px;color:white;font-size:2rem;cursor:pointer;line-height:1}
</style>
</head>
<body>
<header>
  <h1>QA — Formulario nuevo contacto</h1>
  <p>Generado el ${new Date().toLocaleString('es-ES')} · ${platforms.join(' vs ')}</p>
</header>
<div class="container">

  <h2>Resumen por plataforma</h2>
  <div class="stats">
    ${platforms.map(p => {
      const s = stats[p];
      const pct = Math.round((s.passed / s.total) * 100);
      return `<div class="stat">
        <div class="stat-platform">${p}</div>
        <div class="stat-nums">
          <span class="stat-total">${s.total}</span>
          <span class="stat-ok">✅ ${s.passed}</span>
          <span class="stat-fail">❌ ${s.failed}</span>
        </div>
        <div class="progress"><div class="progress-fill" style="width:${pct}%"></div></div>
      </div>`;
    }).join('')}
  </div>

  <h2>Comparativa de campos</h2>
  <div class="fields-grid">
    <div class="fields-card neutral">
      <h3>✅ En ambas plataformas (${inBoth.length})</h3>
      ${inBoth.map(([name]) => `<span class="field-pill">${name}</span>`).join('')}
    </div>
    <div class="fields-card ok">
      <h3>🆕 Solo en nueva (${onlyInNew.length})</h3>
      ${onlyInNew.map(([name]) => `<span class="field-pill">${name}</span>`).join('') || '<span style="color:#8a97a8;font-size:.8rem">Ninguno</span>'}
    </div>
    <div class="fields-card warn">
      <h3>❌ Solo en antigua (${onlyInOld.length})</h3>
      ${onlyInOld.map(([name]) => `<span class="field-pill">${name}</span>`).join('') || '<span style="color:#8a97a8;font-size:.8rem">Ninguno</span>'}
    </div>
  </div>

  <h2>Resultados de los test cases</h2>
  <div class="table-wrap">
    <table>
      <thead>
        <tr>
          <th>Test</th>
          <th>Descripción</th>
          ${platforms.map(p => `<th>${p}</th>`).join('')}
        </tr>
      </thead>
      <tbody>${tableRows}</tbody>
    </table>
  </div>

</div>

<div class="lightbox" id="lb" onclick="closeLightbox()">
  <span class="lightbox-close" onclick="closeLightbox()">✕</span>
  <img id="lb-img" src="">
</div>
<script>
  function openLightbox(src){document.getElementById('lb-img').src=src;document.getElementById('lb').classList.add('on')}
  function closeLightbox(){document.getElementById('lb').classList.remove('on')}
</script>
</body>
</html>`;

  fs.writeFileSync(reportPath, html);
}

module.exports = { generateReport };
