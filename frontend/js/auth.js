/* Авторизация и регистрация на одной странице.
   Режим переключается ?mode=register или табами. */

(async function () {
    await Layout.mount({ active: '' });

    const params = new URLSearchParams(location.search);
    const next = params.get('next') || '/cabinet';

    // Если уже залогинен — сразу редиректим
    if (Layout.user) {
        location.href = next;
        return;
    }

    // Подставляем SVG-иконки в SSO-кнопки
    document.getElementById('sso-tg-ic').innerHTML     = Icons.telegram(18);
    document.getElementById('sso-google-ic').innerHTML = Icons.google(18);

    // SSO пока не подключён — показываем тост
    document.getElementById('sso-telegram').addEventListener('click', () =>
        toast('Вход через Telegram скоро будет доступен', ''));
    document.getElementById('sso-google').addEventListener('click', () =>
        toast('Вход через Google скоро будет доступен', ''));

    let mode = params.get('mode') === 'register' ? 'register' : 'login';

    function applyMode() {
        document.querySelectorAll('.auth-tab').forEach(t =>
            t.classList.toggle('is-active', t.dataset.mode === mode));

        const isReg = mode === 'register';

        // Заголовки
        document.getElementById('form-title').textContent = isReg ? 'Создайте аккаунт' : 'С возвращением';
        document.getElementById('form-desc').textContent  = isReg
            ? 'Регистрация занимает минуту.'
            : 'Войдите по email и паролю.';
        document.getElementById('poster-title').textContent = isReg
            ? 'Один аккаунт — все ваши поездки, скидки и любимые отели в одном месте.'
            : 'Войдите в личный кабинет — ваши брони, скидки и любимые отели уже ждут.';

        // Видимость полей
        document.getElementById('field-name').style.display  = isReg ? '' : 'none';
        document.getElementById('field-phone').style.display = isReg ? '' : 'none';
        document.getElementById('row-remember').style.display = isReg ? 'none' : '';

        document.getElementById('submit-btn').textContent = isReg ? 'Создать аккаунт' : 'Войти';

        document.getElementById('auth-foot').innerHTML = isReg
            ? `Уже есть аккаунт? <button data-switch="login">Войти →</button>`
            : `Нет аккаунта? <button data-switch="register">Зарегистрироваться →</button>`;

        document.querySelectorAll('[data-switch]').forEach(b =>
            b.addEventListener('click', () => { mode = b.dataset.switch; applyMode(); }));

        // Очищаем ошибки при переключении
        ['email', 'password', 'full_name'].forEach(f => {
            const el = document.getElementById('err-' + f);
            if (el) el.textContent = '';
        });
    }

    document.querySelectorAll('.auth-tab').forEach(t =>
        t.addEventListener('click', () => { mode = t.dataset.mode; applyMode(); }));

    applyMode();

    // Показ/скрытие пароля
    const pwdToggle = document.getElementById('pwd-toggle');
    pwdToggle.addEventListener('click', () => {
        const inp = document.querySelector('input[name="password"]');
        inp.type = inp.type === 'password' ? 'text' : 'password';
        pwdToggle.textContent = inp.type === 'password' ? 'показать' : 'скрыть';
    });

    // Сабмит формы
    document.getElementById('auth-form').addEventListener('submit', async (e) => {
        e.preventDefault();

        const data = Object.fromEntries(new FormData(e.target).entries());

        // Сбрасываем ошибки
        ['email', 'password', 'full_name'].forEach(f => {
            const el = document.getElementById('err-' + f);
            if (el) el.textContent = '';
        });

        try {
            if (mode === 'register') {
                await API.post('/api/auth/register', data);
            } else {
                await API.post('/api/auth/login', data);
            }
            location.href = next;
        } catch (err) {
            if (err.status === 400 && err.data?.error === 'validation') {
                for (const [f, msg] of Object.entries(err.data.fields || {})) {
                    const el = document.getElementById('err-' + f);
                    if (el) el.textContent = msg;
                }
            } else if (err.data?.error === 'email_taken') {
                document.getElementById('err-email').textContent = 'Этот email уже занят';
            } else if (err.data?.error === 'invalid_credentials') {
                document.getElementById('err-password').textContent = 'Неверный email или пароль';
            } else {
                toast('Ошибка соединения с сервером', 'err');
            }
        }
    });
})();
