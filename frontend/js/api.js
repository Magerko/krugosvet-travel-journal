/* Простые обёртки над fetch — чтобы не дублировать код по всему проекту.
   Все запросы идут на /api/... — фронт и бэк на одном origin, CORS не нужен.

   CSRF: перед каждым state-changing запросом тянем токен с /api/csrf
   и кладём в X-CSRFToken. Токен кешируется в памяти и обновляется
   автоматически при 400 с error=csrf_failed. */

const API = (() => {
    let _csrfToken = null;
    let _csrfPromise = null;

    async function fetchCsrf() {
        if (_csrfPromise) return _csrfPromise;
        _csrfPromise = (async () => {
            try {
                const r = await fetch('/api/csrf', { credentials: 'same-origin' });
                const data = await r.json();
                _csrfToken = data && data.token;
            } catch (_) {
                _csrfToken = null;
            } finally {
                _csrfPromise = null;
            }
            return _csrfToken;
        })();
        return _csrfPromise;
    }

    function isUnsafe(method) {
        return method !== 'GET' && method !== 'HEAD' && method !== 'OPTIONS';
    }

    async function doRequest(method, url, body, retryOnCsrf) {
        const opts = {
            method,
            headers: {},
            credentials: 'same-origin',
        };

        if (body !== undefined) {
            opts.headers['Content-Type'] = 'application/json';
            opts.body = JSON.stringify(body);
        }

        if (isUnsafe(method)) {
            const token = _csrfToken || await fetchCsrf();
            if (token) opts.headers['X-CSRFToken'] = token;
        }

        const res = await fetch(url, opts);
        const text = await res.text();
        let data = null;
        if (text) {
            try { data = JSON.parse(text); } catch (_) { data = { error: 'bad_json', raw: text }; }
        }

        // Если токен оказался невалидным (например, сессия истекла) —
        // один раз перезапросим токен и повторим
        if (res.status === 400 && data && data.error === 'csrf_failed' && retryOnCsrf) {
            _csrfToken = null;
            await fetchCsrf();
            return doRequest(method, url, body, false);
        }

        if (!res.ok) {
            const err = new Error(data && data.error ? data.error : 'http_' + res.status);
            err.status = res.status;
            err.data = data;
            throw err;
        }
        return data;
    }

    function request(method, url, body) {
        return doRequest(method, url, body, true);
    }

    return {
        get:  (url)       => request('GET', url),
        post: (url, body) => request('POST', url, body || {}),
        put:  (url, body) => request('PUT', url, body || {}),
        del:  (url)       => request('DELETE', url),
    };
})();

window.API = API;
