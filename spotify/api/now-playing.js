// Tarjeta "Escuchando ahora": la canción que suena en tu Spotify o, si no suena nada, la última.
// Con ?open redirige a esa canción en Spotify (para que la tarjeta se pueda pulsar).
const { getAccessToken, api, imageData } = require('../lib/spotify');
const { texts, esc, svg, messageCard, send } = require('../lib/card');

const BAR_CSS = `
.row { display: flex; align-items: center; gap: 12px; }
.cover { width: 64px; height: 64px; border-radius: 4px; flex: none; }
.info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.eq { display: flex; align-items: flex-end; gap: 3px; height: 30px; flex: none; }
.eq i { display: block; width: 4px; height: 4px; border-radius: 2px; background: #3fb950; animation: bounce ease-in-out infinite alternate; }
@keyframes bounce { from { height: 4px; } to { height: 30px; } }
`;

module.exports = async (req, res) => {
  const t = texts(req);
  try {
    const token = await getAccessToken();
    let track = null;
    let playing = false;

    const current = await api(token, '/me/player/currently-playing');
    if (current && current.item && current.currently_playing_type === 'track') {
      track = current.item;
      playing = current.is_playing;
    }
    if (!track) {
      const recent = await api(token, '/me/player/recently-played?limit=1');
      track = recent && recent.items && recent.items[0] ? recent.items[0].track : null;
    }

    if (req.query && 'open' in req.query) {
      const url = (track && track.external_urls && track.external_urls.spotify) || 'https://open.spotify.com';
      res.setHeader('Cache-Control', 'no-store');
      return res.redirect(302, url);
    }

    if (!track) return send(res, messageCard(t.now, t.nothing));

    const cover = await imageData(track.album && track.album.images, 64);
    const artists = (track.artists || []).map((a) => a.name).join(', ');

    // Barras del ecualizador, cada una con su ritmo, solo si está sonando.
    const bars = playing
      ? `<div class="eq">${Array.from({ length: 6 }, (_, i) => `<i style="animation-duration:${(0.55 + (i * 0.17) % 0.6).toFixed(2)}s;animation-delay:-${(i * 0.13).toFixed(2)}s"></i>`).join('')}</div>`
      : '';

    const body = `<p class="title">${esc(playing ? t.now : t.last)}</p>`
      + '<div class="card row">'
      + (cover ? `<img class="cover" src="${cover}" />` : '')
      + `<div class="info"><p class="name">${esc(track.name)}</p><p class="sub">${esc(artists)}</p></div>`
      + bars
      + '</div>';

    return send(res, svg(480, 130, body, BAR_CSS));
  } catch (err) {
    console.error(err);
    return send(res, messageCard(t.now, t.error));
  }
};
