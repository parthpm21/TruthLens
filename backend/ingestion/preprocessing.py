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