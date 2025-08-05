import React, { useState, useEffect } from 'react'
import { X, Plus, Clock, Package, DollarSign, User } from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'

function AddTiffinModal({ isOpen, onClose, dayOfWeek, onOrderAdded }) {
  const [vendors, setVendors] = useState([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    vendorId: '',
    deliveryTime: '12:00',
    quantity: 1,
    notes: ''
  })

  const fetchVendors = async () => {
    try {
      setLoading(true)
      const response = await axios.get('/api/vendors')
      setVendors(response.data)
    } catch (error) {
      console.error('Error fetching vendors:', error)
      toast.error('Failed to load vendors')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.vendorId) {
      toast.error('Please select a vendor')
      return
    }

    try {
      setSubmitting(true)
      const response = await axios.post('/api/tiffin-orders', {
        ...formData,
        dayOfWeek: dayOfWeek.toLowerCase()
      })
      
      toast.success('Tiffin order added successfully!')
      onOrderAdded(response.data)
      onClose()
      
      // Reset form
      setFormData({
        vendorId: '',
        deliveryTime: '12:00',
        quantity: 1,
        notes: ''
      })
    } catch (error) {
      console.error('Error adding tiffin order:', error)
      toast.error(error.response?.data?.error || 'Failed to add tiffin order')
    } finally {
      setSubmitting(false)
    }
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  useEffect(() => {
    if (isOpen) {
      fetchVendors()
    }
  }, [isOpen])

  if (!isOpen) return null

  const selectedVendor = vendors.find(v => v._id === formData.vendorId)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-black">Add Tiffin Order</h2>
            <p className="text-gray-600 text-sm mt-1">
              {dayOfWeek.charAt(0).toUpperCase() + dayOfWeek.slice(1)} delivery
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
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Vendor Selection */}
          <div>
            <label className="label-field">
              <User className="h-4 w-4 inline mr-2" />
              Select Vendor
            </label>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-black border-t-transparent"></div>
              </div>
            ) : (
              <select
                value={formData.vendorId}
                onChange={(e) => handleInputChange('vendorId', e.target.value)}
                className="input-field"
                required
              >
                <option value="">Choose a vendor...</option>
                {vendors.map((vendor) => (
                  <option key={vendor._id} value={vendor._id}>
                    {vendor.name} - ₹{vendor.price}
                  </option>
                ))}
              </select>
            )}
            
            {selectedVendor && (
              <div className="mt-3 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-black">{selectedVendor.name}</h4>
                  <span className="flex items-center text-green-600 font-semibold">
                    <DollarSign className="h-4 w-4 mr-1" />
                    ₹{selectedVendor.price}
                  </span>
                </div>
                {selectedVendor.description && (
                  <p className="text-sm text-gray-600">{selectedVendor.description}</p>
                )}
              </div>
            )}
          </div>

          {/* Delivery Time */}
          <div>
            <label className="label-field">
              <Clock className="h-4 w-4 inline mr-2" />
              Delivery Time
            </label>
            <input
              type="time"
              value={formData.deliveryTime}
              onChange={(e) => handleInputChange('deliveryTime', e.target.value)}
              className="input-field"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              When would you like to receive your tiffin?
            </p>
          </div>

          {/* Quantity */}
          <div>
            <label className="label-field">
              <Package className="h-4 w-4 inline mr-2" />
              Quantity
            </label>
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={() => handleInputChange('quantity', Math.max(1, formData.quantity - 1))}
                className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors"
              >
                -
              </button>
              <input
                type="number"
                min="1"
                max="10"
                value={formData.quantity}
                onChange={(e) => handleInputChange('quantity', parseInt(e.target.value) || 1)}
                className="input-field text-center w-20"
                required
              />
              <button
                type="button"
                onClick={() => handleInputChange('quantity', Math.min(10, formData.quantity + 1))}
                className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors"
              >
                +
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Number of tiffin boxes (max 10)
            </p>
          </div>

          {/* Notes */}
          <div>
            <label className="label-field">Special Instructions (Optional)</label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              className="input-field resize-none"
              rows="3"
              placeholder="Any special requests or dietary requirements..."
            />
          </div>

          {/* Total Cost */}
          {selectedVendor && (
            <div className="bg-black text-white p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm opacity-90">Total Cost</span>
                <span className="text-xl font-bold">
                  ₹{(selectedVendor.price * formData.quantity).toFixed(2)}
                </span>
              </div>
              <p className="text-xs opacity-75 mt-1">
                {formData.quantity} × ₹{selectedVendor.price} = ₹{(selectedVendor.price * formData.quantity).toFixed(2)}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary flex-1 flex items-center justify-center space-x-2"
              disabled={submitting || !formData.vendorId}
            >
              {submitting ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  <span>Add Order</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddTiffinModal
