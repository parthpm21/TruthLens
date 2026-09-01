"""
TruthLens - Image Ingestion & Forensic Preprocessing Pipeline
Author: Pratham Yadav (Deep Learning & Computer Vision Lead)
Sprint 1: Benchmark Assembly & Ingestion API (User Story 1 - Part 2)

This module handles:
1. Robust multi-format image loading (RGB, RGBA with alpha blending, Grayscale).
2. Aspect-ratio preserving letterboxing and center-crop resizing.
3. Normalization pipelines (ImageNet mean/std for ViT/CLIP, [-1, 1] for Diffusion/DIRE).
4. EXIF forensic metadata extraction and editing software flag detection.
5. High-frequency noise residual map extraction (Noiseprint / Laplacian feature).
"""

from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum
from pathlib import Path
from typing import Any, Dict, Optional, Tuple, Union

import cv2
import numpy as np
from PIL import ExifTags, Image, ImageOps


class NormalizationMode(str, Enum):
    IMAGENET = "imagenet"          # Mean=[0.485, 0.456, 0.406], Std=[0.229, 0.224, 0.225]
    ZERO_TO_ONE = "zero_to_one"    # Scaled to [0.0, 1.0]
    MINUS_ONE_TO_ONE = "minus_one_to_one"  # Scaled to [-1.0, 1.0] (for DDIM/DIRE)


class ResizeMode(str, Enum):
    LETTERBOX = "letterbox"        # Aspect-ratio preserved with symmetric zero/gray padding
    CENTER_CROP = "center_crop"    # Aspect-preserving scale & center crop
    DIRECT = "direct"              # Direct non-proportional resize


@dataclass
class ProcessedImage:
    """Represents the preprocessed output tensor and associated forensic metadata."""
    tensor: np.ndarray  # Shape: (3, H, W) in float32
    original_size: Tuple[int, int]  # (width, height)
    target_size: Tuple[int, int]    # (target_w, target_h)
    exif_present: bool = False
    exif_data: Dict[str, Any] = field(default_factory=dict)
    noise_residual: Optional[np.ndarray] = None  # Shape: (H, W) or (1, H, W)
    scale_factor: float = 1.0
    pad_offsets: Tuple[int, int, int, int] = (0, 0, 0, 0)  # (top, bottom, left, right)

    def to_batch(self) -> np.ndarray:
        """Return tensor with leading batch dimension (1, 3, H, W)."""
        return np.expand_dims(self.tensor, axis=0)


