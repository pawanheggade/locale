
import React, { createContext, useContext, useMemo, useCallback } from 'react';
import { Account, Subscription, BagItem, SavedList, CatalogItem, SavedSearch, Post, Report, Feedback, ForumPost, ForumComment, ConfirmationModalData } from '../types';
import { usePersistentState } from '../hooks/usePersistentState';
import { useLargePersistentState } from '../hooks/useLargePersistentState';
import { useUI } from './UIContext';
import { mockAccounts } from '../data/accounts';
import { fileToDataUrl } from '../utils/media';
import { initialTermsContent, initialPrivacyContent } from '../data/pageContent';
import { STORAGE_KEYS } from '../lib/constants';

const APPROX_MONTH_MS = 30 * 24 * 60 * 60 * 1000;

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

interface AuthContextType {
  accounts: Account[];
  currentAccount: Account | null;
  accountsById: Map<string, Account>;
  likedPostIds: Set<string>;
  login: (account: Account, rememberMe: boolean) => void;
  signOut: () => void;
  socialLogin: (provider: 'google' | 'apple') => void;
  createAccount: (newAccountData: Omit<Account, 'id' | 'joinDate' | 'role' | 'status' | 'subscription' | 'likedAccountIds' | 'referralCode'>, isSeller: boolean, referralCode?: string) => Promise<Account>;
  updateAccount: (updatedAccount: Account) => Promise<void>;
  updateAccountDetails: (updatedAccount: Account) => void;
  upgradeToSeller: (accountId: string, sellerData: Partial<Account>, newTier: Subscription['tier']) => Promise<void>;
  toggleLikeAccount: (accountId: string) => void;
  toggleLikePost: (postId: string) => { wasLiked: boolean };
  updateSubscription: (accountId: string, tier: Subscription['tier']) => void;
  toggleAccountStatus: (accountId: string, byAdmin?: boolean) => void;
  deleteAccount: (accountId: string) => void;
  updateAccountRole: (accountId: string, role: 'account' | 'admin') => void;
  approveAccount: (accountId: string) => void;
  rejectAccount: (accountId: string) => void;
  
  bag: BagItem[];
  savedLists: SavedList[];
  viewedPostIds: string[];
  addToBag: (postId: string, quantity: number) => void;
  updateBagItem: (itemId: string, updates: Partial<Pick<BagItem, 'quantity' | 'isChecked' | 'savedListIds'>>) => void;
  saveItemToLists: (itemId: string, listIds: string[]) => void;
  removeBagItem: (itemId: string) => void;
  clearCheckedBagItems: () => void;
  createSavedList: (name: string) => void;
  renameSavedList: (listId: string, newName: string) => void;
  deleteListAndMoveItems: (listId: string) => void;
  addListToBag: (listId: string) => void;
  
  addPostToViewHistory: (postId: string) => void;
  addCatalogItems: (files: File[]) => Promise<void>;
  removeCatalogItem: (itemId: string) => Promise<void>;
  
  savedSearches: SavedSearch[];
  addSavedSearch: (search: SavedSearch) => void;
  deleteSavedSearch: (searchId: string) => void;
  toggleSavedSearchAlert: (searchId: string) => void;

  // Admin & Global Data
  reports: Report[];
  addReport: (postId: string, reason: string) => void;
  addForumReport: (item: ForumPost | ForumComment, type: 'post' | 'comment', reason: string) => void;
  setReports: React.Dispatch<React.SetStateAction<Report[]>>; 
  
  feedbackList: Feedback[];
  addFeedback: (content: string) => void;
  setFeedbackList: React.Dispatch<React.SetStateAction<Feedback[]>>;

  termsContent: string;
  setTermsContent: React.Dispatch<React.SetStateAction<string>>;
  privacyContent: string;
  setPrivacyContent: React.Dispatch<React.SetStateAction<string>>;

