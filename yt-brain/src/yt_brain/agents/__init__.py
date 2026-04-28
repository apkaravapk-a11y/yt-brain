"""Phase 18 agents — full agentic access (machine + web), gated by Π consent."""
from .web_payment_blocklist import is_payment_endpoint  # re-export

__all__ = ["is_payment_endpoint"]
