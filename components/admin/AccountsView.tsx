
import React from 'react';
import { Account, Subscription } from '../../types';
import { PencilIcon, CheckIcon, XMarkIcon, ArrowUturnLeftIcon, ArchiveBoxIcon } from '../Icons';
import { formatFullDate } from '../../utils/formatters';
import { useSort } from '../../hooks/useSort';
import { Button } from '../ui/Button';
import { DataTable } from './DataTable';
import { Avatar } from '../Avatar';
import { Dropdown } from '../ui/Dropdown';

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
    onViewAccount: (account: Account) => void;
}

export const AccountsView: React.FC<AccountsViewProps> = ({ accounts, onDeleteAccount, onUpdateAccountRole, onEditAccount, onToggleAccountStatus, onApproveAccount, onRejectAccount, onUpdateSubscription, currentAccount, onViewAccount }) => {
    const { items: sortedAccounts, requestSort, sortConfig } = useSort(accounts, { key: 'joinDate', direction: 'desc' });
    
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
                    <button
                        onClick={() => onViewAccount(account)}
                        className="flex items-center text-left group focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-red-500 rounded-md"
                    >
                        <div className="flex-shrink-0 h-10 w-10">
                            <Avatar src={account.avatarUrl} alt={account.name} size="md" tier={account.subscription.tier} />
                        </div>
                        <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 group-hover:text-red-600 transition-colors">{account.name}</div>
                            <div className="text-sm text-gray-600">@{account.username}</div>
                        </div>
                    </button>
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
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {isCurrentUser ? <span className="capitalize ml-2">{account.role}</span> : (
                        <Dropdown
                            items={[{value: 'account', label: 'Account'}, {value: 'admin', label: 'Admin'}]}
                            selectedValue={account.role}
                            onSelect={(newRole) => onUpdateAccountRole(account.id, newRole as 'account' | 'admin')}
                            className="w-28"
                            variant="overlay"
                        />
                    )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    <Dropdown
                        items={[
                            {value: 'Personal', label: 'Personal'},
                            {value: 'Basic', label: 'Basic'},
                            {value: 'Verified', label: 'Verified'},
                            {value: 'Business', label: 'Business'},
                            {value: 'Organisation', label: 'Organisation'},
                        ]}
                        selectedValue={account.subscription.tier}
                        onSelect={(newTier) => onUpdateSubscription(account.id, newTier as Subscription['tier'])}
                        className="w-36"
                        variant="overlay"
                    />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{formatFullDate(account.joinDate)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                        {account.status === 'pending' && (
                            <>
                                <Button variant="overlay-dark" size="icon-sm" onClick={() => onApproveAccount(account.id)} className="text-green-600" title="Approve"><CheckIcon className="w-4 h-4"/></Button>
                                <Button variant="overlay-red" size="icon-sm" onClick={() => onRejectAccount(account)} className="text-red-600" title="Reject"><XMarkIcon className="w-4 h-4"/></Button>
                            </>
                        )}
                        <Button variant="overlay-dark" size="icon-sm" onClick={() => onEditAccount(account)} className="text-gray-600" title="Edit"><PencilIcon className="w-4 h-4"/></Button>
                        {!isCurrentUser && (
                            <Button variant="overlay-dark" size="icon-sm" onClick={() => onToggleAccountStatus(account)} className="text-gray-600" title={account.status === 'active' ? 'Archive' : 'Reactivate'}>{account.status === 'active' ? <ArchiveBoxIcon className="w-4 h-4"/> : <ArrowUturnLeftIcon className="w-4 h-4"/>}</Button>
                        )}
                    </div>
                </td>
            </tr>
        );
    };

    return <DataTable columns={columns} data={sortedAccounts} renderRow={renderRow} sortConfig={sortConfig} requestSort={requestSort as any} />;
};
