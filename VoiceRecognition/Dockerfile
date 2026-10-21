FROM python:3.10-slim

# ffmpeg decodes the browser's webm/ogg/mp4 recordings
RUN apt-get update && apt-get install -y --no-install-recommends ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Hugging Face Spaces run the container as uid 1000
RUN useradd -m -u 1000 user
USER user
ENV HOME=/home/user PATH=/home/user/.local/bin:$PATH HF_HOME=/home/user/.cache/huggingface
WORKDIR /home/user/app

COPY --chown=user requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt

# Bake the weights into the image so the first request does not wait for a ~1GB download
ARG ASR_MODEL=vinai/PhoWhisper-small
ENV ASR_MODEL=$ASR_MODEL
RUN python -c "import os; from transformers import pipeline; pipeline('automatic-speech-recognition', model=os.environ['ASR_MODEL'])"

COPY --chown=user app.py .

EXPOSE 7860
CMD ["gunicorn", "--bind", "0.0.0.0:7860", "--workers", "1", "--threads", "2", "--timeout", "120", "app:app"]
