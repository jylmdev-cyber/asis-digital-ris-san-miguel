<script setup lang="ts">
// Búsqueda global (índice estático generado en el build, se descarga al primer uso). Atajos: "/" o Ctrl+K.
import { computed, nextTick, onMounted, ref } from 'vue';
interface Item { t: string; s: string; u: string; k: string }
const props = defineProps<{ indice: string }>();
const abierto = ref(false), q = ref(''), items = ref<Item[] | null>(null), sel = ref(0), fallo = ref(false);
const entrada = ref<HTMLInputElement | null>(null);
const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

async function cargar() {
  if (items.value || fallo.value) return;
  try { const r = await fetch(props.indice); if (!r.ok) throw new Error(String(r.status)); items.value = await r.json(); }
  catch { fallo.value = true; }
}
const res = computed(() => {
  const terms = norm(q.value.trim()).split(/\s+/).filter(Boolean);
  if (!terms.length || !items.value) return [];
  return items.value.map(it => { const k = norm(it.t + ' ' + it.k + ' ' + it.s), tt = norm(it.t); let p = 0;
      for (const t of terms) { if (!k.includes(t)) return null; p += tt.includes(t) ? (tt.startsWith(t) ? 4 : 3) : 1; } return { it, p }; })
    .filter(Boolean).sort((a: any, b: any) => b.p - a.p).slice(0, 14).map((x: any) => x.it as Item);
});
async function abrir() { abierto.value = true; cargar(); await nextTick(); entrada.value?.focus(); }
function cerrar() { abierto.value = false; q.value = ''; sel.value = 0; }
function ir(it?: Item) { if (it) location.href = it.u; cerrar(); }
function tecla(e: KeyboardEvent) {
  if (e.key === 'ArrowDown') { e.preventDefault(); sel.value = Math.min(sel.value + 1, res.value.length - 1); }
  else if (e.key === 'ArrowUp') { e.preventDefault(); sel.value = Math.max(sel.value - 1, 0); }
  else if (e.key === 'Enter') { e.preventDefault(); ir(res.value[sel.value]); }
  else if (e.key === 'Escape') cerrar();
}
onMounted(() => {
  document.addEventListener('keydown', e => {
    const t = e.target as HTMLElement;
    const escribiendo = t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT');
    if ((e.key === '/' && !escribiendo) || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k')) { e.preventDefault(); abrir(); }
  });
});
</script>

<template>
  <div class="no-imprimir">
    <button type="button" @click="abrir" class="flex items-center gap-2 rounded-lg border border-white/30 bg-white/10 px-2.5 py-1.5 text-sm text-white/90 hover:bg-white/15 sm:min-w-[230px]" aria-haspopup="dialog">
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M10.5 18a7.5 7.5 0 1 0 0-15 7.5 7.5 0 0 0 0 15Zm5.5-2 5 5"/></svg>
      <span class="hidden sm:inline">Buscar indicador o distrito…</span><span class="sr-only">Buscar</span>
      <kbd class="ml-auto hidden rounded border border-white/30 px-1.5 text-[0.7rem] sm:inline">/</kbd>
    </button>
    <div v-if="abierto" class="fixed inset-0 z-[80] bg-black/45 p-3 pt-[10vh] sm:p-6 sm:pt-[12vh]" @click.self="cerrar">
      <div role="dialog" aria-modal="true" aria-label="Buscar en el ASIS" class="mx-auto w-full max-w-xl overflow-hidden rounded-2xl bg-surface text-ink shadow-2xl">
        <div class="flex items-center gap-2 border-b border-line px-4">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" class="text-muted" aria-hidden="true"><path d="M10.5 18a7.5 7.5 0 1 0 0-15 7.5 7.5 0 0 0 0 15Zm5.5-2 5 5"/></svg>
          <input ref="entrada" v-model="q" @keydown="tecla" @input="sel = 0" type="search" placeholder="Ej.: anemia, agua potable, Llapa, Cuadro 32"
                 class="w-full bg-transparent py-3.5 text-base outline-none" aria-label="Buscar" aria-controls="resBusq" :aria-activedescendant="res.length ? 'rb' + sel : undefined" />
          <button type="button" class="btn" @click="cerrar">Esc</button>
        </div>
        <ul id="resBusq" role="listbox" class="max-h-[60vh] overflow-y-auto p-2">
          <li v-if="fallo" class="px-3 py-3 text-sm text-ink-2">No se pudo cargar el índice de búsqueda.</li>
          <li v-else-if="!items" class="px-3 py-3 text-sm text-ink-2">Cargando índice…</li>
          <li v-else-if="!q.trim()" class="px-3 py-3 text-sm text-ink-2">Escriba un indicador, un distrito, un número de cuadro o una sigla.</li>
          <li v-else-if="!res.length" class="px-3 py-3 text-sm text-ink-2">Sin resultados para «{{ q }}».</li>
          <li v-for="(it, i) in res" :key="it.u + i" :id="'rb' + i" role="option" :aria-selected="i === sel">
            <a :href="it.u" @click="cerrar" @mousemove="sel = i" class="block rounded-lg px-3 py-2 no-underline" :class="i === sel ? 'bg-accent-soft' : ''">
              <span class="block text-[0.93rem] font-medium text-ink">{{ it.t }}</span>
              <span class="block text-[0.78rem] text-ink-2">{{ it.s }}</span>
            </a>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>
