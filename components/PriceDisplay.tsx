
import React from 'react';
import { formatCurrency } from '../utils/formatters';
import { SaleBadge } from './Badges';

interface PriceDisplayProps {
    price?: number;
    salePrice?: number;
    priceUnit?: string;
    isExpired?: boolean;
    size?: 'small' | 'medium' | 'large' | 'x-small';
    className?: string;
    showOriginalPriceOnSale?: boolean;
}

export const PriceDisplay: React.FC<PriceDisplayProps> = ({ price, salePrice, priceUnit, isExpired = false, size = 'medium', className = '', showOriginalPriceOnSale = true }) => {
    const hasPrice = price !== undefined && price !== null;
    const onSale = hasPrice && salePrice !== undefined && salePrice < price!;
    const salePercentage = onSale ? Math.round(((price! - salePrice!) / price!) * 100) : 0;

    const sizeClasses = {
        'x-small': {
            sale: 'text-lg',
            original: 'text-base',
            normal: 'text-lg'
        },
        small: {
            sale: 'text-2xl',
            original: 'text-lg',
            normal: 'text-2xl'
        },
        medium: {
            sale: 'text-4xl',
            original: 'text-2xl',
            normal: 'text-4xl'
        },
        large: {
            sale: 'text-5xl',
            original: 'text-3xl',
            normal: 'text-5xl'
        }
    };
    const currentSize = sizeClasses[size];
    
    const currentColors = { sale: 'text-amber-600', original: 'text-gray-600', normal: 'text-gray-800', expired: 'text-gray-400' };
    
    const unitText = priceUnit && priceUnit !== 'Fixed' ? <span className="text-sm font-normal text-gray-600 ml-1">/{priceUnit.toLowerCase()}</span> : null;

    return (
        <div className={`flex items-baseline flex-wrap gap-2 ${className}`}>
            <div className="flex flex-row items-baseline gap-2 min-w-0">
                {onSale ? (
                    <>
                        <span className="sr-only">Sale Price:</span>
                        <p className={`${currentSize.sale} font-extrabold ${isExpired ? currentColors.expired : currentColors.sale} truncate`}>
                            {formatCurrency(salePrice!)}
                            {unitText}
                        </p>
                        {showOriginalPriceOnSale && (
                            <>
                                <span className="sr-only">Original Price:</span>
                                <p className={`${currentSize.original} font-medium ${isExpired ? currentColors.expired : currentColors.original} line-through truncate`}>
                                    {formatCurrency(price!)}
                                </p>
                            </>
                        )}
                    </>
                ) : (
                    <>
                        <span className="sr-only">Price:</span>
                        <p className={`${currentSize.normal} font-extrabold ${isExpired ? `${currentColors.expired} line-through` : currentColors.normal} truncate`}>
                            {formatCurrency(price)}
                            {unitText}
                        </p>
                    </>
                )}
            </div>

            {onSale && showOriginalPriceOnSale && (
                <SaleBadge percentage={salePercentage} size={size === 'small' || size === 'x-small' ? 'small' : 'medium'} />
            )}
        </div>
    );
};