import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import axios from 'axios'
import toast from 'react-hot-toast'
import { 
  Users, 
  Calendar, 
  CheckCircle, 
  Clock,
  TrendingUp,
  RefreshCw,
  Package
} from 'lucide-react'

function DashboardPage() {
  const { user } = useAuth()
  const [stats, setStats] = useState({
    total_users: 0,
    today_scheduled: 0,
    today_delivered: 0,
    week_total: 0,
    week_delivered: 0,
    schedules: {},
    recent_deliveries: []
  })
  const [deliveries, setDeliveries] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchDashboardData = async (showToast = false) => {
    try {
      if (showToast) setRefreshing(true)
      
      const [statsResponse, deliveriesResponse] = await Promise.all([
        axios.get('/api/tiffin/dashboard/stats'),
        axios.get(`/api/tiffin/deliveries/${user.id}?days=7`)
      ])

      setStats(statsResponse.data)
      setDeliveries(deliveriesResponse.data)
      
      if (showToast) {
        toast.success('Dashboard refreshed!')
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [user.id])

  const statCards = [
    {
      title: 'Total Users',
      value: stats.total_users,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: "Today's Scheduled",
      value: stats.today_scheduled,
      icon: Calendar,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: "Today's Delivered",
      value: stats.today_delivered,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Week Total',
      value: stats.week_total,
      icon: TrendingUp,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-black border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-black">Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Welcome back, {user.name}! Here's your tiffin overview.
          </p>
        </div>
        <button
          onClick={() => fetchDashboardData(true)}
          disabled={refreshing}
          className="btn-secondary flex items-center space-x-2"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon
          return (
            <div key={index} className="card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    {stat.title}
                  </p>
                  <p className="text-3xl font-bold text-black">
                    {stat.value}
                  </p>
                </div>
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Deliveries */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-black flex items-center">
              <Package className="h-5 w-5 mr-2" />
              Recent Deliveries
            </h2>
          </div>
          
          {deliveries.length > 0 ? (
            <div className="space-y-4">
              {deliveries.slice(0, 5).map((delivery, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-full ${
                      delivery.delivered ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'
                    }`}>
                      {delivery.delivered ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        <Clock className="h-4 w-4" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-black">
                        {new Date(delivery.delivery_date).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-gray-600">
                        {delivery.delivered ? 'Delivered' : 'Pending'}
                      </p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    delivery.delivered 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {delivery.status || (delivery.delivered ? 'Completed' : 'Scheduled')}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No recent deliveries</p>
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="card p-6">
          <h2 className="text-xl font-semibold text-black mb-6 flex items-center">
            <TrendingUp className="h-5 w-5 mr-2" />
            Weekly Overview
          </h2>
          
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Scheduled</span>
              <span className="text-2xl font-bold text-black">{stats.week_total}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Successfully Delivered</span>
              <span className="text-2xl font-bold text-green-600">{stats.week_delivered}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Delivery Rate</span>
              <span className="text-2xl font-bold text-blue-600">
                {stats.week_total > 0 ? Math.round((stats.week_delivered / stats.week_total) * 100) : 0}%
              </span>
            </div>

            {/* Progress Bar */}
            <div className="mt-4">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Weekly Progress</span>
                <span>{stats.week_delivered}/{stats.week_total}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-black h-2 rounded-full transition-all duration-300" 
                  style={{ 
                    width: stats.week_total > 0 ? `${(stats.week_delivered / stats.week_total) * 100}%` : '0%' 
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Active Schedules (if any) */}
      {Object.keys(stats.schedules).length > 0 && (
        <div className="card p-6">
          <h2 className="text-xl font-semibold text-black mb-6">Active Schedules</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(stats.schedules).map(([userId, schedule]) => (
              <div key={userId} className="p-4 border border-gray-200 rounded-lg">
                <p className="font-medium text-black">User {userId.slice(0, 8)}...</p>
                <p className="text-sm text-gray-600 mt-1">
                  Schedule active • {Object.values(schedule.weekly_schedule || {}).filter(Boolean).length} days/week
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default DashboardPage
