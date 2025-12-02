import './PaymentConfirmation.css'

function PaymentConfirmation({ order, onDone }) {
  const safeOrder = order || {}

  return (
    <div className="payment-confirmation-container">
      <div className="payment-confirmation-card">
        <div className="payment-confirmation-icon" aria-hidden="true">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="12" fill="#2BA54A" />
            <path d="M7 12.5L10.2 15.5L17 8.5" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        <h1 className="payment-confirmation-title">Payment Confirmation</h1>

        <div className="payment-confirmation-fields">
          <label className="payment-field">
            Service
            <input type="text" value={safeOrder.service || ''} readOnly />
          </label>

          <label className="payment-field">
            Amount
            <input type="text" value={safeOrder.amount || ''} readOnly />
          </label>

          <label className="payment-field">
            Customer Name
            <input type="text" value={safeOrder.name || ''} readOnly />
          </label>

          <label className="payment-field">
            Date And Time
            <input type="text" value={safeOrder.appointment || ''} readOnly />
          </label>

          <label className="payment-field">
            Address
            <input type="text" value={safeOrder.address || ''} readOnly />
          </label>
        </div>

        <button type="button" className="payment-confirmation-button" onClick={onDone}>
          Done
        </button>
      </div>
    </div>
  )
}

export default PaymentConfirmation

