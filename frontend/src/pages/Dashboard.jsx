import React, { useState, useEffect } from 'react'
import api from '../api/axios'
import { 
  CreditCardIcon, 
  BellIcon, 
  ExclamationTriangleIcon,
  ChartBarIcon 
} from '@heroicons/react/24/outline'

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalExpenses: 0,
    monthlySpending: 0,
    activeSubscriptions: 0,
    burnRateWarning: null
  })
  const [recentExpenses, setRecentExpenses] = useState([])
  const [upcomingSubscriptions, setUpcomingSubscriptions] = useState([])

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const [expenses, subscriptions, burnRate] = await Promise.all([
        api.get('/expenses?limit=5'),
        api.get('/subscriptions/upcoming?days=7'),
        api.get('/burn-rate')
      ])

      setRecentExpenses(expenses.data)
      setUpcomingSubscriptions(subscriptions.data)
      
      setStats({
        totalExpenses: expenses.data.length,
        monthlySpending: burnRate.data.month_spending,
        activeSubscriptions: subscriptions.data.length,
        burnRateWarning: burnRate.data.warning_level
      })
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    }
  }

  const getWarningColor = (level) => {
    switch(level) {
      case 'critical': return 'bg-red-100 text-red-800'
      case 'warning': return 'bg-yellow-100 text-yellow-800'
      case 'caution': return 'bg-orange-100 text-orange-800'
      default: return 'bg-green-100 text-green-800'
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CreditCardIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Monthly Spending
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    ₹{stats.monthlySpending.toFixed(2)}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <BellIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Active Subscriptions
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.activeSubscriptions}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ChartBarIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Expenses
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.totalExpenses}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ExclamationTriangleIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Burn Rate Status
                  </dt>
                  <dd className={`text-sm font-medium px-2 py-1 rounded ${getWarningColor(stats.burnRateWarning)}`}>
                    {stats.burnRateWarning || 'Safe'}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Expenses */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Recent Expenses
          </h3>
        </div>
        <div className="border-t border-gray-200">
          <ul className="divide-y divide-gray-200">
            {recentExpenses.map((expense) => (
              <li key={expense.id} className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {expense.merchant_name || expense.description || 'Unknown'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(expense.transaction_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-sm font-medium text-gray-900">
                    ₹{expense.amount}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Upcoming Subscriptions */}
      {upcomingSubscriptions.length > 0 && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <BellIcon className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Upcoming Subscriptions (Next 7 Days)
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <ul className="list-disc pl-5 space-y-1">
                  {upcomingSubscriptions.map((sub) => (
                    <li key={sub.id}>
                      {sub.merchant_name} - ₹{sub.amount} on {new Date(sub.next_payment_date).toLocaleDateString()}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard
