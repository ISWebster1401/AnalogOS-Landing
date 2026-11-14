# AnalogOS — Casos de uso (investigación, 14 nov 2026)

Pregunta que resuelve AnalogOS: *"Necesito probar una tecnología para una misión espacial. ¿Qué lugares terrestres reproducen las condiciones relevantes para esa prueba, qué evidencia lo sostiene y qué debo comprobar antes de organizar una campaña?"*

Cada caso indica: quién lo hace hoy, qué condición del terreno importa y qué haría AnalogOS. Los textos están parafraseados; las fuentes van al final de cada caso.

## 1. Movilidad y autonomía de rovers (perfil P0 actual)
- **Hoy:** NASA probó en marzo de 2026 el prototipo ERNEST cerca de Plaster City (desierto de Colorado, California): ~26 km en 37 h de conducción, sobre pendientes, suelo suelto y campos de rocas, para afinar autonomía, deslizamiento de ruedas y percepción. ESA (StarTiger "Seeker", 2012) hizo un recorrido autónomo de 5,1 km en Atacama.
- **Terreno:** pendiente, rugosidad, relieve local, suelo expuesto, variedad de iluminación.
- **AnalogOS:** el perfil Mars Rover Screening v2 ya cubre este caso (pendiente, rugosidad, relieve, suelo desnudo, aridez).
- Fuentes: sciencetimes.com (ERNEST, jul 2026); esa.int "ESA tests self-steering rover in 'Mars' desert".

## 2. Navegación aérea (drones/helicópteros) sobre terreno con poca textura
- **Hoy:** JPL voló drones en Death Valley y en las dunas Dumont (Mojave) para probar software de navegación sobre dunas sin rasgos, el tipo de terreno que complicó a Ingenuity en sus últimos vuelos. Death Valley se usa como análogo desde la preparación de Viking.
- **Terreno:** dunas homogéneas, laderas rocosas para aterrizaje seguro.
- **AnalogOS:** nuevo perfil "baja textura visual" (dunas, rugosidad muy baja, albedo uniforme).
- Fuentes: nasa.gov "NASA Tests Drones in Death Valley…"; marsdaily.com.

## 3. Perforación y detección de vida (astrobiología)
- **Hoy:** NASA ARADS (Ames) probó en Atacama un taladro de 2 m, un brazo de transferencia y los instrumentos SOLID y WCL, sobre todo en la Estación Yungay. **ARADS también evaluó Salar Grande y María Elena como sitios candidatos** — los mismos nombres que aparecen en los datos de AnalogOS.
- **Terreno:** hiperaridez, suelos oxidantes, costras salinas, alta radiación UV.
- **AnalogOS:** perfil de perforación (litología SERNAGEOMIN, salares, aridez). Hoy marcado "pronto" en la landing.
- Fuentes: astrobiology.nasa.gov "NASA Tests Life-Detection Drill in the Atacama"; hjkc.de (traducción del comunicado NASA); space.com (KREX-2).

## 4. Operaciones científicas remotas / teleoperación
- **Hoy:** ESA SAFER (2013, rover "Bridget" en Atacama, operado desde Harwell, cada día = 2 soles) y ExoFiT (prototipo de Rosalind Franklin en Atacama, operado desde el Reino Unido, con perforación de rocas antiguas). Antes del SAFER el equipo recorrió varios sitios con un geólogo chileno para elegir dónde soltar el rover.
- **Terreno:** afloramientos con historia geológica, sitios de "aterrizaje" representativos, comunicación limitada.
- **AnalogOS:** acelera justo el paso de reconocimiento previo ("qué sitio elegir y por qué").
- Fuentes: esa.int "Desert trial for ESA Mars rover"; esa.int "Fit for Mars"; skyatnightmagazine.com.

## 5. Entrenamiento geológico de astronautas
- **Hoy:** ESA PANGAEA (desde 2016) entrena a astronautas de ESA, NASA, JAXA y Roscosmos en Dolomitas, cráter de Ries, Lanzarote (volcánico, tubos de lava) y Lofoten (anortositas análogas a las tierras altas lunares).
- **Terreno:** diversidad geológica específica (impacto, volcanismo, sedimentos, anortosita).
- **AnalogOS:** perfil "geología/entrenamiento" basado en litología y morfología.
- Fuentes: esa.int "What is PANGAEA"; unipd.it (paper PANGAEA); IAC-24 abstract.

## 6. Caminatas lunares, trajes y rovers presurizados (Artemis)
- **Hoy:** NASA JETT3 (oct 2022) y JETT5 (may 2024) simularon caminatas lunares en el campo volcánico de San Francisco (Arizona), incluso de noche para imitar la iluminación del polo sur lunar; D-RATS probó un rover presurizado con JAXA. NASA evaluó varios campos volcánicos (Arizona, Potrillo en Nuevo México, Islandia, Nevada) para entrenamiento Artemis.
- **Terreno:** campos volcánicos, cráteres, fallas; condiciones de iluminación.
- **AnalogOS:** perfil "Luna / Artemis" (LOLA/Diviner como referencia) — está en "Lo que viene".
- Fuentes: ntrs.nasa.gov (JETT3; Volcanic Field Sites for Artemis); usgs.gov (JETT5); nasa.gov (D-RATS).

## 7. Selección de sitios (el problema de fondo)
- **Hoy:** existen catálogos — el Catalogue of Planetary Analogues de ESA (estudio CAFE, Open University), con información práctica (infraestructura, requisitos legales, contacto local), y la base USGS "Known Terrestrial Analog Sites". La literatura señala que no hay criterios claros y compartidos para evaluar análogos.
- **AnalogOS:** pasa de "catálogo de lugares" a **ranking por prueba concreta**, con evidencia, limitaciones y qué verificar.
- Fuentes: esa.int "Cataloguing otherworldly landscapes on Earth"; sciencebase.gov (USGS); Cambridge (Preston & Dartnell, habitabilidad).

## Mensajes para el pitch
- Las pruebas en análogos **existen y son caras**: NASA y ESA viajan a desiertos para cada campaña.
- **ARADS ya comparó Yungay, Salar Grande y María Elena** — hoy esa comparación se hace a mano; AnalogOS la vuelve reproducible.
- Los catálogos dicen *dónde hay* análogos; AnalogOS dice *cuál sirve para tu prueba* y qué falta comprobar.
- Primer usuario: responsable de campañas de robótica planetaria (universidad, laboratorio o empresa de rovers). Validar con 3–5 responsables reales.
