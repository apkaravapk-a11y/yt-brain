"""Plan parser + step executor.

A plan is a list of (action, params) tuples. The runtime walks them; each step
goes through Π via the namespaced policy. Stops at the first deny unless
`continue_on_deny` is set.
"""
from __future__ import annotations
from dataclasses import dataclass, field
from typing import Any

from ..consent.policy import ConsentPolicy
from .machine import Result, read_file, write_file, delete_file, run_shell, git_commit, git_push, install_package
from .web import web_fetch, web_search


@dataclass
class PlanStep:
    op: str               # "fs.read" | "fs.write" | "fs.delete" | "shell.run" | "git.commit" |
                          # "git.push" | "install" | "web.fetch" | "web.search"
    params: dict
    label: str = ""


@dataclass
class PlanResult:
    steps: list[Result] = field(default_factory=list)
    halted: bool = False

    def to_dict(self) -> dict[str, Any]:
        return {"halted": self.halted, "steps": [s.to_dict() for s in self.steps]}


def execute_plan(policy: ConsentPolicy, plan: list[PlanStep],
                 *, continue_on_deny: bool = False) -> PlanResult:
    out = PlanResult()
    for step in plan:
        try:
            r = _dispatch(policy, step)
        except Exception as exc:
            r = Result(False, "deny", f"runtime exception: {exc}", evidence={"step": step.op})
        out.steps.append(r)
        if not r.ok and not continue_on_deny:
            out.halted = True
            break
    return out


def _dispatch(policy: ConsentPolicy, step: PlanStep) -> Result:
    p = step.params
    op = step.op
    if op == "fs.read":   return read_file(policy, p["path"])
    if op == "fs.write":  return write_file(policy, p["path"], p.get("content", ""))
    if op == "fs.delete": return delete_file(policy, p["path"])
    if op == "shell.run": return run_shell(policy, p["command"], cwd=p.get("cwd"))
    if op == "git.commit":return git_commit(policy, p["repo"], p["message"])
    if op == "git.push":  return git_push(policy, p["repo"], force=bool(p.get("force")))
    if op == "install":   return install_package(policy, p["manager"], p["name"])
    if op == "web.fetch": return web_fetch(policy, p["url"], method=p.get("method", "GET"), body=p.get("body"))
    if op == "web.search":return web_search(policy, p["query"], limit=int(p.get("limit", 8)))
    return Result(False, "deny", f"unknown op: {op}", evidence={"step": op})


def parse_intent(intent: str) -> list[PlanStep]:
    """Tiny rule-based intent → plan. The real Watchlight will replace this with
    an LLM call; this stub is enough for the canary smoke tests."""
    s = (intent or "").lower()
    if "list downloads" in s:
        return [PlanStep("shell.run", {"command": "dir C:/Users/apkar/Downloads"}, "List Downloads")]
    if "fetch github" in s:
        return [PlanStep("web.fetch", {"url": "https://api.github.com/zen"}, "Test GitHub fetch")]
    if "search" in s and "for" in s:
        q = intent.split("for", 1)[1].strip()
        return [PlanStep("web.search", {"query": q}, f"Search for {q}")]
    return [PlanStep("shell.run", {"command": "echo unrecognized intent"}, "Default echo")]