  incrementProfileViews: (accountId: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { addToast, openModal } = useUI();

    const [accounts, setAccounts] = useLargePersistentState<Account[]>(STORAGE_KEYS.ACCOUNTS, mockAccounts);
    const [currentAccountId, setCurrentAccountId] = usePersistentState<string | null>(STORAGE_KEYS.CURRENT_ACCOUNT_ID, null);
    const [savedSearches, setSavedSearches] = usePersistentState<SavedSearch[]>(STORAGE_KEYS.RECENT_SEARCHES, []);
    const [allUsersData, setAllUsersData] = useLargePersistentState<AllUsersData>(STORAGE_KEYS.USER_DATA, {});
    
    // Global/Admin Data
    const [reports, setReports] = usePersistentState<Report[]>(STORAGE_KEYS.REPORTS, []);
    const [feedbackList, setFeedbackList] = usePersistentState<Feedback[]>(STORAGE_KEYS.FEEDBACK, []);
    const [termsContent, setTermsContent] = usePersistentState<string>(STORAGE_KEYS.TERMS, initialTermsContent);
    const [privacyContent, setPrivacyContent] = usePersistentState<string>(STORAGE_KEYS.PRIVACY, initialPrivacyContent);

    const currentAccount = useMemo(() => {
        if (!currentAccountId) return null;
        const account = accounts.find(u => u.id === currentAccountId);
        if (account && (account.status === 'active' || account.status === 'pending' || account.role === 'admin')) {
          return account;
        }
        if (account && (account.status === 'archived' || account.status === 'rejected')) {
            setCurrentAccountId(null);
            return null;
        }
        return null;
    }, [accounts, currentAccountId, setCurrentAccountId]);
    
    const accountsById = useMemo(() => new Map(accounts.map(account => [account.id, account])), [accounts]);
    const likedPostIds = useMemo(() => new Set(currentAccount?.likedPostIds || []), [currentAccount]);
    
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

    const showConfirmation = useCallback((data: ConfirmationModalData) => {
        openModal({ type: 'confirmation', data });
    }, [openModal]);
    
    const addReport = useCallback((postId: string, reason: string) => {
        if (!currentAccount) return;
        const newReport: Report = { 
            id: `report-${Date.now()}`, 
            postId, 
            reason, 
            timestamp: Date.now(), 
            reporterId: currentAccount.id 
        };
        setReports(prev => [newReport, ...prev]);
        addToast('Report submitted.', 'success');
    }, [currentAccount, setReports, addToast]);

    const addForumReport = useCallback((item: ForumPost | ForumComment, type: 'post' | 'comment', reason: string) => {
        if (!currentAccount) return;
        const newReport: Report = {
          id: `report-${Date.now()}`,
          reason,
          timestamp: Date.now(),
          reporterId: currentAccount.id,
          forumPostId: type === 'post' ? item.id : ('postId' in item ? item.postId : undefined),
          forumCommentId: type === 'comment' ? item.id : undefined,
        };
        setReports(prev => [newReport, ...prev]);
        addToast('Report submitted.', 'success');
    }, [currentAccount, setReports, addToast]);

    const addFeedback = useCallback((content: string) => {
        if (!currentAccount) return;
        const newFeedback: Feedback = {
            id: `feedback-${Date.now()}`,
            userId: currentAccount.id,
            content,
            timestamp: Date.now(),
            isRead: false,
        };
        setFeedbackList(prev => [newFeedback, ...prev]);
        addToast('Feedback sent! Thank you.', 'success');
    }, [currentAccount, setFeedbackList, addToast]);

    const login = useCallback((account: Account, rememberMe: boolean) => {
        if (account.status === 'archived' && !account.archivedByAdmin) {
             setAccounts(prev => prev.map(a => a.id === account.id ? { ...a, status: 'active', archivedByAdmin: false } : a));
             addToast('Welcome back! Your account has been reactivated.', 'success');
        }

        setCurrentAccountId(account.id);
        if (!rememberMe) {
            localStorage.removeItem(STORAGE_KEYS.CURRENT_ACCOUNT_ID);
        }
    }, [setCurrentAccountId, setAccounts, addToast]);

    const signOut = useCallback(() => {
        setCurrentAccountId(null);
    }, [setCurrentAccountId]);
    
    const createAccount = useCallback(async (newAccountData: Omit<Account, 'id' | 'joinDate' | 'role' | 'status' | 'subscription' | 'likedAccountIds' | 'referralCode'>, isSeller: boolean, referralCode?: string): Promise<Account> => {
        const generatedReferralCode = (newAccountData.username.substring(0, 5) + Date.now().toString().slice(-4)).toUpperCase();

        const newAccount: Account = {
            ...newAccountData,
            id: `user-${Date.now()}`,
            joinDate: Date.now(),
            role: 'account',
            status: isSeller ? 'pending' : 'active',
            subscription: {
                tier: isSeller ? 'Basic' : 'Personal',
                renewalDate: null,
                isTrial: false,
                trialEndDate: null,
            },
            likedAccountIds: [],
            likedPostIds: [],
            referralCode: generatedReferralCode,
            referralCount: 0,
        };

        if (referralCode?.trim()) {
            const referrer = accounts.find(acc => acc.referralCode.toLowerCase() === referralCode.trim().toLowerCase());
            if (referrer) {
                newAccount.referredBy = referrer.referralCode;
                if (isSeller) {
                    setAccounts(prev => prev.map(acc => {
                        if (acc.id === referrer.id) {
                            const newReferralCount = (acc.referralCount || 0) + 1;
                            const THREE_MONTHS_MS = 3 * APPROX_MONTH_MS;
                            const currentRenewal = (acc.subscription.renewalDate && acc.subscription.renewalDate > Date.now()) ? acc.subscription.renewalDate : Date.now();
                            const newRenewalDate = acc.subscription.tier === 'Business' ? currentRenewal + THREE_MONTHS_MS : Date.now() + THREE_MONTHS_MS;

                            const newSubscription: Subscription = {
                                tier: 'Business',
                                renewalDate: newRenewalDate,
                                isTrial: false,
                                trialEndDate: null,
                            };
                            
                            return { ...acc, referralCount: newReferralCount, subscription: newSubscription };
                        }
                        return acc;
                    }));
                    addToast(`Referral successful! ${referrer.name} has received a subscription bonus.`, 'success');
                } else {
                    addToast('Referral code applied. Your friend will receive a bonus if you become a seller.', 'success');
                }
            } else {
                addToast('Invalid referral code entered.', 'error');
            }
        }
        
        setAccounts(prev => [...prev, newAccount]);

        if (isSeller) {
          addToast('Seller account created! It is now under review.', 'success');
        } else {
          addToast(`Welcome, ${newAccount.name}! Your account has been created.`, 'success');
        }
        login(newAccount, true);

        return newAccount;
    }, [accounts, setAccounts, addToast, login]);

    const socialLogin = useCallback(async (provider: 'google' | 'apple') => {
        const mockUser = provider === 'google' ? { email: 'google.user@example.com', name: 'Google User', username: 'google_user', avatarUrl: 'https://i.pravatar.cc/150?u=google-user' } : { email: 'apple.user@example.com', name: 'Apple User', username: 'apple_user', avatarUrl: 'https://i.pravatar.cc/150?u=apple-user' };
        let userAccount = accounts.find(acc => acc.email.toLowerCase() === mockUser.email);
        if (!userAccount) {
            userAccount = await createAccount({ ...mockUser, password: 'social_login_mock_password' }, false);
        }
        login(userAccount, true);
    }, [accounts, createAccount, login]);

    const updateAccount = useCallback(async (updatedAccount: Account) => {
        setAccounts(prev => prev.map(acc => acc.id === updatedAccount.id ? updatedAccount : acc));
        addToast('Account updated successfully!', 'success');
    }, [setAccounts, addToast]);

    const updateAccountDetails = useCallback((updatedAccount: Account) => {
        setAccounts(prev => prev.map(acc => acc.id === updatedAccount.id ? updatedAccount : acc));
    }, [setAccounts]);

    const upgradeToSeller = useCallback(async (accountId: string, sellerData: Partial<Account>, newTier: Subscription['tier']) => {
        setAccounts(prev => prev.map(acc => {
            if (acc.id === accountId) {
                const updatedAccount = { ...acc, ...sellerData, status: 'pending' as const };
                let subscription: Subscription;

                if (newTier === 'Verified' || newTier === 'Business') {
                    const trialEndDate = Date.now() + 14 * 24 * 60 * 60 * 1000;
                    subscription = { tier: newTier, renewalDate: trialEndDate, isTrial: true, trialEndDate };
                    addToast(`You've started a 14-day free trial of the ${newTier} plan! Your account is now under review.`, 'success');
                } else { 
                    subscription = { tier: 'Basic', renewalDate: null, isTrial: false, trialEndDate: null };
                    addToast(`Your account has been upgraded to Basic and is now under review.`, 'success');
                }
                
                return { ...updatedAccount, subscription };
            }
            return acc;
        }));
    }, [setAccounts, addToast]);
      
    const toggleLikeAccount = useCallback((accountIdToLike: string) => {
        const loggedInAccount = accounts.find(a => a.id === currentAccountId);
        const targetAccount = accounts.find(a => a.id === accountIdToLike);
        if (!loggedInAccount || !targetAccount) return;
        const wasLiked = (loggedInAccount.likedAccountIds || []).includes(accountIdToLike);
        setAccounts(prev => prev.map(acc => {
            if (acc.id === loggedInAccount.id) {
                return { ...acc, likedAccountIds: wasLiked ? (acc.likedAccountIds || []).filter(id => id !== accountIdToLike) : [...(acc.likedAccountIds || []), accountIdToLike] };
            }
            if (acc.id === accountIdToLike) {
                return { ...acc, likeCount: wasLiked ? Math.max(0, (acc.likeCount || 0) - 1) : (acc.likeCount || 0) + 1 };
            }
            return acc;
        }));
        addToast(wasLiked ? `Unliked profile: ${targetAccount.name}.` : `Liked profile: ${targetAccount.name}!`);
    }, [accounts, currentAccountId, addToast, setAccounts]);

    const toggleLikePost = useCallback((postId: string): { wasLiked: boolean } => {
        const loggedInAccount = accounts.find(a => a.id === currentAccountId);
        if (!loggedInAccount) return { wasLiked: false };
        const wasLiked = (loggedInAccount.likedPostIds || []).includes(postId);
        setAccounts(prev => prev.map(acc => {
            if (acc.id === loggedInAccount.id) {
                const newLikes = wasLiked
                    ? (acc.likedPostIds || []).filter(id => id !== postId)
                    : [...(acc.likedPostIds || []), postId];
                return { ...acc, likedPostIds: newLikes };
            }
            return acc;
        }));
        addToast(wasLiked ? 'Post unliked.' : 'Post liked!');
        return { wasLiked: !wasLiked };
    }, [accounts, currentAccountId, setAccounts, addToast]);

    const updateSubscription = useCallback((accountId: string, tier: Subscription['tier']) => {
        setAccounts(prev => prev.map(acc => {
            if (acc.id === accountId) {
                const newSubscription: Subscription = {
                    tier: tier,
                    isTrial: false,
                    trialEndDate: null,
                    renewalDate: tier === 'Personal' || tier === 'Basic' ? null : Date.now() + APPROX_MONTH_MS,
                };
                return { ...acc, subscription: newSubscription };
            }
            return acc;
        }));
        addToast('Subscription updated.', 'success');
    }, [setAccounts, addToast]);

    const toggleAccountStatus = useCallback((accountId: string, byAdmin: boolean = false) => {
        setAccounts(prev => prev.map(acc => {
            if (acc.id === accountId) {
                const newStatus = acc.status === 'active' ? 'archived' : 'active';
                addToast(`Account ${newStatus}.`, 'success');
                
                const updates: Partial<Account> = { status: newStatus };
                if (newStatus === 'archived') {
                    updates.archivedByAdmin = byAdmin;
                } else {
                    updates.archivedByAdmin = false; 
                }
                return { ...acc, ...updates };
            }
            return acc;
        }));
    }, [setAccounts, addToast]);

    const deleteAccount = useCallback((accountId: string) => {
        showConfirmation({
            title: 'Delete Account',
            message: 'Are you sure you want to permanently delete this account? This action cannot be undone.',
            onConfirm: () => {
                setAccounts(prev => prev.filter(acc => acc.id !== accountId));
                if (accountId === currentAccountId) {
                    signOut();
                }
                addToast('Account deleted.', 'success');
            },
            confirmText: 'Delete Permanently',
        });
    }, [setAccounts, currentAccountId, signOut, addToast, showConfirmation]);

    const updateAccountRole = useCallback((accountId: string, role: 'account' | 'admin') => {
        setAccounts(prev => prev.map(acc => acc.id === accountId ? { ...acc, role } : acc));
        addToast("Account role updated.", "success");
    }, [setAccounts, addToast]);

    const approveAccount = useCallback((accountId: string) => {
        setAccounts(prev => prev.map(acc => {
            if (acc.id === accountId && acc.status === 'pending') {
                return { ...acc, status: 'active' };
            }
            return acc;
        }));
        addToast("Account approved.", "success");
    }, [setAccounts, addToast]);

    const rejectAccount = useCallback((accountId: string) => {
        setAccounts(prev => prev.map(acc => {
            if (acc.id === accountId && acc.status === 'pending') {
                return { ...acc, status: 'rejected' };
            }
            return acc;
        }));
        addToast("Account rejected.", "success");
    }, [setAccounts, addToast]);

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
        addToast('Item added to bag.', 'success');
    }, [currentAccountId, currentUserData.bag, updateCurrentUserSpecificData, addToast]);

    const updateBagItem = useCallback((itemId: string, updates: Partial<Pick<BagItem, 'quantity' | 'isChecked' | 'savedListIds'>>) => {
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
         addToast(targetListIds.length > 0 ? 'Saved to list(s).' : 'Moved to bag.', 'success');
    }, [currentAccountId, currentUserData.bag, updateCurrentUserSpecificData, addToast]);

    const removeBagItem = useCallback((itemId: string) => {
        updateCurrentUserSpecificData({ bag: currentUserData.bag.filter(item => item.id !== itemId) });
        addToast('Item removed from bag.', 'success');
    }, [currentUserData.bag, updateCurrentUserSpecificData, addToast]);

    const clearCheckedBagItems = useCallback(() => {
        updateCurrentUserSpecificData({ bag: currentUserData.bag.filter(item => !(item.isChecked && item.savedListIds.length === 0)) });
        addToast('Checked items cleared.', 'success');
    }, [currentUserData.bag, updateCurrentUserSpecificData, addToast]);
    
    const createSavedList = useCallback((name: string) => {
        if (!currentAccountId) return;
        const newList: SavedList = { id: `list-${Date.now()}`, name: name.trim() };
        updateCurrentUserSpecificData({ savedLists: [...currentUserData.savedLists, newList] });
        addToast(`List "${newList.name}" created.`, 'success');
    }, [currentAccountId, currentUserData.savedLists, updateCurrentUserSpecificData, addToast]);

    const renameSavedList = useCallback((listId: string, newName: string) => {
        const newLists = currentUserData.savedLists.map(list => list.id === listId ? { ...list, name: newName.trim() } : list);
        updateCurrentUserSpecificData({ savedLists: newLists });
        addToast(`List renamed to "${newName.trim()}".`, 'success');
    }, [currentUserData.savedLists, updateCurrentUserSpecificData, addToast]);

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
        addToast('List deleted and its items moved to bag.', 'success');
    }, [currentUserData.bag, currentUserData.savedLists, updateCurrentUserSpecificData, addToast]);

    const addListToBag = useCallback((listId: string) => {
        if (!currentAccountId) return;
        const list = currentUserData.savedLists.find(l => l.id === listId);
        if (!list) return;
        const itemsFromList = currentUserData.bag.filter(item => item.savedListIds.includes(listId));
        if (itemsFromList.length === 0) {
            addToast(`List "${list.name}" is empty.`, 'error');
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
        addToast(`${itemsAddedCount} item(s) from "${list.name}" added to bag.`, 'success');
    }, [currentAccountId, currentUserData.bag, currentUserData.savedLists, updateCurrentUserSpecificData, addToast]);

    const addPostToViewHistory = useCallback((postId: string) => {
        if (!currentAccountId) return;
        const currentHistory = currentUserData.viewedPostIds || [];
        const newHistory = [postId, ...currentHistory.filter(id => id !== postId)].slice(0, 50);
        updateCurrentUserSpecificData({ viewedPostIds: newHistory });
    }, [currentAccountId, currentUserData.viewedPostIds, updateCurrentUserSpecificData]);

    const addCatalogItems = useCallback(async (files: File[]) => {
        if (!currentAccountId || !currentAccount) return;
        const newItems: CatalogItem[] = [];
        for (const file of files) {
            try {
                const url = await fileToDataUrl(file);
                const type = file.type === 'application/pdf' ? 'pdf' : 'image';
                newItems.push({ id: `cat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, url, type, name: file.name });
            } catch (error) {
                console.error(`Failed to process file ${file.name}`, error);
                addToast(`Failed to process ${file.name}`, 'error');
            }
        }
        if (newItems.length > 0) {
            const updatedCatalog = [...(currentAccount.catalog || []), ...newItems];
            setAccounts(prev => prev.map(acc => acc.id === currentAccountId ? { ...acc, catalog: updatedCatalog } : acc));
            addToast(`${newItems.length} item(s) added to catalogs.`, 'success');
        }
    }, [currentAccountId, currentAccount, setAccounts, addToast]);

    const removeCatalogItem = useCallback(async (itemId: string) => {
         if (!currentAccountId || !currentAccount) return;
         const updatedCatalog = (currentAccount.catalog || []).filter(item => item.id !== itemId);
         setAccounts(prev => prev.map(acc => acc.id === currentAccountId ? { ...acc, catalog: updatedCatalog } : acc));
         addToast('Catalog item removed.', 'success');
    }, [currentAccountId, currentAccount, setAccounts, addToast]);
    
    const toggleSavedSearchAlert = useCallback((searchId: string) => {
        setSavedSearches(prev => prev.map(search => search.id === searchId ? { ...search, enableAlerts: !search.enableAlerts } : search));
    }, [setSavedSearches]);

    const addSavedSearch = useCallback((search: SavedSearch) => {
        setSavedSearches(prev => [...prev, search]);
    }, [setSavedSearches]);

    const deleteSavedSearch = useCallback((searchId: string) => {
        setSavedSearches(prev => prev.filter(s => s.id !== searchId));
    }, [setSavedSearches]);

    const incrementProfileViews = useCallback((accountId: string) => {
        setAccounts(prev => prev.map(acc => {
            if (acc.id === accountId) {
                return { ...acc, profileViews: (acc.profileViews || 0) + 1 };
            }
            return acc;
        }));
    }, [setAccounts]);

    const value = useMemo(() => ({
        accounts, currentAccount, accountsById, likedPostIds, login, signOut, socialLogin, createAccount, updateAccount, updateAccountDetails, upgradeToSeller, toggleLikeAccount, toggleLikePost, updateSubscription, toggleAccountStatus, deleteAccount, updateAccountRole, approveAccount, rejectAccount,
        bag: currentUserData.bag, savedLists: currentUserData.savedLists, viewedPostIds: currentUserData.viewedPostIds,
        addToBag, updateBagItem, saveItemToLists, removeBagItem, clearCheckedBagItems, createSavedList, renameSavedList, deleteListAndMoveItems, addListToBag, addPostToViewHistory, addCatalogItems, removeCatalogItem,
        savedSearches, addSavedSearch, deleteSavedSearch, toggleSavedSearchAlert,
        reports, addReport, addForumReport, setReports,
        feedbackList, addFeedback, setFeedbackList,
        termsContent, setTermsContent,
        privacyContent, setPrivacyContent,
        incrementProfileViews
    }), [
        accounts, currentAccount, accountsById, likedPostIds, login, signOut, socialLogin, createAccount, updateAccount, updateAccountDetails, upgradeToSeller, toggleLikeAccount, toggleLikePost, updateSubscription, toggleAccountStatus, deleteAccount, updateAccountRole, approveAccount, rejectAccount,
        currentUserData,
        addToBag, updateBagItem, saveItemToLists, removeBagItem, clearCheckedBagItems, createSavedList, renameSavedList, deleteListAndMoveItems, addListToBag, addPostToViewHistory, addCatalogItems, removeCatalogItem,
        savedSearches, addSavedSearch, deleteSavedSearch, toggleSavedSearchAlert,
        reports, addReport, addForumReport, setReports, feedbackList, addFeedback, setFeedbackList, termsContent, setTermsContent, privacyContent, setPrivacyContent, incrementProfileViews
    ]);

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
