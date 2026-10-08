// Pruebas de integridad de los datos públicos de cada edición. Ejecutar: npm test
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { num, mostrar, esTotal } from '../src/lib/datos';

const DIR = path.resolve(__dirname, '../src/data/ediciones');
const EDICIONES = fs.readdirSync(DIR).filter(d => /^\d{4}$/.test(d));
const leer = (anio: string, f: string) => JSON.parse(fs.readFileSync(path.join(DIR, anio, f), 'utf8'));
const n = (s: string) => (s === '' ? 0 : num(s) ?? NaN);

describe('utilidades de cifras', () => {
  it('convierte el formato del documento a número', () => {
    expect(num('38 627')).toBe(38627);
    expect(num('52,9')).toBe(52.9);
    expect(num('0,64')).toBe(0.64);
    expect(num('')).toBeNull();
    expect(num('–')).toBeNull();
  });
  it('presenta la cifra sin alterarla', () => {
    expect(mostrar('137266')).toBe('137 266');
    expect(mostrar('52,9')).toBe('52,9');
    expect(mostrar('3803')).toBe('3803');
  });
});

for (const anio of EDICIONES) {
  const d = leer(anio, 'asis.json');
  const T: Record<string, any> = Object.fromEntries(d.tablas.map((t: any) => [t.id, t]));
  const body = (t: any) => t.rows.filter((r: string[]) => !esTotal(r));
  const total = (t: any) => t.rows.find(esTotal);

  describe(`edición ${anio}: estructura y trazabilidad`, () => {
    it('cada tabla tiene referencia, título, página y fuente', () => {
      for (const t of d.tablas) {
        expect(t.ref, t.id).toBeTruthy();
        expect(t.titulo, t.id).toBeTruthy();
        expect(t.pag, t.id).toBeGreaterThan(0);
        expect(t.fuente, t.id).toBeTruthy();
      }
    });
    it('cada fila tiene tantas celdas como columnas', () => {
      for (const t of d.tablas) for (const r of t.rows) expect(r.length, `${t.id}: ${r[0]}`).toBe(t.cols.length);
    });
    it('los distritos son los 13 de la provincia con su UBIGEO', () => {
      expect(d.distritos).toHaveLength(13);
      for (const x of d.distritos) expect(x.ubigeo).toMatch(/^0611\d{2}$/);
    });
  });

  describe(`edición ${anio}: privacidad`, () => {
    const texto = JSON.stringify(d);
    it('no contiene tablas de uso interno ni el detalle del caso materno', () => {
      expect(d.tablas.some((t: any) => t.id === 't15')).toBe(false);
      expect(d.texto.mortalidad_materna_interno).toBeUndefined();
      const extra = path.resolve(__dirname, '../datos-fuente/terminos-prohibidos.txt');
      const locales = fs.existsSync(extra) ? fs.readFileSync(extra, 'utf8').split(/\r?\n/).filter(l => l.trim() && !l.startsWith('#')).map(l => new RegExp(l.trim(), 'is')) : [];
      for (const re of [/\bMEF de \d+/i, /\bgesta\s*\d/i, ...locales]) expect(texto).not.toMatch(re);
    });
    it('los grupos con menos de 10 defunciones no se desagregan por sexo', () => {
      for (const t of d.tablas.filter((t: any) => t.id.startsWith('mort_'))) {
        const tot = n(total(t)[1]);
        if (tot < 10) expect(t.cols, t.id).not.toContain('Femenino');
      }
    });
    it('no contiene correos ni números de 8 dígitos', () => {
      expect(texto).not.toMatch(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
      expect(texto).not.toMatch(/(?<![\d.,])\d{8}(?![\d.,])/);
    });
  });

  describe(`edición ${anio}: consistencia de cifras (sumas = totales del documento)`, () => {
    it('Cuadro 3: la suma distrital coincide con la población provincial y con el Cuadro 2', () => {
      if (!T.c03) return;
      const suma = (a: string, c = 7) => T.c03.rows.filter((r: string[]) => r[1] === a).reduce((s: number, r: string[]) => s + n(r[c]), 0);
      expect(suma('2023')).toBe(44692);
      expect(suma('2024')).toBe(44219);
      expect(suma('2025')).toBe(43651);
      const c02 = body(T.c02);
      for (let k = 0; k < 5; k++) expect(suma('2025', k + 2), T.c03.cols[k + 2]).toBe(n(c02[k][1]) + n(c02[k][2]));
    });
    it('Tabla 2: los afiliados distritales suman el total', () => {
      for (const c of [1, 2, 3]) expect(body(T.t02).reduce((s: number, r: string[]) => s + n(r[c]), 0)).toBe(n(total(T.t02)[c]));
    });
    it('morbilidad y mortalidad: N = femenino + masculino y las filas suman el total', () => {
      for (const t of d.tablas.filter((t: any) => /^(c32|c38|c39|c45|morb_|mort_)/.test(t.id))) {
        const iF = t.cols.indexOf('Femenino'), iM = t.cols.indexOf('Masculino');
        expect(body(t).reduce((s: number, r: string[]) => s + n(r[1]), 0), t.id).toBe(n(total(t)[1]));
        if (iF > 0) for (const r of body(t)) expect(n(r[iF]) + n(r[iM]), `${t.id}: ${r[0]}`).toBe(n(r[1]));
      }
    });
    it('los cursos de vida suman el total provincial', () => {
      const tot = (pref: string) => ['nino', 'adolescente', 'joven', 'adulto', 'adulto_mayor'].reduce((s, k) => s + n(total(T[`${pref}_${k}`])[1]), 0);
      expect(tot('morb')).toBe(n(total(T.c32)[1]));
      expect(tot('mort')).toBe(n(total(T.c39)[1]));
    });
    it('establecimientos: los distritos suman 48 en los cuadros 4, 28, 29 y 31', () => {
      for (const id of ['c04', 'c28', 'c29', 'c31']) expect(body(T[id]).reduce((s: number, r: string[]) => s + n(r[1]), 0), id).toBe(48);
    });
    it('equipamiento: operativos + inoperativos = total impreso en cada cuadro', () => {
      for (const r of T.equipos_res.rows) expect(n(r[2]) + n(r[3]), r[0]).toBe(n(r[1]));
    });
    it('gradientes: 4 grupos sociales por año', () => {
      for (const g of d.gradientes) for (const v of Object.values(g.valores) as string[][]) expect(v, g.id).toHaveLength(4);
    });
  });

  describe(`edición ${anio}: geodatos`, () => {
    const dist = leer(anio, 'geo/distritos.json'), ee = leer(anio, 'geo/establecimientos.json');
    it('13 polígonos con UBIGEO coincidente con los datos', () => {
      expect(dist.features).toHaveLength(13);
      expect(dist.features.map((f: any) => f.properties.ubigeo).sort()).toEqual(d.distritos.map((x: any) => x.ubigeo).sort());
      expect(dist.fuente?.url).toMatch(/^https:\/\/www\.idep\.gob\.pe\//);
    });
    it('establecimientos sin datos personales y con coordenadas dentro del Perú', () => {
      for (const f of ee.features) {
        expect(Object.keys(f.properties)).not.toContain('director');
        expect(Object.keys(f.properties)).not.toContain('telefono');
        const [x, y] = f.geometry.coordinates;
        expect(x).toBeGreaterThan(-81.5); expect(x).toBeLessThan(-68.5);
        expect(y).toBeGreaterThan(-18.5); expect(y).toBeLessThan(0);
      }
    });
  });
}
