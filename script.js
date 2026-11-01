
// =====================================
// PERSONAL EXPENSE TRACKER
// =====================================

// HTML ELEMENTS
const form = document.getElementById("expense-form");
const descriptionInput = document.getElementById("description");
const amountInput = document.getElementById("amount");
const typeInput = document.getElementById("type");
const categoryInput = document.getElementById("category");
const dateInput = document.getElementById("date");
const submitBtn = document.getElementById("submitBtn");
const cancelEditBtn = document.getElementById("cancelEditBtn");

const balanceDisplay = document.getElementById("balance");
const incomeDisplay = document.getElementById("income");
const expensesDisplay = document.getElementById("expenses");

const transactionList = document.getElementById("transaction-list");
const searchInput = document.getElementById("searchInput");
const typeFilter = document.getElementById("typeFilter");
const categoryFilter = document.getElementById("categoryFilter");

let transactions = JSON.parse(localStorage.getItem("transactions")) || [];
let editingId = null;

let categoryChart = null;
let incomeExpenseChart = null;
let monthlyExpenseChart = null;

// =====================================
// HELPER FUNCTIONS
// =====================================

function formatCurrency(amount) {
    return Number(amount).toLocaleString("en-IN", {
        style: "currency",
        currency: "INR",
        minimumFractionDigits: 2
    });
}

function getCurrentMonthKey() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function getMonthKey(dateString) {
    return dateString.slice(0, 7);
}

function saveTransactions() {
    localStorage.setItem("transactions", JSON.stringify(transactions));
}

function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, function (character) {
        const entities = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        };
        return entities[character];
    });
}

function getTransactionTotals(list) {
    let income = 0;
    let expenses = 0;

    list.forEach(transaction => {
        if (transaction.type === "income") {
            income += Number(transaction.amount);
        } else {
            expenses += Number(transaction.amount);
        }
    });

    return {
        income,
        expenses,
        balance: income - expenses
    };
}

// =====================================
// ADD / EDIT TRANSACTION
// =====================================

form.addEventListener("submit", function (event) {
    event.preventDefault();

    const description = descriptionInput.value.trim();
    const amount = Number(amountInput.value);
    const type = typeInput.value;
    const category = categoryInput.value;
    const date = dateInput.value;

    if (!description || !Number.isFinite(amount) || amount <= 0 || !date) {
        alert("Please enter valid transaction details.");
        return;
    }

    if (editingId !== null) {
        const index = transactions.findIndex(item => item.id === editingId);

        if (index !== -1) {
            transactions[index] = {
                ...transactions[index],
                description,
                amount,
                type,
                category,
                date
            };
        }

        editingId = null;
        submitBtn.textContent = "Add Transaction";
        cancelEditBtn.hidden = true;
    } else {
        const transaction = {
            id: Date.now().toString() + Math.random().toString(16).slice(2),
            description,
            amount,
            type,
            category,
            date
        };

        transactions.push(transaction);
    }

    saveTransactions();
    form.reset();
    dateInput.value = new Date().toISOString().split("T")[0];

    updateDashboard();
});

cancelEditBtn.addEventListener("click", function () {
    resetForm();
});

function resetForm() {
    form.reset();
    dateInput.value = new Date().toISOString().split("T")[0];
    editingId = null;
    submitBtn.textContent = "Add Transaction";
    cancelEditBtn.hidden = true;
}

// =====================================
// DISPLAY TRANSACTIONS
// =====================================

