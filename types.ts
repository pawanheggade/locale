

export enum PostType {
  PRODUCT = 'PRODUCT',
  SERVICE = 'SERVICE',
  EVENT = 'EVENT',
}

export type PostCategory = string;

export interface Media {
  type: 'image' | 'video';
  url: string;
}

export interface Post {
  id: string;
  authorId: string;
  title: string;
  description: string;
  location: string;
  type: PostType;
  category: PostCategory;
  price?: number;
  priceUnit?: string;
  salePrice?: number;
  media: Media[];
  isLiked: boolean;
  coordinates?: { lat: number; lng: number } | null;
  expiryDate: number | null;
  tags: string[];
  lastUpdated: number;
  eventLocation?: string;
  eventCoordinates?: { lat: number; lng: number } | null;
  eventStartDate?: number | null;
  eventEndDate?: number | null;
  isLocaleChoice?: boolean;
  score?: number;
  isPinned?: boolean;
}

export interface Subscription {
  tier: 'Personal' | 'Basic' | 'Verified' | 'Business' | 'Organisation';
  renewalDate: number | null;
  isTrial?: boolean;
  trialEndDate?: number | null;
}

export type ContactOption = 'email' | 'mobile' | 'message';

export interface CatalogItem {
  id: string;
  url: string;
  type: 'image' | 'pdf';
  name: string;
}

export type SocialPlatform = 'website' | 'instagram' | 'twitter' | 'facebook' | 'youtube';

export interface SocialLink {
  platform: SocialPlatform;
  url: string;
}

export interface Account {
  id: string;
  name: string;
  username: string;
  email: string;
  password?: string;
  description?: string; // Used as Bio
  avatarUrl: string;
  bannerUrl?: string;
  role: 'account' | 'admin';
  joinDate: number;
  mobile?: string;
  messageNumber?: string;
  status: 'active' | 'archived' | 'pending' | 'rejected';
  archivedByAdmin?: boolean;
  subscription: Subscription;
  taxInfo?: string;
  address?: string;
  coordinates?: { lat: number; lng: number } | null;
  googleMapsUrl?: string;
  appleMapsUrl?: string;
  likeCount?: number;
  businessName?: string;
  paymentMethods?: string[];
  deliveryOptions?: string[];
  contactOptions?: ContactOption[];
  socialLinks?: SocialLink[];
  likedAccountIds?: string[];
  likedPostIds?: string[];
  referralCode: string;
  referredBy?: string;
  referralCount?: number;
  profileViews?: number;
  catalog?: CatalogItem[];
}

export interface DisplayablePost extends Post {
  author?: Account;
  distance?: number;
  aiReasoning?: string;
  isAddedToBag?: boolean;
  hasPriceAlert?: boolean;
  likeCount?: number;
}

export interface SavedSearchFilters {
  searchQuery: string;
  filterType: 'all' | PostType;
  filterCategory: 'all' | PostCategory;
  sortOption: string;
  minPrice: string;
  maxPrice: string;
  filterTags: string[];
}

export interface SavedSearch {
  id: string;
  name: string;
  filters: SavedSearchFilters;
  enableAlerts?: boolean;
}

export interface PriceAlert {
  id: string;
  postId: string;
  targetPrice: number;
}

export interface AvailabilityAlert {
  id: string;
  postId: string;
}

export interface SavedList {
  id: string;
  name: string;
}

export interface BagItem {
  id: string;
  postId: string;
  quantity: number;
  isChecked: boolean;
  savedListIds: string[];
}

export interface NotificationSettings {
  expiryAlertsEnabled: boolean;
  expiryThresholdDays: number;
}

export interface Notification {
  id: string;
  recipientId: string;
  message: string;
  timestamp: number;
  isRead: boolean;
  type: 'expiry' | 'account_approved' | 'account_rejected' | 'account_pending' | 'liked_seller_active' | 'new_report' | 'referral_bonus' | 'report_update' | 'content_removed' | 'forum_reply' | 'search_alert';
  postId?: string;
  relatedAccountId?: string;
  forumPostId?: string;
}


export interface Report {
  id: string;
  reporterId: string;
  reason: string;
  timestamp: number;
  postId?: string; // For marketplace posts
  forumPostId?: string;
  forumCommentId?: string;
}

export interface Feedback {
  id: string;
  userId: string;
  content: string;
  timestamp: number;
  isArchived?: boolean;
  isRead: boolean;
}

export interface ConfirmationModalData {
  title: string;
  message: string;
  onConfirm: () => void | Promise<void>;
  confirmText?: string;
  confirmClassName?: string;
}

