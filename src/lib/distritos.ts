// Indicadores que el ASIS presenta desagregados por distrito. Alimenta las fichas distritales y el mapa.
import type { Ed } from './datos';
import { filaDe, filaTotal, mostrar, num } from './datos';

export interface IndicadorDistrital {
  id: string;
  grupo: 'Población' | 'Territorio' | 'Determinantes' | 'Servicios' | 'Salud';
  nombre: string;
  unidad: string;
  ref: string;
  pag: number;
  fuente: string;
  /** valores por nombre de distrito (texto del documento) */
  valores: Record<string, string>;
  provincial: string | null;
  /** true si el indicador se ofrece en el mapa */
  mapa: boolean;
  /** si existe, el indicador es por categorías (etiquetas en orden) y no tiene cifra por distrito */
  categorias?: string[];
  nota?: string;
}

export function indicadoresDistritales(ed: Ed): IndicadorDistrital[] {
  const D = ed.distritos.map(d => d.nombre);
  const out: IndicadorDistrital[] = [];
  const add = (id: string, grupo: IndicadorDistrital['grupo'], nombre: string, unidad: string, tablaId: string, f: (d: string) => string | undefined, prov: string | null, mapa = true) => {
    if (!ed.tiene(tablaId)) return;
    const t = ed.tabla(tablaId);
    out.push({ id, grupo, nombre, unidad, ref: t.ref, pag: t.pag, fuente: t.fuente, valores: Object.fromEntries(D.map(d => [d, f(d) ?? ''])), provincial: prov, mapa });
  };
  const col = (tid: string, c: number) => (d: string) => { const r = filaDe(ed.tabla(tid), d); return r ? (r[c] || '0') : undefined; };
  const tot = (tid: string, c: number) => { const r = filaTotal(ed.tabla(tid)); return r ? r[c] : null; };

  const pob = (anio: string) => (d: string) => ed.tabla('c03').rows.find(r => r[0] === d && r[1] === anio)?.[7];
  const sumPob = (anio: string) => String(ed.tabla('c03').rows.filter(r => r[1] === anio).reduce((s, r) => s + (num(r[7]) ?? 0), 0));
  add('pob2025', 'Población', 'Población total 2025', 'habitantes', 'c03', pob('2025'), sumPob('2025'));
  add('pob2024', 'Población', 'Población total 2024', 'habitantes', 'c03', pob('2024'), sumPob('2024'), false);
  add('pob2023', 'Población', 'Población total 2023', 'habitantes', 'c03', pob('2023'), sumPob('2023'), false);
  add('sis2025', 'Población', 'Afiliados al SIS 2025', 'afiliados', 't02', col('t02', 3), tot('t02', 3));
  add('altitud', 'Territorio', 'Altitud de la capital distrital', 'm s. n. m.', 't01', col('t01', 1), null);
  for (const t of ed.tablas.filter(t => t.seccion === 'determinantes')) {
    add(t.id, 'Determinantes', t.indicador!.replace(/ \(%\)$/, '').replace(/ \(IDE\)$/, ''), t.id === 't08' ? 'índice' : '%', t.id, col(t.id, 1), tot(t.id, 1));
  }
  add('eess', 'Servicios', 'Establecimientos de salud', 'EE. SS.', 'c04', col('c04', 1), tot('c04', 1));
  add('saneados', 'Servicios', 'EE. SS. con saneamiento físico legal', 'EE. SS.', 'c04', col('c04', 2), tot('c04', 2));
  add('titulo', 'Servicios', 'EE. SS. con título de propiedad', 'EE. SS.', 'c04', col('c04', 4), tot('c04', 4));
  add('infra_mala', 'Servicios', 'EE. SS. con infraestructura en mal estado', 'EE. SS.', 'c28', col('c28', 3), tot('c28', 3));
  add('residuos', 'Servicios', 'EE. SS. que cumplen la gestión de residuos', 'EE. SS.', 'c29', col('c29', 2), tot('c29', 2));
  add('ambulancias', 'Servicios', 'Ambulancias', 'unidades', 'c10', col('c10', 1), null);
  add('internet', 'Servicios', 'EE. SS. con acceso a internet', '%', 'c31', col('c31', 4), tot('c31', 4));
  add('computo', 'Servicios', 'Equipos de cómputo', 'equipos', 'c30', col('c30', 9), tot('c30', 9));
  add('eq_total', 'Servicios', 'Equipos médicos (total del cuadro distrital)', 'equipos', 'equipos_res', col('equipos_res', 1), null);
  add('eq_inop', 'Servicios', 'Equipos médicos inoperativos (suma de filas)', 'equipos', 'equipos_res', col('equipos_res', 3), null);
  add('medicamentos', 'Servicios', 'Disponibilidad de medicamentos esenciales', '%', 'g02', col('g02', 1), '96,67');
  add('atenciones', 'Salud', 'Atenciones por morbilidad 2025', 'atenciones', 'c38', col('c38', 1), tot('c38', 1));
  add('atenciones_pct', 'Salud', 'Proporción de las atenciones de la provincia', '%', 'c38', col('c38', 4), '100', false);
  add('defunciones', 'Salud', 'Defunciones 2025 (SINADEF)', 'defunciones', 'c45', col('c45', 1), tot('c45', 1));
  add('defunciones_pct', 'Salud', 'Proporción de las defunciones de la provincia', '%', 'c45', col('c45', 4), '100', false);
  // Clasificaciones textuales (p. ej. anemia): categoría del distrito según el texto del documento
  for (const c of ed.clasificaciones ?? []) {
    const etiquetas = c.categorias.map(k => k.etiqueta);
    out.push({ id: c.id, grupo: 'Salud', nombre: `${c.nombre} (clasificación del texto)`, unidad: c.unidad, ref: c.ref, pag: c.pag, fuente: c.fuente,
      valores: Object.fromEntries(D.map(d => [d, c.categorias.find(k => k.distritos.includes(d))?.etiqueta ?? ''])), provincial: null, mapa: true, categorias: etiquetas, nota: c.nota });
  }
  return out;
}

