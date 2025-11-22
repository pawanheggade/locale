import { Post } from '../types';
import { formatCurrency } from './formatters';

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

// Function to wrap text on a canvas
const wrapText = (
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
) => {
  const words = text.split(' ');
  let line = '';
  const lines = [];

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = context.measureText(testLine);
    const testWidth = metrics.width;
    if (testWidth > maxWidth && n > 0) {
      lines.push(line);
      line = words[n] + ' ';
    } else {
      line = testLine;
    }
  }
  lines.push(line);
  
  // Adjust starting y position to center the block of text
  const totalTextHeight = lines.length * lineHeight;
  let currentY = y - (totalTextHeight / 2) + (lineHeight / 2);

  for (let k = 0; k < lines.length; k++) {
    context.fillText(lines[k].trim(), x, currentY);
    currentY += lineHeight;
  }
};

export const generatePostPreviewImage = (post: Post): Promise<Blob | null> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return resolve(null);
    }

    const width = 1200;
    const height = 630;
    canvas.width = width;
    canvas.height = height;
    
    const drawTextContent = () => {
      // App Branding
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.font = 'bold 36px sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText('locale', 40, 40);

      // Prepare context text (description or tags)
      let contextText = '';
      if (post.description && post.description.trim().length > 10) {
        contextText = post.description.trim();
        if (contextText.length > 120) {
          contextText = contextText.substring(0, 117) + '...';
        }
      } else if (post.tags && post.tags.length > 0) {
        contextText = `Tags: ${post.tags.slice(0, 4).join(', ')}`;
      }
      
      const hasContextText = contextText.length > 0;
      const titleY = hasContextText ? height / 2 - 45 : height / 2;
      const contextY = height / 2 + 65;

      // Title
      ctx.fillStyle = 'white';
      ctx.font = 'bold 84px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 10;
      wrapText(ctx, post.title, width / 2, titleY, width - 120, 100);
      ctx.shadowColor = 'transparent'; // Reset shadow

      // Description or Tags
      if (hasContextText) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.font = '42px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 8;
        wrapText(ctx, contextText, width / 2, contextY, width - 160, 50);
        ctx.shadowColor = 'transparent';
      }

      // Price
      ctx.fillStyle = 'white';
      ctx.font = 'bold 100px sans-serif';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'bottom';
      ctx.shadowColor = 'rgba(0,0,0,0.7)';
      ctx.shadowBlur = 15;
      ctx.fillText(formatCurrency(post.price), width - 40, height - 40);
      ctx.shadowColor = 'transparent'; // Reset shadow

      canvas.toBlob((blob) => {
        resolve(blob);
      }, 'image/png');
    };
    
    const drawFallbackAndText = () => {
        ctx.fillStyle = '#4B5563'; // gray-600
        ctx.fillRect(0, 0, width, height);
        drawTextContent();
    };

    const bgImage = new Image();
    bgImage.crossOrigin = 'anonymous'; // Important for images from other domains

    bgImage.onload = () => {
      // Draw background image, centered and clipped
      const imgAspectRatio = bgImage.width / bgImage.height;
      const canvasAspectRatio = width / height;
      let drawWidth, drawHeight, offsetX, offsetY;

      if (imgAspectRatio > canvasAspectRatio) {
        // Image is wider than canvas
        drawHeight = height;
        drawWidth = drawHeight * imgAspectRatio;
        offsetX = (width - drawWidth) / 2;
        offsetY = 0;
      } else {
        // Image is taller than or same aspect as canvas
        drawWidth = width;
        drawHeight = drawWidth / imgAspectRatio;
        offsetX = 0;
        offsetY = (height - drawHeight) / 2;
      }
      ctx.drawImage(bgImage, offsetX, offsetY, drawWidth, drawHeight);

      // Semi-transparent overlay for text readability
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(0, 0, width, height);
      
      drawTextContent();
    };

    bgImage.onerror = () => {
      // Fallback: Gray background if image fails to load
      drawFallbackAndText();
    };
    
    if (post.media && post.media.length > 0 && post.media[0].type === 'image') {
      bgImage.src = post.media[0].url;
    } else {
      drawFallbackAndText();
    }
  });
};
