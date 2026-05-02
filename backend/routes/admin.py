from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from utils.db import get_db
from bson import ObjectId, errors as bson_errors

admin_bp = Blueprint("admin", __name__)

MAX_LIMIT = 50


# 🔹 Helpers
def serialize_user(user):
    return {
        "id": str(user["_id"]),
        "name": user.get("name", ""),
        "email": user.get("email", ""),
        "role": user.get("role", "patient"),
        "createdAt": user.get("createdAt", ""),
    }


def serialize_scan(scan):
    return {
        "id": str(scan["_id"]),
        "userId": str(scan.get("userId", "")),
        "patientName": scan.get("patientName", ""),
        "result": scan.get("result", ""),
        "confidence": scan.get("confidence", 0),
        "hasTumor": scan.get("hasTumor", False),
        "notes": scan.get("notes", ""),
        "imageData": scan.get("imageData", ""),
        "uploadedAt": scan.get("uploadedAt", ""),
        "reviewedBy": scan.get("reviewedBy", ""),
        "status": scan.get("status", "pending"),
    }


def get_admin():
    """Validate admin user and return user doc."""
    db = get_db()
    user_id = get_jwt_identity()

    try:
        user = db.users.find_one({"_id": ObjectId(user_id)})
    except bson_errors.InvalidId:
        return None

    if not user or user.get("role") != "admin":
        return None

    return user

@admin_bp.route("/users", methods=["GET"])
@jwt_required()
def get_all_users():
    admin = get_admin()
    if not admin:
        return jsonify({"message": "Admin access required"}), 403

    db = get_db()

    page = int(request.args.get("page", 1))
    limit = min(int(request.args.get("limit", 10)), MAX_LIMIT)
    skip = (page - 1) * limit

    users = list(
        db.users.find()
        .sort("createdAt", -1)
        .skip(skip)
        .limit(limit)
    )

    total = db.users.count_documents({})

    return jsonify({
        "data": [serialize_user(u) for u in users],
        "total": total,
        "page": page,
        "limit": limit
    }), 200


@admin_bp.route("/users/<target_id>/role", methods=["PUT"])
@jwt_required()
def change_role(target_id):
    admin = get_admin()
    if not admin:
        return jsonify({"message": "Admin access required"}), 403

    if target_id == str(admin["_id"]):
        return jsonify({"message": "You cannot change your own role"}), 400

    data = request.get_json() or {}
    new_role = data.get("role", "")

    if new_role not in ["patient", "doctor", "admin"]:
        return jsonify({"message": "Invalid role"}), 400

    db = get_db()

    try:
        result = db.users.update_one(
            {"_id": ObjectId(target_id)},
            {"$set": {"role": new_role}}
        )
    except bson_errors.InvalidId:
        return jsonify({"message": "Invalid user ID"}), 400

    if result.matched_count == 0:
        return jsonify({"message": "User not found"}), 404

    user = db.users.find_one({"_id": ObjectId(target_id)})
    return jsonify(serialize_user(user)), 200

@admin_bp.route("/users/<target_id>", methods=["DELETE"])
@jwt_required()
def delete_user(target_id):
    admin = get_admin()
    if not admin:
        return jsonify({"message": "Admin access required"}), 403

    if target_id == str(admin["_id"]):
        return jsonify({"message": "You cannot delete yourself"}), 400

    db = get_db()

    try:
        result = db.users.delete_one({"_id": ObjectId(target_id)})
    except bson_errors.InvalidId:
        return jsonify({"message": "Invalid user ID"}), 400

    if result.deleted_count == 0:
        return jsonify({"message": "User not found"}), 404

    # cleanup scans
    db.scans.delete_many({"userId": ObjectId(target_id)})

    return jsonify({"message": "User and their scans deleted"}), 200


@admin_bp.route("/scans", methods=["GET"])
@jwt_required()
def get_all_scans():
    admin = get_admin()
    if not admin:
        return jsonify({"message": "Admin access required"}), 403

    db = get_db()

    page = int(request.args.get("page", 1))
    limit = min(int(request.args.get("limit", 10)), MAX_LIMIT)
    skip = (page - 1) * limit

    scans = list(
        db.scans.find()
        .sort("uploadedAt", -1)
        .skip(skip)
        .limit(limit)
    )

    total = db.scans.count_documents({})

    return jsonify({
        "data": [serialize_scan(s) for s in scans],
        "total": total,
        "page": page,
        "limit": limit
    }), 200

@admin_bp.route("/stats", methods=["GET"])
@jwt_required()
def get_stats():
    admin = get_admin()
    if not admin:
        return jsonify({"message": "Admin access required"}), 403

    db = get_db()

    return jsonify({
        "totalUsers": db.users.count_documents({}),
        "totalDoctors": db.users.count_documents({"role": "doctor"}),
        "totalPatients": db.users.count_documents({"role": "patient"}),
        "totalScans": db.scans.count_documents({}),
        "tumorDetected": db.scans.count_documents({"hasTumor": True}),
        "pendingReview": db.scans.count_documents({"status": "pending"}),
    }), 200