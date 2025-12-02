import { useState } from 'react'
import './GetStarted.css'
import OTP from './OTP'
import Verification from './Verification'
import { authApi, providerApi } from './apiClient'
import { saveSession } from './authStorage'
import { requestProviderLocation } from './locationService'
import phoneIcon from '/phone.png'
import getIllustration from '/get-started.png'

function GetStarted({ onBack, onLogout, onShowHome, onRequireProfile }) {
  const [phoneNumber, setPhoneNumber] = useState('')
  const [countryCode, setCountryCode] = useState('+91')
  const [showOTP, setShowOTP] = useState(false)
  const [showVerification, setShowVerification] = useState(false)
  const [errors, setErrors] = useState({})
  const [savedUserData, setSavedUserData] = useState(null)
  const [sessionId, setSessionId] = useState(null)
  const [fullPhoneNumber, setFullPhoneNumber] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [apiError, setApiError] = useState('')
  const [statusModal, setStatusModal] = useState(null)
  const [statusCheckInProgress, setStatusCheckInProgress] = useState(false)

  const isPhoneValid = phoneNumber.length === 10

  const handlePhoneChange = (e) => {
    const digitsOnly = e.target.value.replace(/\D/g, '')
    if (digitsOnly.length <= 10) {
      setPhoneNumber(digitsOnly)
      setErrors((prev) => {
        if (!prev.phone) return prev
        const { phone, ...rest } = prev
        return rest
      })
    }
  }

  const sendLoginOtp = async () => {
    setSubmitting(true)
    setApiError('')
    try {
      const data = await authApi.sendLoginOtp(phoneNumber)
      setSessionId(data.session_id || null)
      setFullPhoneNumber(data.phone || `${countryCode}${phoneNumber}`)
      setShowOTP(true)
    } catch (error) {
      setApiError(error.message || 'Failed to send OTP')
    } finally {
      setSubmitting(false)
    }
  }

  const handleContinue = () => {
    if (!isPhoneValid) {
      setErrors({ phone: 'Enter a valid 10-digit mobile number' })
      return
    }
    sendLoginOtp()
  }

  const handleVerifySuccess = () => {
    setShowOTP(false)
    setShowVerification(true)
  }

  const attachLocationToData = async (data) => {
    if (data?.latitude && data?.longitude) {
      return data
    }
    try {
      const coords = await requestProviderLocation()
      return {
        ...data,
        latitude: coords.latitude,
        longitude: coords.longitude,
        locationAccuracy: coords.accuracy
      }
    } catch (error) {
      console.warn('Location permission denied or unavailable:', error)
      return data
    }
  }

  const syncLocationWithBackend = async (data) => {
    const providerId = data?.providerDetails?.id || data?.provider_id
    if (!providerId || !data?.token || !data?.latitude || !data?.longitude) {
      return
    }
    try {
      await providerApi.setLocation({
        providerId,
        latitude: data.latitude,
        longitude: data.longitude,
        isOnline: 1,
        token: data.token
      })
    } catch (error) {
      console.error('Failed to sync provider location:', error)
    }
  }

  const handleVerifiedUser = async (verificationData) => {
    setShowVerification(false)
    setShowOTP(false)
    const payload = verificationData || {}
    let normalizedData = {
      phoneNumber,
      countryCode,
      fullPhoneNumber,
      sessionId,
      isRegistered: payload?.isRegistered ?? true,
      ...payload
    }
    normalizedData = await attachLocationToData(normalizedData)
    saveSession({
      token: normalizedData.token || payload?.token,
      userData: normalizedData
    })
    await syncLocationWithBackend(normalizedData)
    onShowHome?.(normalizedData)
  }

  const showStatusModal = (config) => {
    setStatusModal({
      buttonLabel: 'Okay',
      ...config
    })
  }

  const handleOtpVerification = async (verificationData) => {
    const mergedData = {
      phoneNumber,
      countryCode,
      fullPhoneNumber,
      sessionId,
      ...verificationData
    }

    // Extract service provider data if available
    const isServiceProvider = verificationData?.is_service_provider === true
    const providerData = verificationData?.provider || null
    const userData = verificationData?.user || null

    // Merge user and provider data
    if (userData) {
      mergedData.name = userData.full_name || userData.name || mergedData.name
      mergedData.email = userData.email || mergedData.email
      mergedData.user = userData
    }

    // Store provider data if service provider
    if (isServiceProvider && providerData) {
      mergedData.isServiceProvider = true
      mergedData.providerDetails = providerData
      mergedData.provider_id = providerData.id
      mergedData.name = providerData.full_name || mergedData.name
      mergedData.email = providerData.email || mergedData.email
      console.log('Provider data extracted:', {
        isServiceProvider,
        providerId: providerData.id,
        fullName: providerData.full_name,
        email: providerData.email,
        hasBankDetails: !!providerData.bank_details
      })
    }

    const registrationFlag = verificationData?.registered
    const isRegistered =
      registrationFlag === true ||
      registrationFlag === 'true' ||
      registrationFlag === 1 ||
      registrationFlag === '1'

    if (!isRegistered) {
      let profilePayload = {
        ...mergedData,
        isRegistered: false,
        nextStep: 'userInfo'
      }
      profilePayload = await attachLocationToData(profilePayload)
      setSavedUserData((prev) => ({ ...prev, ...profilePayload }))
      saveSession({
        token: profilePayload.token,
        userData: profilePayload
      })
      setShowOTP(false)
      setShowVerification(false)
      onRequireProfile?.(profilePayload)
      return
    }

    const formattedPhone =
      fullPhoneNumber && fullPhoneNumber.startsWith('+')
        ? fullPhoneNumber
        : `${countryCode}${phoneNumber}`

    setStatusCheckInProgress(true)
    setShowOTP(false)
    setShowVerification(false)
    setApiError('')

    try {
      const statusResponse = await authApi.verifyProviderStatus(formattedPhone)

      if (statusResponse?.redirect_to_registration || statusResponse?.registered === false) {
        let profilePayload = {
          ...mergedData,
          isRegistered: false,
          nextStep: 'userInfo'
        }
        profilePayload = await attachLocationToData(profilePayload)
        setSavedUserData((prev) => ({ ...prev, ...profilePayload }))
        saveSession({
          token: profilePayload.token,
          userData: profilePayload
        })
        onRequireProfile?.(profilePayload)
        return
      }

      if (statusResponse?.show_pending) {
        showStatusModal({
          type: 'pending',
          title: 'Verification In Progress',
          message:
            statusResponse?.message ||
            'Your documents are under review. We will notify you once the verification is complete.'
        })
        return
      }

      if (statusResponse?.show_rejected) {
        showStatusModal({
          type: 'rejected',
          title: 'Application Rejected',
          message:
            statusResponse?.message ||
            statusResponse?.provider?.verification_notes ||
            'We could not approve your application. Please reach out to support to resubmit your details.'
        })
        return
      }

      // Merge provider data - prioritize data from verify response, then status check
      const finalProviderData = providerData || statusResponse?.provider || null
      let verifiedPayload = {
        ...mergedData,
        isRegistered: true,
        providerStatus: statusResponse?.status || finalProviderData?.status,
        providerDetails: finalProviderData,
        isServiceProvider: isServiceProvider || !!finalProviderData
      }
      
      // Ensure provider_id is set
      if (finalProviderData?.id) {
        verifiedPayload.provider_id = finalProviderData.id
      }
      
      // Ensure we have the latest provider data
      if (finalProviderData) {
        verifiedPayload.name = finalProviderData.full_name || verifiedPayload.name
        verifiedPayload.email = finalProviderData.email || verifiedPayload.email
      }
      
      await handleVerifiedUser(verifiedPayload)
    } catch (error) {
      showStatusModal({
        type: 'error',
        title: 'Unable to Continue',
        message: error?.message || 'We could not confirm your account status. Please try again.'
      })
    } finally {
      setStatusCheckInProgress(false)
    }
  }

  const handleResendOtp = () => {
    if (!isPhoneValid) return Promise.resolve()
    return sendLoginOtp()
  }

  if (showVerification) {
    return (
      <Verification
        onBack={() => {
          setShowVerification(false)
          setShowOTP(false)
        }}
        onContinue={(verificationData) => {
          setSavedUserData(verificationData)
        }}
        onShowHome={handleVerifiedUser}
        onSaveUser={(userInfo) => {
          setSavedUserData((prev) => ({ ...prev, ...userInfo }))
        }}
        phoneNumber={phoneNumber}
        countryCode={countryCode}
      />
    )
  }

  if (showOTP) {
    return (
      <OTP
        onBack={() => setShowOTP(false)}
        phoneNumber={fullPhoneNumber || `${countryCode}${phoneNumber}`}
        sessionId={sessionId}
        onLogout={onLogout}
        onVerifySuccess={handleOtpVerification}
        onResendOtp={handleResendOtp}
      />
    )
  }

  return (
    <div className="get-started-container">
      <div className="get-started-content">
        <div className="header-section">
          <button className="back-button" onClick={onBack} aria-label="Go back">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <line x1="18" y1="12" x2="6" y2="12" stroke="black" strokeWidth="2" strokeLinecap="round" />
              <path d="M6 12L12 6M6 12L12 18" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        <div className="top-section">
          <div className="phone-icon-container">
            <img src={phoneIcon} alt="Phone" className="phone-icon" />
          </div>
          <div className="heading-with-stars">
            <h1 className="get-started-heading">Get Started</h1>
            <div className="stars-container" aria-hidden="true">
              <span className="star-icon">★</span>
              <span className="star-icon">★</span>
              <span className="star-icon">★</span>
            </div>
          </div>
          <div className="description-section">
            <p className="description-text">Enter your registered mobile number to receive a verification code.</p>
            <p className="description-text">This helps us keep your account secure.</p>
          </div>
        </div>

        <div className="form-section">
          {statusCheckInProgress && (
            <div className="status-check-banner">
              Checking your account status...
            </div>
          )}
          <div className="phone-input-wrapper">
            <div className={`phone-input-container ${errors.phone ? 'error' : ''}`}>
              <div className="country-code-selector">
                {countryCode}
                <svg width="10" height="10" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 4.5L6 7.5L9 4.5" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <input
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                className="phone-input"
                placeholder="Enter mobile number"
                value={phoneNumber}
                onChange={handlePhoneChange}
                maxLength={10}
              />
            </div>
            {errors.phone && <p className="error-message">{errors.phone}</p>}
          </div>

          <button
            className={`continue-button ${(!isPhoneValid || submitting || statusCheckInProgress) ? 'disabled' : ''}`}
            onClick={handleContinue}
            disabled={!isPhoneValid || submitting || statusCheckInProgress}
            type="button"
          >
            {submitting ? 'Sending...' : 'Continue'}
          </button>

          {apiError && <p className="error-message">{apiError}</p>}

          <p className="terms-text">
            By continuing, you agree to our Terms of Service and acknowledge our Privacy Policy.
          </p>
        </div>

        <div className="illustration-bottom" aria-hidden="true">
          <img src={getIllustration} alt="Pet care illustration" className="get-started-illustration" />
        </div>
      </div>
      {statusModal && (
        <div className="status-modal-overlay">
          <div className="status-modal">
            <h2 className="status-modal-title">{statusModal.title}</h2>
            <p className="status-modal-message">{statusModal.message}</p>
            {statusModal.subText && <p className="status-modal-subtext">{statusModal.subText}</p>}
            <button
              type="button"
              className="status-modal-button"
              onClick={() => {
                if (statusModal?.onConfirm === 'register') {
                  onRequireProfile?.({
                    ...(savedUserData || {}),
                    isRegistered: false
                  })
                }
                setStatusModal(null)
              }}
            >
              {statusModal.buttonLabel || 'Okay'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default GetStarted

