import React from 'react';
import { Account, Subscription, ModalState } from '../types';
import { CheckIcon } from './Icons';
import { formatDaysRemaining } from '../utils/formatters';
import { Button, ButtonProps } from './ui/Button';
import { TIER_STYLES } from '../lib/utils';
// FIX: Import context hooks
import { useAuth } from '../contexts/AuthContext';
import { useUI } from '../contexts/UIContext';

const plans = [
  {
    tier: 'Personal',
    price: '₹0',
    annualPrice: null,
    description: 'For browsing, saving, and interacting with the community.',
    features: [
      'Browse and discover local items',
      'Save your favorite posts and sellers',
      'Contact sellers directly',
      'Discuss in forums',
    ],
  },
  {
    tier: 'Basic',
    price: '₹0',
    annualPrice: null,
    description: 'The essentials to get you started on Locale.',
    features: [
      'List up to 5 items at a time',
      '10 media uploads per post',
      'Standard post visibility',
      'Standard support',
    ],
  },
  {
    tier: 'Verified',
    price: '₹399/mo',
    annualPrice: '₹3,990/yr',
    description: 'For verified members and enthusiasts who want more.',
    features: [
      <span key="verified-f1"><span className="font-bold text-gray-800">Priority Placement</span> in search & feeds</span>,
      <span key="verified-f2"><span className="font-bold text-gray-800">"Verified" Badge</span> on posts & profile</span>,
      <span key="verified-f3"><span className="font-bold text-gray-800">Feature posts</span> on profile page</span>,
      'Unlimited listings',
      'Dedicated "Sale" tab on profile',
      'Dedicated "Catalogs" tab on profile',
      '15 media uploads per post',
      'Access to profile analytics',
      'Priority support',
    ],
  },
  {
    tier: 'Business',
    price: '₹1,999/mo',
    annualPrice: '₹19,990/yr',
    description: 'Advanced tools for professional businesses.',
    features: [
      <span key="bus-f1"><span className="font-bold text-gray-800">High Priority Placement</span> in search & feeds</span>,
      <span key="bus-f2"><span className="font-bold text-gray-800">"Business" Badge</span> on posts & profile</span>,
      'All Verified features, plus:',
      'Auto-generated "Categories" tab',
      '25 media uploads per post',
      '24/7 dedicated support',
    ],
  },
  {
    tier: 'Organisation',
    price: '₹3,990/mo',
    annualPrice: '₹39,900/yr',
    description: 'Ultimate visibility and tools for high-volume sellers.',
    features: [
      <span key="pro-f1"><span className="font-bold text-gray-900">Top of Search</span> Placement</span>,
      <span key="pro-f2"><span className="font-bold text-gray-900">Solid Amber Badge</span></span>,
      'Everything in Business',
      'Unlimited media uploads',
      'Dedicated Account Manager',
      '0% Transaction Fees',
      'Featured on Homepage',
    ],
  },
];

