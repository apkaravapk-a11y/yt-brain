"""Notification hub — fan-out to Windows toast + Telegram + Discord (+ extensible)."""
from __future__ import annotations
import os
import subprocess
from dataclasses import dataclass
from pathlib import Path
from typing import Protocol

NOTIFY_OFF = Path("C:/docs/.notify-off")


@dataclass
class Event:
    kind: str              # "info" | "warn" | "error" | "consent_ask" | "phase_complete"
    title: str
    body: str
    deep_link: str | None = None


class NotifyProvider(Protocol):
    name: str
    def push(self, ev: Event) -> bool: ...


class WindowsToastProvider:
    name = "windows_toast"

    def push(self, ev: Event) -> bool:
        try:
            title = ev.title.replace('"', "'")
            body = ev.body.replace('"', "'")
            cmd = (
                f"[Windows.UI.Notifications.ToastNotificationManager,Windows.UI.Notifications,ContentType=WindowsRuntime] | Out-Null; "
                f"[Windows.Data.Xml.Dom.XmlDocument,Windows.Data.Xml.Dom.XmlDocument,ContentType=WindowsRuntime] | Out-Null; "
                f"$xml=[Windows.UI.Notifications.ToastNotificationManager]::GetTemplateContent('ToastText02'); "
                f"$xml.GetElementsByTagName('text')[0].AppendChild($xml.CreateTextNode('{title}')) | Out-Null; "
                f"$xml.GetElementsByTagName('text')[1].AppendChild($xml.CreateTextNode('{body}')) | Out-Null; "
                f"$n=[Windows.UI.Notifications.ToastNotification]::new($xml); "
                f"[Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier('yt-brain').Show($n)"
            )
            subprocess.run(["powershell", "-NoProfile", "-Command", cmd], capture_output=True, timeout=5)
            return True
        except Exception:
            return False


class StdoutProvider:
    """Baseline provider — always works. Never blocks."""
    name = "stdout"

    def push(self, ev: Event) -> bool:
        prefix = {"info": "ℹ", "warn": "⚠", "error": "✖",
                  "consent_ask": "?", "phase_complete": "✓"}.get(ev.kind, "•")
        print(f"[notify {prefix}] {ev.title} — {ev.body}" + (f"  ({ev.deep_link})" if ev.deep_link else ""))
        return True


class NotifyHub:
    def __init__(self, providers: list[NotifyProvider] | None = None):
        self.providers = providers or [StdoutProvider()]

    def push(self, ev: Event) -> dict:
        if NOTIFY_OFF.exists():
            return {"suppressed": True}
        results: dict[str, bool] = {}
        for p in self.providers:
            try:
                results[p.name] = p.push(ev)
            except Exception as exc:  # provider isolation
                results[p.name] = False
        return results


def default_hub() -> NotifyHub:
    providers: list[NotifyProvider] = [StdoutProvider()]
    if os.name == "nt":
        providers.append(WindowsToastProvider())
    return NotifyHub(providers)
