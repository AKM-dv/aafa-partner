import { useState, useRef, useEffect } from 'react'
import './OTP.css'

function HappyCode({ onBack, onVerifySuccess, customVerify, order }) {
  const [code, setCode] = useState(['', '', '', '', '', ''])
  const [activeIndex, setActiveIndex] = useState(0)
  const [verifying, setVerifying] = useState(false)
  const [error, setError] = useState('')
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

    const newCode = [...code]
    newCode[index] = value
    setCode(newCode)

    if (value && index < 5) {
      setActiveIndex(index + 1)
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      setActiveIndex(index - 1)
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').slice(0, 6).split('')
    const newCode = [...code]
    pastedData.forEach((char, index) => {
      if (index < 6 && /^\d$/.test(char)) {
        newCode[index] = char
      }
    })
    setCode(newCode)
    const nextIndex = Math.min(pastedData.length, 5)
    setActiveIndex(nextIndex)
    inputRefs.current[nextIndex]?.focus()
  }

  const isCodeComplete = code.every(digit => digit !== '')

  const handleVerify = async () => {
    if (!isCodeComplete || verifying) {
      return
    }
    const codeValue = code.join('')
    setVerifying(true)
    setError('')

    try {
      if (customVerify) {
        const result = await customVerify(codeValue)
        onVerifySuccess?.(result || { otp: codeValue })
      } else {
        onVerifySuccess?.({ otp: codeValue })
      }
    } catch (err) {
      setError(err.message || 'Invalid happy code. Please check and try again.')
    } finally {
      setVerifying(false)
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
            OTP has been sent to the customer. Please enter the 6-digit OTP received by the customer
          </p>

          <div className="otp-inputs-container">
            {code.map((digit, index) => (
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
            className={`otp-verify-button ${(!isCodeComplete || verifying) ? 'disabled' : ''}`}
            onClick={handleVerify}
            disabled={!isCodeComplete || verifying}
          >
            {verifying ? 'Verifying...' : 'Verify'}
          </button>

          {error && <p className="otp-error-text">{error}</p>}
        </div>
      </div>
    </div>
  )
}

export default HappyCode

