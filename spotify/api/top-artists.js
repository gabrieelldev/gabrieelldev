// Tarjeta con tus 5 artistas más escuchados.
// ?periodo=corto (4 semanas), medio (6 meses, por defecto) o largo (todo el historial).
const { getAccessToken, api, imageData } = require('../lib/spotify');
const { texts, esc, svg, messageCard, send } = require('../lib/card');

const RANGES = { corto: 'short_term', medio: 'medium_term', largo: 'long_term' };

const CSS = `
.grid { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 8px; }
.artist { display: flex; flex-direction: column; align-items: center; gap: 6px; text-align: center; min-width: 0; }
.photo { width: 72px; height: 72px; border-radius: 50%; object-fit: cover; background: rgba(125,125,125,.2); }
.artist .name { font-size: 13px; max-width: 100%; }
.pos { font-size: 12px; color: #3fb950; font-weight: 700; }
`;

module.exports = async (req, res) => {
  const t = texts(req);
  try {
    const range = RANGES[(req.query && req.query.periodo) || 'medio'] || 'medium_term';
    const token = await getAccessToken();
    const data = await api(token, `/me/top/artists?limit=5&time_range=${range}`);
    const artists = (data && data.items) || [];
    if (artists.length === 0) return send(res, messageCard(t.artists, '—'));

    const photos = await Promise.all(artists.map((a) => imageData(a.images, 160)));
    const items = artists.map((a, i) => '<div class="artist">'
      + (photos[i] ? `<img class="photo" src="${photos[i]}" />` : '<div class="photo"></div>')
      + `<span class="pos">#${i + 1}</span><p class="name">${esc(a.name)}</p></div>`).join('');

    return send(res, svg(480, 175, `<p class="title">${esc(t.artists)}</p><div class="card grid">${items}</div>`, CSS));
  } catch (err) {
    console.error(err);
    return send(res, messageCard(t.artists, t.error));
  }
};
