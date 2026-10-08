// Tipos de los datos de una edición del ASIS (src/data/ediciones/<anio>/asis.json).

export interface Tabla {
  id: string;
  ref: string;            // "Cuadro 32", "Tabla 3", "Gráfico 2"…
  titulo: string;
  pag: number;            // página impresa del documento
  fuente: string;         // fuente original citada por el ASIS
  elaborado: string;
  cols: string[];
  rows: string[][];       // cifras como texto, tal como figuran en el documento
  seccion: string;
  nota: string | null;
  origen: string;         // "DOC", "PDF (texto)", "PDF (imagen)"
  indicador?: string;
  tipo_determinante?: 'estructural' | 'intermedio' | 'psicosocial';
  curso?: string;
}

export interface Gradiente {
  id: string;
  nombre: string;
  determinante: string;
  unidad: string;
  ref: string;
  pag: number;
  fuente: string;
  valores: Record<string, string[]>; // año -> [grupo1..grupo4]
  lectura: string;
}

export interface Distrito { nombre: string; ubigeo: string; slug: string }

export interface DatosEdicion {
  version: string;
  edicion: string;
  generado_desde: string;
  ficha: Record<string, any>;
  distritos: Distrito[];
  tablas: Tabla[];
  gradientes: Gradiente[];
  texto: {
    conclusiones: string[];
    recomendaciones: string[];
    lineas_accion: string[];
    priorizados: string[];
    vigilancia: string[][];
  };
  siglas: string[][];
  limitaciones: string[];
  excluido_por_privacidad: { ref: string; motivo: string }[];
  clasificaciones?: Clasificacion[];
  problemas?: Problema[];
}

/** Clasificación distrital por categorías tomada del texto del documento (sin cifra por distrito). */
export interface Clasificacion {
  id: string; nombre: string; unidad: string; ref: string; pag: number; fuente: string; nota: string;
  categorias: { etiqueta: string; distritos: string[] }[];
}
export interface MapaOriginal { img: string; ref: string; pag: number; titulo: string }
export interface Problema {
  n: number; titulo: string; linea: number; mapas: MapaOriginal[];
  gradientes?: string[]; tabla?: string; tablasDistrito?: string[]; mapaInteractivo?: string;
  nota?: string; privacidad?: string;
}

/* ---------- especificaciones de gráficos (serializables: se calculan en el build) ---------- */
export type Color = 's1' | 's2' | 'o1' | 'o2' | 'o3' | 'o4' | 'muted';

export interface SerieSpec { nombre: string; valores: (number | null)[]; etiquetas: string[]; color: Color; coloresPorPunto?: Color[] }

export type ChartSpec =
  | { tipo: 'barras'; orientacion: 'h' | 'v'; categorias: string[]; series: SerieSpec[]; apilado?: boolean;
      unidad?: string; referencia?: { valor: number; etiqueta: string } | null; resaltar?: string[]; max?: number;
      etiquetaTotal?: string[] }
  | { tipo: 'lineas'; categorias: string[]; series: SerieSpec[]; unidad?: string }
  | { tipo: 'piramide'; grupos: string[]; femenino: number[]; masculino: number[]; etFem: string[]; etMasc: string[]; unidad?: string }
  | { tipo: 'pareto'; categorias: string[]; porcentaje: number[]; etiquetas: string[]; acumulado: number[] };

export interface TablaVista { cols: string[]; rows: string[][] }

export interface Variante {
  spec?: ChartSpec | null;
  tabla: TablaVista;
  subtitulo?: string;
  nota?: string | null;
  ref?: string;
  pag?: number;
  fuente?: string;
  unidad?: string;
}

export interface Filtro { id: string; label: string; tipo: 'select' | 'seg'; opciones: { v: string; t: string }[] }
