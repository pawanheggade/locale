
import React, { useState, useMemo } from 'react';
import { Post, DisplayablePost, Account, SavedList } from '../types';
import { formatCurrency } from '../utils/formatters';
// FIX: Import SpinnerIcon
import { TrashIcon, ShoppingBagIcon, PlusIcon, PencilIcon, DocumentIcon, SpinnerIcon } from './Icons';
import { usePosts } from '../contexts/PostsContext';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/Button';
import { useUI } from '../contexts/UIContext';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from './ui/Accordion';
import { Input } from './ui/Input';
import { QuantitySelector } from './QuantitySelector';
import { EmptyState } from './EmptyState';
import { useConfirmationModal } from '../hooks/useConfirmationModal';
import { cn } from '../lib/utils';

// --- Reusable Item Row Component ---
interface BagItemRowProps {
  item: { id: string; quantity: number; isChecked?: boolean; post: DisplayablePost };
  quantityInputValue?: string;
  onQuantityChange: (val: string) => void;
  onQuantityBlur: () => void;
  onIncrement: () => void;
  onDecrement: () => void;
  onRemove: () => void;
  onViewDetails: () => void;
  onToggleCheck?: (checked: boolean) => void;
  actionButton: React.ReactNode;
}

const BagItemRow: React.FC<BagItemRowProps> = ({
  item,
  quantityInputValue,
  onQuantityChange,
  onQuantityBlur,
  onIncrement,
  onDecrement,
  onRemove,
  onViewDetails,
  onToggleCheck,
  actionButton,
}) => {
  const { post, isChecked } = item;
  const localQuantity = quantityInputValue ?? String(item.quantity);

  return (
    <li className="relative p-4 flex items-center gap-4">
      {onToggleCheck && (
        <input
          type="checkbox"
          checked={isChecked}
          onChange={(e) => onToggleCheck(e.target.checked)}
          className="h-5 w-5 rounded border-gray-300 text-red-600 focus:ring-red-500 flex-shrink-0"
          aria-label={`Select ${post.title}`}
        />
      )}
      <img
        src={post.media.length > 0 ? post.media[0].url : ''}
        alt={post.title}
        className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-md bg-gray-200 cursor-pointer flex-shrink-0"
        onClick={onViewDetails}
      />
      <div className="flex-1 min-w-0">
        <Button
          variant="ghost"
          onClick={onViewDetails}
          title={post.title}
          className={cn(
            '!p-0 !h-auto !justify-start !text-left !block !truncate font-semibold',
            isChecked ? 'text-gray-500 line-through' : 'text-gray-800'
          )}
        >
          {post.title}
        </Button>

        <p className={`text-sm text-gray-500 ${isChecked ? 'line-through' : ''}`}>
          {formatCurrency(post.salePrice ?? post.price)}
        </p>

        <div className="mt-2">
          <QuantitySelector
             value={localQuantity}
             onChange={onQuantityChange}
             onBlur={onQuantityBlur}
             onIncrement={onIncrement}
             onDecrement={onDecrement}
             onRemove={onRemove}
             canRemove={true}
           />
        </div>
      </div>
      <div className="ml-4 flex-shrink-0">
        {actionButton}
      </div>
    </li>
  );
};


