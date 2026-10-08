# Despliegue gratuito

## Opción 1 · GitHub Pages (configurada en este repositorio)

`.github/workflows/desplegar.yml` se ejecuta en cada `push` a `main`:

1. `npm ci`;
2. `npm test` (integridad y privacidad de datos);
3. `npm run build` (incluye la verificación de enlaces y privacidad);
4. publicación en GitHub Pages.

La URL resultante es `https://<usuario>.github.io/<repositorio>/`. `SITE` y `BASE` se calculan automáticamente en el workflow.

**Repositorio nuevo:**

```bash
git init -b main
```
```bash
git add .
```
```bash
git commit -m "ASIS DIGITAL 2025"
```
```bash
gh repo create <repositorio> --public --source . --push
```
```bash
gh api -X POST repos/<usuario>/<repositorio>/pages -f build_type=workflow
```

Si el workflow se ejecutó antes de activar Pages, vuelva a lanzarlo desde *Actions → Desplegar en GitHub Pages → Run workflow*.

## Opción 2 · Cloudflare Pages (recomendada para la fase institucional)

1. Ingrese a *dash.cloudflare.com → Workers & Pages → Create → Pages → Connect to Git* y elija este repositorio.
2. Configure:
   - *Build command:* `npm run build`
   - *Output directory:* `dist`
   - *Variables de entorno:* `BASE=/`, `SITE=https://<proyecto>.pages.dev` y `NODE_VERSION=22`.
3. El enlace queda en `https://<proyecto>.pages.dev`. Cloudflare aplica las cabeceras de `public/_headers`.

Sin Git, también puede ejecutar `npm run build` localmente y arrastrar la carpeta `dist` en *Upload assets*.

## Código QR

```bash
SITE=https://<usuario>.github.io BASE=/<repositorio>/ npm run qr
```

Genera `public/qr-asis-2025.png` y `.svg`, que se publican y aparecen en *Biblioteca → Compartir*.

## Lista de verificación antes de difundir

- [ ] La Oficina de Epidemiología validó las notas de calidad (`docs/01-diagnostico.md`, sección 3).
- [ ] El workflow terminó en verde (pruebas, build y verificación).
- [ ] Prueba en celular Android con datos móviles: menú, buscador («anemia», «Llapa»), filtros, mapa y «Ver tabla de datos».
- [ ] Vista previa del enlace en WhatsApp (título, descripción e imagen).
- [ ] La sección de mortalidad no muestra la Tabla 15 por distrito ni el detalle del caso materno.
