import { useState, useEffect } from 'react'
import './Services.css'
import servicesLogo from '/anact.jpeg'
import { servicesApi } from './apiClient'

function Services({ onBack, onNext, initialData, phoneNumber, countryCode }) {
  const [categories, setCategories] = useState([])
  const [servicesByCategory, setServicesByCategory] = useState({})
  const [expandedCategory, setExpandedCategory] = useState(null)
  const [selectedServices, setSelectedServices] = useState(initialData?.selectedServices || [])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [fetchError, setFetchError] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setFetchError('')
        
        const categoriesResponse = await servicesApi.getCategories()
        const categoriesList = categoriesResponse?.categories || []
        setCategories(categoriesList)

        const servicesMap = {}
        for (const category of categoriesList) {
          try {
            const servicesResponse = await servicesApi.getServices(category.id)
            servicesMap[category.id] = servicesResponse?.services || []
          } catch (err) {
            console.error(`Failed to fetch services for category ${category.id}:`, err)
            servicesMap[category.id] = []
          }
        }
        setServicesByCategory(servicesMap)
      } catch (err) {
        console.error('Failed to fetch categories:', err)
        setFetchError(err?.message || 'Failed to load services. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const toggleCategoryExpansion = (categoryId) => {
    setExpandedCategory((prev) => (prev === categoryId ? null : categoryId))
    setError('')
  }

  const handleServiceSelect = (serviceId, categoryId) => {
    setSelectedServices((prev) => {
      const isSelected = prev.some((s) => s.id === serviceId)
      if (isSelected) {
        return prev.filter((s) => s.id !== serviceId)
      } else {
        const service = servicesByCategory[categoryId]?.find((s) => s.id === serviceId)
        if (service) {
          return [...prev, { id: service.id, category_id: service.category_id, title: service.title }]
        }
        return prev
      }
    })
    setError('')
  }

  const handleNext = () => {
    if (selectedServices.length === 0) {
      setError('Select at least one service to continue')
      return
    }
    setError('')
    
    const uniqueServiceIds = [
      ...new Set(
        selectedServices
          .map((service) => Number(service.id))
          .filter((id) => Number.isFinite(id) && id > 0)
      )
    ]

    const uniqueCategoryIds = [
      ...new Set(
        selectedServices
          .map((service) => Number(service.category_id))
          .filter((id) => Number.isFinite(id) && id > 0)
      )
    ]

    const servicesData = {
      ...(initialData || {}),
      selectedServices,
      services_provided: uniqueServiceIds,
      category_ids: uniqueCategoryIds
    }
    
    console.log('Services data being passed:', {
      ...servicesData,
      selectedServices,
      services_provided: uniqueServiceIds,
      category_ids: uniqueCategoryIds
    })
    
    onNext?.(servicesData)
  }

  const getImageUrl = (url) => {
    if (!url) return null
    if (url.startsWith('http')) return url
    return `https://aafa.mycartly.in/api/public/${url}`
  }

  if (loading) {
    return (
      <div className="services-container">
        <div className="services-content">
          <header className="services-header">
            <button className="back-button" onClick={onBack} aria-label="Go back">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <line x1="18" y1="12" x2="6" y2="12" stroke="#1f1f1f" strokeWidth="2" strokeLinecap="round"/>
                <path d="M6 12L12 6M6 12L12 18" stroke="#1f1f1f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <div className="services-brand">
              <img src={servicesLogo} alt="Active Aid Fitness Academy logo" className="logo-icon" />
            </div>
          </header>
          <div className="services-body">
            <h1 className="services-title">Services</h1>
            <p>Loading services...</p>
          </div>
        </div>
      </div>
    )
  }

  if (fetchError) {
    return (
      <div className="services-container">
        <div className="services-content">
          <header className="services-header">
            <button className="back-button" onClick={onBack} aria-label="Go back">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <line x1="18" y1="12" x2="6" y2="12" stroke="#1f1f1f" strokeWidth="2" strokeLinecap="round"/>
                <path d="M6 12L12 6M6 12L12 18" stroke="#1f1f1f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <div className="services-brand">
              <img src={servicesLogo} alt="Active Aid Fitness Academy logo" className="logo-icon" />
            </div>
          </header>
          <div className="services-body">
            <h1 className="services-title">Services</h1>
            <p className="services-error-text">{fetchError}</p>
            <button className="services-next-button" onClick={onBack}>
              Go Back
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="services-container">
      <div className="services-content">
        <header className="services-header">
          <button className="back-button" onClick={onBack} aria-label="Go back">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <line x1="18" y1="12" x2="6" y2="12" stroke="#1f1f1f" strokeWidth="2" strokeLinecap="round"/>
              <path d="M6 12L12 6M6 12L12 18" stroke="#1f1f1f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div className="services-brand">
            <img src={servicesLogo} alt="Active Aid Fitness Academy logo" className="logo-icon" />
          </div>
        </header>

        <div className="services-body">
          <h1 className="services-title">Services</h1>

          <div className="services-list">
            {categories.map((category) => {
              const categoryServices = servicesByCategory[category.id] || []
              const hasSelectedServices = selectedServices.some((s) => 
                categoryServices.some((cs) => cs.id === s.id)
              )
              const isExpanded = expandedCategory === category.id

              return (
                <div
                  key={category.id}
                  className={`service-card ${hasSelectedServices ? 'selected' : ''} ${isExpanded ? 'expanded' : ''}`}
                >
                  <div
                    className="service-card-header"
                    onClick={() => toggleCategoryExpansion(category.id)}
                  >
                    <span className={`service-checkbox ${hasSelectedServices ? 'checked' : ''}`}>
                      {hasSelectedServices && (
                        <svg width="14" height="10" viewBox="0 0 14 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M1 5L5 9L13 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </span>
                    <div className="service-image-wrapper">
                      {getImageUrl(category.image_url) ? (
                        <img 
                          src={getImageUrl(category.image_url)} 
                          alt={category.name} 
                          className="service-image"
                          onError={(e) => {
                            e.target.style.display = 'none'
                          }}
                        />
                      ) : (
                        <div className="service-image-placeholder">{category.name.charAt(0)}</div>
                      )}
                    </div>
                    <div className="service-info">
                      <h3 className="service-name">{category.name}</h3>
                      <p className="service-join">
                        {categoryServices.length} service{categoryServices.length !== 1 ? 's' : ''} available
                      </p>
                    </div>
                    <button
                      type="button"
                      className={`service-toggle-icon ${isExpanded ? 'open' : ''}`}
                      aria-label={isExpanded ? 'Collapse' : 'Expand'}
                      onClick={(event) => {
                        event.stopPropagation()
                        toggleCategoryExpansion(category.id)
                      }}
                    >
                      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M4.5 7.5L9 12L13.5 7.5" stroke="#121212" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="service-subcategory-list">
                      {categoryServices.length === 0 ? (
                        <p className="no-services-text">No services available in this category</p>
                      ) : (
                        categoryServices.map((service) => {
                          const isSelected = selectedServices.some((s) => s.id === service.id)
                          const price = service.price_discounted || service.price_original || 'N/A'
                          
                          return (
                            <div
                              key={service.id}
                              className={`service-item ${isSelected ? 'selected' : ''}`}
                              onClick={() => handleServiceSelect(service.id, category.id)}
                            >
                              <div className="service-item-content">
                                <div className="service-item-image-wrapper">
                                  {getImageUrl(service.image_url) ? (
                                    <img 
                                      src={getImageUrl(service.image_url)} 
                                      alt={service.title} 
                                      className="service-item-image"
                                      onError={(e) => {
                                        e.target.style.display = 'none'
                                      }}
                                    />
                                  ) : (
                                    <div className="service-item-image-placeholder">{service.title.charAt(0)}</div>
                                  )}
                                </div>
                                <div className="service-item-details">
                                  <h4 className="service-item-title">{service.title}</h4>
                                  {service.description && (
                                    <p className="service-item-description">{service.description}</p>
                                  )}
                                  <p className="service-item-price">₹{price}</p>
                                </div>
                                <span className={`service-item-checkbox ${isSelected ? 'checked' : ''}`}>
                                  {isSelected && (
                                    <svg width="16" height="12" viewBox="0 0 16 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                      <path d="M1 6L5 10L15 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                  )}
                                </span>
                              </div>
                            </div>
                          )
                        })
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {error && <p className="services-error-text">{error}</p>}
        </div>

        <footer className="services-footer">
          <button
            className={`services-next-button ${selectedServices.length === 0 ? 'disabled' : ''}`}
            onClick={handleNext}
            disabled={selectedServices.length === 0}
          >
            Next
          </button>
        </footer>
      </div>
    </div>
  )
}

export default Services
