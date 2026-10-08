# Guía de actualización de la información

## A. Corregir una cifra de la edición 2025

1. Abra `src/data/ediciones/2025/asis.json` y busque el cuadro por su `id` o `ref` (por ejemplo `"ref": "Cuadro 32"`).
2. Edite el valor en `rows`. Las cifras se escriben como texto, igual que en el documento: `"52,9"`, `"38 627"`.
3. Si la corrección resuelve una nota de calidad, actualice o elimine el campo `nota` de ese cuadro.
4. Ejecute las pruebas:
   ```bash
   npm test
   ```
   Si una suma deja de coincidir con su total, la prueba lo indica.
5. Revise el resultado localmente:
   ```bash
   npm run build
   npm run preview
   ```
6. Suba el cambio:
   ```bash
   git commit -am "Corrige cuadro 32"
   git push
   ```
   GitHub Actions vuelve a publicar en unos dos minutos y el enlace no cambia.

## B. Incorporar una nueva edición (ASIS 2026, 2027…)

1. Extraiga las tablas del nuevo documento. El flujo usado en 2025 fue: convertir el .doc/.docx con Word, leer las tablas del XML y transcribir solo lo que sea imagen.
2. Guarde el resultado completo, incluidas las tablas de uso interno, en `datos-fuente/2026/asis-completo.json`, con la misma estructura que `datos-fuente/2025/asis-completo.json`.
   - Marque `"privacidad": "interna"` en las tablas que no deben publicarse.
   - Marque `"suprimir_sexo_publico": true` en las tablas con muy pocos casos.
3. Copie o actualice las capas geográficas en `datos-fuente/2026/geo-ign/`. Pueden reutilizarse las de 2025 si no cambiaron.
4. Ejecute:
   ```bash
   npm run datos:preparar -- 2026
   ```
   Esto crea `src/data/ediciones/2026/`.
5. Agregue la edición en `src/config/sitio.ts` (`EDICIONES`) y marque `actual: true` en la nueva.
6. Revise las páginas de `src/pages/[anio]/`: usan los `id` de las tablas (`c32`, `t03`…). Si el nuevo ASIS cambia la numeración, ajuste los `id` en el JSON para mantenerlos o adapte la página. `ed.tiene('id')` permite ocultar tarjetas inexistentes.
7. Ejecute `npm test` y `npm run build`. La portada redirigirá a la edición nueva y la anterior seguirá disponible en `/2025/`.

## C. Habilitar la descarga del documento oficial

Cuando exista una versión autorizada para difusión (sin datos que identifiquen personas):
- publíquela en una URL oficial y colóquela en `documentoOficialUrl` de `src/config/sitio.ts`; o
- copie el PDF a `public/documentos/` y use la ruta relativa. En este caso, el build se detendrá a propósito por la regla “el build contiene PDF”: retire esa regla de `scripts/verificar-build.mjs` solo después de la autorización.

## D. Qué no hacer

- No suba la carpeta `datos-fuente/`, que incluye tablas de uso interno. `.gitignore` ya la excluye.
- No vuelva a ejecutar `datos:preparar` sobre una edición ya corregida a mano: sobrescribiría el JSON público.
