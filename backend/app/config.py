"""
Configuration Management

Centralized configuration using Pydantic Settings
for environment variable management.
"""

from typing import Optional
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""

    # Application Settings
    app_name: str = "Cooking Assistant"
    app_version: str = "1.0.0"
    debug: bool = False

    # Database Settings
    database_url: str = "sqlite+aiosqlite:///./cooking_assistant.db"
    database_echo: bool = False  # Set to True to log SQL queries

    # Security Settings
    secret_key: str = "your-secret-key-change-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30

    # CORS Settings
    cors_origins: list[str] = ["http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:3000", "http://127.0.0.1:5173"]

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, v):
        """Parse CORS origins from comma-separated string"""
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",")]
        return v

    # AI Provider Settings
    ai_provider: str = "openai"  # Options: openai, anthropic, ollama
    openai_api_key: Optional[str] = None
    anthropic_api_key: Optional[str] = None
    ollama_base_url: str = "http://localhost:11434"

    # Vector Database Settings (for Phase 2)
    vector_db_enabled: bool = False
    vector_db_path: str = "./chroma_db"

    # File Storage Settings
    upload_dir: str = "./uploads"
    max_upload_size: int = 5 * 1024 * 1024  # 5MB

    # API Rate Limiting
    rate_limit_enabled: bool = True
    rate_limit_per_minute: int = 60

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore"
    )


# Global settings instance
settings = Settings()


def get_settings() -> Settings:
    """Dependency function to get settings instance"""
    return settings
