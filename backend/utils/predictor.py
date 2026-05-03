import os
import random

_model = None


# Lazy model loader — loads once on first request
def load_model():
    global _model

    if _model is not None:
        return _model

    if os.getenv("DISABLE_MODEL", "true").lower() == "true":
        print("Running in DEMO mode — set DISABLE_MODEL=false to use real model")
        return None

    try:
        print("Loading Deep Learning model (CNN + Attention Mechanism)...")

        import tensorflow as tf
        model_path = os.getenv("MODEL_PATH", "model/brain_tumor_model.h5")

        _model = tf.keras.models.load_model(model_path)
        print(f"Model loaded successfully: {model_path}")

    except Exception as e:
        print(f"Model load failed: {e}")
        _model = None

    return _model


def predict(image_bytes):
    model = load_model()

    # DEMO MODE — random predictions when model is disabled
    if model is None:
        val = random.random()
        has_tumor = val > 0.5
        return {
            "result": "Tumor Detected" if has_tumor else "No Tumor Detected",
            "confidence": round(val * 100, 2),
            "has_tumor": has_tumor,
            "mode": "demo",
            "note": "Demo mode — set DISABLE_MODEL=false for real predictions"
        }

    # REAL MODEL MODE — Deep Learning based CNN with Attention Mechanism
    try:
        import numpy as np
        from PIL import Image
        import io

        # Preprocess image — same as training pipeline
        img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        img = img.resize((224, 224))
        img_array = np.array(img) / 255.0           # normalize 0-255 → 0-1
        img_array = np.expand_dims(img_array, axis=0)  # add batch dimension

        # Run inference
        prediction = model.predict(img_array, verbose=0)
        score = float(prediction[0][0])

        print(f"Raw model score: {score}")

        # Class mapping from training: no=0, yes=1
        # So score >= 0.5 means Tumor (yes class)
        # score < 0.5 means No Tumor (no class)
        has_tumor = score >= 0.5
        confidence = round(score * 100 if has_tumor else (1 - score) * 100, 2)

        return {
            "result": "Tumor Detected" if has_tumor else "No Tumor Detected",
            "confidence": confidence,
            "has_tumor": has_tumor,
            "mode": "dl",
        }

    except Exception as e:
        print(f"Prediction failed: {e}")

        # Fallback to demo on error
        val = random.random()
        has_tumor = val > 0.5
        return {
            "result": "Tumor Detected" if has_tumor else "No Tumor Detected",
            "confidence": round(val * 100, 2),
            "has_tumor": has_tumor,
            "mode": "fallback",
            "note": f"Error: {str(e)}"
        }