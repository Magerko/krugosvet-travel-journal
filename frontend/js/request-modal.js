/* Модалка "Заявка на консультацию".
   Можно вызвать с любой страницы: RequestModal.open({ excursion }).
   Если юзер залогинен — поля имени/email подставлены, остальные пустые. */

const RequestModal = (() => {
    function open({ excursion = null } = {}) {
        const u = Layout.user;

        const wrap = document.createElement('div');
        wrap.className = 'modal-backdrop';
        wrap.innerHTML = `
            <div class="modal" role="dialog" aria-modal="true">
                <div class="modal__head">
                    <div>
                        <h3>Заявка на консультацию</h3>
                        <div class="modal__sub" id="rm-sub"></div>
                    </div>
                    <button class="modal__close" id="rm-close">${Icons.close(18)}</button>
                </div>

                <div class="field">
                    <label class="field__label">Имя</label>
                    <input class="field__input" name="full_name" value="${u?.full_name || ''}">
                    <div class="field__error" id="rm-err-full_name"></div>
                </div>
                <div class="field">
                    <label class="field__label">Email</label>
                    <input class="field__input" name="email" type="email" value="${u?.email || ''}">
                    <div class="field__error" id="rm-err-email"></div>
                </div>
                <div class="field">
                    <label class="field__label">Телефон</label>
                    <input class="field__input" name="phone" type="tel" value="${u?.phone || ''}" placeholder="+1 (___) ___-____">
                    <div class="field__error" id="rm-err-phone"></div>
                </div>
                <div class="field">
                    <label class="field__label">Желаемая дата (необязательно)</label>
                    <input class="field__input" name="desired_date" type="date">
                </div>
                <div class="field">
                    <label class="field__label">Комментарий (необязательно)</label>
                    <textarea class="field__input" name="message" rows="3" style="resize:vertical;"></textarea>
                </div>

                <button class="btn btn--primary btn--lg btn--block" id="rm-submit">
                    Отправить заявку
                </button>
                <div style="font-size:11px;color:var(--muted);text-align:center;margin-top:8px;">
                    Нажимая "Отправить", вы соглашаетесь на обработку персональных данных.
                </div>
            </div>
        `;
        document.body.appendChild(wrap);

        document.getElementById('rm-sub').textContent = excursion
            ? `Экскурсия: ${excursion.title}`
            : 'Свяжемся, чтобы подобрать вариант';

        function close() { wrap.remove(); }
        wrap.addEventListener('click', e => { if (e.target === wrap) close(); });
        document.getElementById('rm-close').addEventListener('click', close);

        document.getElementById('rm-submit').addEventListener('click', async () => {
            const data = {};
            ['full_name', 'email', 'phone', 'desired_date', 'message'].forEach(k => {
                const el = wrap.querySelector(`[name="${k}"]`);
                if (el) data[k] = el.value.trim();
            });
            if (excursion) data.excursion_id = excursion.id;

            // Сбросим ошибки
            ['full_name', 'email', 'phone'].forEach(k => {
                document.getElementById('rm-err-' + k).textContent = '';
            });

            try {
                await API.post('/api/requests/', data);
                close();
                toast('Заявка отправлена! Менеджер свяжется в течение часа.', 'ok', 5000);
            } catch (err) {
                if (err.data?.error === 'validation' && err.data.fields) {
                    for (const [f, msg] of Object.entries(err.data.fields)) {
                        const el = document.getElementById('rm-err-' + f);
                        if (el) el.textContent = msg;
                    }
                } else {
                    toast('Ошибка при отправке заявки', 'err');
                }
            }
        });
    }

    return { open };
})();

window.RequestModal = RequestModal;
