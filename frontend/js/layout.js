/* Общие куски разметки — шапка и футер.
   Рендерим их в JS, чтобы не дублировать одинаковый HTML по всем страницам.
   Каждая страница должна вызвать Layout.mount({ active: 'home' | 'catalog' | ...}). */

const Layout = (() => {

    const NAV_ITEMS = [
        { key: 'home',         href: '/',             label: 'Главная' },
        { key: 'excursions',   href: '/excursions',   label: 'Экскурсии' },
        { key: 'destinations', href: '/destinations', label: 'Места' },
        { key: 'news',         href: '/news',         label: 'Новости' },
        { key: 'contacts',     href: '/contacts',     label: 'Контакты' },
    ];

    let _user = null;  // храним текущего юзера, чтобы шапка могла его отрисовать

    function header(active) {
        const themeIcon = Theme.current === 'light' ? '◐ dark' : '◑ light';

        let userBlock;
        if (_user) {
            const initials = (_user.full_name || '?').split(' ').map(s => s[0]).join('').slice(0, 2).toUpperCase();
            userBlock = `
                <a href="${_user.is_admin ? '/admin' : '/cabinet'}" class="user-link" style="display:flex; align-items:center; gap:8px;">
                    <span style="width:28px;height:28px;border-radius:14px;background:var(--accent);
                                color:var(--accent-ink);display:flex;align-items:center;justify-content:center;
                                font-family:var(--font-serif);font-size:12px;font-weight:700;">
                        ${initials}
                    </span>
                    <span>${_user.full_name.split(' ')[0]}</span>
                </a>
                <button class="btn btn--ghost" id="logout-btn" style="padding:7px 12px;font-size:12px;">Выйти</button>`;
        } else {
            userBlock = `
                <a href="/auth" class="user-link">Войти</a>
                <a href="/auth?mode=register" class="btn btn--primary">Регистрация</a>`;
        }

        return `
            <header class="site-header">
                <a href="/" class="brand">
                    <span class="brand__mark">${Icons.compass(20)}</span>
                    <span>
                        <div class="brand__name">Кругосвет</div>
                        <div class="brand__sub">est. 2026 · турагентство</div>
                    </span>
                </a>
                <nav class="site-nav">
                    ${NAV_ITEMS.map(it => `
                        <a href="${it.href}" class="${it.key === active ? 'is-active' : ''}">${it.label}</a>
                    `).join('')}
                </nav>
                <div class="header-actions">
                    <button class="theme-toggle" id="theme-toggle">${themeIcon}</button>
                    ${userBlock}
                </div>
            </header>`;
    }

    function footer() {
        return `
            <footer class="site-footer">
                <div class="site-footer__grid">
                    <div>
                        <div class="site-footer__brand">
                            ${Icons.compass(20)}
                            <span>Кругосвет</span>
                        </div>
                        <div style="line-height:1.65;max-width:320px;opacity:.85;">
                            Независимое издание о&nbsp;путешествиях. Новости индустрии, гиды
                            по&nbsp;странам и&nbsp;подборки экскурсий — без проплаченных рекомендаций.
                        </div>
                        <div class="site-footer__socials">
                            <a href="#" aria-label="Telegram">${Icons.telegram(18)}</a>
                            <a href="#" aria-label="Instagram">${Icons.instagram(18)}</a>
                            <a href="#" aria-label="RSS">${Icons.rss(18)}</a>
                        </div>
                    </div>
                    <div>
                        <h4>Компания</h4>
                        <div class="site-footer__links">
                            О нас<br>Команда<br>Контакты
                        </div>
                    </div>
                    <div>
                        <h4>Туристам</h4>
                        <div class="site-footer__links">
                            Как бронировать<br>Визы<br>Страховка
                        </div>
                    </div>
                    <div>
                        <h4>Связь</h4>
                        <div class="site-footer__links">
                            +1 (555) 010-0001<br>hello@krugosvet.travel<br>Telegram-бот
                        </div>
                    </div>
                </div>
            </footer>`;
    }

    function bindHandlers() {
        const tg = document.getElementById('theme-toggle');
        if (tg) tg.addEventListener('click', () => {
            Theme.toggle();
            tg.textContent = Theme.current === 'light' ? '◐ dark' : '◑ light';
        });

        const lo = document.getElementById('logout-btn');
        if (lo) lo.addEventListener('click', async () => {
            try { await API.post('/api/auth/logout'); } catch (_) {}
            location.href = '/';
        });
    }

    async function mount({ active = '' } = {}) {
        // Узнаём, кто в системе
        try {
            const r = await API.get('/api/auth/me');
            _user = r.user;
        } catch (_) { _user = null; }

        const headEl = document.getElementById('layout-header');
        const footEl = document.getElementById('layout-footer');
        if (headEl) headEl.outerHTML = header(active);
        if (footEl) footEl.outerHTML = footer();

        // Жду, чтобы DOM успел обновиться, и навешиваю обработчики
        bindHandlers();
        return _user;
    }

    return { mount, get user() { return _user; } };
})();

window.Layout = Layout;