class ImagePreprocessor:
    """
    Forensic-grade preprocessing engine for image verification.
    """

    # ImageNet normalization parameters (standard for CLIP-ViT and ResNet backbones)
    IMAGENET_MEAN = np.array([0.485, 0.456, 0.406], dtype=np.float32).reshape(3, 1, 1)
    IMAGENET_STD = np.array([0.229, 0.224, 0.225], dtype=np.float32).reshape(3, 1, 1)

    def __init__(
        self,
        target_size: Tuple[int, int] = (224, 224),
        normalization: NormalizationMode = NormalizationMode.IMAGENET,
        resize_mode: ResizeMode = ResizeMode.LETTERBOX,
        extract_noise_residuals: bool = True,
    ) -> None:
        self.target_size = target_size
        self.normalization = normalization
        self.resize_mode = resize_mode
        self.extract_noise_residuals = extract_noise_residuals

    def load_image(self, input_source: Union[str, Path, bytes, Image.Image, np.ndarray]) -> Image.Image:
        """
        Load an image from file path, raw bytes, PIL Image, or NumPy array,
        converting consistently to a 3-channel RGB PIL Image.
        """
        if isinstance(input_source, (str, Path)):
            pil_img = Image.open(str(input_source))
        elif isinstance(input_source, bytes):
            import io
            pil_img = Image.open(io.BytesIO(input_source))
        elif isinstance(input_source, Image.Image):
            pil_img = input_source
        elif isinstance(input_source, np.ndarray):
            if input_source.ndim == 2:
                pil_img = Image.fromarray(input_source, mode="L")
            elif input_source.ndim == 3 and input_source.shape[2] == 3:
                pil_img = Image.fromarray(input_source, mode="RGB")
            elif input_source.ndim == 3 and input_source.shape[2] == 4:
                pil_img = Image.fromarray(input_source, mode="RGBA")
            else:
                raise ValueError(f"Unsupported numpy image shape: {input_source.shape}")
        else:
            raise TypeError(f"Unsupported image input type: {type(input_source)}")

        # Handle EXIF auto-rotation if orientation tag exists
        try:
            pil_img = ImageOps.exif_transpose(pil_img) or pil_img
        except Exception:
            pass

        # Convert color spaces cleanly
        if pil_img.mode == "RGBA":
            # Blend on solid black/white background
            background = Image.new("RGB", pil_img.size, (255, 255, 255))
            background.paste(pil_img, mask=pil_img.split()[3])
            return background
        elif pil_img.mode != "RGB":
            return pil_img.convert("RGB")

        return pil_img

    def extract_exif(self, pil_img: Image.Image) -> Tuple[bool, Dict[str, Any]]:
        """Extract camera and software forensic metadata from EXIF headers."""
        raw_exif = pil_img.getexif()
        if not raw_exif:
            return False, {"notes": ["No EXIF metadata found (common in synthetic or stripped media)"]}

        parsed_data: Dict[str, Any] = {}
        editing_software_detected = False

        for tag_id, value in raw_exif.items():
            tag_name = ExifTags.TAGS.get(tag_id, str(tag_id))
            # Convert binary or non-serializable values
            if isinstance(value, bytes):
                try:
                    value = value.decode(errors="replace")
                except Exception:
                    value = str(value)
            
            parsed_data[tag_name] = value

            # Look for common image editors / generators in software tags
            if tag_name.lower() in ("software", "processingsoftware", "imagedescription"):
                val_str = str(value).lower()
                if any(tool in val_str for tool in ["photoshop", "gimp", "midjourney", "stable diffusion", "flux", "canva"]):
                    editing_software_detected = True

        parsed_data["has_editing_signature"] = editing_software_detected
        return True, parsed_data

    def _resize_image(
        self, pil_img: Image.Image
    ) -> Tuple[Image.Image, float, Tuple[int, int, int, int]]:
        """Resize image based on chosen ResizeMode with padding coordinates."""
        target_w, target_h = self.target_size
        orig_w, orig_h = pil_img.size

        if self.resize_mode == ResizeMode.DIRECT:
            resized = pil_img.resize((target_w, target_h), Image.Resampling.BICUBIC)
            return resized, 1.0, (0, 0, 0, 0)

        elif self.resize_mode == ResizeMode.CENTER_CROP:
            scale = max(target_w / orig_w, target_h / orig_h)
            new_w, new_h = int(orig_w * scale), int(orig_h * scale)
            resized = pil_img.resize((new_w, new_h), Image.Resampling.BICUBIC)
            
            left = (new_w - target_w) // 2
            top = (new_h - target_h) // 2
            cropped = resized.crop((left, top, left + target_w, top + target_h))
            return cropped, scale, (0, 0, 0, 0)

        else:  # LETTERBOX (default for forensic consistency)
            scale = min(target_w / orig_w, target_h / orig_h)
            new_w, new_h = int(orig_w * scale), int(orig_h * scale)
            resized = pil_img.resize((new_w, new_h), Image.Resampling.BICUBIC)

            canvas = Image.new("RGB", (target_w, target_h), (0, 0, 0))
            pad_left = (target_w - new_w) // 2
            pad_top = (target_h - new_h) // 2
            canvas.paste(resized, (pad_left, pad_top))
            
            pad_right = target_w - (pad_left + new_w)
            pad_bottom = target_h - (pad_top + new_h)

            return canvas, scale, (pad_top, pad_bottom, pad_left, pad_right)

    def extract_noise_residual(self, img_np: np.ndarray) -> np.ndarray:
        """
        Extract high-pass noise residuals using a Laplacian kernel.
        Helps reveal sensor PRNU inconsistencies and generative upsampling artifacts.
        """
        gray = cv2.cvtColor(img_np, cv2.COLOR_RGB2GRAY)
        laplacian = cv2.Laplacian(gray, cv2.CV_32F, ksize=3)
        # Normalize residual to [0, 1]
        norm_res = cv2.normalize(laplacian, None, 0.0, 1.0, cv2.NORM_MINMAX)
        return norm_res

    def process(self, input_source: Union[str, Path, bytes, Image.Image, np.ndarray]) -> ProcessedImage:
        """
        Execute end-to-end preprocessing:
        1. Load & clean image
        2. Extract EXIF metadata
        3. Resize / letterbox
        4. Normalize tensor to (3, H, W)
        5. Extract forensic high-frequency noise residual
        """
        pil_img = self.load_image(input_source)
        original_size = pil_img.size

        # Extract EXIF before resizing
        has_exif, exif_meta = self.extract_exif(pil_img)

        # Apply aspect-ratio preserving resize
        resized_img, scale, padding = self._resize_image(pil_img)

        # Convert to numpy float32 in [0, 1]
        img_np = np.array(resized_img, dtype=np.float32) / 255.0  # Shape: (H, W, 3)

        # Extract high-frequency noise residuals
        noise_residual = None
        if self.extract_noise_residuals:
            noise_residual = self.extract_noise_residual(np.array(resized_img, dtype=np.uint8))

        # Transpose from (H, W, C) to (C, H, W)
        tensor = np.transpose(img_np, (2, 0, 1))

        # Apply Normalization
        if self.normalization == NormalizationMode.IMAGENET:
            tensor = (tensor - self.IMAGENET_MEAN) / self.IMAGENET_STD
        elif self.normalization == NormalizationMode.MINUS_ONE_TO_ONE:
            tensor = (tensor * 2.0) - 1.0
        # ZERO_TO_ONE is already in [0.0, 1.0]

        return ProcessedImage(
            tensor=tensor.astype(np.float32),
            original_size=original_size,
            target_size=self.target_size,
            exif_present=has_exif,
            exif_data=exif_meta,
            noise_residual=noise_residual,
            scale_factor=scale,
            pad_offsets=padding,
        )
