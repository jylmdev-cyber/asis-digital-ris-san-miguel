<script setup lang="ts">
// Mapa de la provincia de San Miguel con Leaflet (carga diferida). Sin mapa base por defecto: no hace
// peticiones a terceros salvo que la persona active el fondo de OpenStreetMap.
import 'leaflet/dist/leaflet.css';
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';

interface Valor { v: number | null; t: string }
interface Indicador { id: string; grupo: string; nombre: string; unidad: string; ref: string; pag: number; fuente: string; provincial: string | null; valores: Record<string, Valor> }
interface DistritoLista { distrito: string; slug: string; ubigeo: string }
// La geometría se descarga una sola vez (archivo estático en caché) en lugar de incrustarse en cada página.
const props = withDefaults(defineProps<{
  urlDistritos: string; urlEstablecimientos: string; lista: DistritoLista[]; microrredes: string[];
  indicadores: Indicador[]; inicial?: string; urlFicha: string; alto?: number; mostrarEESS?: boolean; soloDistrito?: string | null;
}>(), { inicial: 'pob2025', alto: 520, mostrarEESS: true, soloDistrito: null });
const cache: Record<string, Promise<any>> = ((globalThis as any).__geoCache ??= {});
const traer = (u: string) => (cache[u] ??= fetch(u).then(r => { if (!r.ok) throw new Error(`${r.status} ${u}`); return r.json(); }));
let geoD: any = null, geoE: any = { features: [] };

const indId = ref(props.inicial);
const ind = computed(() => props.indicadores.find(i => i.id === indId.value) ?? props.indicadores[0]);
const verEESS = ref(props.mostrarEESS);
const fondo = ref(false);
const nombres = ref(true);
const microrred = ref('');
const categorias = ref<string[]>(['I-1', 'I-2', 'I-3', 'I-4']);
const sel = ref<string | null>(props.soloDistrito ? props.lista.find(d => d.distrito === props.soloDistrito)?.ubigeo ?? null : null);
const cargando = ref(true), error = ref(false);
const el = ref<HTMLDivElement | null>(null);

const grupos = computed(() => [...new Set(props.indicadores.map(i => i.grupo))]);

// Cuartiles sobre los distritos con dato (4 clases, rampa ordinal validada).
const clases = computed(() => {
  const vals = Object.values(ind.value.valores).map(x => x.v).filter((v): v is number => v != null).sort((a, b) => a - b);
  if (!vals.length) return [];
  const q = (p: number) => vals[Math.min(vals.length - 1, Math.floor(p * (vals.length - 1) + 0.5))];
  const cortes = [vals[0], q(0.25), q(0.5), q(0.75), vals[vals.length - 1]];
  const out: { min: number; max: number }[] = [];
  for (let i = 0; i < 4; i++) { const min = cortes[i], max = cortes[i + 1]; if (!out.length || max > out[out.length - 1].max) out.push({ min: out.length ? Math.max(min, out[out.length - 1].max) : min, max }); }
  return out;
});
const claseDe = (v: number | null) => { if (v == null) return -1; const c = clases.value; for (let i = 0; i < c.length; i++) if (v <= c[i].max) return i; return c.length - 1; };
const css = (v: string) => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
const rampa = () => { const r = ['--o1', '--o2', '--o3', '--o4'].map(css); return clases.value.length === 4 ? r : r.slice(4 - clases.value.length); };
const fmt = (n: number) => { const r = Number.isInteger(n) ? String(n) : String(Math.round(n * 100) / 100); const [e, d] = r.split('.'); return e.replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + (d ? ',' + d : ''); };

let L: any = null, mapa: any = null, capaD: any = null, capaE: any = null, capaF: any = null, capaN: any = null;

