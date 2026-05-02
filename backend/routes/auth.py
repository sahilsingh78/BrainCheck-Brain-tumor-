from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    create_access_token,
    jwt_required,
    get_jwt_identity
)
from utils.db import get_db
from bson import ObjectId
import bcrypt
import datetime

auth_bp = Blueprint("auth", __name__)


# 🔐 Password helpers
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def check_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode("utf-8"), hashed.encode("utf-8"))


# 🔹 Serialize user
def serialize_user(user):
    return {
        "id": str(user["_id"]),
        "name": user.get("name", ""),
        "email": user.get("email", ""),
        "role": user.get("role", "patient"),
        "createdAt": user.get("createdAt", ""),
    }


# 🧠 Helper: validate email/password
def validate_register_data(data):
    name = data.get("name", "").strip()
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")
    role = data.get("role", "patient")

    if not name or not email or not password:
        return None, "Name, email and password are required"

    if len(password) < 6:
        return None, "Password must be at least 6 characters"

    if role not in ["patient", "doctor", "admin"]:
        role = "patient"

    return {
        "name": name,
        "email": email,
        "password": password,
        "role": role
    }, None

@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json() or {}

    validated, error = validate_register_data(data)
    if error:
        return jsonify({"message": error}), 400

    db = get_db()

    # Check existing user
    if db.users.find_one({"email": validated["email"]}):
        return jsonify({"message": "Email is already registered"}), 400

    # Create user
    user = {
        "name": validated["name"],
        "email": validated["email"],
        "password": hash_password(validated["password"]),
        "role": validated["role"],
        "createdAt": datetime.datetime.utcnow().isoformat(),
    }

    result = db.users.insert_one(user)
    user["_id"] = result.inserted_id

    token = create_access_token(identity=str(result.inserted_id))

    return jsonify({
        "user": serialize_user(user),
        "token": token
    }), 201

@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json() or {}

    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if not email or not password:
        return jsonify({"message": "Email and password are required"}), 400

    db = get_db()
    user = db.users.find_one({"email": email})

    if not user or not check_password(password, user["password"]):
        return jsonify({"message": "Invalid email or password"}), 401

    token = create_access_token(identity=str(user["_id"]))

    return jsonify({
        "user": serialize_user(user),
        "token": token
    }), 200

@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def me():
    try:
        user_id = get_jwt_identity()
        db = get_db()

        user = db.users.find_one({"_id": ObjectId(user_id)})

        if not user:
            return jsonify({"message": "User not found"}), 404

        return jsonify(serialize_user(user)), 200

    except Exception as e:
        return jsonify({"message": "Failed to fetch user", "error": str(e)}), 500