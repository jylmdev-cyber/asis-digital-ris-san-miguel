// Renderizado de gráficos con Apache ECharts (solo en el navegador; se importa de forma diferida).
import type { ChartSpec, Color } from './tipos';

let cargado: Promise<typeof import('echarts/core')> | null = null;
export function cargarECharts() {
  cargado ??= (async () => {
    const core = await import('echarts/core');
    const [{ BarChart, LineChart }, comps, { CanvasRenderer }, { LabelLayout }] = await Promise.all([
      import('echarts/charts'), import('echarts/components'), import('echarts/renderers'), import('echarts/features'),
    ]);
    core.use([BarChart, LineChart, comps.GridComponent, comps.TooltipComponent, comps.LegendComponent, comps.MarkLineComponent, CanvasRenderer, LabelLayout]);
    return core;
  })();
  return cargado;
}

const css = (v: string) => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
export const colorDe = (c: Color) => css(c === 'muted' ? '--muted' : `--${c}`);

export function alturaDe(spec: ChartSpec, ancho: number): number {
  if (spec.tipo === 'barras' && spec.orientacion === 'h') return Math.max(140, spec.categorias.length * (ancho < 520 ? 34 : 30) + 70);
  if (spec.tipo === 'piramide') return spec.grupos.length * 22 + 70;
  if (spec.tipo === 'pareto') return spec.categorias.length * 30 + 90;
  return ancho < 520 ? 260 : 320;
}

export const fmtNum = (n: number) => { const r = Number.isInteger(n) ? String(n) : String(Math.round(n * 100) / 100); const [e, d] = r.split('.'); return e.replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + (d ? ',' + d : ''); };
const esc = (s: string) => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));

