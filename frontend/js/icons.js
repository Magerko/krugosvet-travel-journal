/* Иконки. Свой графический стиль — толще линии, частично залитые формы,
   несколько необычные углы. Все берут currentColor от родителя.
   Возвращают строку SVG — удобно вставлять через innerHTML. */

const Icons = {
    // Компас — квадрат, повёрнутый ромбом, со стрелкой
    compass: (size = 16) => `
        <svg class="icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" transform="rotate(45 12 12)"/>
            <path d="M12 8l2 4-2 4-2-4z" fill="currentColor" stroke="none"/>
        </svg>`,

    // Метка — капля с центральной точкой-кругом, более «иллюстративно»
    pin: (size = 16) => `
        <svg class="icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round">
            <path d="M12 2c4 0 7 3 7 7 0 5-7 13-7 13S5 14 5 9c0-4 3-7 7-7z" fill="currentColor" fill-opacity="0.15"/>
            <circle cx="12" cy="9" r="2.4" fill="currentColor" stroke="none"/>
        </svg>`,

    // Календарь — стопка двух листов под небольшим углом, верхний с уголком
    calendar: (size = 16) => `
        <svg class="icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round">
            <rect x="5" y="6" width="14" height="14" rx="2"/>
            <path d="M8 3v5M16 3v5M5 11h14"/>
            <circle cx="9"  cy="15" r="1" fill="currentColor" stroke="none"/>
            <circle cx="13" cy="15" r="1" fill="currentColor" stroke="none"/>
            <circle cx="17" cy="15" r="1" fill="currentColor" stroke="none"/>
        </svg>`,

    // Люди — два «треугольных» силуэта (граненый стиль вместо классических кружков)
    users: (size = 16) => `
        <svg class="icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round">
            <path d="M8 3l3 5h-6z" fill="currentColor" fill-opacity="0.15"/>
            <path d="M3 20c0-4 2-7 5-7s5 3 5 7"/>
            <path d="M16 6l2.5 4h-5z" fill="currentColor" fill-opacity="0.15"/>
            <path d="M13 19c0-3 1.5-5 3.5-5s3.5 2 3.5 5"/>
        </svg>`,

    // Кошелёк — конверт с диагональным клапаном
    wallet: (size = 16) => `
        <svg class="icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round">
            <rect x="3" y="7" width="18" height="13" rx="2"/>
            <path d="M3 7l9 7 9-7"/>
            <circle cx="18" cy="13" r="1.6" fill="currentColor" stroke="none"/>
        </svg>`,

    // Поиск — бинокль из двух «глаз», вместо привычной лупы
    search: (size = 16) => `
        <svg class="icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round">
            <circle cx="7"  cy="13" r="4"/>
            <circle cx="17" cy="13" r="4"/>
            <path d="M11 13h2"/>
            <path d="M5 5l2 4M19 5l-2 4"/>
        </svg>`,

    // Звезда — шестилучевая (мерцающая), вместо стандартной пятиконечной
    star: (size = 14) => `
        <svg class="icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="currentColor" stroke="none">
            <path d="M12 2l1.4 6.6L20 10l-6.6 1.4L12 18l-1.4-6.6L4 10l6.6-1.4z"/>
        </svg>`,

    // Стрелка — «бумажный самолётик» вправо
    arrow: (size = 14) => `
        <svg class="icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round">
            <path d="M3 12l18-8-7 18-3-7z" fill="currentColor" fill-opacity="0.18"/>
            <path d="M11 15l3-3"/>
        </svg>`,

    // Галочка — двойной штрих
    check: (size = 14) => `
        <svg class="icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 13l4 4L20 5"/>
            <path d="M4 19h6" opacity="0.4"/>
        </svg>`,

    // Закрыть — со смещёнными концами линий, не идеальный «крестик»
    close: (size = 14) => `
        <svg class="icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round">
            <path d="M7 6l11 12M18 6L7 18"/>
        </svg>`,

    // Плюс — со скруглёнными концами и точкой по центру
    plus: (size = 14) => `
        <svg class="icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round">
            <path d="M12 5v14M5 12h14"/>
            <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none"/>
        </svg>`,

    // Сердце — асимметричное, чуть «рукописное»
    heart: (size = 14, filled = false) => `
        <svg class="icon" width="${size}" height="${size}" viewBox="0 0 24 24"
             fill="${filled ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linejoin="round">
            <path d="M12 21C9 18 3 14 4 9c0.5-2.8 3-4.4 5.4-3.6C11 6 12 7.4 12 9c0-1.6 1-3 2.6-3.6C17 4.6 19.5 6.2 20 9c1 5-5 9-8 12z"/>
        </svg>`,
};

window.Icons = Icons;
