
import React, { useState } from 'react';
import { Account, Subscription } from '../../types';
import { PencilIcon, CheckIcon, XMarkIcon, ArrowUturnLeftIcon, ArchiveBoxIcon } from '../Icons';
import { formatFullDate } from '../../utils/formatters';
import { SubscriptionBadge } from '../SubscriptionBadge';
import { useSort } from '../../hooks/useSort';
import { Button } from '../ui/Button';
import { DataTable } from './DataTable';
import { Avatar } from '../Avatar';
import { Select } from '../ui/Select';

interface AccountsViewProps {
    accounts: Account[];
    currentAccount: Account;
    onDeleteAccount: (account: Account) => void;
    onUpdateAccountRole: (accountId: string, role: 'account' | 'admin') => void;
    onEditAccount: (account: Account) => void;
    onToggleAccountStatus: (account: Account) => void;
    onApproveAccount: (accountId: string) => void;
    onRejectAccount: (account: Account) => void;
    onUpdateSubscription: (accountId: string, tier: Subscription['tier']) => void;
}

export const AccountsView: React.FC<AccountsViewProps> = ({ accounts, onDeleteAccount, onUpdateAccountRole, onEditAccount, onToggleAccountStatus, onApproveAccount, onRejectAccount, onUpdateSubscription, currentAccount }) => {
    const { items: sortedAccounts, requestSort, sortConfig } = useSort(accounts, { key: 'joinDate', direction: 'desc' });
    const [editingSubscription, setEditingSubscription] = useState<{ accountId: string; tier: Subscription['tier'] } | null>(null);

    const handleSubscriptionChange = (accountId: string, newTier: Subscription['tier']) => {
        onUpdateSubscription(accountId, newTier);
        setEditingSubscription(null);
    };

    const columns = [
        { header: 'Name', sortKey: 'name' as keyof Account },
        { header: 'Status', sortKey: 'status' as keyof Account },
        { header: 'Role', sortKey: 'role' as keyof Account },
        { header: 'Subscription' },
        { header: 'Joined', sortKey: 'joinDate' as keyof Account },
        { header: 'Actions', className: 'relative px-6 py-3' },
    ];

    const renderRow = (account: Account) => {
        const isCurrentUser = account.id === currentAccount.id;
        
        return (
             <tr key={account.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                            <Avatar src={account.avatarUrl} alt={account.name} size="md" tier={account.subscription.tier} />
                        </div>
                        <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{account.name}</div>
                            <div className="text-sm text-gray-500">@{account.username}</div>
                        </div>
                    </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        account.status === 'active' ? 'bg-green-100 text-green-800' :
                        account.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        account.status === 'archived' ? 'bg-gray-100 text-gray-800' : 'bg-red-100 text-red-800'
                    }`}>
                        {account.status}
                    </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {isCurrentUser ? account.role : (
                        <div className="w-28">
                            <Select 
                                value={account.role} 
                                onChange={(e) => onUpdateAccountRole(account.id, e.target.value as 'account' | 'admin')} 
                                className="py-1 h-9 text-xs"
                            >
                                <option value="account">Account</option>
                                <option value="admin">Admin</option>
                            </Select>
                        </div>
                    )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {editingSubscription?.accountId === account.id ? (
                        <div className="w-36">
                             <Select 
                                value={editingSubscription.tier} 
                                onChange={(e) => handleSubscriptionChange(account.id, e.target.value as Subscription['tier'])} 
                                onBlur={() => setEditingSubscription(null)} 
                                autoFocus 
                                className="py-1 h-9 text-xs"
                            >
                                <option value="Personal">Personal</option>
                                <option value="Basic">Basic</option>
                                <option value="Verified">Verified</option>
                                <option value="Business">Business</option>
                                <option value="Business Pro">Business Pro</option>
                            </Select>
                        </div>
                    ) : (
                        <button onClick={() => setEditingSubscription({ accountId: account.id, tier: account.subscription.tier })} className="p-1 rounded-full transition-colors hover:bg-gray-100"><SubscriptionBadge tier={account.subscription.tier} /></button>
                    )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatFullDate(account.joinDate)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                        {account.status === 'pending' && (
                            <>
                                <Button variant="outline" size="icon-sm" onClick={() => onApproveAccount(account.id)} className="text-green-600 border-green-200 hover:bg-green-50" title="Approve"><CheckIcon className="w-4 h-4"/></Button>
                                <Button variant="outline" size="icon-sm" onClick={() => onRejectAccount(account)} className="text-red-600 border-red-200 hover:bg-red-50" title="Reject"><XMarkIcon className="w-4 h-4"/></Button>
                            </>
                        )}
                        <Button variant="outline" size="icon-sm" onClick={() => onEditAccount(account)} className="text-gray-600 hover:bg-gray-50" title="Edit"><PencilIcon className="w-4 h-4"/></Button>
                        {!isCurrentUser && (
                            <Button variant="outline" size="icon-sm" onClick={() => onToggleAccountStatus(account)} className="text-gray-600 hover:bg-gray-50" title={account.status === 'active' ? 'Archive' : 'Reactivate'}>{account.status === 'active' ? <ArchiveBoxIcon className="w-4 h-4"/> : <ArrowUturnLeftIcon className="w-4 h-4"/>}</Button>
                        )}
                    </div>
                </td>
            </tr>
        );
    };

    return <DataTable columns={columns} data={sortedAccounts} renderRow={renderRow} sortConfig={sortConfig} requestSort={requestSort as any} />;
};
