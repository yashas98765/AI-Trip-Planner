import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaWallet,
  FaPlus,
  FaUtensils,
  FaCar,
  FaHotel,
  FaTicketAlt,
  FaShoppingBag,
  FaEllipsisH,
  FaTrash,
  FaEdit,
  FaDownload,
  FaChartPie,
  FaUsers,
  FaCalendarDay,
  FaCheckCircle,
  FaExclamationTriangle,
} from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { tripAPI } from '../../services/api';

const ExpenseTracker = ({ trip }) => {
  const [expenses, setExpenses] = useState([]);
  const [hasLoadedExpenses, setHasLoadedExpenses] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [selectedDay, setSelectedDay] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const tripId = trip?._id || trip?.id || null;

  const storageKey = (() => {
    const destination = trip?.destination?.city || trip?.destination || 'trip';
    const startDate = trip?.startDate || 'no-date';
    return `expense-tracker:${tripId || destination}:${startDate}`;
  })();

  useEffect(() => {
    let isActive = true;

    const loadExpenses = async () => {
      try {
        setHasLoadedExpenses(false);

        if (tripId) {
          const response = await tripAPI.getTripExpenses(tripId);
          if (!isActive) return;

          const loadedExpenses = response.data.expenses || [];
          setExpenses(Array.isArray(loadedExpenses) ? loadedExpenses : []);
          setHasLoadedExpenses(true);
          return;
        }

        const savedExpenses = window.localStorage.getItem(storageKey);
        if (savedExpenses) {
          const parsed = JSON.parse(savedExpenses);
          if (Array.isArray(parsed)) {
            setExpenses(parsed);
            setHasLoadedExpenses(true);
            return;
          }
        }

        setExpenses([]);
        setHasLoadedExpenses(true);
      } catch (error) {
        console.error('Failed to load saved expenses:', error);
        if (!isActive) return;
        setExpenses([]);
        setHasLoadedExpenses(true);
      }
    };

    loadExpenses();

    return () => {
      isActive = false;
    };
  }, [storageKey, tripId]);

  useEffect(() => {
    if (!hasLoadedExpenses || tripId) return;

    try {
      window.localStorage.setItem(storageKey, JSON.stringify(expenses));
    } catch (error) {
      console.error('Failed to save expenses:', error);
    }
  }, [expenses, storageKey, hasLoadedExpenses]);
  
  // Form state
  const [formData, setFormData] = useState({
    day: 1,
    category: 'food',
    description: '',
    amount: '',
    paidBy: '',
    splitAmong: [],
  });

  // Calculate trip duration
  const calculateDuration = () => {
    if (trip?.preferences?.duration) return parseInt(trip.preferences.duration) || 7;
    if (trip?.duration) return parseInt(trip.duration) || 7;
    if (trip?.itinerary?.days?.length) return trip.itinerary.days.length;
    if (trip?.itinerary?.dailyPlans?.length) return trip.itinerary.dailyPlans.length;
    if (!trip || !trip.startDate || !trip.endDate) return 7;
    const start = new Date(trip.startDate);
    const end = new Date(trip.endDate);
    const duration = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    return duration;
  };

  const tripDuration = calculateDuration();
  const travelers = trip?.preferences?.groupSize || trip?.travelers || trip?.groupSize || 2;
  
  // Safely extract budget value
  const getTotalBudget = () => {
    if (trip?.preferences?.budget?.max && !isNaN(trip.preferences.budget.max)) {
      return parseFloat(trip.preferences.budget.max);
    }
    if (trip?.preferences?.budget?.min && !isNaN(trip.preferences.budget.min)) {
      return parseFloat(trip.preferences.budget.min);
    }
    if (trip?.totalEstimatedCost?.amount && !isNaN(trip.totalEstimatedCost.amount)) {
      return parseFloat(trip.totalEstimatedCost.amount);
    }
    if (trip?.itinerary?.totalCost?.amount && !isNaN(trip.itinerary.totalCost.amount)) {
      return parseFloat(trip.itinerary.totalCost.amount);
    }
    if (trip?.budget?.max && !isNaN(trip.budget.max)) return parseFloat(trip.budget.max);
    if (trip?.budget?.min && !isNaN(trip.budget.min)) return parseFloat(trip.budget.min);
    if (typeof trip?.budget === 'number' && !isNaN(trip.budget)) return parseFloat(trip.budget);
    if (trip?.totalCost && !isNaN(trip.totalCost)) return parseFloat(trip.totalCost);
    return 50000;
  };
  
  const totalBudget = getTotalBudget();

  // Expense categories
  const categories = [
    { id: 'food', label: 'Food & Dining', icon: FaUtensils, color: 'bg-orange-500' },
    { id: 'transport', label: 'Transportation', icon: FaCar, color: 'bg-blue-500' },
    { id: 'accommodation', label: 'Accommodation', icon: FaHotel, color: 'bg-purple-500' },
    { id: 'activities', label: 'Activities & Tours', icon: FaTicketAlt, color: 'bg-green-500' },
    { id: 'shopping', label: 'Shopping & Souvenirs', icon: FaShoppingBag, color: 'bg-pink-500' },
    { id: 'misc', label: 'Miscellaneous', icon: FaEllipsisH, color: 'bg-gray-500' },
  ];

  // Calculate statistics
  const calculateStats = () => {
    const totalSpent = expenses.reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0);
    const budgetUsage = totalBudget === 0 || isNaN(totalBudget) ? 0 : (totalSpent / totalBudget) * 100;
    
    const categoryTotals = categories.map(cat => ({
      ...cat,
      total: expenses
        .filter(exp => exp.category === cat.id)
        .reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0),
    }));

    const dayTotals = Array.from({ length: tripDuration }, (_, i) => ({
      day: i + 1,
      total: expenses
        .filter(exp => exp.day === i + 1)
        .reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0),
    }));

    const perPersonSpent = totalSpent / travelers;

    return {
      totalSpent,
      budgetUsage,
      remaining: totalBudget - totalSpent,
      categoryTotals,
      dayTotals,
      perPersonSpent,
    };
  };

  const stats = calculateStats();

  // Format currency
  const formatCurrency = (amount) => {
    if (isNaN(amount) || amount === null || amount === undefined) return '₹0';
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount)) return '₹0';
    
    if (numAmount >= 100000) {
      return `₹${(numAmount / 100000).toFixed(2)}L`;
    } else if (numAmount >= 1000) {
      return `₹${(numAmount / 1000).toFixed(1)}K`;
    }
    return `₹${numAmount.toFixed(0)}`;
  };

  // Add or update expense
  const handleSubmit = async (e) => {
    e.preventDefault();
    const parsedAmount = parseFloat(formData.amount);
    
    if (!formData.description?.trim() || !formData.amount) {
      toast.error('Please fill all required fields');
      return;
    }

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error('Amount must be greater than 0');
      return;
    }

    const normalizedFormData = {
      ...formData,
      description: formData.description.trim(),
      amount: parsedAmount,
    };

    if (editingExpense) {
      // Update existing expense
      if (tripId) {
        try {
          const response = await tripAPI.updateTripExpense(tripId, editingExpense._id || editingExpense.id, normalizedFormData);
          const updatedExpenses = response.data.expenses || [];
          setExpenses(updatedExpenses);
          toast.success('Expense updated!');
        } catch (error) {
          console.error('Failed to update expense:', error);
          toast.error('Failed to update expense');
          return;
        }
      } else {
        setExpenses(prev => prev.map(exp => 
          (exp._id || exp.id) === (editingExpense._id || editingExpense.id)
            ? { ...normalizedFormData, _id: exp._id, id: exp.id }
            : exp
        ));
        toast.success('Expense updated!');
      }
      setEditingExpense(null);
    } else {
      // Add new expense
      const newExpense = {
        ...normalizedFormData,
        id: Date.now(),
        timestamp: new Date().toISOString(),
      };
      if (tripId) {
        try {
          const response = await tripAPI.addTripExpense(tripId, normalizedFormData);
          const addedExpense = response.data.expense;
          setExpenses(prev => [...prev, addedExpense]);
          toast.success('Expense added!');
        } catch (error) {
          console.error('Failed to add expense:', error);
          toast.error('Failed to add expense');
          return;
        }
      } else {
        setExpenses(prev => [...prev, newExpense]);
        toast.success('Expense added!');
      }
    }

    // Reset form
    setFormData({
      day: 1,
      category: 'food',
      description: '',
      amount: '',
      paidBy: '',
      splitAmong: [],
    });
    setShowAddForm(false);
  };

  // Delete expense
  const handleDelete = (id) => {
    if (tripId) {
      tripAPI.deleteTripExpense(tripId, id)
        .then((response) => {
          setExpenses(response.data.expenses || []);
          toast.success('Expense deleted');
        })
        .catch((error) => {
          console.error('Failed to delete expense:', error);
          toast.error('Failed to delete expense');
        });
      return;
    }

    setExpenses(prev => prev.filter(exp => exp.id !== id));
    toast.success('Expense deleted');
  };

  // Edit expense
  const handleEdit = (expense) => {
    setFormData(expense);
    setEditingExpense(expense);
    setShowAddForm(true);
  };

  // Filter expenses
  const filteredExpenses = expenses.filter(exp => {
    const dayMatch = selectedDay === 'all' || exp.day === parseInt(selectedDay);
    const categoryMatch = selectedCategory === 'all' || exp.category === selectedCategory;
    return dayMatch && categoryMatch;
  });

  // Export to CSV
  const handleExport = () => {
    const csvContent = [
      ['Day', 'Category', 'Description', 'Amount', 'Paid By'],
      ...expenses.map(exp => [
        `Day ${exp.day}`,
        categories.find(c => c.id === exp.category)?.label || exp.category,
        exp.description,
        exp.amount,
        exp.paidBy || 'N/A',
      ]),
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trip-expenses-${trip?.destination || 'travel'}.csv`;
    a.click();
    toast.success('Expenses exported!');
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl">
            <FaWallet className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Expense Tracker
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Track your daily expenses during the trip
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={handleExport}
            className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title="Export to CSV"
          >
            <FaDownload className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => {
              setShowAddForm(true);
              setEditingExpense(null);
              setFormData({
                day: 1,
                category: 'food',
                description: '',
                amount: '',
                paidBy: '',
                splitAmong: [],
              });
            }}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all shadow-md"
          >
            <FaPlus className="h-4 w-4" />
            <span className="font-medium">Add Expense</span>
          </button>
        </div>
      </div>

      {/* Budget Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Total Budget</span>
            <FaChartPie className="h-4 w-4 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
            {formatCurrency(totalBudget)}
          </p>
        </div>

        <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-purple-700 dark:text-purple-300">Total Spent</span>
            <FaWallet className="h-4 w-4 text-purple-600" />
          </div>
          <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
            {formatCurrency(stats.totalSpent)}
          </p>
        </div>

        <div className={`p-4 bg-gradient-to-br rounded-xl ${
          stats.remaining >= 0 
            ? 'from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20' 
            : 'from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-sm font-medium ${
              stats.remaining >= 0 
                ? 'text-green-700 dark:text-green-300' 
                : 'text-red-700 dark:text-red-300'
            }`}>
              Remaining
            </span>
            {stats.remaining >= 0 ? (
              <FaCheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <FaExclamationTriangle className="h-4 w-4 text-red-600" />
            )}
          </div>
          <p className={`text-2xl font-bold ${
            stats.remaining >= 0 
              ? 'text-green-900 dark:text-green-100' 
              : 'text-red-900 dark:text-red-100'
          }`}>
            {formatCurrency(Math.abs(stats.remaining))}
          </p>
        </div>

        <div className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-orange-700 dark:text-orange-300">Per Person</span>
            <FaUsers className="h-4 w-4 text-orange-600" />
          </div>
          <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">
            {formatCurrency(stats.perPersonSpent)}
          </p>
        </div>
      </div>

      {/* Budget Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Budget Usage
          </span>
          <span className={`text-sm font-bold ${
            stats.budgetUsage > 100 ? 'text-red-600' : 
            stats.budgetUsage > 90 ? 'text-yellow-600' : 'text-green-600'
          }`}>
            {stats.budgetUsage.toFixed(1)}%
          </span>
        </div>
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(stats.budgetUsage, 100)}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className={`h-full rounded-full ${
              stats.budgetUsage > 100 ? 'bg-red-500' :
              stats.budgetUsage > 90 ? 'bg-yellow-500' : 'bg-green-500'
            }`}
          />
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          Category Breakdown
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {stats.categoryTotals.map(cat => {
            const Icon = cat.icon;
            return (
              <div key={cat.id} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="flex items-center space-x-2 mb-1">
                  <div className={`p-1.5 ${cat.color} rounded`}>
                    <Icon className="h-3 w-3 text-white" />
                  </div>
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                    {cat.label}
                  </span>
                </div>
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {formatCurrency(cat.total)}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="flex items-center space-x-2">
          <FaCalendarDay className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          <select
            value={selectedDay}
            onChange={(e) => setSelectedDay(e.target.value)}
            className="px-3 py-1.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:text-white"
          >
            <option value="all">All Days</option>
            {Array.from({ length: tripDuration }, (_, i) => (
              <option key={i + 1} value={i + 1}>Day {i + 1}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center space-x-2">
          <FaChartPie className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-1.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:text-white"
          >
            <option value="all">All Categories</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Expense List */}
      <div className="space-y-3">
        {filteredExpenses.length === 0 ? (
          <div className="text-center py-12">
            <FaWallet className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 dark:text-gray-400">
              No expenses recorded yet. Add your first expense to start tracking!
            </p>
          </div>
        ) : (
          filteredExpenses.map(expense => {
            const category = categories.find(c => c.id === expense.category);
            const Icon = category?.icon || FaEllipsisH;
            const expenseKey = expense._id || expense.id;
            
            return (
              <motion.div
                key={expenseKey}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <div className={`p-2 ${category?.color} rounded-lg`}>
                      <Icon className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                          Day {expense.day}
                        </span>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {category?.label}
                        </span>
                      </div>
                      <p className="font-medium text-gray-900 dark:text-white mb-1">
                        {expense.description}
                      </p>
                      {expense.paidBy && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Paid by: {expense.paidBy}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-lg font-bold text-gray-900 dark:text-white">
                      ₹{parseFloat(expense.amount).toFixed(0)}
                    </span>
                    <div className="flex items-center space-x-1">
                      <button
                        type="button"
                        onClick={() => handleEdit(expense)}
                        className="p-1.5 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded transition-colors"
                      >
                        <FaEdit className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(expenseKey)}
                        className="p-1.5 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
                      >
                        <FaTrash className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Add/Edit Form Modal */}
      <AnimatePresence>
        {showAddForm && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddForm(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  {editingExpense ? 'Edit Expense' : 'Add New Expense'}
                </h3>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Day
                      </label>
                      <select
                        value={formData.day}
                        onChange={(e) => setFormData(prev => ({ ...prev, day: parseInt(e.target.value) }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      >
                        {Array.from({ length: tripDuration }, (_, i) => (
                          <option key={i + 1} value={i + 1}>Day {i + 1}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Category
                      </label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      >
                        {categories.map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Description *
                    </label>
                    <input
                      type="text"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="e.g., Lunch at local restaurant"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Amount (₹) *
                    </label>
                    <input
                      type="number"
                      value={formData.amount}
                      onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                      placeholder="0"
                      min="0"
                      step="0.01"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Paid By (Optional)
                    </label>
                    <input
                      type="text"
                      value={formData.paidBy}
                      onChange={(e) => setFormData(prev => ({ ...prev, paidBy: e.target.value }))}
                      placeholder="Who paid for this?"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div className="flex space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddForm(false);
                        setEditingExpense(null);
                      }}
                      className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all shadow-md font-medium"
                    >
                      {editingExpense ? 'Update' : 'Add'} Expense
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ExpenseTracker;
