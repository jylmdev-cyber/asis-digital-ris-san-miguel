# Entregable 1 · Diagnóstico del documento

Fuente única: los dos archivos de la carpeta del proyecto. Páginas citadas = número impreso en el documento (página del PDF menos 3).

## 1. Archivos encontrados

| Archivo esperado | Archivo real | Observación |
|---|---|---|
| `ASIS_RIS_SAN_MIGUEL_2025.pdf` | `ASIS_RIS_SAN_MIGUEL_2025.pdf` | 97 páginas, Word 2024, 08/09/2026. |
| `ASIS_RIS_SAN_MIGUEL_2025.docx` | **No existe.** Hay `ASIS_RED_SAN_MIGUEL_2026_FINAL.doc` | Es un **.doc (Word 97-2003)** con otro nombre. Tiene el mismo título, las mismas 97 páginas y las mismas 57 tablas que el PDF. |

### Comparación entre versiones

- **Contenido:** el DOC y el PDF coinciden.
- **Extracción del DOC:** un extractor común (antiword) **omitía secciones** del .doc (Cuadros 7 a 10, Cuadro 31 y el apartado de referencias). Por eso se convirtió el .doc a DOCX con Microsoft Word y las tablas se leyeron del XML. Así no hay transcripción manual.
- **Cuadros solo en imagen:** en ambos archivos son imágenes los Cuadros 3, 7, 8, 9, 11 y 48, los Gráficos 1 a 14 y los Mapas 1 a 6. Se trataron así:
  - **Cuadro 3:** se tomó de la capa de texto del PDF.
  - **Gráfico 1, Cuadro 11, Gráfico 2, Gráficos 4 a 14 y Cuadro 48:** se transcribieron de sus etiquetas.
  - **Cuadros 7, 8 y 9 (flujogramas) y Mapas 1 a 6:** no se reprodujeron, para no estimar cifras.
- **Títulos distintos:**
  - Portada: “… Provincia de San Miguel 2025”.
  - Página interior: “… Red de Servicios de Salud San Miguel, 2026”.

## 2. Inventario de contenidos

| Capítulo | Contenido | Tablas y gráficos | Uso en la plataforma |
|---|---|---|---|
| I-II | Introducción, aspectos generales | — | Portada, ficha técnica |
| III | Ubicación, superficie, clima, pisos altitudinales, cuencas | Tabla 1, Mapas 1-4 | Territorio: tarjetas textuales, gráfico de altitud, mapa IGN |
| IV | Dinámica poblacional, curso de vida, pirámide, población distrital, SIS | Cuadros 1-3, Gráfico 1, Tabla 2 | Demografía: series, pirámide, filtros año/curso/distrito |
| V.1-V.3 | Determinantes estructurales, intermedios y psicosociales | Tablas 3-14 | Determinantes: ranking, mapa de calor, coropletas |
| V.4 | Sistema de salud: EE. SS., FON, referencias, ambulancias, RR. HH., equipamiento, infraestructura, medicamentos, residuos, TIC | Cuadros 4-31, Gráfico 2 | Servicios: 14 visualizaciones |
| VI.1 | Morbilidad general, por curso de vida, por distrito; vigilancia | Cuadros 32-38, Gráfico 3 | Epidemiología: causas por sexo, Pareto, distritos |
| VI.2 | Mortalidad general, por curso de vida, por distrito; materna y perinatal | Cuadros 39-46, Tabla 15 | Epidemiología: causas, distritos, materna/perinatal (Tabla 15 solo como total) |
| VII | Vinculación con PDRC 2033, PEI 2023-2027 y prioridades del MINSA | Cuadro 46 (bis) | Priorización: tabla filtrable |
| VIII | Gradientes de desigualdad por grupo social | Gráficos 4-14, Mapas 5-6 | Desigualdades: barras por año y series 2023-2025 |
| IX-XI | Líneas de acción, conclusiones, recomendaciones | Cuadro 48 | Priorización: fichas y texto literal |

**Datos extraídos:**
- 51 tablas públicas con unas 920 filas.
- 11 gradientes.
- 4 conclusiones, 5 recomendaciones, 10 problemas priorizados y 32 siglas.
- Datos geográficos adicionales: 13 límites distritales y 47 establecimientos (IGN).

## 3. Evaluación de calidad de los datos

**Los cuadros son internamente consistentes.** Las pruebas automáticas (`npm test`) confirman:
- La suma distrital de la población coincide con los totales provinciales (44 692, 44 219 y 43 651) y con el Cuadro 2.
- En todos los cuadros de morbilidad y mortalidad, N = femenino + masculino, y las filas suman el total.
- Los cursos de vida suman 137 266 atenciones y 204 defunciones.
- Los cuadros 4, 28, 29 y 31 suman 48 establecimientos.

