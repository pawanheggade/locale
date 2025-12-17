import React, { createContext, useContext, useMemo, useCallback } from 'react';
import { BagItem, SavedList } from '../types';
import { useLargePersistentState } from '../hooks/useLargePersistentState';
import { useAuth } from './AuthContext';
import { STORAGE_KEYS } from '../lib/constants';

interface UserSpecificData {
    bag: BagItem[];
    savedLists: SavedList[];
    viewedPostIds: string[];
}

type AllUsersData = Record<string, UserSpecificData>;

const initialUserSpecificData: UserSpecificData = {
    bag: [],
    savedLists: [],
    viewedPostIds: [],
};

interface UserDataContextType {
  bag: BagItem[];
  savedLists: SavedList[];
  viewedPostIds: string[];
  addToBag: (postId: string, quantity: number) => void;
  updateBagItem: (itemId: string, updates: Partial<{ quantity: number; isChecked: boolean; savedListIds: string[]; }>) => void;
  saveItemToLists: (itemId: string, listIds: string[]) => void;
  removeBagItem: (itemId: string) => void;
  clearCheckedBagItems: () => void;
  createSavedList: (name: string) => void;
  renameSavedList: (listId: string, newName: string) => void;
  deleteListAndMoveItems: (listId: string) => void;
  addListToBag: (listId: string) => void;
  addPostToViewHistory: (postId: string) => void;
}

const UserDataContext = createContext<UserDataContextType | undefined>(undefined);

