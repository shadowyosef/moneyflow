"use client";
import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const CategoryManagement = () => {
    const [incomeCategories, setIncomeCategories] = useState(() => {
        if (typeof window !== 'undefined') {
            const storedIncomeCategories = localStorage.getItem('incomeCategories');
            return storedIncomeCategories ? JSON.parse(storedIncomeCategories) : ['Salary', 'Investments'];
        }
        return [];
    });
    const [expenseCategories, setExpenseCategories] = useState(() => {
        if (typeof window !== 'undefined') {
            const storedExpenseCategories = localStorage.getItem('expenseCategories');
            return storedExpenseCategories ? JSON.parse(storedExpenseCategories) : ['Food', 'Rent', 'Transportation'];
        }
        return [];
    });
    const [newIncomeCategory, setNewIncomeCategory] = useState('');
    const [newExpenseCategory, setNewExpenseCategory] = useState('');
    const [editingIncomeCategory, setEditingIncomeCategory] = useState('');
    const [editingExpenseCategory, setEditingExpenseCategory] = useState('');
    const [editedIncomeCategoryName, setEditedIncomeCategoryName] = useState('');
    const [editedExpenseCategoryName, setEditedExpenseCategoryName] = useState('');
    const { toast } = useToast();

    useEffect(() => {
        localStorage.setItem('incomeCategories', JSON.stringify(incomeCategories));
    }, [incomeCategories]);

    useEffect(() => {
        localStorage.setItem('expenseCategories', JSON.stringify(expenseCategories));
    }, [expenseCategories]);

    const handleCreateIncomeCategory = () => {
        if (!newIncomeCategory) {
            toast({
                title: "Error",
                description: "Income category name is required.",
                variant: "destructive",
            });
            return;
        }

         if (incomeCategories.includes(newIncomeCategory)) {
            toast({
                title: "Error",
                description: "Income category already exists.",
                variant: "destructive",
            });
            return;
        }

        setIncomeCategories(prevIncomeCategories => {
            const updatedIncomeCategories = [...prevIncomeCategories, newIncomeCategory];
            return updatedIncomeCategories;
        });
        setNewIncomeCategory('');
        toast({
            title: "Income Category Created",
            description: "New income category has been created successfully.",
        });
    };

    const handleCreateExpenseCategory = () => {
        if (!newExpenseCategory) {
            toast({
                title: "Error",
                description: "Expense category name is required.",
                variant: "destructive",
            });
            return;
        }

         if (expenseCategories.includes(newExpenseCategory)) {
            toast({
                title: "Error",
                description: "Expense category already exists.",
                variant: "destructive",
            });
            return;
        }
        setExpenseCategories(prevExpenseCategories => {
            const updatedExpenseCategories = [...prevExpenseCategories, newExpenseCategory];
            return updatedExpenseCategories
        });
        setNewExpenseCategory('');
        toast({
            title: "Expense Category Created",
            description: "New expense category has been created successfully.",
        });
    };

    const handleDeleteIncomeCategory = (category: string) => {
        setIncomeCategories(prevIncomeCategories => {
            const updatedIncomeCategories = prevIncomeCategories.filter(cat => cat !== category);
            return updatedIncomeCategories;
        });
        toast({
            title: "Income Category Deleted",
            description: "Income category has been deleted successfully.",
        });
    };

    const handleDeleteExpenseCategory = (category: string) => {
        setExpenseCategories(prevExpenseCategories => {
            const updatedExpenseCategories = prevExpenseCategories.filter(cat => cat !== category);
            return updatedExpenseCategories;
        });
        toast({
            title: "Expense Category Deleted",
            description: "Expense category has been deleted successfully.",
        });
    };

    const handleStartEditIncomeCategory = (category: string) => {
        setEditingIncomeCategory(category);
        setEditedIncomeCategoryName(category);
    };

    const handleStartEditExpenseCategory = (category: string) => {
        setEditingExpenseCategory(category);
        setEditedExpenseCategoryName(category);
    };

    const handleCancelEditIncomeCategory = () => {
        setEditingIncomeCategory('');
        setEditedIncomeCategoryName('');
    };

    const handleCancelEditExpenseCategory = () => {
        setEditingExpenseCategory('');
        setEditedExpenseCategoryName('');
    };

    const handleSaveIncomeCategory = (originalCategory: string) => {

         if (!editedIncomeCategoryName) {
            toast({
                title: "Error",
                description: "Income category name cannot be empty.",
                variant: "destructive",
            });
            return;
        }

         if (incomeCategories.some(category => category === editedIncomeCategoryName && category !== originalCategory)) {
            toast({
                title: "Error",
                description: "Income category already exists.",
                variant: "destructive",
            });
            return;
        }
        setIncomeCategories(prevIncomeCategories => {
            const updatedIncomeCategories = prevIncomeCategories.map(cat =>
                cat === originalCategory ? editedIncomeCategoryName : cat
            );
            return updatedIncomeCategories;
        });
        setEditingIncomeCategory('');
        setEditedIncomeCategoryName('');
        toast({
            title: "Income Category Updated",
            description: "Income category has been updated successfully.",
        });
    };

    const handleSaveExpenseCategory = (originalCategory: string) => {
         if (!editedExpenseCategoryName) {
            toast({
                title: "Error",
                description: "Expense category name cannot be empty.",
                variant: "destructive",
            });
            return;
        }

         if (expenseCategories.some(category => category === editedExpenseCategoryName && category !== originalCategory)) {
            toast({
                title: "Error",
                description: "Expense category already exists.",
                variant: "destructive",
            });
            return;
        }
        setExpenseCategories(prevExpenseCategories => {
            const updatedExpenseCategories = prevExpenseCategories.map(cat =>
                cat === originalCategory ? editedExpenseCategoryName : cat
            );
            return updatedExpenseCategories;
        });
        setEditingExpenseCategory('');
        setEditedExpenseCategoryName('');
        toast({
            title: "Expense Category Updated",
            description: "Expense category has been updated successfully.",
        });
    };

    return (
        <div className="flex">
            <Card className="w-1/2 mr-4">
                <CardHeader>
                    <CardTitle>Income Categories</CardTitle>
                </CardHeader>
                <CardContent>
                    <ul>
                        {incomeCategories.map(category => (
                            <li key={category} className="py-2 border-b flex justify-between items-center">
                                {editingIncomeCategory === category ? (
                                    <div className="flex gap-2">
                                        <Input
                                            type="text"
                                            placeholder="Category Name"
                                            value={editedIncomeCategoryName}
                                            onChange={(e) => setEditedIncomeCategoryName(e.target.value)}
                                        />
                                        <Button variant="outline" size="sm" onClick={() => handleSaveIncomeCategory(category)}>Save</Button>
                                        <Button variant="ghost" size="sm" onClick={handleCancelEditIncomeCategory}>Cancel</Button>
                                    </div>
                                ) : (
                                    <>
                                        {category}
                                        <div>
                                            <Button variant="outline" size="sm" onClick={() => handleStartEditIncomeCategory(category)}>Edit</Button>
                                            <Button variant="outline" size="sm" onClick={() => handleDeleteIncomeCategory(category)}>Delete</Button>
                                        </div>
                                    </>
                                )}
                            </li>
                        ))}
                    </ul>
                    <div className="mt-4">
                        <Label htmlFor="income-category">New Income Category</Label>
                        <div className="flex gap-2">
                            <Input
                                type="text"
                                id="income-category"
                                placeholder="Income Category"
                                value={newIncomeCategory}
                                onChange={(e) => setNewIncomeCategory(e.target.value)}
                            />
                            <Button onClick={handleCreateIncomeCategory}>Create</Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="w-1/2">
                <CardHeader>
                    <CardTitle>Expense Categories</CardTitle>
                </CardHeader>
                <CardContent>
                    <ul>
                        {expenseCategories.map(category => (
                            <li key={category} className="py-2 border-b flex justify-between items-center">
                                {editingExpenseCategory === category ? (
                                    <div className="flex gap-2">
                                        <Input
                                            type="text"
                                            placeholder="Category Name"
                                            value={editedExpenseCategoryName}
                                            onChange={(e) => setEditedExpenseCategoryName(e.target.value)}
                                        />
                                        <Button variant="outline" size="sm" onClick={() => handleSaveExpenseCategory(category)}>Save</Button>
                                        <Button variant="ghost" size="sm" onClick={handleCancelEditExpenseCategory}>Cancel</Button>
                                    </div>
                                ) : (
                                    <>
                                        {category}
                                        <div>
                                            <Button variant="outline" size="sm" onClick={() => handleStartEditExpenseCategory(category)}>Edit</Button>
                                            <Button variant="outline" size="sm" onClick={() => handleDeleteExpenseCategory(category)}>Delete</Button>
                                        </div>
                                    </>
                                )}
                            </li>
                        ))}
                    </ul>
                    <div className="mt-4">
                        <Label htmlFor="expense-category">New Expense Category</Label>
                        <div className="flex gap-2">
                            <Input
                                type="text"
                                id="expense-category"
                                placeholder="Expense Category"
                                value={newExpenseCategory}
                                onChange={(e) => setNewExpenseCategory(e.target.value)}
                            />
                            <Button onClick={handleCreateExpenseCategory}>Create</Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default CategoryManagement;
