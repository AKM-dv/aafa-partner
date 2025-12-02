import { useState, useEffect, useRef, useMemo } from 'react'
import './OrderManagement.css'
import './ServiceHome.css'
import BottomNavigation from './BottomNavigation'
import orderLogo from '/anact.jpeg'
import { providerApi } from './apiClient'
import { requestProviderLocation } from './locationService'
import { GOOGLE_MAPS_API_KEY } from './config'
import Toast from './Toast'

const ORDER_TABS = [
  { id: 'pending', label: 'New Orders' },
  { id: 'current', label: 'Current Order' },
  { id: 'completed', label: 'Previous Order' }
]

const CUSTOMERS = [
  {
    id: 1,
    name: 'Riya Malhotra',
    service: 'Medical Consultant',
    amount: '₹450',
    address: 'Green Park, New Delhi',
    petName: 'Bruno',
    appointment: 'Today • 10:30 AM',
    status: 'Current',
    nameClass: 'current-name'
  },
  {
    id: 2,
    name: 'Aarav Sharma',
    service: 'Medical Consultant',
    amount: '₹650',
    address: 'Sector 21, Gurugram',
    petName: 'Simba',
    appointment: 'Today • 01:00 PM',
    status: 'Current',
    nameClass: 'current-name'
  },
  {
    id: 3,
    name: 'Kavya Patel',
    service: 'Medical Consultant',
    amount: '₹300',
    address: 'Prahlad Nagar, Ahmedabad',
    petName: 'Snow',
    appointment: 'Tomorrow • 07:00 AM',
    status: 'Pending',
    nameClass: 'previous-green'
  },
  {
    id: 4,
    name: 'Anshika Jain',
    service: 'Medical Consultant',
    amount: '₹520',
    address: 'Civil Lines, Sonipat',
    petName: 'Oreo',
    appointment: 'Yesterday • 05:30 PM',
    status: 'Completed',
    nameClass: 'previous-red'
  }
]

