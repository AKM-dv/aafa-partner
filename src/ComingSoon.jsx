import './ComingSoon.css'
import accountLogo from '/anact.jpeg'

function ComingSoon() {
  return (
    <div className="coming-soon-container">
      <div className="coming-soon-content">
        <div className="coming-soon-logo">
          <img src={accountLogo} alt="Active Aid Fitness Academy Logo" />
        </div>
        
        <div className="coming-soon-icon">
          <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="60" cy="60" r="60" fill="#E6F2F7"/>
            <path d="M60 30L75 45H70V70H50V45H45L60 30Z" fill="rgb(0, 0, 0)"/>
            <rect x="35" y="75" width="50" height="12" rx="6" fill="rgb(0, 0, 0)"/>
          </svg>
        </div>

        <h1 className="coming-soon-title">We Are Launching Soon!</h1>
        <p className="coming-soon-message">
          Stay tuned, you will soon see the fully working site.
        </p>

        <div className="coming-soon-features">
          <div className="feature-item">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="rgb(0, 0, 0)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>Enhanced Features</span>
          </div>
          <div className="feature-item">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="rgb(0, 0, 0)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>Better Experience</span>
          </div>
          <div className="feature-item">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="rgb(0, 0, 0)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>Improved Services</span>
          </div>
        </div>

        <div className="coming-soon-footer">
          <p>Thank you for your patience!</p>
        </div>
      </div>
    </div>
  )
}

export default ComingSoon

