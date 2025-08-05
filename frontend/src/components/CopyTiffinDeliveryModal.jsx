import React, { useState, useEffect } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { X, Copy, Calendar, Check, CheckCheck } from 'lucide-react'

function CopyTiffinDeliveryModal({ isOpen, onClose, delivery, onCopyCompleted }) {
  const [selectedDays, setSelectedDays] = useState([])
  const [loading, setLoading] = useState(false)
  const [quickSelect, setQuickSelect] = useState('')

  const dayNames = [
    'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
  ]

  const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']

  const resetForm = () => {
    setSelectedDays([])
    setQuickSelect('')
  }

  useEffect(() => {
    if (isOpen) {
      resetForm()
    }
  }, [isOpen])

  const handleDayToggle = (day) => {
    setSelectedDays(prev => {
      const newSelectedDays = prev.includes(day)
        ? prev.filter(d => d !== day)
        : [...prev, day]
      
      // Update quick select based on selection
      if (newSelectedDays.length === 7) {
        setQuickSelect('week')
      } else if (newSelectedDays.length === 5 && weekdays.every(d => newSelectedDays.includes(d))) {
        setQuickSelect('weekdays')
      } else {
        setQuickSelect('')
      }
      
      return newSelectedDays
    })
  }

  const handleQuickSelect = (type) => {
    if (type === 'week') {
      setSelectedDays([...dayNames])
      setQuickSelect('week')
    } else if (type === 'weekdays') {
      setSelectedDays([...weekdays])
      setQuickSelect('weekdays')
    } else if (type === 'clear') {
      setSelectedDays([])
      setQuickSelect('')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (selectedDays.length === 0) {
      toast.error('Please select at least one day')
      return
    }

    try {
      setLoading(true)
      await onCopyCompleted(selectedDays)
      onClose()
    } catch (error) {
      console.error('Error copying delivery:', error)
      toast.error('Failed to copy delivery')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-black flex items-center">
              <Copy className="h-5 w-5 mr-2" />
              Copy Delivery
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Select days to copy this delivery to
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* Current Delivery Info */}
          {delivery && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="font-medium text-black mb-2">Copying:</h3>
              <div className="text-sm text-gray-600">
                <p><span className="font-medium">Vendor:</span> {delivery.vendorId?.name || 'Unknown'}</p>
                <p><span className="font-medium">Time:</span> {delivery.time}</p>
                <p><span className="font-medium">Quantity:</span> {delivery.quantity}</p>
                <p><span className="font-medium">Price:</span> ₹{delivery.vendorId?.price || 0}</p>
              </div>
            </div>
          )}

          {/* Quick Select Buttons */}
          <div className="mb-6">
            <label className="label-field">Quick Select</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickSelect('weekdays')}
                className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                  quickSelect === 'weekdays'
                    ? 'bg-black text-white border-black'
                    : 'bg-white text-black border-gray-300 hover:bg-gray-50'
                }`}
              >
                <CheckCheck className="h-4 w-4 mx-auto mb-1" />
                Weekdays
              </button>
              <button
                type="button"
                onClick={() => handleQuickSelect('week')}
                className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                  quickSelect === 'week'
                    ? 'bg-black text-white border-black'
                    : 'bg-white text-black border-gray-300 hover:bg-gray-50'
                }`}
              >
                <Calendar className="h-4 w-4 mx-auto mb-1" />
                Full Week
              </button>
              <button
                type="button"
                onClick={() => handleQuickSelect('clear')}
                className="px-3 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <X className="h-4 w-4 mx-auto mb-1" />
                Clear
              </button>
            </div>
          </div>

          {/* Day Selection */}
          <div className="mb-6">
            <label className="label-field">Select Days</label>
            <div className="grid grid-cols-2 gap-2">
              {dayNames.map((day) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => handleDayToggle(day)}
                  className={`p-3 rounded-lg border text-sm font-medium transition-colors ${
                    selectedDays.includes(day)
                      ? 'bg-black text-white border-black'
                      : 'bg-white text-black border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-center space-x-2">
                    {selectedDays.includes(day) && <Check className="h-4 w-4" />}
                    <span>{day}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Selected Count */}
          {selectedDays.length > 0 && (
            <div className="bg-blue-50 rounded-lg p-3 mb-6">
              <p className="text-sm text-blue-800">
                <span className="font-medium">{selectedDays.length} day{selectedDays.length !== 1 ? 's' : ''} selected:</span>
                <span className="ml-2">{selectedDays.join(', ')}</span>
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary flex-1"
              disabled={loading || selectedDays.length === 0}
            >
              {loading ? 'Copying...' : `Copy to ${selectedDays.length} Day${selectedDays.length !== 1 ? 's' : ''}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CopyTiffinDeliveryModal