export const UserDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { currentAccount } = useAuth();
    const currentAccountId = currentAccount?.id;

    const [allUsersData, setAllUsersData] = useLargePersistentState<AllUsersData>(STORAGE_KEYS.USER_DATA, {});
    
    const currentUserData = useMemo(() => {
        if (currentAccountId && allUsersData[currentAccountId]) {
            return allUsersData[currentAccountId];
        }
        return initialUserSpecificData;
    }, [currentAccountId, allUsersData]);

    const updateCurrentUserSpecificData = useCallback((updates: Partial<UserSpecificData>) => {
        if (!currentAccountId) return;
        setAllUsersData(prev => ({
            ...prev,
            [currentAccountId]: {
                ...(prev[currentAccountId] || initialUserSpecificData),
                ...updates,
            }
        }));
    }, [currentAccountId, setAllUsersData]);

    const addToBag = useCallback((postId: string, quantity: number) => {
        if (!currentAccountId) return;
        const existingInBagItem = currentUserData.bag.find(item => item.postId === postId && item.savedListIds.length === 0);
        if (existingInBagItem) {
            const newBag = currentUserData.bag.map(item => item.id === existingInBagItem.id ? { ...item, quantity: item.quantity + quantity } : item);
            updateCurrentUserSpecificData({ bag: newBag });
        } else {
            const newItem: BagItem = { id: `bag-${Date.now()}`, postId, quantity, isChecked: false, savedListIds: [] };
            updateCurrentUserSpecificData({ bag: [...currentUserData.bag, newItem] });
        }
    }, [currentAccountId, currentUserData.bag, updateCurrentUserSpecificData]);

    const updateBagItem = useCallback((itemId: string, updates: Partial<{ quantity: number; isChecked: boolean; savedListIds: string[] }>) => {
        const newBag = currentUserData.bag.map(item => item.id === itemId ? { ...item, ...updates } : item);
        updateCurrentUserSpecificData({ bag: newBag });
    }, [currentUserData.bag, updateCurrentUserSpecificData]);

    const saveItemToLists = useCallback((itemId: string, targetListIds: string[]) => {
        if (!currentAccountId) return;
        const currentBag = currentUserData.bag;
        const itemToSave = currentBag.find(i => i.id === itemId);
        if (!itemToSave) return;
        
        const otherItems = currentBag.filter(i => i.postId === itemToSave.postId && i.id !== itemId);
        const quantityUpdates = new Map<string, number>();
        let itemToSaveShouldBeRemoved = false;
        let itemToSaveNewLists = [...targetListIds];

        if (targetListIds.length === 0) {
            const existingMainItem = otherItems.find(i => i.savedListIds.length === 0);
            if (existingMainItem) {
                quantityUpdates.set(existingMainItem.id, existingMainItem.quantity + itemToSave.quantity);
                itemToSaveShouldBeRemoved = true;
            } else {
                itemToSaveNewLists = [];
            }
        } else {
            const remainingTargetLists = new Set(targetListIds);
            otherItems.forEach(otherItem => {
                const intersection = otherItem.savedListIds.filter(id => remainingTargetLists.has(id));
                if (intersection.length > 0) {
                    quantityUpdates.set(otherItem.id, otherItem.quantity + itemToSave.quantity);
                    intersection.forEach(id => remainingTargetLists.delete(id));
                }
            });
            if (remainingTargetLists.size === 0) {
                itemToSaveShouldBeRemoved = true;
            } else {
                itemToSaveNewLists = Array.from(remainingTargetLists);
            }
        }
        
        let newBag = currentBag.map(item => {
             if (quantityUpdates.has(item.id)) {
                 return { ...item, quantity: quantityUpdates.get(item.id)! };
             }
             return item;
        });
        
        if (itemToSaveShouldBeRemoved) {
            newBag = newBag.filter(item => item.id !== itemId);
        } else {
            newBag = newBag.map(item => item.id === itemId ? { ...item, savedListIds: itemToSaveNewLists, isChecked: false } : item);
        }
        
         updateCurrentUserSpecificData({ bag: newBag });
    }, [currentAccountId, currentUserData.bag, updateCurrentUserSpecificData]);

    const removeBagItem = useCallback((itemId: string) => {
        updateCurrentUserSpecificData({ bag: currentUserData.bag.filter(item => item.id !== itemId) });
    }, [currentUserData.bag, updateCurrentUserSpecificData]);

    const clearCheckedBagItems = useCallback(() => {
        updateCurrentUserSpecificData({ bag: currentUserData.bag.filter(item => !(item.isChecked && item.savedListIds.length === 0)) });
    }, [currentUserData.bag, updateCurrentUserSpecificData]);
    
    const createSavedList = useCallback((name: string) => {
        if (!currentAccountId) return;
        const newList: SavedList = { id: `list-${Date.now()}`, name: name.trim() };
        updateCurrentUserSpecificData({ savedLists: [...currentUserData.savedLists, newList] });
    }, [currentAccountId, currentUserData.savedLists, updateCurrentUserSpecificData]);

    const renameSavedList = useCallback((listId: string, newName: string) => {
        const newLists = currentUserData.savedLists.map(list => list.id === listId ? { ...list, name: newName.trim() } : list);
        updateCurrentUserSpecificData({ savedLists: newLists });
    }, [currentUserData.savedLists, updateCurrentUserSpecificData]);

    const deleteListAndMoveItems = useCallback((listId: string) => {
        const itemsWithListRemoved = currentUserData.bag.map(item => ({ ...item, savedListIds: item.savedListIds.filter(id => id !== listId) }));
        const itemsByPostId = new Map<string, BagItem[]>();
        itemsWithListRemoved.forEach(item => {
            const existing = itemsByPostId.get(item.postId) || [];
            existing.push(item);
            itemsByPostId.set(item.postId, existing);
        });
        const finalBag: BagItem[] = [];
        itemsByPostId.forEach((items) => {
            const mainBagCandidates = items.filter(i => i.savedListIds.length === 0);
            const stillSavedItems = items.filter(i => i.savedListIds.length > 0);
            stillSavedItems.forEach(item => finalBag.push(item));
            if (mainBagCandidates.length > 0) {
                const totalQuantity = mainBagCandidates.reduce((sum, i) => sum + i.quantity, 0);
                const isAnyChecked = mainBagCandidates.some(i => i.isChecked);
                const baseItem = mainBagCandidates[0];
                finalBag.push({ ...baseItem, quantity: totalQuantity, isChecked: isAnyChecked });
            }
        });
        const newLists = currentUserData.savedLists.filter(list => list.id !== listId);
        updateCurrentUserSpecificData({ bag: finalBag, savedLists: newLists });
    }, [currentUserData.bag, currentUserData.savedLists, updateCurrentUserSpecificData]);

    const addListToBag = useCallback((listId: string) => {
        if (!currentAccountId) return;
        const list = currentUserData.savedLists.find(l => l.id === listId);
        if (!list) return;
        const itemsFromList = currentUserData.bag.filter(item => item.savedListIds.includes(listId));
        if (itemsFromList.length === 0) {
            return;
        }
        let bagUpdates = [...currentUserData.bag];
        let itemsAddedCount = 0;
        itemsFromList.forEach(itemFromList => {
            const existingInBagItem = bagUpdates.find(bagItem => bagItem.postId === itemFromList.postId && bagItem.savedListIds.length === 0);
            if (existingInBagItem) {
                bagUpdates = bagUpdates.map(bagItem => bagItem.id === existingInBagItem.id ? { ...bagItem, quantity: bagItem.quantity + itemFromList.quantity } : bagItem);
            } else {
                const newItemForBag: BagItem = { id: `bag-${Date.now()}-${itemFromList.postId}-${Math.random()}`, postId: itemFromList.postId, quantity: itemFromList.quantity, isChecked: false, savedListIds: [] };
                bagUpdates.push(newItemForBag);
            }
            itemsAddedCount++;
        });
        updateCurrentUserSpecificData({ bag: bagUpdates });
    }, [currentAccountId, currentUserData.bag, currentUserData.savedLists, updateCurrentUserSpecificData]);

    const addPostToViewHistory = useCallback((postId: string) => {
        if (!currentAccountId) return;
        const currentHistory = currentUserData.viewedPostIds || [];
        const newHistory = [postId, ...currentHistory.filter(id => id !== postId)].slice(0, 50);
        updateCurrentUserSpecificData({ viewedPostIds: newHistory });
    }, [currentAccountId, currentUserData.viewedPostIds, updateCurrentUserSpecificData]);

    const value: UserDataContextType = useMemo(() => ({
        bag: currentUserData.bag, 
        savedLists: currentUserData.savedLists, 
        viewedPostIds: currentUserData.viewedPostIds,
        addToBag, 
        updateBagItem, 
        saveItemToLists, 
        removeBagItem, 
        clearCheckedBagItems, 
        createSavedList, 
        renameSavedList, 
        deleteListAndMoveItems, 
        addListToBag,
        addPostToViewHistory,
    }), [
        currentUserData,
        addToBag, 
        updateBagItem, 
        saveItemToLists, 
        removeBagItem, 
        clearCheckedBagItems, 
        createSavedList, 
        renameSavedList, 
        deleteListAndMoveItems, 
        addListToBag,
        addPostToViewHistory,
    ]);

    return (
        <UserDataContext.Provider value={value}>
            {children}
        </UserDataContext.Provider>
    );
};

export const useUserData = () => {
    const context = useContext(UserDataContext);
    if (context === undefined) {
        throw new Error('useUserData must be used within a UserDataProvider');
    }
    return context;
};
