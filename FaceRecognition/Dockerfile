FROM python:3.10-slim

WORKDIR /app

# Install system dependencies required by OpenCV and DeepFace
RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Pre-download DeepFace weights (Facenet) to speed up first request and avoid timeouts
RUN python -c "from deepface import DeepFace; DeepFace.build_model('Facenet')"

COPY face_recognition.py .

EXPOSE 5000

CMD ["python", "face_recognition.py"]