export type ModalState =
  | { type: 'login' }
  | { type: 'viewMedia', data: { media: Media[], startIndex: number } }
  | { type: 'findNearby' }
  | { type: 'sharePost', data: Post }
  | { type: 'reportItem', data: { item: Post | ForumPost | ForumComment } }
  | { type: 'filterPanel' }
  | { type: 'saveSearch' }
  | { type: 'viewSavedSearches' }
  | { type: 'setPriceAlert', data: Post }
  | { type: 'addToBag', data: Post }
  | { type: 'saveToList', data: { bagItemId: string } }
  | { type: 'contactStore', data: { author: Account, post?: Post, prefilledMessage?: string } }
  | { type: 'createAccount', data?: { isSeller: boolean } }
  | { type: 'forgotPassword' }
  | { type: 'editAccount', data: Account }
  | { type: 'termsOfService' }
  | { type: 'privacyPolicy' }
  | { type: 'confirmation', data: ConfirmationModalData }
  | { type: 'createForumPost' }
  | { type: 'upgradeToSeller', data: { tier: Subscription['tier'] } }
  | { type: 'feedback' }
  | { type: 'manageCatalog' }
  | { type: 'viewCatalog', data: { catalog: CatalogItem[] } }
  | { type: 'profileQR', data: Account };

export type AdminView = 'accounts' | 'posts' | 'reports' | 'categories' | 'analytics' | 'pages' | 'feedback';
export type AppView = 'all' | 'likes' | 'bag' | 'admin' | 'account' | 'postDetail' | 'forums' | 'forumPostDetail' | 'createPost' | 'editPost' | 'nearbyPosts' | 'accountAnalytics' | 'subscription' | 'settings' | 'activity';


// --- Context API Action Types ---

export interface FiltersState {
  searchQuery: string;
  filterType: 'all' | PostType;
  filterCategory: 'all' | string;
  sortOption: string;
  minPrice: string;
  maxPrice: string;
  filterTags: string[];
  filterExpiringSoon: boolean;
  filterShowExpired: boolean;
  filterLast7Days: boolean;
  filterDistance: number;
  isAiSearchEnabled: boolean;
  isAiSearching: boolean;
  aiSmartFilterResults: Array<{ id: string; reasoning: string }> | null;
}

export type ModalAction = 
  | { type: 'OPEN_MODAL'; payload: ModalState }
  | { type: 'CLOSE_MODAL' };

export type AuthAction =
  | { type: 'LOGIN'; payload: { accountId: string } }
  | { type: 'LOGOUT' }
  | { type: 'SET_ACCOUNTS'; payload: Account[] };

export type PostsAction =
  | { type: 'SET_POSTS'; payload: Post[] }
  | { type: 'SET_ARCHIVED_POSTS'; payload: Post[] }
  | { type: 'SET_CATEGORIES'; payload: PostCategory[] };

export type BagAction =
  | { type: 'SET_BAG', payload: BagItem[] };
  
export type NotificationsAction =
  | { type: 'SET_PRICE_ALERTS', payload: PriceAlert[] }
  | { type: 'SET_NOTIFICATIONS', payload: Notification[] }
  | { type: 'SET_NOTIFIED_POST_IDS', payload: string[] };

export type FilterAction =
  | { type: 'SET_SEARCH_QUERY'; payload: string }
  | { type: 'SET_FILTER_TYPE'; payload: 'all' | PostType }
  | { type: 'SET_FILTER_CATEGORY'; payload: 'all' | PostCategory }
  | { type: 'SET_SORT_OPTION'; payload: string }
  | { type: 'SET_MIN_PRICE'; payload: string }
  | { type: 'SET_MAX_PRICE'; payload: string }
  | { type: 'SET_FILTER_TAGS'; payload: string[] }
  | { type: 'SET_FILTER_EXPIRING_SOON'; payload: boolean }
  | { type: 'SET_FILTER_SHOW_EXPIRED'; payload: boolean }
  | { type: 'SET_FILTER_LAST_7_DAYS'; payload: boolean }
  | { type: 'SET_FILTER_DISTANCE'; payload: number }
  | { type: 'SET_AI_SEARCH_ENABLED'; payload: boolean }
  | { type: 'SET_AI_SEARCHING'; payload: boolean }
  | { type: 'SET_AI_RESULTS'; payload: Array<{ id: string; reasoning: string }> | null }
  | { type: 'CLEAR_FILTERS' }
  | { type: 'SET_FILTERS_FROM_SAVED'; payload: SavedSearchFilters };

// --- Forum Types ---

export interface ForumComment {
  id: string;
  postId: string;
  authorId: string;
  content: string;
  timestamp: number;
  parentId: string | null;
  upvotes: string[];
  downvotes: string[];
}

export interface DisplayableForumComment extends ForumComment {
  author?: Account;
  score: number;
  replies: DisplayableForumComment[];
}

export interface ForumPost {
  id: string;
  authorId: string;
  title: string;
  content: string;
  timestamp: number;
  category: string;
  upvotes: string[];
  downvotes: string[];
  isPinned?: boolean;
}

export interface DisplayableForumPost extends ForumPost {
  author?: Account;
  score: number;
  commentCount: number;
  comments: DisplayableForumComment[];
}