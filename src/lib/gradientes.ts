// Variantes de gráficos de gradiente (capítulo VIII) para uno o varios indicadores, con filtro de año.
import type { Ed } from './datos';
import { num } from './datos';
import type { ChartSpec, Color, Filtro, Variante } from './tipos';

const COL: Color[] = ['o1', 'o2', 'o3', 'o4'];
const GR = ['Grupo social 1', 'Grupo social 2', 'Grupo social 3', 'Grupo social 4'];

export function vizGradientes(ed: Ed, ids: string[]) {
  const G = ids.map(id => ed.gradiente(id)).filter((g): g is NonNullable<typeof g> => !!g);
  const anios = [...new Set(G.flatMap(g => Object.keys(g.valores)))].sort();
  const variantes: Record<string, Variante> = {};
  for (const g of G) {
    const tabla = { cols: ['Año', ...GR], rows: Object.entries(g.valores).map(([a, v]) => [a, ...v]) };
    const base = { ref: g.ref, pag: g.pag, fuente: g.fuente, unidad: g.unidad, subtitulo: `${g.ref}. ${g.nombre} según ${g.determinante.toLowerCase()}`, nota: `Lectura del documento: ${g.lectura}` };
    for (const a of anios) {
      const v = g.valores[a];
      // la clave sigue el orden de los filtros (indicador, año); sin filtros es 'default'
      const clave = [G.length > 1 ? g.id : null, anios.length > 1 ? a : null].filter(Boolean).join('|') || 'default';
      variantes[clave] = v
        ? { ...base, tabla, spec: { tipo: 'barras', orientacion: 'h', categorias: GR, series: [{ nombre: g.nombre, color: 'o3', coloresPorPunto: COL, valores: v.map(num), etiquetas: v }] } as ChartSpec }
        : { ...base, tabla, spec: null, nota: `El documento presenta este gradiente solo para ${Object.keys(g.valores).join(', ')}. ${base.nota}` };
    }
  }
  const filtros: Filtro[] = [];
  if (G.length > 1) filtros.push({ id: 'g', label: 'Indicador', tipo: 'select', opciones: G.map(g => ({ v: g.id, t: `${g.nombre} vs ${g.determinante.toLowerCase()} (${g.ref})` })) });
  if (anios.length > 1) filtros.push({ id: 'a', label: 'Año', tipo: 'seg', opciones: anios.map(a => ({ v: a, t: a })) });
  return { filtros, variantes, inicial: { a: anios[anios.length - 1] }, gradientes: G };
}
