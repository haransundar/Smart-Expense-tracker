import React, { useState, useEffect } from 'react'
import api from '../api/axios'
import { ExclamationTriangleIcon, CheckCircleIcon } from '@heroicons/react/24/outline'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const BurnRate = () => {
  const [burnRate, setBurnRate] = useState(null)
  const [trends, setTrends] = useState(null)
  const [balance, setBalance] = useState('')

  useEffect(() => {
    fetchBurnRate()
    fetchTrends()
  }, [])

  const fetchBurnRate = async (currentBalance = null) => {
    try {
      const url = currentBalance ? `/burn-rate?current_balance=${currentBalance}` : '/burn-rate'
      const response = await api.get(url)
      setBurnRate(response.data)
    } catch (error) {
      console.error('Failed to fetch burn rate:', error)
    }
  }

  const fetchTrends = async () => {
    try {
      const response = await api.get('/spending-trends?months=3')
      setTrends(response.data)
    } catch (error) {
      console.error('Failed to fetch trends:', error)
    }
  }

  const handleBalanceSubmit = (e) => {
    e.preventDefault()
    if (balance) {
      fetchBurnRate(parseFloat(balance))
    }
  }

  const getWarningIcon = (level) => {
    switch(level) {
      case 'critical':
      case 'warning':
      case 'caution':
        return <ExclamationTriangleIcon className="h-12 w-12 text-red-500" />
      default:
        return <CheckCircleIcon className="h-12 w-12 text-green-500" />
    }
  }

  const getWarningMessage = (level) => {
    switch(level) {
      case 'critical':
        return 'Critical! You may run out of money before month end.'
      case 'warning':
        return 'Warning! Your spending rate is high.'
      case 'caution':
        return 'Caution: Monitor your spending closely.'
      default:
        return 'You\'re on track! Keep it up.'
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Burn Rate Forecaster</h1>

      <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
        <p className="text-sm text-blue-700">
          The Burn Rate Forecaster predicts if you'll run out of money before the month ends based on your current spending speed.
        </p>
      </div>

      {/* Balance Input */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Enter Your Current Balance</h3>
        <form onSubmit={handleBalanceSubmit} className="flex gap-4">
          <input
            type="number"
            step="0.01"
            value={balance}
            onChange={(e) => setBalance(e.target.value)}
            placeholder="Enter current balance"
            className="flex-1 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary"
          />
          <button
            type="submit"
            className="px-6 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90"
          >
            Calculate
          </button>
        </form>
      </div>

      {/* Burn Rate Analysis */}
      {burnRate && (
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-gray-900">Burn Rate Analysis</h3>
            {getWarningIcon(burnRate.warning_level)}
          </div>

          <div className={`p-4 rounded-md mb-6 ${
            burnRate.warning_level === 'critical' ? 'bg-red-50' :
            burnRate.warning_level === 'warning' ? 'bg-yellow-50' :
            burnRate.warning_level === 'caution' ? 'bg-orange-50' :
            'bg-green-50'
          }`}>
            <p className="text-sm font-medium">
              {getWarningMessage(burnRate.warning_level)}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-500">Daily Burn Rate</p>
              <p className="text-2xl font-semibold text-gray-900">₹{burnRate.daily_burn_rate.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Days Until Broke</p>
              <p className="text-2xl font-semibold text-gray-900">
                {burnRate.days_until_broke ? `${burnRate.days_until_broke} days` : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Month Spending</p>
              <p className="text-2xl font-semibold text-gray-900">₹{burnRate.month_spending.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Projected Month-End Balance</p>
              <p className={`text-2xl font-semibold ${burnRate.projected_month_end_balance < 0 ? 'text-red-600' : 'text-green-600'}`}>
                ₹{burnRate.projected_month_end_balance.toFixed(2)}
              </p>
            </div>
          </div>

          {burnRate.upcoming_subscription_details.length > 0 && (
            <div className="mt-6">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Upcoming Subscriptions</h4>
              <ul className="space-y-2">
                {burnRate.upcoming_subscription_details.map((sub, idx) => (
                  <li key={idx} className="text-sm text-gray-600">
                    {sub.merchant} - ₹{sub.amount} on {new Date(sub.date).toLocaleDateString()}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Spending Trends */}
      {trends && (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Spending Trends (Last 3 Months)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trends.monthly_breakdown}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="total_spending" stroke="#4F46E5" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600">
              Average Monthly Spending: <span className="font-semibold">₹{trends.average_monthly_spending.toFixed(2)}</span>
            </p>
            <p className="text-sm text-gray-600">
              Trend: <span className={`font-semibold ${trends.trend === 'increasing' ? 'text-red-600' : 'text-green-600'}`}>
                {trends.trend}
              </span>
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default BurnRate
