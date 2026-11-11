# The Crew

App y web para los embajadores de marca de Issaline, los workers de **The Crew**: formación, comunicación y un espacio propio para cada worker.

Una sola base de código para iOS, Android y web, hecha con [Expo](https://expo.dev) y Expo Router.

## Qué hay ahora

Esta es la base de la fase 1, con datos de ejemplo en memoria (sin backend todavía):

| Pestaña | Qué hace |
| --- | --- |
| Inicio | Campaña activa, siguiente curso, novedades y próximo evento |
| Escuela | Itinerarios de formación con progreso por lección e insignias |
| Tablón | Noticias, briefs de campaña y confirmación de asistencia |
| The Crew | Directorio de workers filtrable por oficio |
| Mi taller | Perfil, galería, equipación e insignias, con opción de publicar en la web |

Además: detalle de curso, detalle de campaña con subida de fotos y vídeos, y mensajes con el equipo.

## Arrancar

```bash
npm install
npm run web       # en el navegador
npm start         # escanea el QR con Expo Go en el móvil
```

## Estructura

```
src/
  app/              rutas (Expo Router): pestañas en (tabs)/, curso/, campana/, mensajes
  components/ui.tsx piezas de interfaz con la marca
  constants/theme.ts colores, fuentes y espaciado de Issaline
  data/ejemplo.ts   datos de ejemplo que sustituirá el backend
  state/            estado del prototipo (React context)
```

## Marca

- Verde Issaline `#009353` como único acento, `#272727` en titulares y `#F0F0F1` en fondos de tarjeta.
- Barlow Condensed y Barlow sustituyen a GT America Condensed hasta confirmar que la licencia de Issaline cubre su uso en apps.
- Los bloques de color son huecos donde irá la fotografía real de cada worker.

## Siguientes pasos

1. Backend (usuarios, contenidos, archivos y notificaciones) y acceso con email.
2. Panel web de gestión para el equipo de Issaline.
3. Perfiles publicados en thecrew.issaline.com.
4. Idiomas: español, inglés, italiano y portugués.
