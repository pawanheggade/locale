
import React, { createContext, useContext, useMemo, useCallback } from 'react';
import { Account, Subscription, BagItem, PriceAlert, Notification, SavedList, CatalogItem, SavedSearch, Post, AvailabilityAlert, Report, Feedback, ForumPost, ForumComment, FiltersState } from '../types';
import { usePersistentState } from '../hooks/usePersistentState';
import { useLargePersistentState } from '../hooks/useLargePersistentState';
import { useUI } from './UIContext';
import { mockAccounts } from '../data/accounts';
import { fileToDataUrl } from '../utils/media';
import { applyFiltersToPosts, getPostStatus } from '../utils/posts';
import { initialTermsContent, initialPrivacyContent } from '../data/pageContent';
import { initialFiltersState } from './FiltersContext';

const ACCOUNTS_KEY = 'localeAppAccounts';
const CURRENT_ACCOUNT_ID_KEY = 'localeAppCurrentAccountId';
const USER_DATA_KEY = 'localeAppAllUsersData';
const REPORTS_KEY = 'localeAppReports';
const FEEDBACK_KEY = 'localeAppFeedback';
const TERMS_KEY = 'localeAppTermsContent';
const PRIVACY_KEY = 'localeAppPrivacyContent';
const APPROX_MONTH_MS = 30 * 24 * 60 * 60 * 1000;

interface UserSpecificData {
    bag: BagItem[];
    savedLists: SavedList[];
    priceAlerts: PriceAlert[];
    availabilityAlerts: AvailabilityAlert[];
    notifications: Notification[];
    notifiedPostIds: string[];
    viewedPostIds: string[];
}

type AllUsersData = Record<string, UserSpecificData>;

