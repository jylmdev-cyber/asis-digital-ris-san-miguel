#!/usr/bin/env node
// Prepara los datos PÚBLICOS de una edición del ASIS a partir de los datos fuente (no versionados).
//
//   node scripts/preparar-datos.mjs [anio]     (por defecto 2025)
//
// Entradas (carpeta datos-fuente/<anio>/, excluida del repositorio):
//   asis-completo.json      tablas extraídas del DOC/PDF oficiales, incluidas las de uso interno
//   geo-ign/*.geojson       capas descargadas de la IDEP / IGN (límites y establecimientos)
// Salidas (versionadas, públicas):
//   src/data/ediciones/<anio>/asis.json
//   src/data/ediciones/<anio>/geo/distritos.json
//   src/data/ediciones/<anio>/geo/establecimientos.json
//
// Este script se ejecuta solo al incorporar una edición nueva. Después, las correcciones se hacen
// directamente en los JSON públicos y se validan con `npm test`.
import fs from 'node:fs';
import path from 'node:path';

const ANIO = process.argv[2] || '2025';
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1')), '..');
const SRC = path.join(ROOT, 'datos-fuente', ANIO);
const OUT = path.join(ROOT, 'src', 'data', 'ediciones', ANIO);
const leer = f => JSON.parse(fs.readFileSync(path.join(SRC, f), 'utf8'));
const escribir = (f, d) => { fs.mkdirSync(path.dirname(path.join(OUT, f)), { recursive: true }); fs.writeFileSync(path.join(OUT, f), JSON.stringify(d, null, 1) + '\n'); console.log('✔', path.join('src/data/ediciones', ANIO, f)); };

// ---------------------------------------------------------------- distritos y UBIGEO (INEI)
const UBIGEO = {
  'San Miguel': '061101', 'Bolívar': '061102', 'Calquis': '061103', 'Catilluc': '061104', 'El Prado': '061105',
  'La Florida': '061106', 'Llapa': '061107', 'Nanchoc': '061108', 'Niepos': '061109', 'San Gregorio': '061110',
  'San Silvestre de Cochán': '061111', 'Tongod': '061112', 'Unión Agua Blanca': '061113',
};
const sinTilde = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().trim();
const POR_NOMBRE = Object.fromEntries(Object.keys(UBIGEO).map(d => [sinTilde(d), d]));
const canon = s => POR_NOMBRE[sinTilde(s)] || s;
const slug = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

// ---------------------------------------------------------------- 1. datos tabulares públicos
const completo = leer('asis-completo.json');
const pub = structuredClone(completo);
pub.tablas = pub.tablas.filter(t => t.privacidad !== 'interna');
for (const t of pub.tablas) {
  if (t.suprimir_sexo_publico) {           // menos de 10 defunciones en el grupo: sin desagregar por sexo
    t.cols = ['Grupo de enfermedad', 'N°', '%'];
    t.rows = t.rows.map(r => [r[0], r[1], r[4]]);
    t.nota = (t.nota ? t.nota + ' ' : '') + 'Versión pública: no se desagrega por sexo porque el grupo tiene menos de 10 defunciones.';
  }
  delete t.privacidad;
  delete t.suprimir_sexo_publico;
}
delete pub.texto.mortalidad_materna_interno;
pub.edicion = ANIO;
pub.distritos = pub.distritos.map(d => ({ nombre: d, ubigeo: UBIGEO[d], slug: slug(d) }));
pub.excluido_por_privacidad = [
  { ref: 'Tabla 15', motivo: 'Mortalidad perinatal por distrito con 1 o 2 casos por distrito: se publica solo el total provincial (3 fetales y 3 neonatales).' },
  { ref: 'Cuadros 40 a 42', motivo: 'Mortalidad en niños, adolescentes y jóvenes (7, 1 y 4 defunciones): se publica sin desagregar por sexo.' },
  { ref: 'Capítulo VI, pág. 70', motivo: 'Descripción del caso de muerte materna de 2024 (localidad, establecimiento, edad e historia obstétrica): no se reproduce.' },
];
escribir('asis.json', pub);

// ---------------------------------------------------------------- 2. geometría (IGN / INEI vía IDEP)
// Simplificación Douglas-Peucker + redondeo a 5 decimales (~1 m).
function dp(pts, tol) {
  if (pts.length < 3) return pts;
  const [ax, ay] = pts[0], [bx, by] = pts[pts.length - 1];
  let idx = -1, max = 0;
  for (let i = 1; i < pts.length - 1; i++) {
    const [px, py] = pts[i];
    const dx = bx - ax, dy = by - ay, L = dx * dx + dy * dy;
    let t = L ? ((px - ax) * dx + (py - ay) * dy) / L : 0; t = Math.max(0, Math.min(1, t));
    const d = Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
    if (d > max) { max = d; idx = i; }
  }
  if (max <= tol) return [pts[0], pts[pts.length - 1]];
  return [...dp(pts.slice(0, idx + 1), tol).slice(0, -1), ...dp(pts.slice(idx), tol)];
}
const r5 = n => Math.round(n * 1e5) / 1e5;
const simpRing = ring => { const s = dp(ring, 0.00025).map(([x, y]) => [r5(x), r5(y)]); return s.length >= 4 ? s : ring.map(([x, y]) => [r5(x), r5(y)]); };
const simpGeom = g => g.type === 'Polygon' ? { type: 'Polygon', coordinates: g.coordinates.map(simpRing) }
  : { type: 'MultiPolygon', coordinates: g.coordinates.map(p => p.map(simpRing)) };

