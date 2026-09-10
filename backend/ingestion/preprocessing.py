"""
TruthLens — Image & Video Preprocessing
Author: Parth Maheshwari
"""
from __future__ import annotations
from pathlib import Path
from typing import Tuple
import numpy as np
from PIL import Image

IMAGENET_MEAN = np.array([0.485, 0.456, 0.406])
IMAGENET_STD = np.array([0.229, 0.224, 0.225])


def resize_image(image: Image.Image, target_size: Tuple[int, int] = (224, 224)) -> Image.Image:
    image = image.convert("RGB")
    ow, oh = image.size
    tw, th = target_size
    scale = min(tw / ow, th / oh)
    nw, nh = int(ow * scale), int(oh * scale)
    resized = image.resize((nw, nh), Image.BILINEAR)
    canvas = Image.new("RGB", target_size, (0, 0, 0))
    canvas.paste(resized, ((tw - nw) // 2, (th - nh) // 2))
    return canvas


def normalize_image(image: Image.Image) -> np.ndarray:
    arr = np.asarray(image).astype(np.float32) / 255.0
    arr = (arr - IMAGENET_MEAN) / IMAGENET_STD
    return arr.transpose(2, 0, 1).astype(np.float32)


def preprocess_image_file(path: str | Path, target_size: Tuple[int, int] = (224, 224)) -> np.ndarray:
    image = Image.open(path)
    return normalize_image(resize_image(image, target_size))


import cv2

def extract_frames(video_path: str | Path, num_frames: int = 16) -> list[np.ndarray]:
    cap = cv2.VideoCapture(str(video_path))
    total = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    if total <= 0:
        cap.release()
        return []
    indices = np.linspace(0, total - 1, num=min(num_frames, total), dtype=int)
    frames = []
    for idx in indices:
        cap.set(cv2.CAP_PROP_POS_FRAMES, int(idx))
        ok, frame = cap.read()
        if ok:
            frames.append(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
    cap.release()
    return frames


def preprocess_video_file(path: str | Path, num_frames: int = 16,
                           target_size: Tuple[int, int] = (224, 224)) -> np.ndarray:
    tensors = [normalize_image(resize_image(Image.fromarray(f), target_size))
               for f in extract_frames(path, num_frames)]
    if not tensors:
        return np.zeros((0, 3, *target_size), dtype=np.float32)
    return np.stack(tensors, axis=0)