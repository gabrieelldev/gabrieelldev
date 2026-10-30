// Conexión con la API de Spotify.
// Las claves se leen de las variables de entorno de Vercel, NUNCA se escriben en el código:
//   SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET y SPOTIFY_REFRESH_TOKEN

const TOKEN_URL = 'https://accounts.spotify.com/api/token';
const API_URL = 'https://api.spotify.com/v1';

function basicAuth() {
  const { SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET } = process.env;
  return Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64');
}

// Pide a Spotify un token de acceso temporal (dura 1 hora) usando el "refresh token".
async function getAccessToken() {
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basicAuth()}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: process.env.SPOTIFY_REFRESH_TOKEN || '',
    }),
  });
  if (!res.ok) throw new Error(`No se pudo obtener el token (${res.status})`);
  return (await res.json()).access_token;
}

// Cambia el "code" que devuelve el login de Spotify por los tokens (solo se usa al configurar).
async function exchangeCode(code, redirectUri) {
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basicAuth()}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ grant_type: 'authorization_code', code, redirect_uri: redirectUri }),
  });
  if (!res.ok) throw new Error(`No se pudo canjear el código (${res.status})`);
  return res.json();
}

// Llamada GET a la API. Devuelve null si Spotify responde "sin contenido" (204).
async function api(token, path) {
  const res = await fetch(API_URL + path, { headers: { Authorization: `Bearer ${token}` } });
  if (res.status === 204) return null;
  if (!res.ok) throw new Error(`Spotify ${path} respondió ${res.status}`);
  return res.json();
}

// Descarga una imagen y la convierte a base64. Hace falta porque GitHub no carga
// imágenes externas dentro de un SVG: tienen que ir incrustadas.
async function imageData(images, minSize = 64) {
  if (!images || images.length === 0) return null;
  const sorted = [...images].sort((a, b) => (a.width || 0) - (b.width || 0));
  const chosen = sorted.find((img) => (img.width || minSize) >= minSize) || sorted[sorted.length - 1];
  try {
    const res = await fetch(chosen.url);
    if (!res.ok) return null;
    const type = res.headers.get('content-type') || 'image/jpeg';
    const data = Buffer.from(await res.arrayBuffer()).toString('base64');
    return `data:${type};base64,${data}`;
  } catch {
    return null;
  }
}

const SCOPES = [
  'user-read-currently-playing',
  'user-read-recently-played',
  'user-top-read',
  'user-library-read',
].join(' ');

module.exports = { getAccessToken, exchangeCode, api, imageData, SCOPES };
