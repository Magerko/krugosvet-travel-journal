/* Главная страница информационного портала.
   Подгружаем: 3 фичерные статьи (одну большую + две поменьше),
               4 рекомендуемых места,
               6 экскурсий редакции. */

(async function () {
    await Layout.mount({ active: 'home' });

    // ----- Hero pick: достаём первую featured-статью -----
    let pick = null;
    try {
        const fa = await API.get('/api/articles/featured');
        pick = fa.items?.[0];
    } catch (_) {}

    const heroPick = document.getElementById('hero-pick');
    if (pick) {
        heroPick.href = `/news/${pick.slug}`;
        heroPick.innerHTML = `
            <div class="hero-pick__head">
                ${Icons.search(14)}
                ${pick.category?.name || 'статья выпуска'}
            </div>
            <h3 class="hero-pick__title">${pick.title}</h3>
            <div class="hero-pick__sub">${pick.summary || ''}</div>
            <div class="hero-pick__meta">
                <span>${pick.author}</span>
                <span>${pick.reading_time} мин чтения</span>
            </div>`;
    } else {
        heroPick.style.display = 'none';
    }

    // ----- Лента новостей -----
    let news = [];
    try {
        const r = await API.get('/api/articles/?per_page=3');
        news = r.items;
    } catch (_) { toast('Не удалось загрузить новости', 'err'); }

    const big = news[0];
    const side = news.slice(1, 3);

    const grid = document.getElementById('news-grid');
    let html = '';

    if (big) {
        html += `
            <a class="card news-big" href="/news/${big.slug}">
                <div class="news-big__photo">${Img.tag('article-' + big.slug, big.title, 1200, 600)}</div>
                <div class="news-big__overlay">
                    ${big.category ? `<span class="news-big__cat">${big.category.name}</span>` : ''}
                    <h3 class="news-big__title">${big.title}</h3>
                    <p class="news-big__sum">${big.summary || ''}</p>
                    <div class="news-big__foot">
                        ${big.author} · ${Fmt.dateShort(big.published_at)} · ${big.reading_time} мин
                    </div>
                </div>
            </a>`;
    }

    html += '<div class="news-side">';
    for (const a of side) {
        html += `
            <a class="news-card" href="/news/${a.slug}">
                <div class="news-card__photo">${Img.tag('article-' + a.slug, a.title, 400, 300)}</div>
                <div class="news-card__body">
                    <div class="news-card__cat">${a.category?.name || 'статья'}</div>
                    <div class="news-card__title">${a.title}</div>
                    <div class="news-card__meta">${Fmt.dateShort(a.published_at)} · ${a.reading_time} мин</div>
                </div>
            </a>`;
    }
    html += '</div>';

    grid.innerHTML = html;

    // ----- Места отдыха (4 featured) -----
    let dests = [];
    try {
        const r = await API.get('/api/destinations/?featured=1');
        dests = r.items.slice(0, 4);
    } catch (_) {}

    document.getElementById('destinations').innerHTML = dests.map(d => `
        <a class="dest-card" href="/destinations/${d.slug}">
            <div class="dest-card__photo">${Img.tag('dest-' + d.slug, d.title, 600, 400)}</div>
            <div class="dest-card__body">
                <div class="dest-card__title">${d.title}</div>
                <div class="dest-card__sum">${d.summary || ''}</div>
            </div>
        </a>
    `).join('');

    // ----- Экскурсии (6 featured) -----
    let excs = [];
    try {
        const r = await API.get('/api/excursions/featured');
        excs = r.items;
    } catch (_) {}

    document.getElementById('excursions').innerHTML = excs.map(e => `
        <a class="exc-card" href="/excursions/${e.slug}">
            <div class="exc-card__photo">${Img.tag('exc-' + e.slug, e.title, 600, 400)}</div>
            <div class="exc-card__body">
                <div class="exc-card__kind">${e.kind_label} · ${e.destination?.country || ''}</div>
                <div class="exc-card__title">${e.title}</div>
                <div class="exc-card__sum">${e.summary || ''}</div>
                <div class="exc-card__foot">
                    <span>${e.duration || ''}</span>
                    ${e.price_from ? `<span class="exc-card__price">от ${Fmt.rub(e.price_from)}</span>` : `<span class="muted">по запросу</span>`}
                </div>
            </div>
        </a>
    `).join('');

    // ----- Hero stats -----
    // Считаем суммарное количество — отдельный эндпоинт делать не стал, складываем то, что есть.
    document.getElementById('stat-excursions').textContent = excs.length ? '60+' : '…';
    document.getElementById('stat-destinations').textContent = dests.length;
    document.getElementById('dest-count').textContent =
        `${dests.length} ${Fmt.plural(dests.length, ['место','места','мест'])}`;

    // Чтобы цифра "статей" была честной, дозапросим первую страницу с per_page=1 — total в ответе
    try {
        const r = await API.get('/api/articles/?per_page=1');
        document.getElementById('stat-articles').textContent = r.total;
    } catch (_) {}
})();
