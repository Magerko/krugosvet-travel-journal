/* Стильная модалка бронирования экскурсии.
   Календарь-сетка на 4 недели вперёд, занятые даты помечаются точкой.
   Степпер +/- для количества туристов, анимированный итог. */

const BookingModal = (() => {
    const RU_MONTHS = ['января','февраля','марта','апреля','мая','июня',
                       'июля','августа','сентября','октября','ноября','декабря'];
    const RU_DOW = ['Пн','Вт','Ср','Чт','Пт','Сб','Вс'];

    // Локально-консистентный YYYY-MM-DD. toISOString() даёт UTC,
    // и в часовых поясах +X локальная полночь "перепрыгивает" на предыдущий день.
    function ymd(d) {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
    }

    function buildCalendar(weeks = 4) {
        // Сетка с понедельника текущей недели на N недель вперёд
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const mondayOffset = (today.getDay() + 6) % 7;  // вс=0 -> 6, пн=1 -> 0
        const start = new Date(today);
        start.setDate(today.getDate() - mondayOffset);

        const days = [];
        for (let i = 0; i < weeks * 7; i++) {
            const d = new Date(start);
            d.setDate(start.getDate() + i);
            days.push(d);
        }
        return { today, days };
    }

    async function fetchBooked(excursionId) {
        try {
            const r = await API.get(`/api/excursions/${excursionId}/availability`);
            const set = new Set();
            const counts = {};
            for (const b of r.booked || []) {
                set.add(b.date);
                counts[b.date] = b.people || b.bookings;
            }
            return { set, counts };
        } catch (_) { return { set: new Set(), counts: {} }; }
    }

    async function open(excursion) {
        if (!Layout.user) {
            location.href = '/auth?next=' + encodeURIComponent(location.pathname);
            return;
        }
        if (!excursion.price_from) {
            toast('У этой экскурсии цена по запросу — оставьте заявку', '');
            return;
        }

        const u = Layout.user;
        const { today, days } = buildCalendar(4);

        // Начально-выбранная дата: первый будущий день
        let selected = days.find(d => d >= today) || days[0];

        // Сначала рисуем модалку с placeholder-календарём, потом подгружаем занятые
        const wrap = document.createElement('div');
        wrap.className = 'modal-backdrop';
        wrap.innerHTML = `
            <div class="modal modal--booking" role="dialog" aria-modal="true">
                <div class="bm-hero">
                    <div class="bm-hero__img">
                        ${Img.tag('exc-' + excursion.slug, excursion.title, 800, 360)}
                    </div>
                    <button class="bm-hero__close" id="bm-close" aria-label="Закрыть">
                        ${Icons.close(18)}
                    </button>
                    <div class="bm-hero__caption">
                        <div class="bm-hero__kind">${Fmt.esc(excursion.kind_label || 'Экскурсия')} · ${Fmt.esc(excursion.duration || '')}</div>
                        <h3 class="bm-hero__title">${Fmt.esc(excursion.title)}</h3>
                        <div class="bm-hero__price">
                            <span class="muted">от</span>
                            <b>${Fmt.money(excursion.price_from)}</b>
                            <span class="muted">/ чел.</span>
                        </div>
                    </div>
                </div>

                <div class="bm-body">
                    <div class="bm-section">
                        <div class="bm-section__head">
                            <h4>Выберите дату</h4>
                            <div class="bm-section__hint">
                                <span class="bm-dot"></span> уже бронируют
                            </div>
                        </div>
                        <div class="bm-cal" id="bm-cal"></div>
                        <div class="bm-cal-selected" id="bm-cal-sel"></div>
                        <input type="hidden" name="departure_date" id="bm-date">
                        <div class="field__error" id="bm-err-departure_date"></div>
                    </div>

                    <div class="bm-section bm-row-2">
                        <div>
                            <h4>Туристов</h4>
                            <div class="bm-stepper">
                                <button type="button" class="bm-stepper__btn" data-step="-1" aria-label="Уменьшить">−</button>
                                <input type="number" class="bm-stepper__num" name="tourists" min="1" max="20" value="2">
                                <button type="button" class="bm-stepper__btn" data-step="+1" aria-label="Увеличить">+</button>
                            </div>
                        </div>
                        <div>
                            <h4>Языки гида</h4>
                            <div class="bm-readonly">${Fmt.esc(excursion.languages || 'русский')}</div>
                        </div>
                    </div>

                    <div class="bm-section">
                        <h4>Связь</h4>
                        <div class="bm-row-2">
                            <div class="field" style="margin:0;">
                                <label class="field__label">Телефон</label>
                                <input class="field__input" name="contact_phone" type="tel" value="${Fmt.esc(u.phone || '')}">
                                <div class="field__error" id="bm-err-contact_phone"></div>
                            </div>
                            <div class="field" style="margin:0;">
                                <label class="field__label">Email</label>
                                <input class="field__input" name="contact_email" type="email" value="${Fmt.esc(u.email || '')}">
                                <div class="field__error" id="bm-err-contact_email"></div>
                            </div>
                        </div>
                    </div>

                    <div class="bm-summary" id="bm-summary"></div>

                    <button class="btn btn--primary btn--lg btn--block" id="bm-submit">
                        Забронировать
                    </button>
                    <div style="font-size:11px;color:var(--muted);text-align:center;margin-top:8px;">
                        Без предоплаты · оплата на странице брони
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(wrap);

        // Запрашиваем занятые даты
        const { set: bookedSet, counts: bookedCounts } = await fetchBooked(excursion.id);

        function renderCal() {
            // Группируем по месяцам для подписи
            const html = [];
            html.push('<div class="bm-cal__dow">' +
                RU_DOW.map(d => `<span>${d}</span>`).join('') +
                '</div>');
            html.push('<div class="bm-cal__grid">');
            let lastMonth = -1;
            for (const d of days) {
                const iso = ymd(d);
                const isPast = d < today;
                const isToday = ymd(d) === ymd(today);
                const isSelected = ymd(d) === ymd(selected);
                const isBooked = bookedSet.has(iso);
                const showMonth = d.getMonth() !== lastMonth;
                lastMonth = d.getMonth();

                const cls = [
                    'bm-day',
                    isPast ? 'is-past' : '',
                    isToday ? 'is-today' : '',
                    isSelected ? 'is-selected' : '',
                    isBooked ? 'is-booked' : '',
                ].filter(Boolean).join(' ');

                html.push(`
                    <button type="button" class="${cls}" data-date="${iso}" ${isPast ? 'disabled' : ''}>
                        ${showMonth ? `<span class="bm-day__month">${RU_MONTHS[d.getMonth()].slice(0,3)}</span>` : ''}
                        <span class="bm-day__num">${d.getDate()}</span>
                        ${isBooked ? '<span class="bm-day__dot"></span>' : ''}
                    </button>`);
            }
            html.push('</div>');
            document.getElementById('bm-cal').innerHTML = html.join('');

            // Подпись выбранной даты + информация о брони
            const iso = ymd(selected);
            const bookedNote = bookedCounts[iso]
                ? `<span class="muted">— на эту дату уже ${bookedCounts[iso]} ${Fmt.plural(bookedCounts[iso], ['бронь','брони','броней'])}</span>`
                : '<span class="muted">— свободно</span>';
            document.getElementById('bm-cal-sel').innerHTML =
                `<b>${selected.getDate()} ${RU_MONTHS[selected.getMonth()]} ${selected.getFullYear()}</b> ${bookedNote}`;
            document.getElementById('bm-date').value = iso;

            // Клики
            document.querySelectorAll('#bm-cal .bm-day').forEach(b =>
                b.addEventListener('click', () => {
                    const iso = b.dataset.date;
                    const [y, m, day] = iso.split('-').map(Number);
                    selected = new Date(y, m - 1, day);
                    renderCal();
                    recalc();
                }));
        }

        function recalc() {
            const t = Math.max(1, +wrap.querySelector('[name="tourists"]').value || 1);
            const base = excursion.price_from * t;
            document.getElementById('bm-summary').innerHTML = `
                <div class="bm-summary__row">
                    <span class="muted">${t} ${Fmt.plural(t, ['турист','туриста','туристов'])} × ${Fmt.money(excursion.price_from)}</span>
                    <span>${Fmt.money(base)}</span>
                </div>
                <div class="bm-summary__total">
                    <span>К оплате</span>
                    <b>${Fmt.money(base)}</b>
                </div>
            `;
        }

        const close = () => wrap.remove();
        wrap.addEventListener('click', e => { if (e.target === wrap) close(); });
        document.getElementById('bm-close').addEventListener('click', close);

        // Степпер +/-
        wrap.querySelectorAll('.bm-stepper__btn').forEach(b =>
            b.addEventListener('click', () => {
                const input = wrap.querySelector('[name="tourists"]');
                let v = +input.value || 1;
                v = Math.min(20, Math.max(1, v + (+b.dataset.step)));
                input.value = v;
                recalc();
            }));
        wrap.querySelector('[name="tourists"]').addEventListener('input', recalc);

        renderCal();
        recalc();

        document.getElementById('bm-submit').addEventListener('click', async () => {
            const data = { excursion_id: excursion.id };
            ['departure_date','tourists','contact_phone','contact_email'].forEach(k => {
                data[k] = wrap.querySelector(`[name="${k}"]`).value.trim();
            });
            ['contact_phone','contact_email','departure_date'].forEach(k => {
                const el = document.getElementById('bm-err-' + k);
                if (el) el.textContent = '';
            });

            try {
                const r = await API.post('/api/bookings/', data);
                close();
                toast('Бронь создана', 'ok');
                setTimeout(() => location.href = '/booking/' + r.booking.id, 400);
            } catch (err) {
                if (err.data?.fields) {
                    for (const [f, msg] of Object.entries(err.data.fields)) {
                        const el = document.getElementById('bm-err-' + f);
                        if (el) el.textContent = msg;
                    }
                } else if (err.data?.error === 'price_on_request') {
                    toast(err.data.message || 'Цена по запросу — заявка вместо брони', '');
                } else {
                    toast('Не удалось создать бронь', 'err');
                }
            }
        });
    }

    return { open };
})();

window.BookingModal = BookingModal;
