// Constructores de especificaciones de gráficos. Se ejecutan en el build: el navegador recibe datos listos.
// Las etiquetas de cada barra son SIEMPRE la cifra textual del documento.
import type { ChartSpec, Color, SerieSpec, Tabla, TablaVista, Variante } from './tipos';
import { esTotal, mostrar, num } from './datos';

export const vista = (t: Tabla, rows?: string[][], cols?: string[]): TablaVista => ({ cols: cols ?? t.cols, rows: rows ?? t.rows });

const serie = (nombre: string, filas: string[][], col: number, color: Color, sufijo = ''): SerieSpec => ({
  nombre, color,
  valores: filas.map(r => num(r[col])),
  etiquetas: filas.map(r => (r[col] === '' || r[col] == null ? '0' : mostrar(r[col])) + sufijo),
});

/** Barras horizontales por distrito (o categoría) de una columna; el total/provincial va como línea de referencia. */
export function barrasColumna(t: Tabla, col: number, o: { unidad?: string; ordenar?: boolean; filas?: string[][]; resaltar?: string[]; max?: number; nombre?: string; referencia?: boolean | { valor: number; etiqueta: string } } = {}): ChartSpec {
  let filas = (o.filas ?? t.rows).filter(r => !esTotal(r));
  if (o.ordenar !== false) filas = [...filas].sort((a, b) => (num(b[col]) ?? -1) - (num(a[col]) ?? -1));
  const tot = (o.filas ?? t.rows).find(esTotal);
  const ref = typeof o.referencia === 'object' ? o.referencia : o.referencia === false ? null : tot && num(tot[col]) != null ? { valor: num(tot[col])!, etiqueta: `${tot[0].trim()}: ${mostrar(tot[col])}${o.unidad ?? ''}` } : null;
  return {
    tipo: 'barras', orientacion: 'h', categorias: filas.map(r => r[0]),
    series: [serie(o.nombre ?? t.cols[col], filas, col, 's1', o.unidad === ' %' ? ' %' : '')],
    unidad: o.unidad, referencia: ref, resaltar: o.resaltar, max: o.max,
  };
}

/** Barras apiladas de dos o más columnas (p. ej. femenino/masculino, operativo/inoperativo). */
export function barrasApiladas(t: Tabla, cols: number[], nombres: string[], o: { filas?: string[][]; ordenarPor?: number | null; totalCol?: number; sufijoTotal?: (r: string[]) => string; colores?: Color[] } = {}): ChartSpec {
  let filas = (o.filas ?? t.rows).filter(r => !esTotal(r));
  const clave = (r: string[]) => o.ordenarPor != null ? (num(r[o.ordenarPor]) ?? 0) : cols.reduce((s, c) => s + (num(r[c]) ?? 0), 0);
  if (o.ordenarPor !== null) filas = [...filas].sort((a, b) => clave(b) - clave(a));
  const colores: Color[] = o.colores ?? ['s1', 's2', 'o3', 'o4'];
  return {
    tipo: 'barras', orientacion: 'h', apilado: true, categorias: filas.map(r => r[0]),
    series: cols.map((c, i) => serie(nombres[i], filas, c, colores[i])),
    etiquetaTotal: filas.map(r => o.sufijoTotal ? o.sufijoTotal(r) : (o.totalCol != null ? mostrar(r[o.totalCol]) : String(cols.reduce((s, c) => s + (num(r[c]) ?? 0), 0)))),
  };
}

/** Serie temporal desde una tabla con años como columnas. */
export function lineas(t: Tabla, filas: { fila: number; nombre: string; color: Color }[], anios: string[]): ChartSpec {
  return {
    tipo: 'lineas', categorias: anios,
    series: filas.map(f => ({ nombre: f.nombre, color: f.color, valores: anios.map(a => num(t.rows[f.fila][t.cols.indexOf(a)])), etiquetas: anios.map(a => mostrar(t.rows[f.fila][t.cols.indexOf(a)])) })),
  };
}

/** Pareto: % de cada causa y % acumulado calculado a partir de la columna % del cuadro. */
export function pareto(t: Tabla, colPct: number, top = 15): ChartSpec {
  const filas = t.rows.filter(r => !esTotal(r)).slice(0, top);
  let acc = 0;
  const acumulado = filas.map(r => { acc += num(r[colPct]) ?? 0; return Math.round(acc * 10) / 10; });
  return { tipo: 'pareto', categorias: filas.map(r => r[0]), porcentaje: filas.map(r => num(r[colPct]) ?? 0), etiquetas: filas.map(r => mostrar(r[colPct]) + ' %'), acumulado };
}

/** Variante estándar: un gráfico + su tabla + metadatos del cuadro. */
export const variante = (t: Tabla, spec: ChartSpec | null, extra: Partial<Variante> = {}): Variante => ({
  spec, tabla: vista(t), ref: t.ref, pag: t.pag, fuente: t.fuente, nota: t.nota, subtitulo: `${t.ref}. ${t.titulo}`, ...extra,
});
