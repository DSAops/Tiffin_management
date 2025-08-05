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
  Store,
  Settings,
  Trash2,
  Edit
} from 'lucide-react'
import AddTiffinDeliveryModal from '../components/AddTiffinDeliveryModal'
import VendorManagementModal from '../components/VendorManagementModal'

function SettingsPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [schedule, setSchedule] = useState({
    weekly_schedule: {
      monday: { enabled: false, deliveries: [] },
      tuesday: { enabled: false, deliveries: [] },
      wednesday: { enabled: false, deliveries: [] },
      thursday: { enabled: false, deliveries: [] },
      friday: { enabled: false, deliveries: [] },
      saturday: { enabled: false, deliveries: [] },
      sunday: { enabled: false, deliveries: [] }
    },
    holiday_mode: {
      enabled: false,
      start_date: '',
      end_date: ''
    }
  })

  // Modal states
  const [showAddDeliveryModal, setShowAddDeliveryModal] = useState(false)
  const [showVendorModal, setShowVendorModal] = useState(false)
  const [selectedDay, setSelectedDay] = useState('')

  const daysOfWeek = [
    { key: 'monday', label: 'Monday' },
    { key: 'tuesday', label: 'Tuesday' },
    { key: 'wednesday', label: 'Wednesday' },
    { key: 'thursday', label: 'Thursday' },
    { key: 'friday', label: 'Friday' },
    { key: 'saturday', label: 'Saturday' },
    { key: 'sunday', label: 'Sunday' }
  ]

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
      toast.success('Schedule saved successfully!')
    } catch (error) {
      console.error('Error saving schedule:', error)
      toast.error('Failed to save schedule')
    } finally {
      setSaving(false)
    }
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

  const handleAddDelivery = (day) => {
    setSelectedDay(day)
    setShowAddDeliveryModal(true)
  }

  const handleDeliveryAdded = (updatedSchedule) => {
    setSchedule(updatedSchedule)
  }

  const handleRemoveDelivery = async (day, deliveryId) => {
    if (!confirm('Are you sure you want to remove this delivery?')) {
      return
    }

    try {
      const response = await axios.delete(`/api/tiffin/schedule/${user.id}/day/${day}/delivery/${deliveryId}`)
      setSchedule(response.data.schedule)
      toast.success('Delivery removed successfully!')
    } catch (error) {
      console.error('Error removing delivery:', error)
      toast.error('Failed to remove delivery')
    }
  }

  useEffect(() => {
    fetchSchedule()
  }, [user.id])

  const totalDeliveries = Object.values(schedule.weekly_schedule).reduce(
    (total, day) => total + (day.deliveries?.length || 0), 0
  )
  const activeDays = Object.values(schedule.weekly_schedule).filter(day => day.enabled).length
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
    <div className="space-y-8 max-w-6xl">
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
            onClick={() => setShowVendorModal(true)}
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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="stats-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Days</p>
              <p className="text-2xl font-bold text-black">{activeDays}</p>
            </div>
            <Calendar className="h-8 w-8 text-gray-400" />
          </div>
        </div>
        
        <div className="stats-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Deliveries</p>
              <p className="text-2xl font-bold text-black">{totalDeliveries}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-gray-400" />
          </div>
        </div>
        
        <div className="stats-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Holiday Mode</p>
              <p className="text-2xl font-bold text-black">
                {isHolidayActive ? 'Active' : 'Inactive'}
              </p>
            </div>
            <Plane className="h-8 w-8 text-gray-400" />
          </div>
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

      {/* Weekly Schedule */}
      <div className="card p-6">
        <h2 className="text-xl font-semibold text-black mb-6 flex items-center">
          <Calendar className="h-5 w-5 mr-2" />
          Weekly Tiffin Schedule
        </h2>
        
        <div className="space-y-6">
          {daysOfWeek.map((day) => (
            <div key={day.key} className="border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <h3 className="text-lg font-medium text-black">{day.label}</h3>
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                    schedule.weekly_schedule[day.key]?.enabled
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {schedule.weekly_schedule[day.key]?.enabled ? 'Active' : 'Inactive'}
                  </div>
                </div>
                
                <button
                  onClick={() => handleAddDelivery(day.key)}
                  className="btn-primary flex items-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Tiffin</span>
                </button>
              </div>

              {/* Deliveries List */}
              <div className="space-y-3">
                {schedule.weekly_schedule[day.key]?.deliveries?.length > 0 ? (
                  schedule.weekly_schedule[day.key].deliveries.map((delivery, index) => (
                    <div
                      key={delivery._id || index}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="p-2 bg-black text-white rounded-lg">
                          <Store className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-medium text-black">
                            {delivery.vendorId?.name || 'Unknown Vendor'}
                          </p>
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <span className="flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              {delivery.time}
                            </span>
                            <span>Qty: {delivery.quantity}</span>
                            <span>₹{delivery.vendorId?.price || 0} each</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <div className="text-right">
                          <p className="font-semibold text-black">
                            ₹{((delivery.vendorId?.price || 0) * delivery.quantity).toFixed(2)}
                          </p>
                          <p className="text-sm text-gray-600">Total</p>
                        </div>
                        <button
                          onClick={() => handleRemoveDelivery(day.key, delivery._id)}
                          className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                          title="Remove delivery"
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No deliveries scheduled for {day.label}</p>
                    <p className="text-sm">Click "Add Tiffin" to schedule a delivery</p>
                  </div>
                )}
              </div>
            </div>
          ))}
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
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <AddTiffinDeliveryModal
        isOpen={showAddDeliveryModal}
        onClose={() => setShowAddDeliveryModal(false)}
        day={selectedDay}
        userId={user.id}
        onDeliveryAdded={handleDeliveryAdded}
      />

      <VendorManagementModal
        isOpen={showVendorModal}
        onClose={() => setShowVendorModal(false)}
        onVendorAdded={fetchSchedule}
      />
    </div>
  )
}

export default SettingsPage
