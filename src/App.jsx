import { useState, useEffect } from 'react'
import './App.css'
import GetStarted from './GetStarted'
import ServiceHome from './ServiceHome'
import UserInfo from './UserInfo'
import Verification from './Verification'
import Services from './Services'
import AccountVerification from './AccountVerification'
import ComingSoon from './ComingSoon'
import careIllustration from '/care-login.png'
import { loadSession, saveSession, clearSession } from './authStorage'
import { SHOW_COMING_SOON } from './config'

function App() {
  const [showGetStarted, setShowGetStarted] = useState(false)
  const [showUserInfo, setShowUserInfo] = useState(false)
  const [showVerification, setShowVerification] = useState(false)
  const [showServices, setShowServices] = useState(false)
  const [showAccountVerification, setShowAccountVerification] = useState(false)
  const [showHome, setShowHome] = useState(false)
  const [userData, setUserData] = useState(null)

  useEffect(() => {
    const session = loadSession()
    if (session?.token) {
      const storedUser = {
        token: session.token,
        ...(session.userData || {})
      }
      setUserData(storedUser)
      if (storedUser.isRegistered) {
        setShowHome(true)
      } else if (storedUser?.nextStep === 'services') {
        setShowServices(true)
      } else if (storedUser?.nextStep === 'verification') {
        setShowVerification(true)
      } else if (storedUser?.nextStep === 'userInfo') {
        setShowUserInfo(true)
      } else if (storedUser?.nextStep === 'accountVerification') {
          setShowAccountVerification(true)
      } else {
        setShowGetStarted(true)
      }
    }
  }, [])

  const persistSession = (data) => {
    const token = data?.token || userData?.token
    if (!token) return
    saveSession({
      token,
      userData: {
        ...data,
        token
      }
    })
  }

  const resetApp = () => {
    setShowHome(false)
    setShowGetStarted(false)
    setShowUserInfo(false)
    setShowVerification(false)
    setShowServices(false)
    setShowAccountVerification(false)
    setUserData(null)
    clearSession()
  }

  const handleAuthenticatedUser = (authData) => {
    const mergedData = {
      ...(userData || {}),
      ...authData,
      isRegistered: true
    }

    setUserData(mergedData)
    persistSession(mergedData)
    setShowGetStarted(false)
    setShowUserInfo(false)
    setShowVerification(false)
    setShowServices(false)
    setShowAccountVerification(false)
    setShowHome(true)
  }

  const handleRequireProfile = (authData) => {
    const mergedData = {
      ...(userData || {}),
      ...authData,
      isRegistered: false
    }

    setUserData(mergedData)
    persistSession(mergedData)
    setShowGetStarted(false)
    setShowUserInfo(true)
  }

  const handleUserInfoNext = (userInfoData) => {
    setUserData((prev) => {
      const nextData = {
        ...(prev || {}),
        ...userInfoData,
        nextStep: 'verification'
      }
      persistSession(nextData)
      return nextData
    })
    setShowUserInfo(false)
    setShowVerification(true)
  }

  const handleVerificationNext = (verificationData) => {
    setUserData((prev) => {
      const nextData = {
        ...(prev || {}),
        ...verificationData,
        nextStep: 'services'
      }
      persistSession(nextData)
      return nextData
    })
    setShowVerification(false)
    setShowServices(true)
  }

  const handleServicesNext = (servicesData) => {
    setUserData((prev) => {
      const nextData = {
        ...(prev || {}),
        ...servicesData,
        nextStep: 'accountVerification'
      }
      persistSession(nextData)
      return nextData
    })
    setShowServices(false)
    setShowAccountVerification(true)
  }

  const handleRegistrationComplete = (profileData) => {
    setUserData((prev) => {
      const nextData = {
        ...(prev || {}),
        ...profileData,
        isRegistered: true,
        nextStep: undefined
      }
      persistSession(nextData)
      return nextData
    })

    setShowAccountVerification(false)
    setShowHome(true)
  }

  const handleReturnToLogin = () => {
    resetApp()
    setShowGetStarted(false)
    setShowUserInfo(false)
    setShowVerification(false)
    setShowServices(false)
    setShowAccountVerification(false)
    setShowHome(false)
    setUserData(null)
  }

  if (showHome) {
    // Check if coming soon flag is enabled
    if (SHOW_COMING_SOON) {
      return <ComingSoon />
    }
    
    return (
      <ServiceHome 
        userData={userData}
        onLogout={() => {
          resetApp()
        }}
      />
    )
  }

  if (showAccountVerification) {
    return (
      <AccountVerification
        initialData={userData}
        onBack={() => {
          setShowAccountVerification(false)
            setShowServices(true)
        }}
        onNext={handleRegistrationComplete}
        onReturnToLogin={handleReturnToLogin}
        phoneNumber={userData?.phoneNumber}
        countryCode={userData?.countryCode}
      />
    )
  }

  if (showServices) {
    return (
      <Services
        initialData={userData}
        onBack={() => {
          setShowServices(false)
          setShowVerification(true)
        }}
        onNext={handleServicesNext}
        phoneNumber={userData?.phoneNumber}
        countryCode={userData?.countryCode}
      />
    )
  }

  if (showVerification) {
    return (
      <Verification
        initialData={userData}
        onBack={() => {
          setShowVerification(false)
          setShowUserInfo(true)
        }}
        onContinue={handleVerificationNext}
        phoneNumber={userData?.phoneNumber}
        countryCode={userData?.countryCode}
      />
    )
  }

  if (showUserInfo) {
    return (
      <UserInfo 
        initialData={userData}
        onBack={() => {
          setShowUserInfo(false)
          setShowGetStarted(true)
        }}
        onNext={handleUserInfoNext}
      />
    )
  }

  if (showGetStarted) {
    return (
      <GetStarted 
        onBack={() => setShowGetStarted(false)} 
        onLogout={() => {
          setShowGetStarted(false)
          setShowUserInfo(false)
        }}
        onShowHome={handleAuthenticatedUser}
        onRequireProfile={handleRequireProfile}
      />
    )
  }

  return (
    <div className="login-container">
      <div className="login-content">
        <img src={careIllustration} alt="Care illustration" className="login-illustration" />
        <h1 className="login-title">Join Active Aid Fitness Academy</h1>
        <p className="login-description">
          Connect, share stories and learn together - because human care is better together.
        </p>
        <button className="login-button" onClick={() => setShowGetStarted(true)}>
          Login
        </button>
      </div>
    </div>
  )
}

export default App
