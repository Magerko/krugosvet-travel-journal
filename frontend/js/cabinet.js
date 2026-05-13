/* Личный кабинет: избранное + заявки + профиль. */

(async function () {
    const user = await Layout.mount({ active: '' });
    if (!user) {
        location.href = '/auth?next=/cabinet';
        return;
    }

    // Шапка пользователя
    document.getElementById('user-avatar').textContent = user.initials;
    document.getElementById('user-name').textContent = user.full_name;
    document.getElementById('user-email').textContent = user.email;

    // Иконки в навигации
    document.getElementById('nav-fav-ic').innerHTML  = Icons.heart(15);
    document.getElementById('nav-req-ic').innerHTML  = Icons.calendar(15);
    document.getElementById('nav-prof-ic').innerHTML = Icons.users(15);

    // Профиль
    document.getElementById('p-name').value  = user.full_name;
    document.getElementById('p-email').value = user.email;
    document.getElementById('p-phone').value = user.phone || '—';

    // Переключение секций
    document.querySelectorAll('.cab-nav__item').forEach(it => {
        it.addEventListener('click', () => {
            document.querySelectorAll('.cab-nav__item').forEach(x =>
                x.classList.toggle('is-active', x === it));
            const s = it.dataset.section;
            document.getElementById('section-favorites').style.display = s === 'favorites' ? '' : 'none';
            document.getElementById('section-requests').style.display  = s === 'requests'  ? '' : 'none';
            document.getElementById('section-profile').style.display   = s === 'profile'   ? '' : 'none';
        });
    });

    // ----- Избранное -----
    let favData = { articles: [], excursions: [], destinations: [] };
    try {
        favData = await API.get('/api/favorites/my');
    } catch (_) { toast('Не удалось загрузить избранное', 'err'); }

    document.getElementById('stat-articles').textContent     = favData.articles.length;
    document.getElementById('stat-excursions').textContent   = favData.excursions.length;
    document.getElementById('stat-destinations').textContent = favData.destinations.length;
    document.getElementById('cnt-fav').textContent =
        favData.articles.length + favData.excursions.length + favData.destinations.length;

    function renderArticles() {
        const el = document.getElementById('fav-articles');
        if (!favData.articles.length) {
            el.innerHTML = '<div class="empty-block">В избранном пока нет статей.</div>';
            return;
        }
        el.innerHTML = favData.articles.map(a => `
            <a class="article-card" href="/news/${a.slug}">
                <div class="article-card__photo">${Img.tag('article-' + a.slug, a.title, 600, 400)}</div>
                <div class="article-card__body">
                    <div class="article-card__cat">${a.category?.name || 'статья'}</div>
                    <div class="article-card__title">${a.title}</div>
                    <div class="article-card__sum">${a.summary || ''}</div>
                    <div class="article-card__meta">
                        <span>${Fmt.dateShort(a.published_at)}</span>
                        <span>${a.reading_time} мин</span>
                    </div>
                </div>
            </a>`).join('');
    }
    function renderExcursions() {
        const el = document.getElementById('fav-excursions');
        if (!favData.excursions.length) {
            el.innerHTML = '<div class="empty-block">В избранном пока нет экскурсий.</div>';
            return;
        }
        el.innerHTML = favData.excursions.map(e => `
            <a class="exc-card" href="/excursions/${e.slug}">
                <div class="exc-card__photo">${Img.tag('exc-' + e.slug, e.title, 600, 400)}</div>
                <div class="exc-card__body">
                    <div class="exc-card__kind">${e.kind_label} · ${e.destination?.country || ''}</div>
                    <div class="exc-card__title">${e.title}</div>
                    <div class="exc-card__sum">${e.summary || ''}</div>
                    <div class="exc-card__foot">
                        <span>${e.duration || ''}</span>
                        ${e.price_from
                            ? `<span class="exc-card__price">от ${Fmt.rub(e.price_from)}</span>`
                            : `<span class="muted">по запросу</span>`}
                    </div>
                </div>
            </a>`).join('');
    }
    function renderDestinations() {
        const el = document.getElementById('fav-destinations');
        if (!favData.destinations.length) {
            el.innerHTML = '<div class="empty-block">В избранном пока нет мест.</div>';
            return;
        }
        el.innerHTML = favData.destinations.map(d => `
            <a class="dest-card" href="/destinations/${d.slug}">
                <div class="dest-card__photo">${Img.tag('dest-' + d.slug, d.title, 600, 400)}</div>
                <div class="dest-card__body">
                    <div class="dest-card__title">${d.title}</div>
                    <div class="dest-card__sum">${d.summary || ''}</div>
                    <div class="dest-card__country">${d.country}</div>
                </div>
            </a>`).join('');
    }

    renderArticles();
    renderExcursions();
    renderDestinations();

    document.querySelectorAll('.fav-tabs .tab').forEach(t =>
        t.addEventListener('click', () => {
            document.querySelectorAll('.fav-tabs .tab').forEach(x => x.classList.toggle('is-active', x === t));
            const k = t.dataset.fav;
            document.getElementById('fav-articles').style.display     = k === 'articles'     ? '' : 'none';
            document.getElementById('fav-excursions').style.display   = k === 'excursions'   ? '' : 'none';
            document.getElementById('fav-destinations').style.display = k === 'destinations' ? '' : 'none';
        }));

    // ----- Заявки -----
    let reqs = [];
    try {
        const r = await API.get('/api/requests/my');
        reqs = r.items;
    } catch (_) {}

    document.getElementById('stat-requests').textContent = reqs.length;
    document.getElementById('cnt-req').textContent = reqs.length;

    const reqList = document.getElementById('req-list');
    if (!reqs.length) {
        reqList.innerHTML = '<div class="empty-block">Заявок пока нет. <a href="/excursions" class="arrow-link">Найти экскурсию →</a></div>';
    } else {
        const STATUS_BADGE = {
            new:       'badge--warn',
            in_work:   'badge--accent',
            done:      'badge--ok',
            cancelled: 'badge--mute',
        };
        reqList.innerHTML = reqs.map(r => `
            <div class="req-card">
                <div>
                    <div class="req-card__title">
                        ${r.excursion ? `<a href="/excursions/${r.excursion.slug}">${r.excursion.title}</a>` : 'Общая заявка'}
                    </div>
                    <div class="req-card__sub">
                        №${r.id} · отправлена ${Fmt.dateTime(r.created_at)}${r.desired_date ? ' · желаемая дата ' + Fmt.dateShort(r.desired_date) : ''}
                    </div>
                    ${r.message ? `<div class="req-card__msg">${r.message}</div>` : ''}
                </div>
                <div style="text-align: right;">
                    <span class="badge ${STATUS_BADGE[r.status] || 'badge--mute'}">● ${r.status_label}</span>
                </div>
            </div>
        `).join('');
    }
})();
