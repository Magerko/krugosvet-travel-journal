/* Утилиты форматирования. Кладу всё в один файл, чтобы не плодить мелочёвку. */

const Fmt = {
    // Эскейп пользовательского текста перед вставкой через innerHTML.
    // Используем везде, где данные приходят от других пользователей.
    esc(s) {
        return String(s ?? '')
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#039;');
    },

    // 1240 → "$1,240"
    money(value) {
        if (value === null || value === undefined) return '—';
        return '$' + Number(value).toLocaleString('en-US');
    },
    // Алиас для обратной совместимости с уже написанным кодом
    rub(value) { return this.money(value); },

    // ISO дата → "12 июня 2026"
    date(iso) {
        if (!iso) return '';
        const d = new Date(iso);
        if (isNaN(d)) return iso;
        const months = ['января','февраля','марта','апреля','мая','июня',
                        'июля','августа','сентября','октября','ноября','декабря'];
        return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
    },

    // ISO дата → "12.06.2026"
    dateShort(iso) {
        if (!iso) return '';
        const d = new Date(iso);
        if (isNaN(d)) return iso;
        const dd = String(d.getDate()).padStart(2, '0');
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        return `${dd}.${mm}.${d.getFullYear()}`;
    },

    // ISO дата + время → "08.05 14:22"
    dateTime(iso) {
        if (!iso) return '';
        const d = new Date(iso);
        if (isNaN(d)) return iso;
        const dd = String(d.getDate()).padStart(2, '0');
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const hh = String(d.getHours()).padStart(2, '0');
        const mn = String(d.getMinutes()).padStart(2, '0');
        return `${dd}.${mm} ${hh}:${mn}`;
    },

    // Слово в правильном падеже: 1 ночь, 2 ночи, 5 ночей
    plural(n, forms) {
        // forms = ['ночь', 'ночи', 'ночей']
        n = Math.abs(n) % 100;
        const n1 = n % 10;
        if (n > 10 && n < 20) return forms[2];
        if (n1 > 1 && n1 < 5) return forms[1];
        if (n1 === 1) return forms[0];
        return forms[2];
    },

    // Звёздочки рейтинга
    starsRow(rating, max = 5) {
        let s = '';
        for (let i = 0; i < max; i++) {
            s += `<span style="color:${i < Math.round(rating) ? 'var(--ochre)' : 'var(--line)'}">${Icons.star(12)}</span>`;
        }
        return s;
    },
};

window.Fmt = Fmt;