function estilo(f: any) {
  const v = ind.value.valores[f.properties.ubigeo]?.v ?? null, c = claseDe(v), sel_ = sel.value === f.properties.ubigeo;
  return { color: sel_ ? css('--ink') : css('--surface'), weight: sel_ ? 3 : 1.2, fillColor: c < 0 ? css('--surface-3') : rampa()[c], fillOpacity: fondo.value ? 0.7 : 0.92, dashArray: c < 0 ? '3 3' : undefined };
}
function popupDistrito(f: any) {
  const p = f.properties, v = ind.value.valores[p.ubigeo];
  const d = document.createElement('div'); d.className = 'text-[13px] leading-snug';
  const b = document.createElement('b'); b.textContent = p.distrito; d.append(b);
  const r = document.createElement('div'); r.textContent = `${ind.value.nombre}: ${v && v.t !== '–' ? v.t : 'sin dato'} ${ind.value.unidad === '%' ? '%' : ind.value.unidad}`; d.append(r);
  if (ind.value.provincial) { const pr = document.createElement('div'); pr.style.color = 'var(--ink-2)'; pr.textContent = `Provincia: ${ind.value.provincial}`; d.append(pr); }
  const s = document.createElement('div'); s.style.color = 'var(--ink-2)'; s.style.fontSize = '11px'; s.textContent = `${ind.value.ref}, pág. ${ind.value.pag}`; d.append(s);
  const a = document.createElement('a'); a.href = props.urlFicha + p.slug + '/'; a.textContent = 'Ver ficha del distrito →'; a.style.display = 'inline-block'; a.style.marginTop = '4px'; d.append(a);
  return d;
}
function popupEESS(f: any) {
  const p = f.properties;
  const d = document.createElement('div'); d.className = 'text-[13px] leading-snug';
  const line = (txt: string, strong = false, gris = false) => { const e = document.createElement(strong ? 'b' : 'div'); e.textContent = txt; if (gris) (e as HTMLElement).style.color = 'var(--ink-2)'; d.append(e); if (strong) d.append(document.createElement('br')); };
  line(`${p.institucion === 'EsSalud' ? '' : (p.tipo.startsWith('Centros') ? 'C.S. ' : 'P.S. ')}${p.nombre}`, true);
  line(`Categoría ${p.categoria} · ${p.institucion}`);
  if (p.microrred) line(`Microrred ${p.microrred}`);
  line(`Distrito: ${p.distrito} · Código RENIPRESS ${p.codigo}`, false, true);
  if (p.verificacion.startsWith('revisar')) line(`⚠ Coordenada a revisar: ${p.verificacion.replace('revisar: ', '')}.`, false, true);
  return d;
}
const radio = (c: string) => ({ 'I-1': 4.5, 'I-2': 6, 'I-3': 7.5, 'I-4': 9.5 } as Record<string, number>)[c] ?? 5;

function pintar() {
  if (!mapa) return;
  capaD?.setStyle(estilo);
  capaD?.eachLayer((l: any) => l.setPopupContent(popupDistrito(l.feature)));
  capaE?.clearLayers();
  if (verEESS.value) {
    for (const f of geoE.features) {
      const p = f.properties;
      if (microrred.value && p.microrred !== microrred.value) continue;
      if (!categorias.value.includes(p.categoria)) continue;
      if (props.soloDistrito && p.distrito !== props.soloDistrito) continue;
      const [x, y] = f.geometry.coordinates;
      const m = L.circleMarker([y, x], {
        radius: radio(p.categoria), weight: 2, color: '#ffffff', fillColor: p.institucion === 'EsSalud' ? '#6b7a80' : css('--verde'), fillOpacity: 1,
        dashArray: p.verificacion.startsWith('revisar') ? '2 2' : undefined,
      });
      m.bindPopup(popupEESS(f)); m.bindTooltip(p.nombre, { direction: 'top', offset: [0, -6] });
      capaE.addLayer(m);
    }
  }
  capaN?.clearLayers();
  if (nombres.value && !props.soloDistrito) capaD?.eachLayer((l: any) => capaN.addLayer(L.tooltip({ permanent: true, direction: 'center', className: 'et-dist', interactive: false }).setLatLng(l.getCenter()).setContent(l.feature.properties.distrito)));
  if (fondo.value && !capaF) capaF = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 16, attribution: '© colaboradores de OpenStreetMap' }).addTo(mapa).bringToBack();
  if (!fondo.value && capaF) { mapa.removeLayer(capaF); capaF = null; }
}

