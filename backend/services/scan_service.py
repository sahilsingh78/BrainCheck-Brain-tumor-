from models.scan_model import (
    create_scan,
    get_scans_by_user,
    get_all_scans,
    get_scan_by_id,
    review_scan,
    delete_scan
)
from models.user_model import find_user_by_id
from utils.predictor import predict
import base64


# 🔹 Process upload + prediction
def handle_scan_upload(user_id, image_bytes, ext, patient_name="", notes=""):
    # Run ML prediction
    prediction = predict(image_bytes)

    # Convert image → base64 (for frontend display)
    b64_image = base64.b64encode(image_bytes).decode("utf-8")
    image_data = f"data:image/{ext};base64,{b64_image}"

    # Get user if name not provided
    if not patient_name:
        user = find_user_by_id(user_id)
        patient_name = user.get("name", "Unknown") if user else "Unknown"

    # Save scan
    return create_scan(
        user_id=user_id,
        patient_name=patient_name,
        prediction=prediction,
        image_data=image_data,
        notes=notes
    )


# 🔹 Get user scans
def fetch_user_scans(user_id):
    return get_scans_by_user(user_id)


# 🔹 Get all scans (admin/doctor)
def fetch_all_scans():
    return get_all_scans()


# 🔹 Get single scan with access control
def fetch_scan_with_access(scan_id, user):
    scan = get_scan_by_id(scan_id)
    if not scan:
        return None, "Scan not found"

    is_owner = str(scan["userId"]) == str(user["_id"])
    is_privileged = user.get("role") in ["doctor", "admin"]

    if not is_owner and not is_privileged:
        return None, "Access denied"

    return scan, None


# 🔹 Review scan
def handle_review(scan_id, user, notes):
    if user.get("role") not in ["doctor", "admin"]:
        return None, "Only doctors/admin can review"

    updated = review_scan(scan_id, user.get("name"), notes)
    return updated, None


# 🔹 Delete scan
def handle_delete(scan_id, user):
    scan = get_scan_by_id(scan_id)
    if not scan:
        return "Scan not found"

    is_owner = str(scan["userId"]) == str(user["_id"])
    is_admin = user.get("role") == "admin"

    if not is_owner and not is_admin:
        return "Access denied"

    delete_scan(scan_id)
    return None