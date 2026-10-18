from __future__ import annotations
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./sql_app.db"
    SECRET_KEY: str = "yoursecretkeyhere123!"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 300

    # Admin Credentials
    ADMIN_EMAIL: str = "admin@admin.com"
    ADMIN_PASSWORD_HASH: str = "$2b$12$iFAaFEWqqfsQcXuCm9cYfe7GYCaz/oTSHzBl.lXIHIbHg5hh/R7Xu"  # 123456

    # SMS Gateway (Fast2SMS)
    FAST2SMS_API_KEY: str = ""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()