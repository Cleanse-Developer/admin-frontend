function getRadianAngle(deg) {
  return (deg * Math.PI) / 180;
}

// bounding box of a rotated rect
function rotateSize(width, height, rotation) {
  const rad = getRadianAngle(rotation);
  return {
    width: Math.abs(Math.cos(rad) * width) + Math.abs(Math.sin(rad) * height),
    height: Math.abs(Math.sin(rad) * width) + Math.abs(Math.cos(rad) * height),
  };
}

// imageSrc may be an object URL or a dataURL; rotation in degrees.
// croppedAreaPixels from react-easy-crop are already in the rotated frame.
export function getCroppedBlob(
  imageSrc,
  pixelCrop,
  rotation = 0,
  mimeType = "image/jpeg",
  quality = 0.92
) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const { width: bW, height: bH } = rotateSize(
        img.width,
        img.height,
        rotation
      );
      // draw full rotated image onto an oversized canvas
      canvas.width = bW;
      canvas.height = bH;
      ctx.translate(bW / 2, bH / 2);
      ctx.rotate(getRadianAngle(rotation));
      ctx.translate(-img.width / 2, -img.height / 2);
      ctx.drawImage(img, 0, 0);
      // pull out the crop rect
      const data = ctx.getImageData(
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height
      );
      canvas.width = pixelCrop.width;
      canvas.height = pixelCrop.height;
      ctx.putImageData(data, 0, 0);
      canvas.toBlob(
        (blob) =>
          blob ? resolve(blob) : reject(new Error("Canvas toBlob failed")),
        mimeType,
        quality
      );
    };
    img.onerror = () => reject(new Error("Image load failed"));
    img.src = imageSrc;
  });
}
