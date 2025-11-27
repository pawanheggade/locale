
import React, { useState, useRef } from 'react';
import { Post, BagItem } from '../types';
import ModalShell from './ModalShell';
import { formatCurrency } from '../utils/formatters';
import { Button } from './ui/Button';
import { QuantitySelector } from './QuantitySelector';

interface AddToBagModalProps {
  post: Post;
  onClose: () => void;
  onSave: (quantity: number) => void;
  onRemove?: () => void;
  existingItem: BagItem | undefined;
  isSubmitting: boolean;
}

const AddToBagModal: React.FC<AddToBagModalProps> = ({ post, onClose, onSave, onRemove, existingItem, isSubmitting }) => {
  const [quantity, setQuantity] = useState(String(existingItem?.quantity ?? 1));
  const modalRef = useRef<HTMLDivElement>(null);

  const handleSave = () => {
    const numQuantity = parseInt(quantity, 10);
    if (!isNaN(numQuantity) && numQuantity > 0) {
      onSave(numQuantity);
    }
  };

  const handleRemove = () => {
    if (onRemove) {
      onRemove();
    }
  };

  const renderFooter = () => (
    <>
      <Button variant="overlay-dark" onClick={onClose} disabled={isSubmitting} className="mr-auto">
        Cancel
      </Button>
      <Button
        type="button"
        onClick={handleSave}
        isLoading={isSubmitting}
        className="w-32"
        variant="pill-red"
        disabled={parseInt(quantity, 10) <= 0 || isNaN(parseInt(quantity, 10))}
      >
        {existingItem ? 'Update Bag' : 'Add to Bag'}
      </Button>
    </>
  );

  const priceUnitText = post.priceUnit && post.priceUnit !== 'Fixed' ? ` / ${post.priceUnit.toLowerCase()}` : '';

  return (
    <ModalShell
      panelRef={modalRef}
      onClose={onClose}
      title={existingItem ? 'Update Item in Bag' : 'Add to Bag'}
      footer={renderFooter()}
      panelClassName="w-full max-w-md"
      titleId="add-to-bag-title"
    >
      <div className="p-6">
        <div className="flex items-start gap-4">
          {post.media.length > 0 && <img src={post.media[0].url} alt={post.title} className="w-24 h-24 rounded-md object-cover bg-gray-100" />}
          <div className="flex-1">
            <h3 className="font-semibold text-gray-800">{post.title}</h3>
            <p className="text-lg font-bold text-gray-900">
                {formatCurrency(post.price)}
                <span className="text-sm font-normal text-gray-500">{priceUnitText}</span>
            </p>
          </div>
        </div>
        <div className="mt-6">
          <label htmlFor="quantity" className="block text-sm font-medium text-gray-600 text-center mb-2">
            Quantity
          </label>
          <div className="flex items-center justify-center gap-3">
            <QuantitySelector
                value={quantity}
                onChange={(val) => {
                    if (val === '' || /^[1-9]\d*$/.test(val)) {
                        setQuantity(val);
                    }
                }}
                onBlur={() => {
                    const numQuantity = parseInt(quantity, 10);
                    if (isNaN(numQuantity) || numQuantity < 1) {
                        setQuantity('1');
                    }
                }}
                onIncrement={() => {
                    const numQuantity = parseInt(quantity, 10) || 0;
                    setQuantity(String(numQuantity + 1));
                }}
                onDecrement={() => {
                    const numQuantity = parseInt(quantity, 10) || 1;
                    if (numQuantity > 1) {
                        setQuantity(String(numQuantity - 1));
                    }
                }}
                onRemove={handleRemove}
                canRemove={!!existingItem}
                size="lg"
                autoFocus
            />
          </div>
        </div>
      </div>
    </ModalShell>
  );
};

export default AddToBagModal;
