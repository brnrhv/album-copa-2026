"use client";

import { useState } from "react";
import { useAppContext } from "../context/AppContext";
import ExpenseModal from "../components/ExpenseModal";

export default function ExpensesPage() {
  const { expenses, addExpense, deleteExpense, isHydrated } = useAppContext();
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (!isHydrated) return <div className="animate-pulse h-screen bg-surface"></div>;

  const totalSpent = expenses.reduce((acc, curr) => acc + curr.amountSpent, 0);
  const totalPacks = expenses.reduce((acc, curr) => acc + curr.packsBought, 0);
  const averageCostPerPack = totalPacks > 0 ? (totalSpent / totalPacks).toFixed(2) : "0.00";

  // Sort expenses by date descending
  const sortedExpenses = [...expenses].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-display-lg text-display-lg text-on-surface mb-2">Expenses</h1>
          <p className="font-body-md text-on-surface-variant">Track how much you're spending on your sticker collection.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-secondary text-on-secondary px-6 py-3 rounded-lg font-label-sm hover:bg-secondary/90 transition-colors shadow-lg glow-blue"
        >
          <span className="material-symbols-outlined">add</span>
          ADD EXPENSE
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6 rounded-xl border-l-4 border-l-secondary">
          <p className="font-label-sm text-on-primary-container mb-1">TOTAL SPENT</p>
          <p className="font-display-lg text-on-surface">${totalSpent.toFixed(2)}</p>
        </div>
        <div className="glass-card p-6 rounded-xl border-l-4 border-l-tertiary">
          <p className="font-label-sm text-on-primary-container mb-1">PACKS BOUGHT</p>
          <p className="font-display-lg text-on-surface">{totalPacks}</p>
        </div>
        <div className="glass-card p-6 rounded-xl border-l-4 border-l-surface-container-high">
          <p className="font-label-sm text-on-primary-container mb-1">AVG COST / PACK</p>
          <p className="font-display-lg text-on-surface">${averageCostPerPack}</p>
        </div>
      </div>

      <div className="glass-card rounded-xl overflow-hidden">
        <div className="p-6 border-b border-outline-variant">
          <h2 className="font-headline-md text-on-surface">Expense History</h2>
        </div>
        
        {sortedExpenses.length === 0 ? (
          <div className="p-12 text-center">
            <span className="material-symbols-outlined text-6xl text-on-surface-variant mb-4 opacity-50">receipt_long</span>
            <h3 className="font-headline-md text-on-surface">No expenses logged yet</h3>
            <p className="text-on-primary-container mt-2">Add your first purchase to start tracking.</p>
          </div>
        ) : (
          <div className="divide-y divide-outline-variant/30">
            {sortedExpenses.map(expense => (
              <div key={expense.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-surface-container-lowest transition-colors">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-surface-container rounded-full flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-secondary">shopping_bag</span>
                  </div>
                  <div>
                    <h3 className="font-body-md font-bold text-on-surface">{expense.description}</h3>
                    <p className="font-label-sm text-on-primary-container">{new Date(expense.date).toLocaleDateString()}</p>
                    {expense.notes && <p className="font-label-sm text-on-surface-variant mt-1 italic">{expense.notes}</p>}
                  </div>
                </div>
                <div className="flex items-center justify-between md:justify-end gap-6 md:w-auto w-full pl-16 md:pl-0">
                  <div className="text-left md:text-right">
                    <p className="font-headline-md text-on-surface">${expense.amountSpent.toFixed(2)}</p>
                    <p className="font-label-sm text-tertiary">{expense.packsBought} packs</p>
                  </div>
                  <button 
                    onClick={() => deleteExpense(expense.id)}
                    className="text-on-surface-variant hover:text-error transition-colors"
                    title="Delete expense"
                  >
                    <span className="material-symbols-outlined">delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ExpenseModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={addExpense}
      />
    </div>
  );
}
