from utils.db import get_db
from bson import ObjectId
import datetime


# 🔹 Serialize Mongo document → JSON safe
def serialize_user(user):
    return {
        "id": str(user["_id"]),
        "name": user.get("name", ""),
        "email": user.get("email", ""),
        "role": user.get("role", "patient"),
        "createdAt": user.get("createdAt", ""),
    }


# 🔹 Create User
def create_user(name, email, password, role="patient"):
    db = get_db()

    user = {
        "name": name,
        "email": email,
        "password": password,
        "role": role,
        "createdAt": datetime.datetime.utcnow().isoformat(),
    }

    result = db.users.insert_one(user)
    user["_id"] = result.inserted_id

    return serialize_user(user)


# 🔹 Find user by email
def find_user_by_email(email):
    db = get_db()
    return db.users.find_one({"email": email})


# 🔹 Find user by ID
def find_user_by_id(user_id):
    db = get_db()
    return db.users.find_one({"_id": ObjectId(user_id)})


# 🔹 Get all users
def get_all_users():
    db = get_db()
    users = list(db.users.find().sort("createdAt", -1))
    return [serialize_user(u) for u in users]


# 🔹 Update role
def update_user_role(user_id, role):
    db = get_db()
    db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"role": role}}
    )
    user = find_user_by_id(user_id)
    return serialize_user(user)


# 🔹 Delete user + their scans
def delete_user(user_id):
    db = get_db()
    db.users.delete_one({"_id": ObjectId(user_id)})
    db.scans.delete_many({"userId": ObjectId(user_id)})

    return True