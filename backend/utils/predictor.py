import numpy as np
from PIL import Image
import io
import os

_model = None


# 🔹 Lazy safe loader (NO import error)
def load_model():
    global _model

    if _model is not None:
        return _model

    # 🚀 Disable model for Railway (fast startup)
    if os.getenv("DISABLE_MODEL", "true").lower() == "true":
        print("⚠️ Running in DEMO mode (model disabled)")
        _model = None
        return _model

    model_path = os.getenv("MODEL_PATH", "model/brain_tumor_model.h5")

    try:
        print("⏳ Loading TensorFlow model...")

        # ✅ IMPORT INSIDE TRY (fixes Pylance + Railway crash)
        import tensorflow as tf
        _model = tf.keras.models.load_model(model_path)

        print(f"✅ Model loaded: {model_path}")

    except Exception as e:
        print(f"❌ Model load failed: {e}")
        _model = None

    return _model


# 🔹 Preprocess image
def preprocess(image_bytes):
    try:
        img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        img = img.resize((224, 224))

        img_array = np.array(img) / 255.0
        img_array = np.expand_dims(img_array, axis=0)

        return img_array

    except Exception as e:
        raise ValueError(f"Image preprocessing failed: {str(e)}")


# 🔹 Prediction
def predict(image_bytes):
    model = load_model()

    # 🧪 DEMO MODE (NO MODEL)
    if model is None:
        import random

        val = random.random()
        has_tumor = val > 0.5

        return {
            "result": "Tumor Detected" if has_tumor else "No Tumor Detected",
            "confidence": round(val * 100, 2),
            "has_tumor": has_tumor,
            "mode": "demo"
        }

    # 🔬 REAL MODEL
    try:
        img = preprocess(image_bytes)

        prediction = model.predict(img, verbose=0)
        score = float(prediction[0][0])

        has_tumor = score >= 0.5
        confidence = round(max(score, 1 - score) * 100, 2)

        return {
            "result": "Tumor Detected" if has_tumor else "No Tumor Detected",
            "confidence": confidence,
            "has_tumor": has_tumor,
            "mode": "ai"
        }

    except Exception as e:
        raise RuntimeError(f"Prediction failed: {str(e)}")