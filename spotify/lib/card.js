// Utilidades para dibujar las tarjetas.
// Cada tarjeta es un SVG con HTML dentro (<foreignObject>), que GitHub muestra como una imagen.

// Textos en los idiomas del perfil (?lang=en, fr, pt, de; por defecto español).
const TEXTS = {
  es: { now: 'Escuchando ahora', last: 'Lo último que escuché', artists: 'Mis 5 artistas más escuchados', tracks: 'Mis canciones favoritas', nothing: 'Ahora mismo no suena nada', error: 'No se ha podido conectar con Spotify' },
  en: { now: 'Listening now', last: 'Last played', artists: 'My top 5 artists', tracks: 'My favourite songs', nothing: 'Nothing playing right now', error: 'Could not connect to Spotify' },
  fr: { now: 'En écoute', last: 'Dernière écoute', artists: 'Mes 5 artistes les plus écoutés', tracks: 'Mes chansons préférées', nothing: "Rien en cours d'écoute", error: 'Impossible de se connecter à Spotify' },
  pt: { now: 'A ouvir agora', last: 'A última que ouvi', artists: 'Os meus 5 artistas mais ouvidos', tracks: 'As minhas músicas favoritas', nothing: 'Nada a tocar neste momento', error: 'Não foi possível ligar ao Spotify' },
  de: { now: 'Höre gerade', last: 'Zuletzt gehört', artists: 'Meine Top-5-Künstler', tracks: 'Meine Lieblingssongs', nothing: 'Gerade läuft nichts', error: 'Keine Verbindung zu Spotify' },
};

function texts(req) {
  const lang = String((req.query && req.query.lang) || 'es').toLowerCase();
  return TEXTS[lang] || TEXTS.es;
}

// Evita que un nombre con < o & rompa el SVG.
function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// Estilo común: se adapta al modo claro u oscuro de GitHub.
const BASE_CSS = `
* { margin: 0; box-sizing: border-box; }
.wrap { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif; color: #1f2328; padding: 6px 8px; }
.title { color: rgba(115,115,115,.9); font-size: 17px; font-weight: 600; text-align: center; margin-bottom: 8px; }
.card { background: rgba(255,255,255,.7); border: 1px solid rgba(125,125,125,.3); border-radius: 8px; padding: 10px; }
.name { font-size: 15px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.sub { font-size: 13px; color: #59636e; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.empty { text-align: center; font-size: 14px; color: #59636e; }
@media (prefers-color-scheme: dark) {
  .wrap { color: #e6edf3; }
  .sub, .empty { color: #9198a1; }
  .card { background: rgba(22,27,34,.75); }
}
`;

function svg(width, height, body, css = '') {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none">`
    + `<foreignObject width="${width}" height="${height}">`
    + `<div xmlns="http://www.w3.org/1999/xhtml" class="wrap"><style>${BASE_CSS}${css}</style>${body}</div>`
    + '</foreignObject></svg>';
}

function messageCard(title, message) {
  return svg(480, 100, `<p class="title">${esc(title)}</p><div class="card"><p class="empty">${esc(message)}</p></div>`);
}

// Envía la tarjeta sin caché, para que GitHub pida siempre la versión actual.
function send(res, content) {
  res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
  res.status(200).send(content);
}

module.exports = { texts, esc, svg, messageCard, send };
