/* Переключатель темы.
   1. Сначала смотрим в localStorage — если юзер уже выбирал, уважаем выбор.
   2. Иначе берём из prefers-color-scheme.
   3. Если ни выбора, ни prefers — светлая по умолчанию.

   Этот файл подключается в <head>, до любого CSS, чтобы не было flash
   неправильной темы при перезагрузке.
*/

(function () {
    const STORAGE_KEY = 'krugosvet-theme';

    // Сначала читаем сохранённую тему. Если её нет — спрашиваем систему.
    function getInitialTheme() {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved === 'light' || saved === 'dark') return saved;
        const prefersDark = window.matchMedia &&
                            window.matchMedia('(prefers-color-scheme: dark)').matches;
        return prefersDark ? 'dark' : 'light';
    }

    function applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
    }

    // Применяем сразу — до отрисовки страницы
    applyTheme(getInitialTheme());

    // API для остальных скриптов
    window.Theme = {
        get current() {
            return document.documentElement.getAttribute('data-theme') || 'light';
        },
        toggle() {
            const next = this.current === 'dark' ? 'light' : 'dark';
            applyTheme(next);
            localStorage.setItem(STORAGE_KEY, next);
            // Кидаем событие, чтобы шапка могла перерисовать иконку
            window.dispatchEvent(new CustomEvent('theme:change', { detail: next }));
            return next;
        },
        set(theme) {
            if (theme !== 'light' && theme !== 'dark') return;
            applyTheme(theme);
            localStorage.setItem(STORAGE_KEY, theme);
            window.dispatchEvent(new CustomEvent('theme:change', { detail: theme }));
        },
    };

    // Если юзер ещё не выбирал темы вручную — слушаем системные изменения
    if (window.matchMedia) {
        const mq = window.matchMedia('(prefers-color-scheme: dark)');
        mq.addEventListener('change', e => {
            if (!localStorage.getItem(STORAGE_KEY)) {
                applyTheme(e.matches ? 'dark' : 'light');
            }
        });
    }
})();
