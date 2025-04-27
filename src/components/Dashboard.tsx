"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState, useCallback, useMemo } from "react";
import { Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger, SidebarFooter, SidebarInput } from "@/components/ui/sidebar";
import { Bar, BarChart, XAxis, YAxis, PieChart, Pie, Cell, Tooltip, Legend, LineChart, Line, CartesianGrid } from "recharts";
import { Button } from "@/components/ui/button";
import AccountManagement from "@/components/AccountManagement";
import TransactionManagement from "@/components/TransactionManagement";
import CategoryManagement from "@/components/CategoryManagement";
import Budgeting from "@/components/Budgeting";
import { Home, LayoutDashboard, List, PiggyBank, CircleDollarSign, PercentCircle, FileBarChart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from 'next/navigation';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import AccountTransactionsPage from "@/app/account/[id]/page";
import * as XLSX from 'xlsx';
import {CreditCard,Receipt,TrendingUp,ListChecks,Repeat,Wallet} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Topbar from "@/components/Topbar";
import { saveData, loadData } from "@/lib/db";
import { useTheme } from "@/components/theme-provider";

type CategoryExpense = {
    name: string;
    expenses: number;
}

const Dashboard = () => {
    const [totalBalance, setTotalBalance] = useState(0);
    const [recentTransactions, setRecentTransactions] = useState([]);
    const [activeView, setActiveView] = useState<
        | "dashboard"
        | "accounts"
        | "transactions"
        | "categories"
        | "budgeting"
        | "reports"
        | null
    >("dashboard");
    const [os, setOs] = useState<string | null>(null);
    const { toast } = useToast();
    const [data, setData] = useState<CategoryExpense[]>([]);
    const router = useRouter();
    const [showAccountTransactions, setShowAccountTransactions] = useState(false);
    const [accountReports, setAccountReports] = useState<any[]>([]); // State to hold account-specific reports
    const [loadingReports, setLoadingReports] = useState(false);
    const [selectedAccountForReport, setSelectedAccountForReport] = useState<string | null>(null); // Track selected account
    const [reportType, setReportType] = useState<string | null>(null);
    const [accounts, setAccounts] = useState<any[]>(() => {
        if (typeof window !== 'undefined') {
            const storedAccounts = localStorage.getItem('accounts');
            return storedAccounts ? JSON.parse(storedAccounts) : [
                { id: 'default-checking', name: 'Checking Account', balance: 10000, currency: 'USD', includeInTotal: true, isEditing: false },
                { id: 'default-savings', name: 'Savings Account', balance: 5000, currency: 'USD', includeInTotal: true, isEditing: false },
            ];
        }
        return [];
    });

    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);

    const updateTotalBalance = useCallback(() => {
        let accounts = [];
        if (typeof window !== 'undefined') {
            const storedAccounts = localStorage.getItem('accounts');
            accounts = storedAccounts ? JSON.parse(storedAccounts) : [];
        }
        const total = accounts.reduce((sum: number, account: any) => {
            return account.includeInTotal ? sum + account.balance : sum;
        }, 0);

        setTotalBalance(total);
    }, []);

    const updateRecentTransactions = useCallback(() => {
        let incomeTransactions = [];
        let expenseTransactions = [];
        if (typeof window !== 'undefined') {
            const storedIncomeTransactions = localStorage.getItem('incomeTransactions');
            const storedExpenseTransactions = localStorage.getItem('expenseTransactions');

            incomeTransactions = storedIncomeTransactions ? JSON.parse(storedIncomeTransactions) : [];
            expenseTransactions = storedExpenseTransactions ? JSON.parse(storedExpenseTransactions) : [];
        }

        // Combine and sort transactions by date
        const allTransactions = [...incomeTransactions, ...expenseTransactions].sort((a: any, b: any) => {
            return new Date(b.date).getTime() - new Date(a.date).getTime();
        });

        // Take the 5 most recent transactions
        setRecentTransactions(allTransactions.slice(0, 5));
    }, []);

    const detectOS = useCallback(() => {
        if (typeof window !== 'undefined') {
            const userAgent = window.navigator.userAgent;
            let operatingSystem = 'Unknown';

            if (userAgent.indexOf('Win') != -1) operatingSystem = 'Windows';
            if (userAgent.indexOf('Mac') != -1) operatingSystem = 'MacOS';
            if (userAgent.indexOf('Linux') != -1) operatingSystem = 'Linux';
            if (userAgent.indexOf('Android') != -1) operatingSystem = 'Android';
            if (userAgent.indexOf('iOS') != -1) operatingSystem = 'iOS';

            setOs(operatingSystem);
        }
    }, []);

    const updateDashboard = useCallback(() => {
        updateTotalBalance();
        updateRecentTransactions();
    }, [updateTotalBalance, updateRecentTransactions]);

    useEffect(() => {
        detectOS();
        updateDashboard();
    }, [detectOS, updateDashboard]);

    useEffect(() => {
        if (activeView === "dashboard") {
            updateDashboard();
        }
    }, [activeView, updateDashboard]);

    const handleSetActiveView = useCallback((view:
        | "dashboard"
        | "accounts"
        | "transactions"
        | "categories"
        | "budgeting"
        | "reports"
        | null) => {
        setActiveView(view);
        if (view === "dashboard") {
            updateDashboard();
        }
    }, [updateDashboard]);

    useEffect(() => {
        let expenseTransactions = [];
        if (typeof window !== 'undefined') {
            // Simulate fetching data for spending by category
            const storedExpenseTransactions = localStorage.getItem('expenseTransactions');
            expenseTransactions = storedExpenseTransactions ? JSON.parse(storedExpenseTransactions) : [];
        }

        // Group expenses by category
        const categoryExpenses: { [category: string]: number } = {};
        expenseTransactions.forEach((transaction: any) => {
            if (transaction.category && transaction.amount < 0) {
                const category = transaction.category;
                categoryExpenses[category] = (categoryExpenses[category] || 0) + Math.abs(transaction.amount);
            }
        });

        // Convert category expenses to the format required by recharts
        const chartData = Object.keys(categoryExpenses).map(category => ({
            name: category,
            expenses: categoryExpenses[category]
        }));

        setData(chartData);
    }, [activeView]);

    const generateAccountReports = useCallback(async (accountId: string | null = null, reportType: string | null = null) => {
        setLoadingReports(true);
        try {
            let accountsToReport: any[] = [];
            if (accountId) {
                // If an account ID is provided, only generate a report for that account
                const account = accounts.find(acc => acc.id === accountId);
                if (account) {
                    accountsToReport = [account];
                } else {
                    console.warn(`Account with ID ${accountId} not found.`);
                    toast({
                        title: "Error",
                        description: `Account with ID ${accountId} not found.`,
                        variant: "destructive",
                    });
                    return;
                }
            } else {
                // If no account ID is provided, generate reports for all accounts
                accountsToReport = accounts;
            }

            const reports = await Promise.all(accountsToReport.map(async (account: any) => {
                let incomeData = [];
                let expenseData = [];
                if (typeof window !== 'undefined') {
                    const incomeTransactions = localStorage.getItem(`incomeTransactions_${account.id}`);
                    const expenseTransactions = localStorage.getItem(`expenseTransactions_${account.id}`);

                    incomeData = incomeTransactions ? JSON.parse(incomeTransactions) : [];
                    expenseData = expenseTransactions ? JSON.parse(expenseTransactions) : [];
                }

                // Income vs Expenses
                let totalIncome = 0;
                let totalExpenses = 0;
                let spendingByCategory: { [key: string]: number } = {};
                let largestExpenses: any[] = [];

                if (!reportType || reportType === 'incomeVsExpenses') {
                    totalIncome = incomeData.reduce((sum: number, transaction: any) => sum + transaction.amount, 0);
                    totalExpenses = expenseData.reduce((sum: number, transaction: any) => sum + transaction.amount, 0);
                }

                if (!reportType || reportType === 'spendingByCategory') {
                    spendingByCategory = {};
                    expenseData.forEach((transaction: any) => {
                        if (transaction.category) {
                            spendingByCategory[transaction.category] = (spendingByCategory[transaction.category] || 0) + Math.abs(transaction.amount);
                        }
                    });
                }

                if (!reportType || reportType === 'largestExpenses') {
                    const sortedExpenses = [...expenseData].sort((a: any, b: any) => Math.abs(b.amount) - Math.abs(a.amount));
                    largestExpenses = sortedExpenses.slice(0, 5);
                }

                return {
                    accountId: account.id,
                    accountName: account.name,
                    incomeVsExpenses: { totalIncome, totalExpenses },
                    spendingByCategory: spendingByCategory,
                    largestExpenses: largestExpenses,
                };
            }));

            setAccountReports(reports);
        } catch (error) {
            console.error("Error generating reports:", error);
            toast({
                title: "Error",
                description: "Failed to generate reports.",
                variant: "destructive",
            });
        } finally {
            setLoadingReports(false);
        }
    }, [toast, accounts]);

    useEffect(() => {
        if (activeView === "reports") {
            generateAccountReports(selectedAccountForReport, reportType);
        }
    }, [activeView, generateAccountReports, selectedAccountForReport, reportType]);

    const exportToExcel = (report: any) => {
        const wb = XLSX.utils.book_new();

        // Income vs Expenses Sheet
        const incomeVsExpensesData = [
            ["Report", "Amount"],
            ["Total Income", report.incomeVsExpenses.totalIncome],
            ["Total Expenses", report.incomeVsExpenses.totalExpenses],
        ];
        const incomeVsExpensesSheet = XLSX.utils.aoa_to_sheet(incomeVsExpensesData);
        XLSX.utils.book_append_sheet(wb, incomeVsExpensesSheet, "Income vs Expenses");

        // Spending by Category Sheet
        const spendingByCategoryData = [["Category", "Amount"]];
        for (const category in report.spendingByCategory) {
            spendingByCategoryData.push([category, report.spendingByCategory[category]]);
        }
        const spendingByCategorySheet = XLSX.utils.aoa_to_sheet(spendingByCategoryData);
        XLSX.utils.book_append_sheet(wb, spendingByCategorySheet, "Spending by Category");

        // Largest Expenses Sheet
        const largestExpensesData = [["Description", "Amount"]];
        report.largestExpenses.forEach((expense: any) => {
            largestExpensesData.push([expense.description, expense.amount]);
        });
        const largestExpensesSheet = XLSX.utils.aoa_to_sheet(largestExpensesData);
        XLSX.utils.book_append_sheet(wb, largestExpensesSheet, "Largest Expenses");

        // Export
        XLSX.writeFile(wb, `${report.accountName}_report.xlsx`);
    };

    const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#af19ff'];

    const recentTransactionsList = useMemo(() => (
        <>
            {recentTransactions.map((transaction: any, index) => (
                <div key={transaction.id}>
                    <span>{transaction.description} - ${transaction.amount} ({new Date(transaction.date).toLocaleDateString()})</span>
                </div>
            ))}
        </>
    ), [recentTransactions]);
    return (
        <div className="flex h-screen bg-background">
            <Sidebar collapsible="icon">
                <SidebarHeader>
                    <Button variant="ghost" className="p-0 font-bold text-lg">
                        Money Flow
                    </Button>
                </SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton onClick={() => handleSetActiveView("dashboard")} isActive={activeView === "dashboard"}>
                            <Home />
                            <span>Dashboard</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <SidebarMenuButton onClick={() => handleSetActiveView("accounts")} isActive={activeView === "accounts"}>
                            <PiggyBank />
                            <span>Accounts</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <SidebarMenuButton onClick={() => handleSetActiveView("transactions")} isActive={activeView === "transactions"}>
                            <List />
                            <span>Transactions</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <SidebarMenuButton onClick={() => handleSetActiveView("categories")} isActive={activeView === "categories"}>
                            <LayoutDashboard />
                            <span>Categories</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <SidebarMenuButton onClick={() => handleSetActiveView("budgeting")} isActive={activeView === "budgeting"}>
                            <PercentCircle />
                            <span>Budgeting</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <SidebarMenuButton onClick={() => handleSetActiveView("reports")} isActive={activeView === "reports"}>
                            <FileBarChart />
                            <span>Reports</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
                <SidebarMenu className="mt-auto">

                </SidebarMenu>
                <SidebarFooter>
                    {os && <div>Running on: {os}</div>}
                </SidebarFooter>
            </Sidebar>

            <SidebarContent className="container py-8 flex-1">
                {activeView === "dashboard" && (
                    <>
                        <Card className="shadow-md rounded-lg">
                            <CardHeader>
                                <CardTitle>Total Balance</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">${totalBalance}</div>
                            </CardContent>
                        </Card>

                        <Card className="mt-4 shadow-md rounded-lg">
                            <CardHeader>
                                <CardTitle>Recent Transactions</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul>
                                    {recentTransactionsList}
                                </ul>
                            </CardContent>
                        </Card>
                        <Card className="mt-4 shadow-md rounded-lg">
                            <CardHeader>
                                <CardTitle>Spending by Category</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <BarChart width={500} height={300} data={data}>
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Bar dataKey="expenses" fill="hsl(var(--primary))" />
                                </BarChart>
                            </CardContent>
                        </Card>
                    </>
                )}

                {activeView === "accounts" && (
                    <AccountManagement updateTotalBalance={updateTotalBalance} />
                )}

                {activeView === "transactions" && (
                    <TransactionManagement />
                )}

                {activeView === "categories" && (
                    <CategoryManagement />
                )}

                {activeView === "budgeting" && (
                    <Budgeting />
                )}
                {activeView === "reports" && (
                    <>
                        <Card className="mb-4">
                            <CardHeader>
                                <CardTitle>Generate Account Reports</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid gap-2">
                                    <Select onValueChange={(value) => setSelectedAccountForReport(value)}>
                                        <SelectTrigger className="w-[240px]">
                                            <SelectValue placeholder="Select account" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value={null}>All Accounts</SelectItem>
                                            {accounts.map(account => (
                                                <SelectItem key={account.id} value={account.id}>{account.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Select onValueChange={(value) => setReportType(value)}>
                                        <SelectTrigger className="w-[240px]">
                                            <SelectValue placeholder="Select report type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value={null}>All Reports</SelectItem>
                                            <SelectItem value="incomeVsExpenses">Income vs Expenses</SelectItem>
                                            <SelectItem value="spendingByCategory">Spending by Category</SelectItem>
                                            <SelectItem value="largestExpenses">Largest Expenses</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Button onClick={() => generateAccountReports(selectedAccountForReport, reportType)}>Generate Reports</Button>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle>Account Reports</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {loadingReports ? (
                                    <div className="text-center">Loading reports...</div>
                                ) : (
                                    accountReports.map((report) => (
                                        <div key={report.accountId} className="border rounded-md p-4 shadow-sm">
                                            <h3 className="text-lg font-semibold mb-2">{report.accountName}</h3>

                                            {(!reportType || reportType === 'incomeVsExpenses') && (
                                                <div className="mb-4">
                                                    <h4 className="text-md font-semibold mb-1 flex items-center"><CreditCard className="mr-2 h-5 w-5" /> Income vs Expenses</h4>
                                                    <p>Total Income: <span className="font-medium">${report.incomeVsExpenses.totalIncome}</span></p>
                                                    <p>Total Expenses: <span className="font-medium">${report.incomeVsExpenses.totalExpenses}</span></p>
                                                </div>
                                            )}

                                            {(!reportType || reportType === 'spendingByCategory') && (
                                                <div className="mb-4">
                                                    <h4 className="text-md font-semibold mb-1 flex items-center"><TrendingUp className="mr-2 h-5 w-5" /> Spending by Category</h4>
                                                    <PieChart width={400} height={300}>
                                                        <Pie
                                                            data={Object.entries(report.spendingByCategory).map(([category, amount]) => ({ name: category, value: amount }))}
                                                            cx="50%"
                                                            cy="50%"
                                                            labelLine={false}
                                                            outerRadius={80}
                                                            fill="#8884d8"
                                                            dataKey="value"
                                                            label
                                                        >
                                                            {Object.entries(report.spendingByCategory).map(([, amount], index) => (
                                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                            ))}
                                                        </Pie>
                                                        <Tooltip />
                                                        <Legend />
                                                    </PieChart>
                                                </div>
                                            )}

                                            {(!reportType || reportType === 'largestExpenses') && (
                                                <div>
                                                    <h4 className="text-md font-semibold mb-1 flex items-center"><ListChecks className="mr-2 h-5 w-5" /> Largest Expenses</h4>
                                                    <ul className="list-disc pl-5">
                                                        {report.largestExpenses.map((expense: any) => (
                                                            <li key={expense.id}>
                                                                {expense.description} - ${Math.abs(expense.amount)}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                            
                                                <Button variant="outline" size="sm" onClick={() => exportToExcel(report)}>
                                                    <Receipt className="mr-2 h-4 w-4" />Export to Excel
                                                </Button>
                                            
                                        </div>
                                    ))
                                )}
                            </CardContent>
                        </Card>
                    </>
                )}
            </SidebarContent>
        </div>
    );
};

export default Dashboard;
