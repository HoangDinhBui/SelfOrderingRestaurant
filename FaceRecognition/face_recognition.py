from flask import Flask, request, jsonify
from deepface import DeepFace
import cv2
import os
import logging
from pathlib import Path

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

BASE_IMAGE_DIR = r"D:\UTC2\SelfOrderingRestaurant\src\main\resources\static\staff_faces"
if not os.path.exists(BASE_IMAGE_DIR):
    logger.error(f"Image directory not found: {BASE_IMAGE_DIR}")
    raise RuntimeError(f"Image directory not found: {BASE_IMAGE_DIR}")

@app.route('/verify', methods=['POST'])
def verify_face():
    try:
        if 'image' not in request.files or 'reference_path' not in request.form:
            logger.error("Missing image or reference_path in request")
            return jsonify({"error": "Image and reference_path are required"}), 400

        image_file = request.files['image']
        reference_filename = request.form['reference_path']

        reference_filename = os.path.basename(reference_filename)
        reference_path = os.path.join(BASE_IMAGE_DIR, reference_filename)
        logger.debug(f"Processing image: {image_file.filename}, reference_path: {reference_path}")

        if not os.path.exists(reference_path):
            logger.error(f"Reference path does not exist: {reference_path}. Available files: {os.listdir(BASE_IMAGE_DIR)}")
            return jsonify({"error": f"Reference image not found: {reference_filename}"}), 400

        img = cv2.imread(reference_path)
        if img is None:
            logger.error(f"Invalid reference image: {reference_path}")
            return jsonify({"error": f"Invalid reference image: {reference_filename}"}), 400

        temp_image_path = os.path.join(os.path.dirname(__file__), 'temp.jpg')
        image_file.save(temp_image_path)
        logger.debug(f"Saved temporary image: {temp_image_path}")

        temp_img = cv2.imread(temp_image_path)
        if temp_img is None:
            logger.error(f"Invalid temporary image: {temp_image_path}")
            if os.path.exists(temp_image_path):
                os.remove(temp_image_path)
            return jsonify({"error": "Invalid uploaded image"}), 400

        try:
            result = DeepFace.verify(
                img1_path=temp_image_path,
                img2_path=reference_path,
                model_name="Facenet",
                detector_backend="opencv"
            )
            logger.debug(f"Verification result: {result}")
            response = {
                "verified": result["verified"],
                "distance": result["distance"]
            }
        except ValueError as ve:
            logger.error(f"DeepFace verification failed: {str(ve)}")
            response = {"error": f"Face verification failed: {str(ve)}"}
            return jsonify(response), 400
        finally:
            if os.path.exists(temp_image_path):
                os.remove(temp_image_path)
                logger.debug(f"Removed temporary image: {temp_image_path}")

        return jsonify(response), 200

    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        temp_image_path = os.path.join(os.path.dirname(__file__), 'temp.jpg')
        if os.path.exists(temp_image_path):
            os.remove(temp_image_path)
        return jsonify({"error": f"Server error: {str(e)}"}), 500

if __name__ == '__main__':
    logger.info("Starting Flask application on port 5000...")
    app.run(host='0.0.0.0', port=5000, debug=True)