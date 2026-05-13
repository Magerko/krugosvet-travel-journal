/* Каталог экскурсий и тур-пакетов. */

(async function () {
    await Layout.mount({ active: 'excursions' });

    const state = {
        kind: '',
        country: '',
        price_max: null,
        sort: '',
        page: 1,
        per_page: 9,
    };

    // Достаём страны для радио-списка
    let countries = [];
    try {
        const r = await API.get('/api/countries');
        countries = r.items;
    } catch (_) {}

    const cl = document.getElementById('country-list');
    cl.innerHTML = `<span class="tag-pill is-active" data-country="">Все</span>` +
        countries.map(c => `<span class="tag-pill" data-country="${c.code}">${c.name}</span>`).join('');

    // Из URL
    const params = new URLSearchParams(location.search);
    if (params.get('kind'))    state.kind = params.get('kind');
    if (params.get('country')) state.country = params.get('country');
    setActivePill('kind-pills', 'kind', state.kind);
    setActivePill('country-list', 'country', state.country);

    function setActivePill(containerId, attr, value) {
        document.querySelectorAll(`#${containerId} .tag-pill`).forEach(p =>
            p.classList.toggle('is-active', p.dataset[attr] === value));
    }

    function bindPills(containerId, attr) {
        document.querySelectorAll(`#${containerId} .tag-pill`).forEach(p =>
            p.addEventListener('click', () => {
                state[attr] = p.dataset[attr];
                setActivePill(containerId, attr, state[attr]);
                state.page = 1;
                load();
            }));
    }
    bindPills('kind-pills', 'kind');
    bindPills('country-list', 'country');

    document.getElementById('apply').addEventListener('click', () => {
        const v = document.getElementById('price-max').value;
        state.price_max = v ? +v : null;
        state.sort = document.getElementById('sort').value;
        state.page = 1;
        load();
    });

    async function load() {
        const p = new URLSearchParams();
        if (state.kind)      p.set('kind', state.kind);
        if (state.country)   p.set('country', state.country);
        if (state.price_max) p.set('price_max', state.price_max);
        if (state.sort)      p.set('sort', state.sort);
        if (state.page > 1)  p.set('page', state.page);
        p.set('per_page', state.per_page);

        history.replaceState(null, '', '/excursions?' + p.toString());

        let data;
        try {
            data = await API.get('/api/excursions/?' + p.toString());
        } catch (_) { toast('Ошибка загрузки', 'err'); return; }

        renderCards(data.items);
        renderPager(data.page, data.pages);
        document.getElementById('found-total').textContent = data.total;
    }

    function renderCards(items) {
        const el = document.getElementById('cards');
        if (!items.length) {
            el.innerHTML = '<div class="empty-block">Под выбранные фильтры ничего не нашлось.</div>';
            return;
        }
        el.innerHTML = items.map(e => `
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
