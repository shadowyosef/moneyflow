"use client";
import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";

// Helper function to generate a unique ID
const generateUniqueId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

const Budgeting = () => {
    const [incomeBudgets, setIncomeBudgets] = useState(() => {
        if (typeof window !== 'undefined') {
            const storedBudgets = localStorage.getItem('incomeBudgets');
            return storedBudgets ? JSON.parse(storedBudgets) : [];
        }
        return [];
    });

    const [expenseBudgets, setExpenseBudgets] = useState(() => {
        if (typeof window !== 'undefined') {
            const storedBudgets = localStorage.getItem('expenseBudgets');
            return storedBudgets ? JSON.parse(storedBudgets) : [];
        }
        return [];
    });

    const [newIncomeBudgetCategory, setNewIncomeBudgetCategory] = useState('');
    const [newExpenseBudgetCategory, setNewExpenseBudgetCategory] = useState('');
    const [newBudgetLimit, setNewBudgetLimit] = useState('');
    const { toast } = useToast();

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

    useEffect(() => {
        localStorage.setItem('incomeBudgets', JSON.stringify(incomeBudgets));
        localStorage.setItem('expenseBudgets', JSON.stringify(expenseBudgets));
    }, [incomeBudgets, expenseBudgets]);

    useEffect(() => {
        const storedIncomeCategories = localStorage.getItem('incomeCategories');
        setIncomeCategories(storedIncomeCategories ? JSON.parse(storedIncomeCategories) : ['Salary', 'Investments']);

        const storedExpenseCategories = localStorage.getItem('expenseCategories');
        setExpenseCategories(storedExpenseCategories ? JSON.parse(storedExpenseCategories) : ['Food', 'Rent', 'Transportation']);
    }, []);

    const handleCreateIncomeBudget = () => {
        if (!newIncomeBudgetCategory) {
            toast({
                title: "Error",
                description: "Budget category is required.",
                variant: "destructive",
            });
            return;
        }

        if (incomeBudgets.some(budget => budget.category === newIncomeBudgetCategory)) {
            toast({
                title: "Error",
                description: "Budget category already exists.",
                variant: "destructive",
            });
            return;
        }
        if (!newBudgetLimit) {
            toast({
                title: "Error",
                description: "Budget limit is required.",
                variant: "destructive",
            });
            return;
        }

        const limit = parseFloat(newBudgetLimit);
        if (isNaN(limit)) {
            toast({
                title: "Error",
                description: "Budget limit must be a number.",
                variant: "destructive",
            });
            return;
        }

        const newBudget = {
            id: generateUniqueId(),
            category: newIncomeBudgetCategory,
            limit: limit,
            spent: 0,
        };
        setIncomeBudgets(prevBudgets => {
            const updatedBudgets = [...prevBudgets, newBudget];
            return updatedBudgets;
        });
        setNewIncomeBudgetCategory('');
        setNewBudgetLimit('');
        toast({
            title: "Budget Created",
            description: "New income budget has been created successfully.",
        });
    };

    const handleCreateExpenseBudget = () => {
        if (!newExpenseBudgetCategory) {
            toast({
                title: "Error",
                description: "Budget category is required.",
                variant: "destructive",
            });
            return;
        }

        if (expenseBudgets.some(budget => budget.category === newExpenseBudgetCategory)) {
            toast({
                title: "Error",
                description: "Budget category already exists.",
                variant: "destructive",
            });
            return;
        }
        if (!newBudgetLimit) {
            toast({
                title: "Error",
                description: "Budget limit is required.",
                variant: "destructive",
            });
            return;
        }

        const limit = parseFloat(newBudgetLimit);
        if (isNaN(limit)) {
            toast({
                title: "Error",
                description: "Budget limit must be a number.",
                variant: "destructive",
            });
            return;
        }

        const newBudget = {
            id: generateUniqueId(),
            category: newExpenseBudgetCategory,
            limit: limit,
            spent: 0,
        };
        setExpenseBudgets(prevBudgets => {
            const updatedBudgets = [...prevBudgets, newBudget];
            return updatedBudgets;
        });
        setNewExpenseBudgetCategory('');
        setNewBudgetLimit('');
        toast({
            title: "Budget Created",
            description: "New expense budget has been created successfully.",
        });
    };

    const handleDeleteIncomeBudget = (id: string) => {
        setIncomeBudgets(prevBudgets => {
            const updatedBudgets = prevBudgets.filter(budget => budget.id !== id);
            return updatedBudgets;
        });
        toast({
            title: "Budget Deleted",
            description: "Income budget has been deleted successfully.",
        });
    };

    const handleDeleteExpenseBudget = (id: string) => {
        setExpenseBudgets(prevBudgets => {
            const updatedBudgets = prevBudgets.filter(budget => budget.id !== id);
            return updatedBudgets;
        });
        toast({
            title: "Budget Deleted",
            description: "Expense budget has been deleted successfully.",
        });
    };

    return (
        <div className="flex">
            <Card className="w-1/2 mr-4">
                <CardHeader>
                    <CardTitle>Income Budgets</CardTitle>
                </CardHeader>
                <CardContent>
                    <ul>
                        {incomeBudgets.map(budget => (
                            <li key={budget.id} className="py-2 border-b">
                                <div className="flex justify-between items-center">
                                    <div>
                                        {budget.category} - ${budget.spent} / ${budget.limit}
                                        <Progress value={(budget.spent / budget.limit) * 100} />
                                    </div>
                                    <Button variant="outline" size="sm" onClick={() => handleDeleteIncomeBudget(budget.id)}>Delete</Button>
                                </div>
                            </li>
                        ))}
                    </ul>
                    <div className="mt-4">
                        <CardTitle>Create New Income Budget</CardTitle>
                        <div className="grid gap-2">
                            <Label htmlFor="budget-category">Category</Label>
                            <Select onValueChange={(value) => setNewIncomeBudgetCategory(value)}>
                                <SelectTrigger className="w-[240px]">
                                    <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                                <SelectContent>
                                    {incomeCategories.map(category => (
                                        <SelectItem key={category} value={category}>{category}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Label htmlFor="budget-limit">Budget Limit</Label>
                            <Input
                                type="number"
                                id="budget-limit"
                                placeholder="Budget Limit"
                                value={newBudgetLimit}
                                onChange={(e) => setNewBudgetLimit(e.target.value)}
                            />
                            <Button onClick={handleCreateIncomeBudget}>Create Budget</Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="w-1/2">
                <CardHeader>
                    <CardTitle>Expense Budgets</CardTitle>
                </CardHeader>
                <CardContent>
                    <ul>
                        {expenseBudgets.map(budget => (
                            <li key={budget.id} className="py-2 border-b">
                                <div className="flex justify-between items-center">
                                    <div>
                                        {budget.category} - ${budget.spent} / ${budget.limit}
                                        <Progress value={(budget.spent / budget.limit) * 100} />
                                    </div>
                                    <Button variant="outline" size="sm" onClick={() => handleDeleteExpenseBudget(budget.id)}>Delete</Button>
                                </div>
                            </li>
                        ))}
                    </ul>
                    <div className="mt-4">
                        <CardTitle>Create New Expense Budget</CardTitle>
                        <div className="grid gap-2">
                            <Label htmlFor="budget-category">Category</Label>
                            <Select onValueChange={(value) => setNewExpenseBudgetCategory(value)}>
                                <SelectTrigger className="w-[240px]">
                                    <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                                <SelectContent>
                                    {expenseCategories.map(category => (
                                        <SelectItem key={category} value={category}>{category}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Label htmlFor="budget-limit">Budget Limit</Label>
                            <Input
                                type="number"
                                id="budget-limit"
                                placeholder="Budget Limit"
                                value={newBudgetLimit}
                                onChange={(e) => setNewBudgetLimit(e.target.value)}
                            />
                            <Button onClick={handleCreateExpenseBudget}>Create Budget</Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default Budgeting;
