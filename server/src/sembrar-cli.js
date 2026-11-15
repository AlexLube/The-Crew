import { abrirDB } from './db.js';
import { sembrar } from './seed.js';

// npm run seed: carga los datos de ejemplo si la base de datos está vacía.
const db = await abrirDB();
const hecho = await sembrar(db);
console.log(hecho ? 'Datos de ejemplo cargados. Contraseña de todas las cuentas: thecrew2026' : 'La base de datos ya tenía datos; no se ha tocado.');
await db.cerrar();
