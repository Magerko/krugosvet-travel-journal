/* Страница отдельной статьи. */

(async function () {
    const user = await Layout.mount({ active: 'news' });

    const slug = location.pathname.split('/').pop();
    if (!slug) { location.href = '/news'; return; }

    let payload;
    try {
        payload = await API.get('/api/articles/' + slug);
    } catch (_) {
        toast('Статья не найдена', 'err');
        setTimeout(() => location.href = '/news', 1200);
        return;
    }

    const a = payload.article;
    let inFav = payload.in_favorites;

    document.title = `${a.title} — Кругосвет`;
    document.getElementById('breadcrumbs').innerHTML =
        `Главная / <a href="/news">Новости</a> / <span class="breadcrumbs__current">${a.title}</span>`;

    document.getElementById('title').textContent = a.title;
    document.getElementById('summary').textContent = a.summary || '';

    document.getElementById('title-meta').innerHTML = `
        ${a.category ? `<span class="badge badge--ochre">${a.category.name}</span>` : ''}
        ${a.is_featured ? `<span class="badge badge--accent">в главной выпуска</span>` : ''}
    `;

    document.getElementById('byline').innerHTML =
        `${a.author} · ${Fmt.date(a.published_at)} · ${a.reading_time} мин чтения · ${a.views} просмотров`;

    // Заменяем placeholder-обложку на реальную картинку
    const coverEl = document.getElementById('cover');
    coverEl.classList.remove('placeholder');
    coverEl.innerHTML = Img.tag('article-' + a.slug, a.title, 1200, 600);

    // Тело статьи. Если в БД хранится цельный текст — разделим по \n\n на абзацы.
    const body = (a.body || a.summary || '').split(/\n\n+/);
    document.getElementById('body').innerHTML = body
        .map(p => `<p>${p.trim()}</p>`)
        .join('');

    document.getElementById('views-info').textContent = `${a.views} прочтений`;

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
                target_type: 'article',
                target_id: a.id,
            });
            inFav = r.in_favorites;
            renderFav();
            toast(inFav ? 'Сохранено' : 'Убрано', 'ok');
        } catch (_) { toast('Ошибка', 'err'); }
    });

    // Комментарии
    function renderComments(items) {
        const el = document.getElementById('comments-list');
        document.getElementById('comments-title').textContent =
            `Комментарии · ${items.length}`;
        if (!items.length) {
            el.innerHTML = '<p class="muted" style="padding: 12px 0;">Будьте первым, кто оставит комментарий.</p>';
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
                const r = await API.post(`/api/articles/${a.id}/comments`, { body });
                t.value = '';
                payload.comments.unshift(r.comment);
                renderComments(payload.comments);
                toast('Комментарий добавлен', 'ok');
            } catch (_) {
                toast('Не удалось отправить', 'err');
            }
        });
    }

    // Похожие статьи
    if (payload.related && payload.related.length) {
        document.getElementById('related-section').style.display = '';
        document.getElementById('related').innerHTML = payload.related.map(r => `
            <a class="article-card" href="/news/${r.slug}">
                <div class="article-card__photo">${Img.tag('article-' + r.slug, r.title, 600, 400)}</div>
                <div class="article-card__body">
                    <div class="article-card__cat">${r.category?.name || 'статья'}</div>
                    <div class="article-card__title">${r.title}</div>
                    <div class="article-card__sum">${r.summary || ''}</div>
                    <div class="article-card__meta">
                        <span>${Fmt.dateShort(r.published_at)}</span>
                        <span>${r.reading_time} мин</span>
                    </div>
                </div>
            </a>
        `).join('');
    }
})();
