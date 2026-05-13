/* Модалка "Забронировать экскурсию". В отличие от заявки тут пользователь
   обязан быть залогинен и сразу создаёт бронь с конкретной датой. */

const BookingModal = (() => {
    function open(excursion) {
        if (!Layout.user) {
            location.href = '/auth?next=' + encodeURIComponent(location.pathname);
            return;
        }
        if (!excursion.price_from) {
            toast('У этой экскурсии цена по запросу — оставьте заявку', '');
            return;
        }

        const u = Layout.user;
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const minDate = tomorrow.toISOString().slice(0, 10);

        const wrap = document.createElement('div');
        wrap.className = 'modal-backdrop';
        wrap.innerHTML = `
            <div class="modal" role="dialog" aria-modal="true">
                <div class="modal__head">
                    <div>
                        <h3>Бронирование</h3>
                        <div class="modal__sub">${excursion.title}</div>
                    </div>
                    <button class="modal__close" id="bm-close">${Icons.close(18)}</button>
                </div>

                <div class="field">
                    <label class="field__label">Дата</label>
                    <input class="field__input" name="departure_date" type="date" min="${minDate}" value="${minDate}">
                    <div class="field__error" id="bm-err-departure_date"></div>
                </div>
                <div class="field">
                    <label class="field__label">Количество туристов</label>
                    <input class="field__input" name="tourists" type="number" min="1" max="20" value="2">
                </div>
                <div class="field">
                    <label class="field__label">Телефон для связи</label>
                    <input class="field__input" name="contact_phone" type="tel" value="${u.phone || ''}">
                    <div class="field__error" id="bm-err-contact_phone"></div>
                </div>
                <div class="field">
                    <label class="field__label">Email</label>
                    <input class="field__input" name="contact_email" type="email" value="${u.email || ''}">
                    <div class="field__error" id="bm-err-contact_email"></div>
                </div>

                <div class="bm-summary" id="bm-summary"></div>

                <button class="btn btn--primary btn--lg btn--block" id="bm-submit">
                    Забронировать
                </button>
                <div style="font-size:11px;color:var(--muted);text-align:center;margin-top:8px;">
                    Без предоплаты · оплата на странице брони
                </div>
            </div>
        `;
        document.body.appendChild(wrap);

        const close = () => wrap.remove();
        wrap.addEventListener('click', e => { if (e.target === wrap) close(); });
        document.getElementById('bm-close').addEventListener('click', close);

        function recalc() {
            const t = Math.max(1, +wrap.querySelector('[name="tourists"]').value || 1);
            const base = excursion.price_from * t;
            document.getElementById('bm-summary').innerHTML = `
                <div class="bm-summary__row">
                    <span>${t} ${Fmt.plural(t, ['турист','туриста','туристов'])} × ${Fmt.money(excursion.price_from)}</span>
                    <span>${Fmt.money(base)}</span>
                </div>
                <div class="bm-summary__total">
                    <span>Итого</span>
                    <b>${Fmt.money(base)}</b>
                </div>
            `;
        }
        wrap.querySelector('[name="tourists"]').addEventListener('input', recalc);
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
