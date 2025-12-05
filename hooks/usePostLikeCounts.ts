
import { useMemo } from 'react';
import { Account } from '../types';

export const usePostLikeCounts = (allAccounts: Account[]) => {
  return useMemo(() => {
    const likeCounts = new Map<string, number>();
    if (!allAccounts) return likeCounts;
    
    allAccounts.forEach(account => {
      (account.likedPostIds || []).forEach(postId => {
        likeCounts.set(postId, (likeCounts.get(postId) || 0) + 1);
      });
    });
    return likeCounts;
  }, [allAccounts]);
};
