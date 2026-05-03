import tensorflow as tf
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras import layers, models
import matplotlib.pyplot as plt
import os

# Dataset path — must have subfolders: dataset/yes/ and dataset/no/
DATASET_PATH = "dataset"
MODEL_SAVE_PATH = "model/brain_tumor_model.h5"

os.makedirs("model", exist_ok=True)

# Data augmentation + normalization
# Augmentation helps model generalize better with limited data
datagen = ImageDataGenerator(
    rescale=1.0 / 255,          # normalize 0-255 → 0-1
    rotation_range=15,           # random rotation
    horizontal_flip=True,        # random flip
    zoom_range=0.1,              # slight zoom
    validation_split=0.2         # 80% train, 20% validation
)

train = datagen.flow_from_directory(
    DATASET_PATH,
    target_size=(224, 224),
    batch_size=32,
    class_mode="binary",
    subset="training",
    shuffle=True
)

val = datagen.flow_from_directory(
    DATASET_PATH,
    target_size=(224, 224),
    batch_size=32,
    class_mode="binary",
    subset="validation",
    shuffle=False
)

# Print class mapping so we know which label = tumor
print("Class indices:", train.class_indices)
# Expected output: {'no': 0, 'yes': 1}
# This means: score >= 0.5 → Tumor (yes=1)

# CNN Model with Attention Mechanism
# ─────────────────────────────────
inputs = tf.keras.Input(shape=(224, 224, 3))

# Block 1
x = layers.Conv2D(32, (3, 3), activation="relu", padding="same")(inputs)
x = layers.MaxPooling2D()(x)

# Block 2
x = layers.Conv2D(64, (3, 3), activation="relu", padding="same")(x)
x = layers.MaxPooling2D()(x)

# Block 3
x = layers.Conv2D(128, (3, 3), activation="relu", padding="same")(x)
x = layers.MaxPooling2D()(x)

# Attention Mechanism
# Squeeze: global average pooling to get channel weights
attention = layers.GlobalAveragePooling2D()(x)
attention = layers.Dense(128, activation="relu")(attention)
attention = layers.Dense(128, activation="sigmoid")(attention)
attention = layers.Reshape((1, 1, 128))(attention)

# Scale feature maps by attention weights
x = layers.Multiply()([x, attention])

# Classification head
x = layers.GlobalAveragePooling2D()(x)
x = layers.Dense(128, activation="relu")(x)
x = layers.Dropout(0.4)(x)  # prevent overfitting
outputs = layers.Dense(1, activation="sigmoid")(x)

model = tf.keras.Model(inputs, outputs)

model.compile(
    optimizer="adam",
    loss="binary_crossentropy",
    metrics=["accuracy"]
)

model.summary()

# Train
history = model.fit(
    train,
    validation_data=val,
    epochs=15,
    callbacks=[
        # Stop early if validation loss stops improving
        tf.keras.callbacks.EarlyStopping(
            patience=3,
            restore_best_weights=True
        )
    ]
)

# Save model
model.save(MODEL_SAVE_PATH)
print(f"Model saved to {MODEL_SAVE_PATH}")

# Plot accuracy and loss curves
fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(12, 4))

ax1.plot(history.history["accuracy"], label="Train Accuracy")
ax1.plot(history.history["val_accuracy"], label="Val Accuracy")
ax1.set_title("Training Accuracy")
ax1.legend()

ax2.plot(history.history["loss"], label="Train Loss")
ax2.plot(history.history["val_loss"], label="Val Loss")
ax2.set_title("Training Loss")
ax2.legend()

plt.tight_layout()
plt.savefig("training_curves.png")
print("Training curves saved to training_curves.png")