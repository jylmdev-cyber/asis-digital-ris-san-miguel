<script setup lang="ts">
// Tarjeta de visualización reutilizable: filtros + gráfico (ECharts, carga diferida) + tabla + herramientas.
// Todas las variantes (combinaciones de filtros) se calculan en el build; aquí solo se elige y se dibuja.
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch, nextTick } from 'vue';
import type { Filtro, Variante } from '../../lib/tipos';

const props = withDefaults(defineProps<{
  id: string;
  titulo: string;
  metodo?: string;
  unidad?: string;
  periodo?: string;
  filtros?: Filtro[];
  variantes: Record<string, Variante>;
  inicial?: Record<string, string>;
  fuenteCorta?: string;
  largos?: number[];
  resaltarFila?: string;
  claves?: string;
}>(), { filtros: () => [], inicial: () => ({}), fuenteCorta: 'ASIS RIS San Miguel 2025', largos: () => [] });

const estado = reactive<Record<string, string>>(Object.fromEntries(props.filtros.map(f => [f.id, props.inicial[f.id] ?? f.opciones[0]?.v ?? ''])));
// El filtro 'resaltar' (distrito) no cambia la variante: solo destaca una barra y una fila.
const filtrosClave = computed(() => props.filtros.filter(f => f.id !== 'resaltar'));
const clave = computed(() => filtrosClave.value.length ? filtrosClave.value.map(f => estado[f.id]).join('|') : 'default');
const actual = computed<Variante | undefined>(() => props.variantes[clave.value]);
const ref_ = computed(() => actual.value?.ref ?? '');
const resaltar = computed(() => estado['resaltar'] || props.resaltarFila || '');

const lienzo = ref<HTMLDivElement | null>(null);
const cargando = ref(true);
const error = ref(false);
let chart: any = null, ro: ResizeObserver | null = null, mod: typeof import('../../lib/graficos') | null = null;
const reducido = typeof window !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

async function dibujar(animar = true) {
  const v = actual.value;
  if (!v?.spec || !lienzo.value) { cargando.value = false; return; }
  try {
    mod ??= await import('../../lib/graficos');
    const ec = await mod.cargarECharts();
    const ancho = lienzo.value.clientWidth || 600;
    lienzo.value.style.height = mod.alturaDe(v.spec, ancho) + 'px';
    if (!chart) chart = ec.init(lienzo.value, undefined, { renderer: 'canvas' });
    else chart.resize();
    const spec = v.spec.tipo === 'barras' && resaltar.value ? { ...v.spec, resaltar: [resaltar.value] } : v.spec;
    chart.setOption(mod.opciones(spec, ancho, animar && !reducido), true);
    cargando.value = false; error.value = false;
  } catch (e) {
    console.error(e); error.value = true; cargando.value = false;
  }
}

onMounted(() => {
  dibujar();
  let w = lienzo.value?.clientWidth ?? 0;
  ro = new ResizeObserver(() => { const nw = lienzo.value?.clientWidth ?? 0; if (Math.abs(nw - w) > 24) { w = nw; dibujar(false); } else chart?.resize(); });
  if (lienzo.value) ro.observe(lienzo.value);
  window.addEventListener('tema', onTema);
});
const onTema = () => dibujar(false);
onBeforeUnmount(() => { ro?.disconnect(); chart?.dispose(); window.removeEventListener('tema', onTema); });
watch(clave, async () => { await nextTick(); dibujar(); });
watch(resaltar, () => dibujar(false));

const esNum = (s: string) => s != null && s !== '' && !isNaN(Number(String(s).replace(/[\s ]/g, '').replace(',', '.')));
const mostrar = (s: string) => { if (s == null || s === '') return '–'; const t = String(s).trim(); return /^\d{5,}$/.test(t) ? t.replace(/\B(?=(\d{3})+(?!\d))/g, ' ') : t.replace(/(\d) (?=\d{3}\b)/g, '$1 '); };
const esTotal = (r: string[]) => /^(total|provincial|provincia|red de salud)/i.test(String(r[0]).trim());
const numCols = computed(() => {
  const t = actual.value?.tabla; if (!t) return [];
  return t.cols.map((_, i) => i > 0 && t.rows.filter(r => !esTotal(r)).every(r => r[i] === '' || r[i] == null || esNum(r[i])) && t.rows.some(r => esNum(r[i])));
});

