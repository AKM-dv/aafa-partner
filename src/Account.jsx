import { useState, useEffect } from 'react'
import './Account.css'
import BottomNavigation from './BottomNavigation'
import Settings from './Settings'
import Toast from './Toast'
import accountLogo from '/anact.jpeg'
import { providerApi } from './apiClient'
import { saveSession } from './authStorage'

function Account({ onBack, activeNavTab, onNavChange, onLogout, userData }) {
  const [activeNav, setActiveNav] = useState(activeNavTab || 'Account')
  const [showSettings, setShowSettings] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [toast, setToast] = useState(null)
  
  const showToast = (message, type = 'info') => {
    setToast({ message, type })
  }
  
  // Get provider data from userData - check multiple possible locations
  const providerData = userData?.providerDetails || userData?.provider || {}
  const isServiceProvider = userData?.isServiceProvider || !!userData?.providerDetails || !!userData?.provider
  
  // Debug logging
  useEffect(() => {
    if (isServiceProvider) {
      console.log('Account - Provider data:', {
        hasProviderDetails: !!userData?.providerDetails,
        hasProvider: !!userData?.provider,
        providerId: providerData?.id,
        fullName: providerData?.full_name,
        email: providerData?.email,
        hasBankDetails: !!providerData?.bank_details
      })
    }
  }, [userData, isServiceProvider, providerData])

  // Form state for edit modal
  const [editFormData, setEditFormData] = useState({
    full_name: '',
    email: '',
    gender: '',
    address: '',
    city: '',
    state: '',
    account_holder_name: '',
    bank_name: '',
    account_number: '',
    ifsc_code: ''
  })

  // Initialize form data when provider data is available
  useEffect(() => {
    const currentProviderData = userData?.providerDetails || userData?.provider || {}
    setEditFormData({
      full_name: currentProviderData?.full_name || userData?.name || userData?.user?.full_name || '',
      email: currentProviderData?.email || userData?.email || userData?.user?.email || '',
      gender: currentProviderData?.gender || userData?.user?.gender || '',
      address: currentProviderData?.address || '',
      city: currentProviderData?.city || userData?.user?.city || '',
      state: currentProviderData?.state || userData?.user?.state || '',
      account_holder_name: currentProviderData?.bank_details?.account_holder_name || '',
      bank_name: currentProviderData?.bank_details?.bank_name || '',
      account_number: currentProviderData?.bank_details?.account_number || '',
      ifsc_code: currentProviderData?.bank_details?.ifsc_code || ''
    })
  }, [providerData, userData])

  const handleNavChange = (tab) => {
    setActiveNav(tab)
    onNavChange?.(tab)
    if (tab === 'Home') {
      onBack?.()
    }
  }

  const handleEditClick = () => {
    // Initialize form with current data - prioritize provider data
    const currentProviderData = userData?.providerDetails || userData?.provider || {}
    setEditFormData({
      full_name: currentProviderData?.full_name || userData?.name || userData?.user?.full_name || '',
      email: currentProviderData?.email || userData?.email || userData?.user?.email || '',
      gender: currentProviderData?.gender || userData?.user?.gender || '',
      address: currentProviderData?.address || '',
      city: currentProviderData?.city || userData?.user?.city || '',
      state: currentProviderData?.state || userData?.user?.state || '',
      account_holder_name: currentProviderData?.bank_details?.account_holder_name || '',
      bank_name: currentProviderData?.bank_details?.bank_name || '',
      account_number: currentProviderData?.bank_details?.account_number || '',
      ifsc_code: currentProviderData?.bank_details?.ifsc_code || ''
    })
    setShowEditModal(true)
  }

  const handleSaveProfile = async () => {
    // Get phone number from multiple possible locations - must be in format +91XXXXXXXXXX
    const phoneNumber = providerData?.phone_number || 
                       userData?.fullPhoneNumber ||
                       userData?.phoneNumber ||
                       (userData?.countryCode && userData?.phoneNumber ? `${userData.countryCode}${userData.phoneNumber}` : null) ||
                       userData?.user?.phone_number
    
    // Ensure phone number is in correct format
    let formattedPhone = phoneNumber
    if (formattedPhone && !formattedPhone.startsWith('+')) {
      // If it doesn't start with +, add country code
      formattedPhone = formattedPhone.startsWith('91') ? `+${formattedPhone}` : `+91${formattedPhone}`
    }
    
    if (!userData?.token || !formattedPhone) {
      showToast('Unable to update profile. Phone number is required.', 'error')
      return
    }

    setIsSaving(true)
    try {
      const response = await providerApi.updateProfile({
        phoneNumber: formattedPhone,
        token: userData.token,
        full_name: editFormData.full_name,
        email: editFormData.email,
        gender: editFormData.gender,
        address: editFormData.address,
        city: editFormData.city,
        state: editFormData.state,
        account_holder_name: editFormData.account_holder_name,
        bank_name: editFormData.bank_name,
        account_number: editFormData.account_number,
        ifsc_code: editFormData.ifsc_code
      })
      
      // Update local userData with the response from server
      if (response?.provider) {
        // Update the provider details in userData
        if (userData.providerDetails) {
          userData.providerDetails = {
            ...userData.providerDetails,
            ...response.provider
          }
        } else if (userData.provider) {
          userData.provider = {
            ...userData.provider,
            ...response.provider
          }
        } else {
          userData.providerDetails = response.provider
        }
        
        // Update name and email at top level for display
        if (response.provider.full_name) {
          userData.name = response.provider.full_name
        }
        if (response.provider.email) {
          userData.email = response.provider.email
        }
        
        // Save updated session
        saveSession({
          token: userData.token,
          userData: userData
        })
      }
      
      setShowEditModal(false)
      showToast('Profile updated successfully!', 'success')
      // Force re-render to show updated data after a short delay
      setTimeout(() => {
        window.location.reload()
      }, 1500)
    } catch (error) {
      console.error('Failed to update profile:', error)
      showToast(error?.message || 'Failed to update profile. Please try again.', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  if (showSettings) {
    return <Settings onBack={() => setShowSettings(false)} />
  }

  const phoneDisplay = userData?.countryCode && userData?.phoneNumber
    ? `${userData.countryCode} ${userData.phoneNumber}`
    : providerData?.phone_number || userData?.phoneNumber || userData?.fullPhoneNumber || userData?.user?.phone_number || '+91 8950512356'

  const displayName = providerData?.full_name || userData?.name || userData?.user?.full_name || 'Provider'
  const initials = displayName ? displayName.charAt(0).toUpperCase() : 'P'

  const menuItems = [
    {
      id: 'Dashboard',
      label: 'Dashboard',
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M4 3.33333H9.16667V9.16667H4V3.33333Z" stroke="#000000" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M10.8333 3.33333H16V6.66667H10.8333V3.33333Z" stroke="#000000" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M10.8333 8.33333H16V16.6667H10.8333V8.33333Z" stroke="#000000" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M4 10.8333H9.16667V16.6667H4V10.8333Z" stroke="#000000" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
      action: () => handleNavChange('Home')
    },
    {
      id: 'Withdrawal',
      label: 'Withdrawal',
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M3.33333 5.83333H15.8333C16.7538 5.83333 17.5 6.57953 17.5 7.5V15C17.5 15.9205 16.7538 16.6667 15.8333 16.6667H4.16667C3.24619 16.6667 2.5 15.9205 2.5 15V6.66667C2.5 6.20643 2.8731 5.83333 3.33333 5.83333Z" stroke="#000000" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M6.66666 3.33333H13.3333" stroke="#000000" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
      action: () => handleNavChange('Withdrawal')
    },
    {
      id: 'Settings',
      label: 'Settings',
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M10 12.5C11.3807 12.5 12.5 11.3807 12.5 10C12.5 8.61929 11.3807 7.5 10 7.5C8.61929 7.5 7.5 8.61929 7.5 10C7.5 11.3807 8.61929 12.5 10 12.5Z" stroke="#000000" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M16.6667 10C16.6667 10.5333 16.6 11.05 16.4833 11.55L18.3333 12.95L16.7167 15.55L14.6 14.9C13.9 15.4333 13.1333 15.85 12.3 16.1167L12 18.3333H8L7.7 16.1167C6.86667 15.85 6.1 15.4333 5.4 14.9L3.28333 15.55L1.66667 12.95L3.51667 11.55C3.4 11.05 3.33333 10.5333 3.33333 10C3.33333 9.46667 3.4 8.95 3.51667 8.45L1.66667 7.05L3.28333 4.45L5.4 5.1C6.1 4.56667 6.86667 4.15 7.7 3.88333L8 1.66667H12L12.3 3.88333C13.1333 4.15 13.9 4.56667 14.6 5.1L16.7167 4.45L18.3333 7.05L16.4833 8.45C16.6 8.95 16.6667 9.46667 16.6667 10Z" stroke="#000000" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
      action: () => setShowSettings(true)
    },
    {
      id: 'Orders',
      label: 'Orders',
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M5 4H15C15.5523 4 16 4.44772 16 5V15C16 15.5523 15.5523 16 15 16H5C4.44772 16 4 15.5523 4 15V5C4 4.44772 4.44772 4 5 4Z" stroke="#000000" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M7 2H13" stroke="#000000" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M7 8H13" stroke="#000000" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
      action: () => onNavChange?.('Orders')
    }
  ]

  return (
    <div className="account-container">
      <div className="account-content">
        <header className="account-header">
          <div className="account-brand">
            <img src={accountLogo} alt="Active Aid Fitness Academy Logo" className="account-logo-icon" />
          </div>
          <button className="account-edit-button" aria-label="Edit Profile" onClick={handleEditClick}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 17.25V21H6.75L17.81 9.94L14.06 6.19L3 17.25Z" stroke="#000000" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </header>

        <section className="account-profile-section">
          <div className="account-profile-left">
            <div className="account-profile-picture">
              <span className="profile-placeholder-text">{initials}</span>
            </div>
            <div className="account-user-info">
              <p className="account-user-name">{displayName}</p>
              <p className="account-phone">{phoneDisplay}</p>
            </div>
          </div>
          <div className="account-enquiries-card">
            <div className="enquiries-icon">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5 3.33333H15C16.3807 3.33333 17.5 4.45267 17.5 5.83333V14.1667C17.5 15.5473 16.3807 16.6667 15 16.6667H5C3.61929 16.6667 2.5 15.5473 2.5 14.1667V5.83333C2.5 4.45267 3.61929 3.33333 5 3.33333Z" stroke="#FF6B2B" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M6.66666 6.66667H13.3333" stroke="#FF6B2B" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M6.66666 10H10" stroke="#FF6B2B" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <p className="enquiries-text">Enquiries</p>
          </div>
        </section>

        <section className="account-menu-section">
          {menuItems.map((item) => (
            <div key={item.id} className="account-menu-item" onClick={item.action}>
              <div className="menu-item-left">
                {item.icon}
                <span className="menu-item-text">{item.label}</span>
              </div>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5 3L9 7L5 11" stroke="#999999" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          ))}
        </section>

        <button className="account-logout-button" type="button" onClick={onLogout}>
          Logout
        </button>

        <BottomNavigation activeTab={activeNav} onTabChange={handleNavChange} />
      </div>

      {showEditModal && (
        <div className="edit-modal-overlay" onClick={() => !isSaving && setShowEditModal(false)}>
          <div className="edit-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="edit-modal-header">
              <h2 className="edit-modal-title">Edit Profile</h2>
              <button 
                className="edit-modal-close" 
                onClick={() => setShowEditModal(false)}
                disabled={isSaving}
              >
                ×
              </button>
            </div>
            
            <div className="edit-modal-body">
              <div className="edit-form-group">
                <label className="edit-form-label">Full Name *</label>
                <input
                  type="text"
                  className="edit-form-input"
                  value={editFormData.full_name}
                  onChange={(e) => setEditFormData({ ...editFormData, full_name: e.target.value })}
                  disabled={isSaving}
                />
              </div>

              <div className="edit-form-group">
                <label className="edit-form-label">Email *</label>
                <input
                  type="email"
                  className="edit-form-input"
                  value={editFormData.email}
                  onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                  disabled={isSaving}
                />
              </div>

              <div className="edit-form-group">
                <label className="edit-form-label">Gender</label>
                <select
                  className="edit-form-input"
                  value={editFormData.gender}
                  onChange={(e) => setEditFormData({ ...editFormData, gender: e.target.value })}
                  disabled={isSaving}
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="edit-form-group">
                <label className="edit-form-label">Address</label>
                <textarea
                  className="edit-form-input"
                  rows="3"
                  value={editFormData.address}
                  onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                  disabled={isSaving}
                />
              </div>

              <div className="edit-form-group">
                <label className="edit-form-label">City</label>
                <input
                  type="text"
                  className="edit-form-input"
                  value={editFormData.city}
                  onChange={(e) => setEditFormData({ ...editFormData, city: e.target.value })}
                  disabled={isSaving}
                />
              </div>

              <div className="edit-form-group">
                <label className="edit-form-label">State</label>
                <input
                  type="text"
                  className="edit-form-input"
                  value={editFormData.state}
                  onChange={(e) => setEditFormData({ ...editFormData, state: e.target.value })}
                  disabled={isSaving}
                />
              </div>

              <h3 className="edit-section-heading">Bank Details</h3>

              <div className="edit-form-group">
                <label className="edit-form-label">Account Holder Name</label>
                <input
                  type="text"
                  className="edit-form-input"
                  value={editFormData.account_holder_name}
                  onChange={(e) => setEditFormData({ ...editFormData, account_holder_name: e.target.value })}
                  disabled={isSaving}
                />
              </div>

              <div className="edit-form-group">
                <label className="edit-form-label">Bank Name</label>
                <input
                  type="text"
                  className="edit-form-input"
                  value={editFormData.bank_name}
                  onChange={(e) => setEditFormData({ ...editFormData, bank_name: e.target.value })}
                  disabled={isSaving}
                />
              </div>

              <div className="edit-form-group">
                <label className="edit-form-label">Account Number</label>
                <input
                  type="text"
                  className="edit-form-input"
                  value={editFormData.account_number}
                  onChange={(e) => setEditFormData({ ...editFormData, account_number: e.target.value })}
                  disabled={isSaving}
                />
              </div>

              <div className="edit-form-group">
                <label className="edit-form-label">IFSC Code</label>
                <input
                  type="text"
                  className="edit-form-input"
                  value={editFormData.ifsc_code}
                  onChange={(e) => setEditFormData({ ...editFormData, ifsc_code: e.target.value.toUpperCase() })}
                  disabled={isSaving}
                />
              </div>

              <div className="edit-form-group">
                <label className="edit-form-label">Mobile Number</label>
                <input
                  type="text"
                  className="edit-form-input"
                  value={phoneDisplay}
                  disabled
                  style={{ backgroundColor: '#f5f5f5', color: '#999' }}
                />
                <small className="edit-form-hint">Mobile number cannot be changed</small>
              </div>
            </div>

            <div className="edit-modal-footer">
              <button
                className="edit-modal-cancel"
                onClick={() => setShowEditModal(false)}
                disabled={isSaving}
              >
                Cancel
              </button>
              <button
                className="edit-modal-save"
                onClick={handleSaveProfile}
                disabled={isSaving || !editFormData.full_name || !editFormData.email}
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
          duration={3000}
        />
      )}
    </div>
  )
}

export default Account

