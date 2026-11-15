# The Crew

App y web para los embajadores de marca de Issaline, los workers de **The Crew**: formación, comunicación y un espacio propio para cada worker.

Una sola base de código para iOS, Android y web, hecha con [Expo](https://expo.dev) y Expo Router.

## Fase 1: pedidos con aprobación de marketing

La app pasa a ser la plataforma de relación de Issaline con su comunidad. Hay dos tipos de acceso:

- **Makers** (embajadores The Crew, Singular Workers y makers de eventos como Territorio Makers) entran en su panel: el de siempre (Inicio, Tablón, Mi taller, Escuela, The Crew) más **Catálogo** y **Pedidos**.
- **Marketing** (y almacén) entra en el **panel de gestión** en `/admin`: bandeja de pedidos, alta manual de pedidos, usuarios y cuenta.

### Flujo de un pedido

1. El maker elige prendas y tallas en el catálogo y envía la solicitud. Marketing recibe un email.
2. Marketing la ve en la bandeja (**Por aprobar**) y la aprueba o la rechaza con un motivo (el maker recibe un email).
3. Al **lanzarla a almacén**, se envía un email a almacén (con copia a marketing) con artículos, tallas y dirección.
4. Cuando sale, marketing la marca como **enviada** con el número de seguimiento. El maker recibe un email.
5. El maker ve en todo momento **Pendiente → Aprobado → Enviado**.

Marketing también puede **dar de alta pedidos a mano** (los que llegan por email o teléfono) y **dar de alta makers**, con una contraseña temporal para que entren.

Reglas: los embajadores tienen un pedido mensual (uno al mes; para más, una reposición). Sin dirección de envío no se puede pedir.

### Qué queda para las fases 2 y 3

El modelo de datos ya distingue los tres perfiles, el origen del alta, el consentimiento RGPD y el evento de procedencia, y los pedidos ya admiten los tipos *welcome pack*, *muestras* y *regalo*. Falta:

- Fase 2: registro abierto de Singular Workers y makers de eventos, con RGPD.
- Fase 3: campañas, muestras y sorteos.

Inicio, Tablón, Escuela, The Crew y mensajes siguen con datos de ejemplo (`src/data/ejemplo.ts`).

## Arrancar en local

Hace falta Node 20 o superior.

```bash
# 1. API (puerto 4000) con datos de ejemplo
cd server
npm install
npm run seed        # makers, marketing, catálogo y pedidos de prueba
npm run dev

# 2. App (en otra terminal)
cd ..
npm install
npm run web         # en el navegador
npm start           # en el móvil con Expo Go; antes: EXPO_PUBLIC_API_URL=http://<IP de tu ordenador>:4000
```

Cuentas de prueba (contraseña `thecrew2026`):

| Email | Qué ve |
| --- | --- |
| `marketing@issaline.com` | Panel de gestión |
| `josema@ejemplo.com` | Embajador, con un pedido mensual pendiente |
| `paula@ejemplo.com` | Embajadora, con un pedido en almacén |
| `joel@ejemplo.com` | Singular Worker |
| `alvaro@ejemplo.com` | Maker de Territorio Makers |

Pruebas de la API: `cd server && npm test`.

## Backend

`server/` es una API pequeña en **Node + Express con PostgreSQL**.

- En producción usa la base de datos de `NETLIFY_DATABASE_URL` (Netlify DB, que es Neon) o `DATABASE_URL` (cualquier Postgres: Neon, Supabase, Render...).
- En local y en las pruebas, sin URL, usa **PGlite**: un Postgres completo que corre dentro de Node, así que no hay que instalar nada. Guarda los datos en `server/data/pglite`.
- Sesiones con token (las contraseñas se guardan con scrypt). El token se guarda en el llavero del móvil (`expo-secure-store`) o en el navegador.
- Emails por SMTP (`nodemailer`). Sin `SMTP_HOST`, los emails solo se guardan en la tabla `emails` y se muestran en consola.
- Configuración en `server/.env.example`.

## Publicar en Netlify

`netlify.toml` publica la web y la API juntas: la web exportada en `dist/` y la API como función de Netlify (`netlify/functions/api.mjs`) en `/api/*`.

1. En Netlify: *Add new site → Import an existing project → GitHub* y eliges este repositorio.
2. Crea la base de datos: en el panel del sitio, *Extensions → Neon* (Netlify DB), o con `npx netlify db init`. Netlify añade sola la variable `NETLIFY_DATABASE_URL`. Las tablas se crean solas al primer uso.
3. En *Site configuration → Environment variables* añade:
   - `ADMIN_EMAIL` y `ADMIN_PASSWORD`: el primer usuario de marketing. Con él se dan de alta los demás.
   - `EMAIL_MARKETING`, `EMAIL_ALMACEN` y `EMAIL_FROM`: a quién llegan los avisos y desde qué dirección salen.
   - `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER` y `SMTP_PASS`: el servidor de correo (el de Issaline, o un servicio como Brevo o Resend con SMTP).
   - Opcional: `DATOS_EJEMPLO=1` para cargar los makers, el catálogo y los pedidos de ejemplo si la base está vacía.
4. *Deploys → Trigger deploy*.

Las apps de móvil se generan con EAS apuntando a la API con `EXPO_PUBLIC_API_URL=https://<tu-sitio>.netlify.app`.

### Demo sin servidor

Con `EXPO_PUBLIC_DEMO=1` en las variables de entorno del sitio, la web funciona entera en el navegador, sin API ni base de datos (`src/lib/demo-api.ts`). Usa los mismos datos de ejemplo y reglas, y en la pantalla de acceso se entra con un clic como cada perfil. Cada navegador guarda su propia copia de los datos y no se envían emails. Sirve para enseñar la app: si quieres tenerla aparte de la versión real, crea un segundo sitio de Netlify desde el mismo repositorio con esa variable.

### Otro hosting

También funciona como un servidor Node normal, que sirve la API y la web en el mismo dominio:

```bash
npx expo export -p web
cd server && npm install && DATABASE_URL=postgres://... npm start
```

## Estructura

```
server/             API: src/app.js (rutas), db.js (esquema), seed.js (datos de prueba), netlify.js (función)
netlify/functions/  la API publicada como función de Netlify
src/
  app/              rutas (Expo Router)
    login.tsx       acceso
    (tabs)/         panel del maker: inicio, catálogo, pedidos, tablón, mi taller
    pedido/         detalle de un pedido y revisión antes de enviarlo
    admin/          panel de gestión de marketing
  components/       piezas de interfaz con la marca (ui, pedidos, catálogo)
  lib/              cliente de la API y sesión
  state/            sesión, carrito y estado del prototipo
  constants/theme.ts colores, fuentes y espaciado de Issaline
  data/ejemplo.ts   contenido de ejemplo de las pantallas que aún no usan la API
```

## Marca

- Verde Issaline `#009353` como único acento, `#272727` en titulares y `#F0F0F1` en fondos de tarjeta.
- Barlow Condensed y Barlow sustituyen a GT America Condensed hasta confirmar que la licencia de Issaline cubre su uso en apps.
- Los bloques de color son huecos donde irá la fotografía real de cada worker.

## Siguientes pasos

1. Fase 2: registro abierto de Singular Workers y makers de eventos con RGPD.
2. Fase 3: campañas, muestras y sorteos.
3. Pasar Inicio, Tablón, Escuela y mensajes a la API, y gestionar el catálogo desde el panel.
4. Perfiles publicados en thecrew.issaline.com.
4. Idiomas: español, inglés, italiano y portugués.
