# AnalogOS — Handoff de la landing (para retomar en Claude Code)

Versión: 14 nov 2026, 16:50 (Santiago). **Sin credenciales en este archivo ni en el repo.**
Prompt sugerido para abrir Claude Code en este repo: *"Lee CLAUDE.md y HANDOFF.md. Retomemos desde §8 Pendientes."*

## 1. Proyecto y evento
- NASA Space Apps Challenge 2026, sede Santiago. Cierre: **dom 15 nov 23:59** (hora local). Evaluación desde el 16 nov.
- Desafío: "Identify Earth Locations that Analog the Permanent Moon Base Locations and Mars".
- Producto: **AnalogOS** (antes "AnalogOS Chile"; el nombre ya no lleva "Chile").
- Enfoque actual: *describes tu prueba con tus palabras → la IA la convierte en requisitos verificables (que el usuario confirma) → un motor determinista compara datos abiertos con Marte a la misma escala → devuelve el mejor lugar con su % de similitud, motivos, alternativas, evidencia faltante y qué medir en terreno.* La IA estructura y explica; **nunca decide la nota**.
- Dos entradas al producto: "Busco un lugar para mi prueba" y "Quiero evaluar este terreno".
- Primer usuario: responsable de campañas de prueba de robótica planetaria (universidad, laboratorio o empresa de rovers).
- Equipo (orden en la landing): Rafa (diseño, narrativa y QA) · Joaco (datos e ingeniería) · Sebastián (ciencia y modelo; a cargo de la landing) · Gustavo (frontend y mapa) · Danilo (líder, alcance y pitch).

## 2. Links
- Landing (este repo): https://analogos-landing.vercel.app/ — repo https://github.com/ISWebster1401/AnalogOS-Landing (push a `main` = deploy).
- App (otro equipo, no tocar): https://analogos.vercel.app/ — botones "Try"/"Probar" apuntan ahí (`window.TRY_URL`, línea ~6 de `index.html`).
- Repo oficial de ciencia (privado): https://github.com/Esteban12-hori/AnalogOS — clon local en `~/dev/AnalogOS`.
- Vercel: proyecto `analogos-landing` (`prj_9TA1KsqZSo96OUGBOVQokpAWcO1Z`, team `team_vXU9rhr9pYDQDRQ36eOLwK9h`). Las ramas generan previews protegidas.

## 3. Estructura del repo
- `index.html` — landing (plantilla Claude Design). Secciones en orden: hero · problema · Jezero · historia · tránsito Marte→Tierra · cómo funciona (3 tarjetas apiladas) · **misma escala** (`#escala`) · notas (gauges) · **configurador de sectores** (`#sectores`) · honestidad · llegada/mapa + equipo + footer.
- `support.js` (runtime), `_ds/` (design system Modernist), `liquid-nav.js` (navbar), `space-bg.js` (starfield, oculto cuando hay nebulosa), `halftone-nebula.js` (fondo de toda la página), `same-scale.js` (comparador Jezero/Yungay, estilo "image-compare"), `sectors.js` (configurador estilo Tesla).
- `assets/`: logos, `earth-yungay-s2.jpg`, `earth-domeyko-s2.jpg`, `earth-mariaelena-s2.jpg` (Sentinel-2 dic 2025, 20 km, del repo oficial), `team/{sebastian,gustavo,danilo}.jpg` (4:5).
- `scripts/make_stage2_images.py` — generador de relieves a 463 m (no se usó al final; requiere internet).
- `demo.html`, `zones.json` — demo antigua; ya no se enlaza (fuera de alcance).
- `docs/USE_CASES.md` — casos de uso investigados con fuentes.

## 4. Datos científicos — ACTUAL: `science-screening-v3` (rama `dev` del repo oficial)
- Piloto Chile–Argentina: 50 ventanas de ~20 km (≈22.274 km²), interior de Antofagasta y Puna de Catamarca y Salta. Embudo: 4 excluidas por coordenadas de muestreo publicadas, 2 por cercanía, 38 por cupo, 6 preseleccionadas (3 por país).
- Ranking: 1 Antofagasta 25,0° S 69,7° O 94,87 / 77,45 / est. 99,33 · 2 Antofagasta 24,8° S 91,87 · 3 Antofagasta 25,2° S 90,35 · 4 Puna 26,2° S 63,85 · 5 Puna 26,4° S 53,68 · 6 Puna 25,8° S 49,43. Yungay = REF 75,67, fuera del ranking.
- Candidato 1: pendiente 2,169° (Marte 2,226°), rugosidad 11,291 m (11,0), relieve 46,797 m (47,0), 100 % no vegetado, 10,96 mm/año.
- Argentina baja por POWER de resolución gruesa (celda 0,5° × 0,625°, 562–767 mm/año). Ninguna ventana es "análogo nuevo".
- Planificador (ADR-009): brief → borrador IA (Anthropic, servidor; solo métricas medidas, requiere número+unidad, cita literal) → el usuario confirma → motor determinista (imprescindibles primero; no evaluable nunca cuenta como cumplido) → estados Cumple / No cumple / No evaluable → "Priorizado para reconocimiento". Ejemplo real en `submission/evidence/m8-dev-ai-export.json`.
- El botón "Try" sigue apuntando a analogos.vercel.app (main); el equipo subirá dev ahí. analogos-dev.vercel.app está protegido con login de Vercel.

