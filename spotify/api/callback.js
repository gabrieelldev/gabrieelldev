// Paso de configuración (solo se usa una vez): Spotify vuelve aquí tras el login
// y esta página te muestra tu "refresh token" para que lo guardes en Vercel.
// Cuando ya has guardado SPOTIFY_REFRESH_TOKEN en Vercel, esta página se desactiva sola.
const { exchangeCode } = require('../lib/spotify');
const { esc } = require('../lib/card');

function page(title, body) {
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title>
<style>body{font-family:system-ui,sans-serif;max-width:640px;margin:40px auto;padding:0 16px;line-height:1.5}code{display:block;word-break:break-all;background:#f2f2f2;padding:12px;border-radius:8px;user-select:all}</style>
</head><body><h1>${esc(title)}</h1>${body}</body></html>`;
}

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  if (process.env.SPOTIFY_REFRESH_TOKEN) {
    return res.status(403).send(page('Ya está configurado', '<p>Spotify ya está conectado.</p>'));
  }

  const { code, state, error } = req.query || {};
  const cookieState = ((req.headers.cookie || '').match(/spotify_state=([a-f0-9]+)/) || [])[1];
  if (error || !code || !state || state !== cookieState) {
    return res.status(400).send(page('No se ha podido conectar', '<p>Vuelve a intentarlo desde <a href="/api/login">/api/login</a>.</p>'));
  }

  try {
    const tokens = await exchangeCode(code, `https://${req.headers.host}/api/callback`);
    return res.status(200).send(page('¡Conectado!', `
<p>Copia este valor. Es tu <b>SPOTIFY_REFRESH_TOKEN</b>:</p>
<code>${esc(tokens.refresh_token)}</code>
<p>Guárdalo en Vercel → tu proyecto → <b>Settings → Environment Variables</b> con el nombre <b>SPOTIFY_REFRESH_TOKEN</b> y vuelve a desplegar.</p>
<p><b>No lo compartas con nadie</b> ni lo pegues en el chat: da acceso a lo que escuchas en Spotify.</p>`));
  } catch (err) {
    console.error(err);
    return res.status(500).send(page('Error', '<p>Spotify no ha aceptado el código. Revisa el Client ID, el Client Secret y la Redirect URI.</p>'));
  }
};
