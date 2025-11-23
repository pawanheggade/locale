
import React, { useState, useRef, useEffect } from 'react';
import { Post, PriceAlert } from '../types';
import ModalShell from './ModalShell';
import { AlertIcon, TrashIcon } from './Icons';
import { formatCurrency } from '../utils/formatters';
import { Button } from './ui/Button';

interface SetPriceAlertModalProps {
  post: Post;
  onClose: () => void;
  onSetAlert: (targetPrice: number) => void;
  existingAlert: PriceAlert | undefined;
  onDeleteAlert: () => void;
}

const SetPriceAlertModal: React.FC<SetPriceAlertModalProps> = ({ post, onClose, onSetAlert, existingAlert, onDeleteAlert }) => {
  const [targetPrice, setTargetPrice] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (existingAlert) {
      setTargetPrice(existingAlert.targetPrice.toString());
    }
  }, [existingAlert]);

  const handleSetAlert = () => {
    const priceValue = parseFloat(targetPrice);
    setError('');

    if (isNaN(priceValue) || priceValue <= 0) {
      setError('Please enter a valid, positive price.');
      return;
    }
    if (priceValue >= post.price) {
      setError(`Your alert price must be less than the current price of ${formatCurrency(post.price)}.`);
      return;
    }
    
    setIsSubmitting(true);
    onSetAlert(priceValue);
    onClose();
  };
  
  const handleDelete = () => {
    // Just trigger the delete action. The parent will handle confirmation (and swapping modals).
    // Do NOT call onClose here if the parent opens a confirmation modal, as that will be handled by the openModal call replacement.
    onDeleteAlert();
  };

  const renderFooter = () => (
    <>
      <Button
        variant="glass"
        onClick={onClose}
        disabled={isSubmitting}
        className="mr-auto"
      >
        Cancel
      </Button>
      {existingAlert && (
          <Button
              variant="glass-red-light"
              onClick={handleDelete}
              isLoading={isSubmitting}
              className="gap-2 text-red-600"
          >
              <TrashIcon className="w-5 h-5" />
              Remove
          </Button>
      )}
      <Button
        type="button"
        onClick={handleSetAlert}
        isLoading={isSubmitting}
        className="w-32"
        variant="glass-red"
      >
        {existingAlert ? 'Update Alert' : 'Set Alert'}
      </Button>
    </>
  );

  return (
    <ModalShell
      panelRef={modalRef}
      onClose={onClose}
      title="Set Price Drop Alert"
      footer={renderFooter()}
      panelClassName="w-full max-w-md"
      titleId="set-price-alert-title"
    >
      <div className="p-6">
        <div className="text-center mb-4">
          <p className="text-sm text-gray-700">{post.title}</p>
          <p className="text-lg font-medium text-gray-800">Current Price: <span className="font-bold">{formatCurrency(post.price)}</span></p>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); handleSetAlert(); }} className="space-y-2">
          <div>
            <label htmlFor="target-price" className="block text-sm font-medium text-gray-800">
              Notify me when price drops to or below
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <span className="text-gray-500 sm:text-sm">₹</span>
              </div>
              <input
                type="number"
                id="target-price"
                value={targetPrice}
                onChange={(e) => {
                  setTargetPrice(e.target.value);
                  if (error) setError('');
                }}
                className={`block w-full bg-gray-50 border-gray-200 rounded-md shadow-sm pl-7 pr-3 text-gray-900 focus:bg-white focus:ring-1 focus:ring-red-500 focus:border-red-500 transition-colors duration-150 sm:text-sm ${error ? 'border-red-500' : 'border-gray-200'}`}
                placeholder="0.00"
                aria-describedby="target-price-error"
                autoFocus
                min="0"
                step="0.01"
              />
            </div>
            {error && <p id="target-price-error" className="mt-2 text-sm text-red-600 flex items-center gap-1"><AlertIcon className="w-4 h-4" /> {error}</p>}
          </div>
        </form>
      </div>
    </ModalShell>
  );
};

export default SetPriceAlertModal;
