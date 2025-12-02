import { useState, useRef, useEffect } from 'react'
import './OTP.css'
import { authApi } from './apiClient'

function OTP({ onBack, phoneNumber, sessionId, onLogout, onVerifySuccess, onResendOtp, customVerify }) {
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [activeIndex, setActiveIndex] = useState(0)
  const [verifying, setVerifying] = useState(false)
  const [error, setError] = useState('')
  const [statusMessage, setStatusMessage] = useState('')
  const inputRefs = useRef([])

  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus()
    }
  }, [])

  const handleChange = (index, value) => {
    if (value.length > 1) {
      value = value.slice(0, 1)
    }
    
    if (!/^\d*$/.test(value)) {
      return
    }

    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)

    if (value && index < 5) {
      setActiveIndex(index + 1)
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      setActiveIndex(index - 1)
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').slice(0, 6).split('')
    const newOtp = [...otp]
    pastedData.forEach((char, index) => {
      if (index < 6 && /^\d$/.test(char)) {
        newOtp[index] = char
      }
    })
    setOtp(newOtp)
    const nextIndex = Math.min(pastedData.length, 5)
    setActiveIndex(nextIndex)
    inputRefs.current[nextIndex]?.focus()
  }

  const isOtpComplete = otp.every(digit => digit !== '')

  const handleVerify = async () => {
    if (!isOtpComplete || verifying) {
      return
    }
    const otpCode = otp.join('')
    setVerifying(true)
    setError('')
    setStatusMessage('')

    try {
      if (customVerify) {
        const result = await customVerify(otpCode)
        onVerifySuccess?.(result || { otp: otpCode })
      } else {
        const data = await authApi.verifyLoginOtp(phoneNumber, otpCode)
        onVerifySuccess?.({
          ...data,
          phoneNumber,
          sessionId
        })
      }
    } catch (err) {
      setError(err.message || 'OTP verification failed')
    } finally {
      setVerifying(false)
    }
  }

  const handleResend = async () => {
    if (verifying) return
    setOtp(['', '', '', '', '', ''])
    setActiveIndex(0)
    inputRefs.current[0]?.focus()
    setError('')
    setStatusMessage('')
    try {
      await onResendOtp?.()
      setStatusMessage('OTP resent successfully')
    } catch (err) {
      setError(err?.message || 'Failed to resend OTP')
    }
  }

  return (
    <div className="otp-container">
      <div className="otp-content">
        <div className="otp-header-section">
          <button className="otp-back-button" onClick={onBack}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <line x1="18" y1="12" x2="6" y2="12" stroke="black" strokeWidth="2" strokeLinecap="round"/>
              <path d="M6 12L12 6M6 12L12 18" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <h1 className="otp-title">ENTER OTP</h1>
        </div>

        <div className="otp-body">
          <p className="otp-instruction">
            We've sent a 6-digit code to your phone number
          </p>

          <div className="otp-inputs-container">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={el => inputRefs.current[index] = el}
                type="text"
                className={`otp-input ${activeIndex === index ? 'active' : ''}`}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={handlePaste}
                onFocus={() => setActiveIndex(index)}
                maxLength={1}
              />
            ))}
          </div>

          <button 
            className={`otp-verify-button ${(!isOtpComplete || verifying) ? 'disabled' : ''}`}
            onClick={handleVerify}
            disabled={!isOtpComplete || verifying}
          >
            {verifying ? 'Verifying...' : 'Verify'}
          </button>

          {error && <p className="otp-error-text">{error}</p>}
          {statusMessage && !error && <p className="otp-status-text">{statusMessage}</p>}

          <p className="otp-resend-text">
            Didn't receive the code? <span className="otp-resend-link" onClick={handleResend}>Resend</span>
          </p>
        </div>
      </div>
    </div>
  )
}

export default OTP




