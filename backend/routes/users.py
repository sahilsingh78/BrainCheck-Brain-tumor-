from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from utils.db import get_db
from bson import ObjectId, errors as bson_errors

users_bp = Blueprint("users", __name__)

MAX_RESULTS = 10


def serialize_user(user):
    return {
        "id": str(user["_id"]),
        "name": user.get("name", ""),
        "email": user.get("email", ""),
        "role": user.get("role", "patient"),
        "createdAt": user.get("createdAt", ""),
    }


def is_valid_object_id(oid):
    try:
        ObjectId(oid)
        return True
    except bson_errors.InvalidId:
        return False


# GET /api/users/search?q=&role=patient
@users_bp.route("/search", methods=["GET"])
@jwt_required()
def search_users():
    user_id = get_jwt_identity()
    db = get_db()

    # 🔹 Validate caller ID
    if not is_valid_object_id(user_id):
        return jsonify({"message": "Invalid user token"}), 400

    caller = db.users.find_one({"_id": ObjectId(user_id)})
    if not caller or caller.get("role") not in ["doctor", "admin"]:
        return jsonify({"message": "Access denied"}), 403

    # 🔹 Query params
    q = (request.args.get("q") or "").strip()
    role = (request.args.get("role") or "").strip()  # optional filter
    limit = min(int(request.args.get("limit", MAX_RESULTS)), 50)

    if not q:
        return jsonify([]), 200

    # 🔹 Build query
    query = {
        "$or": [
            {"name": {"$regex": q, "$options": "i"}},
            {"email": {"$regex": q, "$options": "i"}},
        ]
    }

    # Optional role filter (e.g., only patients)
    if role in ["patient", "doctor", "admin"]:
        query["role"] = role

    try:
        users = list(
            db.users.find(query)
            .sort("createdAt", -1)
            .limit(limit)
        )

        return jsonify([serialize_user(u) for u in users]), 200

    except Exception as e:
        return jsonify({
            "message": "Search failed",
            "error": str(e)
        }), 500