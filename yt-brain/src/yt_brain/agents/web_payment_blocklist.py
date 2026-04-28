"""Hard-deny list for payment endpoints. Boundary 1: no money outside Max."""
from __future__ import annotations
from urllib.parse import urlparse

PAYMENT_HOSTS = frozenset({
    # Card processors
    "api.stripe.com", "checkout.stripe.com", "js.stripe.com",
    "api.adyen.com", "checkout.adyen.com",
    "api.braintreegateway.com",
    "api-m.paypal.com", "api-m.sandbox.paypal.com", "www.paypal.com",
    "api.razorpay.com", "checkout.razorpay.com",
    "api.cashfree.com", "api.payu.in", "secure.payu.in",
    "instamojo.com", "www.instamojo.com",
    # Crypto / exchanges (irreversible by definition)
    "api.coinbase.com", "api.binance.com", "api.kraken.com",
    "api.metamask.io",
    # Generic billing
    "api.chargebee.com", "api.recurly.com", "api.gocardless.com",
})

PAYMENT_PATH_HINTS = ("/charge", "/checkout", "/payment", "/orders/pay",
                      "/transfer", "/withdraw", "/swap")


def is_payment_endpoint(url_or_text: str) -> bool:
    s = (url_or_text or "").strip().lower()
    if not s:
        return False
    try:
        u = urlparse(s if "://" in s else f"https://{s}")
        host = (u.hostname or "").lower()
        path = (u.path or "").lower()
    except Exception:
        return False
    if host in PAYMENT_HOSTS:
        return True
    # Also catch path hints on otherwise unknown hosts.
    if any(host.endswith(h) for h in PAYMENT_HOSTS):
        return True
    if any(hint in path for hint in PAYMENT_PATH_HINTS):
        return True
    return False