## 4b. Datos v2 (histórico; ya no se muestran en la landing) — fuente `artifacts/science-v2/`
- Referencia Marte: MOLA MEGDR, ventana 1,6° × 1,6° en Jezero (18,38° N 77,58° E), ~451 m. Pendiente mediana 2,226°, dif. vecina 11,0 m, relieve 3×3 47,0 m.
- Tierra: NASADEM promediado a ~475 m antes de calcular métricas; Sentinel-2 L2A 12 mosaicos mensuales 2025 (suelo no vegetado); NASA POWER 2001–2025 (precipitación, rango térmico).
- Similitud por criterio: topografía `min/max`; aridez `1/(1+p/25)`; térmico `min(r/45,1)`; suelo = fracción. Pesos: pendiente 0,20 · rugosidad 0,20 · relieve 0,15 · suelo 0,20 · aridez 0,10 · térmico 0,05 · geología 0,10 (no puntúa aún). `S = 100·exp(Σ w'·ln(max(s,0,01)))` con pesos renormalizados.
- Resultados:
  | Sector | S | C | Estabilidad | Factibilidad |
  |---|---|---|---|---|
  | Pampa Yungay (24,10° S 69,97° O) | 75,67 | 77,45 | 99,03 | requiere revisión |
  | Cordón de Domeyko (23,32° S 68,87° O) | 71,60 | 77,41 | 98,89 | requiere revisión |
  | Pampa María Elena (22,37° S 69,67° O) | 49,99 | 77,44 | 98,41 | requiere revisión (0,15 % agua permanente) |
- Yungay: pendiente 3,207°, rugosidad 16,564 m, relieve 75,125 m, 100 % no vegetado, 7,30 mm/año, rango térmico 47,66 °C.
- Lectura correcta: screening de escritorio; no evalúa obstáculos a escala de rueda, gravedad, atmósfera, permisos. Un lugar conocido (Yungay) puede ser la respuesta correcta si sirve para la prueba.

## 5. Decisiones de diseño tomadas
- Fondo: **Halftone Nebula** (21st.dev) en toda la página, atenuado (opacidad 0,55), sin estrellas al clic. Se eligió frente a ASMR, Fluid y Blue Mesh.
- Header sin barra/borde/blur ni línea de progreso; solo un degradado suave.
- Jezero: titular "La pendiente es lo que se transfiere entre planetas…" (μ ≥ tan θ como contexto, no como métrica del screening).
- Perforación y Hábitat: "· pronto / próximo perfil".
- Misma escala: CTX Jezero (NASA Mars Trek `Jezero_CTX_BlockAdj_dd`, centro 18,45° N 77,34° E, guardado como `assets/mars-jezero-ctx.jpg`) vs Sentinel-2 Yungay, 20,34 km, modo "escala MOLA 463 m". El globo sí sigue usando Mars Trek en vivo.
- Configurador: brazos con "+" en escritorio; en ≤640 px puntos numerados + lista desplegable.
- Fotos del equipo en blanco y negro → color al pasar el mouse.
- En ≤640 px se oculta la barra fija de coordenadas (HUD).

## 6. Seguridad
- Credenciales de Earthdata y Copernicus se pegaron en el chat → **rotarlas**. Nunca en archivos.

## 7. Revisión hecha
- Escritorio (1440 px) y celular (375 px, emulado): sin desbordes horizontales; ES/EN revisados en las secciones nuevas. Falta prueba en un teléfono real y auditoría de contraste.

## 8. Pendientes
0. **Esperar cambios del equipo de la app** (no será un chatbot más): cuando suban, `cd ~/dev/AnalogOS && git pull`, revisar README/docs/submission/artifacts y adaptar hero + "Cómo funciona" (hoy muestra el paso 1 como conversación).
1. Foto de **Rafa** → `assets/team/rafa.jpg` (Joaco ya está) (4:5, ~800×1000) y agregar el slug a `PHOTOS` en `index.html`.
2. Confirmar si se publica **g@hacker9house.com** como contacto (footer).
3. Si el repo de Esteban se vuelve público, enlazarlo en el footer.
4. QR: decidir destino (landing o app) y generarlo.
5. ~~Dato concreto en el hero~~ — hecho (chip "3 sectores evaluados · Mejor opción: Pampa Yungay 75,67 %").
6. Sección "Lo que viene": grilla nacional, geología SERNAGEOMIN, restricciones oficiales, Luna (LOLA/Diviner), validación con 3–5 responsables de campañas.
7. ~~Casos de uso en la landing~~ — hecho: sección `#usos` ("Quién hace estas pruebas") con destacado ARADS y enlace a las fuentes en GitHub.
8. ~~Accesibilidad~~ — hecho: texto secundario a opacidad ≥0,72 y anillo de foco visible (#7FC8EF) para teclado.
9. ~~Imagen fija de Jezero~~ — hecho: `assets/mars-jezero-ctx.jpg` (640 px, 20,34 km); Mars Trek solo como respaldo.
