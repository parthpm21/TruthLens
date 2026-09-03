import cv2
import os
from PIL import Image

def resize_image(image_path: str, output_path: str, size: tuple = (224, 224)):
    """Resizes an image to the target size"""
    with Image.open(image_path) as img:
        img_resized = img.resize(size)
        img_resized.save(output_path)
        return output_path

def extract_frames(video_path: str, output_dir: str, frame_rate: int = 1):
    """Extracts frames from a video at the given frame rate"""
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
        
    vidcap = cv2.VideoCapture(video_path)
    success, image = vidcap.read()
    count = 0
    saved_count = 0
    
    fps = int(vidcap.get(cv2.CAP_PROP_FPS))
    if fps == 0:
        fps = 30 # Default if unable to read
        
    frame_interval = max(1, fps // frame_rate)
    
    while success:
        if count % frame_interval == 0:
            frame_path = os.path.join(output_dir, f"frame_{saved_count}.jpg")
            cv2.imwrite(frame_path, image)
            saved_count += 1
        success, image = vidcap.read()
        count += 1
        
    return saved_count
