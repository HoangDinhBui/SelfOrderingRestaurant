FROM python:3.10-slim

WORKDIR /app

# Install system dependencies required by OpenCV and DeepFace
RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Pre-download the weights the service actually uses (ArcFace + Fasnet anti-spoofing).
# Without this the first scan downloads them and the backend's 10s timeout reports 503.
RUN python -c "from deepface.modules import modeling; \
modeling.build_model(task='facial_recognition', model_name='ArcFace'); \
modeling.build_model(task='spoofing', model_name='Fasnet')"

COPY face_recognition.py .

EXPOSE 5000

CMD ["python", "face_recognition.py"]
