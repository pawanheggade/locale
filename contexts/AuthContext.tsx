import React, { createContext, useContext, useMemo, useCallback } from 'react';
import { Account, Subscription, CatalogItem, SavedSearch, Report, Feedback, Post, ForumPost, ForumComment, ConfirmationModalData } from '../types';
import { usePersistentState } from '../hooks/usePersistentState';
import { useLargePersistentState } from '../hooks/useLargePersistentState';
import { useUI } from './UIContext';
import { mockAccounts } from '../data/accounts';
import { fileToDataUrl } from '../utils/media';
import { initialTermsContent, initialPrivacyContent } from '../data/pageContent';
import { STORAGE_KEYS } from '../lib/constants';

const APPROX_MONTH_MS = 30 * 24 * 60 * 60 * 1000;

interface AuthContextType {
  accounts: Account[];
  currentAccount: Account | null;
  accountsById: Map<string, Account>;
  likedPostIds: Set<string>;
  login: (account: Account, rememberMe: boolean) => void;
  signOut: () => void;
  socialLogin: (provider: 'google' | 'apple') => void;
  createAccount: (newAccountData: Omit<Account, 'id' | 'joinDate' | 'role' | 'status' | 'subscription' | 'likedAccountIds' | 'referralCode'>, isSeller: boolean, referralCode?: string) => Promise<Account>;
  updateAccountDetails: (updatedAccount: Account) => void;
  upgradeToSeller: (accountId: string, sellerData: Partial<Account>, newTier: Subscription['tier']) => Promise<void>;
  toggleLikeAccount: (accountId: string) => void;
  toggleAccountAlert: (accountId: string) => void;
  toggleLikePost: (postId: string) => { wasLiked: boolean };
  updateSubscription: (accountId: string, tier: Subscription['tier']) => void;
  toggleAccountStatus: (accountId: string, byAdmin?: boolean) => void;
  deleteAccount: (accountId: string) => void;
  updateAccountRole: (accountId: string, role: 'account' | 'admin') => void;
  approveAccount: (accountId: string) => void;
  rejectAccount: (accountId: string) => void;
  
  addCatalogItems: (files: File[]) => Promise<void>;
  removeCatalogItem: (itemId: string) => Promise<void>;
  incrementCatalogView: (accountId: string, itemId: string) => void;
  incrementCatalogDownload: (accountId: string, itemId: string) => void;
  
  savedSearches: SavedSearch[];
  addSavedSearch: (search: SavedSearch) => void;
  deleteSavedSearch: (searchId: string) => void;
  toggleSavedSearchAlert: (searchId: string) => void;

