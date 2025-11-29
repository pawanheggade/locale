import React, { useState, useReducer } from 'react';
import { Account } from '../types';
import { AlertIcon, SpinnerIcon, EnvelopeIcon, LockClosedIcon, GoogleIcon, AppleIcon } from './Icons';
import { InputWithIcon } from './InputWithIcon';
import { Button } from './ui/Button';
import { Avatar } from './Avatar';
import { FormField } from './FormField';
import { useIsMounted } from '../hooks/useIsMounted';

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

const initialState = {
    identifier: '',
    password: '',
    rememberMe: true,
    error: '',
};

type State = typeof initialState;
type Action =
    | { type: 'SET_FIELD'; field: 'identifier' | 'password'; payload: string }
    | { type: 'SET_REMEMBER_ME'; payload: boolean }
    | { type: 'SET_ERROR'; payload: string };

function reducer(state: State, action: Action): State {
    switch (action.type) {
        case 'SET_FIELD':
            return { ...state, [action.field]: action.payload, error: '' };
        case 'SET_REMEMBER_ME':
            return { ...state, rememberMe: action.payload };
        case 'SET_ERROR':
            return { ...state, error: action.payload };
        default:
            return state;
    }
}

export const SignInScreen: React.FC<SignInScreenProps> = ({ accounts, onLogin, onOpenCreateAccountModal, onOpenPasswordAssistanceModal, onSocialLogin, onOpenSellerAccountModal, onOpenTermsModal, onOpenPrivacyModal }) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { identifier, password, rememberMe, error } = state;
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProvider, setLoadingProvider] = useState<'google' | 'apple' | null>(null);
  const isMounted = useIsMounted();

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch({ type: 'SET_ERROR', payload: '' });
    setIsLoading(true);

    const trimmedIdentifier = identifier.trim().toLowerCase();
    const foundAccount = accounts.find(acc => 
        acc.username.toLowerCase() === trimmedIdentifier || acc.email.toLowerCase() === trimmedIdentifier
    );
    
    if (foundAccount && foundAccount.password === password) {
        if (foundAccount.status === 'active' || foundAccount.status === 'pending' || foundAccount.role === 'admin') {
            onLogin(foundAccount, rememberMe);
        } else if (foundAccount.status === 'archived') {
            if (foundAccount.archivedByAdmin) {
                dispatch({ type: 'SET_ERROR', payload: 'This account has been archived by an administrator. Please contact support.' });
                setIsLoading(false);
            } else {
                onLogin(foundAccount, rememberMe);
            }
        } else {
             dispatch({ type: 'SET_ERROR', payload: 'This account is currently inactive.' });
             setIsLoading(false);
        }
    } else {
        setTimeout(() => {
            if (isMounted()) {
                dispatch({ type: 'SET_ERROR', payload: 'Invalid username/email or password.' });
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
        {activeAccounts.length > 0 && (
            <div className="text-center">
                <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wider">Quick Sign in</h3>
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
                                <span className="text-xs font-medium text-gray-600 transition-colors w-16 truncate">{account.name.split(' ')[0]}</span>
                            </button>
                        );
                    })}
                </div>
            </div>
        )}
        
        {activeAccounts.length > 0 && (
            <div className="relative">
                <div className="absolute inset-0 flex items-center" aria-hidden="true"><div className="w-full border-t border-gray-200" /></div>
                <div className="relative flex justify-center text-sm"><span className="px-2 bg-white text-gray-600">Or use another account</span></div>
            </div>
        )}

        <form onSubmit={handleLoginSubmit} className="space-y-4">
            <FormField id="identifier" label="Username or Email">
                <InputWithIcon
                    type="text"
                    value={identifier}
                    onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'identifier', payload: e.target.value })}
                    icon={<EnvelopeIcon className="h-5 w-5 text-gray-400" />}
                    required
                    autoFocus={activeAccounts.length === 0}
                />
            </FormField>
            
            <FormField id="password" label="Password" error={error}>
                 <InputWithIcon
                    type="password"
                    value={password}
                    onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'password', payload: e.target.value })}
                    icon={<LockClosedIcon className="h-5 w-5 text-gray-400" />}
                    required
                />
            </FormField>

            <div className="flex items-center justify-between">
                <div className="flex items-center">
                    <input id="remember-me" name="remember-me" type="checkbox" checked={rememberMe} onChange={(e) => dispatch({ type: 'SET_REMEMBER_ME', payload: e.target.checked })} className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded" />
                    <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">Remember me</label>
                </div>
                <div className="text-sm">
                    <Button variant="link" size="sm" onClick={onOpenPasswordAssistanceModal} className="px-0 h-auto font-medium text-red-600">Forgot password?</Button>
                </div>
            </div>

            {error && (
                <div role="alert" className="bg-red-50 border border-red-200 text-red-800 p-3 rounded-md flex items-center gap-2">
                    <AlertIcon className="w-5 h-5 flex-shrink-0" />
                    <p className="text-sm">{error}</p>
                </div>
            )}

            <div>
                <Button type="submit" disabled={isLoading || !!loadingProvider} className="w-full h-12 text-base" variant="pill-red">
                    {isLoading ? <SpinnerIcon className="w-5 h-5" /> : <span>Sign in</span>}
                </Button>
            </div>
        </form>

        <div className="space-y-3">
             <div className="relative">
                <div className="absolute inset-0 flex items-center" aria-hidden="true"><div className="w-full border-t border-gray-200" /></div>
                <div className="relative flex justify-center text-sm"><span className="px-2 bg-white text-gray-600">Or social sign in</span></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
                <Button type="button" onClick={() => handleSocialClick('google')} disabled={isLoading || !!loadingProvider} variant="outline" className="w-full gap-2">
                    {loadingProvider === 'google' ? <SpinnerIcon className="w-5 h-5" /> : <><GoogleIcon className="w-5 h-5" /> <span>Google</span></>}
                </Button>
                <Button type="button" onClick={() => handleSocialClick('apple')} disabled={isLoading || !!loadingProvider} variant="pill-dark" className="w-full gap-2">
                    {loadingProvider === 'apple' ? <SpinnerIcon className="w-5 h-5" /> : <><AppleIcon className="w-5 h-5" /> <span>Apple</span></>}
                </Button>
            </div>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200 space-y-4">
            <div className="text-center text-base text-gray-800">
                <span>Don't have an account? </span>
                <Button variant="link" size="sm" onClick={onOpenCreateAccountModal} className="px-0 h-auto font-medium text-red-600 text-base">Sign up</Button>
            </div>
        </div>

        <div className="mt-2 text-center text-xs text-gray-600">
            By signing in, you agree to our{' '}
            <Button variant="link" size="sm" onClick={onOpenTermsModal} className="px-0 h-auto underline text-xs text-gray-600 hover:text-gray-900">Terms of Service</Button> and{' '}
            <Button variant="link" size="sm" onClick={onOpenPrivacyModal} className="px-0 h-auto underline text-xs text-gray-600 hover:text-gray-900">Privacy Policy</Button>.
        </div>
    </div>
  );
};