const FUENTE_GEO = {
  nombre: 'Límite referencial distrital – Instituto Geográfico Nacional (IGN), servicio DATOS_GEOESPACIALES/LÍMITES de la Infraestructura de Datos Espaciales del Perú (IDEP); atributo FUENTE: INEI',
  url: 'https://www.idep.gob.pe/geoportal/rest/services/DATOS_GEOESPACIALES/L%C3%8DMITES/FeatureServer/5',
  fecha_descarga: '2026-10-07',
  nota: 'Límites referenciales, no constituyen demarcación oficial. Geometría simplificada (tolerancia ~25 m) para la web.',
};
const rawD = JSON.parse(fs.readFileSync(path.join(SRC, 'geo-ign', 'distritos.geojson'), 'utf8'));
const distritos = {
  type: 'FeatureCollection', fuente: FUENTE_GEO,
  features: rawD.features.map(f => {
    const nombre = canon(f.properties.NOMBDIST);
    if (!UBIGEO[nombre] || UBIGEO[nombre] !== f.properties.UBIGEO) throw new Error(`UBIGEO no coincide: ${f.properties.NOMBDIST} ${f.properties.UBIGEO}`);
    return { type: 'Feature', properties: { ubigeo: f.properties.UBIGEO, distrito: nombre, slug: slug(nombre), capital: f.properties.CAPITAL ?? null }, geometry: simpGeom(f.geometry) };
  }).sort((a, b) => a.properties.ubigeo.localeCompare(b.properties.ubigeo)),
};
escribir('geo/distritos.json', distritos);

// Punto en polígono (ray casting) sobre la geometría ORIGINAL, para verificar coordenadas.
const inRing = ([x, y], ring) => { let c = false; for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) { const [xi, yi] = ring[i], [xj, yj] = ring[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c; } return c; };
const inGeom = (pt, g) => (g.type === 'Polygon' ? [g.coordinates] : g.coordinates).some(p => inRing(pt, p[0]) && !p.slice(1).some(h => inRing(pt, h)));
const distritoDe = pt => { const f = rawD.features.find(f => inGeom(pt, f.geometry)); return f ? canon(f.properties.NOMBDIST) : null; };

const rawS = JSON.parse(fs.readFileSync(path.join(SRC, 'geo-ign', 'salud.geojson'), 'utf8'));
const MENORES = new Set(['de', 'del', 'la', 'las', 'los', 'o', 'y', 'con', 'en']);
const tit = s => s.toLowerCase().split(/\s+/).map((w, i) => (i > 0 && MENORES.has(w)) ? w : w.charAt(0).toUpperCase() + w.slice(1)).join(' ').replace(/Essalud/g, 'EsSalud');
const frase = s => { const t = s.toLowerCase(); return t.charAt(0).toUpperCase() + t.slice(1); };
const establecimientos = {
  type: 'FeatureCollection',
  fuente: {
    nombre: 'Capa SALUD de INFRAESTRUCTURA_SOCIAL – Instituto Geográfico Nacional (IGN), Infraestructura de Datos Espaciales del Perú (IDEP)',
    url: 'https://www.idep.gob.pe/geoportal/rest/services/INSTITUCIONALES/INFRAESTRUCTURA_SOCIAL/FeatureServer/2',
    fecha_descarga: '2026-10-07',
    nota: 'Fuente adicional al ASIS. La categoría y la microrred provienen de esta capa y pueden diferir del Cuadro 5 del ASIS. No se publican los campos de director ni teléfono.',
  },
  features: rawS.features.filter(f => f.geometry).map(f => {
    const p = f.properties; const [x, y] = f.geometry.coordinates;
    const distrito = canon(p.DISTRITO);
    const cae = distritoDe([x, y]);
    const esMinsa = p.INSTITUCIO === 'MINSA';
    return { type: 'Feature', properties: {
      codigo: p.CODIGO, nombre: tit(p.NOMBRE), categoria: p.CATEGORIA, institucion: p.INSTITUCIO === 'ESSALUD' ? 'EsSalud' : p.INSTITUCIO,
      tipo: frase(p.CLASIFICACION), distrito, ubigeo: p.UBIGEO, microrred: esMinsa ? tit(p.MICRO_RED) : null, red: esMinsa ? 'Red de Salud San Miguel' : null,
      verificacion: cae === distrito ? 'punto dentro de su distrito' : `revisar: el punto cae en ${cae || 'fuera de la provincia'}`,
    }, geometry: { type: 'Point', coordinates: [r5(x), r5(y)] } };
  }).sort((a, b) => a.properties.distrito.localeCompare(b.properties.distrito) || a.properties.nombre.localeCompare(b.properties.nombre)),
};
escribir('geo/establecimientos.json', establecimientos);
const revisar = establecimientos.features.filter(f => f.properties.verificacion.startsWith('revisar'));
console.log(`  ${establecimientos.features.length} establecimientos (${establecimientos.features.filter(f => f.properties.institucion === 'MINSA').length} MINSA); ${revisar.length} con coordenadas a revisar:`);
revisar.forEach(f => console.log('   -', f.properties.nombre, '(' + f.properties.distrito + '):', f.properties.verificacion));
