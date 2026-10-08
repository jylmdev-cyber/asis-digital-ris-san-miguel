#!/usr/bin/env node
// Genera el código QR (PNG y SVG) del enlace público de la edición vigente en public/.
//   SITE=https://<usuario>.github.io BASE=/<repo>/ node scripts/generar-qr.mjs 2025
import QRCode from 'qrcode';
import path from 'node:path';
const anio = process.argv[2] || '2025';
const SITE = process.env.SITE || 'https://jylmdev-cyber.github.io';
const BASE = (process.env.BASE ?? '/asis-digital-ris-san-miguel/').replace(/\/?$/, '/');
const url = new URL(`${BASE}${anio}/`, SITE).href;
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1')), '..');
const opt = { errorCorrectionLevel: 'M', margin: 2, color: { dark: '#3c5395', light: '#ffffff' } };
await QRCode.toFile(path.join(ROOT, 'public', `qr-asis-${anio}.png`), url, { ...opt, width: 640 });
await QRCode.toFile(path.join(ROOT, 'public', `qr-asis-${anio}.svg`), url, { ...opt, type: 'svg' });
console.log('✔ QR generado para', url);
