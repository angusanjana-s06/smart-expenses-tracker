const expenseForm = document.querySelector("#expense-form");
const expenseNameInput = document.querySelector("#expense-name");
const expenseAmountInput = document.querySelector("#expense-amount");
const expenseCategoryInput = document.querySelector("#expense-category");
const expenseDateInput = document.querySelector("#expense-date");
const expenseList = document.querySelector("#expense-list");
const expenseTotal = document.querySelector("#expense-total");
const entryEyebrow = document.querySelector(".entry-panel .eyebrow");
const entryHeading = document.querySelector("#entry-heading");
const submitIcon = document.querySelector("#submit-icon");
const submitLabel = document.querySelector("#submit-label");
const cancelEditButton = document.querySelector("#cancel-edit-button");
const expenseSearch = document.querySelector("#expense-search");
const categoryFilter = document.querySelector("#category-filter");
const dashboardTotal = document.querySelector("#dashboard-total");
const expenseCount = document.querySelector("#expense-count");
const highestExpense = document.querySelector("#highest-expense");
const averageExpense = document.querySelector("#average-expense");
const categorySummary = document.querySelector("#category-summary");

const API_URL = "http://127.0.0.1:5000/api/expenses";
const expenses = [];
let editingExpenseId = null;

function getLocalDateString() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatAmount(amount) {
  return amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatDate(dateString) {
  const [year, month, day] = dateString.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getFilteredExpenses() {
  const searchText = expenseSearch.value.trim().toLowerCase();
  const selectedCategory = categoryFilter.value;

  return expenses.filter((expense) => {
    const matchesName = expense.name.toLowerCase().includes(searchText);
    const matchesCategory =
      selectedCategory === "" || expense.category === selectedCategory;
    return matchesName && matchesCategory;
  });
}

function renderDashboard() {
  const total = expenses.reduce(
    (sum, expense) => sum + Number(expense.amount),
    0,
  );
  const highest = expenses.reduce(
    (largest, expense) => Math.max(largest, Number(expense.amount)),
    0,
  );

  dashboardTotal.textContent = formatAmount(total);
  expenseCount.textContent = String(expenses.length);
  highestExpense.textContent = formatAmount(highest);
  averageExpense.textContent = formatAmount(
    expenses.length === 0 ? 0 : total / expenses.length,
  );

  const totalsByCategory = new Map();
  expenses.forEach((expense) => {
    const categoryTotal =
      (totalsByCategory.get(expense.category) || 0) + Number(expense.amount);
    totalsByCategory.set(expense.category, categoryTotal);
  });

  categorySummary.replaceChildren();
  if (totalsByCategory.size === 0) {
    const emptyMessage = document.createElement("li");
    emptyMessage.textContent = "No expenses to summarize yet.";
    categorySummary.append(emptyMessage);
    return;
  }

  [...totalsByCategory.entries()]
    .sort((first, second) => second[1] - first[1])
    .forEach(([category, amount]) => {
      const item = document.createElement("li");
      const name = document.createElement("span");
      const categoryTotal = document.createElement("strong");
      name.textContent = category;
      categoryTotal.textContent = formatAmount(amount);
      item.append(name, categoryTotal);
      categorySummary.append(item);
    });
}

function renderExpenses() {
  expenseList.replaceChildren();
  const visibleExpenses = getFilteredExpenses();

  if (visibleExpenses.length === 0) {
    const row = document.createElement("tr");
    row.className = "empty-row";

    const message = document.createElement("td");
    message.colSpan = 5;
    message.textContent =
      expenses.length === 0
        ? "No expenses yet. Add your first record above."
        : "No expenses match your search or category filter.";

    row.append(message);
    expenseList.append(row);
  } else {
    visibleExpenses.forEach((expense) => {
      const row = document.createElement("tr");
      const nameCell = document.createElement("td");
      const categoryCell = document.createElement("td");
      const dateCell = document.createElement("td");
      const amountCell = document.createElement("td");
      const actionsCell = document.createElement("td");
      const categoryBadge = document.createElement("span");

      nameCell.textContent = expense.name;
      categoryBadge.className = "category-badge";
      categoryBadge.textContent = expense.category;
      categoryCell.append(categoryBadge);
      dateCell.textContent = formatDate(expense.date);
      amountCell.className = "amount-cell";
      amountCell.textContent = formatAmount(Number(expense.amount));

      actionsCell.className = "actions-cell";
      const editButton = document.createElement("button");
      editButton.type = "button";
      editButton.className = "row-action-button";
      editButton.textContent = "Edit";
      editButton.addEventListener("click", () => startEditingExpense(expense));

      const deleteButton = document.createElement("button");
      deleteButton.type = "button";
      deleteButton.className = "row-action-button delete-button";
      deleteButton.textContent = "Delete";
      deleteButton.addEventListener("click", () => {
        deleteExpense(expense.id, deleteButton);
      });
      actionsCell.append(editButton, deleteButton);

      row.append(nameCell, categoryCell, dateCell, amountCell, actionsCell);
      expenseList.append(row);
    });
  }

  const total = expenses.reduce(
    (sum, expense) => sum + Number(expense.amount),
    0,
  );
  expenseTotal.textContent = formatAmount(total);
  renderDashboard();
}

function startEditingExpense(expense) {
  editingExpenseId = expense.id;
  expenseNameInput.value = expense.name;
  expenseAmountInput.value = expense.amount;
  expenseAmountInput.setCustomValidity("");
  expenseCategoryInput.value = expense.category;
  expenseDateInput.value = expense.date;
  entryEyebrow.textContent = "EDIT RECORD";
  entryHeading.textContent = "Edit an expense";
  submitIcon.hidden = true;
  submitLabel.textContent = "Save changes";
  cancelEditButton.hidden = false;
  expenseNameInput.focus();
}

function resetExpenseForm() {
  editingExpenseId = null;
  expenseForm.reset();
  expenseDateInput.value = getLocalDateString();
  expenseAmountInput.setCustomValidity("");
  entryEyebrow.textContent = "NEW RECORD";
  entryHeading.textContent = "Add an expense";
  submitIcon.hidden = false;
  submitLabel.textContent = "Add expense";
  cancelEditButton.hidden = true;
}

async function deleteExpense(expenseId, deleteButton) {
  deleteButton.disabled = true;

  try {
    const response = await fetch(`${API_URL}/${expenseId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error(`Deleting expense failed (${response.status}).`);
    }

    const expenseIndex = expenses.findIndex(
      (expense) => expense.id === expenseId,
    );
    if (expenseIndex !== -1) {
      if (editingExpenseId === expenseId) {
        resetExpenseForm();
      }
      expenses.splice(expenseIndex, 1);
      renderExpenses();
    }
  } catch (error) {
    console.error("Could not delete expense from the backend:", error);
    alert("Could not delete the expense. Make sure the backend is running.");
    deleteButton.disabled = false;
  }
}

async function loadExpenses() {
  try {
    const response = await fetch(API_URL);
    if (!response.ok) {
      throw new Error(`Loading expenses failed (${response.status}).`);
    }

    const savedExpenses = await response.json();
    expenses.splice(0, expenses.length, ...savedExpenses.reverse());
    renderExpenses();
  } catch (error) {
    console.error("Could not load expenses from the backend:", error);
    alert("Could not load expenses. Make sure the backend is running.");
  }
}

expenseDateInput.value = getLocalDateString();

expenseForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!expenseForm.reportValidity()) {
    return;
  }

  const amount = Number(expenseAmountInput.value);
  if (!Number.isFinite(amount) || amount <= 0) {
    expenseAmountInput.setCustomValidity("Enter an amount greater than zero.");
    expenseAmountInput.reportValidity();
    return;
  }

  expenseAmountInput.setCustomValidity("");
  const newExpense = {
    name: expenseNameInput.value.trim(),
    amount,
    category: expenseCategoryInput.value,
    date: expenseDateInput.value,
  };

  try {
    const isEditing = editingExpenseId !== null;
    const response = await fetch(
      isEditing ? `${API_URL}/${editingExpenseId}` : API_URL,
      {
        method: isEditing ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newExpense),
      },
    );

    if (!response.ok) {
      throw new Error(
        `${isEditing ? "Updating" : "Saving"} expense failed (${response.status}).`,
      );
    }

    const savedExpense = await response.json();
    if (isEditing) {
      const expenseIndex = expenses.findIndex(
        (expense) => expense.id === editingExpenseId,
      );
      if (expenseIndex !== -1) {
        expenses[expenseIndex] = savedExpense;
      }
    } else {
      expenses.unshift(savedExpense);
    }
    renderExpenses();
    resetExpenseForm();
    expenseNameInput.focus();
  } catch (error) {
    console.error("Could not save expense to the backend:", error);
    alert("Could not save changes. Make sure the backend is running.");
  }
});

cancelEditButton.addEventListener("click", resetExpenseForm);

expenseSearch.addEventListener("input", renderExpenses);
categoryFilter.addEventListener("change", renderExpenses);

expenseAmountInput.addEventListener("input", () => {
  expenseAmountInput.setCustomValidity("");
});

document.querySelector(".page-note").textContent =
  "Your records are saved in the backend database.";

loadExpenses();
