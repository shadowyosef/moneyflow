"use client";
import { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, PaperClip, Plus, Edit, Trash, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogDescription,
    DialogFooter,
    DialogClose
} from "@/components/ui/dialog";
import { format } from 'date-fns';
import Topbar from "@/components/Topbar";
import { saveData, loadData } from "@/lib/db";

// Helper function to generate a unique ID
const generateUniqueId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

const TransactionManagement = ({ accountId: initialAccountId }: { accountId?: string }) => {
    const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>(initialAccountId ? [initialAccountId] : []);
    const [incomeTransactions, setIncomeTransactions] = useState<any[]>(() => {
        if (typeof window !== 'undefined') {
            let storedTransactions = localStorage.getItem('incomeTransactions');
            try {
                const parsedTransactions = storedTransactions ? JSON.parse(storedTransactions) : [
                    { id: generateUniqueId(), description: 'Salary', amount: 5000, date: new Date().toISOString(), account: 'Checking Account', category: 'Salary', isEditing: false },
                ];
                // Ensure dates are Date objects
                return parsedTransactions.map(transaction => ({
                    ...transaction,
                    date: new Date(transaction.date),
                    isEditing: false,
                }));
            } catch (error) {
                console.error("Error parsing income transactions from localStorage:", error);
                return [];
            }
        }
        return [];
    });

    const [expenseTransactions, setExpenseTransactions] = useState<any[]>(() => {
        if (typeof window !== 'undefined') {
            let storedTransactions = localStorage.getItem('expenseTransactions');
            try {
                const parsedTransactions = storedTransactions ? JSON.parse(storedTransactions) : [
                    { id: generateUniqueId(), description: 'Groceries', amount: -120, date: new Date().toISOString(), account: 'Food', category: 'Food', isEditing: false },
                ];
                // Ensure dates are Date objects
                return parsedTransactions.map(transaction => ({
                    ...transaction,
                    date: new Date(transaction.date),
                    isEditing: false,
                }));
            } catch (error) {
                console.error("Error parsing expense transactions from localStorage:", error);
                return [];
            }
        }
        return [];
    });

    const [newTransactionDescription, setNewTransactionDescription] = useState('');
    const [newTransactionAmount, setNewTransactionAmount] = useState('');
    const [newTransactionDate, setNewTransactionDate] = useState<Date | undefined>(new Date());
    const [newTransactionAccount, setNewTransactionAccount] = useState('');
    const [newTransactionCategory, setNewTransactionCategory] = useState('');
    const [newTransactionType, setNewTransactionType] = useState<'income' | 'expense' | ''>(''); // Default to expense
    const [newTransactionAttachment, setNewTransactionAttachment] = useState<string | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

    const [accounts, setAccounts] = useState<any[]>(() => {
        if (typeof window !== 'undefined') {
            const storedAccounts = localStorage.getItem('accounts');
            return storedAccounts ? JSON.parse(storedAccounts) : [];
        }
        return [];
    });

    const [incomeCategories, setIncomeCategories] = useState<string[]>(() => {
        if (typeof window !== 'undefined') {
            const storedIncomeCategories = localStorage.getItem('incomeCategories');
            return storedIncomeCategories ? JSON.parse(storedIncomeCategories) : ['Salary', 'Investments'];
        }
        return [];
    });

    const [expenseCategories, setExpenseCategories] = useState<string[]>(() => {
        if (typeof window !== 'undefined') {
            const storedExpenseCategories = localStorage.getItem('expenseCategories');
            return storedExpenseCategories ? JSON.parse(storedExpenseCategories) : ['Food', 'Rent', 'Transportation'];
        }
        return [];
    });

    const { toast } = useToast();

    useEffect(() => {
        // Store income transactions with dates as ISO strings
        localStorage.setItem('incomeTransactions', JSON.stringify(incomeTransactions.map(transaction => ({
            ...transaction,
            date: transaction.date.toISOString(),
        }))));
        // Store expense transactions with dates as ISO strings
        localStorage.setItem('expenseTransactions', JSON.stringify(expenseTransactions.map(transaction => ({
            ...transaction,
            date: transaction.date.toISOString(),
        }))));

        //Update the accounts whenever accounts changes in account management
        const storedAccounts = localStorage.getItem('accounts');
        setAccounts(storedAccounts ? JSON.parse(storedAccounts) : []);

        const storedIncomeCategories = localStorage.getItem('incomeCategories');
        setIncomeCategories(storedIncomeCategories ? JSON.parse(storedIncomeCategories) : ['Salary', 'Investments']);

        const storedExpenseCategories = localStorage.getItem('expenseCategories');
        setExpenseCategories(storedExpenseCategories ? JSON.parse(storedExpenseCategories) : ['Food', 'Rent', 'Transportation']);

    }, [incomeTransactions, expenseTransactions]);

    const filterTransactionsByAccount = useCallback((transactions: any[]) => {
        if (!selectedAccountIds || selectedAccountIds.length === 0) {
            return transactions;
        }

        return transactions.filter(transaction => {
            const account = accounts.find(acc => acc.name === transaction.account);
            return account && selectedAccountIds.includes(account.id);
        });
    }, [selectedAccountIds, accounts]);

    const filterTransactionsByCategory = useCallback((transactions: any[]) => {
         if (!selectedCategory) {
            return transactions;
        }

        return transactions.filter(transaction => {
            return transaction.category === selectedCategory;
        });
    }, [selectedCategory]);

    const handleCreateTransaction = async () => {
        if (!newTransactionType) {
            toast({
                title: "Error",
                description: "Transaction type is required.",
                variant: "destructive",
            });
            return;
        }
        if (!newTransactionDescription) {
            toast({
                title: "Error",
                description: "Transaction description is required.",
                variant: "destructive",
            });
            return;
        }
        if (!newTransactionAmount) {
            toast({
                title: "Error",
                description: "Transaction amount is required.",
                variant: "destructive",
            });
            return;
        }
        if (!newTransactionDate) {
            toast({
                title: "Error",
                description: "Transaction date is required.",
                variant: "destructive",
            });
            return;
        }
        if (!newTransactionAccount) {
            toast({
                title: "Error",
                description: "Transaction account is required.",
                variant: "destructive",
            });
            return;
        }
        if (!newTransactionCategory) {
            toast({
                title: "Error",
                description: "Transaction category is required.",
                variant: "destructive",
            });
            return;
        }

        const amount = parseFloat(newTransactionAmount);
        if (isNaN(amount)) {
            toast({
                title: "Error",
                description: "Transaction amount must be a number.",
                variant: "destructive",
            });
            return;
        }

        let attachmentBase64: string | null = null;

        if (newTransactionAttachment) {
            attachmentBase64 = newTransactionAttachment;
        }

        const newTransaction = {
            id: generateUniqueId(),
            description: newTransactionDescription,
            amount: amount,
            date: newTransactionDate,
            account: newTransactionAccount,
            category: newTransactionCategory,
            attachment: attachmentBase64, // Save the Base64 string
            isEditing: false,
        };

        if (newTransactionType === 'income') {
            setIncomeTransactions(prevIncomeTransactions => {
                const updatedIncomeTransactions = [...prevIncomeTransactions, newTransaction];
                return updatedIncomeTransactions
            });
        } else {
            setExpenseTransactions(prevExpenseTransactions => {
                const updatedExpenseTransactions = [...prevExpenseTransactions, newTransaction]
                return updatedExpenseTransactions;
            });
        }

        setNewTransactionDescription('');
        setNewTransactionAmount('');
        setNewTransactionDate(new Date());
        setNewTransactionAccount('');
        setNewTransactionCategory('');
        setNewTransactionType('');
        setNewTransactionAttachment(null);
        toast({
            title: "Transaction Created",
            description: "New transaction has been created successfully.",
        });
    };

    const handleEditTransaction = (id: string, type: 'income' | 'expense', updatedTransaction: any) => {
        if (type === 'income') {
            setIncomeTransactions(prevIncomeTransactions => {
                return prevIncomeTransactions.map(transaction =>
                    transaction.id === id ? { ...transaction, ...updatedTransaction, isEditing: false, date: new Date(updatedTransaction.date) } : transaction
                );
            });
        } else {
            setExpenseTransactions(prevExpenseTransactions => {
                return prevExpenseTransactions.map(transaction =>
                    transaction.id === id ? { ...transaction, ...updatedTransaction, isEditing: false, date: new Date(updatedTransaction.date) } : transaction
                );
            });
        }
        toast({
            title: "Transaction Updated",
            description: "Transaction has been updated successfully.",
        });
    };

    const handleDeleteTransaction = (id: string, type: 'income' | 'expense') => {
        if (type === 'income') {
            setIncomeTransactions(prevIncomeTransactions => {
                const updatedIncomeTransactions = prevIncomeTransactions.filter(transaction => transaction.id !== id);
                return updatedIncomeTransactions;
            });
        } else {
            setExpenseTransactions(prevExpenseTransactions => {
                const updatedExpenseTransactions = prevExpenseTransactions.filter(transaction => transaction.id !== id)
                return updatedExpenseTransactions;
            });
        }
        toast({
            title: "Transaction Deleted",
            description: "Transaction has been deleted successfully.",
        });
    };

    const handleStartEdit = (id: string, type: 'income' | 'expense') => {
        if (type === 'income') {
            setIncomeTransactions(prevIncomeTransactions => {
                return prevIncomeTransactions.map(transaction =>
                    transaction.id === id ? { ...transaction, isEditing: true } : transaction
                );
            });
        } else {
            setExpenseTransactions(prevExpenseTransactions => {
                return prevExpenseTransactions.map(transaction =>
                    transaction.id === id ? { ...transaction, isEditing: true } : transaction
                );
            });
        }
    };

    const handleCancelEdit = (id: string, type: 'income' | 'expense') => {
        if (type === 'income') {
            setIncomeTransactions(prevIncomeTransactions => {
                return prevIncomeTransactions.map(transaction =>
                    transaction.id === id ? { ...transaction, isEditing: false } : transaction
                );
            });
        } else {
            setExpenseTransactions(prevExpenseTransactions => {
                return prevExpenseTransactions.map(transaction =>
                    transaction.id === id ? { ...transaction, isEditing: false } : transaction
                );
            });
        }
    };

    const getTransactionsForAccount = (type: 'income' | 'expense'): any[] => {
        let transactions = type === 'income' ? incomeTransactions : expenseTransactions;
        transactions = filterTransactionsByAccount(transactions);
         transactions = filterTransactionsByCategory(transactions);
        return transactions;
    };
    const incomeTransactionsForAccount = getTransactionsForAccount('income');
    const expenseTransactionsForAccount = getTransactionsForAccount('expense');

    // Calculate totals
    const totalIncome = incomeTransactionsForAccount.reduce((sum, transaction) => sum + transaction.amount, 0);
    const totalExpenses = expenseTransactionsForAccount.reduce((sum, transaction) => sum + transaction.amount, 0);
    const totalBalance = totalIncome + totalExpenses;

     const handleAttachmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = () => {
            const base64String = reader.result as string;
            setNewTransactionAttachment(base64String);
        };
        reader.readAsDataURL(file);
    };

    return (
        <div>
            
                
                    
                        Filter by Account
                        <Select onValueChange={(value) => {
                            const selectedValues = value === "all" ? [] : [value];
                            setSelectedAccountIds(selectedValues);
                        }}
                            multiple>
                            <SelectTrigger className="w-[240px]">
                                <SelectValue placeholder="All Accounts" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Accounts</SelectItem>
                                {accounts.map(account => (
                                    <SelectItem key={account.id} value={account.id}>{account.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    
                     <Label htmlFor="transaction-category">Filter by Category</Label>
                        <Select onValueChange={(value) => setSelectedCategory(value)}>
                            <SelectTrigger className="w-[240px]">
                                <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={null}>All Categories</SelectItem>
                                {incomeCategories.map(category => (
                                    <SelectItem key={category} value={category}>{category}</SelectItem>
                                ))}
                                {expenseCategories.map(category => (
                                    <SelectItem key={category} value={category}>{category}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                
                
                    Total Income: ${totalIncome}
                    Total Expenses: ${totalExpenses}
                    Total Balance: ${totalBalance}
                
            

            <div className="flex">
                <Card className="w-1/2 mr-4">
                    <CardHeader>
                        <CardTitle>Income Transactions</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul>
                            {incomeTransactionsForAccount.map(transaction => (
                                <li key={transaction.id} className="py-2 border-b">
                                    <div className="flex justify-between items-center">
                                        {transaction.isEditing ? (
                                            <div>
                                                <Input
                                                    type="text"
                                                    placeholder="Description"
                                                    defaultValue={transaction.description}
                                                    className="max-w-[150px]"
                                                    onChange={(e) => {
                                                        setIncomeTransactions(prevIncomeTransactions => {
                                                            return prevIncomeTransactions.map(trans =>
                                                                trans.id === transaction.id ? { ...trans, description: e.target.value } : trans
                                                            );
                                                        });
                                                    }}
                                                />
                                                <Input
                                                    type="number"
                                                    placeholder="Amount"
                                                    defaultValue={transaction.amount}
                                                    className="max-w-[100px]"
                                                    onChange={(e) => {
                                                        setIncomeTransactions(prevIncomeTransactions => {
                                                            return prevIncomeTransactions.map(trans =>
                                                                trans.id === transaction.id ? { ...trans, amount: parseFloat(e.target.value) } : trans
                                                            );
                                                        });
                                                    }}
                                                />
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <Button
                                                            variant={"outline"}
                                                            className={cn(
                                                                "w-[140px] justify-start text-left font-normal",
                                                                !transaction.date && "text-muted-foreground"
                                                            )}
                                                        >
                                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                                            {transaction.date ? format(transaction.date, 'PPP') : <span>Pick a date</span>}
                                                        </Button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-auto p-0" align="start">
                                                        <Calendar
                                                            mode="single"
                                                            selected={transaction.date}
                                                            onSelect={(date) => {
                                                                setIncomeTransactions(prevIncomeTransactions => {
                                                                    return prevIncomeTransactions.map(trans =>
                                                                        trans.id === transaction.id ? { ...trans, date: date } : trans
                                                                    );
                                                                });
                                                            }}
                                                            disabled={(date) =>
                                                                date > new Date()
                                                            }
                                                            initialFocus
                                                        />
                                                    </PopoverContent>
                                                </Popover>
                                                {transaction.attachment && (
                                                    <img src={transaction.attachment} alt="Attachment" className="max-h-40 max-w-full" />
                                                )}
                                            </div>
                                        ) : (
                                            <div>
                                                {transaction.description} - {transaction.amount} ({format(transaction.date, 'PPP')})
                                                 {transaction.attachment && (
                                                    <img src={transaction.attachment} alt="Attachment" className="max-h-40 max-w-full" />
                                                )}
                                            </div>
                                        )}
                                        <div className="flex gap-2">
                                            {transaction.isEditing ? (
                                                <>
                                                    <Button variant="outline" size="sm" onClick={() => handleEditTransaction(transaction.id, 'income', {
                                                        description: incomeTransactionsForAccount.find(trans => trans.id === transaction.id)?.description,
                                                        amount: incomeTransactionsForAccount.find(trans => trans.id === transaction.id)?.amount,
                                                        date: incomeTransactionsForAccount.find(trans => trans.id === transaction.id)?.date,
                                                    })}>Save</Button>
                                                    <Button variant="ghost" size="sm" onClick={() => handleCancelEdit(transaction.id, 'income')}>Cancel</Button>
                                                </>
                                            ) : (
                                                <Button variant="outline" size="sm" onClick={() => handleStartEdit(transaction.id, 'income')}>Edit</Button>
                                            )}
                                            <Button variant="outline" size="sm" onClick={() => handleDeleteTransaction(transaction.id, 'income')}>Delete</Button>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>

                <Card className="w-1/2">
                    <CardHeader>
                        <CardTitle>Expense Transactions</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul>
                            {expenseTransactionsForAccount.map(transaction => (
                                <li key={transaction.id} className="py-2 border-b">
                                    <div className="flex justify-between items-center">
                                        {transaction.isEditing ? (
                                            <div>
                                                <Input
                                                    type="text"
                                                    placeholder="Description"
                                                    defaultValue={transaction.description}
                                                    className="max-w-[150px]"
                                                    onChange={(e) => {
                                                        setExpenseTransactions(prevExpenseTransactions => {
                                                            return prevExpenseTransactions.map(trans =>
                                                                trans.id === transaction.id ? { ...trans, description: e.target.value } : trans
                                                            );
                                                        });
                                                    }}
                                                />
                                                <Input
                                                    type="number"
                                                    placeholder="Amount"
                                                    defaultValue={transaction.amount}
                                                    className="max-w-[100px]"
                                                    onChange={(e) => {
                                                        setExpenseTransactions(prevExpenseTransactions => {
                                                            return prevExpenseTransactions.map(trans =>
                                                                trans.id === transaction.id ? { ...trans, amount: parseFloat(e.target.value) } : trans
                                                            );
                                                        });
                                                    }}
                                                />
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <Button
                                                            variant={"outline"}
                                                            className={cn(
                                                                "w-[140px] justify-start text-left font-normal",
                                                                !transaction.date && "text-muted-foreground"
                                                            )}
                                                        >
                                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                                            {transaction.date ? format(transaction.date, 'PPP') : <span>Pick a date</span>}
                                                        </Button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-auto p-0" align="start">
                                                        <Calendar
                                                            mode="single"
                                                            selected={transaction.date}
                                                            onSelect={(date) => {
                                                                setExpenseTransactions(prevExpenseTransactions => {
                                                                    return prevExpenseTransactions.map(trans =>
                                                                        trans.id === transaction.id ? { ...trans, date: date } : trans
                                                                    );
                                                                });
                                                            }}
                                                            disabled={(date) =>
                                                                date > new Date()
                                                            }
                                                            initialFocus
                                                        />
                                                    </PopoverContent>
                                                </Popover>
                                                  {transaction.attachment && (
                                                    <img src={transaction.attachment} alt="Attachment" className="max-h-40 max-w-full" />
                                                )}
                                            </div>
                                        ) : (
                                            <div>
                                                {transaction.description} - {transaction.amount} ({format(transaction.date, 'PPP')})
                                                  {transaction.attachment && (
                                                    <img src={transaction.attachment} alt="Attachment" className="max-h-40 max-w-full" />
                                                )}
                                            </div>
                                        )}
                                        <div className="flex gap-2">
                                            {transaction.isEditing ? (
                                                <>
                                                    <Button variant="outline" size="sm" onClick={() => handleEditTransaction(transaction.id, 'expense', {
                                                        description: expenseTransactionsForAccount.find(trans => trans.id === transaction.id)?.description,
                                                        amount: expenseTransactionsForAccount.find(trans => trans.id === transaction.id)?.amount,
                                                        date: expenseTransactionsForAccount.find(trans => trans.id === transaction.id)?.date,
                                                    })}>Save</Button>
                                                <Button variant="ghost" size="sm" onClick={() => handleCancelEdit(transaction.id, 'expense')}>Cancel</Button>
                                                </>
                                            ) : (
                                                <Button variant="outline" size="sm" onClick={() => handleStartEdit(transaction.id, 'expense')}>Edit</Button>
                                            )}
                                            <Button variant="outline" size="sm" onClick={() => handleDeleteTransaction(transaction.id, 'expense')}>Delete</Button>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>

                <Card className="mt-4">
                    <CardHeader>
                        <CardTitle>Create New Transaction</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-2">
                            <Label htmlFor="transaction-type">Type</Label>
                            <Select onValueChange={(value) => setNewTransactionType(value as 'income' | 'expense')}>
                                <SelectTrigger className="w-[240px]">
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="income">Income</SelectItem>
                                    <SelectItem value="expense">Expense</SelectItem>
                                </SelectContent>
                            </Select>
                            <Label htmlFor="transaction-description">Description</Label>
                            <Input
                                type="text"
                                id="transaction-description"
                                placeholder="Description"
                                value={newTransactionDescription}
                                onChange={(e) => setNewTransactionDescription(e.target.value)}
                            />
                            <Label htmlFor="transaction-amount">Amount</Label>
                            <Input
                                type="number"
                                id="transaction-amount"
                                placeholder="Amount"
                                value={newTransactionAmount}
                                onChange={(e) => setNewTransactionAmount(e.target.value)}
                            />
                            <Label>Date</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant={"outline"}
                                        className={cn(
                                            "w-[240px] justify-start text-left font-normal",
                                            !newTransactionDate && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {newTransactionDate ? format(newTransactionDate, 'PPP') : <span>Pick a date</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={newTransactionDate}
                                        onSelect={setNewTransactionDate}
                                        disabled={(date) =>
                                            date > new Date()
                                        }
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                            <Label htmlFor="transaction-account">Account</Label>
                            <Select onValueChange={(value) => setNewTransactionAccount(value)}>
                                <SelectTrigger className="w-[240px]">
                                    <SelectValue placeholder="Select account" />
                                </SelectTrigger>
                                <SelectContent>
                                    {accounts.map(account => (
                                        <SelectItem key={account.id} value={account.name}>{account.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Label htmlFor="transaction-category">Category</Label>
                            <Select onValueChange={(value) => setNewTransactionCategory(value)}>
                                <SelectTrigger className="w-[240px]">
                                    <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                                <SelectContent>
                                    {newTransactionType === 'income' ? (
                                        incomeCategories.map(category => (
                                            <SelectItem key={category} value={category}>{category}</SelectItem>
                                        ))
                                    ) : (
                                        expenseCategories.map(category => (
                                            <SelectItem key={category} value={category}>{category}</SelectItem>
                                        ))
                                    )}
                                </SelectContent>
                            </Select>
                            <Label htmlFor="transaction-attachment">Attachment</Label>
                            <Input
                                type="file"
                                id="transaction-attachment"
                                accept="image/*"
                                onChange={handleAttachmentChange}
                            />
                              {newTransactionAttachment && (
                                <img src={newTransactionAttachment} alt="Attachment" className="max-h-40 max-w-full" />
                            )}
                            <Button onClick={handleCreateTransaction}>Create Transaction</Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default TransactionManagement;
