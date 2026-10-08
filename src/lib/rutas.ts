// Rutas internas respetando la subcarpeta de despliegue (BASE_URL, p. ej. /asis-digital-ris-san-miguel/).
const BASE = import.meta.env.BASE_URL.endsWith('/') ? import.meta.env.BASE_URL : import.meta.env.BASE_URL + '/';
export const url = (ruta = '') => BASE + ruta.replace(/^\//, '');
export const urlEd = (anio: string, ruta = '') => url(`${anio}/${ruta.replace(/^\//, '')}`);
