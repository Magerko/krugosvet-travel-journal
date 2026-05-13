/* Детальная страница экскурсии. */

(async function () {
    const user = await Layout.mount({ active: 'excursions' });

    // Slug из URL: /excursions/<slug>
    const slug = location.pathname.split('/').pop();
    if (!slug) { location.href = '/excursions'; return; }

    let payload;
    try {
        payload = await API.get('/api/excursions/' + slug);
    } catch (e) {
        toast('Экскурсия не найдена', 'err');
        setTimeout(() => location.href = '/excursions', 1200);
        return;
    }

    const e = payload.excursion;
    let inFav = payload.in_favorites;

    // Заголовки
    document.title = `${e.title} — Кругосвет`;
    const dest = e.destination;
    document.getElementById('breadcrumbs').innerHTML =
        `Главная / <a href="/excursions">Экскурсии</a> / <span class="breadcrumbs__current">${e.title}</span>`;

    document.getElementById('title').textContent = e.title;
    document.getElementById('title-meta').innerHTML = `
        <span class="badge badge--ochre">${e.kind_label}</span>
        ${e.is_featured ? `<span class="badge badge--accent">выбор редакции</span>` : ''}
    `;

    document.getElementById('meta-line').innerHTML = `
        <div style="display:flex;align-items:center;gap:6px;">
            ${Icons.pin(14)} ${dest?.country || ''}${dest?.city ? ', ' + dest.city : ''}
        </div>
        <span class="detail-meta-line__sep"></span>
        <div style="display:flex;align-items:center;gap:6px;">
            ${Icons.calendar(14)} ${e.duration || ''}
        </div>
        ${e.group_size ? `
            <span class="detail-meta-line__sep"></span>
            <div style="display:flex;align-items:center;gap:6px;">
                ${Icons.users(14)} ${e.group_size}
            </div>` : ''}
    `;

    // Галерея — 5 фото с разными seed-ами на основе slug, чтобы у каждой
    // экскурсии набор был стабильный, но не повторялся между экскурсиями.
    document.getElementById('gallery').innerHTML = [1,2,3,4,5].map(i =>
        `<div>${Img.tag('exc-' + e.slug + '-' + i, e.title + ' — фото ' + i, 800, 500)}</div>`
    ).join('');

    // Содержимое табов
    document.getElementById('description').textContent = e.description || 'Описание скоро появится.';
    document.getElementById('program').textContent     = e.program || 'Программа уточняется.';

    // Боковая панель — цена + детали
    document.getElementById('b-price-block').innerHTML = e.price_from
        ? `<div class="muted" style="font-size:11px;text-transform:uppercase;letter-spacing:0.5px;">от</div>
           <div class="aside-card__price"><span style="font-size:20px;color:var(--muted);">$</span>${e.price_from.toLocaleString('en-US')}</div>
           <div class="aside-card__price-sub">за человека, ориентировочно</div>`
        : `<div class="aside-card__price" style="font-size:24px;">Цена по запросу</div>
           <div class="aside-card__price-sub">оставьте заявку — рассчитаем</div>`;

    document.getElementById('b-rows').innerHTML = [
        ['calendar', 'Длительность',  e.duration || '—'],
        ['users',    'Группа',         e.group_size || '—'],
        ['compass',  'Языки гида',     e.languages || 'русский'],
        ['pin',      'Место',          (dest?.country || '') + (dest?.city ? ' · ' + dest.city : '')],
    ].map(([ic, l, v]) => `
        <div class="aside-row">
            ${Icons[ic](16)}
            <div>
                <label>${l}</label>
                <b>${v}</b>
            </div>
        </div>
    `).join('');

    // Кнопка заявки
    document.getElementById('apply-btn').addEventListener('click', () => {
        RequestModal.open({ excursion: e });
    });

    // Избранное
    function renderFav() {
        document.getElementById('fav-ic').innerHTML = Icons.heart(14, inFav);
        document.getElementById('fav-text').textContent = inFav ? 'В избранном' : 'В избранное';
    }
    renderFav();
    document.getElementById('fav-btn').addEventListener('click', async () => {
        if (!user) { location.href = '/auth?next=' + encodeURIComponent(location.pathname); return; }
        try {
            const r = await API.post('/api/favorites/toggle', {
                target_type: 'excursion',
                target_id: e.id,
            });
            inFav = r.in_favorites;
            renderFav();
            toast(inFav ? 'Добавлено в избранное' : 'Убрано из избранного', 'ok');
        } catch (_) { toast('Ошибка', 'err'); }
    });

    // Табы
    document.querySelectorAll('.tab').forEach(btn =>
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab').forEach(b => b.classList.remove('is-active'));
            btn.classList.add('is-active');
            const k = btn.dataset.tab;
            document.getElementById('tab-about').style.display    = k === 'about'    ? '' : 'none';
            document.getElementById('tab-program').style.display  = k === 'program'  ? '' : 'none';
            document.getElementById('tab-comments').style.display = k === 'comments' ? '' : 'none';
        }));

    // Комментарии
    function renderComments(items) {
        const el = document.getElementById('comments-list');
        document.getElementById('comments-title').textContent =
            `Комментарии · ${items.length}`;
        if (!items.length) {
            el.innerHTML = '<p class="muted" style="padding:12px 0;">Будьте первым, кто оставит комментарий.</p>';
            return;
        }
        el.innerHTML = items.map(c => `
            <div class="comment">
                <div class="comment__avatar">${c.user_initials}</div>
                <div>
                    <div class="comment__head">
                        <span class="comment__name">${c.user_name}</span>
                        <span class="comment__date">${Fmt.dateShort(c.created_at)}</span>
                    </div>
                    <div class="comment__body">${c.body}</div>
                </div>
            </div>
        `).join('');
    }
    renderComments(payload.comments);

    if (!user) {
        const form = document.getElementById('comment-form');
        form.querySelector('textarea').setAttribute('disabled', '');
        form.querySelector('#submit-comment').setAttribute('disabled', '');
        document.getElementById('comment-hint').innerHTML =
            `<a href="/auth?next=${encodeURIComponent(location.pathname)}" style="color:var(--accent);">Войдите</a>, чтобы оставить комментарий.`;
    } else {
        document.getElementById('submit-comment').addEventListener('click', async () => {
            const t = document.getElementById('comment-text');
            const body = t.value.trim();
            if (!body) return toast('Напишите пару слов', 'err');
            try {
                const r = await API.post(`/api/excursions/${e.id}/comments`, { body });
                t.value = '';
                payload.comments.unshift(r.comment);
                renderComments(payload.comments);
                toast('Комментарий добавлен', 'ok');
            } catch (_) {
                toast('Не удалось отправить', 'err');
            }
        });
    }

    // Похожие
    if (payload.related && payload.related.length) {
        document.getElementById('related-section').style.display = '';
        document.getElementById('related').innerHTML = payload.related.map(r => `
            <a class="exc-card" href="/excursions/${r.slug}">
                <div class="exc-card__photo">${Img.tag('exc-' + r.slug, r.title, 600, 400)}</div>
                <div class="exc-card__body">
                    <div class="exc-card__kind">${r.kind_label} · ${r.destination?.country || ''}</div>
                    <div class="exc-card__title">${r.title}</div>
                    <div class="exc-card__sum">${r.summary || ''}</div>
                    <div class="exc-card__foot">
                        <span>${r.duration || ''}</span>
                        ${r.price_from
                            ? `<span class="exc-card__price">от ${Fmt.rub(r.price_from)}</span>`
                            : `<span class="muted">по запросу</span>`}
                    </div>
                </div>
            </a>
        `).join('');
        // Стили exc-card должны быть подключены — добавлю их в detail.css
    }
})();
