# ASIS DIGITAL 2025 | RIS SAN MIGUEL

Observatorio digital del **Análisis de Situación de Salud (ASIS) 2025** de la Red Integrada de Salud San Miguel (DIRESA Cajamarca). Convierte el documento oficial de 97 páginas en una plataforma web estática, interactiva y compartible:

- **Módulos:** dashboard, territorio con mapa, demografía, determinantes, servicios, epidemiología, desigualdades, priorización y biblioteca.
- **Fichas:** una por cada uno de los 13 distritos.
- **Herramientas:** buscador global, filtros, descarga en CSV y PNG, enlaces directos e impresión por sección.

> Visualización del documento oficial. No es un sistema de registro, no reemplaza al HIS MINSA y no contiene datos de personas.

## Requisitos e instalación

- Node.js 20 o superior (probado con 22 y 24).

```bash
npm ci
```

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo en `http://localhost:4321/asis-digital-ris-san-miguel/` |
| `npm test` | Pruebas de integridad (sumas = totales) y privacidad de los datos |
| `npm run build` | Genera `dist/`, el índice de búsqueda, y verifica enlaces y privacidad |
| `npm run preview` | Sirve `dist/` localmente |
| `npm run datos:preparar -- <año>` | Crea los datos públicos de una edición desde `datos-fuente/` (solo al incorporar una edición) |
| `npm run qr` | Genera el código QR del enlace público |

`SITE` y `BASE` definen la URL pública. Por defecto: `https://jylmdev-cyber.github.io` y `/asis-digital-ris-san-miguel/`. Para Cloudflare Pages o un dominio propio use `BASE=/`.

## Estructura

```
src/
  config/sitio.ts             ediciones registradas, módulos y documento oficial
  data/ediciones/2025/        DATOS PÚBLICOS (JSON): asis.json, geo/distritos.json, geo/establecimientos.json
  lib/                        acceso a datos, constructores de gráficos, indicadores distritales, rutas
  components/                 Seccion, Kpi, TablaDatos, Icono (Astro, sin JS)
  components/islas/           VizCard.vue (gráfico+tabla+filtros), MapaTerritorial.vue (Leaflet), Buscador.vue
  layouts/Base.astro          encabezado, menú, tema claro/oscuro, metadatos para compartir
  pages/[anio]/               módulos, fichas distritales, datos/*.csv|json|geojson
scripts/                      preparar-datos, verificar-build, generar-qr
tests/                        pruebas de datos (Vitest)
docs/                         diagnóstico, propuesta técnica, guía de actualización, despliegue
datos-fuente/                 (NO versionado) datos completos con tablas de uso interno
```

## Documentación

- [Entregable 1 · Diagnóstico del documento](docs/01-diagnostico.md): inventario, calidad de datos, privacidad y mejoras.
- [Entregable 2 · Propuesta técnica](docs/02-propuesta-tecnica.md): comparación de tecnologías, arquitectura, librerías y hosting.
- [Guía de actualización](docs/03-guia-actualizacion.md): corregir cifras e incorporar ASIS 2026 y siguientes.
- [Despliegue gratuito](docs/04-despliegue.md): GitHub Pages, Cloudflare Pages, QR y lista de verificación.

## Fuentes y licencias

- **Contenido:** ASIS RIS San Miguel 2025, Oficina de Epidemiología de la Red de Salud San Miguel y DIRESA Cajamarca. La autoría del análisis es de la institución.
- **Límites y establecimientos:** Instituto Geográfico Nacional (IGN), vía la Infraestructura de Datos Espaciales del Perú (IDEP). Son límites referenciales.
- **Mapa base opcional:** © colaboradores de OpenStreetMap.
- **Código de la plataforma:** licencia MIT.
