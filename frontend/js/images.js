/* Хелпер для подстановки реальных фото вместо плейсхолдеров.
   Использует Picsum (https://picsum.photos) — стабильная CDN с лицензией
   на свободное использование. Один и тот же seed возвращает одно и то же фото,
   поэтому каждая статья/экскурсия/место имеет постоянную обложку.

   Использование:
     Img.tag('cappadocia', 'Каппадокия')    -> <img class="cover-img" ...>
     Img.url('rome', 1200, 600)             -> "https://picsum.photos/seed/rome/1200/600"
*/

const Img = {
    url(seed, w = 800, h = 500) {
        const safe = encodeURIComponent(String(seed || 'krugosvet'));
        return `https://picsum.photos/seed/${safe}/${w}/${h}`;
    },

    tag(seed, alt = '', w = 800, h = 500) {
        const altSafe = String(alt || '').replace(/"/g, '&quot;');
        return `<img class="cover-img" alt="${altSafe}" loading="lazy" src="${this.url(seed, w, h)}">`;
    },

    /* Фон через CSS-переменную — для случаев, когда hover-эффекты или градиент
       поверх фото удобнее наложить через ::before. Обычно достаточно tag(). */
    bg(seed, w = 800, h = 500) {
        return `background-image: url('${this.url(seed, w, h)}'); background-size: cover; background-position: center;`;
    },
};

window.Img = Img;
