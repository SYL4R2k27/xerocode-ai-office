"""Transactional email via aiosmtplib.

Config in settings:
  smtp_host, smtp_port, smtp_user, smtp_password, smtp_from
All optional — if unset, send_email() logs the message and returns False.
"""
from __future__ import annotations

import logging
from email.message import EmailMessage
from typing import Optional

from app.core.config import settings

logger = logging.getLogger(__name__)


async def send_email(
    to: str,
    subject: str,
    html: str,
    text_alt: Optional[str] = None,
) -> bool:
    """Send an HTML email. Returns True on success, False otherwise."""
    host = getattr(settings, "smtp_host", None)
    port = int(getattr(settings, "smtp_port", 587) or 587)
    user = getattr(settings, "smtp_user", None)
    password = getattr(settings, "smtp_password", None)
    sender = getattr(settings, "smtp_from", None) or (user or "noreply@xerocode.ru")

    if not host or not user or not password:
        logger.warning(f"[Email] SMTP not configured — would send to {to}: {subject}")
        return False

    try:
        import aiosmtplib  # type: ignore
    except ImportError:
        logger.error("[Email] aiosmtplib not installed")
        return False

    msg = EmailMessage()
    msg["From"] = sender
    msg["To"] = to
    msg["Subject"] = subject
    msg.set_content(text_alt or _strip_html(html))
    msg.add_alternative(html, subtype="html")

    try:
        await aiosmtplib.send(
            msg,
            hostname=host,
            port=port,
            username=user,
            password=password,
            start_tls=port == 587,
            use_tls=port == 465,
        )
        logger.info(f"[Email] Sent to {to}: {subject}")
        return True
    except Exception as e:
        logger.error(f"[Email] Send failed to {to}: {e}")
        return False


def _strip_html(html: str) -> str:
    import re
    return re.sub(r"<[^>]+>", "", html)


# ── Templates ─────────────────────────────────────────────────────

BASE_STYLE = """
<style>
  body { font-family: -apple-system, sans-serif; background: #0f0f14; color: #e8e8ed; margin: 0; padding: 40px 20px; }
  .card { max-width: 560px; margin: 0 auto; background: #1a1a22; border-radius: 16px; padding: 32px; }
  .btn { display: inline-block; padding: 12px 24px; background: linear-gradient(90deg,#9333ea,#3b82f6); color: #fff; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 16px; }
  .muted { color: #8a8a93; font-size: 13px; }
  h1 { font-size: 22px; margin: 0 0 16px; }
</style>
"""


async def send_welcome(to: str, name: str) -> bool:
    html = f"""<html><head>{BASE_STYLE}</head><body><div class="card">
      <h1>Добро пожаловать в XeroCode, {name}!</h1>
      <p>Ваш аккаунт создан. Триал 7 дней PRO активен — используйте все возможности платформы.</p>
      <p><a class="btn" href="https://xerocode.ru">Перейти в офис</a></p>
      <p class="muted">Если вы не регистрировались — игнорируйте это письмо.</p>
    </div></body></html>"""
    return await send_email(to, "Добро пожаловать в XeroCode", html)


async def send_password_reset(to: str, reset_link: str) -> bool:
    html = f"""<html><head>{BASE_STYLE}</head><body><div class="card">
      <h1>Сброс пароля</h1>
      <p>Мы получили запрос на сброс пароля. Ссылка действует 1 час.</p>
      <p><a class="btn" href="{reset_link}">Сбросить пароль</a></p>
      <p class="muted">Если вы не запрашивали сброс — проигнорируйте это письмо.</p>
    </div></body></html>"""
    return await send_email(to, "Сброс пароля — XeroCode", html)


async def send_payment_receipt(to: str, plan: str, amount: str, period: str) -> bool:
    html = f"""<html><head>{BASE_STYLE}</head><body><div class="card">
      <h1>Спасибо за оплату!</h1>
      <p>Подписка <b>{plan}</b> активна на {period}. Сумма: <b>{amount}</b>.</p>
      <p><a class="btn" href="https://xerocode.ru">Перейти в офис</a></p>
    </div></body></html>"""
    return await send_email(to, f"Оплата XeroCode {plan}", html)


async def send_trial_expiring(to: str, name: str, days_left: int) -> bool:
    html = f"""<html><head>{BASE_STYLE}</head><body><div class="card">
      <h1>Триал заканчивается через {days_left} дн.</h1>
      <p>Привет, {name}! Ваш PRO-триал подходит к концу. Оформите подписку, чтобы сохранить доступ.</p>
      <p><a class="btn" href="https://xerocode.ru/pricing">Выбрать тариф</a></p>
    </div></body></html>"""
    return await send_email(to, "Ваш триал заканчивается", html)
