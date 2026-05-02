from flask import Blueprint, request, jsonify
from middleware.auth_middleware import auth_required
from middleware.role_middleware import require_roles
from utils.db import get_db
from utils.predictor import predict
from bson import ObjectId, errors as bson_errors
import datetime
import base64

scans_bp = Blueprint("scans", __name__)

ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "webp"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB


# 🔹 Serialize scan
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


# 🔹 File validation
def validate_file(file):
    if not file or file.filename == "":
        return "No file selected"

    ext = file.filename.rsplit(".", 1)[-1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        return "Only PNG, JPG, JPEG, WEBP files are allowed"

    return None

@scans_bp.route("/upload", methods=["POST"])
@auth_required()
def upload_scan(user):
    if "image" not in request.files:
        return jsonify({"message": "MRI image file is required"}), 400

    file = request.files["image"]

    error = validate_file(file)
    if error:
        return jsonify({"message": error}), 400

    ext = file.filename.rsplit(".", 1)[-1].lower()
    image_bytes = file.read()

    if len(image_bytes) > MAX_FILE_SIZE:
        return jsonify({"message": "File too large (max 5MB)"}), 400

    # 🔥 Prediction
    try:
        prediction = predict(image_bytes)
    except Exception as e:
        return jsonify({"message": "Prediction failed", "error": str(e)}), 500

    # Convert image → base64
    b64_image = base64.b64encode(image_bytes).decode("utf-8")
    image_data = f"data:image/{ext};base64,{b64_image}"

    db = get_db()

    patient_name = request.form.get("patientName", "").strip() or user.get("name", "Unknown")

    scan = {
        "userId": ObjectId(user["_id"]),
        "patientName": patient_name,
        "result": prediction["result"],
        "confidence": prediction["confidence"],
        "hasTumor": prediction["has_tumor"],
        "notes": request.form.get("notes", ""),
        "imageData": image_data,
        "uploadedAt": datetime.datetime.utcnow().isoformat(),
        "status": "pending",
        "reviewedBy": "",
    }

    result = db.scans.insert_one(scan)
    scan["_id"] = result.inserted_id

    return jsonify(serialize_scan(scan)), 201

@scans_bp.route("/my", methods=["GET"])
@auth_required()
def my_scans(user):
    db = get_db()

    scans = list(
        db.scans.find({"userId": ObjectId(user["_id"])}).sort("uploadedAt", -1)
    )

    return jsonify([serialize_scan(s) for s in scans]), 200


@scans_bp.route("/<scan_id>", methods=["GET"])
@auth_required()
def get_scan(user, scan_id):
    db = get_db()

    try:
        scan = db.scans.find_one({"_id": ObjectId(scan_id)})
    except bson_errors.InvalidId:
        return jsonify({"message": "Invalid scan ID"}), 400

    if not scan:
        return jsonify({"message": "Scan not found"}), 404

    is_owner = str(scan["userId"]) == str(user["_id"])
    is_privileged = user.get("role") in ["doctor", "admin"]

    if not is_owner and not is_privileged:
        return jsonify({"message": "Access denied"}), 403

    return jsonify(serialize_scan(scan)), 200

@scans_bp.route("/<scan_id>/review", methods=["PUT"])
@auth_required()
@require_roles("doctor", "admin")
def review_scan(user, scan_id):
    db = get_db()

    data = request.get_json() or {}
    notes = data.get("notes", "")

    try:
        result = db.scans.update_one(
            {"_id": ObjectId(scan_id)},
            {
                "$set": {
                    "notes": notes,
                    "status": "reviewed",
                    "reviewedBy": user.get("name", ""),
                }
            }
        )
    except bson_errors.InvalidId:
        return jsonify({"message": "Invalid scan ID"}), 400

    if result.matched_count == 0:
        return jsonify({"message": "Scan not found"}), 404

    scan = db.scans.find_one({"_id": ObjectId(scan_id)})
    return jsonify(serialize_scan(scan)), 200


@scans_bp.route("/<scan_id>", methods=["DELETE"])
@auth_required()
def delete_scan(user, scan_id):
    db = get_db()

    try:
        scan = db.scans.find_one({"_id": ObjectId(scan_id)})
    except bson_errors.InvalidId:
        return jsonify({"message": "Invalid scan ID"}), 400

    if not scan:
        return jsonify({"message": "Scan not found"}), 404

    is_owner = str(scan["userId"]) == str(user["_id"])
    is_admin = user.get("role") == "admin"

    if not is_owner and not is_admin:
        return jsonify({"message": "Access denied"}), 403

    db.scans.delete_one({"_id": ObjectId(scan_id)})

    return jsonify({"message": "Scan deleted"}), 200