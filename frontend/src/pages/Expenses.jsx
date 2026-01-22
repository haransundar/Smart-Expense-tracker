import React, { useState, useEffect } from 'react'
import api from '../api/axios'
import { PlusIcon } from '@heroicons/react/24/outline'

const Expenses = () => {
  const [expenses, setExpenses] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    amount: '',
    payment_method_id: 1,
    description: '',
    original_text: '',
    transaction_date: new Date().toISOString().slice(0, 16)
  })

  useEffect(() => {
    fetchExpenses()
  }, [])

  const fetchExpenses = async () => {
    try {
      const response = await api.get('/expenses')
      setExpenses(response.data)
    } catch (error) {
      console.error('Failed to fetch expenses:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await api.post('/expenses', formData)
      setShowModal(false)
      fetchExpenses()
      setFormData({
        amount: '',
        payment_method_id: 1,
        description: '',
        original_text: '',
        transaction_date: new Date().toISOString().slice(0, 16)
      })
    } catch (error) {
      console.error('Failed to create expense:', error)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Expenses</h1>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Expense
        </button>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {expenses.map((expense) => (
            <li key={expense.id}>
              <div className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-primary truncate">
                      {expense.merchant_name || expense.description || 'Unknown'}
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                      {new Date(expense.transaction_date).toLocaleString()}
                    </p>
                    {expense.is_recurring && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mt-2">
                        Recurring
                      </span>
                    )}
                  </div>
                  <div className="text-lg font-semibold text-gray-900">
                    ₹{expense.amount}
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Add Expense Modal */}
      {showModal && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowModal(false)}></div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={handleSubmit}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                    Add New Expense
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Amount</label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={formData.amount}
                        onChange={(e) => setFormData({...formData, amount: e.target.value})}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Description</label>
                      <input
                        type="text"
                        value={formData.description}
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Bank Text (Optional)</label>
                      <input
                        type="text"
                        placeholder="e.g., UPI-ZOMATO-1234-MUM"
                        value={formData.original_text}
                        onChange={(e) => setFormData({...formData, original_text: e.target.value})}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Date & Time</label>
                      <input
                        type="datetime-local"
                        required
                        value={formData.transaction_date}
                        onChange={(e) => setFormData({...formData, transaction_date: e.target.value})}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                      />
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary text-base font-medium text-white hover:bg-primary/90 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Add Expense
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Expenses
