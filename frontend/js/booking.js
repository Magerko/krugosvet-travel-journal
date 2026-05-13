/* Страница брони — обзор + кнопки "Оплатить" / "Отменить". */

(async function () {
    const user = await Layout.mount({ active: '' });
    if (!user) {
        location.href = '/auth?next=' + encodeURIComponent(location.pathname);
        return;
    }

    const m = location.pathname.match(/\/booking\/(\d+)/);
    if (!m) { location.href = '/cabinet'; return; }
    const id = +m[1];

    let b;
    try {
        const r = await API.get('/api/bookings/' + id);
        b = r.booking;
    } catch (e) {
        toast('Бронь не найдена', 'err');
        setTimeout(() => location.href = '/cabinet', 1200);
        return;
    }

    document.title = `Бронь ${b.code} — Кругосвет`;
    document.getElementById('breadcrumbs').innerHTML =
        `<a href="/cabinet">Кабинет</a> / Брони / <span class="breadcrumbs__current">${b.code}</span>`;
    document.getElementById('booking-title').textContent = `Бронь ${b.code}`;

    // Левая колонка
    document.getElementById('booking-rows').innerHTML = [
        ['calendar', 'Дата экскурсии', Fmt.date(b.departure_date)],
        ['users',    'Туристов',       `${b.tourists} ${Fmt.plural(b.tourists, ['взр.','взр.','взр.'])}`],
        ['compass',  'Экскурсия',      b.excursion ? b.excursion.title : '—'],
        ['pin',      'Место',          b.excursion?.destination?.country
                                          + (b.excursion?.destination?.city ? ', ' + b.excursion.destination.city : '')],
    ].map(([ic, l, v]) => `
        <div class="aside-row">
            ${Icons[ic](16)}
            <div><label>${l}</label><b>${v}</b></div>
        </div>`).join('');

    document.getElementById('contact-rows').innerHTML = [
        ['users',  'ФИО',     user.full_name],
        ['users',  'Телефон', b.contact_phone || '—'],
        ['users',  'Email',   b.contact_email || '—'],
    ].map(([ic, l, v]) => `
        <div class="aside-row">
            ${Icons[ic](16)}
            <div><label>${l}</label><b>${v}</b></div>
        </div>`).join('');

    // Правая колонка — карточка экскурсии и сводка
    if (b.excursion) {
        document.getElementById('b-img').innerHTML = `
            <div style="height:140px;border-top-left-radius:10px;border-top-right-radius:10px;overflow:hidden;">
                ${Img.tag('exc-' + b.excursion.slug, b.excursion.title, 600, 280)}
            </div>`;
        document.getElementById('b-exc-title').textContent = b.excursion.title;
        document.getElementById('b-exc-meta').textContent =
            (b.excursion.duration || '') + ' · ' + (b.excursion.destination?.country || '');
    }

    document.getElementById('b-summary').innerHTML = `
        <div class="bm-summary__row">
            <span class="muted">${b.tourists} × экскурсия</span>
            <span>${Fmt.money(b.base_price)}</span>
        </div>
        ${b.discount ? `
            <div class="bm-summary__row" style="color:var(--success);">
                <span>Скидка постоянного клиента</span>
                <span>−${Fmt.money(b.discount)}</span>
            </div>` : ''}
    `;
    document.getElementById('b-total').textContent = Fmt.money(b.total_price);

    const STATUS_BADGE = {
        pending:   'badge--warn',
        paid:      'badge--ok',
        completed: 'badge--accent',
        cancelled: 'badge--mute',
    };
    document.getElementById('b-status').innerHTML =
        `<span class="badge ${STATUS_BADGE[b.status]}">● ${b.status_label}</span>`;

    // Кнопки оплаты / отмены
    const payBtn = document.getElementById('pay-btn');
    const cancelBtn = document.getElementById('cancel-btn');
    const card = document.getElementById('payment-card');

    if (b.status !== 'pending') {
        // Если уже оплачено / отменено — прячем кнопку оплаты
        payBtn.style.display = 'none';
        if (b.status !== 'pending' && b.status !== 'paid') {
            cancelBtn.style.display = 'none';
        }
        if (b.status === 'paid') {
            card.querySelector('h3').textContent = 'Оплачено';
            card.querySelector('p').textContent = 'Бронь подтверждена. Менеджер свяжется за день до экскурсии.';
        } else if (b.status === 'cancelled') {
            card.querySelector('h3').textContent = 'Отменено';
            card.querySelector('p').textContent = 'Бронь отменена.';
        }
    }

    payBtn.addEventListener('click', async () => {
        try {
            await API.post(`/api/bookings/${id}/pay`);
            toast('Оплата прошла', 'ok');
            setTimeout(() => location.reload(), 600);
        } catch (_) { toast('Ошибка оплаты', 'err'); }
    });

    cancelBtn.addEventListener('click', async () => {
        if (!confirm('Отменить бронь?')) return;
        try {
            await API.post(`/api/bookings/${id}/cancel`);
            toast('Бронь отменена', 'ok');
            setTimeout(() => location.reload(), 600);
        } catch (_) { toast('Ошибка отмены', 'err'); }
    });
})();
