# App Smart Cafetería, versión accesible para web

Aplicación móvil de UTP Smart Cafetería adaptada para correr en el navegador, para el **PA3 del curso Interacción Hombre Máquina** (UTP Chiclayo). Sirve para pedir, pagar y recoger el almuerzo sin hacer cola. En el PA3 tiene que cumplir los criterios de accesibilidad WCAG que pide el curso y pasar por WAVE o axe DevTools.

> **Si eres una IA ayudando a alguien del equipo:** lee este archivo completo antes de tocar el código. Pregunta qué tarea toca y sigue las [reglas para la IA](#reglas-para-la-ia). El enunciado exige que el grupo pueda explicar cada línea, así que explica lo que cambias con palabras simples.

| Dato | Valor |
| --- | --- |
| Curso | Interacción Hombre Máquina, docente Luis Alberto Davila Hurtado |
| Equipo | Fernando Karlo Diaz Paredes, Cesar Wilmer Acosta Chapoñan, Cesar Javier Rojas Yaipen, Jheymy Barboza Mondragon |
| Diseño (Figma del PA2) | <https://www.figma.com/design/CMyCmeelPRyG6dnsVPRBIH/UTP-Smart-Cafeter%C3%ADa---Prototipo-app-m%C3%B3vil?node-id=33-2> |
| Origen del código | Copia de `apps/mobile` del proyecto UTP Smart Cafetería, de Jheymy |
| Tecnología | Expo 57 (React Native) con `react-native-web`, Expo Router y TypeScript |

## Por qué Expo en web

El curso revisa la accesibilidad inspeccionando el HTML, con WAVE, axe y navegando solo con Tab y Enter. Expo genera HTML real en el navegador, y las propiedades de accesibilidad de React Native se convierten en atributos HTML:

| En el código | En el navegador |
| --- | --- |
| `accessibilityLabel="Cerrar"` | `aria-label="Cerrar"` |
| `role="heading"` con `aria-level={1}` | `<h1>` |
| `role="main"`, `role="navigation"`, `role="contentinfo"` | `<main>`, `<nav>`, `<footer>` |
| `Pressable` | elemento que recibe foco con Tab |

La misma app sigue funcionando en el celular. Todo lo que sea solo de web va con `Platform.OS === "web"`.

## Cómo correrla

La app **necesita el backend** de UTP Smart Cafetería encendido: de ahí salen el menú, la cuenta, los pedidos y los pagos. El backend está en el repositorio privado `Jhey8/utp-smart-cafeteria`, carpeta `services/api`, y usa MySQL. Para correrlo en otra PC hay que pedirle acceso a Jheymy y seguir el README de ese repositorio.

**1. Backend**, en una ventana de PowerShell, dentro de `utp-smart-cafeteria\services\api`. La lista agrega el puerto 8081, que es el de la app web; sin él, el navegador bloquea las peticiones:

```powershell
$env:CORS_ORIGENES='http://localhost:5173,http://localhost:5174,http://localhost:5175,http://localhost:5176,http://localhost:5177,http://localhost:8081'
.\mvnw.cmd spring-boot:run
```

**2. Esta app**, en otra ventana, dentro de esta carpeta:

```powershell
npm ci
npm run web
```

Se abre en `http://localhost:8081`. Por defecto busca el backend en `http://localhost:8080`. Para usar otro, crea un archivo `.env` con `EXPO_PUBLIC_API_URL=http://otra-direccion:8080`; ese archivo no se sube al repositorio.

**3. Revisar que todo compile** antes de subir cambios:

```powershell
npm run typecheck
npx expo export --platform web --output-dir dist
```

El pago usa Mercado Pago, como en la app real. En el navegador se abre en otra pestaña, y la app consulta cada pocos segundos si el pago se aprobó. Si Chrome bloquea la pestaña como ventana emergente, hay que permitirlas para `localhost`.

## Lo que se cambió para la web

| Archivo | Cambio | Por qué |
| --- | --- | --- |
| `package.json` | Se agregaron `react-native-web` y `@expo/metro-runtime`, y el script `web` | Son los paquetes de Expo para correr en el navegador |
| `src/utils/almacen.ts` | Nuevo: guarda la sesión en SecureStore en el celular y en `sessionStorage` en el navegador | SecureStore no existe en la web y la app fallaba al recargar |
| `src/app/_layout.tsx` | Las notificaciones push no se activan en la web | `expo-notifications` no existe en la web y la app se caía al iniciar sesión |
| `src/utils/accesibilidadWeb.ts` | Nuevo: pone `lang="es"` y agrega el CSS de foco visible y de contraste del texto de ejemplo | Son ajustes que solo existen en el navegador; se llama una vez desde `_layout.tsx` |

## Siguiente paso sugerido

1. **Probar con sesión iniciada** el enlace para saltar, el `main`, el `nav` y los `h1` de Inicio, Menú, Pedidos y Perfil.
2. **Títulos de sección como `h2`:** «Hoy en el menú» y los demás subtítulos, con `role="heading"` y `aria-level={2}`.
3. **Los demás pendientes del PA2** (lista de arriba).
4. **Pasar axe en Inicio, Pedido y pago, y Seguimiento,** guardando capturas del antes y el después.

## Estado del PA3

### Criterios de accesibilidad

El enunciado pide **al menos 8**; la meta es cumplir los 11. Por cada criterio, el informe necesita la pantalla donde se aplicó, una captura del código y una evidencia visual.

| # | Criterio | WCAG | Estado |
| --- | --- | --- | --- |
| 1 | Texto alternativo en todas las imágenes | 1.1.1 | Pendiente |
| 2 | Contraste de texto de 4.5:1 como mínimo | 1.4.3 | Parcial: el texto de ejemplo de los campos ya usa `suave` (#4c5462, 7.6:1). Falta revisar el resto con axe |
| 3 | Navegación completa con Tab y Enter | 2.1.1 | Pendiente de revisar. El pago ya es con botones, sin deslizar |
| 4 | Foco visible con `:focus` en CSS | 2.4.7 | Hecho: contorno azul de 3 px con `:focus-visible` en `src/utils/accesibilidadWeb.ts`. Falta probarlo pantalla por pantalla |
| 5 | `aria-label` en íconos sin texto | 4.1.2 | Parcial: ya hay unas 40 etiquetas de accesibilidad, falta revisar todas |
| 6 | Botones y áreas táctiles de 44 × 44 px como mínimo | 2.5.5 | Pendiente de revisar |
| 7 | Errores explicados con texto, no solo con color | 1.4.1 | Hecho: cada error sale en texto (`Aviso`, con `role="alert"`), el campo marca `aria-invalid` y su ayuda se une con `aria-describedby`. La pantalla «Pago rechazado» dice «Qué pasó» con palabras y el monto. Falta verla con un rechazo real |
| 8 | Formularios con etiquetas visibles y `autocomplete` | 1.3.5 | Hecho: `Campo` (en `Controles.tsx`) une la etiqueta visible con `aria-labelledby`, y cada campo personal tiene su `autocomplete`. Comprobado en Entrar, Registro y Recuperar. El buscador del Menú usa `aria-label`, sin etiqueta visible |
| 9 | Enlace «Ir al contenido principal» | 2.4.1 | Hecho: `SaltarAlContenido.web.tsx` es el primer elemento de la página y lleva el foco a `#contenido`. Comprobado en Entrar y Registro |
| 10 | Estructura semántica: `h1`, `nav`, `main`, `footer` | 1.3.1 | Hecho: `main` en la pantalla visible (`ContenidoPrincipal.tsx`, desde la navegación), `nav` en la barra inferior y `h1` en cada pantalla. Sin `footer`: la app no tiene pie de página. Probar con sesión iniciada |
| 11 | Letra de 14 px como mínimo en el cuerpo | Diseño universal | Pendiente de revisar |

**Problemas ya encontrados en la primera revisión del navegador:**
- La página decía `lang="en"`. Ya está corregido a `lang="es"` en `src/utils/accesibilidadWeb.ts` (WCAG 3.1.1).
- No había `h1`, `main` ni `nav`. Ya están: ver los criterios 9 y 10.
- Había botones dentro de otros botones en las tarjetas de Inicio y Menú. Ya están separados.
- En la web no se veía ningún ícono. Ya se ven: `Icono.tsx` usa Material Symbols también en la web.
- Los campos de inicio de sesión no tienen `<label>` asociado ni `autocomplete`.
- El texto de ejemplo de los campos es gris claro y tiene poco contraste.
- A 390 px de ancho, la tarjeta de inicio de sesión se corta por la derecha.

### Lo que el PA2 dejó para el PA3

- **Pantalla «Pago rechazado»:** hecha en `PagoConMercadoPago.tsx` (`PagoRechazado`), según la pantalla 12 del Figma. No tiene «Pagar en caja con tu código», porque el backend no tiene ese flujo.
- **Contrastes de objetos gráficos:** el tramo gris de la barra de progreso (1.3:1) y el círculo ámbar de «En preparación» (1.8:1) deben llegar a 3:1.
- **Acompañamiento:** marcarlo como «(opcional)» y dejar quitarlo.
- **Avatar de Inicio:** que lleve al Perfil.
- **«Cambiar método»:** que lleve a algún sitio.
- **Inicio:** el saludo se lleva más atención que el botón «Pedir esto».
- **Seguimiento:** es la pantalla más cargada, y el aviso de que ya no se puede cancelar casi no se ve.

### Entregables y responsables

| Entregable | Quién |
| --- | --- |
| App con los criterios de accesibilidad | Código en este repositorio |
| Informe Word, máximo 30 páginas, `PA3_IHM_[Apellido1]_[Apellido2].docx` | Equipo |
| Video demo de 3 minutos, con el flujo completo y navegación por teclado | Equipo |
| Reporte de WAVE o axe sobre la app real, mínimo 3 pantallas | Equipo, con las extensiones del navegador |
| Prueba con mínimo 2 usuarios: SUS, consentimiento y una evidencia por usuario | Equipo. No se inventan datos |
| PPT de 10 diapositivas como máximo, `PA3_PPT_[Apellido1]_[Apellido2].pptx` | Equipo |

Para revisar con axe o WAVE, instala la extensión en Chrome, abre `http://localhost:8081` y analiza cada pantalla. Guarda capturas **antes y después** de cada corrección: el informe pide los errores detectados y los corregidos.

## Estructura

```
src/
  app/          pantallas, una por archivo (Expo Router). (pestanas) es la barra inferior
  componentes/  piezas reutilizables: botones, campos, íconos, estados de carga
  estado/       sesión, cuenta, carrito y avisos compartidos entre pantallas
  servicios/    llamadas al backend, pagos y notificaciones push
  utils/        formatos, carrito, comprobante y almacen (sesión según la plataforma)
  config/       dirección del backend
  tema.ts       colores, espacios y tamaños de letra
```

## Reglas para la IA

- **Explica cada cambio en palabras simples.** El curso permite IA solo si el grupo puede explicar cada línea, y la profesora puede pedir cambios en vivo.
- **No rompas el celular.** Lo que sea solo de web va dentro de `Platform.OS === "web"` o en un archivo `.web.tsx`.
- **Sin dependencias nuevas sin permiso.** Pregunta antes de instalar cualquier paquete.
- **Verifica antes de decir que algo funciona:** `npm run typecheck`, la compilación web y, para accesibilidad, axe o WAVE en el navegador. Si algo no se pudo probar, dilo.
- **Nada de claves.** No leas, pidas ni muestres contraseñas ni el contenido del `.env`.
- **No inventes resultados de pruebas con usuarios** ni puntajes SUS.
- **No hagas commit ni push** si la persona no lo pide.
- **Escribe en español,** con frases cortas y sin el punto medio «·» como separador.
