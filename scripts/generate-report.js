const fs = require('fs');
const path = require('path');
const MODULES = require('../config/modules');

const BASE = path.join(__dirname, '..', 'screenshots', 'comparacion');
const OUTPUT = path.join(__dirname, '..', 'informe-comparacion.html');

function imageToBase64(filePath) {
  try {
    const data = fs.readFileSync(filePath);
    return `data:image/png;base64,${data.toString('base64')}`;
  } catch {
    return null;
  }
}

function loadResultado(moduloId, plataforma) {
  const file = path.join(BASE, moduloId, plataforma, 'resultado.json');
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return null; }
}

function comparar(nueva, antigua) {
  if (!antigua) return { soloNueva: [], soloAntigua: [], comun: nueva?.pestanas?.map(p => p.nombre) || [] };
  const nombresNueva = new Set((nueva?.pestanas || []).map(p => p.nombre));
  const nombresAntigua = new Set((antigua?.pestanas || []).map(p => p.nombre));
  return {
    comun: [...nombresNueva].filter(n => nombresAntigua.has(n)),
    soloNueva: [...nombresNueva].filter(n => !nombresAntigua.has(n)),
    soloAntigua: [...nombresAntigua].filter(n => !nombresNueva.has(n)),
  };
}

let resumenModulos = [];

let contenidoModulos = '';
for (const modulo of MODULES) {
  const nueva = loadResultado(modulo.id, 'nueva');
  const antigua = modulo.antigua ? loadResultado(modulo.id, 'antigua') : null;
  const comp = comparar(nueva, antigua);

  const totalPestanas = new Set([
    ...(nueva?.pestanas || []).map(p => p.nombre),
    ...(antigua?.pestanas || []).map(p => p.nombre),
  ]).size;

  const estado = !nueva ? 'pendiente' : comp.soloAntigua.length > 0 ? 'incompleto' : 'completo';
  resumenModulos.push({ ...modulo, estado, comp, totalPestanas });

  // Generar pestañas lado a lado
  let pestanasHtml = '';
  const todasPestanas = [...new Set([
    ...(nueva?.pestanas || []).map(p => p.nombre),
    ...(antigua?.pestanas || []).map(p => p.nombre),
  ])];

  for (const nombrePestana of todasPestanas) {
    const pNueva = nueva?.pestanas?.find(p => p.nombre === nombrePestana);
    const pAntigua = antigua?.pestanas?.find(p => p.nombre === nombrePestana);

    const imgNueva = pNueva ? imageToBase64(path.join(BASE, modulo.id, 'nueva', pNueva.screenshot)) : null;
    const imgAntigua = pAntigua ? imageToBase64(path.join(BASE, modulo.id, 'antigua', pAntigua.screenshot)) : null;

    const enNueva = !!pNueva;
    const enAntigua = !!pAntigua;
    const badge = !enNueva ? '❌ Falta en nueva' : !enAntigua ? '🆕 Solo en nueva' : '✅ En ambas';

    // Comparar elementos
    let elementosDiff = '';
    if (pNueva && pAntigua) {
      const btnsNueva = new Set(pNueva.elementos?.botones || []);
      const btnsAntigua = new Set(pAntigua.elementos?.botones || []);
      const faltanBotones = [...btnsAntigua].filter(b => !btnsNueva.has(b));
      if (faltanBotones.length > 0) {
        elementosDiff = `<div class="diff-warning">⚠️ Botones en antigua que faltan en nueva: ${faltanBotones.map(b => `<span class="tag">${b}</span>`).join(' ')}</div>`;
      }
    }

    pestanasHtml += `
      <div class="pestana-bloque">
        <div class="pestana-header">
          <span class="pestana-nombre">${nombrePestana}</span>
          <span class="badge badge-${enNueva && enAntigua ? 'ok' : enNueva ? 'new' : 'missing'}">${badge}</span>
        </div>
        ${elementosDiff}
        <div class="screenshots-row">
          <div class="screenshot-col">
            <div class="plataforma-label">🆕 Nueva</div>
            ${imgNueva ? `<img src="${imgNueva}" alt="Nueva - ${nombrePestana}">` : '<div class="no-screenshot">Sin captura</div>'}
          </div>
          <div class="screenshot-col">
            <div class="plataforma-label">📦 Antigua</div>
            ${imgAntigua ? `<img src="${imgAntigua}" alt="Antigua - ${nombrePestana}">` : '<div class="no-screenshot">Sin equivalente</div>'}
          </div>
        </div>
      </div>`;
  }

  contenidoModulos += `
    <section class="modulo" id="${modulo.id}">
      <div class="modulo-header estado-${estado}">
        <h2>${modulo.nombre}</h2>
        <div class="modulo-meta">
          <span class="estado-badge">${estado === 'completo' ? '✅ Completo' : estado === 'incompleto' ? '⚠️ Incompleto' : '⏳ Pendiente'}</span>
          <span>${totalPestanas} pestañas</span>
          ${comp.soloAntigua.length > 0 ? `<span class="faltante">❌ Faltan en nueva: ${comp.soloAntigua.join(', ')}</span>` : ''}
          ${comp.soloNueva.length > 0 ? `<span class="nuevo">🆕 Solo en nueva: ${comp.soloNueva.join(', ')}</span>` : ''}
        </div>
      </div>
      <div class="pestanas-container">
        ${pestanasHtml || '<p class="pendiente-msg">⏳ Test pendiente de ejecutar</p>'}
      </div>
    </section>`;
}

