import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import axios from 'axios'
import toast from 'react-hot-toast'
import { 
  Save, 
  Calendar, 
  User, 
  Mail, 
  Plane,
  Clock,
  CheckCircle,
  X,
  Plus,
  Edit,
  Trash2,
  Store,
  Package,
  DollarSign,
  ChevronDown,
  ChevronUp,
  Settings
} from 'lucide-react'
import AddTiffinModal from '../components/AddTiffinModal'
import VendorManagement from '../components/VendorManagement'

function SettingsPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [selectedDay, setSelectedDay] = useState(null)
  const [showAddTiffinModal, setShowAddTiffinModal] = useState(false)
  const [showVendorManagement, setShowVendorManagement] = useState(false)
  const [tiffinOrders, setTiffinOrders] = useState({})
  const [expandedDays, setExpandedDays] = useState({})
  const [schedule, setSchedule] = useState({
    holiday_mode: {
      enabled: false,
      start_date: '',
      end_date: ''
    }
  })

  const daysOfWeek = [
    { key: 'monday', label: 'Monday' },
    { key: 'tuesday', label: 'Tuesday' },
    { key: 'wednesday', label: 'Wednesday' },
    { key: 'thursday', label: 'Thursday' },
    { key: 'friday', label: 'Friday' },
    { key: 'saturday', label: 'Saturday' },
    { key: 'sunday', label: 'Sunday' }
  ]

  const fetchTiffinOrders = async () => {
    try {
      const response = await axios.get('/api/tiffin-orders')
      const ordersByDay = {}
      
      response.data.forEach(order => {
        if (!ordersByDay[order.dayOfWeek]) {
          ordersByDay[order.dayOfWeek] = []
        }
        ordersByDay[order.dayOfWeek].push(order)
      })
      
      // Sort orders by delivery time for each day
      Object.keys(ordersByDay).forEach(day => {
        ordersByDay[day].sort((a, b) => a.deliveryTime.localeCompare(b.deliveryTime))
      })
      
      setTiffinOrders(ordersByDay)
    } catch (error) {
      console.error('Error fetching tiffin orders:', error)
      toast.error('Failed to fetch tiffin orders')
    }
  }

  const fetchSchedule = async () => {
    try {
      const response = await axios.get(`/api/tiffin/schedule/${user.id}`)
      setSchedule(response.data)
    } catch (error) {
      console.error('Error fetching schedule:', error)
      // Keep default schedule if user doesn't have one yet
    } finally {
      setLoading(false)
    }
  }

  const saveSchedule = async () => {
    try {
      setSaving(true)
      await axios.put(`/api/tiffin/schedule/${user.id}`, schedule)
      toast.success('Holiday settings saved successfully!')
    } catch (error) {
      console.error('Error saving schedule:', error)
      toast.error('Failed to save holiday settings')
    } finally {
      setSaving(false)
    }
  }

  const toggleDay = (day) => {
    setExpandedDays(prev => ({
      ...prev,
      [day]: !prev[day]
    }))
  }

  const toggleHolidayMode = () => {
    setSchedule(prev => ({
      ...prev,
      holiday_mode: {
        ...prev.holiday_mode,
        enabled: !prev.holiday_mode.enabled,
        start_date: !prev.holiday_mode.enabled ? prev.holiday_mode.start_date : '',
        end_date: !prev.holiday_mode.enabled ? prev.holiday_mode.end_date : ''
      }
    }))
  }

  const updateHolidayDates = (field, value) => {
    setSchedule(prev => ({
      ...prev,
      holiday_mode: {
        ...prev.holiday_mode,
        [field]: value
      }
    }))
  }

  const handleOrderAdded = (newOrder) => {
    setTiffinOrders(prev => {
      const dayOrders = prev[newOrder.dayOfWeek] || []
      const updatedOrders = [...dayOrders, newOrder].sort((a, b) => 
        a.deliveryTime.localeCompare(b.deliveryTime)
      )
      return {
        ...prev,
        [newOrder.dayOfWeek]: updatedOrders
      }
    })
  }

  const handleDeleteOrder = async (orderId, dayOfWeek) => {
    try {
      await axios.delete(`/api/tiffin-orders/${orderId}`)
      setTiffinOrders(prev => ({
        ...prev,
        [dayOfWeek]: prev[dayOfWeek].filter(order => order._id !== orderId)
      }))
      toast.success('Tiffin order deleted successfully!')
    } catch (error) {
      console.error('Error deleting order:', error)
      toast.error('Failed to delete order')
    }
  }

  const formatTime = (time) => {
    const [hours, minutes] = time.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }

  const getDayOrdersCount = (day) => {
    return tiffinOrders[day]?.length || 0
  }

  const getDayTotalQuantity = (day) => {
    return tiffinOrders[day]?.reduce((sum, order) => sum + order.quantity, 0) || 0
  }

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([fetchSchedule(), fetchTiffinOrders()])
    }
    loadData()
  }, [user.id])

  const isHolidayActive = schedule.holiday_mode.enabled && 
    schedule.holiday_mode.start_date && 
    schedule.holiday_mode.end_date

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-black border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-black">Settings</h1>
          <p className="text-gray-600 mt-1">
            Manage your tiffin delivery preferences and vendors.
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowVendorManagement(true)}
            className="btn-secondary flex items-center space-x-2"
          >
            <Store className="h-4 w-4" />
            <span>Manage Vendors</span>
          </button>
          <button
            onClick={saveSchedule}
            disabled={saving}
            className="btn-primary flex items-center space-x-2"
          >
            {saving ? (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            <span>{saving ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
      </div>

      {/* User Profile */}
      <div className="card p-6">
        <h2 className="text-xl font-semibold text-black mb-6 flex items-center">
          <User className="h-5 w-5 mr-2" />
          Profile Information
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
            <div className="p-3 bg-black text-white rounded-full">
              <User className="h-6 w-6" />
            </div>
            <div>
              <p className="font-medium text-black">{user.name}</p>
              <p className="text-sm text-gray-600">Full Name</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
            <div className="p-3 bg-black text-white rounded-full">
              <Mail className="h-6 w-6" />
            </div>
            <div>
              <p className="font-medium text-black">{user.email}</p>
              <p className="text-sm text-gray-600">Email Address</p>
            </div>
          </div>
        </div>
      </div>

      {/* Weekly Tiffin Orders */}
      <div className="card p-6">
        <h2 className="text-xl font-semibold text-black mb-6 flex items-center">
          <Calendar className="h-5 w-5 mr-2" />
          Weekly Tiffin Orders
        </h2>
        
        <div className="space-y-4">
          {daysOfWeek.map((day) => {
            const orderCount = getDayOrdersCount(day.key)
            const totalQuantity = getDayTotalQuantity(day.key)
            const isExpanded = expandedDays[day.key]
            const dayOrders = tiffinOrders[day.key] || []

            return (
              <div key={day.key} className="border border-gray-200 rounded-lg">
                {/* Day Header */}
                <div 
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => toggleDay(day.key)}
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      <h3 className="font-semibold text-black">{day.label}</h3>
                    </div>
                    
                    {orderCount > 0 && (
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <div className="flex items-center space-x-1">
                          <Store className="h-4 w-4" />
                          <span>{orderCount} vendor{orderCount !== 1 ? 's' : ''}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Package className="h-4 w-4" />
                          <span>{totalQuantity} tiffin{totalQuantity !== 1 ? 's' : ''}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedDay(day.key)
                      setShowAddTiffinModal(true)
                    }}
                    className="btn-outline flex items-center space-x-1 text-sm px-3 py-1.5"
                  >
                    <Plus className="h-3 w-3" />
                    <span>Add Tiffin</span>
                  </button>
                </div>

                {/* Day Orders */}
                {isExpanded && (
                  <div className="border-t border-gray-200 p-4">
                    {dayOrders.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No tiffin orders for {day.label}</p>
                        <button
                          onClick={() => {
                            setSelectedDay(day.key)
                            setShowAddTiffinModal(true)
                          }}
                          className="btn-primary mt-3 text-sm"
                        >
                          Add First Order
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {dayOrders.map((order) => (
                          <div key={order._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center space-x-4">
                              <div className="p-2 bg-white rounded-lg">
                                <Store className="h-4 w-4 text-gray-600" />
                              </div>
                              <div>
                                <h4 className="font-medium text-black">{order.vendorId.name}</h4>
                                <div className="flex items-center space-x-4 text-sm text-gray-600">
                                  <div className="flex items-center space-x-1">
                                    <Clock className="h-3 w-3" />
                                    <span>{formatTime(order.deliveryTime)}</span>
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    <Package className="h-3 w-3" />
                                    <span>{order.quantity} tiffin{order.quantity !== 1 ? 's' : ''}</span>
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    <DollarSign className="h-3 w-3" />
                                    <span>₹{(order.vendorId.price * order.quantity).toFixed(2)}</span>
                                  </div>
                                </div>
                                {order.notes && (
                                  <p className="text-xs text-gray-500 mt-1">{order.notes}</p>
                                )}
                              </div>
                            </div>
                            
                            <button
                              onClick={() => handleDeleteOrder(order._id, day.key)}
                              className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Holiday Mode */}
      <div className="card p-6">
        <h2 className="text-xl font-semibold text-black mb-6 flex items-center">
          <Plane className="h-5 w-5 mr-2" />
          Holiday Mode
        </h2>
        
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-black">Enable Holiday Mode</p>
              <p className="text-sm text-gray-600 mt-1">
                Temporarily pause your tiffin deliveries during holidays or travel
              </p>
            </div>
            <button
              onClick={toggleHolidayMode}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                schedule.holiday_mode.enabled ? 'bg-black' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  schedule.holiday_mode.enabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {schedule.holiday_mode.enabled && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200">
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={schedule.holiday_mode.start_date}
                  onChange={(e) => updateHolidayDates('start_date', e.target.value)}
                  className="input-field"
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  value={schedule.holiday_mode.end_date}
                  onChange={(e) => updateHolidayDates('end_date', e.target.value)}
                  className="input-field"
                  min={schedule.holiday_mode.start_date || new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>
          )}

          {isHolidayActive && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center">
                <Clock className="h-5 w-5 text-yellow-600 mr-2" />
                <div>
                  <p className="text-yellow-800 font-medium">Holiday Mode Active</p>
                  <p className="text-yellow-700 text-sm mt-1">
                    Deliveries paused from {new Date(schedule.holiday_mode.start_date).toLocaleDateString()} 
                    {' '}to {new Date(schedule.holiday_mode.end_date).toLocaleDateString()}
                  </p>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center">
                <Clock className="h-5 w-5 text-yellow-600 mr-2" />
                <div>
                  <p className="text-yellow-800 font-medium">Holiday Mode Active</p>
                  <p className="text-yellow-700 text-sm mt-1">
                    All deliveries paused from {new Date(schedule.holiday_mode.start_date).toLocaleDateString()} 
                    {' '}to {new Date(schedule.holiday_mode.end_date).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <AddTiffinModal
        isOpen={showAddTiffinModal}
        onClose={() => {
          setShowAddTiffinModal(false)
          setSelectedDay(null)
        }}
        dayOfWeek={selectedDay}
        onOrderAdded={handleOrderAdded}
      />

      <VendorManagement
        isOpen={showVendorManagement}
        onClose={() => setShowVendorManagement(false)}
      />
    </div>
  )
}

export default SettingsPage
