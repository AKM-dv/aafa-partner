import { useState } from 'react'
import './Verification.css'
import Services from './Services'
import verificationLogo from '/anact.jpeg'

const GENDER_OPTIONS = ['Female', 'Male', 'Prefer not to say']

function Verification({ onBack, onContinue, initialData, phoneNumber, countryCode }) {
  const [name, setName] = useState(initialData?.fullName || initialData?.name || '')
  const [email, setEmail] = useState(initialData?.email || '')
  const [gender, setGender] = useState(initialData?.gender || '')
  const [isGenderOpen, setIsGenderOpen] = useState(false)
  const [profileImage, setProfileImage] = useState(initialData?.profileImage || null)
  const [aadharFile, setAadharFile] = useState(initialData?.aadharFile || null)
  const [panFile, setPanFile] = useState(initialData?.panFile || null)
  const [degreeFile, setDegreeFile] = useState(initialData?.degreeFile || null)
  const [portfolioFiles, setPortfolioFiles] = useState(initialData?.portfolioFiles || initialData?.workImages || [])
  const [showMenu, setShowMenu] = useState(false)
  const [errors, setErrors] = useState({})

  const documentConfig = [
    { id: 'aadhar', label: 'Aadhar Card', file: aadharFile, setter: setAadharFile, removable: true },
    { id: 'pan', label: 'PAN Card', file: panFile, setter: setPanFile, removable: true },
    { id: 'degree', label: 'Educational Degree Certificate', file: degreeFile, setter: setDegreeFile, removable: true },
    { id: 'portfolio', label: 'Previous Work Images', files: portfolioFiles, setter: setPortfolioFiles, removable: true, isImage: true }
  ]

  const clearError = (field) => {
    if (!errors[field]) return
    setErrors((prev) => {
      const updated = { ...prev }
      delete updated[field]
      return updated
    })
  }

  const handleProfileImageChange = (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setErrors((prev) => ({ ...prev, profileImage: 'Upload an image file' }))
      return
    }

    setProfileImage(file)
    clearError('profileImage')
  }

  const handleDocumentUpload = (setter, errorKey, file, isImage = false) => {
    if (!file) return
    if (isImage) {
      if (!file.type.startsWith('image/')) {
        setErrors((prev) => ({ ...prev, [errorKey]: 'Image format only (JPG, PNG, etc.)' }))
        return
      }
    } else {
      if (file.type !== 'application/pdf') {
        setErrors((prev) => ({ ...prev, [errorKey]: 'PDF format only' }))
        return
      }
    }
    setter(file)
    clearError(errorKey)
  }

  const handleImageUpload = (setter, errorKey, files) => {
    if (!files || files.length === 0) return
    
    const imageFiles = Array.from(files).filter(file => {
      if (!file.type.startsWith('image/')) {
        setErrors((prev) => ({ ...prev, [errorKey]: 'All files must be images (JPG, PNG, etc.)' }))
        return false
      }
      return true
    })
    
    if (imageFiles.length === 0) return
    
    setter((prev) => [...(prev || []), ...imageFiles])
    clearError(errorKey)
  }

  const handleDocumentRemove = (setter) => {
    setter(null)
  }

  const handleImageRemove = (setter, index) => {
    setter((prev) => prev.filter((_, i) => i !== index))
  }

  const handleContinue = () => {
    const validationErrors = {}

    if (!name.trim()) {
      validationErrors.name = 'Enter your name'
    }

    const trimmedEmail = email.trim()
    if (!trimmedEmail) {
      validationErrors.email = 'Enter your email'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      validationErrors.email = 'Enter a valid email'
    }

    if (!gender) {
      validationErrors.gender = 'Select gender'
    }

    if (!profileImage) {
      validationErrors.profileImage = 'Profile photo required'
    }

    documentConfig.forEach(({ id, label, file, files }) => {
      if (files !== undefined) {
        if (!files || files.length === 0) {
          validationErrors[id] = `${label} required`
        }
      } else if (!file) {
        validationErrors[id] = `${label} required`
      }
    })

    setErrors(validationErrors)
    if (Object.keys(validationErrors).length) {
      return
    }

    const verificationData = {
      name,
      fullName: name,
      email,
      gender,
      profileImage,
      aadharFile,
      panFile,
      degreeFile,
      portfolioFiles,
      workImages: portfolioFiles || [],
      ...(initialData || {})
    }
    
    console.log('Verification data being passed:', {
      ...verificationData,
      profileImage: verificationData.profileImage?.name,
      aadharFile: verificationData.aadharFile?.name,
      panFile: verificationData.panFile?.name,
      degreeFile: verificationData.degreeFile?.name,
      portfolioFile: verificationData.portfolioFile?.name
    })
    
    onContinue?.(verificationData)
  }

  return (
    <div className="verify-page">
      <div className="verify-card">
        <header className="verify-header">
            <div className="brand-block">
            <img src={verificationLogo} alt="Active Aid Fitness Academy logo" className="brand-mark" />
           
          </div>
          <button
            type="button"
            className="icon-button"
            onClick={() => setShowMenu(true)}
            aria-label="Open menu"
          >
            <span />
            <span />
            <span />
          </button>
        </header>

        {showMenu && (
          <div className="verify-menu-overlay" onClick={() => setShowMenu(false)}>
            <aside className="verify-menu" onClick={(event) => event.stopPropagation()}>
              <div className="verify-menu-header">
                <h3>Menu</h3>
                <button type="button" onClick={() => setShowMenu(false)} aria-label="Close menu">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M18 6L6 18" stroke="#FF6B2B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M6 6L18 18" stroke="#FF6B2B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
              <nav className="verify-menu-list">
                <button type="button" onClick={() => setShowMenu(false)}>Support</button>
                <button type="button" onClick={() => setShowMenu(false)}>Shop</button>
                <button type="button" onClick={() => setShowMenu(false)}>Pet Insurance</button>
                <button type="button" onClick={() => setShowMenu(false)}>Dog Training</button>
                <button type="button" onClick={() => setShowMenu(false)}>Privacy &amp; Policy</button>
                <button type="button" onClick={() => setShowMenu(false)}>Terms &amp; Condition</button>
                <button type="button" onClick={() => setShowMenu(false)}>Rate Us</button>
                <button
                  type="button"
                  className="logout"
                  onClick={() => {
                    setShowMenu(false)
                    onBack?.()
                  }}
                >
                  Logout
                </button>
              </nav>
            </aside>
          </div>
        )}

        <section className="verify-intro">
          <h1>Verification</h1>
          <p>To ensure the highest quality of care, we require verification of your identity &amp; credentials</p>
        </section>

        <section className="verify-form">
          <div className="form-label">
            Register
          </div>

          <label className={`input-pill ${errors.name ? 'has-error' : ''}`}>
            <span className="pill-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="8" r="4" stroke="#111111" strokeWidth="1.6" />
                <path d="M6 20V18C6 15.7909 7.79086 14 10 14H14C16.2091 14 18 15.7909 18 18V20" stroke="#111111" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Name"
              value={name}
              onChange={(event) => {
                setName(event.target.value)
                clearError('name')
              }}
            />
          </label>
          {errors.name && <p className="pill-error">{errors.name}</p>}

          <label className={`input-pill ${errors.email ? 'has-error' : ''}`}>
            <span className="pill-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 5H20C21.1046 5 22 5.89543 22 7V17C22 18.1046 21.1046 19 20 19H4C2.89543 19 2 18.1046 2 17V7C2 5.89543 2.89543 5 4 5Z" stroke="#111111" strokeWidth="1.6" strokeLinecap="round" />
                <path d="M22 7L12 13L2 7" stroke="#111111" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value)
                clearError('email')
              }}
            />
          </label>
          {errors.email && <p className="pill-error">{errors.email}</p>}

          <div className="gender-wrap">
            <button
              type="button"
              className={`gender-pill ${gender ? 'selected' : ''} ${errors.gender ? 'has-error' : ''}`}
              onClick={() => {
                setIsGenderOpen((prev) => !prev)
                clearError('gender')
              }}
            >
              <span className="gender-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2V6M12 2H15.5M12 2H8.5" stroke="#FFFFFF" strokeWidth="1.6" strokeLinecap="round" />
                  <path d="M12 9C15.3137 9 18 11.6863 18 15C18 18.3137 15.3137 21 12 21C8.68629 21 6 18.3137 6 15C6 11.6863 8.68629 9 12 9Z" stroke="#FFFFFF" strokeWidth="1.6" />
                </svg>
              </span>
              {gender || 'Gender'}
              <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M1 1L5 5L9 1" stroke="#FFFFFF" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            {isGenderOpen && (
              <div className="gender-popover">
                {GENDER_OPTIONS.map((option) => (
                  <button
                    type="button"
                    key={option}
                    onClick={() => {
                      setGender(option)
                      setIsGenderOpen(false)
                      clearError('gender')
                    }}
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}
          </div>
          {errors.gender && <p className="pill-error">{errors.gender}</p>}
        </section>

        <section className="profile-section">
          <label htmlFor="profile-upload" className={`profile-card ${errors.profileImage ? 'has-error' : ''}`}>
            <span className="profile-image-icon">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="3" y="3" width="18" height="18" rx="6" fill="#FFC6A6" />
                <path d="M8.5 13.5L10.75 11.25L13.5 14" stroke="#FFFFFF" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="9.5" cy="9" r="1.25" fill="#FFFFFF" />
              </svg>
            </span>
            <div className="profile-text">
              <h3>Profile Upload Card</h3>
              <p>Upload Your Profile Picture</p>
            </div>
            <input
              id="profile-upload"
              type="file"
              accept="image/*"
              className="visually-hidden"
              onChange={handleProfileImageChange}
            />
          </label>
          {profileImage && (
            <div className="profile-status">
              <span>{profileImage.name}</span>
              <button type="button" onClick={() => setProfileImage(null)}>
                Remove
              </button>
            </div>
          )}
          {errors.profileImage && <p className="pill-error">{errors.profileImage}</p>}
        </section>

        <section className="documents-section">
          <h2>Documents Required</h2>
          <div className="doc-list">
            {documentConfig.map(({ id, label, file, files, setter, removable, isImage }) => {
              const hasFiles = isImage ? (files && files.length > 0) : !!file
              return (
                <div key={id} className={`doc-card ${errors[id] ? 'has-error' : ''}`}>
                  <span className="doc-icon">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect x="5" y="3" width="14" height="18" rx="3" fill="#E6EEF8" />
                      <path d="M9 8H15M9 12H15" stroke="#265DFF" strokeWidth="1.6" strokeLinecap="round" />
                    </svg>
                  </span>
                  <span className="doc-label">{label}</span>
                  {isImage ? (
                    <>
                      {hasFiles ? (
                        <>
                          {files.map((imgFile, index) => (
                            <div key={index} className="doc-status-button">
                              <span className="doc-name" title={imgFile.name}>{imgFile.name}</span>
                              {removable && (
                                <button
                                  type="button"
                                  onClick={(event) => {
                                    event.stopPropagation()
                                    handleImageRemove(setter, index)
                                  }}
                                >
                                  Remove
                                </button>
                              )}
                            </div>
                          ))}
                          <label htmlFor={`${id}-upload`} className="doc-status-button empty">
                            <span className="doc-placeholder-text">Upload More Images</span>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M12 5V19" stroke="#111111" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                              <path d="M6 11L12 5L18 11" stroke="#111111" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            <input
                              id={`${id}-upload`}
                              type="file"
                              accept="image/*"
                              multiple
                              className="visually-hidden"
                              onChange={(event) => handleImageUpload(setter, id, event.target.files)}
                            />
                          </label>
                        </>
                      ) : (
                        <label htmlFor={`${id}-upload`} className="doc-status-button empty">
                          <span className="doc-placeholder-text">Upload Images</span>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 5V19" stroke="#111111" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M6 11L12 5L18 11" stroke="#111111" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          <input
                            id={`${id}-upload`}
                            type="file"
                            accept="image/*"
                            multiple
                            className="visually-hidden"
                            onChange={(event) => handleImageUpload(setter, id, event.target.files)}
                          />
                        </label>
                      )}
                    </>
                  ) : (
                    <label htmlFor={`${id}-upload`} className={`doc-status-button ${!hasFiles ? 'empty' : ''}`}>
                      {file ? (
                        <>
                          <span className="doc-name" title={file.name}>{file.name}</span>
                          {removable && (
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation()
                                handleDocumentRemove(setter)
                              }}
                            >
                              Remove
                            </button>
                          )}
                        </>
                      ) : (
                        <>
                          <span className="doc-placeholder-text">Upload PDF</span>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 5V19" stroke="#111111" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M6 11L12 5L18 11" stroke="#111111" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </>
                      )}
                      <input
                        id={`${id}-upload`}
                        type="file"
                        accept=".pdf"
                        className="visually-hidden"
                        onChange={(event) => handleDocumentUpload(setter, id, event.target.files?.[0], isImage)}
                      />
                    </label>
                  )}
                  {errors[id] && <p className="pill-error">{errors[id]}</p>}
                </div>
              )
            })}
          </div>
          <p className="doc-note">
            Upload Your Document In Pdf Format (Images for Previous Work)
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M5 12H19M13 6L19 12L13 18" stroke="#FF6B2B" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </p>
        </section>

        <button type="button" className="primary-cta" onClick={handleContinue}>
          Continue
        </button>
      </div>
    </div>
  )
}

export default Verification