function descargarCSV() {
  const v = actual.value; if (!v) return;
  const e = (x: unknown) => { const s = String(x ?? ''); return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  const lineas = [[props.titulo], [v.subtitulo ?? ''], [`Fuente: ${props.fuenteCorta}, ${v.ref} (pág. ${v.pag}). Fuente original: ${v.fuente}`], v.tabla.cols, ...v.tabla.rows];
  bajar(new Blob(['﻿' + lineas.map(r => r.map(e).join(';')).join('\r\n')], { type: 'text/csv;charset=utf-8' }), `asis-2025_${props.id}_${clave.value.replace(/[^a-z0-9]+/gi, '-')}.csv`);
}
function descargarPNG() {
  if (!chart) return;
  const fondo = getComputedStyle(document.documentElement).getPropertyValue('--surface').trim();
  const a = document.createElement('a'); a.href = chart.getDataURL({ type: 'png', pixelRatio: 2, backgroundColor: fondo }); a.download = `asis-2025_${props.id}.png`; a.click();
}
function bajar(b: Blob, nombre: string) { const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = nombre; document.body.append(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 400); }
</script>

<template>
  <figure :id="id" class="tarjeta aparecer visible m-0 min-w-0 p-4 sm:p-5" :aria-labelledby="id + '-t'" :data-buscar="[titulo, Object.values(variantes).map(v => v.ref).filter((x, i, a) => x && a.indexOf(x) === i).join(', '), claves ?? ''].join('|')">
    <header class="flex flex-wrap items-start justify-between gap-2">
      <div class="min-w-0">
        <h3 :id="id + '-t'" class="text-[1.05rem] font-semibold text-ink">{{ titulo }}</h3>
        <p class="meta mt-0.5">
          <span v-if="actual?.subtitulo">{{ actual.subtitulo }}</span>
          <span v-if="actual?.unidad || unidad"> · Unidad: {{ actual?.unidad || unidad }}</span>
          <span v-if="periodo"> · Periodo: {{ periodo }}</span>
        </p>
      </div>
    </header>
    <p v-if="metodo" class="metodo mt-3"><strong>Nota metodológica:</strong> {{ metodo }}</p>

    <div v-if="filtros.length" class="mt-3 flex flex-wrap items-end gap-x-4 gap-y-3 no-imprimir">
      <template v-for="f in filtros" :key="f.id">
        <label v-if="f.tipo === 'select'" class="campo">
          {{ f.label }}
          <select v-model="estado[f.id]">
            <option v-for="o in f.opciones" :key="o.v" :value="o.v">{{ o.t }}</option>
          </select>
        </label>
        <div v-else class="campo">
          <span>{{ f.label }}</span>
          <div class="seg" role="group" :aria-label="f.label">
            <button v-for="o in f.opciones" :key="o.v" type="button" :aria-pressed="estado[f.id] === o.v" @click="estado[f.id] = o.v">{{ o.t }}</button>
          </div>
        </div>
      </template>
    </div>

    <div v-if="actual?.spec" class="relative mt-3">
      <div v-if="cargando" class="skeleton absolute inset-0" aria-hidden="true"></div>
      <p v-if="error" class="nota">No se pudo cargar el gráfico en este navegador. La tabla de datos sigue disponible más abajo.</p>
      <div ref="lienzo" class="w-full" style="min-height:160px" role="img" :aria-label="`${titulo}. ${actual.subtitulo ?? ''}. Los valores exactos están en la tabla de datos.`"></div>
    </div>
    <p v-if="!actual" class="nota mt-3">No hay datos para esta combinación de filtros en el documento.</p>

    <details v-if="actual" class="mt-3" :open="!actual.spec">
      <summary class="btn no-imprimir w-fit cursor-pointer list-none">Ver tabla de datos</summary>
      <div class="tabla-wrap mt-2" tabindex="0" role="region" :aria-label="`Tabla: ${actual.subtitulo ?? titulo}`">
        <table class="tabla">
          <thead><tr><th v-for="(c, i) in actual.tabla.cols" :key="i" scope="col" :class="{ n: numCols[i] }">{{ c }}</th></tr></thead>
          <tbody>
            <tr v-for="(r, k) in actual.tabla.rows" :key="k" :class="{ tot: esTotal(r), hl: resaltar && r[0] === resaltar }">
              <td v-for="(x, i) in r" :key="i" :class="{ n: numCols[i] || (i > 0 && esNum(x)), largo: largos.includes(i) }">{{ (numCols[i] || (i > 0 && esNum(x))) ? mostrar(x) : (x || '–') }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </details>

    <p v-if="actual?.nota" class="nota mt-3"><strong>Nota de lectura:</strong> {{ actual.nota }}</p>

    <div class="herramientas mt-3 flex flex-wrap gap-2 no-imprimir">
      <button type="button" class="btn" @click="descargarCSV" title="Descargar la tabla (se abre en Excel)">CSV / Excel</button>
      <button v-if="actual?.spec" type="button" class="btn" :disabled="cargando || error" @click="descargarPNG">Imagen PNG</button>
      <button type="button" class="btn" :data-copiar="id">Copiar enlace</button>
      <button type="button" class="btn" :data-imprimir="id">Imprimir</button>
    </div>
    <figcaption class="mt-3 border-t border-line pt-2.5 text-[0.78rem] text-ink-2">
      <strong>Fuente: {{ fuenteCorta }}</strong><template v-if="ref_">, {{ ref_ }} (pág. {{ actual?.pag }})</template>. Dato original: {{ actual?.fuente }}.
    </figcaption>
  </figure>
</template>
