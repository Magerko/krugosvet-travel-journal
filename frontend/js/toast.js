/* Простой тост-уведомитель. Любой js может вызвать toast('текст', 'ok' | 'err'). */

const toast = (() => {
    let host = null;

    function ensureHost() {
        if (!host) {
            host = document.createElement('div');
            host.className = 'toast-host';
            document.body.appendChild(host);
        }
        return host;
    }

    return function (message, kind = '', timeout = 3500) {
        const el = document.createElement('div');
        el.className = 'toast' + (kind ? ' toast--' + kind : '');
        el.textContent = message;
        ensureHost().appendChild(el);

        setTimeout(() => {
            el.style.transition = 'opacity .25s';
            el.style.opacity = '0';
            setTimeout(() => el.remove(), 260);
        }, timeout);
    };
})();

window.toast = toast;
