

import React, { useState, useRef, useEffect, useReducer } from 'react';
import { Post, PriceAlert } from '../types';
import ModalShell from './ModalShell';
import { TrashIcon } from './Icons';
import { formatCurrency } from '../utils/formatters';
import { Button } from './ui/Button';
import { FormField } from './FormField';
import { CurrencyInput } from './ui/CurrencyInput';

interface SetPriceAlertModalProps {
  post: Post;
  onClose: () => void;
  onSetAlert: (targetPrice: number) => void;
  existingAlert: PriceAlert | undefined;
  onDeleteAlert: () => void;
}

const initialState = {
    targetPrice: '',
    alertOnAnyDrop: false,
    error: '',
};

type State = typeof initialState;

type Action =
    | { type: 'SET_FIELD'; field: 'targetPrice' | 'error'; payload: string }
    | { type: 'SET_ALERT_ON_ANY_DROP'; payload: { checked: boolean; postPrice?: number } }
    | { type: 'RESET'; payload: Partial<State> };

function reducer(state: State, action: Action): State {
    switch (action.type) {
        case 'SET_FIELD':
            if (action.field === 'targetPrice') {
                return { ...state, targetPrice: action.payload, alertOnAnyDrop: false, error: '' };
            }
            return { ...state, [action.field]: action.payload };
        case 'SET_ALERT_ON_ANY_DROP':
            return {
                ...state,
                alertOnAnyDrop: action.payload.checked,
                targetPrice: action.payload.checked ? String(action.payload.postPrice ?? '0') : state.targetPrice,
                error: '',
            };
        case 'RESET':
            return { ...initialState, ...action.payload };
        default:
            return state;
    }
}

const SetPriceAlertModal: React.FC<SetPriceAlertModalProps> = ({ post, onClose, onSetAlert, existingAlert, onDeleteAlert }) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { targetPrice, alertOnAnyDrop, error } = state;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (existingAlert) {
      const isAnyDrop = existingAlert.targetPrice >= (post.price ?? 0);
      dispatch({
        type: 'RESET',
        payload: {
          targetPrice: existingAlert.targetPrice.toString(),
          alertOnAnyDrop: isAnyDrop,
        },
      });
    }
  }, [existingAlert, post.price]);

  const handleSetAlert = () => {
    const priceValue = parseFloat(targetPrice);
    dispatch({ type: 'SET_FIELD', field: 'error', payload: '' });

    if (isNaN(priceValue) || priceValue <= 0) {
      dispatch({ type: 'SET_FIELD', field: 'error', payload: 'Please enter a valid, positive price.' });
      return;
    }
    
    if (!alertOnAnyDrop && post.price && priceValue >= post.price) {
      dispatch({ type: 'SET_FIELD', field: 'error', payload: `Your alert price must be less than the current price of ${formatCurrency(post.price)}.` });
      return;
    }
    
    setIsSubmitting(true);
    onSetAlert(priceValue);
    onClose();
  };
  
  const handleDelete = () => {
    onDeleteAlert();
  };

  const renderFooter = () => (
    <>
      <Button
        variant="overlay-dark"
        onClick={onClose}
        disabled={isSubmitting}
        className="mr-auto"
      >
        Cancel
      </Button>
      {existingAlert && (
          <Button
              variant="destructive"
              onClick={handleDelete}
              isLoading={isSubmitting}
              className="gap-2"
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
        variant="pill-red"
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
          <p className="text-sm text-gray-600">{post.title}</p>
          <p className="text-lg font-medium text-gray-800">Current Price: <span className="font-bold">{formatCurrency(post.price)}</span></p>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); handleSetAlert(); }} className="space-y-4">
           <FormField
              id="target-price"
              label="Notify me when price drops to or below"
              error={error}
           >
              <CurrencyInput
                value={targetPrice}
                onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'targetPrice', payload: e.target.value })}
                className="bg-gray-50 disabled:bg-gray-100 disabled:text-gray-500"
                autoFocus
                disabled={alertOnAnyDrop}
              />
           </FormField>

          <div className="flex items-center">
            <input
              id="any-drop"
              type="checkbox"
              checked={alertOnAnyDrop}
              onChange={(e) => dispatch({ type: 'SET_ALERT_ON_ANY_DROP', payload: { checked: e.target.checked, postPrice: post.price } })}
              className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded cursor-pointer"
            />
            <label htmlFor="any-drop" className="ml-2 block text-sm text-gray-900 cursor-pointer">
              Alert me on any price drop
            </label>
          </div>
        </form>
      </div>
    </ModalShell>
  );
};

export default SetPriceAlertModal;