onMounted(async () => {
  try {
    const [mod, d, e] = await Promise.all([import('leaflet'), traer(props.urlDistritos), traer(props.urlEstablecimientos)]);
    L = mod.default; geoD = d; if (e) geoE = e;
    mapa = L.map(el.value!, { zoomControl: true, attributionControl: true, scrollWheelZoom: false, zoomSnap: 0.25 });
    mapa.attributionControl.setPrefix(false);
    mapa.attributionControl.addAttribution('Límites: IGN/INEI (IDEP) · Establecimientos: IGN (IDEP)');
    capaD = L.geoJSON(geoD, {
      style: estilo,
      onEachFeature: (f: any, l: any) => {
        l.bindPopup(popupDistrito(f));
        l.bindTooltip(f.properties.distrito, { sticky: true, className: 'tt-dist' });
        l.on('click', () => { sel.value = f.properties.ubigeo; });
        l.on('mouseover', () => l.setStyle({ weight: 2.5, color: css('--ink') }));
        l.on('mouseout', () => capaD.resetStyle(l) || l.setStyle(estilo(f)));
      },
    }).addTo(mapa);
    capaE = L.layerGroup().addTo(mapa);
    capaN = L.layerGroup().addTo(mapa);
    const b = props.soloDistrito ? capaD.getLayers().find((l: any) => l.feature.properties.distrito === props.soloDistrito)?.getBounds() : capaD.getBounds();
    mapa.fitBounds(b ?? capaD.getBounds(), { padding: [12, 12] });
    pintar();
    mapa.on('focus', () => mapa.scrollWheelZoom.enable());
    mapa.on('blur', () => mapa.scrollWheelZoom.disable());
    window.addEventListener('tema', pintar);
    cargando.value = false;
  } catch (e) { console.error(e); error.value = true; cargando.value = false; }
});
onBeforeUnmount(() => { window.removeEventListener('tema', pintar); mapa?.remove(); });
watch([indId, verEESS, fondo, nombres, microrred, categorias, sel], pintar, { deep: true });

const filas = computed(() => props.lista.map(f => ({ d: f.distrito, slug: f.slug, ub: f.ubigeo, v: ind.value.valores[f.ubigeo] }))
  .sort((a: any, b: any) => (b.v?.v ?? -Infinity) - (a.v?.v ?? -Infinity)));
const unidadTxt = computed(() => ind.value.unidad === '%' ? '%' : ind.value.unidad);
</script>

