import { useState } from 'react'
import './Settings.css'

const notificationOptions = [
  {
    id: 'whatsapp',
    label: 'WhatsApp',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M20 11.5C20 15.9183 16.4183 19.5 12 19.5C10.5852 19.5 9.25545 19.1231 8.10164 18.4602L4 20L5.53981 15.8984C4.87694 14.7446 4.5 13.4148 4.5 12C4.5 7.58172 8.08172 4 12.5 4C16.9183 4 20 7.58172 20 11.5Z" stroke="#1F1F1F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M9.75 9.75C9.75 12.0972 11.6528 14 14 14" stroke="#1F1F1F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  },
  {
    id: 'push',
    label: 'Push Notifications',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M19 17.5H5L7 15.5V10.5C7 7.46243 9.46243 5 12.5 5C15.5376 5 18 7.46243 18 10.5V15.5L19 17.5Z" stroke="#1F1F1F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M11 19.5H14" stroke="#1F1F1F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  },
  {
    id: 'email',
    label: 'Emails',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="3" y="5" width="18" height="14" rx="2.5" stroke="#1F1F1F" strokeWidth="1.5" />
        <path d="M5 7L12 12.5L19 7" stroke="#1F1F1F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  },
  {
    id: 'sms',
    label: 'SMS',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M4 5H20C20.8284 5 21.5 5.67157 21.5 6.5V15.5C21.5 16.3284 20.8284 17 20 17H8L4 20V6.5C4 5.67157 4.67157 5 5.5 5Z" stroke="#1F1F1F" strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
    )
  },
  {
    id: 'calls',
    label: 'Voice Calls',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M6.5 4L9 7C9 7 8 9 9.5 10.5C11 12 13 11 13 11L16.5 14.5C16.5 14.5 14.5 18 9 18C5 18 3 14 3 10C3 8.25306 3.50872 6.30872 4.5 5" stroke="#1F1F1F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }
]

function Settings({ onBack }) {
  const [toggleState, setToggleState] = useState(() => {
    const state = {}
    notificationOptions.forEach((item) => {
      state[item.id] = false
    })
    return state
  })

  const handleToggle = (id) => {
    setToggleState((prev) => ({
      ...prev,
      [id]: !prev[id]
    }))
  }

  return (
    <div className="settings-container">
      <div className="settings-content">
        <header className="settings-header">
          <button className="settings-back-button" onClick={onBack} aria-label="Back">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <line x1="18" y1="12" x2="6" y2="12" stroke="#000000" strokeWidth="1.8" strokeLinecap="round" />
              <path d="M10 8L6 12L10 16" stroke="#000000" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <h1 className="settings-title">Settings</h1>
        </header>

        <div className="settings-body">
          <h2 className="settings-heading">Notifications &amp; Reminders</h2>

          <div className="settings-list">
            {notificationOptions.map((option) => (
              <div key={option.id} className="settings-row">
                <div className="settings-row-left">
                  <span className="settings-icon" aria-hidden="true">{option.icon}</span>
                  <span className="settings-row-label">{option.label}</span>
                </div>
                <label className="settings-toggle">
                  <input
                    type="checkbox"
                    checked={toggleState[option.id]}
                    onChange={() => handleToggle(option.id)}
                  />
                  <span className="settings-toggle-slider" />
                </label>
              </div>
            ))}
          </div>

          <div className="settings-divider" />

          <button className="settings-link-row" type="button">
            <div className="settings-row-left">
              <span className="settings-icon" aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 3L2 9L12 15L22 9L12 3Z" stroke="#1F1F1F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M2 15L12 21L22 15" stroke="#1F1F1F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M2 9L12 15L22 9" stroke="#1F1F1F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <span className="settings-row-label">Privacy &amp; Data</span>
            </div>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M5 3L9 7L5 11" stroke="#999999" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

export default Settings

