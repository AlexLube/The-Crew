import express from 'express';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

import { crearApp } from './app.js';
import { prepararDB } from './arranque.js';

const db = await prepararDB();
const app = crearApp({ db });

// Si existe la web exportada (npx expo export -p web), la API también la sirve.
const web = resolve(process.env.WEB_DIR ?? '../dist');
if (existsSync(web)) {
  app.use(express.static(web));
  app.get(/^(?!\/api\/).*/, (_req, res) => res.sendFile(resolve(web, 'index.html')));
  console.log(`Sirviendo la web desde ${web}`);
}

const puerto = Number(process.env.PORT ?? 4000);
app.listen(puerto, () => console.log(`API de The Crew en http://localhost:${puerto}`));
