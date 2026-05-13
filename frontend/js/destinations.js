/* Каталог мест отдыха. Простая фильтрация по стране + поиск. */

(async function () {
    await Layout.mount({ active: 'destinations' });

    const state = { country: '', q: '' };

    // Страны для фильтра
    let countries = [];
    try {
        const r = await API.get('/api/countries');
        countries = r.items;
    } catch (_) {}

    document.getElementById('country-list').innerHTML =
        `<span class="tag-pill is-active" data-c="">Все</span>` +
        countries.map(c => `<span class="tag-pill" data-c="${c.code}">${c.name}</span>`).join('');

    document.querySelectorAll('#country-list .tag-pill').forEach(p =>
        p.addEventListener('click', () => {
            state.country = p.dataset.c;
            document.querySelectorAll('#country-list .tag-pill').forEach(x =>
                x.classList.toggle('is-active', x.dataset.c === state.country));
            load();
        }));

    // Поиск с дебаунсом
    let searchTimer;
    document.getElementById('search').addEventListener('input', e => {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(() => {
            state.q = e.target.value.trim();
            load();
        }, 300);
    });

    async function load() {
        const p = new URLSearchParams();
        if (state.country) p.set('country', state.country);
        if (state.q)       p.set('q', state.q);

        let data;
        try {
            data = await API.get('/api/destinations/?' + p.toString());
        } catch (_) { toast('Ошибка загрузки', 'err'); return; }

        document.getElementById('found-total').textContent = data.items.length;
        const el = document.getElementById('cards');
        if (!data.items.length) {
            el.innerHTML = '<div class="empty-block">Ничего не нашлось.</div>';
            return;
        }
        el.innerHTML = data.items.map(d => `
            <a class="dest-card" href="/destinations/${d.slug}">
                <div class="dest-card__photo">${Img.tag('dest-' + d.slug, d.title, 600, 400)}</div>
                <div class="dest-card__body">
                    <div class="dest-card__title">${d.title}</div>
                    <div class="dest-card__sum">${d.summary || ''}</div>
                    <div class="dest-card__country">${d.country}${d.city ? ' · город' : ' · страна'}</div>
                </div>
            </a>`).join('');
    }

    load();
})();
