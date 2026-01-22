import React, { useState, useEffect } from 'react'
import api from '../api/axios'
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'

const Subscriptions = () => {
  const [subscriptions, setSubscriptions] = useState([])
  const [scanning, setScanning] = useState(false)

  useEffect(() => {
    fetchSubscriptions()
  }, [])

  const fetchSubscriptions = async () => {
    try {
      const response = await api.get('/subscriptions')
      setSubscriptions(response.data)
    } catch (error) {
      console.error('Failed to fetch subscriptions:', error)
    }
  }

  const handleScan = async () => {
    setScanning(true)
    try {
      const response = await api.post('/subscriptions/scan')
      alert(`Found ${response.data.detected_count} subscriptions!`)
      fetchSubscriptions()
    } catch (error) {
      console.error('Failed to scan subscriptions:', error)
    } finally {
      setScanning(false)
    }
  }

  const getFrequencyColor = (frequency) => {
    switch(frequency) {
      case 'monthly': return 'bg-blue-100 text-blue-800'
      case 'yearly': return 'bg-purple-100 text-purple-800'
      case 'weekly': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Subscriptions</h1>
        <button
          onClick={handleScan}
          disabled={scanning}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90 disabled:opacity-50"
        >
          <MagnifyingGlassIcon className="h-5 w-5 mr-2" />
          {scanning ? 'Scanning...' : 'Scan for Subscriptions'}
        </button>
      </div>

      <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
        <div className="flex">
          <div className="ml-3">
            <p className="text-sm text-blue-700">
              The Subscription Detective automatically scans your expense history to find recurring payments like Netflix, Spotify, and gym memberships.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {subscriptions.map((sub) => (
          <div key={sub.id} className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">{sub.merchant_name}</h3>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getFrequencyColor(sub.frequency)}`}>
                  {sub.frequency}
                </span>
              </div>
              <div className="mt-4">
                <p className="text-2xl font-semibold text-gray-900">₹{sub.amount}</p>
                <p className="text-sm text-gray-500 mt-2">
                  Next payment: {new Date(sub.next_payment_date).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {subscriptions.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No subscriptions detected yet. Click "Scan for Subscriptions" to find them.</p>
        </div>
      )}
    </div>
  )
}

export default Subscriptions
