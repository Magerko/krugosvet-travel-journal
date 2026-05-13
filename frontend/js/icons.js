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

    // --- Соцсети ---

    // Telegram — узнаваемый «бумажный самолётик» в круге
    telegram: (size = 16) => `
        <svg class="icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 1a11 11 0 1 0 0 22 11 11 0 0 0 0-22zm5.4 7.6-1.8 8.6c-.14.6-.5.74-1 .46l-2.8-2.06-1.34 1.3c-.16.16-.28.28-.56.28l.2-2.86 5.2-4.7c.22-.2-.05-.32-.36-.12L8.5 13l-2.78-.86c-.6-.2-.62-.6.13-.9l10.86-4.2c.5-.18.94.12.78.86z"/>
        </svg>`,

    // Google — фирменная буква G в их цветах, без надписей. Узнаваемая, но не копирует логотип целиком.
    google: (size = 16) => `
        <svg class="icon" width="${size}" height="${size}" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M23.5 12.28c0-.85-.07-1.65-.2-2.42H12v4.58h6.45c-.28 1.5-1.13 2.78-2.4 3.63v3.02h3.88c2.27-2.1 3.57-5.18 3.57-8.81z"/>
            <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.92l-3.88-3.02c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.76-2.1-6.7-4.94H1.3v3.1A11.99 11.99 0 0 0 12 24z"/>
            <path fill="#FBBC05" d="M5.3 14.28A7.2 7.2 0 0 1 4.92 12c0-.8.14-1.56.38-2.28V6.62H1.3A12 12 0 0 0 0 12c0 1.94.46 3.78 1.3 5.38l4-3.1z"/>
            <path fill="#EA4335" d="M12 4.78c1.76 0 3.34.6 4.6 1.8l3.43-3.42C17.95 1.18 15.24 0 12 0A11.99 11.99 0 0 0 1.3 6.62l4 3.1C6.24 6.88 8.88 4.78 12 4.78z"/>
        </svg>`,

    // Instagram — квадрат со скруглением, круг внутри и точка-объектив
    instagram: (size = 16) => `
        <svg class="icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <rect x="3" y="3" width="18" height="18" rx="5"/>
            <circle cx="12" cy="12" r="4"/>
            <circle cx="17.5" cy="6.5" r="0.9" fill="currentColor" stroke="none"/>
        </svg>`,

    // RSS — три дуги волн + точка
    rss: (size = 16) => `
        <svg class="icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <path d="M5 5c8.3 0 14 5.7 14 14"/>
            <path d="M5 11c4.4 0 8 3.6 8 8"/>
            <circle cx="6" cy="18" r="1.5" fill="currentColor" stroke="none"/>
        </svg>`,

    // Солнце — для светлой темы. Чуть «угловатое», не идеальные лучи.
    sun: (size = 16) => `
        <svg class="icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="4" fill="currentColor" fill-opacity="0.15"/>
            <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4l1.4-1.4M17 7l1.4-1.4"/>
        </svg>`,

    // Луна — для тёмной темы. Полумесяц «с пуш-эффектом».
    moon: (size = 16) => `
        <svg class="icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="currentColor" stroke="none">
            <path d="M21 13.5A9 9 0 1 1 10.5 3a7 7 0 0 0 10.5 10.5z"/>
        </svg>`,

    // Гамбургер — три полоски, средняя короче (чуть «эдиториальная» неровность).
    menu: (size = 18) => `
        <svg class="icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <path d="M4 7h16M4 12h11M4 17h16"/>
        </svg>`,
};

window.Icons = Icons;
