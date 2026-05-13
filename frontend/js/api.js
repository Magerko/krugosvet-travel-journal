/* Простые обёртки над fetch — чтобы не дублировать код по всему проекту.
   Все запросы идут на /api/... — Flask сам обрабатывает CORS не нужен,
   фронт и бэк на одном origin. */

const API = (() => {
    async function request(method, url, body) {
        const opts = {
            method,
            headers: {},
            credentials: 'same-origin',  // важно — иначе cookie сессии не отправится
        };

        if (body !== undefined) {
            opts.headers['Content-Type'] = 'application/json';
            opts.body = JSON.stringify(body);
        }

        const res = await fetch(url, opts);
        const text = await res.text();

        // Пытаемся распарсить JSON, но не падаем если не получилось
        let data = null;
        if (text) {
            try { data = JSON.parse(text); } catch (_) { data = { error: 'bad_json', raw: text }; }
        }

        if (!res.ok) {
            const err = new Error(data && data.error ? data.error : 'http_' + res.status);
            err.status = res.status;
            err.data = data;
            throw err;
        }
        return data;
    }

    return {
        get:  (url)        => request('GET', url),
        post: (url, body)  => request('POST', url, body || {}),
        put:  (url, body)  => request('PUT', url, body || {}),
        del:  (url)        => request('DELETE', url),
    };
})();

window.API = API;
