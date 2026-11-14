# AnalogOS Landing — reglas para Claude Code

Lee primero `HANDOFF.md` (estado completo y decisiones). Este repo es **solo la landing**; la app/demo es otro producto (https://analogos.vercel.app/, repo privado Esteban12-hori/AnalogOS). No trabajar la demo.

## Reglas
- Cada push a `main` se despliega solo en Vercel (proyecto `analogos-landing`). Para cambios grandes usar una rama → preview de Vercel → revisar → fast-forward a `main`.
- `index.html` es una plantilla de Claude Design (formato `.dc.html`, runtime `support.js`): textos en `I18N = { en: {...}, es: {...} }`, datos de plantilla con `{{ }}` y `<sc-for>`. Editar con reemplazos exactos (Python/sed), no reescribir el archivo entero.
- Sin paso de build: los componentes de 21st.dev se portan a **JS plano** en archivos sueltos (`liquid-nav.js`, `halftone-nebula.js`, `same-scale.js`, `sectors.js`) y se montan en `componentDidMount`, destruyéndose en `componentWillUnmount`.
- Datos científicos: solo los de `science-screening-v2` del repo oficial (ver HANDOFF §4). No inventar cifras. Marcar hipótesis como tales.
- Nunca credenciales en archivos ni en commits (Earthdata/Copernicus circularon por chat: deben rotarse).
- Paleta: navy `#02070A`, azul `#0297DE`, azul claro `#7FC8EF`, naranja `#FC734D`, texto `#F2F4F5`. Inglés principal + toggle EN|ES: todo texto nuevo va en ambos idiomas.
- Respetar `prefers-reduced-motion` y revisar a 375 px (habrá un QR para celulares).
