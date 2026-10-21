"""Vietnamese speech-to-text for voice ordering (PhoWhisper), packaged as a Hugging Face Docker Space.

POST /transcribe  multipart field "audio" (webm/ogg/mp4/wav...)  ->  {"text": "..."}
GET  /            health check
"""
import logging
import os
import tempfile
import threading

from flask import Flask, jsonify, request

MODEL_ID = os.environ.get("ASR_MODEL", "vinai/PhoWhisper-small")
MAX_AUDIO_BYTES = 2 * 1024 * 1024  # ~15s of compressed speech is well under 1MB

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger("voice")

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = MAX_AUDIO_BYTES + 64 * 1024

_transcriber = None
_lock = threading.Lock()


def get_transcriber():
    """Load the model once; transformers/torch are imported here so tests can run without them."""
    global _transcriber
    with _lock:
        if _transcriber is None:
            from transformers import pipeline

            logger.info("Loading %s", MODEL_ID)
            _transcriber = pipeline("automatic-speech-recognition", model=MODEL_ID, device="cpu")
        return _transcriber


def transcribe_file(path):
    result = get_transcriber()(
        path,
        chunk_length_s=30,
        generate_kwargs={"language": "vietnamese", "task": "transcribe"},
    )
    return (result.get("text") or "").strip()


@app.get("/")
def health():
    return jsonify({"status": "ok", "model": MODEL_ID})


@app.post("/transcribe")
def transcribe():
    audio = request.files.get("audio")
    if audio is None:
        return jsonify({"error": "audio is required"}), 400

    data = audio.read()
    if not data:
        return jsonify({"error": "audio is empty"}), 400
    if len(data) > MAX_AUDIO_BYTES:
        return jsonify({"error": "audio is too large"}), 413

    suffix = os.path.splitext(audio.filename or "")[1] or ".webm"
    fd, path = tempfile.mkstemp(suffix=suffix)
    try:
        with os.fdopen(fd, "wb") as f:
            f.write(data)
        try:
            text = transcribe_file(path)
        except ValueError as e:
            # ffmpeg could not decode the clip (corrupt or unsupported container)
            logger.warning("Cannot decode audio: %s", e)
            return jsonify({"error": "Cannot decode audio"}), 400
        return jsonify({"text": text})
    except Exception:
        logger.exception("Transcription failed")
        return jsonify({"error": "Transcription failed"}), 500
    finally:
        os.remove(path)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 7860)))
