"use client";
import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";

// Helper function to generate a unique ID
const generateUniqueId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

const AccountManagement = ({ updateTotalBalance }: { updateTotalBalance: () => void }) => {
    const [accounts, setAccounts] = useState(() => {
        if (typeof window !== 'undefined') {
            const storedAccounts = localStorage.getItem('accounts');
            return storedAccounts ? JSON.parse(storedAccounts) : [
                { id: generateUniqueId(), name: 'Checking Account', balance: 10000, currency: 'USD', includeInTotal: true, isEditing: false },
                { id: generateUniqueId(), name: 'Savings Account', balance: 5000, currency: 'USD', includeInTotal: true, isEditing: false },
            ];
        }
        return [];
    });
    const [newAccountName, setNewAccountName] = useState('');
    const [newAccountBalance, setNewAccountBalance] = useState('');
    const [newAccountCurrency, setNewAccountCurrency] = useState('USD');
    const { toast } = useToast();

    useEffect(() => {
        localStorage.setItem('accounts', JSON.stringify(accounts));
        updateTotalBalance(); // Call updateTotalBalance after accounts are updated
    }, [accounts, updateTotalBalance]);

    const handleCreateAccount = () => {
        if (!newAccountName) {
            toast({
                title: "Error",
                description: "Account name is required.",
                variant: "destructive",
            });
            return;
        }

        if (accounts.some(account => account.name === newAccountName)) {
            toast({
                title: "Error",
                description: "Account name already exists.",
                variant: "destructive",
            });
            return;
        }
        if (!newAccountBalance) {
            toast({
                title: "Error",
                description: "Account balance is required.",
                variant: "destructive",
            });
            return;
        }
        const balance = parseFloat(newAccountBalance);
        if (isNaN(balance)) {
            toast({
                title: "Error",
                description: "Account balance must be a number.",
                variant: "destructive",
            });
            return;
        }

        const newAccount = {
            id: generateUniqueId(),
            name: newAccountName,
            balance: balance,
            currency: newAccountCurrency,
            includeInTotal: true,
            isEditing: false,
        };

        setAccounts(prevAccounts => {
            const updatedAccounts = [...prevAccounts, newAccount];
            return updatedAccounts;
        });

        setNewAccountName('');
        setNewAccountBalance('');
        toast({
            title: "Account Created",
            description: "New account has been created successfully.",
        });
    };

    const handleEditAccount = (id: string, updatedAccount: any) => {
        if (accounts.some(account => account.name === updatedAccount.name && account.id !== id)) {
            toast({
                title: "Error",
                description: "Account name already exists.",
                variant: "destructive",
            });
            return;
        }
        setAccounts(prevAccounts => {
            const updatedAccounts = prevAccounts.map(account =>
                account.id === id ? { ...account, ...updatedAccount, isEditing: false } : account
            );
            return updatedAccounts;
        });
        toast({
            title: "Account Updated",
            description: "Account has been updated successfully.",
        });
    };

    const handleDeleteAccount = (id: string) => {
        setAccounts(prevAccounts => {
            const updatedAccounts = prevAccounts.filter(account => account.id !== id);
            return updatedAccounts;
        });
        toast({
            title: "Account Deleted",
            description: "Account has been deleted successfully.",
        });
    };

    const handleIncludeInTotalChange = (id: string, include: boolean) => {
        setAccounts(prevAccounts => {
            const updatedAccounts = prevAccounts.map(account =>
                account.id === id ? { ...account, includeInTotal: include } : account
            );
            return updatedAccounts;
        });
    };

    const handleStartEdit = (id: string) => {
        setAccounts(prevAccounts => {
            const updatedAccounts = prevAccounts.map(account =>
                account.id === id ? { ...account, isEditing: true } : account
            );
            return updatedAccounts;
        });
    };

    const handleCancelEdit = (id: string) => {
        setAccounts(prevAccounts => {
            const updatedAccounts = prevAccounts.map(account =>
                account.id === id ? { ...account, isEditing: false } : account
            );
            return updatedAccounts;
        });
    };

    return (
        <div>
            <Card>
                <CardHeader>
                    <CardTitle>Account Management</CardTitle>
                </CardHeader>
                <CardContent>
                    <ul>
                        {accounts.map(account => (
                            <li key={account.id} className="py-2 border-b">
                                <div className="flex justify-between items-center">
                                    {account.isEditing ? (
                                        <div>
                                            <Input
                                                type="text"
                                                placeholder="Name"
                                                defaultValue={account.name}
                                                className="max-w-[150px]"
                                                onChange={(e) => {
                                                    setAccounts(prevAccounts => {
                                                        return prevAccounts.map(acc =>
                                                            acc.id === account.id ? { ...acc, name: e.target.value } : acc
                                                        );
                                                    });
                                                }}
                                            />
                                            <Input
                                                type="number"
                                                placeholder="Balance"
                                                defaultValue={account.balance}
                                                className="max-w-[100px]"
                                                onChange={(e) => {
                                                    setAccounts(prevAccounts => {
                                                        return prevAccounts.map(acc =>
                                                            acc.id === account.id ? { ...acc, balance: parseFloat(e.target.value) } : acc
                                                        );
                                                    });
                                                }}
                                            />
                                            <Input
                                                type="text"
                                                placeholder="Currency"
                                                defaultValue={account.currency}
                                                className="max-w-[80px]"
                                                onChange={(e) => {
                                                    setAccounts(prevAccounts => {
                                                        return prevAccounts.map(acc =>
                                                            acc.id === account.id ? { ...acc, currency: e.target.value } : acc
                                                        );
                                                    });
                                                }}
                                            />
                                        </div>
                                    ) : (
                                        <div>
                                            {account.name} - {account.currency} {account.balance}
                                        </div>
                                    )}
                                    <div className="flex gap-2">
                                        {account.isEditing ? (
                                            <>
                                                <Button variant="outline" size="sm" onClick={() => handleEditAccount(account.id, {
                                                    name: accounts.find(acc => acc.id === account.id)?.name,
                                                    balance: accounts.find(acc => acc.id === account.id)?.balance,
                                                    currency: accounts.find(acc => acc.id === account.id)?.currency
                                                })}>Save</Button>
                                                <Button variant="ghost" size="sm" onClick={() => handleCancelEdit(account.id)}>Cancel</Button>
                                            </>
                                        ) : (
                                            <Button variant="outline" size="sm" onClick={() => handleStartEdit(account.id)}>Edit</Button>
                                        )}
                                        <div className="flex items-center space-x-2">
                                            <Label htmlFor={`include-in-total-${account.id}`}>Include in Total</Label>
                                            <Switch
                                                id={`include-in-total-${account.id}`}
                                                checked={account.includeInTotal}
                                                onCheckedChange={(checked) => handleIncludeInTotalChange(account.id, checked)}
                                            />
                                        </div>
                                        <Button variant="outline" size="sm" onClick={() => handleDeleteAccount(account.id)}>Delete</Button>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                    <div className="mt-4">
                        <CardTitle>Create New Account</CardTitle>
                        <div className="grid gap-2">
                            <Label htmlFor="account-name">Account Name</Label>
                            <Input
                                type="text"
                                id="account-name"
                                placeholder="Account Name"
                                value={newAccountName}
                                onChange={(e) => setNewAccountName(e.target.value)}
                            />
                            <Label htmlFor="account-balance">Account Balance</Label>
                            <Input
                                type="number"
                                id="account-balance"
                                placeholder="Account Balance"
                                value={newAccountBalance}
                                onChange={(e) => setNewAccountBalance(e.target.value)}
                            />
                            <Label htmlFor="account-currency">Account Currency</Label>
                            <Input
                                type="text"
                                id="account-currency"
                                placeholder="Currency"
                                value={newAccountCurrency}
                                onChange={(e) => setNewAccountCurrency(e.target.value)}
                            />
                            <Button onClick={handleCreateAccount}>Create Account</Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default AccountManagement;
