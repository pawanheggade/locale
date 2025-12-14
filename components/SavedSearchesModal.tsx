
import React, { useRef } from 'react';
import { SavedSearch } from '../types';
import ModalShell from './ModalShell';
import { StarIcon, TrashIcon, BellIcon } from './Icons';
import { Button } from './ui/Button';
import { useAuth } from '../contexts/AuthContext';
import { EmptyState } from './EmptyState';
import { ModalFooter } from './ModalFooter';

interface SavedSearchesModalProps {
  savedSearches: SavedSearch[];
  onLoad: (searchId: string) => void;
  onDelete: (searchId: string) => void;
  onClose: () => void;
}

const SavedSearchesModal: React.FC<SavedSearchesModalProps> = ({ savedSearches, onLoad, onDelete, onClose }) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const { toggleSavedSearchAlert } = useAuth();

  const renderFooter = () => (
    <ModalFooter onCancel={onClose} cancelText="Close" />
  );

  return (
    <ModalShell
      panelRef={modalRef}
      onClose={onClose}
      title="Saved Searches"
      footer={renderFooter()}
      panelClassName="w-full max-w-lg"
      titleId="saved-searches-title"
    >
      <div className="p-6">
        {savedSearches.length === 0 ? (
          <EmptyState
            icon={<StarIcon />}
            title="No Saved Searches"
            description="Save your filter combinations to quickly find what you're looking for later."
            className="py-8"
          />
        ) : (
          <ul className="space-y-3">
            {savedSearches.map((search) => (
              <li key={search.id} className="p-3 bg-gray-50 border border-gray-300 rounded-lg flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                    <span className="font-medium text-gray-900 truncate block">{search.name}</span>
                    <div className="text-xs text-gray-600 mt-1 truncate">
                        {search.filters.searchQuery ? `Query: "${search.filters.searchQuery}"` : 'No query'}
                        {search.filters.filterCategory !== 'all' ? ` • ${search.filters.filterCategory}` : ''}
                    </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button
                    variant={search.enableAlerts ? "pill-red" : "ghost"}
                    size="icon-sm"
                    onClick={() => toggleSavedSearchAlert(search.id)}
                    className={search.enableAlerts ? "text-white" : "text-gray-600"}
                    aria-label={search.enableAlerts ? "Disable alerts" : "Enable alerts"}
                    title={search.enableAlerts ? "Alerts enabled" : "Enable alerts"}
                  >
                    <BellIcon className="w-5 h-5" isFilled={!!search.enableAlerts} />
                  </Button>
                  <Button
                    onClick={() => onLoad(search.id)}
                    variant="pill-red"
                    size="sm"
                    className="px-4"
                  >
                    Show
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => onDelete(search.id)}
                    className="text-gray-600"
                    aria-label={`Delete saved search: ${search.name}`}
                  >
                    <TrashIcon className="w-5 h-5" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </ModalShell>
  );
};

export default SavedSearchesModal;
