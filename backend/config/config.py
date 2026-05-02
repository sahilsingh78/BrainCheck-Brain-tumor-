import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()


class Config:
    """Base configuration"""
    SECRET_KEY = os.getenv("JWT_SECRET_KEY", "super-secret-key")
    MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/braincheck")
    MODEL_PATH = os.getenv("MODEL_PATH", "model/brain_tumor_model.h5")

    # JWT
    JWT_SECRET_KEY = SECRET_KEY
    JWT_ACCESS_TOKEN_EXPIRES = False  # For development (no expiry)

    # Upload settings
    MAX_CONTENT_LENGTH = 5 * 1024 * 1024  # 5MB limit
    ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "webp"}


class DevelopmentConfig(Config):
    """Development config"""
    DEBUG = True


class ProductionConfig(Config):
    """Production config"""
    DEBUG = False
    JWT_ACCESS_TOKEN_EXPIRES = 3600  # 1 hour expiry in production


# Choose config based on environment
config_dict = {
    "development": DevelopmentConfig,
    "production": ProductionConfig
}