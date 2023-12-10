import cv2
from flask import Flask, Response

app = Flask(__name__)

camera = cv2.VideoCapture(0)  # 0 refers to the default webcam

def generate_frames():
    while True:
        success, frame = camera.read()  # Read frame from the webcam
        if not success:
            break
        else:
            ret, buffer = cv2.imencode('.jpg', frame)  # Convert frame to JPEG
            frame_bytes = buffer.tobytes()
            yield (b'--frame\r\n' b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')

@app.route('/video_feed')
def video_feed():
    return Response(generate_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
