from __future__ import annotations
import requests as http_requests
import hmac, hashlib, json
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

# ── Razorpay Test credentials (swap with live keys in production)
RAZORPAY_KEY_ID = "rzp_test_XXXXXXXXXXXXXX"       # ← Replace with your Razorpay Test Key ID
RAZORPAY_KEY_SECRET = "XXXXXXXXXXXXXXXXXXXXXXXX"  # ← Replace with your Razorpay Test Key Secret

router = APIRouter(prefix="/payments", tags=["payments"])

# ─── Schema ───────────────────────────────────────────────────────────────────
class CreateOrderRequest(BaseModel):
    amount: int           # Amount in paise (₹1 = 100 paise)
    currency: str = "INR"
    receipt: str = "receipt_001"
    notes: dict = {}

class VerifyPaymentRequest(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str

# ─── Create Razorpay Order ────────────────────────────────────────────────────
@router.post("/create-order")
def create_order(request: CreateOrderRequest):
    """Create a Razorpay payment order and return the order_id to the frontend."""
    if "XXXX" in RAZORPAY_KEY_ID or RAZORPAY_KEY_ID.startswith("rzp_test_X"):
        import time
        return {
            "order_id": f"order_demo_{int(time.time())}",
            "amount": request.amount,
            "currency": request.currency,
            "key_id": "rzp_test_demo",
            "is_demo_mode": True
        }

    url = "https://api.razorpay.com/v1/orders"
    payload = {
        "amount": request.amount,
        "currency": request.currency,
        "receipt": request.receipt,
        "notes": request.notes,
    }
    response = http_requests.post(
        url,
        auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET),
        json=payload,
    )
    if response.status_code != 200:
        raise HTTPException(status_code=502, detail=f"Razorpay error: {response.text}")
    data = response.json()
    return {
        "order_id": data["id"],
        "amount": data["amount"],
        "currency": data["currency"],
        "key_id": RAZORPAY_KEY_ID,
    }

# ─── Verify payment signature ─────────────────────────────────────────────────
@router.post("/verify")
def verify_payment(request: VerifyPaymentRequest):
    """Verify Razorpay payment signature after checkout completes."""
    if "XXXX" in RAZORPAY_KEY_ID or request.razorpay_order_id.startswith("order_demo_"):
        return {"status": "success", "message": "Payment verified successfully (Demo Mode)"}

    body = f"{request.razorpay_order_id}|{request.razorpay_payment_id}"
    expected_signature = hmac.new(
        RAZORPAY_KEY_SECRET.encode("utf-8"),
        body.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()
    if expected_signature != request.razorpay_signature:
        raise HTTPException(status_code=400, detail="Payment signature mismatch")
    return {"status": "success", "message": "Payment verified successfully"}