export const BagView: React.FC = () => {
  const { 
    bag, 
    savedLists,
    addToBag,
    updateBagItem, 
    removeBagItem, 
    clearCheckedBagItems,
    createSavedList,
    renameSavedList,
    addListToBag,
    deleteListAndMoveItems,
  } = useAuth();
  const { findPostById } = usePosts();
  const { openModal } = useUI();
  const showConfirmation = useConfirmationModal();
  
  const [quantityInputs, setQuantityInputs] = useState<Record<string, string>>({});
  const [editingList, setEditingList] = useState<{ id: string, name: string } | null>(null);
  const [showCreateListForm, setShowCreateListForm] = useState(false);
  const [newListName, setNewListName] = useState('');
  
  const itemsWithPostData = useMemo(() => bag
    .map(item => {
      const post = findPostById(item.postId);
      return post ? { ...item, post } : null;
    })
    .filter((item): item is (typeof bag[0] & { post: DisplayablePost }) => item !== null),
  [bag, findPostById]);

  const inBagItems = useMemo(() => itemsWithPostData.filter(item => item.savedListIds.length === 0), [itemsWithPostData]);
  const savedItemsByList = useMemo(() => {
    const map = new Map<string, (typeof itemsWithPostData[number])[]>();
    for (const list of savedLists) {
      map.set(list.id, []);
    }
    for (const item of itemsWithPostData) {
      for (const listId of item.savedListIds) {
        if (map.has(listId)) {
          map.get(listId)!.push(item);
        }
      }
    }
    return map;
  }, [itemsWithPostData, savedLists]);

  const [isClearing, setIsClearing] = useState(false);

  const total = inBagItems
    .filter(item => !item.isChecked)
    .reduce((sum, item) => sum + (item.post.salePrice ?? item.post.price) * item.quantity, 0);

  // Calculate total items count based on quantity for the "Items" header
  const totalInBagQuantity = inBagItems.reduce((sum, item) => sum + item.quantity, 0);

  const hasCheckedItems = inBagItems.some(item => item.isChecked);
  
  const handleRemoveClick = (item: typeof itemsWithPostData[0]) => {
    showConfirmation({
      title: 'Remove Item',
      message: `Are you sure you want to remove "${item.post.title}" from your bag?`,
      onConfirm: () => removeBagItem(item.id),
      confirmText: 'Remove',
    });
  };
  
  const handleClearChecked = () => {
    showConfirmation({
      title: 'Clear Checked Items',
      message: 'Are you sure you want to remove all checked items from your bag?',
      onConfirm: () => {
           setIsClearing(true);
           clearCheckedBagItems();
           setIsClearing(false);
      },
      confirmText: 'Clear Checked',
    });
  };

  const onViewDetails = (post: DisplayablePost) => {
    openModal({ type: 'viewPost', data: post });
  };

  const handleQuantityChange = (itemId: string, value: string) => {
    setQuantityInputs(prev => ({ ...prev, [itemId]: value }));
  };

  const handleQuantityBlur = (itemId: string, currentQuantity: number) => {
      const value = quantityInputs[itemId];
      if (value === undefined) return;
      const newQuantity = parseInt(value, 10);
      if (!isNaN(newQuantity) && newQuantity > 0 && newQuantity !== currentQuantity) {
        updateBagItem(itemId, { quantity: newQuantity });
      }
      setQuantityInputs(prev => {
          const newState = { ...prev };
          delete newState[itemId];
          return newState;
      });
  };

  const handleIncrement = (itemId: string, currentQuantity: number) => {
    const inputValue = quantityInputs[itemId];
    let quantityToUse = currentQuantity;
    
    if (inputValue !== undefined && inputValue.trim() !== '') {
        const parsed = parseInt(inputValue, 10);
        if (!isNaN(parsed)) {
            quantityToUse = parsed;
        }
        // Clear input state so it reverts to controlled by props
        setQuantityInputs(prev => {
            const newState = { ...prev };
            delete newState[itemId];
            return newState;
        });
    }
    
    updateBagItem(itemId, { quantity: quantityToUse + 1 });
  };

  const handleDecrement = (itemId: string, currentQuantity: number) => {
    const inputValue = quantityInputs[itemId];
    let quantityToUse = currentQuantity;
    
    if (inputValue !== undefined && inputValue.trim() !== '') {
        const parsed = parseInt(inputValue, 10);
        if (!isNaN(parsed)) {
            quantityToUse = parsed;
        }
        setQuantityInputs(prev => {
            const newState = { ...prev };
            delete newState[itemId];
            return newState;
        });
    }
    
    if (quantityToUse > 1) {
        updateBagItem(itemId, { quantity: quantityToUse - 1 });
    }
  };

  const handleCreateListClick = () => {
    setShowCreateListForm(true);
  };

  const handleCreateListSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newListName.trim()) {
      createSavedList(newListName.trim());
      setNewListName('');
      setShowCreateListForm(false);
    }
  };

  const handleAddListToBag = (list: SavedList) => {
    showConfirmation({
      title: `Add items from "${list.name}" to bag?`,
      message: `This will copy all items from this list to your bag. The list will not be changed. Items already in your bag will have their quantity increased.`,
      onConfirm: () => addListToBag(list.id),
      confirmText: 'Add to Bag',
      confirmClassName: 'bg-red-600 text-white rounded-full hover:bg-red-700',
    });
  };
  
  const handleDeleteList = (list: SavedList) => {
    showConfirmation({
      title: `Delete list "${list.name}"?`,
      message: 'This will permanently delete the list. Any items that are only in this list will be moved to your main bag.',
      onConfirm: () => deleteListAndMoveItems(list.id),
      confirmText: 'Delete List',
    });
  };
  
  if (itemsWithPostData.length === 0) {
    return (
      <EmptyState
        icon={<ShoppingBagIcon className="[&>path]:stroke-[1]" />}
        title="Your Bag is Empty"
        description="Find something you love and add it to your bag to see it here."
        className="py-20"
      />
    );
  }

  return (
    <div className="animate-fade-in-down p-4 sm:p-6 lg:p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Bag</h1>
      
      {/* IN BAG SECTION */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-2 mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Items ({totalInBagQuantity})</h2>
          {hasCheckedItems && (
            <Button onClick={handleClearChecked} disabled={isClearing} variant="overlay-dark" size="xs" className="gap-1 text-gray-600">
              {isClearing ? <SpinnerIcon className="w-4 h-4" /> : <TrashIcon className="w-4 h-4 text-red-500" />}
              {isClearing ? 'Clearing...' : 'Clear Checked Items'}
            </Button>
          )}
        </div>

        {inBagItems.length === 0 ? (
          <EmptyState
            icon={<ShoppingBagIcon className="text-gray-300" />}
            title=""
            description="No items in your bag."
            className="py-8 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200"
          />
        ) : (
          <div className="bg-white rounded-xl overflow-hidden">
            <ul className="divide-y divide-gray-200/80">
              {inBagItems.map((item) => {
                const { id, quantity } = item;
                
                return (
                  <BagItemRow
                    key={id}
                    item={item}
                    quantityInputValue={quantityInputs[id]}
                    onQuantityChange={(val) => handleQuantityChange(id, val)}
                    onQuantityBlur={() => handleQuantityBlur(id, quantity)}
                    onIncrement={() => handleIncrement(id, quantity)}
                    onDecrement={() => handleDecrement(id, quantity)}
                    onRemove={() => handleRemoveClick(item)}
                    onViewDetails={() => onViewDetails(item.post)}
                    onToggleCheck={(checked) => updateBagItem(id, { isChecked: checked })}
                    actionButton={
                      <Button variant="overlay-dark" size="sm" onClick={() => openModal({ type: 'saveToList', data: { bagItemId: id } })}>
                        Save to list
                      </Button>
                    }
                  />
                );
              })}
            </ul>
            <div className="p-4 bg-gray-50 border-t border-gray-200/80 text-right">
              <p className="text-gray-600">Subtotal for active items:</p>
              <p className="text-2xl font-bold text-gray-800">{formatCurrency(total)}</p>
            </div>
          </div>
        )}
      </div>

      {/* SAVED LISTS SECTION */}
      <div>
        <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Lists</h2>
            <Button variant="overlay-dark" size="sm" onClick={handleCreateListClick} className="gap-2">
                <PlusIcon className="w-4 h-4" />
                Create list
            </Button>
        </div>
        
        {showCreateListForm && (
            <form onSubmit={handleCreateListSubmit} className="p-4 mb-4 bg-gray-50 rounded-xl flex items-center gap-2 animate-fade-in-down">
                <Input 
                    value={newListName}
                    onChange={(e) => setNewListName(e.target.value)}
                    placeholder="New list name..."
                    autoFocus
                    className="flex-grow"
                />
                <Button type="submit" disabled={!newListName.trim()} variant="overlay-red">Create</Button>
                <Button variant="overlay-dark" type="button" onClick={() => setShowCreateListForm(false)}>Cancel</Button>
            </form>
        )}

        {savedLists.length === 0 && !showCreateListForm ? (
            <EmptyState
                icon={<DocumentIcon className="w-12 h-12 text-gray-300" />}
                title=""
                description="Create lists to organize items you want to save."
                className="py-8 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200"
            />
        ) : (
            <Accordion type="multiple" className="w-full space-y-2">
            {savedLists.map(list => {
                const itemsInList = savedItemsByList.get(list.id) || [];
                const listTotalQuantity = itemsInList.reduce((sum, item) => sum + item.quantity, 0);
                const listTotalPrice = itemsInList.reduce((sum, item) => sum + (item.post.salePrice ?? item.post.price) * item.quantity, 0);
                
                return (
                <AccordionItem key={list.id} value={list.id} className="bg-white rounded-xl overflow-hidden">
                    <AccordionTrigger className="px-4 py-3">
                        <div className="flex flex-1 items-center justify-between mr-2">
                          <div className="flex flex-col items-start min-w-0 text-left">
                            {editingList?.id === list.id ? (
                              <input
                                type="text"
                                value={editingList.name}
                                onChange={(e) => setEditingList({ ...editingList, name: e.target.value })}
                                onBlur={() => { renameSavedList(list.id, editingList.name); setEditingList(null); }}
                                onKeyDown={(e) => { if(e.key === 'Enter') { renameSavedList(list.id, editingList.name); setEditingList(null); } }}
                                onClick={(e) => e.stopPropagation()}
                                autoFocus
                                className="text-lg font-semibold text-gray-800 bg-gray-100 rounded w-full"
                              />
                            ) : (
                              <h3 className="text-lg font-semibold text-gray-800 truncate max-w-[200px] sm:max-w-xs">{list.name}</h3>
                            )}
                            <span className="text-xs text-gray-500 font-normal mt-0.5">
                              {listTotalQuantity} item{listTotalQuantity !== 1 ? 's' : ''} • {formatCurrency(listTotalPrice)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                            <Button variant="overlay-dark" size="icon-sm" onClick={(e) => { e.stopPropagation(); setEditingList({ id: list.id, name: list.name }); }} title="Rename list"><PencilIcon className="w-4 h-4" /></Button>
                            <Button variant="overlay-dark" size="icon-sm" onClick={(e) => { e.stopPropagation(); handleDeleteList(list); }} title="Delete list"><TrashIcon className="w-5 h-5 text-gray-500" /></Button>
                            <Button variant="overlay-dark" size="sm" onClick={(e) => { e.stopPropagation(); handleAddListToBag(list); }}>Add to Bag</Button>
                          </div>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent>
                        {itemsInList.length === 0 ? (
                          <div className="px-4 py-8 text-center text-gray-500">This list is empty.</div>
                        ) : (
                          <ul className="divide-y divide-gray-200/80 border-t border-gray-200/80">
                            {itemsInList.map((item) => {
                              const { id, quantity } = item;
                              
                              return (
                                <BagItemRow
                                  key={id}
                                  item={item}
                                  quantityInputValue={quantityInputs[id]}
                                  onQuantityChange={(val) => handleQuantityChange(id, val)}
                                  onQuantityBlur={() => handleQuantityBlur(id, quantity)}
                                  onIncrement={() => handleIncrement(id, quantity)}
                                  onDecrement={() => handleDecrement(id, quantity)}
                                  onRemove={() => handleRemoveClick(item)}
                                  onViewDetails={() => onViewDetails(item.post)}
                                  actionButton={
                                    <Button variant="overlay-dark" size="sm" onClick={() => addToBag(item.post.id, item.quantity)}>
                                      Add to Bag
                                    </Button>
                                  }
                                />
                              );
                            })}
                          </ul>
                        )}
                    </AccordionContent>
                </AccordionItem>
                );
            })}
            </Accordion>
        )}
      </div>

    </div>
  );
};