/** Posición del distrito (1 = valor más alto) entre los distritos con dato. */
export function posicion(ind: IndicadorDistrital, distrito: string): { pos: number; de: number } | null {
  if (ind.categorias) return null;
  const v = num(ind.valores[distrito]);
  if (v == null) return null;
  const vals = Object.values(ind.valores).map(num).filter((x): x is number => x != null);
  return { pos: 1 + vals.filter(x => x > v).length, de: vals.length };
}

/** Indicadores para el mapa (valores por UBIGEO, serializable). */
export function indicadoresMapa(ed: Ed) {
  const ub = Object.fromEntries(ed.distritos.map(d => [d.nombre, d.ubigeo]));
  return indicadoresDistritales(ed).filter(i => i.mapa).map(i => ({
    id: i.id, grupo: i.grupo, nombre: i.nombre, unidad: i.unidad, ref: i.ref, pag: i.pag, fuente: i.fuente,
    provincial: i.provincial ? mostrar(i.provincial) : null, categorias: i.categorias ?? null, nota: i.nota ?? null,
    valores: Object.fromEntries(Object.entries(i.valores).map(([d, v]) => [ub[d], i.categorias
      ? { v: v ? i.categorias.indexOf(v) : null, t: v || 'Sin clasificación en el texto del documento' }
      : { v: num(v), t: mostrar(v) }])),
  }));
}

/** Props comunes del mapa (la geometría se descarga desde /<anio>/datos/*.geojson). */
export function propsMapa(ed: Ed, urlDatos: string) {
  const mr = [...new Set((ed.geoEstablecimientos?.features ?? []).map((f: any) => f.properties.microrred).filter(Boolean))].sort() as string[];
  return {
    urlDistritos: urlDatos + 'distritos.geojson', urlEstablecimientos: urlDatos + 'establecimientos.geojson',
    lista: ed.distritos.map(d => ({ distrito: d.nombre, slug: d.slug, ubigeo: d.ubigeo })), microrredes: mr,
  };
}
