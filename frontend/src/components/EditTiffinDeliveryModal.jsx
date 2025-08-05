import React, { useState, useEffect } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { X, Clock, Hash, Store, Edit } from 'lucide-react'

function EditTiffinDeliveryModal({ isOpen, onClose, delivery, onDeliveryUpdated }) {
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
      setVendors(response.data || [])
    } catch (error) {
      console.error('Error fetching vendors:', error)
      toast.error('Failed to load vendors')
    } finally {
      setVendorsLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      fetchVendors()
      if (delivery) {
        setSelectedVendor(delivery.vendorId?._id || delivery.vendorId || '')
        setTime(delivery.time || '12:00')
        setQuantity(delivery.quantity || 1)
      }
    }
  }, [isOpen, delivery])

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!selectedVendor) {
      toast.error('Please select a vendor')
      return
    }

    try {
      setLoading(true)
      await onDeliveryUpdated({
        vendorId: selectedVendor,
        time,
        quantity: parseInt(quantity)
      })
      
      onClose()
    } catch (error) {
      console.error('Error updating delivery:', error)
      toast.error('Failed to update delivery')
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
              <Edit className="h-5 w-5 mr-2" />
              Edit Tiffin Delivery
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Update delivery details
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Vendor Selection */}
          <div>
            <label className="label-field">Select Vendor</label>
            {vendorsLoading ? (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-black border-t-transparent"></div>
              </div>
            ) : (
              <select
                value={selectedVendor}
                onChange={(e) => setSelectedVendor(e.target.value)}
                className="input-field"
                required
              >
                <option value="">Choose a vendor</option>
                {vendors.map((vendor) => (
                  <option key={vendor._id} value={vendor._id}>
                    {vendor.name} - ₹{vendor.price}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Time */}
          <div>
            <label className="label-field">Delivery Time</label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="input-field pl-10"
                required
              />
            </div>
          </div>

          {/* Quantity */}
          <div>
            <label className="label-field">Quantity</label>
            <div className="relative">
              <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="number"
                min="1"
                max="10"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="input-field pl-10"
                required
              />
            </div>
          </div>

          {/* Vendor Info Display */}
          {selectedVendor && vendors.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-black text-white rounded-lg">
                  <Store className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  {(() => {
                    const vendor = vendors.find(v => v._id === selectedVendor)
                    return vendor ? (
                      <div>
                        <p className="font-medium text-black">{vendor.name}</p>
                        <p className="text-sm text-gray-600">₹{vendor.price} per tiffin</p>
                        <p className="text-sm font-medium text-green-600">
                          Total: ₹{(vendor.price * quantity).toFixed(2)}
                        </p>
                      </div>
                    ) : null
                  })()}
                </div>
              </div>
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
              className="btn-primary flex-1"
              disabled={loading || !selectedVendor}
            >
              {loading ? 'Updating...' : 'Update Delivery'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EditTiffinDeliveryModal
