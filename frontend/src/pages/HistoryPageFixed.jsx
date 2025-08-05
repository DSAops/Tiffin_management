import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import axios from 'axios'
import toast from 'react-hot-toast'
import { 
  History, 
  Calendar, 
  User, 
  Users,
  Clock,
  CheckCircle,
  X,
  Package,
  TrendingUp,
  Filter,
  Search,
  ChevronLeft,
  ChevronRight,
  Store,
  BarChart3
} from 'lucide-react'

function HistoryPage() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('my-history')
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState(null)
  const [filters, setFilters] = useState({
    days: 30,
    status: 'all',
    user_id: 'all',
    page: 1,
    limit: 50
  })
  const [users, setUsers] = useState([])

  const tabs = [
    { key: 'my-history', label: 'My History', icon: User },
    { key: 'user-history', label: 'User History', icon: Users },
    { key: 'all-history', label: 'System History', icon: BarChart3 }
  ]

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'pending', label: 'Pending' },
    { value: 'cancelled', label: 'Cancelled' }
  ]

  const daysOptions = [
    { value: 7, label: 'Last 7 days' },
    { value: 30, label: 'Last 30 days' },
    { value: 90, label: 'Last 3 months' },
    { value: 180, label: 'Last 6 months' }
  ]

  const fetchMyHistory = async () => {
    try {
      const userId = user.id || user._id
      const response = await axios.get(`/api/tiffin/history/user/${userId}?days=${filters.days}&page=${filters.page}&limit=${filters.limit}`)
      setData(response.data)
    } catch (error) {
      console.error('Error fetching my history:', error)
      toast.error('Failed to load your history')
    }
  }

  const fetchAllHistory = async () => {
    try {
      const response = await axios.get(`/api/tiffin/history/all?days=${filters.days}&page=${filters.page}&limit=${filters.limit}`)
      setData(response.data)
    } catch (error) {
      console.error('Error fetching all history:', error)
      toast.error('Failed to load system history')
    }
  }

  const fetchUserHistory = async () => {
    try {
      if (filters.user_id === 'all' || !filters.user_id) {
        await fetchAllHistory()
        return
      }
      const response = await axios.get(`/api/tiffin/history/user/${filters.user_id}?days=${filters.days}&page=${filters.page}&limit=${filters.limit}`)
      setData(response.data)
    } catch (error) {
      console.error('Error fetching user history:', error)
      toast.error('Failed to load user history')
    }
  }

  const fetchUsers = async () => {
    try {
      const response = await axios.get('/api/tiffin/schedules')
      setUsers(response.data.map(schedule => ({
        id: schedule.user_id,
        name: schedule.user_name
      })))
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  const fetchData = async () => {
    setLoading(true)
    try {
      switch (activeTab) {
        case 'my-history':
          await fetchMyHistory()
          break
        case 'user-history':
          await fetchUserHistory()
          break
        case 'all-history':
          await fetchAllHistory()
          break
        default:
          await fetchMyHistory()
      }
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: key !== 'page' ? 1 : value // Reset page when other filters change
    }))
  }

  const handlePageChange = (newPage) => {
    handleFilterChange('page', newPage)  
  }

  const getStatusBadge = (delivery) => {
    if (delivery.delivered) {
      return (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 flex items-center">
          <CheckCircle className="h-3 w-3 mr-1" />
          Delivered
        </span>
      )
    } else if (delivery.status === 'cancelled') {
      return (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 flex items-center">
          <X className="h-3 w-3 mr-1" />
          Cancelled
        </span>
      )
    } else {
      return (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 flex items-center">
          <Clock className="h-3 w-3 mr-1" />
          Pending
        </span>
      )
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  useEffect(() => {
    fetchData()
  }, [activeTab, filters])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-black flex items-center">
            <History className="h-8 w-8 mr-3" />
            Delivery History
          </h1>
          <p className="text-gray-600 mt-1">
            Track and analyze tiffin delivery records
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
                  activeTab === tab.key
                    ? 'border-black text-black'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4 mr-2" />
                {tab.label}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filters:</span>
          </div>
          
          <select
            value={filters.days}
            onChange={(e) => handleFilterChange('days', parseInt(e.target.value))}
            className="input-field w-auto min-w-[140px]"
          >
            {daysOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {activeTab !== 'my-history' && (
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="input-field w-auto min-w-[120px]"
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}  
                </option>
              ))}
            </select>
          )}

          {activeTab === 'user-history' && (
            <select
              value={filters.user_id}
              onChange={(e) => handleFilterChange('user_id', e.target.value)}
              className="input-field w-auto min-w-[160px]"
            >
              <option value="all">All Users</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-black border-t-transparent"></div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Statistics Cards */}
          {data?.statistics && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="stats-card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Deliveries</p>
                    <p className="text-2xl font-bold text-black">
                      {data.statistics.totalDeliveries || data.systemStatistics?.totalDeliveries || 0}
                    </p>
                  </div>
                  <Package className="h-6 w-6 text-gray-400" />
                </div>
              </div>

              <div className="stats-card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Delivered</p>
                    <p className="text-2xl font-bold text-green-600">
                      {data.statistics.deliveredCount || data.systemStatistics?.deliveredCount || 0}
                    </p>
                  </div>
                  <CheckCircle className="h-6 w-6 text-green-400" />
                </div>
              </div>

              <div className="stats-card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Success Rate</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {data.statistics.deliveryRate || data.systemStatistics?.deliveryRate || 0}%
                    </p>
                  </div>
                  <TrendingUp className="h-6 w-6 text-blue-400" />
                </div>
              </div>

              <div className="stats-card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Quantity</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {data.statistics.totalQuantity || data.systemStatistics?.totalQuantity || 0}
                    </p>
                  </div>
                  <BarChart3 className="h-6 w-6 text-purple-400" />
                </div>
              </div>
            </div>
          )}

          {/* User Statistics (for system history) */}
          {activeTab === 'all-history' && data?.userStatistics && (
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-black mb-4">Top Users</h3>
              <div className="space-y-3">
                {data.userStatistics.slice(0, 5).map((userStat, index) => (
                  <div key={userStat._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-black">{userStat.userName}</p>
                        <p className="text-sm text-gray-600">
                          {userStat.totalDeliveries} deliveries • {userStat.deliveryRate.toFixed(1)}% success
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-black">{userStat.totalQuantity}</p>
                      <p className="text-sm text-gray-600">total tiffins</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Deliveries List */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-black">
                Delivery Records ({data?.pagination?.totalCount || 0})
              </h3>
              {data?.pagination && (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handlePageChange(filters.page - 1)}
                    disabled={!data.pagination.hasPrevPage}
                    className="p-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="text-sm text-gray-600">
                    Page {data.pagination.page} of {data.pagination.totalPages}
                  </span>
                  <button
                    onClick={() => handlePageChange(filters.page + 1)}
                    disabled={!data.pagination.hasNextPage}
                    className="p-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>

            {data?.deliveries && data.deliveries.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Date</th>
                      {activeTab !== 'my-history' && <th className="text-left py-3 px-4 font-medium text-gray-600">User</th>}
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Vendor</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Time</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Quantity</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {data.deliveries.map((delivery) => (
                      <tr key={delivery._id} className="hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                            {new Date(delivery.delivery_date).toLocaleDateString()}
                          </div>
                        </td>
                        {activeTab !== 'my-history' && (
                          <td className="py-3 px-4">
                            <div className="flex items-center">
                              <User className="h-4 w-4 text-gray-400 mr-2" />
                              {delivery.user_name}
                            </div>
                          </td>
                        )}
                        <td className="py-3 px-4">
                          <div className="flex items-center">
                            <Store className="h-4 w-4 text-gray-400 mr-2" />
                            {delivery.vendor_id?.name || 'Unknown Vendor'}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 text-gray-400 mr-2" />
                            {delivery.scheduled_time}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-medium">{delivery.quantity}</span>
                        </td>
                        <td className="py-3 px-4">
                          {getStatusBadge(delivery)}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-black">
                            ₹{((delivery.vendor_id?.price || 0) * delivery.quantity).toFixed(2)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">No delivery records found</p>
                <p className="text-sm">Try adjusting your filters or check back later</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default HistoryPage
