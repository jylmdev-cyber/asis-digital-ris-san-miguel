// Acceso a los datos de cada edición. Todo se resuelve en el build (no hay servidor ni base de datos).
import type { DatosEdicion, Tabla, Gradiente } from './tipos';

const ARCHIVOS = import.meta.glob('../data/ediciones/*/asis.json', { eager: true, import: 'default' }) as Record<string, DatosEdicion>;
const GEO_D = import.meta.glob('../data/ediciones/*/geo/distritos.json', { eager: true, import: 'default' }) as Record<string, any>;
const GEO_E = import.meta.glob('../data/ediciones/*/geo/establecimientos.json', { eager: true, import: 'default' }) as Record<string, any>;

const deAnio = <T>(m: Record<string, T>, anio: string): T | undefined =>
  Object.entries(m).find(([k]) => k.includes(`/ediciones/${anio}/`))?.[1];

export function edicion(anio: string) {
  const d = deAnio(ARCHIVOS, anio);
  if (!d) throw new Error(`No existen datos para la edición ${anio}`);
  const T: Record<string, Tabla> = Object.fromEntries(d.tablas.map(t => [t.id, t]));
  const tabla = (id: string): Tabla => { const t = T[id]; if (!t) throw new Error(`Tabla ${id} no existe en ${anio}`); return t; };
  return {
    ...d,
    T,
    tabla,
    tiene: (id: string) => id in T,
    gradiente: (id: string): Gradiente | undefined => d.gradientes.find(g => g.id === id),
    geoDistritos: deAnio(GEO_D, anio) ?? null,
    geoEstablecimientos: deAnio(GEO_E, anio) ?? null,
  };
}
export type Ed = ReturnType<typeof edicion>;

/* ---------------------------------------------------------------- utilidades de cifras */

/** Convierte una cifra del documento ("38 627", "52,9", "0,64") a número. */
export function num(s: unknown): number | null {
  if (s == null) return null;
  const t = String(s).replace(/[\s  ]/g, '').replace(',', '.');
  if (t === '' || t === '–' || isNaN(Number(t))) return null;
  return Number(t);
}

const NNBSP = ' ';
/** Presenta la cifra tal como está en el documento; agrega separador de miles a enteros de 5+ cifras. */
export function mostrar(s: unknown): string {
  if (s == null || s === '') return '–';
  const t = String(s).trim();
  if (/^\d{5,}$/.test(t)) return t.replace(/\B(?=(\d{3})+(?!\d))/g, NNBSP);
  return t.replace(/(\d) (?=\d{3}\b)/g, `$1${NNBSP}`);
}

export function fmtEntero(n: number): string {
  return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, NNBSP);
}

export const esTotal = (r: string[]) => /^(total|provincial|provincia|red de salud)/i.test(String(r[0]).trim());

export const slug = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

/** Fila de un distrito en una tabla distrital (primera columna = distrito). */
export const filaDe = (t: Tabla, distrito: string) => t.rows.find(r => r[0] === distrito);
export const filaTotal = (t: Tabla) => t.rows.find(esTotal);