export const SubscriptionPage: React.FC = () => {
  // FIX: Get data from contexts
  const { currentAccount, updateSubscription: onUpdateSubscription } = useAuth();
  const { openModal } = useUI();

  if (!currentAccount) {
    return null;
  }
  
  const isOnTrial = currentAccount.subscription.isTrial && currentAccount.subscription.trialEndDate && currentAccount.subscription.trialEndDate > Date.now();

  const handleSelectPlan = (tier: Subscription['tier']) => {
    if (tier === currentAccount.subscription.tier) return;

    const isPersonalUser = currentAccount.subscription.tier === 'Personal';
    
    // If a personal user selects ANY seller plan, they need to fill the seller form.
    if (isPersonalUser && (tier === 'Basic' || tier === 'Verified' || tier === 'Business' || tier === 'Organisation')) {
        openModal({ type: 'upgradeToSeller', data: { tier } });
    } else {
        // This covers seller-to-seller changes and seller-to-personal downgrades.
        onUpdateSubscription(currentAccount.id, tier);
    }
  };

  return (
    <div className="animate-fade-in-up p-4 sm:p-6 lg:p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Subscribe</h1>
      {isOnTrial && (
          <div className="mb-6 p-4 bg-amber-100 text-amber-800 rounded-lg text-center font-semibold">
              You are currently on a free trial for the {currentAccount.subscription.tier} plan.{' '}
              {formatDaysRemaining(currentAccount.subscription.trialEndDate!)}.
          </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {plans.map((plan) => {
          const tierStyles = TIER_STYLES[plan.tier as Subscription['tier']];
          const currentTier = currentAccount.subscription.tier;
          const isCurrentPlan = currentTier === plan.tier;
          const planIndex = plans.findIndex(p => p.tier === plan.tier);
          const currentIndex = plans.findIndex(p => p.tier === currentTier);
          const isUpgrade = currentIndex < planIndex;
          const isDowngrade = currentIndex > planIndex;
          const isPro = plan.tier === 'Organisation';
          
          let buttonText: string;
          let buttonVariant: ButtonProps['variant'] = 'outline';

          if (isCurrentPlan) {
              buttonText = isOnTrial ? 'On Trial' : 'Current Plan';
          } else if (currentTier === 'Personal') {
              if (plan.tier === 'Basic') {
                  buttonText = 'Start for Free';
              } else {
                  buttonText = 'Start 14-Day Trial';
              }
          } else { // Current user is a seller
              if (plan.tier === 'Personal') {
                  buttonText = 'Downgrade';
              } else if (isUpgrade) {
                  buttonText = 'Upgrade';
              } else {
                  buttonText = 'Downgrade';
              }
          }

          if (!isCurrentPlan) {
            if (isUpgrade) {
              if (plan.tier === 'Verified') {
                  buttonVariant = 'pill-red';
              } else if (plan.tier === 'Business' || plan.tier === 'Organisation') {
                  buttonVariant = 'pill-amber';
              } else if (plan.tier === 'Basic') {
                  buttonVariant = 'pill-dark';
              }
            } else if (isDowngrade) {
              buttonVariant = 'destructive';
            }
          }

          return (
            <div
              key={plan.tier}
              className={`relative rounded-xl border-2 p-6 flex flex-col ${
                isCurrentPlan 
                    ? `${tierStyles.borderColor} bg-white shadow-lg` 
                    : isPro 
                        ? 'border-amber-300 bg-amber-50/50' 
                        : 'border-gray-200 bg-white'
              }`}
            >
              {isCurrentPlan && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-max">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold text-white ${tierStyles.bgColor}`}>
                    {isOnTrial ? 'On Trial' : 'Current Plan'}
                  </span>
                </div>
              )}
              {isPro && !isCurrentPlan && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-max">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-amber-500 text-white shadow-md">Best Value</span>
                  </div>
              )}
              <div className="flex-grow">
                <div className="flex items-center gap-3">
                  {tierStyles.icon && <tierStyles.icon className={`w-7 h-7 ${tierStyles.iconColor}`} />}
                  <h3 className={`text-xl font-bold ${isPro ? 'text-amber-900' : 'text-gray-800'}`}>
                    {plan.tier}{plan.tier !== 'Personal' ? ' Seller' : ''}
                  </h3>
                </div>

                <div className="mt-4 flex flex-col items-center justify-start min-h-[100px]">
                  {plan.annualPrice ? (
                      <div className={`w-full rounded-lg p-2 text-center border-2 border-dashed ${isPro ? 'bg-amber-100 border-amber-300' : 'bg-gray-50 border-gray-200'}`}>
                          <p className={`text-base font-bold ${isPro ? 'text-amber-900' : 'text-gray-600'}`}>{plan.annualPrice}</p>
                          <span className={`text-[10px] font-bold uppercase tracking-wide ${isPro ? 'text-amber-800' : 'text-gray-600'}`}>
                              2 months free!
                          </span>
                      </div>
                  ) : (
                       <div className="w-full h-[56px]"></div>
                  )}
                  <p className={`text-3xl font-extrabold mt-4 ${plan.price === '₹0' ? 'text-gray-600' : 'text-gray-900'}`}>{plan.price}</p>
                </div>

                <p className="mt-3 text-sm text-gray-600 min-h-[40px]">{plan.description}</p>
                <ul className="mt-6 space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <CheckIcon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${isPro ? 'text-amber-600' : 'text-gray-900'}`} />
                      <span className="text-sm text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-8">
                <Button
                  onClick={() => handleSelectPlan(plan.tier as Subscription['tier'])}
                  disabled={isCurrentPlan}
                  size="lg"
                  className="w-full font-semibold px-4"
                  variant={buttonVariant}
                >
                  {buttonText}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};