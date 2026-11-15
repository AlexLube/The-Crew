import serverless from 'serverless-http';

import { crearApp } from './app.js';
import { prepararDB } from './arranque.js';

/**
 * La API de The Crew como función de Netlify (netlify/functions/api.mjs).
 * netlify.toml redirige /api/* aquí. La base de datos es la de
 * NETLIFY_DATABASE_URL (Netlify DB) o DATABASE_URL.
 */
let manejador;

export async function handler(event, context) {
  if (!manejador) {
    const db = await prepararDB();
    manejador = serverless(crearApp({ db }));
  }
  return manejador(event, context);
}