function OrderManagement({
  onBack,
  activeNavTab,
  onNavChange,
  onShowOtp,
  liveOrders = [],
  onAcceptOrder,
  onRejectOrder,
  onSendPaymentLink,
  onViewTracking,
  userData,
  toast,
  showSuccess,
  showError,
  showWarning,
  hideToast
}) {
  const [activeNav, setActiveNav] = useState(activeNavTab || 'Orders')
  const [activeTab, setActiveTab] = useState('pending')
  const [expandedCustomer, setExpandedCustomer] = useState(null)
  const [pendingOrders, setPendingOrders] = useState([])
  const [currentOrders, setCurrentOrders] = useState([])
  const [previousOrders, setPreviousOrders] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [trackingBooking, setTrackingBooking] = useState(null)
  const [currentCoords, setCurrentCoords] = useState(null)
  const [googleMapsLoaded, setGoogleMapsLoaded] = useState(typeof window !== 'undefined' && !!window.google?.maps)
  
  const trackingMapRef = useRef(null)
  const trackingMapInstanceRef = useRef(null)
  const trackingProviderMarkerRef = useRef(null)
  const trackingUserMarkerRef = useRef(null)
  const trackingIntervalRef = useRef(null)
  const directionsRendererRef = useRef(null)
  const directionsServiceRef = useRef(null)

  const handleNavChange = (tab) => {
    setActiveNav(tab)
    onNavChange?.(tab)
    if (tab === 'Home') {
      onBack?.()
    }
  }

  const handleTabChange = (tabId) => {
    setActiveTab(tabId)
    setExpandedCustomer(null)
  }

  const handleDropdownClick = (customerId) => {
    setExpandedCustomer((prev) => (prev === customerId ? null : customerId))
  }

  // Get phone number from userData
  const getPhoneNumber = () => {
    const providerData = userData?.providerDetails || userData?.provider || {}
    return providerData?.phone_number || 
           userData?.fullPhoneNumber ||
           userData?.phoneNumber ||
           (userData?.countryCode && userData?.phoneNumber ? `${userData.countryCode}${userData.phoneNumber}` : null) ||
           userData?.user?.phone_number
  }

  // Transform API booking to UI customer format
  const transformBookingToCustomer = (booking) => {
    const preferredDate = booking.preferred_date || ''
    const preferredTime = booking.preferred_time || ''
    const appointment = preferredDate && preferredTime 
      ? `${preferredDate} • ${preferredTime}`
      : booking.created_at 
        ? new Date(booking.created_at).toLocaleDateString()
        : 'N/A'

    // Map API status to UI status
    // Ongoing statuses: accepted, in_progress, awaiting_payment → Current
    // History statuses: completed, cancelled, cancelled_auto → Completed
    let uiStatus = 'Pending'
    let nameClass = 'previous-green'
    
    const ongoingStatuses = ['accepted', 'in_progress', 'awaiting_payment']
    const historyStatuses = ['completed', 'cancelled', 'cancelled_auto']
    
    if (ongoingStatuses.includes(booking.status)) {
      uiStatus = 'Current'
      nameClass = 'current-name'
    } else if (historyStatuses.includes(booking.status)) {
      uiStatus = 'Completed'
      nameClass = 'previous-red'
    } else if (booking.status === 'pending_notification' || booking.status === 'pending') {
      uiStatus = 'Pending'
      nameClass = 'previous-green'
    }

    // Extract amount from booking - check multiple possible fields
    const amountValue = booking.service_fee != null 
      ? Number(booking.service_fee) 
      : booking.price_original != null 
        ? Number(booking.price_original)
        : booking.price_discounted != null
          ? Number(booking.price_discounted)
          : booking.amount != null
            ? Number(booking.amount)
            : null
    const formattedAmount = amountValue != null ? `₹${amountValue}` : '—'

    return {
      id: booking.id || booking.booking_id,
      bookingId: booking.id || booking.booking_id,
      name: booking.full_name || booking.user_name || booking.name || 'Customer',
      service: booking.service_name || booking.service || booking.subcategory_name || 'Service',
      category: booking.category_name || booking.category || 'Category',
      address: booking.address || booking.user_address || 'N/A',
      petName: booking.pet_name || 'Pet',
      appointment: appointment,
      status: uiStatus,
      nameClass: nameClass,
      paymentStatus: booking.payment_status || (booking.status === 'awaiting_payment' ? 'pending' : null),
      userId: booking.user_id,
      userPhone: booking.contact_number || booking.user_phone || booking.phone_number,
      userCoords: booking.user_latitude && booking.user_longitude ? {
        latitude: Number(booking.user_latitude),
        longitude: Number(booking.user_longitude)
      } : null,
      amountValue: amountValue,
      amount: formattedAmount,
      // Keep original booking data
      booking: booking
    }
  }

  // Fetch orders based on active tab
  useEffect(() => {
    const phoneNumber = getPhoneNumber()
    if (!phoneNumber || !userData?.token) {
      setIsLoading(false)
      return
    }

    const fetchOrders = async () => {
      setIsLoading(true)
      try {
        if (activeTab === 'pending') {
          // For pending, we need to get notifications or use all with status filter
          // Since there's no specific pending endpoint, we'll use notifications or all with status=pending_notification
          // For now, we'll show liveOrders that are pending
          const pendingFromLive = liveOrders.filter(order => order.status === 'Pending')
          setPendingOrders(pendingFromLive)
        } else if (activeTab === 'current') {
          const response = await providerApi.getOngoingAppointments({
            phoneNumber,
            token: userData.token
          })
          if (response?.bookings) {
            const transformed = response.bookings.map(transformBookingToCustomer)
            setCurrentOrders(transformed)
          }
        } else if (activeTab === 'completed') {
          const response = await providerApi.getHistoryAppointments({
            phoneNumber,
            token: userData.token
          })
          if (response?.bookings) {
            const transformed = response.bookings.map(transformBookingToCustomer)
            setPreviousOrders(transformed)
          }
        }
      } catch (error) {
        console.error('Failed to fetch orders:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchOrders()
  }, [activeTab, userData?.token, userData, liveOrders])

  // Load Google Maps
  useEffect(() => {
    if (typeof window === 'undefined' || googleMapsLoaded) return

    const handleLoaded = () => {
      setGoogleMapsLoaded(true)
    }

    let script = document.getElementById('google-maps-script')
    if (script) {
      script.addEventListener('load', handleLoaded)
      return () => script.removeEventListener('load', handleLoaded)
    }

    script = document.createElement('script')
    script.id = 'google-maps-script'
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}`
    script.async = true
    script.defer = true
    script.onload = handleLoaded
    script.onerror = () => console.error('Google Maps script failed to load')
    document.head.appendChild(script)

    return () => {
      script.removeEventListener('load', handleLoaded)
    }
  }, [googleMapsLoaded])

  // Get current location and watch for changes
  useEffect(() => {
    const fetchLocation = async () => {
      try {
        const coords = await requestProviderLocation()
        setCurrentCoords(coords)
      } catch (error) {
        console.warn('Location permission denied or unavailable:', error)
      }
    }
    
    fetchLocation()
    
    // Watch location changes for live tracking
    if (navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          setCurrentCoords({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
          })
        },
        (error) => {
          console.warn('Geolocation error:', error)
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        }
      )
      
      return () => {
        navigator.geolocation.clearWatch(watchId)
      }
    }
  }, [])

  const providerPosition = useMemo(() => {
    if (!currentCoords) return null
    return {
      lat: currentCoords.latitude,
      lng: currentCoords.longitude
    }
  }, [currentCoords])

  const updateTrackingMap = (providerPos, userPos) => {
    if (!trackingMapRef.current || !window.google?.maps) return
    
    let centerPos = { lat: 0, lng: 0 }
    if (providerPos && userPos) {
      centerPos = {
        lat: (providerPos.lat + userPos.lat) / 2,
        lng: (providerPos.lng + userPos.lng) / 2
      }
    } else if (providerPos) {
      centerPos = providerPos
    } else if (userPos) {
      centerPos = userPos
    }

    // Initialize map if not exists
    if (!trackingMapInstanceRef.current) {
      trackingMapInstanceRef.current = new window.google.maps.Map(trackingMapRef.current, {
        center: centerPos,
        zoom: 14,
        disableDefaultUI: false,
        mapTypeControl: true,
        streetViewControl: false
      })
      
      // Initialize Directions Service and Renderer
      directionsServiceRef.current = new window.google.maps.DirectionsService()
      directionsRendererRef.current = new window.google.maps.DirectionsRenderer({
        map: trackingMapInstanceRef.current,
        suppressMarkers: true, // We'll use custom markers
        polylineOptions: {
          strokeColor: '#4285F4',
          strokeWeight: 5,
          strokeOpacity: 0.8
        }
      })
    } else {
      trackingMapInstanceRef.current.setCenter(centerPos)
    }

    // Update markers
    if (providerPos) {
      if (!trackingProviderMarkerRef.current) {
        trackingProviderMarkerRef.current = new window.google.maps.Marker({
          map: trackingMapInstanceRef.current,
          position: providerPos,
          label: {
            text: 'You',
            color: '#ffffff',
            fontWeight: 'bold',
            fontSize: '12px'
          },
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: '#4285F4',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 3
          },
          zIndex: 1000
        })
      } else {
        trackingProviderMarkerRef.current.setPosition(providerPos)
      }
    }

    if (userPos) {
      if (!trackingUserMarkerRef.current) {
        trackingUserMarkerRef.current = new window.google.maps.Marker({
          map: trackingMapInstanceRef.current,
          position: userPos,
          label: {
            text: 'Customer',
            color: '#ffffff',
            fontWeight: 'bold',
            fontSize: '12px'
          },
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: '#FF6B2B',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 3
          },
          zIndex: 1000
        })
      } else {
        trackingUserMarkerRef.current.setPosition(userPos)
      }
    }

    // Calculate and display directions if both positions exist
    if (providerPos && userPos && directionsServiceRef.current && directionsRendererRef.current) {
      directionsServiceRef.current.route(
        {
          origin: providerPos,
          destination: userPos,
          travelMode: window.google.maps.TravelMode.DRIVING
        },
        (result, status) => {
          if (status === window.google.maps.DirectionsStatus.OK) {
            directionsRendererRef.current.setDirections(result)
            
            // Fit bounds to show the entire route
            const bounds = new window.google.maps.LatLngBounds()
            result.routes[0].bounds.forEach((bound) => {
              bounds.extend(bound)
            })
            trackingMapInstanceRef.current.fitBounds(bounds)
          } else {
            console.warn('Directions request failed:', status)
            // Fallback: just fit bounds to both markers
            const bounds = new window.google.maps.LatLngBounds()
            bounds.extend(providerPos)
            bounds.extend(userPos)
            trackingMapInstanceRef.current.fitBounds(bounds)
          }
        }
      )
    } else if (providerPos && userPos) {
      // Fallback: fit bounds to both markers if directions fail
      const bounds = new window.google.maps.LatLngBounds()
      bounds.extend(providerPos)
      bounds.extend(userPos)
      trackingMapInstanceRef.current.fitBounds(bounds)
    }
  }

  // Tracking map updates
  useEffect(() => {
    if (!trackingBooking || !googleMapsLoaded) return

    const sendProviderLocationUpdate = async () => {
      if (!trackingBooking?.bookingId || !userData?.token || !currentCoords) return
      try {
        await providerApi.updateLocation({
          bookingId: trackingBooking.bookingId,
          latitude: currentCoords.latitude,
          longitude: currentCoords.longitude,
          token: userData.token
        })
      } catch (error) {
        console.error('Failed to update provider location:', error)
      }
    }

    const updateFromBooking = async () => {
      if (!trackingBooking?.bookingId || !userData?.token) return
      try {
        if (currentCoords) {
          await sendProviderLocationUpdate()
        }
        
        const response = await providerApi.trackBooking({
          bookingId: trackingBooking.bookingId,
          token: userData.token
        })
        const providerLoc = response?.provider_location
        const userLoc = response?.user_location
        
        const providerPos = providerLoc && providerLoc.latitude && providerLoc.longitude
          ? { lat: Number(providerLoc.latitude), lng: Number(providerLoc.longitude) }
          : providerPosition
        
        const userPos = userLoc && userLoc.latitude && userLoc.longitude
          ? { lat: Number(userLoc.latitude), lng: Number(userLoc.longitude) }
          : trackingBooking.userCoords
          ? { lat: trackingBooking.userCoords.latitude, lng: trackingBooking.userCoords.longitude }
          : null

        updateTrackingMap(providerPos, userPos)
      } catch (error) {
        console.error('Failed to fetch tracking data:', error)
      }
    }

    updateFromBooking()
    
    if (currentCoords) {
      sendProviderLocationUpdate()
    }
    
    // Update every 3 seconds for smoother live tracking
    trackingIntervalRef.current = setInterval(updateFromBooking, 3000)
    
    // Also update provider location more frequently for better tracking
    const locationUpdateInterval = setInterval(() => {
      if (currentCoords && trackingBooking?.bookingId && userData?.token) {
        sendProviderLocationUpdate()
      }
    }, 5000) // Update location every 5 seconds
    
    return () => {
      if (locationUpdateInterval) {
        clearInterval(locationUpdateInterval)
      }
      if (trackingIntervalRef.current) {
        clearInterval(trackingIntervalRef.current)
        trackingIntervalRef.current = null
      }
      if (directionsRendererRef.current) {
        directionsRendererRef.current.setMap(null)
        directionsRendererRef.current = null
      }
      if (directionsServiceRef.current) {
        directionsServiceRef.current = null
      }
      trackingMapInstanceRef.current = null
      trackingProviderMarkerRef.current = null
      trackingUserMarkerRef.current = null
    }
  }, [trackingBooking, googleMapsLoaded, providerPosition, currentCoords, userData?.token])

  // Get visible customers based on active tab
  const visibleCustomers = (() => {
    if (activeTab === 'pending') {
      // Remove duplicates by bookingId
      const allPending = [...pendingOrders, ...liveOrders.filter(order => order.status === 'Pending')]
      const uniquePending = allPending.filter((order, index, self) => 
        index === self.findIndex((o) => o.bookingId === order.bookingId || o.id === order.id)
      )
      return uniquePending
    } else if (activeTab === 'current') {
      return currentOrders
    } else {
      return previousOrders
    }
  })()

  return (
    <div className="order-management-container">
      <div className="order-management-content">
        <div className="order-management-content-with-nav">
          <header className="order-management-header">
            <button className="order-management-back-button" onClick={onBack} aria-label="Go back">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <line x1="18" y1="12" x2="6" y2="12" stroke="black" strokeWidth="2" strokeLinecap="round" />
                <path d="M6 12L12 6M6 12L12 18" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            <div className="order-management-logo-section">
              <img src={orderLogo} alt="Active Aid Fitness Academy Logo" className="order-management-logo-icon" />
            </div>

            <button className="order-management-profile-button" aria-label="Notifications">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 2C6.68629 2 4 4.68629 4 8V11.382L2.44721 12.8944C1.77124 13.5521 2.23926 14.6667 3.17157 14.6667H16.8284C17.7607 14.6667 18.2288 13.5521 17.5528 12.8944L16 11.382V8C16 4.68629 13.3137 2 10 2Z" stroke="#1F1F1F" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M8 16H12" stroke="#1F1F1F" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </header>

          <div className="order-management-title-section">
            <h1 className="order-management-title">Order Management</h1>
          </div>

          <div className="order-management-tabs">
            {ORDER_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`order-tab ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => handleTabChange(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="order-management-body">
            <h2 className="customers-heading">Customers</h2>
            {isLoading ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                Loading orders...
              </div>
            ) : visibleCustomers.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                No {activeTab === 'pending' ? 'new' : activeTab === 'current' ? 'current' : 'previous'} orders found
              </div>
            ) : (
            <div className="customers-list">
              {visibleCustomers.map((customer) => {
                const isExpanded = expandedCustomer === customer.id
                return (
                  <div key={customer.id} className={`customer-card ${customer.status === 'Current' ? 'current-order' : ''}`}>
                    <div className="customer-profile">
                      <div className="customer-avatar-placeholder">
                        <span>{(customer.name || 'C').charAt(0)}</span>
                      </div>
                    </div>

                    <div className="customer-info">
                      <h3 className={`customer-name ${customer.nameClass || ''}`}>{customer.name || 'Customer'}</h3>
                      <p className="customer-service">{customer.service}</p>
                      <p className="customer-service">{customer.address}</p>
                    </div>

                    <button
                      className="customer-dropdown"
                      onClick={() => handleDropdownClick(customer.id)}
                      aria-expanded={isExpanded}
                      aria-label={isExpanded ? 'Hide details' : 'Show details'}
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M4 6L8 10L12 6" stroke="#1F1F1F" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>

                    {isExpanded && (
                      <div className="customer-detail-card">
                        <div className="detail-profile-section">
                          <div className="detail-avatar-placeholder">
                            <span>{customer.name.charAt(0)}</span>
                          </div>
                          <div>
                            <p className="detail-customer-name">{customer.name}</p>
                            <p className="customer-service">
                              {(customer.category || 'Service')} • {customer.service}
                            </p>
                          </div>
                        </div>

                        <div className="detail-info-section">
                          <div className="detail-row">
                            <span className="detail-label">Appointment</span>
                            <span className="detail-value">{customer.appointment}</span>
                          </div>
                          <div className="detail-row">
                            <span className="detail-label">Address</span>
                            <span className="detail-value">{customer.address}</span>
                          </div>
                        </div>

                        <div className="detail-actions">
                          {customer.status === 'Current' ? (
                            <>
                              {customer.bookingId && (
                                <button
                                  className="view-tracking-button"
                                  type="button"
                                  onClick={() => {
                                    setExpandedCustomer(null)
                                    setTrackingBooking({
                                      ...customer,
                                      status: customer.status || 'Current'
                                    })
                                  }}
                                >
                                  View Tracking
                                </button>
                              )}
                              <button
                                className="mark-complete-button"
                                type="button"
                                onClick={() => {
                                  setExpandedCustomer(null)
                                  onShowOtp?.(customer)
                                }}
                              >
                                Mark Complete
                              </button>
                              {customer.paymentStatus !== 'done' && (
                                <button
                                  className="send-payment-button"
                                  type="button"
                                  onClick={async () => {
                                    try {
                                      await onSendPaymentLink?.(customer)
                                    } catch (error) {
                                      console.error('Failed to send payment link:', error)
                                    }
                                  }}
                                  disabled={!onSendPaymentLink}
                                >
                                  Send Payment Link
                                </button>
                              )}
                            </>
                          ) : customer.status === 'Completed' ? (
                            <>
                              <button className="delete-button" type="button" onClick={() => setExpandedCustomer(null)}>
                                Delete
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                className="accept-button"
                                type="button"
                                onClick={() => {
                                  setExpandedCustomer(null)
                                  onAcceptOrder?.(customer)
                                }}
                                disabled={!onAcceptOrder || !customer.bookingId}
                              >
                                Accept
                              </button>
                              <button
                                className="reject-button"
                                type="button"
                                onClick={() => {
                                  setExpandedCustomer(null)
                                  onRejectOrder?.(customer)
                                }}
                                disabled={!onRejectOrder || !customer.bookingId}
                              >
                                Reject
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
            )}
          </div>
        </div>

        <BottomNavigation activeTab={activeNav} onTabChange={handleNavChange} />
      </div>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={hideToast}
        />
      )}

      {trackingBooking && (
        <div className="tracking-modal" role="dialog" aria-modal="true">
          <div className="tracking-card">
            <div className="tracking-card-header">
              <h3>Live Tracking</h3>
              <button
                type="button"
                className="tracking-close"
                onClick={() => setTrackingBooking(null)}
                aria-label="Close tracking modal"
              >
                ×
              </button>
            </div>
            <p className="tracking-info">
              Booking #{trackingBooking.bookingId} • {trackingBooking.name}
            </p>
            <div ref={trackingMapRef} className="tracking-map" aria-label="Live tracking map" />
          </div>
        </div>
      )}
    </div>
  )
}

export default OrderManagement

