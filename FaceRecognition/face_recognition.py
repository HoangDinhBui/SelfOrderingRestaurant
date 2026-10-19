from flask import Flask, request, jsonify
from deepface import DeepFace
import cv2
import os
import logging
from pathlib import Path
import tempfile

app = Flask(__name__)

logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('app.log'),
        logging.StreamHandler()
    ]
)
logger = app.logger

@app.route('/verify', methods=['POST'])
def verify_face():
    try:
        if 'image' not in request.files or 'reference_image' not in request.files:
            logger.error("Missing image or reference_image in request")
            return jsonify({"error": "image and reference_image are required"}), 400

        image_file = request.files['image']
        reference_file = request.files['reference_image']

        logger.debug(f"Processing image: {image_file.filename}, reference_image: {reference_file.filename}")

        # Create temporary files
        fd_temp, temp_image_path = tempfile.mkstemp(suffix='.jpg')
        fd_ref, temp_reference_path = tempfile.mkstemp(suffix='.jpg')
        os.close(fd_temp)
        os.close(fd_ref)

        try:
            image_file.save(temp_image_path)
            reference_file.save(temp_reference_path)
            logger.debug(f"Saved temporary files: {temp_image_path}, {temp_reference_path}")

            temp_img = cv2.imread(temp_image_path)
            if temp_img is None:
                logger.error(f"Invalid uploaded image: {temp_image_path}")
                return jsonify({"error": "Invalid uploaded image"}), 400

            ref_img = cv2.imread(temp_reference_path)
            if ref_img is None:
                logger.error(f"Invalid reference image: {temp_reference_path}")
                return jsonify({"error": "Invalid reference image"}), 400

            # Spoof-check only the live capture; the stored reference photo is not liveness-checked.
            faces = DeepFace.extract_faces(
                img_path=temp_image_path,
                detector_backend="opencv",
                enforce_detection=True,
                anti_spoofing=True
            )
            if any(face.get("is_real") is False for face in faces):
                logger.warning("Spoof detected in captured image")
                return jsonify({"verified": False, "spoof": True}), 200

            result = DeepFace.verify(
                img1_path=temp_image_path,
                img2_path=temp_reference_path,
                model_name="ArcFace",
                detector_backend="opencv",
                distance_metric="euclidean_l2",
                enforce_detection=True
            )
            logger.debug(f"Verification result: {result}")
            response = {
                "verified": result["verified"],
                "distance": result["distance"]
            }

            return jsonify(response), 200

        # DeepFace 0.0.93 messages matched below: "Spoof detected in the given image." / "Face could not be detected in ..."
        except ValueError as ve:
            message = str(ve)
            if "spoof" in message.lower():
                logger.warning(f"Spoof detected: {message}")
                return jsonify({"verified": False, "spoof": True}), 200
            if "could not be detected" in message.lower():
                logger.info(f"No face detected: {message}")
                return jsonify({"verified": False, "no_face": True}), 200
            logger.error(f"DeepFace verification failed: {message}")
            return jsonify({"error": f"Face verification failed: {message}"}), 400

        finally:
            # Clean up temporary files
            if os.path.exists(temp_image_path):
                os.remove(temp_image_path)
                logger.debug(f"Removed temporary image: {temp_image_path}")
            if os.path.exists(temp_reference_path):
                os.remove(temp_reference_path)
                logger.debug(f"Removed temporary reference image: {temp_reference_path}")

    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        return jsonify({"error": f"Server error: {str(e)}"}), 500

if __name__ == '__main__':
    # Never enable the Werkzeug debugger on a public interface: it allows remote code execution.
    debug = os.environ.get("FLASK_DEBUG", "0") == "1"
    host = "127.0.0.1" if debug else os.environ.get("FACE_HOST", "0.0.0.0")
    port = int(os.environ.get("PORT", "5000"))
    logger.info(f"Starting Flask application on {host}:{port} (debug={debug})...")
    app.run(host=host, port=port, debug=debug)