<template>
  <div class="grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
    <div class="min-w-0">
      <div class="mb-3 flex flex-wrap items-end gap-x-4 gap-y-3 no-imprimir">
        <label class="campo min-w-[220px] flex-1">Indicador del ASIS (color de los distritos)
          <select v-model="indId">
            <optgroup v-for="g in grupos" :key="g" :label="g">
              <option v-for="i in indicadores.filter(x => x.grupo === g)" :key="i.id" :value="i.id">{{ i.nombre }} ({{ i.ref }})</option>
            </optgroup>
          </select>
        </label>
        <label v-if="!soloDistrito" class="campo">Microrred
          <select v-model="microrred"><option value="">Todas</option><option v-for="m in microrredes" :key="m" :value="m">{{ m }}</option></select>
        </label>
      </div>
      <div class="mb-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[0.85rem] no-imprimir">
        <label class="inline-flex items-center gap-2"><input type="checkbox" v-model="verEESS" class="size-4 accent-[var(--accent)]" /> Establecimientos de salud</label>
        <span v-if="verEESS" class="inline-flex flex-wrap items-center gap-2" role="group" aria-label="Categorías">
          <label v-for="c in ['I-1','I-2','I-3','I-4']" :key="c" class="inline-flex items-center gap-1"><input type="checkbox" :value="c" v-model="categorias" class="size-4 accent-[var(--accent)]" />{{ c }}</label>
        </span>
        <label v-if="!soloDistrito" class="inline-flex items-center gap-2"><input type="checkbox" v-model="nombres" class="size-4 accent-[var(--accent)]" /> Nombres</label>
        <label class="inline-flex items-center gap-2"><input type="checkbox" v-model="fondo" class="size-4 accent-[var(--accent)]" /> Mapa base (OpenStreetMap)</label>
      </div>
      <div class="relative overflow-hidden rounded-xl border border-line bg-surface-2">
        <div v-if="cargando" class="skeleton absolute inset-0 z-[500]" aria-hidden="true"></div>
        <p v-if="error" class="nota m-3">No se pudo cargar el mapa. Los valores siguen disponibles en la tabla.</p>
        <div ref="el" :style="{ height: alto + 'px' }" class="mapa w-full" role="region" :aria-label="`Mapa de la provincia de San Miguel coloreado por ${ind.nombre}. La tabla debajo contiene los mismos valores.`"></div>
      </div>
    </div>

    <aside class="tarjeta p-4 text-[0.88rem]" aria-live="polite">
      <p class="kicker">Leyenda</p>
      <p class="mt-1 font-semibold leading-snug text-ink">{{ ind.nombre }}</p>
      <p class="meta">{{ ind.ref }}, pág. {{ ind.pag }} · {{ unidadTxt }}</p>
      <ul class="mt-3 space-y-1.5">
        <li v-for="(c, i) in clases" :key="i" class="flex items-center gap-2">
          <span class="inline-block h-3.5 w-6 rounded" :style="{ background: `var(--o${4 - clases.length + i + 1})` }"></span>
          <span class="tabular-nums">{{ fmt(c.min) }} – {{ fmt(c.max) }}</span>
        </li>
        <li class="flex items-center gap-2"><span class="inline-block h-3.5 w-6 rounded border border-dashed border-[var(--axis)] bg-surface-3"></span>Sin dato en el documento</li>
      </ul>
      <p class="meta mt-2">Clases por cuartiles entre los 13 distritos. Las cifras exactas están en la tabla y en las ventanas de cada distrito.</p>
      <p v-if="ind.provincial" class="mt-2">Valor provincial: <b>{{ ind.provincial }}</b></p>
      <div v-if="verEESS" class="mt-4 border-t border-line pt-3">
        <p class="font-semibold text-ink">Establecimientos</p>
        <ul class="mt-1.5 space-y-1">
          <li v-for="c in ['I-1','I-2','I-3','I-4']" :key="c" class="flex items-center gap-2"><svg width="22" height="22" aria-hidden="true"><circle cx="11" cy="11" :r="radio(c)" fill="var(--verde)" stroke="#fff" stroke-width="2"/></svg>Categoría {{ c }} (MINSA)</li>
          <li class="flex items-center gap-2"><svg width="22" height="22" aria-hidden="true"><circle cx="11" cy="11" r="6" fill="#6b7a80" stroke="#fff" stroke-width="2"/></svg>EsSalud</li>
          <li class="flex items-center gap-2"><svg width="22" height="22" aria-hidden="true"><circle cx="11" cy="11" r="6" fill="var(--verde)" stroke="var(--ink)" stroke-width="1.5" stroke-dasharray="2 2"/></svg>Coordenada a revisar</li>
        </ul>
      </div>
      <p class="meta mt-4">Límites referenciales del IGN (fuente INEI) y ubicación de establecimientos de la capa del IGN, publicados en la Infraestructura de Datos Espaciales del Perú. No constituyen demarcación oficial.</p>
    </aside>

    <details class="xl:col-span-2">
      <summary class="btn w-fit cursor-pointer list-none no-imprimir">Ver valores por distrito</summary>
      <div class="tabla-wrap mt-2">
        <table class="tabla">
          <thead><tr><th>Distrito</th><th>UBIGEO</th><th class="n">{{ ind.nombre }} ({{ unidadTxt }})</th></tr></thead>
          <tbody><tr v-for="r in filas" :key="r.ub" :class="{ hl: r.ub === sel }"><td><a :href="urlFicha + r.slug + '/'">{{ r.d }}</a></td><td>{{ r.ub }}</td><td class="n">{{ r.v?.t ?? '–' }}</td></tr></tbody>
        </table>
      </div>
    </details>
  </div>
</template>

<style>
.mapa.leaflet-container { background: var(--surface-2); font-family: inherit; }
.leaflet-popup-content-wrapper, .leaflet-popup-tip { background: var(--surface); color: var(--ink); }
.leaflet-tooltip { background: var(--ink); color: var(--surface); border: 0; font-size: 12px; }
.leaflet-tooltip-top:before { border-top-color: var(--ink); }
.leaflet-tooltip.et-dist { background: transparent; box-shadow: none; color: var(--ink); font-size: 10.5px; font-weight: 650; padding: 0; text-shadow: 0 0 3px var(--surface), 0 0 3px var(--surface), 0 0 2px var(--surface); white-space: nowrap; }
.leaflet-tooltip.et-dist:before { display: none; }
.leaflet-control-attribution { font-size: 10px; background: color-mix(in srgb, var(--surface) 85%, transparent) !important; color: var(--ink-2); }
.leaflet-control-attribution a { color: var(--link); }
.leaflet-bar a { background: var(--surface); color: var(--ink); border-color: var(--grid); }
</style>
