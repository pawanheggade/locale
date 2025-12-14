
import { Post } from '../types';
import { formatCurrency } from './formatters';
import { getBadgeSvg, TIER_STYLES, drawLogoOnCanvas } from '../lib/utils';

export const fileToDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const compressImage = (file: File, options: { maxWidth: number; quality: number }): Promise<File> => {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      return resolve(file);
    }
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = event => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return reject(new Error('Failed to get canvas context.'));
        }
        let { width, height } = img;
        if (width > options.maxWidth) {
          height = (height * options.maxWidth) / width;
          width = options.maxWidth;
        }
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              return reject(new Error('Canvas toBlob failed.'));
            }
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve(compressedFile.size > file.size ? file : compressedFile);
          },
          'image/jpeg',
          options.quality
        );
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
};

const wrapText = (
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
) => {
    const words = text.split(' ');
    let line = '';
    const lines = [];
    for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' ';
        const metrics = context.measureText(testLine);
        if (metrics.width > maxWidth && n > 0) {
            lines.push(line);
            line = words[n] + ' ';
        } else {
            line = testLine;
        }
    }
    lines.push(line);

    const finalLines = lines.slice(0, 2);
    if (lines.length > 2) {
        finalLines[1] = finalLines[1].trim().slice(0, -3) + '...';
    }
    
    for (let k = 0; k < finalLines.length; k++) {
        const currentLine = finalLines[finalLines.length - 1 - k];
        context.fillText(currentLine.trim(), x, y - (k * lineHeight));
    }
};


export const generatePostPreviewImage = async (post: Post): Promise<Blob | null> => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const scale = 2;
    const cardWidth = 400;
    const cardHeight = 210; // ~16:9

    canvas.width = cardWidth * scale;
    canvas.height = cardHeight * scale;
    ctx.scale(scale, scale);

    // White Background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, cardWidth, cardHeight);

    // Load and draw post image
    const postImg = new Image();
    postImg.crossOrigin = 'anonymous';
    let imageLoaded = false;
    if (post.media.length > 0 && post.media[0].type === 'image') {
        postImg.src = post.media[0].url;
        try {
            await new Promise((resolve, reject) => {
                postImg.onload = resolve;
                postImg.onerror = reject;
            });
            imageLoaded = true;
        } catch (e) {
            console.error("Failed to load post image for preview");
        }
    }
    
    if (imageLoaded) {
        const hRatio = cardWidth / postImg.width;
        const vRatio = cardHeight / postImg.height;
        const ratio = Math.max(hRatio, vRatio);
        const centerShift_x = (cardWidth - postImg.width * ratio) / 2;
        const centerShift_y = (cardHeight - postImg.height * ratio) / 2;
        ctx.drawImage(postImg, 0, 0, postImg.width, postImg.height,
                      centerShift_x, centerShift_y, postImg.width * ratio, postImg.height * ratio);
    } else {
        ctx.fillStyle = '#d1d5db'; // gray-300
        ctx.fillRect(0, 0, cardWidth, cardHeight);
    }

    // Gradient overlay for text
    const gradient = ctx.createLinearGradient(0, cardHeight, 0, cardHeight - 80);
    gradient.addColorStop(0, 'rgba(0,0,0,0.7)');
    gradient.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, cardWidth, cardHeight);
    
    // Text Content
    const padding = 16;
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 22px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'bottom';
    
    wrapText(ctx, post.title, padding, cardHeight - padding, cardWidth - padding * 2, 26);

    return new Promise(resolve => canvas.toBlob(blob => resolve(blob), 'image/jpeg', 0.9));
};