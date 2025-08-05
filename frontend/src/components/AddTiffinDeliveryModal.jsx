import React, { useState, useEffect } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { X, Clock, Hash, Store, Plus, Check } from 'lucide-react'

function AddTiffinModal({ isOpen, onClose, day, userId, onDeliveryAdded }) {
  const [vendors, setVendors] = useState([])
  const [selectedVendor, setSelectedVendor] = useState('')
  const [time, setTime] = useState('12:00')
  const [quantity, setQuantity] = useState(1)
  const [loading, setLoading] = useState(false)
  const [vendorsLoading, setVendorsLoading] = useState(true)

  const fetchVendors = async () => {
    try {
      setVendorsLoading(true)
      const response = await axios.get('/api/vendors')
      setVendors(response.data.data || [])
    } catch (error) {
      console.error('Error fetching vendors:', error)
      toast.error('Failed to load vendors')
    } finally {
      setVendorsLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!selectedVendor) {
      toast.error('Please select a vendor')
      return
    }

    try {
      setLoading(true)
      const response = await axios.post(`/api/tiffin/schedule/${userId}/day/${day}/delivery`, {
        vendorId: selectedVendor,
        time,
        quantity: parseInt(quantity)
      })
      
      toast.success('Tiffin delivery added successfully!')
      onDeliveryAdded(response.data.schedule)
      onClose()
      
      // Reset form
      setSelectedVendor('')
      setTime('12:00')
      setQuantity(1)
    } catch (error) {
      console.error('Error adding delivery:', error)
      toast.error(error.response?.data?.error || 'Failed to add delivery')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      fetchVendors()
    }
  }, [isOpen])

  if (!isOpen) return null

  const selectedVendorData = vendors.find(v => v._id === selectedVendor)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-black">Add Tiffin Delivery</h2>
            <p className="text-sm text-gray-600 mt-1">
              Adding delivery for {day.charAt(0).toUpperCase() + day.slice(1)}
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
            <label className="label-field flex items-center">
              <Store className="h-4 w-4 mr-2" />
              Select Vendor
            </label>
            {vendorsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-black border-t-transparent"></div>
              </div>
            ) : (
              <div className="space-y-2">
                {vendors.length === 0 ? (
                  <div className="text-center py-4 text-gray-500">
                    <Store className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No vendors available</p>
                    <p className="text-sm">Add vendors first to create deliveries</p>
                  </div>
                ) : (
                  <div className="grid gap-2">
                    {vendors.map((vendor) => (
                      <label
                        key={vendor._id}
                        className={`cursor-pointer border-2 rounded-lg p-4 transition-all ${
                          selectedVendor === vendor._id
                            ? 'border-black bg-black text-white'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name="vendor"
                          value={vendor._id}
                          checked={selectedVendor === vendor._id}
                          onChange={(e) => setSelectedVendor(e.target.value)}
                          className="sr-only"
                        />
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{vendor.name}</p>
                            {vendor.description && (
                              <p className={`text-sm ${
                                selectedVendor === vendor._id ? 'text-gray-200' : 'text-gray-600'
                              }`}>
                                {vendor.description}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">₹{vendor.price}</p>
                            {selectedVendor === vendor._id && (
                              <Check className="h-5 w-5 mt-1 ml-auto" />
                            )}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Time Selection */}
          <div>
            <label className="label-field flex items-center">
              <Clock className="h-4 w-4 mr-2" />
              Delivery Time
            </label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="input-field"
              required
            />
          </div>

          {/* Quantity Selection */}
          <div>
            <label className="label-field flex items-center">
              <Hash className="h-4 w-4 mr-2" />
              Quantity
            </label>
            <div className="flex items-center space-x-4">
              <button
                type="button"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors"
              >
                -
              </button>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="input-field text-center w-20"
                min="1"
                max="10"
              />
              <button
                type="button"
                onClick={() => setQuantity(Math.min(10, quantity + 1))}
                className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors"
              >
                +
              </button>
            </div>
            <p className="text-sm text-gray-600 mt-1">Maximum 10 tiffins per delivery</p>
          </div>

          {/* Price Preview */}
          {selectedVendorData && (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Total Cost:</span>
                <span className="text-xl font-semibold text-black">
                  ₹{(selectedVendorData.price * quantity).toFixed(2)}
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                {quantity} × ₹{selectedVendorData.price} per tiffin
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex space-x-3 pt-4">
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
              className="btn-primary flex-1 flex items-center justify-center space-x-2"
              disabled={loading || !selectedVendor || vendors.length === 0}
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              <span>{loading ? 'Adding...' : 'Add Delivery'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddTiffinModal
