/* Детальная страница места отдыха. */

(async function () {
    const user = await Layout.mount({ active: 'destinations' });

    const slug = location.pathname.split('/').pop();
    if (!slug) { location.href = '/destinations'; return; }

    let payload;
    try {
        payload = await API.get('/api/destinations/' + slug);
    } catch (_) {
        toast('Место не найдено', 'err');
        setTimeout(() => location.href = '/destinations', 1200);
        return;
    }

    const d = payload.destination;
    let inFav = payload.in_favorites;

    document.title = `${d.title} — Кругосвет`;
    document.getElementById('breadcrumbs').innerHTML =
        `Главная / <a href="/destinations">Места</a> / <span class="breadcrumbs__current">${d.title}</span>`;
    document.getElementById('title').textContent = d.title;

    document.getElementById('meta-line').innerHTML = `
        <div style="display:flex;align-items:center;gap:6px;">
            ${Icons.pin(14)} ${d.country}${d.city ? ', ' + d.city : ''}
        </div>
        ${d.flight_time ? `
            <span class="detail-meta-line__sep"></span>
            <div style="display:flex;align-items:center;gap:6px;">${Icons.compass(14)} ${d.flight_time}</div>` : ''}
    `;

    // Галерея — 5 фото с разными seed-ами на основе slug места
    document.getElementById('gallery').innerHTML = [1,2,3,4,5].map(i =>
        `<div>${Img.tag('dest-' + d.slug + '-' + i, d.title + ' — фото ' + i, 800, 500)}</div>`
    ).join('');

    document.getElementById('description').textContent =
        d.description || 'Подробное описание скоро появится.';

    // Брифовая инфа справа
    document.getElementById('brief').innerHTML = [
        ['compass',  'Лучшее время',   d.best_season],
        ['calendar', 'Средняя температура', d.avg_temperature],
        ['pin',      'Перелёт',         d.flight_time],
    ].filter(r => r[2]).map(([ic, l, v]) => `
        <div class="aside-row">
            ${Icons[ic](16)}
            <div><label>${l}</label><b>${v}</b></div>
        </div>`).join('');

    // Экскурсии
    if (payload.excursions.length) {
        document.getElementById('excursions-title').style.display = '';
        document.getElementById('excursions').innerHTML = payload.excursions.map(e => `
            <a class="exc-card" href="/excursions/${e.slug}">
                <div class="exc-card__photo">${Img.tag('exc-' + e.slug, e.title, 600, 400)}</div>
                <div class="exc-card__body">
                    <div class="exc-card__kind">${e.kind_label}</div>
                    <div class="exc-card__title">${e.title}</div>
                    <div class="exc-card__sum">${e.summary || ''}</div>
                    <div class="exc-card__foot">
                        <span>${e.duration || ''}</span>
                        ${e.price_from
                            ? `<span class="exc-card__price">от ${Fmt.rub(e.price_from)}</span>`
                            : `<span class="muted">по запросу</span>`}
                    </div>
                </div>
            </a>
        `).join('');
    }

    // Статьи
    if (payload.articles.length) {
        document.getElementById('articles-title').style.display = '';
        document.getElementById('articles').innerHTML = payload.articles.map(a => `
            <a href="/news/${a.slug}" style="display:flex;gap:14px;padding:14px 0;border-bottom:1px solid var(--line);">
                <div style="width:120px;height:80px;flex-shrink:0;border-radius:6px;overflow:hidden;">${Img.tag('article-' + a.slug, a.title, 240, 160)}</div>
                <div>
                    <div style="font-family:var(--font-mono);font-size:10px;text-transform:uppercase;color:var(--ochre);letter-spacing:1px;margin-bottom:4px;">
                        ${a.category?.name || 'статья'}
                    </div>
                    <div style="font-family:var(--font-serif);font-size:17px;font-weight:700;letter-spacing:-0.2px;">${a.title}</div>
                    <div class="muted" style="font-size:12px;margin-top:6px;">${Fmt.dateShort(a.published_at)} · ${a.reading_time} мин</div>
                </div>
            </a>
        `).join('');
    }

    // Соседние города
    if (payload.siblings.length) {
        document.getElementById('siblings-card').style.display = '';
        document.getElementById('siblings').innerHTML = payload.siblings.map(s => `
            <a href="/destinations/${s.slug}" style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--line);">
                <span style="width:34px;height:34px;border-radius:6px;background:var(--bg-soft);"></span>
                <div>
                    <div style="font-family:var(--font-serif);font-weight:700;font-size:14px;">${s.title}</div>
                    <div class="muted" style="font-size:11px;">${s.country}</div>
                </div>
            </a>
        `).join('');
    }

    // Кнопки
    document.getElementById('apply-btn').addEventListener('click', () =>
        RequestModal.open({ excursion: null }));

    function renderFav() {
        document.getElementById('fav-ic').innerHTML = Icons.heart(14, inFav);
        document.getElementById('fav-text').textContent = inFav ? 'В избранном' : 'В избранное';
    }
    renderFav();
    document.getElementById('fav-btn').addEventListener('click', async () => {
        if (!user) { location.href = '/auth?next=' + encodeURIComponent(location.pathname); return; }
        try {
            const r = await API.post('/api/favorites/toggle', {
                target_type: 'destination',
                target_id: d.id,
            });
            inFav = r.in_favorites;
            renderFav();
            toast(inFav ? 'Добавлено в избранное' : 'Убрано из избранного', 'ok');
        } catch (_) { toast('Ошибка', 'err'); }
    });
})();
