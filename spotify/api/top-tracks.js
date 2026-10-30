// Tarjeta con tus 5 canciones favoritas.
// Por defecto, las más escuchadas (?periodo=corto|medio|largo).
// Con ?tipo=me-gusta muestra las últimas canciones a las que has dado "Me gusta".
const { getAccessToken, api, imageData } = require('../lib/spotify');
const { texts, esc, svg, messageCard, send } = require('../lib/card');

const RANGES = { corto: 'short_term', medio: 'medium_term', largo: 'long_term' };

const CSS = `
.list { display: flex; flex-direction: column; gap: 8px; }
.track { display: flex; align-items: center; gap: 10px; min-width: 0; }
.num { width: 18px; flex: none; text-align: right; font-size: 13px; font-weight: 700; color: #1DB954; }
.cover { width: 44px; height: 44px; border-radius: 4px; flex: none; }
.info { flex: 1; min-width: 0; display: flex; flex-direction: column; }
`;

module.exports = async (req, res) => {
  const t = texts(req);
  try {
    const token = await getAccessToken();
    let tracks;
    if (req.query && req.query.tipo === 'me-gusta') {
      const data = await api(token, '/me/tracks?limit=5');
      tracks = ((data && data.items) || []).map((item) => item.track);
    } else {
      const range = RANGES[(req.query && req.query.periodo) || 'medio'] || 'medium_term';
      const data = await api(token, `/me/top/tracks?limit=5&time_range=${range}`);
      tracks = (data && data.items) || [];
    }
    if (tracks.length === 0) return send(res, messageCard(t.tracks, '—'));

    const covers = await Promise.all(tracks.map((tr) => imageData(tr.album && tr.album.images, 64)));
    const rows = tracks.map((tr, i) => '<div class="track">'
      + `<span class="num">${i + 1}</span>`
      + (covers[i] ? `<img class="cover" src="${covers[i]}" />` : '')
      + `<div class="info"><p class="name">${esc(tr.name)}</p><p class="sub">${esc((tr.artists || []).map((a) => a.name).join(', '))}</p></div>`
      + '</div>').join('');

    return send(res, svg(480, 345, `<p class="title">${esc(t.tracks)}</p><div class="card list">${rows}</div>`, CSS));
  } catch (err) {
    console.error(err);
    return send(res, messageCard(t.tracks, t.error));
  }
};
