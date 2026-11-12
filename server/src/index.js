import express from 'express';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

import { hashPassword } from './auth.js';
import { crearApp } from './app.js';
import { abrirDB } from './db.js';

const db = abrirDB();

// Primer usuario de marketing a partir de las variables de entorno,
// para poder entrar en un despliegue nuevo sin datos de ejemplo.
const { ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
if (ADMIN_EMAIL && ADMIN_PASSWORD && !db.prepare("SELECT 1 FROM usuarios WHERE rol = 'marketing'").get()) {
  db.prepare("INSERT INTO usuarios (email, password_hash, nombre, rol) VALUES (?, ?, 'Marketing Issaline', 'marketing')").run(
    ADMIN_EMAIL.toLowerCase(),
    hashPassword(ADMIN_PASSWORD),
  );
  console.log(`Creado el usuario de marketing ${ADMIN_EMAIL}`);
}

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
