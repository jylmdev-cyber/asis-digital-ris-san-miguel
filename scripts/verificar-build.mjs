#!/usr/bin/env node
// Paso posterior al build (npm run build):
//  1. genera el índice de búsqueda de cada edición (dist/<anio>/buscar.json) leyendo los atributos data-buscar;
//  2. verifica que no se publiquen datos sensibles;
//  3. verifica que todos los enlaces internos apunten a archivos existentes.
// Si algo falla, termina con código 1 y el despliegue se detiene.
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1')), '..');
const DIST = path.join(ROOT, 'dist');
const BASE = (process.env.BASE ?? '/asis-digital-ris-san-miguel/').replace(/\/?$/, '/');
const archivos = [];
(function rec(d) { for (const f of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, f.name); f.isDirectory() ? rec(p) : archivos.push(p); } })(DIST);
const rel = p => path.relative(DIST, p).split(path.sep).join('/');
const ent = s => s.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/&#x27;/g, "'");
let errores = 0;
const error = m => { errores++; console.error('  ✖ ' + m); };

// ---------------------------------------------------------------- 1. índice de búsqueda
const html = archivos.filter(f => f.endsWith('.html'));
const porEdicion = {};
for (const f of html) {
  const r = rel(f), m = r.match(/^(\d{4})\//); if (!m) continue;
  const anio = m[1], src = fs.readFileSync(f, 'utf8');
  const urlPagina = BASE + r.replace(/index\.html$/, '');
  const tituloPag = ent((src.match(/<title>([^<]*)<\/title>/) || [])[1] || '').split(' · ')[0];
  (porEdicion[anio] ??= []).push({ t: tituloPag, s: 'Página', u: urlPagina, k: ent((src.match(/<meta name="description" content="([^"]*)"/) || [])[1] || '') });
  for (const tag of src.matchAll(/<(section|figure|div|article|a)\b[^>]*\bdata-buscar="([^"]*)"[^>]*>/g)) {
    const t = tag[0], [titulo, sub = '', claves = ''] = ent(tag[2]).split('|');
    const id = (t.match(/\bid="([^"]+)"/) || [])[1], href = (t.match(/\bhref="([^"]+)"/) || [])[1];
    const u = tag[1] === 'a' && href ? href : id ? `${urlPagina}#${id}` : urlPagina;
    (porEdicion[anio]).push({ t: titulo, s: `${tituloPag}${sub ? ' · ' + sub : ''}`, u, k: claves });
  }
}
for (const [anio, items] of Object.entries(porEdicion)) {
  const vistos = new Set(), unicos = items.filter(i => { const k = i.t + i.u; if (vistos.has(k)) return false; vistos.add(k); return true; });
  fs.writeFileSync(path.join(DIST, anio, 'buscar.json'), JSON.stringify(unicos));
  console.log(`✔ índice de búsqueda ${anio}: ${unicos.length} entradas`);
}

// ---------------------------------------------------------------- 2. privacidad
// Patrones genéricos (públicos). Los términos específicos del caso protegido están en
// datos-fuente/terminos-prohibidos.txt, que no se versiona; si existe, también se aplican.
const PROHIBIDOS = [/\bMEF de \d+/i, /\bgesta\s*\d/i, /"privacidad":\s*"interna"/, /mortalidad_materna_interno/, /DIRECTOR|TELEFONO/,
  /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i];
const LOCAL = path.join(ROOT, 'datos-fuente', 'terminos-prohibidos.txt');
if (fs.existsSync(LOCAL)) for (const l of fs.readFileSync(LOCAL, 'utf8').split(/\r?\n/)) if (l.trim() && !l.startsWith('#')) PROHIBIDOS.push(new RegExp(l.trim(), 'is'));
console.log(`  revisión de privacidad con ${PROHIBIDOS.length} patrones${fs.existsSync(LOCAL) ? ' (incluye lista local)' : ''}`);
const textuales = archivos.filter(f => /\.(html|json|csv|js|geojson|xml|txt)$/.test(f));
for (const f of textuales) {
  const s = fs.readFileSync(f, 'utf8');
  for (const re of PROHIBIDOS) if (re.test(s)) error(`término sensible ${re} en ${rel(f)}`);
  if (/\.(json|csv|geojson)$/.test(f)) {
    const dni = s.match(/(?<![\d.,])\d{8}(?![\d.,])/g)?.filter(x => !/^000\d{5}$/.test(x)); // códigos RENIPRESS (000xxxxx) permitidos
    if (dni?.length) error(`posible número de documento (8 dígitos) en ${rel(f)}: ${dni.slice(0, 3).join(', ')}`);
  }
}
if (archivos.some(f => /\.(pdf|docx?|xlsx?)$/i.test(f))) error('el build contiene documentos de oficina o PDF; solo se publican si están autorizados');
if (fs.existsSync(path.join(DIST, 'interno'))) error('existe una carpeta «interno» en el build');
console.log(errores ? '' : '✔ privacidad: sin hallazgos');

// ---------------------------------------------------------------- 3. enlaces internos
const existentes = new Set(archivos.map(rel));
let enlaces = 0;
for (const f of html) {
  const s = fs.readFileSync(f, 'utf8');
  for (const m of s.matchAll(/\s(?:href|src)="([^"#?]+)[^"]*"/g)) {
    const u = ent(m[1]);
    if (!u.startsWith(BASE)) continue;
    enlaces++;
    const r = decodeURI(u.slice(BASE.length));
    const ok = existentes.has(r) || existentes.has(r.replace(/\/?$/, '/') + 'index.html') || existentes.has(r + '.html');
    if (!ok) error(`enlace roto en ${rel(f)}: ${u}`);
  }
}
console.log(`✔ enlaces internos revisados: ${enlaces}`);

const kb = f => Math.round(fs.statSync(f).size / 1024);
const total = archivos.reduce((s, f) => s + fs.statSync(f).size, 0);
console.log(`✔ ${html.length} páginas · ${archivos.length} archivos · ${(total / 1024 / 1024).toFixed(2)} MB`);
const grandes = archivos.filter(f => kb(f) > 300).map(f => `${rel(f)} (${kb(f)} KB)`);
if (grandes.length) console.log('  archivos > 300 KB:', grandes.join(', '));
if (errores) { console.error(`\n✖ ${errores} problema(s): build NO apto para publicar`); process.exit(1); }
