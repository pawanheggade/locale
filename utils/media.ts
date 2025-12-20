
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
            resolve(compressedFile);
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

export const generatePostPreviewImage = async (post: DisplayablePost): Promise<Blob | null> => {
    if (!post.author) {
        console.error("Author information is required to generate a post preview.");
        return null;
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const drawSaleBadge = (ctx: CanvasRenderingContext2D, x: number, y: number, percentage: number) => {
        ctx.save();
        
        const badgeHeight = 22;
        const paddingX = 8;
        const arrowWidth = 8;
        const holeRadius = 2.5;
        const borderRadius = 4;
        const text = `${percentage}% OFF`;
        const font = 'bold 12px sans-serif';

        ctx.font = font;
        const textWidth = ctx.measureText(text).width;
        const badgeWidth = textWidth + paddingX * 2;
        
        ctx.fillStyle = '#fef3c7'; // amber-100
        ctx.beginPath();
        ctx.moveTo(x, y + badgeHeight / 2);
        ctx.lineTo(x + arrowWidth, y);
        ctx.lineTo(x + arrowWidth + badgeWidth - borderRadius, y);
        ctx.arcTo(x + arrowWidth + badgeWidth, y, x + arrowWidth + badgeWidth, y + borderRadius, borderRadius);
        ctx.lineTo(x + arrowWidth + badgeWidth, y + badgeHeight - borderRadius);
        ctx.arcTo(x + arrowWidth + badgeWidth, y + badgeHeight, x + arrowWidth + badgeWidth - borderRadius, y + badgeHeight, borderRadius);
        ctx.lineTo(x + arrowWidth, y + badgeHeight);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(x + arrowWidth, y + badgeHeight / 2, holeRadius, 0, 2 * Math.PI);
        ctx.fill();
        
        ctx.fillStyle = '#92400e'; // amber-800
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, x + arrowWidth + badgeWidth / 2, y + badgeHeight / 2 + 1);

        ctx.restore();
    };
    
    // --- Height Calculation ---
    const scale = 2;
    const cardWidth = 400;
    const padding = 24;
    const imageHeight = 250;
    const footerHeight = 80;
    let requiredHeight = imageHeight + padding; // Start with image and top padding

    const calculateLines = (text: string, font: string, maxWidth: number, maxLines = Infinity) => {
        if (!text) return 0;
        ctx.font = font;
        const words = text.split(' ');
        let line = '';
        let lineCount = 0;
        for (let n = 0; n < words.length; n++) {
            const testLine = line + words[n] + ' ';
            if (ctx.measureText(testLine).width > maxWidth && n > 0) {
                lineCount++;
                line = words[n] + ' ';
            } else {
                line = testLine;
            }
        }
        if (line.trim()) lineCount++;
        return Math.min(lineCount, maxLines);
    };

    // Title Height
    const titleLineHeight = 30;
    let titleLines = calculateLines(post.title, 'bold 24px sans-serif', cardWidth - padding * 2, 2);
    requiredHeight += titleLines * titleLineHeight;

    // Price Height
    requiredHeight += 10; // margin after title
    if (post.price !== undefined) {
        requiredHeight += 40; // approx height for price section
    }

    // Description Height
    requiredHeight += 20; // margin before description
    const descLineHeight = 20;
    const maxDescLines = 15; // Cap description to prevent extremely tall images
    const descLines = calculateLines(post.description, '14px sans-serif', cardWidth - padding * 2, maxDescLines);
    requiredHeight += descLines * descLineHeight;

    requiredHeight += 15; // padding before footer
    requiredHeight += footerHeight;

    const minCardHeight = 600;
    const cardHeight = Math.max(minCardHeight, requiredHeight);

    // --- Canvas Setup ---
    canvas.width = cardWidth * scale;
    canvas.height = cardHeight * scale;
    ctx.scale(scale, scale);

    // --- Asset Loading ---
    const postImgPromise = new Promise<HTMLImageElement>(resolve => {
        if (post.media && post.media.length > 0 && post.media[0].type === 'image') {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => resolve(img);
            img.onerror = (e) => {
                console.warn("Failed to load post image for canvas", e);
                resolve(img);
            };
            img.src = post.media[0].url;
        } else {
            resolve(new Image());
        }
    });

    const postUrl = `${window.location.origin}/?post=${post.id}`;
    const tier = post.author.subscription.tier;
    const tierStyles = TIER_STYLES[tier] || TIER_STYLES.Personal;
    const qrColor = tierStyles.hex.substring(1); // Remove '#' for URL param
    const qrCodeApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${100 * scale}&data=${encodeURIComponent(postUrl)}&bgcolor=ffffff&color=${qrColor}&qzone=1&margin=0`;

    const qrImgPromise = new Promise<HTMLImageElement>(resolve => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = (e) => {
            console.warn("Could not load QR code for canvas", e);
            resolve(img);
        };
        img.src = qrCodeApiUrl;
    });
    
    const [postImg, qrImg] = await Promise.all([postImgPromise, qrImgPromise]);

    // --- Drawing ---

    // 1. White Background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, cardWidth, cardHeight);

    // 2. Post Media
    if (postImg.complete && postImg.naturalHeight !== 0) {
        const imgAspectRatio = postImg.width / postImg.height;
        const canvasAspectRatio = cardWidth / imageHeight;
        let sx = 0, sy = 0, sWidth = postImg.width, sHeight = postImg.height;

        if (imgAspectRatio > canvasAspectRatio) {
            sWidth = postImg.height * canvasAspectRatio;
            sx = (postImg.width - sWidth) / 2;
        } else {
            sHeight = postImg.width / canvasAspectRatio;
            sy = (postImg.height - sHeight) / 2;
        }
        ctx.drawImage(postImg, sx, sy, sWidth, sHeight, 0, 0, cardWidth, imageHeight);
    } else {
        ctx.fillStyle = '#E5E7EB';
        ctx.fillRect(0, 0, cardWidth, imageHeight);
    }
    
    let currentY = imageHeight + padding;

    const wrapText = (text: string, x: number, y: number, maxWidth: number, lineHeight: number, maxLines: number = Infinity): number => {
        if (!text) return 0;
        const words = text.split(' ');
        let line = '';
        let linesDrawn = 0;
        let currentTextY = y;

        for (let n = 0; n < words.length; n++) {
            const testLine = line + words[n] + ' ';
            const metrics = ctx.measureText(testLine);
            if (metrics.width > maxWidth && n > 0) {
                if (linesDrawn + 1 < maxLines) {
                    ctx.fillText(line.trim(), x, currentTextY);
                    currentTextY += lineHeight;
                    linesDrawn++;
                    line = words[n] + ' ';
                } else {
                    let truncatedLine = line.trim();
                    while (ctx.measureText(truncatedLine + '...').width > maxWidth) {
                        truncatedLine = truncatedLine.slice(0, -1);
                    }
                    ctx.fillText(truncatedLine + '...', x, currentTextY);
                    linesDrawn++;
                    return linesDrawn;
                }
            } else {
                line = testLine;
            }
        }
        
        if (line.trim().length > 0) {
            ctx.fillText(line.trim(), x, currentTextY);
            linesDrawn++;
        }
        return linesDrawn;
    };

    // 3. Title
    ctx.fillStyle = '#111827';
    ctx.font = 'bold 24px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    
    const maxLines = 2;
    const words = post.title.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (let i = 0; i < words.length; i++) {
        const testLine = currentLine + words[i] + ' ';
        if (ctx.measureText(testLine).width > (cardWidth - padding * 2) && i > 0) {
            lines.push(currentLine.trim());
            currentLine = words[i] + ' ';
        } else {
            currentLine = testLine;
        }
    }
    lines.push(currentLine.trim());

    if (lines.length > maxLines) {
        lines.length = maxLines;
        let lastLine = lines[maxLines - 1];
        let truncatedLine = lastLine;
        while (ctx.measureText(truncatedLine + '...').width > (cardWidth - padding * 2)) {
            truncatedLine = truncatedLine.slice(0, -1);
        }
        lines[maxLines - 1] = truncatedLine + '...';
    }

    lines.forEach((line, index) => {
        const lineY = currentY + (index * titleLineHeight);
        ctx.fillText(line, padding, lineY);
    });
    currentY += (lines.length * titleLineHeight);


    // 4. Price & Sale Badge
    currentY += 10;
    if (post.price !== undefined) {
        let currentX = padding;
        const onSale = post.price !== undefined && post.salePrice !== undefined && post.salePrice < post.price;

        // Sale Price or Regular Price
        const priceString = formatCurrency(post.salePrice ?? post.price);
        ctx.font = 'bold 28px sans-serif';
        ctx.fillStyle = onSale ? '#CA8A04' : '#1F2937';
        ctx.textBaseline = 'top';
        const priceMetrics = ctx.measureText(priceString);
        ctx.fillText(priceString, currentX, currentY);
        currentX += priceMetrics.width + 10;
        
        // Original Price (Struck-through)
        if (onSale && post.price) {
            const originalPriceString = formatCurrency(post.price);
            ctx.font = '500 18px sans-serif';
            ctx.fillStyle = '#6B7280'; // gray-500
            ctx.fillText(originalPriceString, currentX, currentY + 6);
            
            const originalPriceMetrics = ctx.measureText(originalPriceString);
            const textHeight = originalPriceMetrics.actualBoundingBoxAscent + originalPriceMetrics.actualBoundingBoxDescent;
            ctx.strokeStyle = '#6B7280';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(currentX, currentY + 6 + textHeight / 1.5);
            ctx.lineTo(currentX + originalPriceMetrics.width, currentY + 6 + textHeight / 1.5);
            ctx.stroke();
            currentX += originalPriceMetrics.width + 10;
        }

        // Sale Badge
        if (onSale) {
            const salePercentage = Math.round(((post.price! - post.salePrice!) / post.price!) * 100);
            const saleBadgeHeight = 22; // From drawSaleBadge
            const mainPriceFontSize = 28;
            // Vertically align badge with the main sale price text
            drawSaleBadge(ctx, currentX, currentY + (mainPriceFontSize - saleBadgeHeight) / 2, salePercentage);
        }
    }
    currentY += 40;

    // 5. Description
    currentY += 20;
    ctx.fillStyle = '#374151';
    ctx.font = '14px sans-serif';
    const descLinesDrawn = wrapText(post.description, padding, currentY, cardWidth - padding * 2, descLineHeight, maxDescLines);
    currentY += descLinesDrawn * descLineHeight;

    // 7. Footer info
    const footerY = cardHeight - 80;
    ctx.strokeStyle = '#F3F4F6'; // gray-100
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding, footerY);
    ctx.lineTo(cardWidth - padding, footerY);
    ctx.stroke();

    const footerContentY = footerY + (cardHeight - footerY) / 2; // Vertical center of footer area
    
    // Draw @username and badge on the left, upper part of footer
    ctx.font = 'bold 16px sans-serif';
    ctx.fillStyle = '#111827'; // gray-900
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';

    const usernameText = `@${post.author.username}`;
    const usernameWidth = ctx.measureText(usernameText).width;
    const hasBadge = ['Verified', 'Business', 'Organisation'].includes(tier);
    const badgeSize = 18;
    const gap = 5;

    const usernameY = footerY + 25; // Position in upper part of footer
    ctx.fillText(usernameText, padding, usernameY);

    if (hasBadge) {
        const badgeSvg = getBadgeSvg(tier);
        if (badgeSvg) {
            const badgeImg = new Image();
            const badgeDataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(badgeSvg)}`;
            badgeImg.src = badgeDataUrl;

            await new Promise<void>((resolve) => {
                badgeImg.onload = () => resolve();
                badgeImg.onerror = (e) => {
                    console.warn("Could not load badge for canvas", e);
                    resolve();
                };
            });

            if (badgeImg.complete && badgeImg.naturalHeight > 0) {
                const badgeX = padding + usernameWidth + gap;
                const badgeY = usernameY - (badgeSize / 2);
                ctx.drawImage(badgeImg, badgeX, badgeY, badgeSize, badgeSize);
            }
        }
    }
    
    // Draw Logo below username, aligned left
    ctx.save();
    const logoFontSize = 28; // From drawLogoOnCanvas implementation
    ctx.font = `bold ${logoFontSize}px "Comfortaa", sans-serif`;
    const logoWidth = ctx.measureText("locale").width;
    ctx.restore();

    const logoCenterX = padding + (logoWidth / 2);
    const logoCenterY = footerY + 58; // Position in lower part of footer
    await drawLogoOnCanvas(ctx, logoCenterX, logoCenterY);

    // Draw QR code on the right, vertically centered in the footer area
    const qrSize = 60;
    if (qrImg.complete && qrImg.naturalHeight !== 0) {
        ctx.drawImage(qrImg, cardWidth - padding - qrSize, footerContentY - qrSize / 2, qrSize, qrSize);
    }

    return new Promise((resolve) => {
        canvas.toBlob((blob) => {
            resolve(blob);
        }, 'image/png');
    });
};
