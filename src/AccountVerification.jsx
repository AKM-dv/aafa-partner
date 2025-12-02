import { useState } from 'react'
import './AccountVerification.css'
import accountLogo from '/anact.jpeg'
import { authApi, providerApi } from './apiClient'

function AccountVerification({ onBack, onNext, onReturnToLogin, initialData, phoneNumber, countryCode }) {
  const [accountHolderName, setAccountHolderName] = useState(initialData?.accountHolderName || '')
  const [bankName, setBankName] = useState(initialData?.bankName || '')
  const [accountNumber, setAccountNumber] = useState(initialData?.accountNumber || '')
  const [ifscCode, setIfscCode] = useState(initialData?.ifscCode || '')
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [showSuccessModal, setShowSuccessModal] = useState(false)

  const handleContinue = async () => {
    const newErrors = {}
    
    if (!accountHolderName.trim()) {
      newErrors.accountHolderName = 'Account holder name is required'
    }
    if (!bankName.trim()) {
      newErrors.bankName = 'Bank name is required'
    }
    if (!accountNumber.trim()) {
      newErrors.accountNumber = 'Account number is required'
    }
    if (!ifscCode.trim()) {
      newErrors.ifscCode = 'IFSC code is required'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setErrors({})
    setSubmitError('')
    setIsSubmitting(true)

    try {
      const formData = new FormData()

      const data = initialData || {}
      const fullName = data.fullName || data.name || ''
      const email = data.email || ''
      const gender = data.gender || ''
      const state = data.state || ''
      const city = data.city || ''
      const phone = data.phoneNumber || data.phone_number || phoneNumber || ''
      const address = data.address || `${city}, ${state}`
      const pincode = data.pincode || ''
      const latitude = data.latitude || null
      const longitude = data.longitude || null

      console.log('Registration data being sent:', {
        fullName,
        email,
        gender,
        state,
        city,
        phone,
        address,
        pincode,
        latitude,
        longitude,
        accountHolderName,
        bankName,
        accountNumber,
        ifscCode,
        selectedSubcategories: data.selectedSubcategories,
        services_provided: data.services_provided,
        hasProfileImage: !!data.profileImage,
        hasAadhar: !!data.aadharFile,
        hasPan: !!data.panFile,
        hasDegree: !!data.degreeFile,
        hasPortfolio: !!(data.portfolioFiles?.length || data.workImages?.length || data.portfolioFile)
      })

      if (!fullName || !email || !gender || !state || !city || !phone) {
        throw new Error('Missing required fields. Please complete all previous steps.')
      }
      if (!pincode) {
        throw new Error('Pincode is missing. Please go back and fill your address details.')
      }

      formData.append('full_name', fullName)
      formData.append('phone_number', phone)
      formData.append('email', email)
      formData.append('gender', gender)
      formData.append('address', address)
      formData.append('city', city)
      formData.append('state', state)
      formData.append('pincode', pincode)
      if (latitude && longitude) {
        formData.append('latitude', latitude)
        formData.append('longitude', longitude)
      }
      formData.append('account_holder_name', accountHolderName.trim())
      formData.append('bank_name', bankName.trim())
      formData.append('account_number', accountNumber.trim())
      formData.append('ifsc_code', ifscCode.trim())

      let servicesProvided = []
      if (data.services_provided && Array.isArray(data.services_provided)) {
        servicesProvided = data.services_provided
      } else if (data.selectedSubcategories) {
        servicesProvided = Object.values(data.selectedSubcategories).flat()
      }

      if (servicesProvided.length === 0) {
        throw new Error('Please select at least one service.')
      }

      console.warn('⚠️ services_provided contains string IDs:', servicesProvided)
      console.warn('⚠️ Backend expects numeric subcategory IDs. If registration fails, backend needs to either:')
      console.warn('   1. Accept string identifiers, OR')
      console.warn('   2. Provide an API to map string IDs to numeric IDs')
      
      formData.append('services_provided', JSON.stringify(servicesProvided))

      if (data.profileImage) {
        formData.append('profile_photo', data.profileImage)
      }
      if (data.aadharFile) {
        formData.append('aadhaar_document', data.aadharFile)
      }
      if (data.panFile) {
        formData.append('pan_document', data.panFile)
      }
      if (data.degreeFile) {
        formData.append('degree_certificate', data.degreeFile)
      }
      if (data.workImages && Array.isArray(data.workImages)) {
        data.workImages.forEach((image) => {
          if (image) formData.append('previous_work_images', image)
        })
      } else if (data.portfolioFile) {
        formData.append('previous_work_images', data.portfolioFile)
      }

      console.log('FormData entries:')
      for (let pair of formData.entries()) {
        if (pair[1] instanceof File) {
          console.log(pair[0], ':', pair[1].name, `(${pair[1].size} bytes)`)
        } else {
          console.log(pair[0], ':', pair[1])
        }
      }

      const response = await authApi.registerProvider(formData)

      if (response?.provider_id && latitude && longitude && data.token) {
        try {
          await providerApi.setLocation({
            providerId: response.provider_id,
            latitude,
            longitude,
            isOnline: 0,
            token: data.token
          })
        } catch (locationError) {
          console.error('Failed to sync provider location after registration:', locationError)
        }
      }
      
      console.log('Registration response:', response)
      setShowSuccessModal(true)
    } catch (error) {
      console.error('Registration error:', error)
      setSubmitError(error?.message || 'Registration failed. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSuccessOk = () => {
    setShowSuccessModal(false)
    if (onReturnToLogin) {
      onReturnToLogin()
    } else {
      onNext?.({
        accountHolderName,
        bankName,
        accountNumber,
        ifscCode,
        ...(initialData || {})
      })
    }
  }

  return (
    <div className="account-verification-container">
      {showSuccessModal && (
        <div className="popup-overlay">
          <div className="popup-content">
            <h2 className="popup-title">Verification In Progress</h2>
            <p className="popup-message">
              Your registration has been submitted successfully. Your documents are under review. We will notify you once the verification is complete. Please check again later.
            </p>
            <div className="popup-divider"></div>
            <button className="popup-ok-button" onClick={handleSuccessOk}>
              Ok
            </button>
          </div>
        </div>
      )}
      <div className="account-verification-content">
        <div className="account-verification-header">
          <button className="back-button" onClick={onBack}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <line x1="18" y1="12" x2="6" y2="12" stroke="black" strokeWidth="2" strokeLinecap="round"/>
              <path d="M6 12L12 6M6 12L12 18" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div className="account-verification-logo">
            <img src={accountLogo} alt="Active Aid Fitness Academy Logo" className="logo-icon" />
          </div>
        </div>

        <div className="account-verification-body">
          <h1 className="account-verification-title">Account Verification</h1>

          <div className="account-verification-form">
            <div>
              <input
                type="text"
                placeholder="Account Holder Name"
                value={accountHolderName}
                onChange={(e) => {
                  setAccountHolderName(e.target.value)
                  if (errors.accountHolderName) {
                    setErrors({ ...errors, accountHolderName: '' })
                  }
                }}
                className={`account-input ${errors.accountHolderName ? 'error' : ''}`}
              />
              {errors.accountHolderName && <p className="account-error">{errors.accountHolderName}</p>}
            </div>

            <div>
              <input
                type="text"
                placeholder="Bank Name"
                value={bankName}
                onChange={(e) => {
                  setBankName(e.target.value)
                  if (errors.bankName) {
                    setErrors({ ...errors, bankName: '' })
                  }
                }}
                className={`account-input ${errors.bankName ? 'error' : ''}`}
              />
              {errors.bankName && <p className="account-error">{errors.bankName}</p>}
            </div>

            <div>
              <input
                type="text"
                placeholder="Account Number"
                value={accountNumber}
                onChange={(e) => {
                  setAccountNumber(e.target.value)
                  if (errors.accountNumber) {
                    setErrors({ ...errors, accountNumber: '' })
                  }
                }}
                className={`account-input ${errors.accountNumber ? 'error' : ''}`}
              />
              {errors.accountNumber && <p className="account-error">{errors.accountNumber}</p>}
            </div>

            <div>
              <input
                type="text"
                placeholder="IFSC Code"
                value={ifscCode}
                onChange={(e) => {
                  setIfscCode(e.target.value)
                  if (errors.ifscCode) {
                    setErrors({ ...errors, ifscCode: '' })
                  }
                }}
                className={`account-input ${errors.ifscCode ? 'error' : ''}`}
              />
              {errors.ifscCode && <p className="account-error">{errors.ifscCode}</p>}
            </div>
          </div>

          {submitError && <p className="account-error form-error">{submitError}</p>}

          <button 
            className={`save-continue-button ${isSubmitting ? 'disabled' : ''}`}
            onClick={handleContinue}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Save & Continue'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default AccountVerification

