/* Страница "Контакты". */

(async function () {
    await Layout.mount({ active: 'contacts' });

    document.getElementById('ic-phone').innerHTML = Icons.users(20);
    document.getElementById('ic-email').innerHTML = Icons.search(20);
    document.getElementById('ic-pin').innerHTML   = Icons.pin(20);
    document.getElementById('ic-clock').innerHTML = Icons.calendar(20);
    document.getElementById('pin-icon').innerHTML = Icons.pin(40);

    // Иконки соцсетей в правой колонке
    document.getElementById('ic-tg').innerHTML  = Icons.telegram(16);
    document.getElementById('ic-ig').innerHTML  = Icons.instagram(16);
    document.getElementById('ic-rss').innerHTML = Icons.rss(16);

    document.getElementById('open-modal').addEventListener('click', () =>
        RequestModal.open({ excursion: null }));
})();