const initialUserSpecificData: UserSpecificData = {
    bag: [],
    savedLists: [],
    priceAlerts: [],
    availabilityAlerts: [],
    notifications: [],
    notifiedPostIds: [],
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
  // FIX: Make upgradeToSeller async to match similar functions and satisfy consumer props.
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
  priceAlerts: PriceAlert[];
  availabilityAlerts: AvailabilityAlert[];
  notifications: Notification[];
  notifiedPostIds: string[];
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
  setPriceAlert: (postId: string, targetPrice: number) => void;
  deletePriceAlert: (postId: string) => void;
  setAvailabilityAlert: (postId: string) => void;
  deleteAvailabilityAlert: (postId: string) => void;
  checkAvailabilityAlerts: (post: Post) => void;
  addNotification: (notificationData: Omit<Notification, 'id' | 'timestamp' | 'isRead'>) => void;
  setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
  setNotifiedPostIds: (postIds: string[]) => void;
  addPostToViewHistory: (postId: string) => void;
  
  addCatalogItems: (files: File[]) => Promise<void>;
  removeCatalogItem: (itemId: string) => Promise<void>;
  
  savedSearches: SavedSearch[];
  addSavedSearch: (search: SavedSearch) => void;
  deleteSavedSearch: (searchId: string) => void;
  toggleSavedSearchAlert: (searchId: string) => void;
  checkSavedSearchesMatches: (newPosts: Post[]) => void;

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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { addToast } = useUI();

    const [accounts, setAccounts] = useLargePersistentState<Account[]>(ACCOUNTS_KEY, mockAccounts);
    const [currentAccountId, setCurrentAccountId] = usePersistentState<string | null>(CURRENT_ACCOUNT_ID_KEY, null);
    const [savedSearches, setSavedSearches] = usePersistentState<SavedSearch[]>('localeAppSavedSearches', []);
    const [allUsersData, setAllUsersData] = useLargePersistentState<AllUsersData>(USER_DATA_KEY, {});
    
    // Global/Admin Data
    const [reports, setReports] = usePersistentState<Report[]>(REPORTS_KEY, []);
    const [feedbackList, setFeedbackList] = usePersistentState<Feedback[]>(FEEDBACK_KEY, []);
    const [termsContent, setTermsContent] = usePersistentState<string>(TERMS_KEY, initialTermsContent);
    const [privacyContent, setPrivacyContent] = usePersistentState<string>(PRIVACY_KEY, initialPrivacyContent);

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

    const addNotification = useCallback((notificationData: Omit<Notification, 'id' | 'timestamp' | 'isRead'>) => {
        const newNotification: Notification = {
            ...notificationData,
            id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            timestamp: Date.now(),
            isRead: false,
        };

        setAllUsersData(prev => {
            const recipientId = notificationData.recipientId;
            const userSpecificData = prev[recipientId] || initialUserSpecificData;
            
            return {
                ...prev,
                [recipientId]: {
                    ...userSpecificData,
                    notifications: [newNotification, ...userSpecificData.notifications]
                }
            };
        });
        
        // Browser notification for current user
        if (notificationData.recipientId === currentAccountId && 'Notification' in window && Notification.permission === 'granted') {
             new Notification('Locale', { body: notificationData.message });
        }
    }, [setAllUsersData, currentAccountId]);
    
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
        // Automatically reactivate user-archived accounts
        if (account.status === 'archived' && !account.archivedByAdmin) {
             setAccounts(prev => prev.map(a => a.id === account.id ? { ...a, status: 'active', archivedByAdmin: false } : a));
             addToast('Welcome back! Your account has been reactivated.', 'success');
        }

        setCurrentAccountId(account.id);
        if (!rememberMe) {
            localStorage.removeItem(CURRENT_ACCOUNT_ID_KEY);
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
                            
                            const newRenewalDate = acc.subscription.tier === 'Business' 
                                ? currentRenewal + THREE_MONTHS_MS 
                                : Date.now() + THREE_MONTHS_MS;

                            const newSubscription: Subscription = {
                                tier: 'Business',
                                renewalDate: newRenewalDate,
                                isTrial: false,
                                trialEndDate: null,
                            };
                            
                            addNotification({ 
                                recipientId: referrer.id, 
                                message: `Your referral was successful! You've received a 3-month Business subscription bonus.`, 
                                type: 'referral_bonus' 
                            });
                            
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
          addNotification({ recipientId: newAccount.id, message: 'Your seller account has been submitted and is pending review by our team.', type: 'account_pending' });
        } else {
          addToast(`Welcome, ${newAccount.name}! Your account has been created.`, 'success');
        }
        login(newAccount, true);

        return newAccount;
    }, [accounts, setAccounts, addToast, login, addNotification]);

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
                } else { // 'Basic' tier
                    subscription = { tier: 'Basic', renewalDate: null, isTrial: false, trialEndDate: null };
                    addToast(`Your account has been upgraded to Basic and is now under review.`, 'success');
                }
                
                return { ...updatedAccount, subscription };
            }
            return acc;
        }));
        addNotification({ recipientId: accountId, message: 'Your seller account details have been submitted and are pending review.', type: 'account_pending' });
    }, [setAccounts, addToast, addNotification]);
      
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
        setAccounts(prev => prev.filter(acc => acc.id !== accountId));
        if (accountId === currentAccountId) {
            signOut();
        }
        addToast('Account deleted.', 'success');
    }, [setAccounts, currentAccountId, signOut, addToast]);

    const updateAccountRole = useCallback((accountId: string, role: 'account' | 'admin') => {
        setAccounts(prev => prev.map(acc => acc.id === accountId ? { ...acc, role } : acc));
        addToast("Account role updated.", "success");
    }, [setAccounts, addToast]);

    const approveAccount = useCallback((accountId: string) => {
        setAccounts(prev => prev.map(acc => {
            if (acc.id === accountId && acc.status === 'pending') {
                addNotification({ recipientId: accountId, message: 'Congratulations! Your seller account has been approved.', type: 'account_approved' });
                return { ...acc, status: 'active' };
            }
            return acc;
        }));
        addToast("Account approved.", "success");
    }, [setAccounts, addToast, addNotification]);

    const rejectAccount = useCallback((accountId: string) => {
        setAccounts(prev => prev.map(acc => {
            if (acc.id === accountId && acc.status === 'pending') {
                addNotification({ recipientId: accountId, message: 'Your seller account application has been rejected. Please contact support for more information.', type: 'account_rejected' });
                return { ...acc, status: 'rejected' };
            }
            return acc;
        }));
        addToast("Account rejected.", "success");
    }, [setAccounts, addToast, addNotification]);

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

    const setPriceAlert = useCallback((postId: string, targetPrice: number) => {
        const existingAlertIndex = currentUserData.priceAlerts.findIndex(alert => alert.postId === postId);
        const newAlerts = [...currentUserData.priceAlerts];
        if (existingAlertIndex > -1) {
            newAlerts[existingAlertIndex] = { ...newAlerts[existingAlertIndex], targetPrice };
        } else {
            newAlerts.push({ id: `alert-${Date.now()}`, postId, targetPrice });
        }
        updateCurrentUserSpecificData({ priceAlerts: newAlerts });
        addToast('Price alert set!', 'success');
    }, [currentUserData.priceAlerts, updateCurrentUserSpecificData, addToast]);

    const deletePriceAlert = useCallback((postId: string) => {
        updateCurrentUserSpecificData({ priceAlerts: currentUserData.priceAlerts.filter(alert => alert.postId !== postId) });
        addToast('Price alert removed.', 'success');
    }, [currentUserData.priceAlerts, updateCurrentUserSpecificData, addToast]);

    const setAvailabilityAlert = useCallback((postId: string) => {
        const existingAlert = currentUserData.availabilityAlerts.find(alert => alert.postId === postId);
        if (!existingAlert) {
            const newAlert: AvailabilityAlert = { id: `avail-${Date.now()}`, postId };
            updateCurrentUserSpecificData({ availabilityAlerts: [...currentUserData.availabilityAlerts, newAlert] });
            addToast('You will be notified when this item is available.', 'success');
        }
    }, [currentUserData.availabilityAlerts, updateCurrentUserSpecificData, addToast]);

    const deleteAvailabilityAlert = useCallback((postId: string) => {
        updateCurrentUserSpecificData({ availabilityAlerts: currentUserData.availabilityAlerts.filter(alert => alert.postId !== postId) });
        addToast('Availability alert removed.', 'success');
    }, [currentUserData.availabilityAlerts, updateCurrentUserSpecificData, addToast]);

    const checkAvailabilityAlerts = useCallback((post: Post) => {
        const { isExpired } = getPostStatus(post.expiryDate);
        if (isExpired) return;
        setAllUsersData(prev => {
            const newData = { ...prev };
            let changed = false;
            Object.keys(newData).forEach(userId => {
                const userData = newData[userId];
                if (!userData.availabilityAlerts) return;
                const alertIndex = userData.availabilityAlerts.findIndex(a => a.postId === post.id);
                if (alertIndex > -1) {
                    const newAlerts = [...userData.availabilityAlerts];
                    newAlerts.splice(alertIndex, 1);
                    const newNotification: Notification = { id: `notif-avail-${Date.now()}-${userId}`, recipientId: userId, message: `Good news! "${post.title}" is now available.`, timestamp: Date.now(), isRead: false, type: 'search_alert', postId: post.id };
                    newData[userId] = { ...userData, availabilityAlerts: newAlerts, notifications: [newNotification, ...userData.notifications] };
                    changed = true;
                    if (userId === currentAccountId && 'Notification' in window && Notification.permission === 'granted') {
                         new Notification('Item Available', { body: newNotification.message });
                    }
                }
            });
            return changed ? newData : prev;
        });
    }, [setAllUsersData, currentAccountId]);

    const setNotifications = useCallback((valueOrUpdater: React.SetStateAction<Notification[]>) => {
        const newNotifications = typeof valueOrUpdater === 'function' ? valueOrUpdater(currentUserData.notifications) : valueOrUpdater;
        updateCurrentUserSpecificData({ notifications: newNotifications });
    }, [currentUserData.notifications, updateCurrentUserSpecificData]);

    const setNotifiedPostIds = useCallback((postIds: string[]) => {
        updateCurrentUserSpecificData({ notifiedPostIds: postIds });
    }, [updateCurrentUserSpecificData]);

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

    const checkSavedSearchesMatches = useCallback((newPosts: Post[]) => {
        if (!currentAccountId || savedSearches.length === 0) return;
        const alertsEnabledSearches = savedSearches.filter(s => s.enableAlerts);
        if (alertsEnabledSearches.length === 0) return;
        
        alertsEnabledSearches.forEach(search => {
            const filterStateCompat: FiltersState = {
                ...initialFiltersState,
                ...search.filters,
                // Ensure transient fields are reset if needed, though initialFiltersState handles it
            };
            const matches = applyFiltersToPosts(newPosts as any[], newPosts as any[], filterStateCompat, search.filters.searchQuery, null, currentAccount);
            if (matches.length > 0) {
                addNotification({ recipientId: currentAccountId, message: `${matches.length} new item(s) found for your search "${search.name}".`, type: 'search_alert' });
            }
        });
    }, [currentAccountId, savedSearches, currentAccount, addNotification]);

    const addSavedSearch = useCallback((search: SavedSearch) => {
        setSavedSearches(prev => [...prev, search]);
    }, [setSavedSearches]);

    const deleteSavedSearch = useCallback((searchId: string) => {
        setSavedSearches(prev => prev.filter(s => s.id !== searchId));
    }, [setSavedSearches]);

    const value = useMemo(() => ({
        accounts, currentAccount, accountsById, likedPostIds, login, signOut, socialLogin, createAccount, updateAccount, updateAccountDetails, upgradeToSeller, toggleLikeAccount, toggleLikePost, updateSubscription, toggleAccountStatus, deleteAccount, updateAccountRole, approveAccount, rejectAccount,
        bag: currentUserData.bag, savedLists: currentUserData.savedLists, priceAlerts: currentUserData.priceAlerts, availabilityAlerts: currentUserData.availabilityAlerts, notifications: currentUserData.notifications, notifiedPostIds: currentUserData.notifiedPostIds, viewedPostIds: currentUserData.viewedPostIds,
        addToBag, updateBagItem, saveItemToLists, removeBagItem, clearCheckedBagItems, createSavedList, renameSavedList, deleteListAndMoveItems, addListToBag, setPriceAlert, deletePriceAlert, setAvailabilityAlert, deleteAvailabilityAlert, checkAvailabilityAlerts, addNotification, setNotifications, setNotifiedPostIds, addPostToViewHistory, addCatalogItems, removeCatalogItem,
        savedSearches, addSavedSearch, deleteSavedSearch, toggleSavedSearchAlert, checkSavedSearchesMatches,
        // Admin/Global
        reports, addReport, addForumReport, setReports,
        feedbackList, addFeedback, setFeedbackList,
        termsContent, setTermsContent,
        privacyContent, setPrivacyContent
    }), [
        accounts, currentAccount, accountsById, likedPostIds, login, signOut, socialLogin, createAccount, updateAccount, updateAccountDetails, upgradeToSeller, toggleLikeAccount, toggleLikePost, updateSubscription, toggleAccountStatus, deleteAccount, updateAccountRole, approveAccount, rejectAccount,
        currentUserData,
        addToBag, updateBagItem, saveItemToLists, removeBagItem, clearCheckedBagItems, createSavedList, renameSavedList, deleteListAndMoveItems, addListToBag, setPriceAlert, deletePriceAlert, setAvailabilityAlert, deleteAvailabilityAlert, checkAvailabilityAlerts, addNotification, setNotifications, setNotifiedPostIds, addPostToViewHistory, addCatalogItems, removeCatalogItem,
        savedSearches, addSavedSearch, deleteSavedSearch, toggleSavedSearchAlert, checkSavedSearchesMatches,
        reports, addReport, addForumReport, setReports, feedbackList, addFeedback, setFeedbackList, termsContent, setTermsContent, privacyContent, setPrivacyContent
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
