
import React, { useState, useRef, useEffect } from 'react';
import { Account } from '../types';
import { AlertIcon, SpinnerIcon, EnvelopeIcon, LockClosedIcon } from './Icons';
import { InputWithIcon } from './InputWithIcon';
import { Button } from './ui/Button';
import { Avatar } from './Avatar';

interface SignInScreenProps {
  accounts: Account[];
  onLogin: (account: Account, rememberMe: boolean) => void;
  onOpenCreateAccountModal: () => void;
  onOpenPasswordAssistanceModal: () => void;
  onSocialLogin: (provider: 'google' | 'apple') => void;
  onOpenSellerAccountModal: () => void;
  onOpenTermsModal: () => void;
  onOpenPrivacyModal: () => void;
}

export const SignInScreen: React.FC<SignInScreenProps> = ({ accounts, onLogin, onOpenCreateAccountModal, onOpenPasswordAssistanceModal, onSocialLogin, onOpenSellerAccountModal, onOpenTermsModal, onOpenPrivacyModal }) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProvider, setLoadingProvider] = useState<'google' | 'apple' | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const trimmedIdentifier = identifier.trim().toLowerCase();
    const foundAccount = accounts.find(acc => 
        acc.username.toLowerCase() === trimmedIdentifier || acc.email.toLowerCase() === trimmedIdentifier
    );
    
    if (foundAccount && foundAccount.password === password) {
        if (foundAccount.status === 'active' || foundAccount.status === 'pending' || foundAccount.role === 'admin') {
            onLogin(foundAccount, rememberMe);
            // Do not set isLoading to false here, as the component will unmount immediately.
        } else if (foundAccount.status === 'archived') {
            setError('This account has been archived.');
            setIsLoading(false);
        } else {
             setError('This account is currently inactive.');
             setIsLoading(false);
        }
    } else {
        setTimeout(() => {
            if (isMountedRef.current) {
                setError('Invalid username/email or password.');
                setIsLoading(false);
            }
        }, 500);
    }
  };

  const handleSocialClick = (provider: 'google' | 'apple') => {
    if (isLoading || loadingProvider) return;
    setLoadingProvider(provider);
    onSocialLogin(provider);
  };
  
  const activeAccounts = accounts.filter(acc => acc.status === 'active' || acc.role === 'admin');

  return (
    <div className="animate-fade-in space-y-6">
        {/* Quick Login Section */}
        {activeAccounts.length > 0 && (
            <div className="text-center">
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Quick Sign in</h3>
                <div className="mt-4 flex overflow-x-auto pb-4 gap-4 hide-scrollbar">
                    {activeAccounts.map(account => {
                        return (
                            <button key={account.id} onClick={() => onLogin(account, true)} className="flex flex-col items-center gap-2 group focus:outline-none flex-shrink-0" aria-label={`Sign in as ${account.name}`}>
                                <Avatar 
                                    src={account.avatarUrl} 
                                    alt={account.name} 
                                    size="xl" 
                                    tier={account.subscription.tier}
                                    className="group-focus:ring-2 group-focus:ring-red-500 group-focus:ring-offset-2 transition-all"
                                />
                                <span className="text-xs font-medium text-gray-700 transition-colors w-16 truncate">{account.name.split(' ')[0]}</span>
                            </button>
                        );
                    })}
                </div>
            </div>
        )}
        
        {/* Separator */}
        {activeAccounts.length > 0 && (
            <div className="relative">
                <div className="absolute inset-0 flex items-center" aria-hidden="true"><div className="w-full border-t border-gray-200" /></div>
                <div className="relative flex justify-center text-sm"><span className="px-2 bg-white text-gray-700">Or use another account</span></div>
            </div>
        )}

        {/* Main Login Form */}
        <form onSubmit={handleLoginSubmit} className="space-y-4">
            <InputWithIcon
                id="identifier"
                label="Username or Email"
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                icon={<EnvelopeIcon className="h-5 w-5 text-gray-400" />}
                required
                autoFocus={activeAccounts.length === 0}
            />
            
            <InputWithIcon
                id="password"
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                icon={<LockClosedIcon className="h-5 w-5 text-gray-400" />}
                required
            />

            <div className="flex items-center justify-between">
                <div className="flex items-center">
                    <input id="remember-me" name="remember-me" type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded" />
                    <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">Remember me</label>
                </div>
                <div className="text-sm">
                    <button type="button" onClick={onOpenPasswordAssistanceModal} className="font-medium text-red-600 focus:outline-none focus:underline">Forgot password?</button>
                </div>
            </div>

            {error && (
                <div role="alert" className="bg-red-50 border border-red-200 text-red-800 p-3 rounded-md flex items-center gap-2">
                    <AlertIcon className="w-5 h-5 flex-shrink-0" />
                    <p className="text-sm">{error}</p>
                </div>
            )}

            <div>
                <Button type="submit" disabled={isLoading || !!loadingProvider} className="w-full h-12 text-base" variant="glass-red">
                    {isLoading ? <SpinnerIcon className="w-5 h-5" /> : <span>Sign in</span>}
                </Button>
            </div>
        </form>

        {/* Social Logins */}
        <div className="space-y-3">
             <div className="relative">
                <div className="absolute inset-0 flex items-center" aria-hidden="true"><div className="w-full border-t border-gray-200" /></div>
                <div className="relative flex justify-center text-sm"><span className="px-2 bg-white text-gray-700">Or social sign in</span></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
                <Button type="button" onClick={() => handleSocialClick('google')} disabled={isLoading || !!loadingProvider} variant="glass" className="w-full">
                    {loadingProvider === 'google' ? <SpinnerIcon className="w-5 h-5" /> : <span>Google</span>}
                </Button>
                <Button type="button" onClick={() => handleSocialClick('apple')} disabled={isLoading || !!loadingProvider} variant="glass-dark" className="w-full">
                    {loadingProvider === 'apple' ? <SpinnerIcon className="w-5 h-5" /> : <span>Apple</span>}
                </Button>
            </div>
        </div>

        {/* Sign Up Section */}
        <div className="mt-6 pt-6 border-t border-gray-200 space-y-4">
            <div className="text-center text-base text-gray-800">
                <span>Don't have an account? </span>
                <button onClick={onOpenCreateAccountModal} className="font-medium text-red-600 focus:outline-none focus:underline">Sign up</button>
            </div>
        </div>

        {/* Footer */}
        <div className="mt-2 text-center text-xs text-gray-700">
            By signing in, you agree to our{' '}
            <button onClick={onOpenTermsModal} className="underline">Terms of Service</button> and{' '}
            <button onClick={onOpenPrivacyModal} className="underline">Privacy Policy</button>.
        </div>
    </div>
  );
};