**Las diferencias están en el texto narrativo o en los títulos.** Hay que validarlas antes de difundir; la plataforma siempre muestra la cifra del cuadro:

1. **Cuadro 32:** el texto da 38 627 atenciones como total, pero esa cifra corresponde a las IRA. El total es 137 266.
2. **Cuadro 39:** el texto dice 86,5 % de “resto de enfermedades”; el cuadro dice 24,5 %.
3. **Defunciones:** 200 en el Cuadro 1 (ORE) frente a 204 en los Cuadros 39 y 45 (SINADEF).
4. **Nacimientos:** 326, 314 y 307 en el Cuadro 1, frente a 660, 740 y 795 nacidos vivos en el Cuadro 46. Son fuentes distintas.
5. **Categorías de EE. SS.:** 32/10/5/1 en el texto y el Cuadro 5, frente a 34/8/5/1 en el Cuadro 30.
6. **Cuadro 27 (Unión Agua Blanca):** suma 46 equipos; el texto dice 73. El Cuadro 18 (El Prado) repite las filas del Cuadro 16 (Calquis).
7. **Analfabetismo (Tabla 4):**
   - El texto dice que Llapa y Calquis tienen el mayor valor; la tabla da el máximo a San Miguel (19,0 %).
   - El texto dice “1 de cada 2” para un 12,7 %.
8. **Títulos con año distinto a la fuente:** Tablas 5 y 7 (dicen 2025, la fuente es de 2017) y Cuadro 1 (dice “región Cajamarca”).
9. **Escalas y valores atípicos:**
   - El IDE se expresa como “%”, aunque es un índice de 0 a 1.
   - La población emigrante supera el 100 % en cinco distritos.
10. **Gráfico 13:** el título dice “vs analfabetismo”, pero el gráfico usa pobreza monetaria.
11. **Numeración:** hay dos “Cuadro 46”, falta el Cuadro 47, y una referencia cruzada a un “Cuadro 18” es errónea.
12. **Problemas priorizados:** el texto dice “once” y enumera diez.
13. **Unidades:** los gráficos de VIH y diabetes no indican la unidad.
14. **Datos desactualizados:** los determinantes son de 2017.

### Datos geográficos (fuente adicional)

- La capa del IGN tiene 46 establecimientos MINSA en la provincia. Faltan el P.S. Gordillos (Calquis) y el P.S. Chucllapampa (Tongod), que el ASIS menciona.
- **3 coordenadas caen fuera de su distrito:** Las Pencas y Quinden Bajo (El Prado) y Quebrada Honda (San Silvestre de Cochán). En el mapa se marcan “a revisar”.

## 4. Privacidad

El ASIS trae solo datos agregados: no hay nombres, DNI, direcciones ni teléfonos de pacientes. Aun así, la versión pública:

- **excluye** la descripción del caso de muerte materna de 2024 (pág. 70: localidad, establecimiento, edad e historia obstétrica);
- **publica solo el total provincial** de la Tabla 15 (muertes perinatales por distrito, con 1 o 2 casos);
- **no desagrega por sexo** los Cuadros 40 a 42 (7, 1 y 4 defunciones);
- **no publica el PDF ni el DOC** hasta que exista una versión autorizada, porque incluyen el caso materno;
- **descarta** los campos director y teléfono de la capa del IGN.

El build se detiene si encuentra estos datos (`scripts/verificar-build.mjs`).

## 5. Organización web propuesta (implementada)

| Módulo | Ruta |
|---|---|
| A. Inicio / dashboard | `/2025/` |
| B. Territorio | `/2025/territorio/` |
| C. Demografía | `/2025/demografia/` |
| D. Epidemiología | `/2025/epidemiologia/` |
| E. Determinantes | `/2025/determinantes/` |
| F. Servicios | `/2025/servicios/` |
| G. Desigualdades | `/2025/desigualdades/` |
| G. Priorización | `/2025/priorizacion/` |
| Fichas distritales (13 páginas) | `/2025/distritos/<distrito>/` |
| H. Biblioteca | `/2025/biblioteca/` |

## 6. Oportunidades de mejora (para la Oficina de Epidemiología)

1. Corregir las diferencias texto-cuadro de la sección 3 antes de la versión de difusión.
2. Publicar una versión del PDF sin el detalle del caso materno, para habilitar la descarga del documento.
3. Entregar en tabla las cifras de los mapas distritales del capítulo VIII y los flujogramas (Cuadros 7 a 9), para hacerlos interactivos.
4. Indicar la unidad de los gradientes de VIH y diabetes, y los puntos de corte de los grupos sociales.
5. Validar con Estadística las 3 coordenadas marcadas y los 2 establecimientos sin georreferencia.
6. Para próximas ediciones, entregar las tablas en Excel o CSV además del documento.
