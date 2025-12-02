import { useState, useEffect } from 'react'
import './KitPaymentModal.css'
import accountLogo from '/anact.jpeg'

const RAZORPAY_KEY_ID = 'rzp_live_RhXtqtxWm2Wrqq'
const KIT_AMOUNT = 0 // ₹3799 in rupees

function KitPaymentModal({ onPaymentSuccess, onClose, userData }) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState('')
  const [razorpayLoaded, setRazorpayLoaded] = useState(false)

  useEffect(() => {
    // Load Razorpay script
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    script.onload = () => {
      setRazorpayLoaded(true)
    }
    script.onerror = () => {
      setError('Failed to load payment gateway. Please refresh the page.')
    }
    document.body.appendChild(script)

    return () => {
      // Cleanup script on unmount
      if (document.body.contains(script)) {
        document.body.removeChild(script)
      }
    }
  }, [])

  const handlePayment = async () => {
    if (!razorpayLoaded) {
      setError('Payment gateway is still loading. Please wait...')
      return
    }

    setError('')
    setIsProcessing(true)

    try {
      const options = {
        key: RAZORPAY_KEY_ID,
        amount: KIT_AMOUNT * 100, // Convert to paise (₹1 = 100 paise)
        currency: 'INR',
        name: 'Active Aid Fitness Academy',
        description: 'Service Provider Kit - Vacuum Cleaner + T-Shirt + Dish Wash + Gloves + Mask',
        image: accountLogo,
        handler: function (response) {
          console.log('Payment successful:', response)
          setIsProcessing(false)
          // Store payment details
          const paymentData = {
            paymentId: response.razorpay_payment_id,
            orderId: response.razorpay_order_id || null,
            signature: response.razorpay_signature || null,
            amount: KIT_AMOUNT,
            timestamp: new Date().toISOString()
          }
          onPaymentSuccess(paymentData)
        },
        prefill: {
          name: userData?.fullName || userData?.name || '',
          email: userData?.email || '',
          contact: userData?.phoneNumber || userData?.phone_number || ''
        },
        theme: {
          color: 'rgb(0, 0, 0)'
        },
        modal: {
          ondismiss: function() {
            setIsProcessing(false)
            setError('')
          }
        }
      }

      const razorpay = new window.Razorpay(options)
      razorpay.on('payment.failed', function (response) {
        console.error('Payment failed:', response.error)
        setError(response.error.description || 'Payment failed. Please try again.')
        setIsProcessing(false)
      })
      
      razorpay.open()
    } catch (err) {
      console.error('Payment error:', err)
      setError(err.message || 'Failed to initiate payment. Please try again.')
      setIsProcessing(false)
    }
  }

  return (
    <div className="kit-payment-overlay">
      <div className="kit-payment-modal">
        <div className="kit-payment-header">
          <div className="kit-payment-logo">
            <img src={accountLogo} alt="Active Aid Fitness Academy Logo" />
          </div>
          <button 
            className="kit-payment-close" 
            onClick={onClose}
            aria-label="Close"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        <div className="kit-payment-content">
          <div className="kit-payment-icon">
            <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="40" cy="40" r="40" fill="#E6F2F7"/>
              <path d="M40 20L50 30H45V45H35V30H30L40 20Z" fill="rgb(0, 0, 0)"/>
              <rect x="25" y="50" width="30" height="8" rx="4" fill="rgb(0, 0, 0)"/>
            </svg>
          </div>

          <h2 className="kit-payment-title">Welcome to Active Aid Fitness Academy!</h2>
          <p className="kit-payment-subtitle">
            To get started as a service provider, you'll need to purchase our professional kit
          </p>

          <div className="kit-payment-details">
            <div className="kit-payment-item">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="#4CAF50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>Vacuum Cleaner</span>
            </div>
            <div className="kit-payment-item">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="#4CAF50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>T-Shirt</span>
            </div>
            <div className="kit-payment-item">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="#4CAF50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>Dish Wash</span>
            </div>
            <div className="kit-payment-item">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="#4CAF50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>Gloves</span>
            </div>
            <div className="kit-payment-item">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="#4CAF50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>Mask</span>
            </div>
          </div>

          <div className="kit-payment-amount">
            <div className="kit-amount-label">Kit Price</div>
            <div className="kit-amount-value">₹3,799</div>
          </div>

          {error && (
            <div className="kit-payment-error">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="#EF4444" strokeWidth="2"/>
                <path d="M12 8V12M12 16H12.01" stroke="#EF4444" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <span>{error}</span>
            </div>
          )}

          <button 
            className="kit-payment-button"
            onClick={handlePayment}
            disabled={isProcessing || !razorpayLoaded}
          >
            {isProcessing ? (
              <>
                <svg className="kit-spinner" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeDasharray="32" strokeDashoffset="32">
                    <animate attributeName="stroke-dasharray" dur="2s" values="0 32;16 16;0 32;0 32" repeatCount="indefinite"/>
                    <animate attributeName="stroke-dashoffset" dur="2s" values="0;-16;-32;-32" repeatCount="indefinite"/>
                  </circle>
                </svg>
                Processing...
              </>
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 7H4C2.89543 7 2 7.89543 2 9V19C2 20.1046 2.89543 21 4 21H20C21.1046 21 22 20.1046 22 19V9C22 7.89543 21.1046 7 20 7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M16 21V11C16 9.89543 15.1046 9 14 9H10C8.89543 9 8 9.89543 8 11V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 9V21M8 13H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Pay ₹3,799
              </>
            )}
          </button>

          <p className="kit-payment-note">
            Secure payment powered by Razorpay. Your payment information is encrypted and secure.
          </p>
        </div>
      </div>
    </div>
  )
}

export default KitPaymentModal

