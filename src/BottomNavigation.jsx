import './BottomNavigation.css'

const NAV_ITEMS = [
  { id: 'Home', label: 'Home', icon: 'home' },
  { id: 'Orders', label: 'Orders', icon: 'clipboard' },
  { id: 'Withdrawal', label: 'Withdrawal', icon: 'wallet' },
  { id: 'Account', label: 'Account', icon: 'user' }
]

const icons = {
  home: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 10L12 4L20 10V20C20 20.55 19.55 21 19 21H5C4.45 21 4 20.55 4 20V10Z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 21V13H15V21" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  clipboard: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="7" y="3" width="10" height="4" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M7 7H6C5.44772 7 5 7.44772 5 8V20C5 20.5523 5.44772 21 6 21H18C18.5523 21 19 20.5523 19 20V8C19 7.44772 18.5523 7 18 7H17" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M9 11H15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M9 15H12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  ),
  wallet: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 7H18C19.6569 7 21 8.34315 21 10V17C21 18.6569 19.6569 20 18 20H6C4.34315 20 3 18.6569 3 17V8C3 7.44772 3.44772 7 4 7Z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16 13C16 12.4477 16.4477 12 17 12H20V15H17C16.4477 15 16 14.5523 16 14V13Z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7 4H15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  user: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 20C4 16.6863 6.68629 14 10 14H14C17.3137 14 20 16.6863 20 20" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function BottomNavigation({ activeTab = 'Home', onTabChange }) {
  return (
    <nav className="bottom-navigation" role="navigation" aria-label="Main">
      {NAV_ITEMS.map((item) => {
        const isActive = activeTab === item.id
        return (
          <button
            key={item.id}
            type="button"
            className={`nav-item ${isActive ? 'active' : ''}`}
            onClick={() => onTabChange?.(item.id)}
            aria-label={item.label}
            aria-current={isActive ? 'page' : undefined}
          >
            <span className="nav-icon" aria-hidden="true">
              {icons[item.icon]}
            </span>
            <span className="nav-label">{item.label}</span>
          </button>
        )
      })}
    </nav>
  )
}

export default BottomNavigation


