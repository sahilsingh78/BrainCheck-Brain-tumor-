import os
import random

_model = None


# 🔹 Lazy model loader (safe for Railway)
def load_model():
    global _model

    if _model is not None:
        return _model

    # 🚀 DEMO MODE (Railway safe)
    if os.getenv("DISABLE_MODEL", "true").lower() == "true":
        print("⚠️ Running in DEMO mode (model disabled)")
        _model = None
        return _model

    try:
        print("⏳ Loading TensorFlow model...")

        import tensorflow as tf  # lazy import
        model_path = os.getenv("MODEL_PATH", "model/brain_tumor_model.h5")

        _model = tf.keras.models.load_model(model_path)
        print(f"✅ Model loaded: {model_path}")

    except Exception as e:
        print(f"❌ Model load failed: {e}")
        _model = None

    return _model


# 🔹 Safe prediction (works always)
def predict(image_bytes):
    model = load_model()

    # 🧪 DEMO MODE (NO MODEL / NO LIBS)
    if model is None:
        val = random.random()
        has_tumor = val > 0.5

        return {
            "result": "Tumor Detected" if has_tumor else "No Tumor Detected",
            "confidence": round(val * 100, 2),
            "has_tumor": has_tumor,
            "mode": "demo"
        }

    # 🔬 REAL MODEL MODE
    try:
        import numpy as np
        from PIL import Image
        import io

        img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        img = img.resize((224, 224))

        img_array = np.array(img) / 255.0
        img_array = np.expand_dims(img_array, axis=0)

        prediction = model.predict(img_array, verbose=0)
        score = float(prediction[0][0])

        # ===============================
        # ✅ FIXED LOGIC (IMPORTANT)
        # ===============================
        prob_no_tumor = score
        prob_tumor = 1 - score

        has_tumor = prob_tumor > 0.5
        confidence = round(max(prob_tumor, prob_no_tumor) * 100, 2)

        return {
            "result": "Tumor Detected" if has_tumor else "No Tumor Detected",
            "confidence": confidence,
            "has_tumor": has_tumor,
            "mode": "ai"
        }

    except Exception as e:
        print(f"❌ Prediction failed: {e}")

        # fallback to demo
        val = random.random()
        has_tumor = val > 0.5

        return {
            "result": "Tumor Detected" if has_tumor else "No Tumor Detected",
            "confidence": round(val * 100, 2),
            "has_tumor": has_tumor,
            "mode": "fallback"
        }