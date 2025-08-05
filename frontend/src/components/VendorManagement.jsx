import React, { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Store, DollarSign, User, X, Check } from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'

function VendorManagement({ isOpen, onClose }) {
  const [vendors, setVendors] = useState([])
  const [loading, setLoading] = useState(false)
  const [isAddingVendor, setIsAddingVendor] = useState(false)
  const [editingVendor, setEditingVendor] = useState(null)
  const [newVendor, setNewVendor] = useState({
    name: '',
    price: '',
    description: ''
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

  const handleAddVendor = async (e) => {
    e.preventDefault()
    
    if (!newVendor.name || !newVendor.price) {
      toast.error('Name and price are required')
      return
    }

    try {
      const response = await axios.post('/api/vendors', newVendor)
      setVendors([...vendors, response.data])
      setNewVendor({ name: '', price: '', description: '' })
      setIsAddingVendor(false)
      toast.success('Vendor added successfully!')
    } catch (error) {
      console.error('Error adding vendor:', error)
      toast.error(error.response?.data?.error || 'Failed to add vendor')
    }
  }

  const handleUpdateVendor = async (id, updatedData) => {
    try {
      const response = await axios.put(`/api/vendors/${id}`, updatedData)
      setVendors(vendors.map(v => v._id === id ? response.data : v))
      setEditingVendor(null)
      toast.success('Vendor updated successfully!')
    } catch (error) {
      console.error('Error updating vendor:', error)
      toast.error(error.response?.data?.error || 'Failed to update vendor')
    }
  }

  const handleDeleteVendor = async (id) => {
    if (!confirm('Are you sure you want to delete this vendor?')) return

    try {
      await axios.delete(`/api/vendors/${id}`)
      setVendors(vendors.filter(v => v._id !== id))
      toast.success('Vendor deleted successfully!')
    } catch (error) {
      console.error('Error deleting vendor:', error)
      toast.error(error.response?.data?.error || 'Failed to delete vendor')
    }
  }

  useEffect(() => {
    if (isOpen) {
      fetchVendors()
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Store className="h-6 w-6 text-black" />
            <div>
              <h2 className="text-xl font-semibold text-black">Vendor Management</h2>
              <p className="text-gray-600 text-sm">Manage tiffin vendors and their pricing</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsAddingVendor(true)}
              className="btn-primary flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Add Vendor</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Add Vendor Form */}
          {isAddingVendor && (
            <div className="card p-6 mb-6 border-2 border-black">
              <h3 className="text-lg font-semibold text-black mb-4">Add New Vendor</h3>
              <form onSubmit={handleAddVendor} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="label-field">Vendor Name</label>
                    <input
                      type="text"
                      value={newVendor.name}
                      onChange={(e) => setNewVendor({...newVendor, name: e.target.value})}
                      className="input-field"
                      placeholder="Enter vendor name"
                      required
                    />
                  </div>
                  <div>
                    <label className="label-field">Price per Tiffin (₹)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={newVendor.price}
                      onChange={(e) => setNewVendor({...newVendor, price: e.target.value})}
                      className="input-field"
                      placeholder="0.00"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="label-field">Description (Optional)</label>
                  <textarea
                    value={newVendor.description}
                    onChange={(e) => setNewVendor({...newVendor, description: e.target.value})}
                    className="input-field resize-none"
                    rows="2"
                    placeholder="Brief description of the vendor..."
                  />
                </div>
                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingVendor(false)
                      setNewVendor({ name: '', price: '', description: '' })
                    }}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    Add Vendor
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Vendors List */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-black border-t-transparent"></div>
            </div>
          ) : vendors.length === 0 ? (
            <div className="text-center py-12">
              <Store className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No vendors yet</h3>
              <p className="text-gray-600 mb-4">Add your first tiffin vendor to get started</p>
              <button
                onClick={() => setIsAddingVendor(true)}
                className="btn-primary"
              >
                Add First Vendor
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {vendors.map((vendor) => (
                <VendorCard
                  key={vendor._id}
                  vendor={vendor}
                  isEditing={editingVendor === vendor._id}
                  onEdit={() => setEditingVendor(vendor._id)}
                  onCancelEdit={() => setEditingVendor(null)}
                  onUpdate={handleUpdateVendor}
                  onDelete={handleDeleteVendor}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function VendorCard({ vendor, isEditing, onEdit, onCancelEdit, onUpdate, onDelete }) {
  const [editData, setEditData] = useState({
    name: vendor.name,
    price: vendor.price,
    description: vendor.description || ''
  })

  const handleSave = () => {
    if (!editData.name || !editData.price) {
      toast.error('Name and price are required')
      return
    }
    onUpdate(vendor._id, editData)
  }

  return (
    <div className="card p-6">
      {isEditing ? (
        <div className="space-y-4">
          <input
            type="text"
            value={editData.name}
            onChange={(e) => setEditData({...editData, name: e.target.value})}
            className="input-field font-medium"
            placeholder="Vendor name"
          />
          <input
            type="number"
            min="0"
            step="0.01"
            value={editData.price}
            onChange={(e) => setEditData({...editData, price: e.target.value})}
            className="input-field"
            placeholder="Price"
          />
          <textarea
            value={editData.description}
            onChange={(e) => setEditData({...editData, description: e.target.value})}
            className="input-field resize-none"
            rows="2"
            placeholder="Description"
          />
          <div className="flex space-x-2">
            <button
              onClick={handleSave}
              className="btn-primary flex items-center space-x-1 text-sm px-3 py-1.5"
            >
              <Check className="h-3 w-3" />
              <span>Save</span>
            </button>
            <button
              onClick={onCancelEdit}
              className="btn-secondary text-sm px-3 py-1.5"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-black">{vendor.name}</h3>
              {vendor.description && (
                <p className="text-gray-600 text-sm mt-1">{vendor.description}</p>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={onEdit}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Edit className="h-4 w-4 text-gray-600" />
              </button>
              <button
                onClick={() => onDelete(vendor._id)}
                className="p-2 hover:bg-red-100 rounded-lg transition-colors"
              >
                <Trash2 className="h-4 w-4 text-red-600" />
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center text-green-600">
                <DollarSign className="h-4 w-4 mr-1" />
                <span className="font-semibold">₹{vendor.price}</span>
              </div>
            </div>
            
            {vendor.createdBy && (
              <div className="flex items-center text-gray-500 text-xs">
                <User className="h-3 w-3 mr-1" />
                <span>by {vendor.createdBy.name}</span>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default VendorManagement