// Estadísticas resumen
const total = resumenModulos.length;
const completos = resumenModulos.filter(m => m.estado === 'completo').length;
const incompletos = resumenModulos.filter(m => m.estado === 'incompleto').length;
const pendientes = resumenModulos.filter(m => m.estado === 'pendiente').length;
const porcentaje = Math.round((completos / total) * 100);

const resumenHtml = resumenModulos.map(m => `
  <a href="#${m.id}" class="resumen-item estado-${m.estado}">
    <span class="resumen-nombre">${m.nombre}</span>
    <span class="resumen-estado">${m.estado === 'completo' ? '✅' : m.estado === 'incompleto' ? '⚠️' : '⏳'}</span>
    <span class="resumen-count">${m.totalPestanas} tabs</span>
  </a>`).join('');

const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Comparativa Plataformas Fideltour</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f0f2f5; color: #1a1a2e; }

  header { background: #1a1a2e; color: white; padding: 24px 32px; position: sticky; top: 0; z-index: 100; box-shadow: 0 2px 8px rgba(0,0,0,0.3); }
  header h1 { font-size: 1.4rem; }
  header p { opacity: 0.7; font-size: 0.85rem; margin-top: 4px; }

  .stats-bar { display: flex; gap: 16px; padding: 20px 32px; background: white; border-bottom: 1px solid #e5e7eb; flex-wrap: wrap; }
  .stat { text-align: center; padding: 12px 24px; border-radius: 8px; }
  .stat-num { font-size: 2rem; font-weight: 700; }
  .stat-label { font-size: 0.75rem; text-transform: uppercase; opacity: 0.6; }
  .stat-total { background: #f0f2f5; }
  .stat-ok { background: #d1fae5; color: #065f46; }
  .stat-warn { background: #fef3c7; color: #92400e; }
  .stat-pend { background: #e0e7ff; color: #3730a3; }

  .progress-bar { height: 6px; background: #e5e7eb; }
  .progress-fill { height: 100%; background: #10b981; transition: width 0.5s; }

  .layout { display: flex; gap: 0; }

  .sidebar { width: 220px; min-width: 220px; background: white; border-right: 1px solid #e5e7eb; height: calc(100vh - 140px); overflow-y: auto; position: sticky; top: 90px; }
  .sidebar-title { padding: 12px 16px; font-size: 0.7rem; text-transform: uppercase; color: #6b7280; font-weight: 600; border-bottom: 1px solid #e5e7eb; }
  .resumen-item { display: flex; align-items: center; gap: 8px; padding: 10px 16px; text-decoration: none; color: inherit; border-bottom: 1px solid #f3f4f6; font-size: 0.85rem; }
  .resumen-item:hover { background: #f9fafb; }
  .resumen-nombre { flex: 1; }
  .resumen-count { font-size: 0.7rem; color: #9ca3af; }
  .estado-completo { border-left: 3px solid #10b981; }
  .estado-incompleto { border-left: 3px solid #f59e0b; }
  .estado-pendiente { border-left: 3px solid #6366f1; }

  .contenido { flex: 1; padding: 24px 32px; overflow-x: hidden; }

  .modulo { background: white; border-radius: 12px; margin-bottom: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); overflow: hidden; }
  .modulo-header { padding: 20px 24px; border-bottom: 1px solid #e5e7eb; }
  .modulo-header.estado-completo { border-left: 4px solid #10b981; }
  .modulo-header.estado-incompleto { border-left: 4px solid #f59e0b; }
  .modulo-header.estado-pendiente { border-left: 4px solid #6366f1; }
  .modulo-header h2 { font-size: 1.2rem; margin-bottom: 8px; }
  .modulo-meta { display: flex; gap: 12px; flex-wrap: wrap; align-items: center; font-size: 0.8rem; }
  .estado-badge { padding: 2px 10px; border-radius: 20px; background: #f3f4f6; font-weight: 500; }
  .faltante { color: #dc2626; }
  .nuevo { color: #2563eb; }

  .pestanas-container { padding: 20px 24px; }
  .pestana-bloque { margin-bottom: 32px; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; }
  .pestana-header { display: flex; align-items: center; gap: 12px; padding: 12px 16px; background: #f9fafb; border-bottom: 1px solid #e5e7eb; }
  .pestana-nombre { font-weight: 600; font-size: 0.95rem; }
  .badge { padding: 2px 10px; border-radius: 20px; font-size: 0.75rem; font-weight: 500; }
  .badge-ok { background: #d1fae5; color: #065f46; }
  .badge-new { background: #dbeafe; color: #1e40af; }
  .badge-missing { background: #fee2e2; color: #991b1b; }

  .diff-warning { padding: 8px 16px; background: #fef3c7; border-bottom: 1px solid #fde68a; font-size: 0.8rem; color: #92400e; }
  .tag { background: #fed7aa; padding: 1px 6px; border-radius: 4px; margin: 0 2px; }

  .screenshots-row { display: grid; grid-template-columns: 1fr 1fr; gap: 0; }
  .screenshot-col { padding: 16px; border-right: 1px solid #e5e7eb; }
  .screenshot-col:last-child { border-right: none; }
  .plataforma-label { font-size: 0.75rem; font-weight: 600; text-transform: uppercase; color: #6b7280; margin-bottom: 8px; }
  .screenshot-col img { width: 100%; border: 1px solid #e5e7eb; border-radius: 4px; cursor: pointer; transition: transform 0.2s; }
  .screenshot-col img:hover { transform: scale(1.02); }
  .no-screenshot { padding: 40px; text-align: center; background: #f9fafb; border-radius: 4px; color: #9ca3af; font-size: 0.85rem; }

  .pendiente-msg { padding: 40px; text-align: center; color: #9ca3af; }

  /* Lightbox */
  .lightbox { display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.9); z-index: 1000; justify-content: center; align-items: center; }
  .lightbox.active { display: flex; }
  .lightbox img { max-width: 90vw; max-height: 90vh; border-radius: 8px; }
  .lightbox-close { position: fixed; top: 20px; right: 30px; color: white; font-size: 2rem; cursor: pointer; }
</style>
</head>
<body>

<header>
  <h1>🔍 Comparativa Plataformas Fideltour</h1>
  <p>Nueva (saas.test) vs Antigua — Generado el ${new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
</header>

<div class="progress-bar"><div class="progress-fill" style="width:${porcentaje}%"></div></div>

<div class="stats-bar">
  <div class="stat stat-total"><div class="stat-num">${total}</div><div class="stat-label">Módulos totales</div></div>
  <div class="stat stat-ok"><div class="stat-num">${completos}</div><div class="stat-label">Completos</div></div>
  <div class="stat stat-warn"><div class="stat-num">${incompletos}</div><div class="stat-label">Incompletos</div></div>
  <div class="stat stat-pend"><div class="stat-num">${pendientes}</div><div class="stat-label">Pendientes</div></div>
  <div class="stat stat-ok"><div class="stat-num">${porcentaje}%</div><div class="stat-label">Completado</div></div>
</div>

<div class="layout">
  <nav class="sidebar">
    <div class="sidebar-title">Módulos</div>
    ${resumenHtml}
  </nav>
  <main class="contenido">
    ${contenidoModulos}
  </main>
</div>

<div class="lightbox" id="lightbox">
  <span class="lightbox-close" onclick="document.getElementById('lightbox').classList.remove('active')">✕</span>
  <img id="lightbox-img" src="" alt="">
</div>

<script>
  document.querySelectorAll('.screenshot-col img').forEach(img => {
    img.addEventListener('click', () => {
      document.getElementById('lightbox-img').src = img.src;
      document.getElementById('lightbox').classList.add('active');
    });
  });
  document.getElementById('lightbox').addEventListener('click', function(e) {
    if (e.target === this) this.classList.remove('active');
  });
</script>
</body>
</html>`;

fs.writeFileSync(OUTPUT, html);
console.log(`✅ Informe generado: informe-comparacion.html`);
console.log(`   Módulos: ${total} | Completos: ${completos} | Incompletos: ${incompletos} | Pendientes: ${pendientes}`);
