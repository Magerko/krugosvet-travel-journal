/* Плавный переход между страницами.
   Перехватываем клики по внутренним ссылкам — даём main исчезнуть,
   потом меняем location. На загрузке CSS-анимация делает fade-in. */

(function () {
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        return; // пользователь не хочет анимаций — оставляем как есть
    }

    document.addEventListener('click', e => {
        const a = e.target.closest('a');
        if (!a) return;
        const href = a.getAttribute('href');
        if (!href) return;

        // Внешние, якорные, mailto/tel — оставляем браузеру
        if (href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return;
        if (a.target && a.target !== '_self') return;
        if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey || e.button === 1) return;

        try {
            const url = new URL(href, location.href);
            if (url.origin !== location.origin) return;
            // На той же странице — никаких переходов
            if (url.pathname === location.pathname && url.search === location.search) return;
        } catch (_) {
            return;
        }

        e.preventDefault();
        document.body.classList.add('is-leaving');
        // 220ms = длительность из CSS .is-leaving main
        setTimeout(() => { location.href = href; }, 200);
    });

    // bfcache (когда страница восстанавливается «назад» в браузере) —
    // снимаем класс, чтобы не остаться в полупрозрачном состоянии
    window.addEventListener('pageshow', () => {
        document.body.classList.remove('is-leaving');
    });
})();
