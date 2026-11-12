import nodemailer from 'nodemailer';

/**
 * Envío de emails. Con SMTP_HOST configurado se envían de verdad;
 * sin él (desarrollo, pruebas) solo se registran en la tabla emails
 * y en la consola, para que el flujo funcione igual.
 */
export function crearCorreo(db, env = process.env) {
  const transporte = env.SMTP_HOST
    ? nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: Number(env.SMTP_PORT ?? 587),
        secure: env.SMTP_SECURE === 'true',
        auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
      })
    : null;
  const de = env.EMAIL_FROM ?? 'The Crew <thecrew@issaline.com>';
  const registrar = db.prepare('INSERT INTO emails (para, asunto, texto, pedido_id, estado, error) VALUES (?, ?, ?, ?, ?, ?)');

  return {
    destinos: {
      marketing: env.EMAIL_MARKETING ?? 'marketing@issaline.com',
      almacen: env.EMAIL_ALMACEN ?? 'almacen@issaline.com',
    },
    /** No lanza nunca: un fallo de correo no debe bloquear el pedido. */
    async enviar({ para, asunto, texto, pedidoId = null }) {
      const lista = [para].flat().filter(Boolean).join(', ');
      if (!lista) return;
      if (!transporte) {
        registrar.run(lista, asunto, texto, pedidoId, 'solo_registro', null);
        if (env.NODE_ENV !== 'test') console.log(`[email] ${lista} · ${asunto}`);
        return;
      }
      try {
        await transporte.sendMail({ from: de, to: lista, subject: asunto, text: texto });
        registrar.run(lista, asunto, texto, pedidoId, 'enviado', null);
      } catch (e) {
        registrar.run(lista, asunto, texto, pedidoId, 'error', String(e?.message ?? e));
        console.error('[email] error', e);
      }
    },
  };
}
