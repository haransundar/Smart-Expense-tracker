import React, { useState, useEffect } from 'react'
import api from '../api/axios'
import { PlusIcon, UsersIcon } from '@heroicons/react/24/outline'

const FamilyView = () => {
  const [familyGroups, setFamilyGroups] = useState([])
  const [selectedGroup, setSelectedGroup] = useState(null)
  const [groupExpenses, setGroupExpenses] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [groupName, setGroupName] = useState('')

  useEffect(() => {
    // In a real app, fetch family groups here
  }, [])

  const handleCreateGroup = async (e) => {
    e.preventDefault()
    try {
      const response = await api.post('/family-groups', { name: groupName })
      setFamilyGroups([...familyGroups, response.data])
      setShowModal(false)
      setGroupName('')
    } catch (error) {
      console.error('Failed to create family group:', error)
    }
  }

  const fetchGroupExpenses = async (groupId) => {
    try {
      const response = await api.get(`/family-groups/${groupId}/expenses`)
      setGroupExpenses(response.data)
      setSelectedGroup(groupId)
    } catch (error) {
      console.error('Failed to fetch group expenses:', error)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Family View</h1>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Create Family Group
        </button>
      </div>

      <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
        <div className="flex">
          <UsersIcon className="h-5 w-5 text-blue-400" />
          <div className="ml-3">
            <p className="text-sm text-blue-700">
              Family View allows couples and families to track shared household expenses without sharing bank passwords. Create a group and invite members to collaborate.
            </p>
          </div>
        </div>
      </div>

      {familyGroups.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <UsersIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No family groups</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by creating a new family group.</p>
          <div className="mt-6">
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Create Family Group
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Family Groups List */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Your Groups</h3>
            <ul className="space-y-2">
              {familyGroups.map((group) => (
                <li key={group.id}>
                  <button
                    onClick={() => fetchGroupExpenses(group.id)}
                    className={`w-full text-left px-4 py-2 rounded-md ${
                      selectedGroup === group.id ? 'bg-primary text-white' : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    {group.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Group Expenses */}
          <div className="md:col-span-2 bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Group Expenses</h3>
            {selectedGroup ? (
              <ul className="divide-y divide-gray-200">
                {groupExpenses.map((expense) => (
                  <li key={expense.id} className="py-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {expense.merchant_name || expense.description}
                        </p>
                        <p className="text-sm text-gray-500">
                          {new Date(expense.transaction_date).toLocaleDateString()}
                        </p>
                      </div>
                      <p className="text-lg font-semibold text-gray-900">₹{expense.amount}</p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 text-center py-8">Select a group to view expenses</p>
            )}
          </div>
        </div>
      )}

      {/* Create Group Modal */}
      {showModal && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowModal(false)}></div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={handleCreateGroup}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                    Create Family Group
                  </h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Group Name</label>
                    <input
                      type="text"
                      required
                      value={groupName}
                      onChange={(e) => setGroupName(e.target.value)}
                      placeholder="e.g., Smith Family"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                    />
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary text-base font-medium text-white hover:bg-primary/90 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Create Group
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

export default FamilyView
