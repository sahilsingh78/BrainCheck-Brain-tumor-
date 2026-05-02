from pymongo import MongoClient
from dotenv import load_dotenv
import os

load_dotenv()

_client = None
_db = None


def get_db():
    global _client, _db

    if _db is None:
        mongo_uri = os.getenv("MONGO_URI", "mongodb://localhost:27017/braincheck")

        _client = MongoClient(mongo_uri)
        _db = _client.get_default_database()

        print("✅ MongoDB Connected")

    return _db