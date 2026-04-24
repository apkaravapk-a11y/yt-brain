"""Thermal governance — pauses headless workers when the mobile workstation throttles.

Reads temperatures every N seconds. When over threshold, sets a sentinel file that
workers check before starting/resuming. Headed Λ keeps running because it's user-driven.
"""
from __future__ import annotations
import subprocess
import time
from pathlib import Path

THERMAL_PAUSE_SENTINEL = Path("C:/docs/.thermal-pause")
CHECK_INTERVAL_SEC = 30
CPU_THRESHOLD_C = 88.0
GPU_THRESHOLD_C = 85.0


def read_cpu_temp_c() -> float | None:
    """Best-effort via PowerShell WMI. None if unavailable."""
    try:
        out = subprocess.run(
            [
                "powershell", "-NoProfile", "-Command",
                "(Get-CimInstance MSAcpi_ThermalZoneTemperature -Namespace 'root/wmi' -ErrorAction SilentlyContinue | "
                "Measure-Object CurrentTemperature -Maximum).Maximum"
            ],
            capture_output=True, text=True, timeout=3,
        )
        raw = (out.stdout or "").strip()
        if not raw:
            return None
        kelvin_10 = int(raw)
        celsius = (kelvin_10 / 10.0) - 273.15
        return celsius
    except Exception:
        return None


def is_paused() -> bool:
    return THERMAL_PAUSE_SENTINEL.exists()


def set_pause(reason: str):
    THERMAL_PAUSE_SENTINEL.parent.mkdir(parents=True, exist_ok=True)
    THERMAL_PAUSE_SENTINEL.write_text(reason, encoding="utf-8")


def clear_pause():
    try:
        THERMAL_PAUSE_SENTINEL.unlink()
    except FileNotFoundError:
        pass


def loop_once() -> dict:
    cpu = read_cpu_temp_c()
    paused = False
    if cpu is not None and cpu >= CPU_THRESHOLD_C:
        set_pause(f"cpu={cpu:.1f}C>={CPU_THRESHOLD_C}")
        paused = True
    elif is_paused() and cpu is not None and cpu < CPU_THRESHOLD_C - 5:
        clear_pause()
    return {"cpu_c": cpu, "paused": paused}


def run_forever():
    while True:
        loop_once()
        time.sleep(CHECK_INTERVAL_SEC)
