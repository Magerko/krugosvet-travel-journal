"""Снимает скриншоты ключевых страниц проекта для README.

Запуск:
    python docs/_capture_screens.py

Сохраняет PNG в docs/screenshots/.
"""
import os
import sys
from pathlib import Path
from playwright.sync_api import sync_playwright

OUT_DIR = Path(__file__).parent / "screenshots"
OUT_DIR.mkdir(parents=True, exist_ok=True)

BASE = "http://localhost:5000"
DESKTOP = {"viewport": {"width": 1280, "height": 900}}
MOBILE = {
    "viewport": {"width": 412, "height": 915},
    "device_scale_factor": 2,
    "user_agent": "Mozilla/5.0 (Linux; Android 13; Pixel 7)",
    "is_mobile": True,
    "has_touch": True,
}


def login(page, email, password):
    page.goto(BASE + "/", wait_until="networkidle")
    page.evaluate(
        f"""async () => {{
            const t = (await (await fetch('/api/csrf', {{credentials:'same-origin'}})).json()).token;
            await fetch('/api/auth/login', {{
                method: 'POST', credentials: 'same-origin',
                headers: {{'Content-Type':'application/json', 'X-CSRFToken': t}},
                body: JSON.stringify({{email: '{email}', password: '{password}'}})
            }});
        }}"""
    )


def shot(page, name, full_page=False):
    out = OUT_DIR / f"{name}.png"
    page.screenshot(path=str(out), full_page=full_page)
    print(f"  saved: {out.relative_to(Path(__file__).parent.parent)}")


def capture_desktop(browser):
    print("\n[desktop]")
    ctx = browser.new_context(**DESKTOP)
    page = ctx.new_page()
    page.set_default_timeout(15000)

    # Главная (анонимно)
    page.goto(BASE + "/", wait_until="networkidle")
    shot(page, "01-home")

    # Каталог экскурсий
    page.goto(BASE + "/excursions", wait_until="networkidle")
    page.wait_for_timeout(500)
    shot(page, "02-excursions")

    # Детальная экскурсия
    page.goto(BASE + "/excursions/kapadokiya-iz-antalii", wait_until="networkidle")
    page.wait_for_timeout(400)
    shot(page, "03-excursion-detail")

    # Места отдыха
    page.goto(BASE + "/destinations", wait_until="networkidle")
    page.wait_for_timeout(300)
    shot(page, "04-destinations")

    # Новости + статья
    page.goto(BASE + "/news", wait_until="networkidle")
    page.wait_for_timeout(300)
    shot(page, "05-news")
    page.goto(BASE + "/news/vizy-2026", wait_until="networkidle")
    page.wait_for_timeout(300)
    shot(page, "06-article")

    # Login form
    page.goto(BASE + "/auth", wait_until="networkidle")
    shot(page, "07-auth")

    # Модалка бронирования (логинимся как ivanov)
    login(page, "ivanov@example.com", "password")
    page.goto(BASE + "/excursions/kapadokiya-iz-antalii", wait_until="networkidle")
    page.wait_for_timeout(300)
    page.click("#book-btn")
    page.wait_for_timeout(800)
    shot(page, "08-booking-modal")
    # Закроем модалку клавишей Escape
    page.keyboard.press("Escape")

    # Личный кабинет (ivanov залогинен)
    page.goto(BASE + "/cabinet", wait_until="networkidle")
    page.wait_for_timeout(400)
    shot(page, "09-cabinet")

    ctx.close()

    # Админка — отдельный контекст с админом
    print("\n[admin desktop]")
    ctx = browser.new_context(**DESKTOP)
    page = ctx.new_page()
    login(page, "admin@krugosvet.ru", "admin123")
    page.goto(BASE + "/admin", wait_until="networkidle")
    page.wait_for_timeout(500)
    shot(page, "10-admin-articles")
    # Переключим на брони
    page.click('[data-section="bookings"]')
    page.wait_for_timeout(300)
    shot(page, "11-admin-bookings")
    ctx.close()


def capture_mobile(browser):
    print("\n[mobile]")
    ctx = browser.new_context(**MOBILE)
    page = ctx.new_page()
    page.set_default_timeout(15000)

    page.goto(BASE + "/", wait_until="networkidle")
    page.wait_for_timeout(400)
    shot(page, "m1-home")

    # Открыть drawer
    page.click("#hamburger")
    page.wait_for_timeout(400)
    shot(page, "m2-drawer")
    page.keyboard.press("Escape")
    page.wait_for_timeout(200)

    # Тёмная тема
    page.evaluate("Theme.set('dark')")
    page.wait_for_timeout(300)
    shot(page, "m3-home-dark")
    page.evaluate("Theme.set('light')")

    # Booking modal на мобиле
    login(page, "ivanov@example.com", "password")
    page.goto(BASE + "/excursions/kapadokiya-iz-antalii", wait_until="networkidle")
    page.wait_for_timeout(400)
    page.click("#book-btn")
    page.wait_for_timeout(800)
    shot(page, "m4-booking-modal")

    ctx.close()


def main():
    if len(sys.argv) > 1 and sys.argv[1] == "--mobile-only":
        with sync_playwright() as p:
            b = p.chromium.launch(headless=True)
            capture_mobile(b)
            b.close()
        return

    with sync_playwright() as p:
        b = p.chromium.launch(headless=True)
        capture_desktop(b)
        capture_mobile(b)
        b.close()


if __name__ == "__main__":
    main()
