# Entregable 2 · Propuesta técnica

## 1. Comparación de tecnologías

| Criterio | **Astro 7 + islas Vue 3** (elegido) | Nuxt 4 + Vue 3 (SSG) | React + Vite (SPA) |
|---|---|---|---|
| Salida estática | Nativa: HTML por página, sin JS salvo en las islas | `nuxt generate`; hidrata toda la página | SPA: el contenido depende de JS |
| JavaScript inicial | Mínimo: solo buscador, gráficos y mapas, cargados al hacerse visibles | Runtime de Vue + Nuxt en todas las páginas | Bundle de la app completa |
| Rendimiento en celular y 3G rural | El mejor (texto y tablas visibles sin JS) | Bueno | Más lento en la primera carga |
| SEO y vista previa en WhatsApp | HTML completo por página | Bueno | Requiere prerender adicional |
| Componentes interactivos | Vue 3 (familiar para equipos Nuxt) | Vue 3 | React |
| Actualización anual | JSON por edición + rutas `/[anio]/` | Similar | Similar |
| Hosting gratuito | Cualquier hosting estático | Cualquier hosting estático | Cualquier hosting estático |

**Justificación:**
- El ASIS es contenido mayormente estático con interactividad puntual (filtros, gráficos y mapas). Astro entrega HTML legible sin JavaScript y solo envía código a las islas que lo necesitan.
- Las islas se escriben en Vue 3, así que un equipo que conoce Nuxt las puede mantener.
- No hay base de datos ni servidor: los datos son JSON versionados y cada página se genera en el build.

## 2. Arquitectura

```
datos-fuente/2025/        (NO versionado) tablas completas extraídas del DOC/PDF + capas IGN en bruto
        │  npm run datos:preparar   ← filtro de privacidad, UBIGEO, simplificación de geometría
        ▼
src/data/ediciones/2025/  (versionado, público)
  asis.json               51 tablas, 11 gradientes, textos literales, siglas, limitaciones
  geo/distritos.json      13 límites distritales (IGN/INEI)
  geo/establecimientos.json 47 establecimientos (IGN), sin datos personales
        │  astro build
        ▼
src/lib/                  datos.ts (acceso), specs.ts (gráficos calculados en el build), distritos.ts
src/pages/[anio]/         una página por módulo; fichas distritales; datos/*.csv|json|geojson
src/components/islas/     VizCard.vue (filtros+ECharts+tabla+CSV/PNG), MapaTerritorial.vue (Leaflet), Buscador.vue
        │  scripts/verificar-build.mjs   ← índice de búsqueda, privacidad, enlaces rotos
        ▼
dist/                     sitio estático listo para cualquier hosting
```

**Principios aplicados:**
- **Datos separados del diseño.** Las cifras se guardan como texto, tal como en el documento.
- **Gráficos calculados en el build.** Cada combinación de filtros se precalcula; el navegador solo dibuja.
- **Carga diferida.** ECharts y Leaflet se descargan cuando el gráfico o el mapa entra en pantalla; la geometría se descarga una sola vez y queda en caché.
- **Accesibilidad.** Cada gráfico tiene una tabla equivalente, etiquetas con la cifra exacta, colores validados para daltonismo, modo oscuro propio, navegación por teclado y respeto a “reducir movimiento”.
- **Seguridad.** Sitio estático, sin formularios, cookies ni analítica, con Content-Security-Policy. El mapa base externo (OpenStreetMap) solo se carga si la persona lo activa.

## 3. Librerías y herramientas

| Uso | Herramienta | Versión |
|---|---|---|
| Generador estático | Astro | 7.3.3 |
| Islas interactivas | Vue | 3.5.43 (`@astrojs/vue` 7.0.3) |
| Estilos | Tailwind CSS | 4.3.3 |
| Gráficos | Apache ECharts (importación modular) | 6.1.0 |
| Mapas | Leaflet | 1.9.4 |
| Pruebas | Vitest | 5.0.1 |
| QR | qrcode | 1.5.4 |
| Sitemap | @astrojs/sitemap | 3.7.4 |

Las versiones se instalaron con `npm install --before=2026-09-20`, para no usar publicaciones de menos de dos semanas, y quedan fijadas en `package.json`.

**D3.js no se incluyó:** ECharts cubre barras, líneas, pirámide y Pareto con menos código. **Chart.js** no permite combinar sin esfuerzo la pirámide y las etiquetas exactas del documento.

## 4. Alternativas gratuitas de despliegue

Condiciones verificadas el 07/10/2026 en la documentación oficial de cada servicio:

| | **GitHub Pages** | **Cloudflare Pages** | Netlify (Free) | Vercel (Hobby) |
|---|---|---|---|---|
| Costo | S/ 0 (repositorio público) | S/ 0 | S/ 0 | S/ 0 |
| Subdominio gratuito | `usuario.github.io/repo` | `proyecto.pages.dev` | `sitio.netlify.app` | `proyecto.vercel.app` |
| HTTPS | Automático | Automático | Automático | Automático |
| Despliegue automático desde GitHub | Sí (GitHub Actions) | Sí (integración Git) o carga manual | Sí | Sí (no con repos de organizaciones en Hobby) |
| Límites principales | Sitio ≤ 1 GB; ancho de banda *soft* 100 GB/mes; despliegue ≤ 10 min | 500 builds/mes; 1 build a la vez; 20 000 archivos; 25 MiB por archivo; 100 dominios propios por proyecto | Tope de 300 créditos/mes; cada despliegue a producción cuesta 15 créditos; el ancho de banda también consume créditos | Solo uso personal no comercial; 100 GB de transferencia/mes |
| Compatibilidad con Astro estático | Total | Total | Total | Total |
| Ventajas | Ya autenticado en este equipo; historial de cambios; cero configuración extra | Sin tope publicado de ancho de banda para archivos estáticos; cabeceras de seguridad (`_headers`); fácil de conectar a un subdominio institucional | Panel sencillo | Muy rápido |
| Desventajas | Repo público obligatorio en el plan gratuito; sin cabeceras HTTP propias | Requiere cuenta de Cloudflare | Los créditos pueden agotarse y pausar el sitio | Cláusula “personal, no comercial” poco adecuada para una institución |

**Recomendación:**
- **Fase inicial (ya ejecutada): GitHub Pages con GitHub Actions.** Cada cambio en `main` prueba, compila, verifica y publica.
- **Fase institucional: Cloudflare Pages** conectado al mismo repositorio. Permite asociar luego un subdominio institucional y aplicar las cabeceras de seguridad de `public/_headers`. No requiere cambios de código: basta con definir `BASE=/`.
- Netlify y Vercel quedan como alternativas, no recomendadas por el límite de créditos y por la cláusula de uso personal, respectivamente.
