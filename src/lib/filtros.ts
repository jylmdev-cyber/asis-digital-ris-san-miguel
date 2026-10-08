import type { Filtro } from './tipos';
import type { Ed } from './datos';
import { EDICIONES } from '../config/sitio';

export const rutasEdicion = () => EDICIONES.map(e => ({ params: { anio: e.anio } }));

export const filtroResaltar = (ed: Ed): Filtro => ({
  id: 'resaltar', label: 'Resaltar distrito', tipo: 'select',
  opciones: [{ v: '', t: 'Ninguno' }, ...ed.distritos.map(d => ({ v: d.nombre, t: d.nombre }))],
});
export const filtroAnios = (anios: string[], label = 'Año'): Filtro => ({ id: 'anio', label, tipo: 'seg', opciones: anios.map(a => ({ v: a, t: a })) });
