import { DisplayablePost } from '../types';
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
  maxLines: number = 2
) => {
  const words = text.split(' ');
  let line = '';
  const lines: string[] = [];

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
  
  const finalLines = lines.slice(0, maxLines);
  if (lines.length > maxLines) {
    const lastLine = finalLines[maxLines - 1];
    finalLines[maxLines - 1] = lastLine.slice(0, lastLine.length - 4) + '...';
  }

  for (let k = 0; k < finalLines.length; k++) {
    context.fillText(finalLines[k].trim(), x, y + (k * lineHeight));
  }
};


export const generatePostQrCardBlob = async (post: DisplayablePost): Promise<Blob | null> => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const scale = 2; // for higher resolution
    const cardWidth = 350;
    const cardHeight = 400;

    canvas.width = cardWidth * scale;
    canvas.height = cardHeight * scale;
    ctx.scale(scale, scale);
    
    // 1. White Background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, cardWidth, cardHeight);

    // 2. Load and draw post image
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
            console.error("Failed to load post image for QR card");
        }
    }
    
    if(imageLoaded) {
        ctx.drawImage(postImg, 0, 0, cardWidth, 200);
        ctx.fillStyle = 'rgba(0,0,0,0.2)'; // slight darken for text contrast
        ctx.fillRect(0, 0, cardWidth, 200);
    } else {
        ctx.fillStyle = '#E5E7EB';
        ctx.fillRect(0, 0, cardWidth, 200);
    }
    
    // 3. QR Code
    const postUrl = `${window.location.origin}/?post=${post.id}`;
    const qrCodeApiUrl = `https://quickchart.io/qr?text=${encodeURIComponent(postUrl)}&size=200&margin=1&ecLevel=H`;
    const qrImg = new Image();
    qrImg.crossOrigin = 'anonymous';
    qrImg.src = qrCodeApiUrl;
    try {
        await new Promise((resolve, reject) => {
            qrImg.onload = resolve;
            qrImg.onerror = reject;
        });
        // Draw with a white border
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(cardWidth - 10 - 110, 145, 110, 110);
        ctx.drawImage(qrImg, cardWidth - 15 - 100, 150, 100, 100);
    } catch (e) {
        console.error("Failed to load QR code image");
    }

    // 4. Text Content
    const padding = 20;

    // Title
    ctx.fillStyle = '#111827'; // gray-900
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    wrapText(ctx, post.title, padding, 220, cardWidth - padding * 2, 24, 2);

    // Price
    ctx.font = 'bold 24px sans-serif';
    const priceText = formatCurrency(post.salePrice ?? post.price);
    ctx.fillText(priceText, padding, 280);

    // Author
    if (post.author) {
        ctx.font = '14px sans-serif';
        ctx.fillStyle = '#4B5563';
        const authorText = `by ${post.author.name}`;
        ctx.fillText(authorText, padding, 315);
        
        const authorTextWidth = ctx.measureText(authorText).width;

        // Badge
        if (post.author.subscription.tier !== 'Personal' && post.author.subscription.tier !== 'Basic') {
            const badgeSvg = getBadgeSvg(post.author.subscription.tier);
            const badgeImg = new Image();
            badgeImg.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(badgeSvg);
            try {
                await new Promise(r => badgeImg.onload=r);
                ctx.drawImage(badgeImg, padding + authorTextWidth + 5, 312, 18, 18);
            } catch (e) { console.error("Failed to load badge image for QR card"); }
        }
    }
    
    // 5. Logo at bottom
    await drawLogoOnCanvas(ctx, cardWidth / 2, 360, 'large');

    return new Promise(resolve => canvas.toBlob(blob => resolve(blob), 'image/png'));
};