  // Admin & Global Data
  reports: Report[];
  reportItem: (item: Post | ForumPost | ForumComment) => void;
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

const toggleIdInArray = (array: string[] | undefined, id: string): string[] => {
    const currentArray = array || [];
    if (currentArray.includes(id)) {
        return currentArray.filter(i => i !== id);
    } else {
        return [...currentArray, id];
    }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { openModal, addToast } = useUI();

    const [accounts, setAccounts] = useLargePersistentState<Account[]>(STORAGE_KEYS.ACCOUNTS, mockAccounts);
    const [currentAccountId, setCurrentAccountId] = usePersistentState<string | null>(STORAGE_KEYS.CURRENT_ACCOUNT_ID, null);
    const [savedSearches, setSavedSearches] = usePersistentState<SavedSearch[]>(STORAGE_KEYS.SAVED_SEARCHES, []);
    
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
    
    const accountsById = useMemo<Map<string, Account>>(() => new Map(accounts.map(account => [account.id, account])), [accounts]);
    const likedPostIds = useMemo(() => new Set<string>(currentAccount?.likedPostIds || []), [currentAccount]);

    const showConfirmation = useCallback((data: ConfirmationModalData) => {
        openModal({ type: 'confirmation', data });
    }, [openModal]);
    
    const reportItem = useCallback((item: Post | ForumPost | ForumComment) => {
        if (!currentAccount) {
            openModal({ type: 'login' });
            return;
        }
        openModal({ type: 'reportItem', data: { item } });
    }, [currentAccount, openModal]);

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
    }, [currentAccount, setReports]);

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
    }, [currentAccount, setReports]);

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
    }, [currentAccount, setFeedbackList]);

    const login = useCallback((account: Account, rememberMe: boolean) => {
        if (account.status === 'archived' && !account.archivedByAdmin) {
             setAccounts(prev => prev.map(a => a.id === account.id ? { ...a, status: 'active', archivedByAdmin: false } : a));
        }

        setCurrentAccountId(account.id);
        if (!rememberMe) {
            localStorage.removeItem(STORAGE_KEYS.CURRENT_ACCOUNT_ID);
        }
    }, [setCurrentAccountId, setAccounts]);

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
                }
            }
        }
        
        setAccounts(prev => [...prev, newAccount]);

        login(newAccount, true);

        return newAccount;
    }, [accounts, setAccounts, login]);

    const socialLogin = useCallback(async (provider: 'google' | 'apple') => {
        const mockUser = provider === 'google' ? { email: 'google.user@example.com', name: 'Google User', username: 'google_user', avatarUrl: 'https://i.pravatar.cc/150?u=google-user' } : { email: 'apple.user@example.com', name: 'Apple User', username: 'apple_user', avatarUrl: 'https://i.pravatar.cc/150?u=apple-user' };
        let userAccount = accounts.find(acc => acc.email.toLowerCase() === mockUser.email);
        if (!userAccount) {
            userAccount = await createAccount({ ...mockUser, password: 'social_login_mock_password' }, false);
        }
        login(userAccount, true);
    }, [accounts, createAccount, login]);

    const updateAccountDetails = useCallback((updatedAccount: Account) => {
        setAccounts(prev => prev.map(acc => acc.id === updatedAccount.id ? updatedAccount : acc));
    }, [setAccounts]);
    
    const updateAccountInList = useCallback((accountId: string, updater: (account: Account) => Account) => {
        setAccounts(prev => prev.map(acc => acc.id === accountId ? updater(acc) : acc));
    }, [setAccounts]);

    const upgradeToSeller = useCallback(async (accountId: string, sellerData: Partial<Account>, newTier: Subscription['tier']) => {
        updateAccountInList(accountId, acc => {
            const updatedAccount = { ...acc, ...sellerData, status: 'pending' as const };
            let subscription: Subscription;

            if (newTier === 'Verified' || newTier === 'Business') {
                const trialEndDate = Date.now() + 14 * 24 * 60 * 60 * 1000;
                subscription = { tier: newTier, renewalDate: trialEndDate, isTrial: true, trialEndDate };
            } else { 
                subscription = { tier: 'Basic', renewalDate: null, isTrial: false, trialEndDate: null };
            }
            
            return { ...updatedAccount, subscription };
        });
    }, [updateAccountInList]);
      
    const toggleLikeAccount = useCallback((accountIdToLike: string) => {
        const loggedInAccount = accounts.find(a => a.id === currentAccountId);
        const targetAccount = accounts.find(a => a.id === accountIdToLike);
        if (!loggedInAccount || !targetAccount) return;

        const wasLiked = (loggedInAccount.likedAccountIds || []).includes(accountIdToLike);

        setAccounts(prev => prev.map(acc => {
            if (acc.id === loggedInAccount.id) {
                return { ...acc, likedAccountIds: toggleIdInArray(acc.likedAccountIds, accountIdToLike) };
            }
            if (acc.id === accountIdToLike) {
                return { ...acc, likeCount: wasLiked ? Math.max(0, (acc.likeCount || 0) - 1) : (acc.likeCount || 0) + 1 };
            }
            return acc;
        }));
    }, [accounts, currentAccountId, setAccounts]);

    const toggleAccountAlert = useCallback((accountIdToAlert: string) => {
        if (!currentAccountId) return;
        const loggedInAccount = accounts.find(a => a.id === currentAccountId);
        if (!loggedInAccount) return;

        const wasAlerting = (loggedInAccount.alertAccountIds || []).includes(accountIdToAlert);

        setAccounts(prev => prev.map(acc => {
            if (acc.id === currentAccountId) {
                return { ...acc, alertAccountIds: toggleIdInArray(acc.alertAccountIds, accountIdToAlert) };
            }
            return acc;
        }));

        if (wasAlerting) {
            addToast("Updates turned off for this user.", 'success');
        } else {
            addToast("Updates turned on for this user.", 'success');
        }
    }, [accounts, currentAccountId, setAccounts, addToast]);

    const toggleLikePost = useCallback((postId: string): { wasLiked: boolean } => {
        if (!currentAccount) return { wasLiked: false };
        const wasLiked = (currentAccount.likedPostIds || []).includes(postId);
        updateAccountInList(currentAccount.id, acc => ({ ...acc, likedPostIds: toggleIdInArray(acc.likedPostIds, postId) }));
        return { wasLiked: !wasLiked };
    }, [currentAccount, updateAccountInList]);

    const updateSubscription = useCallback((accountId: string, tier: Subscription['tier']) => {
        updateAccountInList(accountId, acc => {
            const newSubscription: Subscription = {
                tier: tier,
                isTrial: false,
                trialEndDate: null,
                renewalDate: tier === 'Personal' || tier === 'Basic' ? null : Date.now() + APPROX_MONTH_MS,
            };
            return { ...acc, subscription: newSubscription };
        });
    }, [updateAccountInList]);

    const toggleAccountStatus = useCallback((accountId: string, byAdmin: boolean = false) => {
        updateAccountInList(accountId, acc => {
            const newStatus = acc.status === 'active' ? 'archived' : 'active';
            const updates: Partial<Account> = { status: newStatus };
            if (newStatus === 'archived') updates.archivedByAdmin = byAdmin;
            else updates.archivedByAdmin = false; 
            return { ...acc, ...updates };
        });
    }, [updateAccountInList]);

    const deleteAccount = useCallback((accountId: string) => {
        showConfirmation({
            title: 'Delete Account',
            message: 'Are you sure you want to permanently delete this account? This action cannot be undone.',
            onConfirm: () => {
                setAccounts(prev => prev.filter(acc => acc.id !== accountId));
                if (accountId === currentAccountId) {
                    signOut();
                }
            },
            confirmText: 'Delete Permanently',
        });
    }, [setAccounts, currentAccountId, signOut, showConfirmation]);

    const updateAccountRole = useCallback((accountId: string, role: 'account' | 'admin') => {
        updateAccountInList(accountId, acc => ({ ...acc, role }));
    }, [updateAccountInList]);

    const approveAccount = useCallback((accountId: string) => {
        updateAccountInList(accountId, acc => ({ ...acc, status: 'active' }));
    }, [updateAccountInList]);

    const rejectAccount = useCallback((accountId: string) => {
        updateAccountInList(accountId, acc => ({ ...acc, status: 'rejected' }));
    }, [updateAccountInList]);

    const addCatalogItems = useCallback(async (files: File[]) => {
        if (!currentAccountId) return;
        const newItems: CatalogItem[] = [];
        for (const file of files) {
            try {
                const url = await fileToDataUrl(file);
                const type = file.type === 'application/pdf' ? 'pdf' : 'image';
                newItems.push({ id: `cat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, url, type, name: file.name, views: 0, downloads: 0 });
            } catch (error) {
                console.error(`Failed to process file ${file.name}`, error);
            }
        }
        if (newItems.length > 0) {
            updateAccountInList(currentAccountId, acc => ({ ...acc, catalog: [...(acc.catalog || []), ...newItems] }));
        }
    }, [currentAccountId, updateAccountInList]);

    const removeCatalogItem = useCallback(async (itemId: string) => {
        if (!currentAccountId) return;
        updateAccountInList(currentAccountId, acc => ({ ...acc, catalog: (acc.catalog || []).filter(item => item.id !== itemId) }));
    }, [currentAccountId, updateAccountInList]);

    const incrementCatalogView = useCallback((accountId: string, itemId: string) => {
        updateAccountInList(accountId, acc => ({
            ...acc,
            catalog: (acc.catalog || []).map(item => 
                item.id === itemId ? { ...item, views: (item.views || 0) + 1 } : item
            )
        }));
    }, [updateAccountInList]);

    const incrementCatalogDownload = useCallback((accountId: string, itemId: string) => {
        updateAccountInList(accountId, acc => ({
            ...acc,
            catalog: (acc.catalog || []).map(item => 
                item.id === itemId ? { ...item, downloads: (item.downloads || 0) + 1 } : item
            )
        }));
    }, [updateAccountInList]);
    
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
        updateAccountInList(accountId, acc => ({ ...acc, profileViews: (acc.profileViews || 0) + 1 }));
    }, [updateAccountInList]);

    const value: AuthContextType = useMemo(() => ({
        accounts, currentAccount, accountsById, likedPostIds, login, signOut, socialLogin, createAccount, updateAccountDetails, upgradeToSeller, toggleLikeAccount, toggleAccountAlert, toggleLikePost, updateSubscription, toggleAccountStatus, deleteAccount, updateAccountRole, approveAccount, rejectAccount,
        addCatalogItems, removeCatalogItem, incrementCatalogView, incrementCatalogDownload,
        savedSearches, addSavedSearch, deleteSavedSearch, toggleSavedSearchAlert,
        reports, reportItem, addReport, addForumReport, setReports,
        feedbackList, addFeedback, setFeedbackList,
        termsContent, setTermsContent, privacyContent, setPrivacyContent,
        incrementProfileViews
    }), [
        accounts, currentAccount, accountsById, likedPostIds, login, signOut, socialLogin, createAccount, updateAccountDetails, upgradeToSeller, toggleLikeAccount, toggleAccountAlert, toggleLikePost, updateSubscription, toggleAccountStatus, deleteAccount, updateAccountRole, approveAccount, rejectAccount,
        addCatalogItems, removeCatalogItem, incrementCatalogView, incrementCatalogDownload,
        savedSearches, addSavedSearch, deleteSavedSearch, toggleSavedSearchAlert,
        reports, reportItem, addReport, addForumReport, setReports,
        feedbackList, addFeedback, setFeedbackList,
        termsContent, setTermsContent, privacyContent, setPrivacyContent,
        incrementProfileViews, addReport, addFeedback
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
