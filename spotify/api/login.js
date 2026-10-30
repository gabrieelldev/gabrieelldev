// Paso de configuración (solo se usa una vez): te lleva al login de Spotify
// para que autorices a la app a leer lo que escuchas.
// Cuando ya has guardado SPOTIFY_REFRESH_TOKEN en Vercel, esta página se desactiva sola.
const crypto = require('crypto');
const { SCOPES } = require('../lib/spotify');

module.exports = (req, res) => {
  if (process.env.SPOTIFY_REFRESH_TOKEN) {
    return res.status(403).send('Spotify ya está configurado.');
  }
  // "state" aleatorio para comprobar en /api/callback que la respuesta viene de este login.
  const state = crypto.randomBytes(16).toString('hex');
  res.setHeader('Set-Cookie', `spotify_state=${state}; Path=/api; HttpOnly; Secure; SameSite=Lax; Max-Age=600`);

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: process.env.SPOTIFY_CLIENT_ID || '',
    scope: SCOPES,
    redirect_uri: `https://${req.headers.host}/api/callback`,
    state,
  });
  return res.redirect(302, `https://accounts.spotify.com/authorize?${params}`);
};
