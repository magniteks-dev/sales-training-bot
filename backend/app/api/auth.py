import hashlib
import hmac
import json
from datetime import datetime, timedelta
from urllib.parse import unquote, parse_qs

from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError

from app.config import settings
from app.models.schemas import TelegramAuthData, AdminLoginRequest, TokenResponse
from app.services.supabase_service import get_supabase

router = APIRouter()
security = HTTPBearer()

JWT_ALGORITHM = "HS256"
JWT_EXPIRE_HOURS = 24 * 7  # 7 days


def create_token(user_id: str, role: str) -> str:
    expire = datetime.utcnow() + timedelta(hours=JWT_EXPIRE_HOURS)
    payload = {"sub": user_id, "role": role, "exp": expire}
    return jwt.encode(payload, settings.jwt_secret, algorithm=JWT_ALGORITHM)


def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    try:
        payload = jwt.decode(credentials.credentials, settings.jwt_secret, algorithms=[JWT_ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")


def require_admin(payload: dict = Depends(verify_token)) -> dict:
    if payload.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return payload


def verify_telegram_init_data(init_data: str) -> dict:
    """Verify Telegram WebApp initData signature."""
    parsed = parse_qs(init_data, keep_blank_values=True)
    data_check_string_parts = []
    hash_value = None

    for key, values in sorted(parsed.items()):
        if key == "hash":
            hash_value = values[0]
        else:
            data_check_string_parts.append(f"{key}={values[0]}")

    if not hash_value:
        raise HTTPException(status_code=400, detail="Missing hash in init_data")

    data_check_string = "\n".join(data_check_string_parts)
    secret_key = hmac.new(b"WebAppData", settings.telegram_bot_token.encode(), hashlib.sha256).digest()
    computed_hash = hmac.new(secret_key, data_check_string.encode(), hashlib.sha256).hexdigest()

    if not hmac.compare_digest(computed_hash, hash_value):
        raise HTTPException(status_code=401, detail="Invalid Telegram signature")

    user_str = parsed.get("user", [None])[0]
    if not user_str:
        raise HTTPException(status_code=400, detail="Missing user data")

    return json.loads(unquote(user_str))


@router.post("/telegram", response_model=TokenResponse)
async def telegram_auth(data: TelegramAuthData):
    user_data = verify_telegram_init_data(data.init_data)

    telegram_id = user_data["id"]
    first_name = user_data.get("first_name", "")
    last_name = user_data.get("last_name")
    username = user_data.get("username")

    db = get_supabase()
    result = db.table("users").select("*").eq("telegram_id", telegram_id).execute()

    if result.data:
        user = result.data[0]
    else:
        insert_result = db.table("users").insert({
            "telegram_id": telegram_id,
            "first_name": first_name,
            "last_name": last_name,
            "username": username,
            "role": "trainee",
        }).execute()
        user = insert_result.data[0]

    token = create_token(user["id"], user["role"])
    return TokenResponse(access_token=token, user_id=user["id"], role=user["role"])


@router.post("/admin/login", response_model=TokenResponse)
async def admin_login(data: AdminLoginRequest):
    if data.password != settings.admin_password:
        raise HTTPException(status_code=401, detail="Invalid password")

    db = get_supabase()
    result = db.table("users").select("*").eq("role", "admin").execute()

    if not result.data:
        insert_result = db.table("users").insert({
            "telegram_id": 0,
            "first_name": "Admin",
            "role": "admin",
        }).execute()
        admin_user = insert_result.data[0]
    else:
        admin_user = result.data[0]

    token = create_token(admin_user["id"], "admin")
    return TokenResponse(access_token=token, user_id=admin_user["id"], role="admin")


@router.get("/me")
async def get_me(payload: dict = Depends(verify_token)):
    db = get_supabase()
    result = db.table("users").select("*").eq("id", payload["sub"]).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="User not found")
    return result.data[0]
