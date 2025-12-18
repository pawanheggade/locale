
import { Post, DisplayablePost } from '../types';
import { getBadgeSvg, TIER_STYLES, drawLogoOnCanvas } from '../lib/utils';
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

    let finalLines = lines.slice(0, maxLines);
    if (lines.length > maxLines) {
        // Find the last line and truncate it with an ellipsis
        let lastLine = finalLines[maxLines - 1];
        while (context.measureText(lastLine + '...').width > maxWidth && lastLine.length > 0) {
            lastLine = lastLine.slice(0, -1);
        }
        finalLines[maxLines - 1] = lastLine.trim() + '...';
    }
    
    for (let k = 0; k < finalLines.length; k++) {
        context.fillText(finalLines[k].trim(), x, y + (k * lineHeight));
    }
};


export const generatePostPreviewImage = async (post: DisplayablePost): Promise<Blob | null> => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const scale = 3;
    const cardWidth = 350;
    const imageHeight = 200;
    const detailsHeight = 250;
    const cardHeight = imageHeight + detailsHeight;
    const padding = 20;

    canvas.width = cardWidth * scale;
    canvas.height = cardHeight * scale;
    ctx.scale(scale, scale);

    // --- Asset Loading ---
    const imagePromises: Promise<any>[] = [];

    const postImg = new Image();
    postImg.crossOrigin = 'anonymous';
    if (post.media.length > 0 && post.media[0].type === 'image') {
        postImg.src = post.media[0].url;
        imagePromises.push(new Promise((resolve, reject) => {
            postImg.onload = resolve;
            postImg.onerror = resolve; // Don't reject, just continue without the image
        }));
    }

    const authorImg = new Image();
    authorImg.crossOrigin = 'anonymous';
    if (post.author?.avatarUrl) {
        authorImg.src = post.author.avatarUrl;
        imagePromises.push(new Promise((resolve, reject) => {
            authorImg.onload = resolve;
            authorImg.onerror = resolve;
        }));
    }

    const tierStyles = TIER_STYLES[post.author?.subscription.tier || 'Personal'];
    const qrColor = tierStyles.hex.substring(1);
    const qrCodeUrl = `https://quickchart.io/qr?text=${encodeURIComponent(`${window.location.origin}?post=${post.id}`)}&size=200&margin=1&ecLevel=H&dark=${qrColor}`;
    const qrImg = new Image();
    qrImg.crossOrigin = 'anonymous';
    qrImg.src = qrCodeUrl;
    imagePromises.push(new Promise((resolve, reject) => {
        qrImg.onload = resolve;
        qrImg.onerror = resolve;
    }));
    
    await Promise.all(imagePromises);

    // --- Drawing ---

    // 1. White background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, cardWidth, cardHeight);

    // 2. Post image
    if (postImg.complete && postImg.naturalHeight !== 0) {
        const hRatio = cardWidth / postImg.width;
        const vRatio = imageHeight / postImg.height;
        const ratio = Math.max(hRatio, vRatio);
        const centerShiftX = (cardWidth - postImg.width * ratio) / 2;
        const centerShiftY = (imageHeight - postImg.height * ratio) / 2;
        ctx.drawImage(postImg, 0, 0, postImg.width, postImg.height, centerShiftX, centerShiftY, postImg.width * ratio, postImg.height * ratio);
    } else {
        ctx.fillStyle = '#F3F4F6'; // gray-100
        ctx.fillRect(0, 0, cardWidth, imageHeight);
    }
    
    // --- Details Section ---
    const detailsY = imageHeight + padding;

    // 3. Author Info
    const avatarSize = 40;
    if (post.author) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(padding + avatarSize / 2, detailsY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.clip();
        if (authorImg.complete && authorImg.naturalHeight !== 0) {
            ctx.drawImage(authorImg, padding, detailsY, avatarSize, avatarSize);
        } else {
            ctx.fillStyle = '#E5E7EB'; // gray-200
            ctx.fillRect(padding, detailsY, avatarSize, avatarSize);
        }
        ctx.restore();

        ctx.fillStyle = '#111827'; // gray-900
        ctx.font = 'bold 14px sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(post.author.name, padding + avatarSize + 12, detailsY + 4);

        ctx.fillStyle = '#6B7280'; // gray-500
        ctx.font = '12px sans-serif';
        ctx.fillText(`@${post.author.username}`, padding + avatarSize + 12, detailsY + 22);
    }

    // 4. Title & Price
    const titleY = detailsY + avatarSize + 20;
    ctx.fillStyle = '#111827';
    ctx.font = 'bold 20px sans-serif';
    wrapText(ctx, post.title, padding, titleY, cardWidth - padding * 2, 24, 2);

    const priceY = titleY + 60;
    ctx.fillStyle = '#111827';
    ctx.font = 'bold 24px sans-serif';
    ctx.textBaseline = 'bottom';
    ctx.fillText(formatCurrency(post.salePrice ?? post.price), padding, priceY);
    if (post.salePrice) {
        const salePriceWidth = ctx.measureText(formatCurrency(post.salePrice)).width;
        ctx.fillStyle = '#9CA3AF'; // gray-400
        ctx.font = '16px sans-serif';
        ctx.fillText(formatCurrency(post.price), padding + salePriceWidth + 8, priceY);
    }

    // 5. QR Code & Logo
    const qrSize = 64;
    const qrY = cardHeight - qrSize - padding;
    if (qrImg.complete && qrImg.naturalHeight !== 0) {
        ctx.drawImage(qrImg, cardWidth - qrSize - padding, qrY, qrSize, qrSize);
    }

    await drawLogoOnCanvas(ctx, padding + 40, qrY + (qrSize / 2));
    
    return new Promise(resolve => canvas.toBlob(blob => resolve(blob), 'image/png', 0.95));
};
