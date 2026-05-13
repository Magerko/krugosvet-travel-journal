/* Лента новостей с категориями. */

(async function () {
    await Layout.mount({ active: 'news' });

    const state = {
        category: '',
        page: 1,
        per_page: 9,
    };

    // Категории
    let cats = [];
    try {
        const r = await API.get('/api/articles/categories');
        cats = r.items;
    } catch (_) {}

    const cb = document.getElementById('categories-bar');
    cb.innerHTML = `<span class="tag-pill is-active" data-c="">Все</span>` +
        cats.map(c => `<span class="tag-pill" data-c="${c.slug}">${c.name}</span>`).join('');

    document.querySelectorAll('#categories-bar .tag-pill').forEach(p =>
        p.addEventListener('click', () => {
            state.category = p.dataset.c;
            state.page = 1;
            document.querySelectorAll('#categories-bar .tag-pill').forEach(x =>
                x.classList.toggle('is-active', x.dataset.c === state.category));
            load();
        }));

    // Восстановим выбор из URL
    const params = new URLSearchParams(location.search);
    if (params.get('category')) {
        state.category = params.get('category');
        document.querySelectorAll('#categories-bar .tag-pill').forEach(x =>
            x.classList.toggle('is-active', x.dataset.c === state.category));
    }

    async function load() {
        const p = new URLSearchParams();
        if (state.category) p.set('category', state.category);
        if (state.page > 1) p.set('page', state.page);
        p.set('per_page', state.per_page);

        history.replaceState(null, '', '/news?' + p.toString());

        let data;
        try {
            data = await API.get('/api/articles/?' + p.toString());
        } catch (_) { toast('Ошибка загрузки', 'err'); return; }

        document.getElementById('found-total').textContent = data.total;

        const el = document.getElementById('articles');
        if (!data.items.length) {
            el.innerHTML = '<div class="empty-block">В этой категории пока пусто.</div>';
        } else {
            el.innerHTML = data.items.map(a => `
                <a class="article-card" href="/news/${a.slug}">
                    <div class="article-card__photo">${Img.tag('article-' + a.slug, a.title, 600, 400)}</div>
                    <div class="article-card__body">
                        <div class="article-card__cat">${a.category?.name || 'статья'}</div>
                        <div class="article-card__title">${a.title}</div>
                        <div class="article-card__sum">${a.summary || ''}</div>
                        <div class="article-card__meta">
                            <span>${Fmt.dateShort(a.published_at)}</span>
                            <span>${a.reading_time} мин · ${a.views} просм.</span>
                        </div>
                    </div>
                </a>
            `).join('');
        }

        renderPager(data.page, data.pages);
    }

    function renderPager(page, pages) {
        const pg = document.getElementById('pager');
        if (pages <= 1) { pg.innerHTML = ''; return; }
        let html = `<button data-p="${Math.max(1, page - 1)}">‹</button>`;
        for (let i = 1; i <= pages; i++) {
            html += `<button class="${i === page ? 'is-active' : ''}" data-p="${i}">${i}</button>`;
        }
        html += `<button data-p="${Math.min(pages, page + 1)}">›</button>`;
        pg.innerHTML = html;
        pg.querySelectorAll('button').forEach(b =>
            b.addEventListener('click', () => {
                state.page = +b.dataset.p;
                load();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }));
    }

    load();
})();
