/* Админка. Большая, но с понятным разделением: каждая секция —
   своя загрузка + рендер. CRUD для статей и экскурсий через модалку.
   Доступ только для is_admin — иначе редирект. */

(async function () {
    const user = await Layout.mount({ active: '' });
    if (!user) { location.href = '/auth?next=/admin'; return; }
    if (!user.is_admin) { toast('Доступ только администраторам', 'err'); setTimeout(() => location.href = '/', 1200); return; }

    // Иконки в навигации
    document.getElementById('ic-art').innerHTML  = Icons.calendar(15);
    document.getElementById('ic-exc').innerHTML  = Icons.compass(15);
    document.getElementById('ic-dest').innerHTML = Icons.pin(15);
    document.getElementById('ic-req').innerHTML  = Icons.users(15);
    document.getElementById('ic-com').innerHTML  = Icons.search(15);

    // ----- KPI и аудит — общие для всех секций -----
    async function loadStats() {
        let s, audit;
        try {
            s = await API.get('/api/admin/stats');
            audit = await API.get('/api/admin/audit');
        } catch (_) { toast('Не удалось загрузить статистику', 'err'); return; }

        document.getElementById('cnt-articles').textContent     = s.articles;
        document.getElementById('cnt-excursions').textContent   = s.excursions;
        document.getElementById('cnt-destinations').textContent = s.destinations;
        document.getElementById('cnt-requests').textContent     = s.requests_total;
        document.getElementById('cnt-comments').textContent     = s.comments_pending;

        document.getElementById('kpis').innerHTML = [
            ['Опубликованных статей', s.articles_published, `всего ${s.articles}`],
            ['Экскурсий и пакетов',   s.excursions,         '—'],
            ['Новых заявок',          s.requests_new,       `всего ${s.requests_total}`],
            ['Комментариев на модерации', s.comments_pending, '—'],
        ].map(([l, n, sub]) => `
            <div class="admin-kpi">
                <div class="admin-kpi__num">${n}</div>
                <div class="admin-kpi__label">${l}</div>
                <div class="admin-kpi__sub">${sub}</div>
            </div>`).join('');

        document.getElementById('art-count').textContent = s.articles;
        document.getElementById('exc-count').textContent = s.excursions;
        document.getElementById('dest-count').textContent = s.destinations;

        document.getElementById('db-tables').textContent = `8 таблиц · ${s.users} пользователей`;
        document.getElementById('db-uptime').textContent = `обновлено ${Fmt.dateTime(new Date().toISOString())}`;

        // Лог активности
        document.getElementById('audit-list').innerHTML = audit.items.map(r => `
            <div class="audit__row">
                <span class="audit__time">${Fmt.dateTime(r.created_at)}</span>
                <span class="audit__op-${r.op}">${r.op}</span>
                <span class="audit__table">${r.table_name}</span>
                <span class="audit__msg">${r.message || ''}</span>
            </div>`).join('');
    }
    await loadStats();

    // ----- Переключение секций -----
    document.querySelectorAll('.admin-nav__item').forEach(it =>
        it.addEventListener('click', () => {
            document.querySelectorAll('.admin-nav__item').forEach(x => x.classList.toggle('is-active', x === it));
            const s = it.dataset.section;
            ['articles','excursions','destinations','requests','comments'].forEach(k =>
                document.getElementById('section-' + k).style.display = k === s ? '' : 'none');
        }));

    // =================== СТАТЬИ ===================
    let allArticles = [];
    async function loadArticles() {
        try {
            const r = await API.get('/api/admin/articles');
            allArticles = r.items;
        } catch (_) { return; }
        renderArticles();
    }
    function renderArticles() {
        const search = document.getElementById('art-search').value.trim().toLowerCase();
        const items = search
            ? allArticles.filter(a => a.title.toLowerCase().includes(search))
            : allArticles;

        const tbody = document.getElementById('art-tbody');
        if (!items.length) {
            tbody.innerHTML = `<tr><td colspan="7" class="empty-block" style="background:transparent;border:none;">Пусто</td></tr>`;
            return;
        }
        tbody.innerHTML = items.map(a => `
            <tr data-id="${a.id}">
                <td class="mono muted">${a.id}</td>
                <td>
                    <div style="font-family:var(--font-serif);font-weight:700;font-size:13px;">${a.title}</div>
                    <div class="muted" style="font-size:11px;font-family:var(--font-mono);">/${a.slug}</div>
                </td>
                <td>${a.category?.name || '—'}</td>
                <td>${a.is_published
                    ? '<span class="badge badge--ok">да</span>'
                    : '<span class="badge badge--mute">нет</span>'}</td>
                <td>${a.views}</td>
                <td class="mono muted">${Fmt.dateShort(a.published_at)}</td>
                <td>
                    <span class="action js-edit-art">править</span>
                    <span class="action action--danger js-del-art">удалить</span>
                </td>
            </tr>`).join('');

        tbody.querySelectorAll('.js-edit-art').forEach(el =>
            el.addEventListener('click', e => {
                const id = +e.target.closest('tr').dataset.id;
                openArticleForm(allArticles.find(a => a.id === id));
            }));
        tbody.querySelectorAll('.js-del-art').forEach(el =>
            el.addEventListener('click', async e => {
                const id = +e.target.closest('tr').dataset.id;
                if (!confirm('Удалить статью? Действие необратимо.')) return;
                try {
                    await API.del('/api/admin/articles/' + id);
                    toast('Статья удалена', 'ok');
                    await loadArticles();
                    await loadStats();
                } catch (_) { toast('Ошибка удаления', 'err'); }
            }));
    }
    document.getElementById('art-search').addEventListener('input', renderArticles);
    document.getElementById('btn-new-article').addEventListener('click', () => openArticleForm(null));

    async function openArticleForm(article) {
        // Подгружаем категории и места для выпадашек
        const [cats, dests] = await Promise.all([
            API.get('/api/articles/categories'),
            API.get('/api/destinations-list'),
        ]);

        const isNew = !article;
        const wrap = document.createElement('div');
        wrap.className = 'modal-backdrop';
        wrap.innerHTML = `
            <div class="modal admin-modal-form" style="width: 580px; max-height: 90vh; overflow: auto;">
                <div class="modal__head">
                    <div>
                        <h3>${isNew ? 'Новая статья' : 'Редактировать статью'}</h3>
                        <div class="modal__sub">${isNew ? '' : 'ID: ' + article.id}</div>
                    </div>
                    <button class="modal__close js-close">${Icons.close(18)}</button>
                </div>

                <div class="row-2">
                    <div class="field">
                        <label class="field__label">Заголовок</label>
                        <input class="field__input" name="title" value="${article?.title || ''}">
                    </div>
                    <div class="field">
                        <label class="field__label">Slug (URL)</label>
                        <input class="field__input" name="slug" value="${article?.slug || ''}" ${isNew ? '' : 'disabled'}>
                    </div>
                </div>
                <div class="row-2">
                    <div class="field">
                        <label class="field__label">Категория</label>
                        <select class="field__select" name="category_id">
                            <option value="">—</option>
                            ${cats.items.map(c => `<option value="${c.id}" ${article?.category?.id === c.id ? 'selected' : ''}>${c.name}</option>`).join('')}
                        </select>
                    </div>
                    <div class="field">
                        <label class="field__label">Привязка к месту</label>
                        <select class="field__select" name="destination_id">
                            <option value="">—</option>
                            ${dests.items.map(d => `<option value="${d.id}" ${article?.destination?.id === d.id ? 'selected' : ''}>${d.title}</option>`).join('')}
                        </select>
                    </div>
                </div>
                <div class="field">
                    <label class="field__label">Краткое описание</label>
                    <textarea name="summary" rows="2">${article?.summary || ''}</textarea>
                </div>
                <div class="field">
                    <label class="field__label">Текст</label>
                    <textarea name="body" rows="6">${article?.body || ''}</textarea>
                </div>
                <div class="row-2">
                    <div class="field">
                        <label class="field__label">Автор</label>
                        <input class="field__input" name="author" value="${article?.author || 'Редакция «Кругосвет»'}">
                    </div>
                    <div class="field">
                        <label class="field__label">Время чтения, мин</label>
                        <input class="field__input" name="reading_time" type="number" value="${article?.reading_time || 5}">
                    </div>
                </div>
                <div style="display:flex;gap:18px;margin:8px 0 18px;">
                    <label class="check">
                        <input type="checkbox" name="is_published" ${article === null || article?.is_published ? 'checked' : ''}>
                        <span class="check__box"></span>Опубликовано
                    </label>
                    <label class="check">
                        <input type="checkbox" name="is_featured" ${article?.is_featured ? 'checked' : ''}>
                        <span class="check__box"></span>На главную
                    </label>
                </div>

                <div style="display: flex; justify-content: flex-end; gap: 8px;">
                    <button class="btn btn--ghost js-close">Отмена</button>
                    <button class="btn btn--primary js-save">Сохранить</button>
                </div>
            </div>`;
        document.body.appendChild(wrap);
        wrap.querySelectorAll('.js-close').forEach(b => b.addEventListener('click', () => wrap.remove()));

        wrap.querySelector('.js-save').addEventListener('click', async () => {
            const data = {};
            ['title','slug','summary','body','author'].forEach(k =>
                data[k] = wrap.querySelector(`[name="${k}"]`).value.trim());
            data.category_id    = +wrap.querySelector('[name="category_id"]').value || null;
            data.destination_id = +wrap.querySelector('[name="destination_id"]').value || null;
            data.reading_time   = +wrap.querySelector('[name="reading_time"]').value || 5;
            data.is_published   = wrap.querySelector('[name="is_published"]').checked;
            data.is_featured    = wrap.querySelector('[name="is_featured"]').checked;

            try {
                if (isNew) {
                    await API.post('/api/admin/articles', data);
                } else {
                    delete data.slug; // slug нельзя менять
                    await API.put('/api/admin/articles/' + article.id, data);
                }
                wrap.remove();
                toast('Сохранено', 'ok');
                await loadArticles();
                await loadStats();
            } catch (e) {
                if (e.data?.error === 'slug_taken') toast('Такой slug уже занят', 'err');
                else toast('Ошибка сохранения', 'err');
            }
        });
    }

    // =================== ЭКСКУРСИИ ===================
    let allExcursions = [];
    async function loadExcursions() {
        try {
            const r = await API.get('/api/admin/excursions');
            allExcursions = r.items;
        } catch (_) { return; }
        renderExcursions();
    }
    function renderExcursions() {
        const tbody = document.getElementById('exc-tbody');
        if (!allExcursions.length) {
            tbody.innerHTML = `<tr><td colspan="7" class="muted" style="padding:24px;text-align:center;">Пусто</td></tr>`;
            return;
        }
        tbody.innerHTML = allExcursions.map(e => `
            <tr data-id="${e.id}">
                <td class="mono muted">${e.id}</td>
                <td>
                    <div style="font-family:var(--font-serif);font-weight:700;font-size:13px;">${e.title}</div>
                    <div class="muted" style="font-size:11px;font-family:var(--font-mono);">/${e.slug}</div>
                </td>
                <td>${e.kind_label}</td>
                <td>${e.destination?.country || '—'}${e.destination?.city ? ', ' + e.destination.city : ''}</td>
                <td class="mono">${e.duration || '—'}</td>
                <td>${e.price_from ? Fmt.rub(e.price_from) : '<span class="muted">по запросу</span>'}</td>
                <td>
                    <span class="action js-edit-exc">править</span>
                    <span class="action action--danger js-del-exc">удалить</span>
                </td>
            </tr>`).join('');

        tbody.querySelectorAll('.js-edit-exc').forEach(el =>
            el.addEventListener('click', e => {
                const id = +e.target.closest('tr').dataset.id;
                openExcursionForm(allExcursions.find(x => x.id === id));
            }));
        tbody.querySelectorAll('.js-del-exc').forEach(el =>
            el.addEventListener('click', async e => {
                const id = +e.target.closest('tr').dataset.id;
                if (!confirm('Удалить экскурсию?')) return;
                try {
                    await API.del('/api/admin/excursions/' + id);
                    toast('Удалено', 'ok');
                    await loadExcursions();
                    await loadStats();
                } catch (_) { toast('Ошибка', 'err'); }
            }));
    }
    document.getElementById('btn-new-excursion').addEventListener('click', () => openExcursionForm(null));

    async function openExcursionForm(exc) {
        const dests = await API.get('/api/destinations-list');
        const isNew = !exc;

        const wrap = document.createElement('div');
        wrap.className = 'modal-backdrop';
        wrap.innerHTML = `
            <div class="modal admin-modal-form" style="width: 580px; max-height: 90vh; overflow: auto;">
                <div class="modal__head">
                    <div><h3>${isNew ? 'Новая экскурсия' : 'Редактировать'}</h3></div>
                    <button class="modal__close js-close">${Icons.close(18)}</button>
                </div>
                <div class="row-2">
                    <div class="field">
                        <label class="field__label">Название</label>
                        <input class="field__input" name="title" value="${exc?.title || ''}">
                    </div>
                    <div class="field">
                        <label class="field__label">Slug</label>
                        <input class="field__input" name="slug" value="${exc?.slug || ''}" ${isNew ? '' : 'disabled'}>
                    </div>
                </div>
                <div class="row-2">
                    <div class="field">
                        <label class="field__label">Тип</label>
                        <select class="field__select" name="kind">
                            <option value="excursion" ${exc?.kind === 'excursion' || !exc ? 'selected' : ''}>Экскурсия</option>
                            <option value="package" ${exc?.kind === 'package' ? 'selected' : ''}>Тур-пакет</option>
                        </select>
                    </div>
                    <div class="field">
                        <label class="field__label">Место</label>
                        <select class="field__select" name="destination_id">
                            ${dests.items.map(d => `<option value="${d.id}" ${exc?.destination?.id === d.id ? 'selected' : ''}>${d.title}</option>`).join('')}
                        </select>
                    </div>
                </div>
                <div class="field">
                    <label class="field__label">Краткое описание</label>
                    <textarea name="summary" rows="2">${exc?.summary || ''}</textarea>
                </div>
                <div class="field">
                    <label class="field__label">Полное описание</label>
                    <textarea name="description" rows="4">${exc?.description || ''}</textarea>
                </div>
                <div class="field">
                    <label class="field__label">Программа</label>
                    <textarea name="program" rows="3">${exc?.program || ''}</textarea>
                </div>
                <div class="row-2">
                    <div class="field">
                        <label class="field__label">Длительность</label>
                        <input class="field__input" name="duration" value="${exc?.duration || ''}">
                    </div>
                    <div class="field">
                        <label class="field__label">Цена от, $</label>
                        <input class="field__input" name="price_from" type="number" value="${exc?.price_from || ''}">
                    </div>
                </div>
                <div class="row-2">
                    <div class="field">
                        <label class="field__label">Языки гида</label>
                        <input class="field__input" name="languages" value="${exc?.languages || 'русский'}">
                    </div>
                    <div class="field">
                        <label class="field__label">Размер группы</label>
                        <input class="field__input" name="group_size" value="${exc?.group_size || ''}">
                    </div>
                </div>
                <label class="check" style="margin: 8px 0 18px;">
                    <input type="checkbox" name="is_featured" ${exc?.is_featured ? 'checked' : ''}>
                    <span class="check__box"></span>На главную
                </label>
                <div style="display: flex; justify-content: flex-end; gap: 8px;">
                    <button class="btn btn--ghost js-close">Отмена</button>
                    <button class="btn btn--primary js-save">Сохранить</button>
                </div>
            </div>`;
        document.body.appendChild(wrap);
        wrap.querySelectorAll('.js-close').forEach(b => b.addEventListener('click', () => wrap.remove()));

        wrap.querySelector('.js-save').addEventListener('click', async () => {
            const data = {};
            ['title','slug','summary','description','program','duration','languages','group_size'].forEach(k =>
                data[k] = wrap.querySelector(`[name="${k}"]`).value.trim());
            data.kind           = wrap.querySelector('[name="kind"]').value;
            data.destination_id = +wrap.querySelector('[name="destination_id"]').value;
            const pf = wrap.querySelector('[name="price_from"]').value;
            data.price_from     = pf ? +pf : null;
            data.is_featured    = wrap.querySelector('[name="is_featured"]').checked;

            try {
                if (isNew) await API.post('/api/admin/excursions', data);
                else { delete data.slug; await API.put('/api/admin/excursions/' + exc.id, data); }
                wrap.remove();
                toast('Сохранено', 'ok');
                await loadExcursions();
                await loadStats();
            } catch (e) {
                if (e.data?.error === 'slug_taken') toast('Такой slug уже занят', 'err');
                else toast('Ошибка', 'err');
            }
        });
    }

    // =================== МЕСТА ===================
    async function loadDestinations() {
        try {
            const r = await API.get('/api/admin/destinations');
            const tbody = document.getElementById('dest-tbody');
            tbody.innerHTML = r.items.map(d => `
                <tr>
                    <td class="mono muted">${d.id}</td>
                    <td>
                        <div style="font-family:var(--font-serif);font-weight:700;font-size:13px;">${d.title}</div>
                        <div class="muted" style="font-size:11px;font-family:var(--font-mono);">/${d.slug}</div>
                    </td>
                    <td>${d.country}</td>
                    <td>${d.city || '<span class="muted">— страна —</span>'}</td>
                    <td>${d.best_season || '—'}</td>
                    <td>${d.is_featured ? '<span class="badge badge--ochre">да</span>' : '—'}</td>
                </tr>`).join('');
        } catch (_) {}
    }

    // =================== ЗАЯВКИ ===================
    let reqStatus = '';
    async function loadRequests() {
        try {
            const url = '/api/admin/requests' + (reqStatus ? `?status=${reqStatus}` : '');
            const r = await API.get(url);
            renderRequests(r.items);
        } catch (_) {}
    }
    function renderRequests(items) {
        const tbody = document.getElementById('req-tbody');
        if (!items.length) {
            tbody.innerHTML = `<tr><td colspan="6" class="muted" style="padding:24px;text-align:center;">Заявок нет</td></tr>`;
            return;
        }
        tbody.innerHTML = items.map(r => `
            <tr>
                <td class="mono muted">${r.id}</td>
                <td class="mono muted">${Fmt.dateTime(r.created_at)}</td>
                <td>${r.full_name}</td>
                <td>
                    <div>${r.email}</div>
                    <div class="muted">${r.phone}</div>
                </td>
                <td>${r.excursion ? r.excursion.title : '<span class="muted">общая</span>'}</td>
                <td>
                    <select class="field__select js-status" data-id="${r.id}" style="padding:5px 8px;font-size:12px;">
                        <option value="new"       ${r.status === 'new'       ? 'selected' : ''}>новая</option>
                        <option value="in_work"   ${r.status === 'in_work'   ? 'selected' : ''}>в работе</option>
                        <option value="done"      ${r.status === 'done'      ? 'selected' : ''}>обработана</option>
                        <option value="cancelled" ${r.status === 'cancelled' ? 'selected' : ''}>отменена</option>
                    </select>
                </td>
            </tr>`).join('');

        tbody.querySelectorAll('.js-status').forEach(sel =>
            sel.addEventListener('change', async e => {
                try {
                    await API.put('/api/admin/requests/' + e.target.dataset.id, { status: e.target.value });
                    toast('Статус обновлён', 'ok');
                    await loadStats();
                } catch (_) { toast('Ошибка', 'err'); }
            }));
    }
    document.querySelectorAll('#section-requests .tag-pill').forEach(p =>
        p.addEventListener('click', () => {
            reqStatus = p.dataset.status;
            document.querySelectorAll('#section-requests .tag-pill').forEach(x =>
                x.classList.toggle('is-active', x === p));
            loadRequests();
        }));

    // =================== КОММЕНТАРИИ ===================
    async function loadComments() {
        try {
            const r = await API.get('/api/admin/comments');
            renderComments(r.items);
        } catch (_) {}
    }
    function renderComments(items) {
        const tbody = document.getElementById('com-tbody');
        if (!items.length) {
            tbody.innerHTML = `<tr><td colspan="6" class="muted" style="padding:24px;text-align:center;">Комментариев нет</td></tr>`;
            return;
        }
        tbody.innerHTML = items.map(c => `
            <tr data-id="${c.id}">
                <td class="mono muted">${c.id}</td>
                <td class="mono muted">${c.target_type} #${c.target_id}</td>
                <td>${c.user_name}</td>
                <td style="max-width: 360px; overflow: hidden; text-overflow: ellipsis;">${c.body}</td>
                <td>${c.is_approved
                    ? '<span class="badge badge--ok">опубл.</span>'
                    : '<span class="badge badge--warn">скрыт</span>'}</td>
                <td>
                    <span class="action js-toggle-com">${c.is_approved ? 'скрыть' : 'опубликовать'}</span>
                    <span class="action action--danger js-del-com">удалить</span>
                </td>
            </tr>`).join('');

        tbody.querySelectorAll('.js-toggle-com').forEach(el =>
            el.addEventListener('click', async e => {
                const id = +e.target.closest('tr').dataset.id;
                const c = items.find(x => x.id === id);
                try {
                    await API.put('/api/admin/comments/' + id, { is_approved: !c.is_approved });
                    toast('Сохранено', 'ok');
                    await loadComments();
                    await loadStats();
                } catch (_) { toast('Ошибка', 'err'); }
            }));
        tbody.querySelectorAll('.js-del-com').forEach(el =>
            el.addEventListener('click', async e => {
                const id = +e.target.closest('tr').dataset.id;
                if (!confirm('Удалить комментарий?')) return;
                try {
                    await API.del('/api/admin/comments/' + id);
                    toast('Удалено', 'ok');
                    await loadComments();
                } catch (_) { toast('Ошибка', 'err'); }
            }));
    }

    // ----- Запускаем загрузку всех секций сразу -----
    await Promise.all([
        loadArticles(),
        loadExcursions(),
        loadDestinations(),
        loadRequests(),
        loadComments(),
    ]);
})();
