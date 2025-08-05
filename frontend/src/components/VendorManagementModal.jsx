import React, { useState, useEffect } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { X, Store, Plus, Edit2, Trash2, DollarSign } from 'lucide-react'

function VendorManagementModal({ isOpen, onClose, onVendorAdded }) {
  const [vendors, setVendors] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingVendor, setEditingVendor] = useState(null)
  
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    description: ''
  })
  const [submitting, setSubmitting] = useState(false)

  const fetchVendors = async () => {
    try {
      setLoading(true)
      const response = await axios.get('/api/vendors')
      setVendors(response.data.data || [])
    } catch (error) {
      console.error('Error fetching vendors:', error)
      toast.error('Failed to load vendors')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.name.trim() || !formData.price) {
      toast.error('Name and price are required')
      return
    }

    try {
      setSubmitting(true)
      
      if (editingVendor) {
        // Update existing vendor
        await axios.put(`/api/vendors/${editingVendor._id}`, formData)
        toast.success('Vendor updated successfully!')
      } else {
        // Create new vendor
        await axios.post('/api/vendors', formData)
        toast.success('Vendor added successfully!')
      }
      
      // Reset form and refresh vendors
      setFormData({ name: '', price: '', description: '' })
      setShowAddForm(false)
      setEditingVendor(null)
      fetchVendors()
      onVendorAdded?.()
    } catch (error) {
      console.error('Error saving vendor:', error)
      toast.error(error.response?.data?.error || 'Failed to save vendor')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (vendor) => {
    setFormData({
      name: vendor.name,
      price: vendor.price.toString(),
      description: vendor.description || ''
    })
    setEditingVendor(vendor)
    setShowAddForm(true)
  }

  const handleDelete = async (vendor) => {
    if (!confirm(`Are you sure you want to delete "${vendor.name}"?`)) {
      return
    }

    try {
      await axios.delete(`/api/vendors/${vendor._id}`)
      toast.success('Vendor deleted successfully!')
      fetchVendors()
      onVendorAdded?.()
    } catch (error) {
      console.error('Error deleting vendor:', error)
      toast.error('Failed to delete vendor')
    }
  }

  const cancelForm = () => {
    setFormData({ name: '', price: '', description: '' })
    setShowAddForm(false)
    setEditingVendor(null)
  }

  useEffect(() => {
    if (isOpen) {
      fetchVendors()
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-black flex items-center">
              <Store className="h-5 w-5 mr-2" />
              Manage Vendors
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Add, edit, or remove tiffin vendors
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
          {/* Add/Edit Form */}
          {showAddForm && (
            <div className="p-6 border-b border-gray-200 bg-gray-50">
              <h3 className="text-lg font-medium text-black mb-4">
                {editingVendor ? 'Edit Vendor' : 'Add New Vendor'}
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="label-field">Vendor Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="input-field"
                      placeholder="Enter vendor name"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="label-field">Price per Tiffin (₹)</label>
                    <input
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                      className="input-field"
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label className="label-field">Description (Optional)</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="input-field"
                    placeholder="Brief description about the vendor"
                    rows="2"
                  />
                </div>

                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={cancelForm}
                    className="btn-secondary flex-1"
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary flex-1"
                    disabled={submitting}
                  >
                    {submitting ? 'Saving...' : (editingVendor ? 'Update' : 'Add Vendor')}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Vendors List */}
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-black">
                Current Vendors ({vendors.length})
              </h3>
              {!showAddForm && (
                <button
                  onClick={() => setShowAddForm(true)}
                  className="btn-primary flex items-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Vendor</span>
                </button>
              )}
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-black border-t-transparent"></div>
              </div>
            ) : vendors.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Store className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">No vendors yet</p>
                <p className="text-sm">Add your first vendor to get started</p>
              </div>
            ) : (
              <div className="space-y-3">
                {vendors.map((vendor) => (
                  <div
                    key={vendor._id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium text-black">{vendor.name}</h4>
                          <div className="flex items-center text-green-600 bg-green-50 px-2 py-1 rounded-full text-sm">
                            <DollarSign className="h-3 w-3 mr-1" />
                            ₹{vendor.price}
                          </div>
                        </div>
                        {vendor.description && (
                          <p className="text-sm text-gray-600 mt-1">{vendor.description}</p>
                        )}
                        <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                          <span>Added by {vendor.createdBy?.name || 'Unknown'}</span>
                          <span>•</span>
                          <span>{new Date(vendor.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEdit(vendor)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Edit vendor"
                        >
                          <Edit2 className="h-4 w-4 text-gray-600" />
                        </button>
                        <button
                          onClick={() => handleDelete(vendor)}
                          className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete vendor"
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default VendorManagementModal
