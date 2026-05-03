import os
import random

_model = None


# Lazy model loader — only loads once on first prediction request
def load_model():
    global _model

    if _model is not None:
        return _model

    # Check if model is disabled via env var (set DISABLE_MODEL=false to use real model)
    if os.getenv("DISABLE_MODEL", "true").lower() == "true":
        print("Running in DEMO mode — set DISABLE_MODEL=false to use real model")
        _model = None
        return _model

    try:
        print("Loading Deep Learning model (CNN + Attention)...")

        import tensorflow as tf  # lazy import to keep startup fast
        model_path = os.getenv("MODEL_PATH", "model/brain_tumor_model.h5")

        _model = tf.keras.models.load_model(model_path)
        print(f"Model loaded successfully from: {model_path}")

    except Exception as e:
        print(f"Model load failed: {e}")
        _model = None

    return _model


# Main prediction function — called on every MRI upload
def predict(image_bytes):
    model = load_model()

    # DEMO MODE — runs when DISABLE_MODEL=true or model file not found
    if model is None:
        val = random.random()
        has_tumor = val > 0.5

        return {
            "result": "Tumor Detected" if has_tumor else "No Tumor Detected",
            "confidence": round(val * 100, 2),
            "has_tumor": has_tumor,
            "mode": "demo",
            "note": "Demo mode — set DISABLE_MODEL=false and provide model file for real predictions"
        }

    # REAL MODEL MODE — Deep Learning based CNN with Attention Mechanism
    try:
        import numpy as np
        from PIL import Image
        import io

        # Preprocess the MRI image to match training input shape (224x224 RGB)
        img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        img = img.resize((224, 224))

        # Normalize pixel values from 0-255 to 0-1 (same as training)
        img_array = np.array(img) / 255.0
        img_array = np.expand_dims(img_array, axis=0)  # add batch dimension

        # Run inference
        prediction = model.predict(img_array, verbose=0)
        score = float(prediction[0][0])

        # The model outputs a sigmoid score between 0 and 1
        # Based on training: score close to 1 = No Tumor, score close to 0 = Tumor
        # So we invert: prob_tumor = 1 - score
        prob_no_tumor = score
        prob_tumor = 1 - score

        has_tumor = prob_tumor > 0.5
        confidence = round(max(prob_tumor, prob_no_tumor) * 100, 2)

        return {
            "result": "Tumor Detected" if has_tumor else "No Tumor Detected",
            "confidence": confidence,
            "has_tumor": has_tumor,
            "mode": "dl",  # deep learning mode
        }

    except Exception as e:
        print(f"Prediction failed: {e}")

        # Fallback to demo if prediction crashes
        val = random.random()
        has_tumor = val > 0.5

        return {
            "result": "Tumor Detected" if has_tumor else "No Tumor Detected",
            "confidence": round(val * 100, 2),
            "has_tumor": has_tumor,
            "mode": "fallback",
            "note": f"Prediction error: {str(e)}"
        }