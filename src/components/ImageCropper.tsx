import React, { useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import Cropper from 'react-easy-crop';
import { X, Check } from 'lucide-react';
import './ImageCropper.css';

interface Point {
  x: number;
  y: number;
}

interface Area {
  width: number;
  height: number;
  x: number;
  y: number;
}

interface ImageCropperProps {
  imageSrc: string;
  onCropDone: (croppedFile: File) => void;
  onCancel: () => void;
  aspectRatio?: number; // 1 (1:1) or 4/5 (0.8)
}

const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.src = url;
  });

async function getCroppedImg(
  imageSrc: string,
  pixelCrop: Area
): Promise<File | null> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return null;
  }

  // Set canvas size to match the bounding box
  canvas.width = image.width;
  canvas.height = image.height;

  // Draw the image
  ctx.drawImage(image, 0, 0);

  // Extract the cropped image data
  const data = ctx.getImageData(
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height
  );

  // Resize canvas to the cropped size
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  // Put the cropped image data back on the canvas
  ctx.putImageData(data, 0, 0);

  // Return as a file
  return new Promise((resolve) => {
    canvas.toBlob((file) => {
      if (file) {
        const croppedFile = new File([file], `cropped-${Date.now()}.jpg`, { type: 'image/jpeg' });
        resolve(croppedFile);
      } else {
        resolve(null);
      }
    }, 'image/jpeg', 0.9);
  });
}

const ImageCropper: React.FC<ImageCropperProps> = ({ imageSrc, onCropDone, onCancel, aspectRatio = 1 }) => {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const onCropComplete = useCallback((_: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleDone = async () => {
    if (!croppedAreaPixels) return;
    setIsProcessing(true);
    try {
      const croppedFile = await getCroppedImg(imageSrc, croppedAreaPixels);
      if (croppedFile) {
        onCropDone(croppedFile);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  return createPortal(
    <div className="cropper-overlay" style={{ zIndex: 999999 }}>
      <div className="cropper-container">
        
        <div className="cropper-body">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={aspectRatio}
            onCropChange={setCrop}
            onCropComplete={onCropComplete}
            onZoomChange={setZoom}
          />
        </div>

        <div className="cropper-controls">
          <label>זום (Zoom)</label>
          <input
            type="range"
            value={zoom}
            min={1}
            max={3}
            step={0.1}
            aria-labelledby="Zoom"
            onChange={(e) => setZoom(Number(e.target.value))}
            className="zoom-slider"
          />
          
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem' }}>
            <button 
              onClick={onCancel} 
              disabled={isProcessing}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'transparent', color: '#ff4757', border: '1px solid #ff4757', padding: '0.6rem 1.2rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem' }}
            >
              <X size={18} />
              ביטול חיתוך
            </button>
            
            <button 
              onClick={handleDone} 
              disabled={isProcessing}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#2ecc71', color: 'white', border: 'none', padding: '0.6rem 1.5rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem' }}
            >
              {isProcessing ? <span className="spinner-small" /> : <><Check size={18} /> שמור חיתוך</>}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ImageCropper;
