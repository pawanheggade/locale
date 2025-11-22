
import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import ModalShell from './ModalShell';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { PlusIcon } from './Icons';

interface SaveToListModalProps {
  bagItemId: string;
  onClose: () => void;
}

const SaveToListModal: React.FC<SaveToListModalProps> = ({ bagItemId, onClose }) => {
  const { bag, savedLists, createSavedList, saveItemToLists } = useAuth();
  const modalRef = useRef<HTMLDivElement>(null);
  
  const itemToSave = bag.find(item => item.id === bagItemId);
  const [selectedListIds, setSelectedListIds] = useState<string[]>(itemToSave?.savedListIds || []);
  
  const [newListName, setNewListName] = useState('');
  const [showNewListForm, setShowNewListForm] = useState(false);

  useEffect(() => {
    if (itemToSave) {
      setSelectedListIds(itemToSave.savedListIds);
    }
  }, [itemToSave]);

  const handleToggleList = (listId: string) => {
    setSelectedListIds(prev =>
      prev.includes(listId) ? prev.filter(id => id !== listId) : [...prev, listId]
    );
  };

  const handleDone = () => {
    if (itemToSave) {
      saveItemToLists(itemToSave.id, selectedListIds);
    }
    onClose();
  };

  const handleCreateList = (e: React.FormEvent) => {
    e.preventDefault();
    if (newListName.trim()) {
      createSavedList(newListName.trim());
      setNewListName('');
      setShowNewListForm(false);
    }
  };
  
  const renderFooter = () => (
    <>
      <Button variant="glass" onClick={onClose} className="mr-auto">Cancel</Button>
      <Button onClick={handleDone} variant="glass-red">Done</Button>
    </>
  );

  return (
    <ModalShell
      panelRef={modalRef}
      onClose={onClose}
      title="Save to a List"
      footer={renderFooter()}
      panelClassName="w-full max-w-md"
      titleId="save-to-list-title"
    >
      <div className="p-6 space-y-4">
        {savedLists.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm text-gray-600">Select one or more lists to save this item to. Uncheck all to move it back to your bag.</p>
            {savedLists.map(list => (
              <div key={list.id} className="flex items-center p-3 rounded-lg hover:bg-gray-100 cursor-pointer" onClick={() => handleToggleList(list.id)}>
                <input
                  type="checkbox"
                  id={`list-checkbox-${list.id}`}
                  checked={selectedListIds.includes(list.id)}
                  onChange={() => {}} // click is handled by parent div
                  className="h-5 w-5 rounded border-gray-300 text-red-600 focus:ring-red-500"
                />
                <label htmlFor={`list-checkbox-${list.id}`} className="ml-3 text-sm font-medium text-gray-800 cursor-pointer">
                  {list.name}
                </label>
              </div>
            ))}
          </div>
        )}

        {showNewListForm ? (
          <form onSubmit={handleCreateList} className="space-y-2 pt-2 border-t">
            <Input
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              placeholder="New list name..."
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <Button variant="glass" type="button" onClick={() => setShowNewListForm(false)}>Cancel</Button>
              <Button type="submit" disabled={!newListName.trim()} variant="glass-red">Create</Button>
            </div>
          </form>
        ) : (
          <Button
            variant="glass"
            onClick={() => setShowNewListForm(true)}
            className="w-full justify-start gap-2"
          >
            <PlusIcon className="w-5 h-5" />
            Create list
          </Button>
        )}
      </div>
    </ModalShell>
  );
};

export default SaveToListModal;
