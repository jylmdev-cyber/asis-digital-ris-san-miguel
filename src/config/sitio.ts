// Configuración general de la plataforma y registro de ediciones del ASIS.
// Para incorporar una edición nueva (p. ej. 2026): crear src/data/ediciones/2026/ con la misma estructura
// y agregarla aquí. La edición marcada como `actual` es a la que redirige la portada.

export interface Edicion {
  anio: string;
  titulo: string;
  actual: boolean;
  /** URL pública del documento oficial (PDF) publicada por la Red/DIRESA. null = no se enlaza. */
  documentoOficialUrl: string | null;
}

export const SITIO = {
  nombre: 'ASIS DIGITAL',
  entidad: 'RIS San Miguel',
  nombreCompleto: 'ASIS DIGITAL | RIS SAN MIGUEL',
  descripcion:
    'Observatorio digital del Análisis de Situación de Salud (ASIS) de la Red Integrada de Salud San Miguel, Cajamarca: población, determinantes, servicios, morbilidad, mortalidad, desigualdades y líneas de acción.',
  idioma: 'es-PE',
  fuenteCorta: 'ASIS RIS San Miguel',
};

export const EDICIONES: Edicion[] = [
  {
    anio: '2025',
    titulo: 'Análisis de la Situación de Salud de la Provincia de San Miguel 2025',
    actual: true,
    // El PDF completo contiene en la pág. 70 el detalle de un caso de muerte materna (datos que permiten
    // identificar a la persona). No se publica aquí hasta contar con una versión autorizada para difusión.
    documentoOficialUrl: null,
  },
];

export const edicionActual = () => EDICIONES.find(e => e.actual) ?? EDICIONES[EDICIONES.length - 1];

export const MODULOS = [
  { ruta: '', titulo: 'Inicio', corto: 'Inicio', icono: 'inicio', descripcion: 'Resumen ejecutivo, cifras clave y hallazgos' },
  { ruta: 'territorio/', titulo: 'Caracterización territorial', corto: 'Territorio', icono: 'mapa', descripcion: 'Distritos, microrredes, establecimientos y mapa interactivo' },
  { ruta: 'demografia/', titulo: 'Análisis demográfico', corto: 'Demografía', icono: 'personas', descripcion: 'Población, pirámide, dinámica poblacional y afiliación al SIS' },
  { ruta: 'determinantes/', titulo: 'Determinantes sociales de la salud', corto: 'Determinantes', icono: 'casa', descripcion: 'Pobreza, educación, empleo, vivienda, agua y saneamiento' },
  { ruta: 'servicios/', titulo: 'Oferta y respuesta de los servicios', corto: 'Servicios', icono: 'hospital', descripcion: 'Establecimientos, recursos humanos, equipamiento y capacidad resolutiva' },
  { ruta: 'epidemiologia/', titulo: 'Situación epidemiológica', corto: 'Epidemiología', icono: 'pulso', descripcion: 'Morbilidad, mortalidad y vigilancia en salud pública' },
  { ruta: 'desigualdades/', titulo: 'Brechas y desigualdades', corto: 'Desigualdades', icono: 'balanza', descripcion: 'Gradientes por grupo social según determinantes' },
  { ruta: 'priorizacion/', titulo: 'Priorización y líneas de acción', corto: 'Priorización', icono: 'bandera', descripcion: 'Problemas priorizados, vinculación, líneas de acción, conclusiones y recomendaciones' },
  { ruta: 'distritos/', titulo: 'Fichas distritales', corto: 'Distritos', icono: 'pin', descripcion: 'Todos los indicadores de cada distrito en una página' },
  { ruta: 'biblioteca/', titulo: 'Biblioteca documental', corto: 'Biblioteca', icono: 'libro', descripcion: 'Documento, fuentes, metodología, glosario, notas de calidad y descarga de datos' },
] as const;
