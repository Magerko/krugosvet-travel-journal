/* Общие куски разметки — шапка и футер.
   Шапка состоит из двух частей:
   1. editorial-strip — тонкая строка над основной шапкой:
      дата и номер выпуска. Деталь в духе печатных журналов.
   2. site-header — лого, навигация, действия (тема, юзер).
   На мобильных navigation схлопывается в drawer (см. .mobile-drawer). */

const Layout = (() => {

    const NAV_ITEMS = [
        { key: 'home',         href: '/',             label: 'Главная' },
        { key: 'excursions',   href: '/excursions',   label: 'Экскурсии' },
        { key: 'destinations', href: '/destinations', label: 'Места' },
        { key: 'news',         href: '/news',         label: 'Новости' },
        { key: 'contacts',     href: '/contacts',     label: 'Контакты' },
    ];

    // Номер выпуска: неделя от начала года. Получаем приятное и стабильное число.
    function issueNumber() {
        const now = new Date();
        const start = new Date(now.getFullYear(), 0, 1);
        const days = Math.floor((now - start) / 86400000);
        return Math.ceil((days + start.getDay() + 1) / 7);
    }

    function todayLong() {
        const months = ['января','февраля','марта','апреля','мая','июня',
                        'июля','августа','сентября','октября','ноября','декабря'];
        const d = new Date();
        return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
    }

    let _user = null;

    function themeIconHtml() {
        // Иконка по текущей теме: показываем то, во что переключимся (контрастно)
        return Theme.current === 'dark' ? Icons.sun(16) : Icons.moon(16);
    }

    function userBlockHtml() {
        if (_user) {
            const initials = (_user.full_name || '?')
                .split(' ').map(s => s[0]).join('').slice(0, 2).toUpperCase();
            return `
                <a href="${_user.is_admin ? '/admin' : '/cabinet'}" class="user-link" style="display:flex; align-items:center; gap:8px;">
                    <span class="user-avatar">${initials}</span>
                    <span>${_user.full_name.split(' ')[0]}</span>
                </a>
                <button class="btn btn--ghost" id="logout-btn" style="padding:7px 12px;font-size:12px;">Выйти</button>`;
        }
        return `
            <a href="/auth" class="user-link">Войти</a>
            <a href="/auth?mode=register" class="btn btn--primary">Регистрация</a>`;
    }

    function header(active) {
        const navHtml = NAV_ITEMS.map(it => `
            <a href="${it.href}" class="${it.key === active ? 'is-active' : ''}">${it.label}</a>
        `).join('');

        return `
            <div class="editorial-strip">
                <span class="editorial-strip__date">${todayLong()}</span>
                <span class="editorial-strip__sep">·</span>
                <span class="editorial-strip__issue">выпуск №${issueNumber()}</span>
                <span class="editorial-strip__spacer"></span>
                <span class="editorial-strip__motto">Журнал о&nbsp;путешествиях</span>
            </div>

            <header class="site-header">
                <a href="/" class="brand">
                    <span class="brand__mark">${Icons.compass(20)}</span>
                    <span>
                        <div class="brand__name">Кругосвет</div>
                        <div class="brand__sub">независимый журнал</div>
                    </span>
                </a>

                <nav class="site-nav site-nav--desktop">${navHtml}</nav>

                <div class="header-actions">
                    <button class="theme-toggle" id="theme-toggle" aria-label="Сменить тему">
                        ${themeIconHtml()}
                    </button>
                    ${userBlockHtml()}
                    <button class="hamburger" id="hamburger" aria-label="Открыть меню" aria-expanded="false">
                        ${Icons.menu(20)}
                    </button>
                </div>
            </header>

            <div class="mobile-drawer" id="mobile-drawer" aria-hidden="true">
                <div class="mobile-drawer__head">
                    <a href="/" class="brand">
                        <span class="brand__mark">${Icons.compass(20)}</span>
                        <div class="brand__name">Кругосвет</div>
                    </a>
                    <button class="mobile-drawer__close" id="drawer-close" aria-label="Закрыть меню">
                        ${Icons.close(20)}
                    </button>
                </div>
                <nav class="site-nav site-nav--mobile">${navHtml}</nav>
                <div class="mobile-drawer__actions">${userBlockHtml()}</div>
            </div>`;
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
                        <h4>Журнал</h4>
                        <div class="site-footer__links">
                            О&nbsp;редакции<br>Авторы<br>Контакты
                        </div>
                    </div>
                    <div>
                        <h4>Читателю</h4>
                        <div class="site-footer__links">
                            Подписка<br>Авторизация<br>RSS-лента
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
            tg.innerHTML = themeIconHtml();
        });
        // Иконка темы должна обновляться, даже если кто-то поменял её программно
        window.addEventListener('theme:change', () => {
            if (tg) tg.innerHTML = themeIconHtml();
        });

        document.querySelectorAll('#logout-btn').forEach(b =>
            b.addEventListener('click', async () => {
                try { await API.post('/api/auth/logout'); } catch (_) {}
                location.href = '/';
            }));

        // Hamburger ↔ drawer
        const ham = document.getElementById('hamburger');
        const drawer = document.getElementById('mobile-drawer');
        const closeBtn = document.getElementById('drawer-close');

        function openDrawer() {
            drawer.classList.add('is-open');
            drawer.setAttribute('aria-hidden', 'false');
            ham?.setAttribute('aria-expanded', 'true');
            document.body.style.overflow = 'hidden';
        }
        function closeDrawer() {
            drawer.classList.remove('is-open');
            drawer.setAttribute('aria-hidden', 'true');
            ham?.setAttribute('aria-expanded', 'false');
            document.body.style.overflow = '';
        }

        ham?.addEventListener('click', openDrawer);
        closeBtn?.addEventListener('click', closeDrawer);
        drawer?.addEventListener('click', e => { if (e.target === drawer) closeDrawer(); });
        // Закрытие при клике по любой ссылке внутри drawer
        drawer?.querySelectorAll('a').forEach(a =>
            a.addEventListener('click', closeDrawer));
        document.addEventListener('keydown', e => {
            if (e.key === 'Escape') closeDrawer();
        });
    }

    async function mount({ active = '' } = {}) {
        try {
            const r = await API.get('/api/auth/me');
            _user = r.user;
        } catch (_) { _user = null; }

        const headEl = document.getElementById('layout-header');
        const footEl = document.getElementById('layout-footer');
        if (headEl) headEl.outerHTML = header(active);
        if (footEl) footEl.outerHTML = footer();

        bindHandlers();
        return _user;
    }

    return { mount, get user() { return _user; } };
})();

window.Layout = Layout;
