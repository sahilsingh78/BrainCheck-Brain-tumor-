from utils.db import get_db
from bson import ObjectId
import datetime


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


# 🔹 Create Scan
def create_scan(user_id, patient_name, prediction, image_data, notes=""):
    db = get_db()

    scan = {
        "userId": ObjectId(user_id),
        "patientName": patient_name,
        "result": prediction["result"],
        "confidence": prediction["confidence"],
        "hasTumor": prediction["has_tumor"],
        "notes": notes,
        "imageData": image_data,
        "uploadedAt": datetime.datetime.utcnow().isoformat(),
        "status": "pending",
        "reviewedBy": "",
    }

    result = db.scans.insert_one(scan)
    scan["_id"] = result.inserted_id

    return serialize_scan(scan)


# 🔹 Get scans by user
def get_scans_by_user(user_id):
    db = get_db()
    scans = list(
        db.scans.find({"userId": ObjectId(user_id)}).sort("uploadedAt", -1)
    )
    return [serialize_scan(s) for s in scans]


# 🔹 Get all scans
def get_all_scans():
    db = get_db()
    scans = list(db.scans.find().sort("uploadedAt", -1))
    return [serialize_scan(s) for s in scans]


# 🔹 Get single scan
def get_scan_by_id(scan_id):
    db = get_db()
    return db.scans.find_one({"_id": ObjectId(scan_id)})


# 🔹 Review scan
def review_scan(scan_id, doctor_name, notes):
    db = get_db()

    db.scans.update_one(
        {"_id": ObjectId(scan_id)},
        {
            "$set": {
                "notes": notes,
                "status": "reviewed",
                "reviewedBy": doctor_name,
            }
        },
    )

    scan = get_scan_by_id(scan_id)
    return serialize_scan(scan)


# 🔹 Delete scan
def delete_scan(scan_id):
    db = get_db()
    db.scans.delete_one({"_id": ObjectId(scan_id)})
    return True