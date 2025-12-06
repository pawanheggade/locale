
import React from 'react';
import { Account } from '../types';
import { PaperAirplaneIcon } from './Icons';
import { Button } from './ui/Button';
import { isShareAbortError } from '../lib/utils';

interface ReferralCardProps {
    account: Account;
}

export const ReferralCard: React.FC<ReferralCardProps> = ({ account }) => {

    const handleShare = async () => {
        const shareData = {
            title: 'Join Locale!',
            text: `Sign up as a seller on Locale using my referral code: ${account.referralCode}`,
            url: window.location.origin,
        };

        if (navigator.share) {
            try {
                await navigator.share(shareData);
            } catch (err: any) {
                if (!isShareAbortError(err)) {
                    console.error('Error sharing:', err);
                }
            }
        } else {
            // Fallback to copy if share not supported
            navigator.clipboard.writeText(shareData.text);
        }
    };

    return (
        <div className="bg-amber-50 border-2 border-dashed border-amber-300 rounded-xl p-4 text-center">
            <h3 className="text-lg font-semibold text-amber-900">Refer & Earn!</h3>
            <p className="mt-1 text-sm text-amber-800 max-w-md mx-auto">Refer someone to sign up as a seller and you'll get a <span className="font-bold">3-month Business subscription bonus!</span></p>
            <p className="mt-3 text-sm text-gray-600">Your unique referral code:</p>
            <div className="mt-2 flex items-center justify-center gap-2 p-3 bg-white rounded-xl border border-amber-200 max-w-xs mx-auto">
                <p className="text-xl font-bold text-gray-800 tracking-widest">{account.referralCode}</p>
            </div>
            
            <div className="mt-3 flex justify-center">
                <Button onClick={handleShare} variant="outline" size="sm" className="gap-2 text-amber-700 border-amber-300 bg-white">
                    <PaperAirplaneIcon className="w-4 h-4" />
                    Share Code
                </Button>
            </div>

            <p className="mt-4 text-sm text-gray-600">
                Successful Referrals: <span className="font-bold text-gray-800">{account.referralCount || 0}</span>
            </p>
        </div>
    );
};