function displayTransactions() {
    transactionList.innerHTML = "";

    const searchTerm = searchInput.value.toLowerCase();
    const selectedType = typeFilter.value;
    const selectedCategory = categoryFilter.value;

    const filteredTransactions = transactions.filter(transaction => {
        const matchesSearch =
            transaction.description.toLowerCase().includes(searchTerm) ||
            transaction.category.toLowerCase().includes(searchTerm);

        const matchesType =
            selectedType === "all" || transaction.type === selectedType;

        const matchesCategory =
            selectedCategory === "all" ||
            transaction.category === selectedCategory;

        return matchesSearch && matchesType && matchesCategory;
    });

    if (filteredTransactions.length === 0) {
        transactionList.innerHTML =
            '<tr><td colspan="6" class="empty-message">No transactions found.</td></tr>';
        return;
    }

    filteredTransactions
        .slice()
        .sort((a, b) => b.date.localeCompare(a.date))
        .forEach(transaction => {
            const row = document.createElement("tr");

            row.innerHTML = `
                <td>${escapeHTML(transaction.description)}</td>
                <td>${formatCurrency(transaction.amount)}</td>
                <td class="${transaction.type}">
                    ${escapeHTML(transaction.type)}
                </td>
                <td>${escapeHTML(transaction.category)}</td>
                <td>${escapeHTML(transaction.date)}</td>
                <td>
                    <button type="button" class="edit-btn"
                        data-id="${escapeHTML(transaction.id)}">Edit</button>
                    <button type="button" class="delete-btn"
                        data-id="${escapeHTML(transaction.id)}">Delete</button>
                </td>
            `;

            transactionList.appendChild(row);
        });
}

transactionList.addEventListener("click", function (event) {
    const id = event.target.dataset.id;

    if (!id) return;

    if (event.target.classList.contains("edit-btn")) {
        editTransaction(id);
    }

    if (event.target.classList.contains("delete-btn")) {
        deleteTransaction(id);
    }
});

// =====================================
// EDIT TRANSACTION
// =====================================

function editTransaction(id) {
    const transaction = transactions.find(item => item.id === id);

    if (!transaction) return;

    descriptionInput.value = transaction.description;
    amountInput.value = transaction.amount;
    typeInput.value = transaction.type;
    categoryInput.value = transaction.category;
    dateInput.value = transaction.date;

    editingId = id;
    submitBtn.textContent = "Update Transaction";
    cancelEditBtn.hidden = false;

    form.scrollIntoView({ behavior: "smooth" });
}

// =====================================
// DELETE TRANSACTION
// =====================================

function deleteTransaction(id) {
    const confirmDelete = confirm("Are you sure you want to delete this transaction?");

    if (!confirmDelete) return;

    transactions = transactions.filter(item => item.id !== id);

    saveTransactions();
    updateDashboard();
}

// =====================================
// DASHBOARD
// =====================================

function updateDashboard() {
    const totals = getTransactionTotals(transactions);

    balanceDisplay.textContent = formatCurrency(totals.balance);
    incomeDisplay.textContent = formatCurrency(totals.income);
    expensesDisplay.textContent = formatCurrency(totals.expenses);

    displayTransactions();
    updateCharts();
    updateDateRangeAnalysis();
    updateBudget();
    updateMonthlyAnalysis();
}

// =====================================
// SEARCH AND FILTER
// =====================================

searchInput.addEventListener("input", displayTransactions);
typeFilter.addEventListener("change", displayTransactions);
categoryFilter.addEventListener("change", displayTransactions);

// =====================================
// CHARTS
// =====================================

