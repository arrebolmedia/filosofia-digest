import 'dotenv/config';
import express from 'express';
import { sendDigest } from './mailer.js';
import {
  isBaserowConfigured,
  findSubscriberByEmail,
  createSubscriber,
  baserowPatch,
} from './baserow.js';
import { unsubscribeUrl, verifyUnsubscribeToken } from './unsubscribe.js';

const PORT = parseInt(process.env.SUBSCRIBE_PORT ?? '3001');

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ── Welcome email ─────────────────────────────────────────────────────────────

async function sendWelcome(to: string): Promise<void> {
  const unsubUrl = unsubscribeUrl(to);
  const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;1,400&family=Source+Sans+3:wght@300;400&display=swap" rel="stylesheet">
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
body{background:#FAFAF8;color:#1A1A1A;font-family:'Source Sans 3',system-ui,sans-serif;font-size:17px;line-height:1.75;font-weight:300}
.wrap{max-width:560px;margin:0 auto;padding:48px 24px}
.eyebrow{font-size:10px;letter-spacing:.35em;text-transform:uppercase;color:#9A9590;margin-bottom:20px}
.title{font-family:'Playfair Display',Georgia,serif;font-size:40px;font-weight:400;font-style:italic;color:#1A1A1A;margin-bottom:32px;line-height:1.15}
.body p{font-size:16px;color:#2A2520;line-height:1.85;margin-bottom:16px;font-weight:300}
.body p:last-child{margin-bottom:0}
.divider{border:none;border-top:1px solid #D8D4CC;margin:32px 0}
.footer{font-size:11px;color:#B0ABA5;line-height:1.8}
.footer a{color:#8A8580}
</style>
</head>
<body>
<div class="wrap">
  <p class="eyebrow">Digest Diario · Filosofía</p>
  <h1 class="title">Una Vida Examinada</h1>
  <div class="body">
    <p>Tu suscripción está confirmada.</p>
    <p>Mañana recibirás tu primera edición: comenzamos desde el principio, con la introducción a la filosofía. Cada mañana, tres ideas sintetizadas de los textos del programa.</p>
    <p>La filosofía no resuelve la vida, pero la hace más interesante de vivir.</p>
  </div>
  <hr class="divider">
  <p class="footer">
    Recibirás un correo cada mañana de lunes a viernes.<br>
    <a href="https://ia.anthonycazares.cafe">ia.anthonycazares.cafe</a>
    &nbsp;·&nbsp;
    <a href="${esc(unsubUrl)}">Desuscribirse</a>
  </p>
</div>
</body>
</html>`;

  await sendDigest({ subject: 'Bienvenido a Una Vida Examinada', html, to });
}

// ── Server ────────────────────────────────────────────────────────────────────

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((_req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  next();
});

app.options('/subscribe', (_req, res) => { res.sendStatus(204); });

app.post('/subscribe', async (req, res) => {
  const email   = (req.body?.email   ?? '').trim().toLowerCase();
  const website = (req.body?.website ?? '').trim();
  const ts      = Number(req.body?.ts ?? 0);

  if (website || (ts > 0 && Date.now() - ts < 1500)) {
    console.warn(`[subscribe] Honeypot tripped: email=${email} website=${website ? 'filled' : 'empty'} elapsed=${ts ? Date.now() - ts : 'n/a'}ms`);
    res.json({ ok: true });
    return;
  }

  if (!isValidEmail(email)) {
    res.status(400).json({ error: 'Email inválido.' });
    return;
  }

  if (!isBaserowConfigured()) {
    res.status(503).json({ error: 'Servidor no configurado.' });
    return;
  }

  try {
    const existing = await findSubscriberByEmail(email);
    if (existing) {
      res.status(409).json({ error: 'Este correo ya está suscrito.' });
      return;
    }

    await createSubscriber(email);
    console.log(`[subscribe] Nuevo suscriptor: ${email}`);

    sendWelcome(email).catch(err =>
      console.error('[subscribe] Welcome email failed:', err)
    );

    res.json({ ok: true });
  } catch (err) {
    console.error('[subscribe] Error:', err);
    res.status(500).json({ error: 'Error interno. Intenta de nuevo.' });
  }
});

// ── Unsubscribe ───────────────────────────────────────────────────────────────

const BASEROW_TABLE = 839;

function renderUnsubPage(opts: { title: string; body: string; ok: boolean }): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>${esc(opts.title)} — Una Vida Examinada</title>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;1,400&family=Source+Sans+3:wght@300;400&display=swap" rel="stylesheet">
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
body{background:#FAFAF8;color:#1A1A1A;font-family:'Source Sans 3',system-ui,sans-serif;font-size:17px;line-height:1.75;font-weight:300;min-height:100vh;display:flex;align-items:center;justify-content:center}
.wrap{max-width:520px;margin:0 auto;padding:48px 24px;text-align:center}
.eyebrow{font-size:10px;letter-spacing:.35em;text-transform:uppercase;color:#9A9590;margin-bottom:20px}
.title{font-family:'Playfair Display',Georgia,serif;font-size:36px;font-weight:400;font-style:italic;color:${opts.ok ? '#1A1A1A' : '#8A5A5A'};margin-bottom:24px;line-height:1.15}
.body{font-size:16px;color:#2A2520;line-height:1.85;font-weight:300}
.back{display:inline-block;margin-top:32px;font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#4A6FA5;text-decoration:none;border:1px solid #4A6FA5;padding:12px 28px}
.back:hover{background:#4A6FA5;color:#FAFAF8}
</style>
</head>
<body>
<div class="wrap">
  <p class="eyebrow">Una Vida Examinada</p>
  <h1 class="title">${esc(opts.title)}</h1>
  <p class="body">${opts.body}</p>
  <a class="back" href="https://ia.anthonycazares.cafe">← Volver al inicio</a>
</div>
</body></html>`;
}

async function handleUnsubscribe(req: express.Request, res: express.Response): Promise<void> {
  const email = String(req.query.e ?? req.body?.e ?? '').trim().toLowerCase();
  const token = String(req.query.t ?? req.body?.t ?? '').trim();

  res.setHeader('Content-Type', 'text/html; charset=utf-8');

  if (!email || !token || !verifyUnsubscribeToken(email, token)) {
    res.status(400).send(renderUnsubPage({
      title: 'Enlace inválido',
      body:  'El enlace de desuscripción no es válido o ha expirado. Si quieres cancelar tu suscripción, responde a cualquier correo del digest.',
      ok:    false,
    }));
    return;
  }

  try {
    const sub = await findSubscriberByEmail(email);
    if (!sub) {
      res.send(renderUnsubPage({
        title: 'No estás suscrito',
        body:  `No encontramos <strong>${esc(email)}</strong> en nuestra lista. Probablemente ya te desuscribiste antes.`,
        ok:    true,
      }));
      return;
    }

    if (sub.active === false) {
      res.send(renderUnsubPage({
        title: 'Ya estabas desuscrito',
        body:  `<strong>${esc(email)}</strong> ya no recibe el digest. Nada que hacer.`,
        ok:    true,
      }));
      return;
    }

    await baserowPatch(
      `/api/database/rows/table/${BASEROW_TABLE}/${sub.id}/?user_field_names=true`,
      { active: false }
    );
    console.log(`[unsubscribe] ${email} desuscrito.`);

    res.send(renderUnsubPage({
      title: 'Listo',
      body:  `Hemos cancelado la suscripción de <strong>${esc(email)}</strong>. No recibirás más correos. Si fue un error, puedes volver a suscribirte cuando quieras.`,
      ok:    true,
    }));
  } catch (err) {
    console.error('[unsubscribe] Error:', err);
    res.status(500).send(renderUnsubPage({
      title: 'Algo salió mal',
      body:  'No pudimos procesar tu solicitud. Intenta de nuevo en un minuto o responde a cualquier correo del digest.',
      ok:    false,
    }));
  }
}

app.get('/unsubscribe',  handleUnsubscribe);
app.post('/unsubscribe', handleUnsubscribe);

app.listen(PORT, () => {
  console.log(`[subscribe-server] Escuchando en puerto ${PORT}`);
});
