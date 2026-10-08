// Archivos de datos estáticos generados en el build: un CSV por cuadro, el JSON público completo y las capas GeoJSON.
import type { APIRoute } from 'astro';
import { EDICIONES } from '../../../config/sitio';
import { edicion } from '../../../lib/datos';

export function getStaticPaths() {
  return EDICIONES.flatMap(e => {
    const ed = edicion(e.anio);
    return [
      ...ed.tablas.map(t => ({ params: { anio: e.anio, archivo: `${t.id}.csv` } })),
      { params: { anio: e.anio, archivo: `asis-ris-san-miguel-${e.anio}.json` } },
      { params: { anio: e.anio, archivo: 'distritos.geojson' } },
      { params: { anio: e.anio, archivo: 'establecimientos.geojson' } },
    ];
  });
}

const esc = (v: unknown) => { const s = String(v ?? ''); return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };

export const GET: APIRoute = ({ params }) => {
  const ed = edicion(params.anio!);
  const a = params.archivo!;
  if (a.endsWith('.json')) {
    const { T, tabla, tiene, gradiente, geoDistritos, geoEstablecimientos, ...publico } = ed as any;
    return new Response(JSON.stringify(publico, null, 1), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
  }
  if (a === 'distritos.geojson') return new Response(JSON.stringify(ed.geoDistritos), { headers: { 'Content-Type': 'application/geo+json' } });
  if (a === 'establecimientos.geojson') return new Response(JSON.stringify(ed.geoEstablecimientos), { headers: { 'Content-Type': 'application/geo+json' } });
  const t = ed.tabla(a.replace(/\.csv$/, ''));
  const lineas = [[`${t.ref}. ${t.titulo}`], [`Fuente: ASIS RIS San Miguel ${params.anio}, ${t.ref} (pág. ${t.pag}). Fuente original: ${t.fuente}`], ...(t.nota ? [[`Nota: ${t.nota}`]] : []), t.cols, ...t.rows];
  return new Response('﻿' + lineas.map(r => r.map(esc).join(';')).join('\r\n'), { headers: { 'Content-Type': 'text/csv; charset=utf-8' } });
};