export function opciones(spec: ChartSpec, ancho: number, animar: boolean): any {
  const tinta = css('--ink'), tinta2 = css('--ink-2'), grid = css('--grid'), eje = css('--axis'), sup = css('--surface');
  const movil = ancho < 520;
  const base = {
    animation: animar, animationDuration: 600, animationEasing: 'cubicOut',
    textStyle: { fontFamily: css('--font-sans') || 'system-ui, sans-serif', color: tinta2 },
    tooltip: {
      backgroundColor: tinta, borderWidth: 0, textStyle: { color: sup, fontSize: 12 }, confine: true,
      extraCssText: 'border-radius:8px;box-shadow:0 6px 20px rgba(0,0,0,.2);max-width:280px;white-space:normal;',
    },
  };
  const ejeCat = (cats: string[]) => ({
    type: 'category', data: cats, inverse: true, axisTick: { show: false }, axisLine: { lineStyle: { color: eje } },
    axisLabel: { color: tinta, fontSize: movil ? 11 : 12, width: movil ? 108 : 190, overflow: 'break', lineHeight: 14 },
  });
  const ejeVal = (unidad?: string, max?: number) => ({
    type: 'value', max, splitLine: { lineStyle: { color: grid } }, axisLabel: { color: tinta2, fontSize: 11, formatter: (v: number) => fmtNum(v) + (unidad === ' %' ? ' %' : '') },
  });

  if (spec.tipo === 'barras') {
    const h = spec.orientacion === 'h';
    const resaltar = new Set(spec.resaltar ?? []);
    const series = spec.series.map((s, i) => {
      const ultima = i === spec.series.length - 1;
      return {
        type: 'bar', name: s.nombre, stack: spec.apilado ? 'total' : undefined, barMaxWidth: 18, barGap: '20%',
        itemStyle: { color: colorDe(s.color), borderRadius: (ultima || !spec.apilado) ? (h ? [0, 4, 4, 0] : [4, 4, 0, 0]) : 0, borderColor: sup, borderWidth: spec.apilado ? 1 : 0 },
        data: s.valores.map((v, k) => ({ value: v, itemStyle: resaltar.has(spec.categorias[k]) ? { color: css('--s1-strong') } : s.coloresPorPunto ? { color: colorDe(s.coloresPorPunto[k]) } : undefined })),
        label: spec.apilado
          ? (ultima && spec.etiquetaTotal ? { show: true, position: h ? 'right' : 'top', color: tinta, fontSize: 11, fontWeight: 600, formatter: (p: any) => spec.etiquetaTotal![p.dataIndex] } : { show: false })
          : { show: true, position: h ? 'right' : 'top', color: tinta, fontSize: 11, fontWeight: 600, formatter: (p: any) => s.etiquetas[p.dataIndex] },
        markLine: i === 0 && spec.referencia ? {
          silent: true, symbol: 'none', lineStyle: { color: tinta2, type: 'dashed', width: 1.5 },
          label: { formatter: spec.referencia.etiqueta, color: tinta2, fontSize: 11, position: 'end', backgroundColor: sup, padding: [2, 4] },
          data: [h ? { xAxis: spec.referencia.valor } : { yAxis: spec.referencia.valor }],
        } : undefined,
      };
    });
    return {
      ...base,
      legend: spec.series.length > 1 ? { top: 0, left: 0, icon: 'roundRect', itemWidth: 12, itemHeight: 12, textStyle: { color: tinta2 } } : undefined,
      grid: { left: 4, right: movil ? 64 : 92, top: spec.series.length > 1 ? 34 : 12, bottom: 8, containLabel: true },
      tooltip: { ...base.tooltip, trigger: 'axis', axisPointer: { type: 'shadow' },
        formatter: (ps: any[]) => `<b>${esc(ps[0].name)}</b><br>` + ps.map(p => `${p.marker} <b>${esc(spec.series[p.seriesIndex].etiquetas[p.dataIndex])}</b> ${spec.series.length > 1 ? esc(p.seriesName) : ''}`).join('<br>') },
      xAxis: h ? ejeVal(spec.unidad, spec.max) : { ...ejeCat(spec.categorias), inverse: false, axisLabel: { color: tinta, fontSize: 11, interval: 0, rotate: movil ? 35 : 0 } },
      yAxis: h ? ejeCat(spec.categorias) : ejeVal(spec.unidad, spec.max),
      series,
    };
  }

  if (spec.tipo === 'lineas') {
    return {
      ...base,
      legend: spec.series.length > 1 ? { top: 0, left: 0, textStyle: { color: tinta2 } } : undefined,
      grid: { left: 8, right: 48, top: spec.series.length > 1 ? 36 : 16, bottom: 8, containLabel: true },
      tooltip: { ...base.tooltip, trigger: 'axis', formatter: (ps: any[]) => `<b>${esc(ps[0].name)}</b><br>` + ps.map(p => `${p.marker} <b>${esc(spec.series[p.seriesIndex].etiquetas[p.dataIndex])}</b> ${esc(p.seriesName)}`).join('<br>') },
      xAxis: { type: 'category', data: spec.categorias, boundaryGap: false, axisLine: { lineStyle: { color: eje } }, axisLabel: { color: tinta } },
      yAxis: { type: 'value', scale: true, splitLine: { lineStyle: { color: grid } }, axisLabel: { color: tinta2, formatter: (v: number) => fmtNum(v) } },
      series: spec.series.map(s => ({
        type: 'line', name: s.nombre, data: s.valores, symbol: 'circle', symbolSize: 9, lineStyle: { width: 2, color: colorDe(s.color) },
        itemStyle: { color: colorDe(s.color), borderColor: sup, borderWidth: 2 },
        label: { show: true, position: 'top', color: tinta, fontWeight: 600, fontSize: 11, formatter: (p: any) => s.etiquetas[p.dataIndex] },
      })),
    };
  }

  if (spec.tipo === 'piramide') {
    const mx = Math.max(...spec.femenino, ...spec.masculino) * 1.25;
    const mk = (nombre: string, vals: number[], ets: string[], color: string, signo: number) => ({
      type: 'bar', name: nombre, stack: 'p', barMaxWidth: 14, data: vals.map(v => signo * v),
      itemStyle: { color, borderRadius: signo < 0 ? [4, 0, 0, 4] : [0, 4, 4, 0] },
      label: { show: true, position: signo < 0 ? 'left' : 'right', color: tinta2, fontSize: 10.5, formatter: (p: any) => ets[p.dataIndex] + ' %' },
    });
    return {
      ...base,
      legend: { top: 0, left: 'center', textStyle: { color: tinta2 } },
      grid: { left: 12, right: 12, top: 30, bottom: 8, containLabel: true },
      tooltip: { ...base.tooltip, trigger: 'axis', axisPointer: { type: 'shadow' },
        formatter: (ps: any[]) => `<b>${esc(ps[0].name)} años</b><br>` + ps.map(p => `${p.marker} <b>${esc((p.seriesIndex === 0 ? spec.etFem : spec.etMasc)[p.dataIndex])} %</b> ${esc(p.seriesName)}`).join('<br>') },
      xAxis: { type: 'value', min: -mx, max: mx, splitLine: { lineStyle: { color: grid } }, axisLabel: { color: tinta2, formatter: (v: number) => fmtNum(Math.abs(v)) + ' %' } },
      yAxis: { type: 'category', data: spec.grupos, axisTick: { show: false }, axisLine: { lineStyle: { color: eje } }, axisLabel: { color: tinta, fontSize: 11 } },
      series: [mk('Femenino', spec.femenino, spec.etFem, colorDe('s1'), -1), mk('Masculino', spec.masculino, spec.etMasc, colorDe('s2'), 1)],
    };
  }

  // pareto (un solo eje en %): barras = % de cada causa; línea = % acumulado
  return {
    ...base,
    legend: { top: 0, left: 0, textStyle: { color: tinta2 }, data: ['% del total', '% acumulado'] },
    grid: { left: 4, right: movil ? 40 : 60, top: 34, bottom: 8, containLabel: true },
    tooltip: { ...base.tooltip, trigger: 'axis', axisPointer: { type: 'shadow' },
      formatter: (ps: any[]) => `<b>${esc(ps[0].name)}</b><br>` + ps.map(p => `${p.marker} <b>${p.seriesIndex === 0 ? esc(spec.etiquetas[p.dataIndex]) : (fmtNum(spec.acumulado[p.dataIndex]) + ' %')}</b> ${esc(p.seriesName)}`).join('<br>') },
    xAxis: { type: 'value', max: 100, splitLine: { lineStyle: { color: grid } }, axisLabel: { color: tinta2, formatter: '{value} %' } },
    yAxis: ejeCat(spec.categorias),
    series: [
      { type: 'bar', name: '% del total', data: spec.porcentaje, barMaxWidth: 16, itemStyle: { color: colorDe('s1'), borderRadius: [0, 4, 4, 0] },
        label: { show: true, position: 'right', color: tinta, fontSize: 11, fontWeight: 600, formatter: (p: any) => spec.etiquetas[p.dataIndex] } },
      { type: 'line', name: '% acumulado', data: spec.acumulado, symbol: 'circle', symbolSize: 7, lineStyle: { width: 2, color: colorDe('s2') }, itemStyle: { color: colorDe('s2'), borderColor: sup, borderWidth: 2 } },
    ],
  };
}