function updateCharts() {
    if (typeof Chart === "undefined") return;

    const expenseCategories = {};

    transactions
        .filter(item => item.type === "expense")
        .forEach(item => {
            expenseCategories[item.category] =
                (expenseCategories[item.category] || 0) + Number(item.amount);
        });

    const categoryLabels = Object.keys(expenseCategories);
    const categoryValues = Object.values(expenseCategories);

    if (categoryChart) categoryChart.destroy();

    categoryChart = new Chart(document.getElementById("categoryChart"), {
        type: "doughnut",
        data: {
            labels: categoryLabels,
            datasets: [{
                data: categoryValues,
                backgroundColor: [
                    "#2563eb", "#10b981", "#f59e0b",
                    "#ef4444", "#8b5cf6", "#06b6d4", "#64748b"
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true
        }
    });

    const totals = getTransactionTotals(transactions);

    if (incomeExpenseChart) incomeExpenseChart.destroy();

    incomeExpenseChart = new Chart(
        document.getElementById("incomeExpenseChart"),
        {
            type: "bar",
            data: {
                labels: ["Income", "Expenses"],
                datasets: [{
                    label: "Amount",
                    data: [totals.income, totals.expenses],
                    backgroundColor: ["#10b981", "#ef4444"]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                scales: {
                    y: { beginAtZero: true }
                }
            }
        }
    );
}

// =====================================
// CUSTOM DATE RANGE ANALYSIS
// =====================================

const startDateInput = document.getElementById("startDate");
const endDateInput = document.getElementById("endDate");
const analyzeBtn = document.getElementById("analyzeBtn");

const rangeIncome = document.getElementById("rangeIncome");
const rangeExpenses = document.getElementById("rangeExpenses");
const rangeBalance = document.getElementById("rangeBalance");

analyzeBtn.addEventListener("click", updateDateRangeAnalysis);

function updateDateRangeAnalysis() {
    const startDate = startDateInput.value;
    const endDate = endDateInput.value;

    if (!startDate || !endDate) {
        rangeIncome.textContent = formatCurrency(0);
        rangeExpenses.textContent = formatCurrency(0);
        rangeBalance.textContent = formatCurrency(0);
        return;
    }

    if (startDate > endDate) {
        alert("Start date cannot be after end date.");
        return;
    }

    const selectedTransactions = transactions.filter(item =>
        item.date >= startDate && item.date <= endDate
    );

    const totals = getTransactionTotals(selectedTransactions);

    rangeIncome.textContent = formatCurrency(totals.income);
    rangeExpenses.textContent = formatCurrency(totals.expenses);
    rangeBalance.textContent = formatCurrency(totals.balance);
}

// =====================================
// MONTHLY BUDGET MANAGEMENT
// =====================================

const monthlyBudgetInput = document.getElementById("monthlyBudgetInput");
const budgetMonthInput = document.getElementById("budgetMonthInput");
const saveBudgetBtn = document.getElementById("saveBudgetBtn");

const budgetAmount = document.getElementById("budgetAmount");
const budgetSpent = document.getElementById("budgetSpent");
const budgetRemaining = document.getElementById("budgetRemaining");
const budgetProgressBar = document.getElementById("budgetProgressBar");
const budgetMessage = document.getElementById("budgetMessage");

function getMonthlyBudgets() {
    try {
        const budgets = JSON.parse(localStorage.getItem("monthlyBudgets")) || {};
        return budgets && typeof budgets === "object" && !Array.isArray(budgets)
            ? budgets
            : {};
    } catch {
        return {};
    }
}

saveBudgetBtn.addEventListener("click", function () {
    const selectedMonth = budgetMonthInput.value;
    const budget = Number(monthlyBudgetInput.value);

    if (!selectedMonth) {
        alert("Please select a budget month.");
        return;
    }

    if (!Number.isFinite(budget) || budget <= 0) {
        alert("Please enter a valid budget amount.");
        return;
    }

    const budgets = getMonthlyBudgets();
    budgets[selectedMonth] = budget;

    localStorage.setItem("monthlyBudgets", JSON.stringify(budgets));

    updateBudget();
    alert("Monthly budget saved successfully!");
});

budgetMonthInput.addEventListener("change", updateBudget);

function updateBudget() {
    if (!budgetMonthInput.value) {
        budgetMonthInput.value = getCurrentMonthKey();
    }

    const selectedMonth = budgetMonthInput.value;
    const budgets = getMonthlyBudgets();
    const savedBudget = Number(budgets[selectedMonth]) || 0;

    monthlyBudgetInput.value = savedBudget || "";

    const monthExpenses = transactions
        .filter(item =>
            item.type === "expense" &&
            getMonthKey(item.date) === selectedMonth
        )
        .reduce((total, item) => total + Number(item.amount), 0);

    const remaining = savedBudget - monthExpenses;
    const percentage = savedBudget > 0
        ? (monthExpenses / savedBudget) * 100
        : 0;

    budgetAmount.textContent = formatCurrency(savedBudget);
    budgetSpent.textContent = formatCurrency(monthExpenses);
    budgetRemaining.textContent = formatCurrency(remaining);

    budgetProgressBar.style.width =
        `${Math.min(percentage, 100)}%`;

    if (savedBudget <= 0) {
        budgetMessage.textContent = "Set a budget to track your spending.";
        budgetProgressBar.style.width = "0%";
    } else if (percentage > 100) {
        budgetMessage.textContent =
            `You have exceeded your budget by ${formatCurrency(Math.abs(remaining))}.`;
    } else if (percentage >= 80) {
        budgetMessage.textContent =
            "Warning: You have used most of your monthly budget.";
    } else {
        budgetMessage.textContent =
            `You have used ${percentage.toFixed(1)}% of your monthly budget.`;
    }
}

// =====================================
// MONTHLY EXPENSE ANALYSIS
// =====================================

const monthlyIncomeDisplay = document.getElementById("monthlyIncome");
const monthlyExpensesDisplay = document.getElementById("monthlyExpenses");
const highestSpendingMonthDisplay =
    document.getElementById("highestSpendingMonth");

function updateMonthlyAnalysis() {
    const currentMonth = getCurrentMonthKey();

    const currentMonthTransactions = transactions.filter(item =>
        getMonthKey(item.date) === currentMonth
    );

    const currentTotals = getTransactionTotals(currentMonthTransactions);

    monthlyIncomeDisplay.textContent = formatCurrency(currentTotals.income);
    monthlyExpensesDisplay.textContent = formatCurrency(currentTotals.expenses);

    const monthlySpending = {};

    transactions
        .filter(item => item.type === "expense")
        .forEach(item => {
            const month = getMonthKey(item.date);
            monthlySpending[month] =
                (monthlySpending[month] || 0) + Number(item.amount);
        });

    const months = Object.keys(monthlySpending);

    if (months.length === 0) {
        highestSpendingMonthDisplay.textContent = "Not available";
    } else {
        const highestMonth = months.reduce((highest, month) =>
            monthlySpending[month] > monthlySpending[highest]
                ? month
                : highest
        );

        const [year, monthNumber] = highestMonth.split("-");
        const monthName = new Date(
            Number(year),
            Number(monthNumber) - 1
        ).toLocaleString("en-IN", { month: "long", year: "numeric" });

        highestSpendingMonthDisplay.textContent = monthName;
    }

    updateMonthlyChart(monthlySpending);
}

function updateMonthlyChart(monthlySpending) {
    if (typeof Chart === "undefined") return;

    const sortedMonths = Object.keys(monthlySpending).sort();

    const labels = sortedMonths.map(month => {
        const [year, monthNumber] = month.split("-");
        return new Date(
            Number(year),
            Number(monthNumber) - 1
        ).toLocaleString("en-IN", { month: "short", year: "numeric" });
    });

    const values = sortedMonths.map(month => monthlySpending[month]);

    if (monthlyExpenseChart) monthlyExpenseChart.destroy();

    monthlyExpenseChart = new Chart(
        document.getElementById("monthlyExpenseChart"),
        {
            type: "line",
            data: {
                labels,
                datasets: [{
                    label: "Monthly Expenses",
                    data: values,
                    borderColor: "#2563eb",
                    backgroundColor: "rgba(37, 99, 235, 0.15)",
                    fill: true,
                    tension: 0.3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                scales: {
                    y: { beginAtZero: true }
                }
            }
        }
    );
}

// =====================================
// CSV EXPORT
// =====================================

const exportBtn = document.getElementById("exportBtn");

exportBtn.addEventListener("click", function () {
    if (transactions.length === 0) {
        alert("There are no transactions to export.");
        return;
    }

    const headers = ["Description", "Amount", "Type", "Category", "Date"];

    const rows = transactions.map(item => [
        item.description,
        item.amount,
        item.type,
        item.category,
        item.date
    ]);

    function escapeCSV(value) {
        return `"${String(value).replace(/"/g, '""')}"`;
    }

    const csvContent = [
        headers.map(escapeCSV).join(","),
        ...rows.map(row => row.map(escapeCSV).join(","))
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], {
        type: "text/csv;charset=utf-8;"
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "expense-tracker-transactions.csv";

    document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(() => URL.revokeObjectURL(url), 1000);
});

// =====================================
// DATA BACKUP AND RESTORE
// =====================================

const backupDataBtn = document.getElementById("backupDataBtn");
const restoreDataBtn = document.getElementById("restoreDataBtn");
const restoreFileInput = document.getElementById("restoreFileInput");

// BACKUP DATA
backupDataBtn.addEventListener("click", function () {
    const backupData = {
        appName: "Personal Expense Tracker",
        backupVersion: 1,
        backupDate: new Date().toISOString(),
        transactions: transactions,
        monthlyBudgets: getMonthlyBudgets()
    };

    const jsonData = JSON.stringify(backupData, null, 4);

    const blob = new Blob([jsonData], {
        type: "application/json"
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `expense-tracker-backup-${getCurrentMonthKey()}.json`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(() => URL.revokeObjectURL(url), 1000);

    alert("Backup downloaded successfully!");
});

// OPEN FILE SELECTOR
restoreDataBtn.addEventListener("click", function () {
    restoreFileInput.click();
});

// RESTORE DATA
restoreFileInput.addEventListener("change", function (event) {
    const file = event.target.files[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = function (e) {
        try {
            const backupData = JSON.parse(e.target.result);

            if (
                !backupData ||
                !Array.isArray(backupData.transactions) ||
                !backupData.monthlyBudgets ||
                typeof backupData.monthlyBudgets !== "object" ||
                Array.isArray(backupData.monthlyBudgets)
            ) {
                throw new Error("Invalid backup file.");
            }

            const validTransactions = backupData.transactions.every(item =>
                item &&
                typeof item.description === "string" &&
                Number.isFinite(Number(item.amount)) &&
                Number(item.amount) > 0 &&
                ["income", "expense"].includes(item.type) &&
                typeof item.category === "string" &&
                typeof item.date === "string" &&
                /^\d{4}-\d{2}-\d{2}$/.test(item.date)
            );

            const validBudgets = Object.entries(backupData.monthlyBudgets).every(
                ([month, amount]) =>
                    /^\d{4}-\d{2}$/.test(month) &&
                    Number.isFinite(Number(amount)) &&
                    Number(amount) >= 0
            );

            if (!validTransactions || !validBudgets) {
                throw new Error("Backup data contains invalid records.");
            }

            const confirmRestore = confirm(
                "Restoring this backup will replace your current transactions and monthly budgets. Do you want to continue?"
            );

            if (!confirmRestore) return;

            // Ensure restored transactions have unique IDs.
            const restoredTransactions = backupData.transactions.map(item => ({
                ...item,
                id: String(item.id || (
                    Date.now().toString() + Math.random().toString(16).slice(2)
                )),
                amount: Number(item.amount)
            }));

            const restoredBudgets = {};

            Object.entries(backupData.monthlyBudgets).forEach(([month, amount]) => {
                restoredBudgets[month] = Number(amount);
            });

            localStorage.setItem(
                "transactions",
                JSON.stringify(restoredTransactions)
            );

            localStorage.setItem(
                "monthlyBudgets",
                JSON.stringify(restoredBudgets)
            );

            alert("Your data has been restored successfully!");

            location.reload();

        } catch (error) {
            alert(
                "Invalid backup file. Please select a valid Expense Tracker JSON backup."
            );
        } finally {
            restoreFileInput.value = "";
        }
    };

    reader.onerror = function () {
        alert("Unable to read this file. Please try again.");
        restoreFileInput.value = "";
    };

    reader.readAsText(file);
});

// =====================================
// INITIALIZE APPLICATION
// =====================================

dateInput.value = new Date().toISOString().split("T")[0];
budgetMonthInput.value = getCurrentMonthKey();

updateDashboard();
