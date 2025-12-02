import { useState, useEffect, useRef, useMemo } from 'react'
import './ServiceHome.css'
import OrderManagement from './OrderManagement'
import BottomNavigation from './BottomNavigation'
import Account from './Account'
import Withdrawal from './Withdrawal'
import OTP from './OTP'
import HappyCode from './HappyCode'
import PaymentConfirmation from './PaymentConfirmation'
import { providerApi, servicesApi } from './apiClient'
import { requestProviderLocation, watchProviderLocation, clearLocationWatch } from './locationService'
import { GOOGLE_MAPS_API_KEY } from './config'
import serviceLogo from '/anact.jpeg'
import serviceHomeImage from '/service-home.png'
import Toast from './Toast'
import { useToast } from './useToast'

function ServiceHome({ onLogout, userData }) {
  const [activeTab, setActiveTab] = useState('Home')
  const [isToggleOn, setIsToggleOn] = useState(true)
  const [showOrderManagement, setShowOrderManagement] = useState(false)
  const [showAccount, setShowAccount] = useState(false)
  const [showWithdrawal, setShowWithdrawal] = useState(false)
  const [showOtp, setShowOtp] = useState(false)
  const [showPaymentConfirmation, setShowPaymentConfirmation] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [otpPurpose, setOtpPurpose] = useState(null) // 'login' or 'complete'
  const [isSyncingLocation, setIsSyncingLocation] = useState(false)
  const { toast, showSuccess, showError, showWarning, hideToast } = useToast()
  const [googleMapsLoaded, setGoogleMapsLoaded] = useState(typeof window !== 'undefined' && !!window.google?.maps)
  const initialCoords = userData?.latitude && userData?.longitude
    ? { latitude: userData.latitude, longitude: userData.longitude }
    : null
  const [currentCoords, setCurrentCoords] = useState(initialCoords)
  const mapContainerRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markerRef = useRef(null)
  const locationWatchIdRef = useRef(null)
  const lastLocationSentAtRef = useRef(0)
  const [notificationQueue, setNotificationQueue] = useState([])
  const [activeNotification, setActiveNotification] = useState(null)
  const seenNotificationsRef = useRef(new Set())
  const notificationIntervalRef = useRef(null)
  const notificationAudioRef = useRef(null)
  const notificationSoundIntervalRef = useRef(null)
  const loadPersistedOrders = () => {
    try {
      const stored = localStorage.getItem('blinkcareProviderOrders')
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed)) {
          return parsed.filter(order => order && order.bookingId)
        }
      }
    } catch (error) {
      console.error('Failed to load persisted orders:', error)
    }
    return []
  }

  const persistOrders = (orders) => {
    try {
      const toStore = orders.filter(order => 
        order && order.bookingId && (order.status === 'Current' || order.status === 'Completed')
      )
      localStorage.setItem('blinkcareProviderOrders', JSON.stringify(toStore))
    } catch (error) {
      console.error('Failed to persist orders:', error)
    }
  }

  const [liveOrders, setLiveOrders] = useState(() => loadPersistedOrders())
  const [trackingBooking, setTrackingBooking] = useState(null)
  const trackingMapRef = useRef(null)
  const trackingMapInstanceRef = useRef(null)
  const trackingProviderMarkerRef = useRef(null)
  const trackingUserMarkerRef = useRef(null)
  const trackingIntervalRef = useRef(null)
  const autoOnlineSyncRef = useRef(false)
  const [servicePrices, setServicePrices] = useState({})
  const [categoryNames, setCategoryNames] = useState({})
  const [serviceNames, setServiceNames] = useState({})
  const [recentOrders, setRecentOrders] = useState([])
  const [transactions, setTransactions] = useState([])
  const [isLoadingData, setIsLoadingData] = useState(true)
  useEffect(() => {
    let isMounted = true
    const fetchServices = async () => {
      try {
        const response = await servicesApi.getServices()
        if (!isMounted) return
        const priceMap = {}
        const services = response?.services || response?.categories || []

        const registerPrice = (service) => {
          if (!service) return
          if (service?.category_id != null && service?.category_name) {
            setCategoryNames((prev) => ({
              ...prev,
              [service.category_id]: service.category_name
            }))
          }
          if (service?.id != null && service?.title) {
            setServiceNames((prev) => ({
              ...prev,
              [service.id]: service.title
            }))
          }
          const price = Number(service.price_discounted || service.price_original || 0)
          if (!Number.isFinite(price) || price <= 0) return
          if (service.id != null) {
            priceMap[`id:${service.id}`] = price
          }
          if (service.title) {
            priceMap[service.title.trim().toLowerCase()] = price
          }
        }

        services.forEach((item) => {
          registerPrice(item)
          if (Array.isArray(item?.services)) {
            item.services.forEach(registerPrice)
          }
        })

        setServicePrices(priceMap)
      } catch (error) {
        console.error('Failed to fetch service prices:', error)
      }
    }
    fetchServices()
    return () => {
      isMounted = false
    }
  }, [])
  const providerId =
    userData?.providerDetails?.id ||
    userData?.provider_id ||
    userData?.providerId ||
    userData?.providerDetails?.provider_id ||
    userData?.providerDetails?.provider?.id ||
    null
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

  useEffect(() => {
    if (!googleMapsLoaded || !mapContainerRef.current || !currentCoords) return

    const position = {
      lat: currentCoords.latitude,
      lng: currentCoords.longitude
    }

    if (!mapInstanceRef.current) {
      mapInstanceRef.current = new window.google.maps.Map(mapContainerRef.current, {
        center: position,
        zoom: 15,
        disableDefaultUI: true
      })
      markerRef.current = new window.google.maps.Marker({
        position,
        map: mapInstanceRef.current,
        title: 'Your current location'
      })
    } else {
      mapInstanceRef.current.setCenter(position)
      if (markerRef.current) {
        markerRef.current.setPosition(position)
      } else {
        markerRef.current = new window.google.maps.Marker({
          position,
          map: mapInstanceRef.current
        })
      }
    }
  }, [googleMapsLoaded, currentCoords])

  useEffect(() => {
    return () => {
      if (locationWatchIdRef.current != null) {
        clearLocationWatch(locationWatchIdRef.current)
      }
      if (notificationIntervalRef.current) {
        clearInterval(notificationIntervalRef.current)
      }
      if (notificationSoundIntervalRef.current) {
        clearInterval(notificationSoundIntervalRef.current)
      }
      if (trackingIntervalRef.current) {
        clearInterval(trackingIntervalRef.current)
      }
      stopNotificationSound()
    }
  }, [])

  useEffect(() => {
    if (userData?.latitude && userData?.longitude) {
      setCurrentCoords({
        latitude: userData.latitude,
        longitude: userData.longitude
      })
    }
  }, [userData?.latitude, userData?.longitude])

  // Function to play notification sound
  const playNotificationSound = () => {
    try {
      // Create audio context for notification sound
      const audioContext = new (window.AudioContext || window.webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      // Set frequency for bell-like sound (800Hz base tone)
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime)
      oscillator.frequency.setValueAtTime(1000, audioContext.currentTime + 0.1)
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2)
      
      // Set volume
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)
      
      oscillator.type = 'sine'
      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.3)
      
      // Store reference for cleanup
      notificationAudioRef.current = { audioContext, oscillator, gainNode }
    } catch (error) {
      console.error('Failed to play notification sound:', error)
    }
  }

  // Function to stop notification sound
  const stopNotificationSound = () => {
    if (notificationSoundIntervalRef.current) {
      clearInterval(notificationSoundIntervalRef.current)
      notificationSoundIntervalRef.current = null
    }
    if (notificationAudioRef.current) {
      try {
        if (notificationAudioRef.current.oscillator) {
          notificationAudioRef.current.oscillator.stop()
        }
        if (notificationAudioRef.current.audioContext) {
          notificationAudioRef.current.audioContext.close()
        }
      } catch (error) {
        console.error('Error stopping notification sound:', error)
      }
      notificationAudioRef.current = null
    }
  }

  // Play sound continuously when there's an active notification
  useEffect(() => {
    if (activeNotification) {
      // Play sound immediately
      playNotificationSound()
      // Play sound every 2 seconds until notification is handled
      notificationSoundIntervalRef.current = setInterval(() => {
        playNotificationSound()
      }, 2000)
    } else {
      // Stop sound when no active notification
      stopNotificationSound()
    }

    return () => {
      stopNotificationSound()
    }
  }, [activeNotification])

  useEffect(() => {
    if (!activeNotification && notificationQueue.length > 0) {
      setActiveNotification(notificationQueue[0])
      setNotificationQueue((prev) => prev.slice(1))
    }
  }, [notificationQueue, activeNotification])

  // Fetch notifications periodically
  useEffect(() => {
    if (!providerId || !userData?.token) return

    let isMounted = true

    const fetchNotifications = async () => {
      try {
        const response = await providerApi.getNotifications({
          providerId,
          token: userData.token,
          status: 'sent'
        })
        if (!isMounted) return
        const notifications = response?.notifications || []
        const unseen = notifications.filter((item) => {
          const key = `${item.booking_id}-${item.notification_sent_at}`
          if (seenNotificationsRef.current.has(key)) {
            return false
          }
          seenNotificationsRef.current.add(key)
          return true
        })
        if (unseen.length) {
          setNotificationQueue((prev) => [...prev, ...unseen])
        }
      } catch (error) {
        console.error('Failed to fetch notifications:', error)
      }
    }

    fetchNotifications()
    notificationIntervalRef.current = setInterval(fetchNotifications, 10000)

    return () => {
      isMounted = false
      if (notificationIntervalRef.current) {
        clearInterval(notificationIntervalRef.current)
        notificationIntervalRef.current = null
      }
    }
  }, [providerId, userData?.token])

  const pushLocationToBackend = async (coords, { force = false, onlineOverride } = {}) => {
    if (!coords || !userData?.token || !providerId) {
      return
    }

    const now = Date.now()
    if (!force && now - lastLocationSentAtRef.current < 5000) {
      return
    }
    lastLocationSentAtRef.current = now

    try {
      await providerApi.setLocation({
        providerId,
        latitude: coords.latitude,
        longitude: coords.longitude,
        isOnline: typeof onlineOverride === 'number' ? onlineOverride : (isToggleOn ? 1 : 0),
        token: userData.token
      })
    } catch (error) {
      console.error('Failed to push provider location:', error)
    }
  }

  const stopLiveTracking = () => {
    if (locationWatchIdRef.current != null) {
      clearLocationWatch(locationWatchIdRef.current)
      locationWatchIdRef.current = null
    }
  }

  const startLiveTracking = () => {
    if (locationWatchIdRef.current != null) return
    const watchId = watchProviderLocation(
      async (coords) => {
        setCurrentCoords(coords)
        await pushLocationToBackend(coords)
      },
      (error) => {
        console.warn('Live tracking error:', error)
      },
      { enableHighAccuracy: true }
    )
    locationWatchIdRef.current = watchId
  }

  const getServicePrice = (serviceName, serviceId) => {
    if (serviceId != null) {
      const idKey = `id:${serviceId}`
      if (servicePrices[idKey] != null) {
        return servicePrices[idKey]
      }
    }
    if (serviceName) {
      const key = serviceName.trim().toLowerCase()
      if (servicePrices[key] != null) {
        return servicePrices[key]
      }
    }
    return null
  }

  const enhanceOrderWithPrice = (order) => {
    if (!order) return order
    if (order.amountValue != null && order.amountValue !== 0) return order
    const catalogPrice = getServicePrice(order.service)
    if (catalogPrice != null && catalogPrice > 0) {
      return {
        ...order,
        amountValue: catalogPrice,
        amount: `₹${catalogPrice}`
      }
    }
    return order
  }

  const transformNotificationToOrder = (notification) => {
    const priceFromNotification = notification.price ?? notification.service_price ?? notification.service_fee ?? null
    const priceFromCatalog = getServicePrice(
      notification.service_name || notification.service,
      notification.service_id || notification.subcategory_id
    )
    const resolvedPrice = priceFromNotification != null ? Number(priceFromNotification) : priceFromCatalog
    const formattedAmount = resolvedPrice != null ? `₹${resolvedPrice}` : '—'

    return enhanceOrderWithPrice({
      id: `booking-${notification.booking_id}`,
      bookingId: notification.booking_id,
      name: notification.full_name || 'New Customer',
      categoryId: notification.category_id,
      category: notification.category_name || categoryNames[notification.category_id] || 'Category',
      serviceId: notification.service_id || notification.subcategory_id,
      service: notification.service_name || serviceNames[notification.service_id || notification.subcategory_id] || notification.service || 'Requested Service',
      amountValue: resolvedPrice,
      amount: formattedAmount,
      address: notification.address,
      petName: notification.pet_name || 'Pet',
      appointment: `${notification.preferred_date || ''} • ${notification.preferred_time || ''}`,
      status: 'Pending',
      userCoords: notification.user_latitude && notification.user_longitude
        ? {
            latitude: Number(notification.user_latitude),
            longitude: Number(notification.user_longitude)
          }
        : null,
      paymentStatus: notification.payment_status || 'pending',
      userId: notification.user_id,
      userPhone: notification.contact_number || notification.user_phone,
      notification
    })
  }
  useEffect(() => {
    if (!Object.keys(servicePrices).length) return
    setLiveOrders((prev) => prev.map((order) => enhanceOrderWithPrice(order)))
  }, [servicePrices])

  // Fetch recent orders and transactions
  useEffect(() => {
    if (!providerId || !userData?.token) return

    let isMounted = true

    const fetchData = async () => {
      try {
        setIsLoadingData(true)
        
        // Fetch recent orders from history API
        try {
          const providerData = userData?.providerDetails || userData?.provider || {}
          const phoneNumber = providerData?.phone_number || 
                             userData?.fullPhoneNumber ||
                             userData?.phoneNumber ||
                             (userData?.countryCode && userData?.phoneNumber ? `${userData.countryCode}${userData.phoneNumber}` : null) ||
                             userData?.user?.phone_number

          if (phoneNumber) {
            const ordersResponse = await providerApi.getHistoryAppointments({
              phoneNumber,
              token: userData.token
            })
            if (isMounted && ordersResponse?.bookings) {
              // Get most recent completed orders (limit to 10)
              const recentBookings = ordersResponse.bookings
                .filter(booking => booking.status === 'completed')
                .slice(0, 10)
                .map(booking => ({
                  username: booking.full_name || booking.user_name || 'Customer',
                  address: booking.address || booking.user_address || 'N/A',
                  price: booking.service_fee || booking.amount || booking.price || '₹0',
                  service: booking.service_name || booking.service || 'Service',
                  name: booking.full_name || booking.user_name || 'Customer',
                  amount: booking.service_fee || booking.amount || booking.price || '₹0',
                  service_name: booking.service_name || booking.service || 'Service'
                }))
              setRecentOrders(recentBookings)
            }
          } else {
            // Fallback to completed live orders
            if (isMounted) {
              const completedOrders = liveOrders
                .filter(order => order.status === 'Completed')
                .slice(0, 10)
                .map(order => ({
                  username: order.name || 'Customer',
                  address: order.address || 'N/A',
                  price: order.amount || '₹0',
                  service: order.service || 'Service'
                }))
              setRecentOrders(completedOrders)
            }
          }
        } catch (error) {
          console.error('Failed to fetch recent orders:', error)
          // Fallback to completed live orders
          if (isMounted) {
            const completedOrders = liveOrders
              .filter(order => order.status === 'Completed')
              .slice(0, 10)
              .map(order => ({
                username: order.name || 'Customer',
                address: order.address || 'N/A',
                price: order.amount || '₹0',
                service: order.service || 'Service'
              }))
            setRecentOrders(completedOrders)
          }
        }

        // Fetch transactions from Razorpay
        try {
          const transactionsResponse = await providerApi.getTransactions({
            providerId,
            token: userData.token,
            count: 10
          })
          if (isMounted && transactionsResponse?.transactions) {
            setTransactions(transactionsResponse.transactions)
          } else if (isMounted && Array.isArray(transactionsResponse)) {
            setTransactions(transactionsResponse)
          }
        } catch (error) {
          console.error('Failed to fetch transactions:', error)
          // If transactions API fails, use empty array or fallback
          if (isMounted) {
            setTransactions([])
          }
        }
      } finally {
        if (isMounted) {
          setIsLoadingData(false)
        }
      }
    }

    fetchData()

    return () => {
      isMounted = false
    }
  }, [providerId, userData?.token, liveOrders])

  useEffect(() => {
    persistOrders(liveOrders)
  }, [liveOrders])

  const handleViewNotification = () => {
    if (!activeNotification) return
    stopNotificationSound()
    const order = transformNotificationToOrder(activeNotification)
    setLiveOrders((prev) => {
      const exists = prev.some((item) => item.bookingId === order.bookingId)
      if (exists) return prev
      return [order, ...prev]
    })
    setActiveNotification(null)
    setShowOrderManagement(true)
    setShowAccount(false)
    setShowWithdrawal(false)
    setActiveTab('Orders')
  }

  const handleDismissNotification = () => {
    stopNotificationSound()
    setActiveNotification(null)
  }

  const handleRespondToOrder = async (order, action) => {
    // Stop notification sound when responding
    if (activeNotification && activeNotification.booking_id === order.bookingId) {
      stopNotificationSound()
      setActiveNotification(null)
    }
    
    if (!order?.bookingId || !providerId || !userData?.token) {
      if (action === 'reject') {
        setLiveOrders((prev) => prev.filter((item) => item.bookingId !== order.bookingId))
      }
      return
    }

    try {
      await providerApi.respondToNotification({
        bookingId: order.bookingId,
        providerId,
        action,
        token: userData.token
      })
      if (action === 'accept') {
        setLiveOrders((prev) =>
          prev.map((item) =>
            item.bookingId === order.bookingId
              ? { ...item, status: 'Current' }
              : item
          )
        )
        setTrackingBooking({
          ...order,
          status: 'Current'
        })
      } else {
        setLiveOrders((prev) => prev.filter((item) => item.bookingId !== order.bookingId))
      }
    } catch (error) {
      console.error('Failed to respond to booking:', error)
    }
  }

  const handleCompleteOrder = async (order, otp) => {
    if (!order?.bookingId || !userData?.token || !otp) {
      return
    }

    try {
      await providerApi.completeBooking({
        bookingId: order.bookingId,
        otp,
        token: userData.token
      })
      setLiveOrders((prev) =>
        prev.map((item) =>
          item.bookingId === order.bookingId
            ? { ...item, status: 'Completed' }
            : item
        )
      )
      setTrackingBooking(null)
      return true
    } catch (error) {
      console.error('Failed to complete booking:', error)
      throw error
    }
  }

  const handleViewTracking = (order) => {
    if (!order?.bookingId) return
    setTrackingBooking({
      ...order,
      status: order.status || 'Current'
    })
  }

  const handleAcceptOrder = (order) => {
    handleRespondToOrder(order, 'accept')
  }

  const handleRejectOrder = (order) => {
    handleRespondToOrder(order, 'reject')
  }

  const handleSendPaymentLink = async (order) => {
    if (!order?.bookingId || !providerId || !userData?.token) return
    
    // Try to get amount from multiple possible sources
    let amountValue = order.amountValue != null ? Number(order.amountValue) : null
    
    // If amountValue is not available, try to get it from booking object or other fields
    if (amountValue == null || amountValue === 0) {
      const booking = order.booking || order
      amountValue = booking?.service_fee != null 
        ? Number(booking.service_fee) 
        : booking?.price_original != null 
          ? Number(booking.price_original)
          : booking?.price_discounted != null
            ? Number(booking.price_discounted)
            : booking?.amount != null
              ? Number(booking.amount)
              : order?.amount != null
                ? Number(order.amount.toString().replace('₹', '').replace(',', ''))
                : 0
    }
    
    if (amountValue == null || amountValue <= 0) {
      showError('Amount is missing or invalid. Cannot send payment link.')
      return
    }
    
    const formattedAmount = amountValue.toFixed(2)
    
    try {
      const response = await providerApi.requestPaymentLink({
        bookingId: order.bookingId,
        providerId,
        userId: order.userId,
        amount: formattedAmount,
        serviceName: order.service || '',
        userPhone: order.userPhone || '',
        token: userData.token
      })
      
      // Update order state if we have payment link data
      if (response?.payment_link || response?.razorpay_order_id) {
        setLiveOrders((prev) =>
          prev.map((item) =>
            item.bookingId === order.bookingId 
              ? { 
                  ...item, 
                  paymentStatus: 'pending_link_sent',
                  paymentLink: response.payment_link,
                  razorpayOrderId: response.razorpay_order_id
                } 
              : item
          )
        )
      }
      
      // Always show success toast when API call succeeds
      const message = response?.message || 'Payment link sent successfully'
      showSuccess(message)
    } catch (error) {
      console.error('Failed to send payment link:', error)
      const errorMessage = error?.message || error?.response?.data?.message || 'Unknown error occurred'
      showError(`Failed to send payment link: ${errorMessage}`)
    }
  }

  const providerPosition = useMemo(() => {
    if (!currentCoords) return null
    return {
      lat: currentCoords.latitude,
      lng: currentCoords.longitude
    }
  }, [currentCoords])

  const updateTrackingMap = (providerPos, userPos) => {
    if (!trackingMapRef.current || !window.google?.maps) return
    
    // Calculate center point between both locations if both exist
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

    if (!trackingMapInstanceRef.current) {
      trackingMapInstanceRef.current = new window.google.maps.Map(trackingMapRef.current, {
        center: centerPos,
        zoom: 14,
        disableDefaultUI: false
      })
    } else {
      trackingMapInstanceRef.current.setCenter(centerPos)
      // Fit bounds to show both markers if both exist
      if (providerPos && userPos) {
        const bounds = new window.google.maps.LatLngBounds()
        bounds.extend(providerPos)
        bounds.extend(userPos)
        trackingMapInstanceRef.current.fitBounds(bounds)
      }
    }

    // Update or create provider marker
    if (providerPos) {
      if (!trackingProviderMarkerRef.current) {
        trackingProviderMarkerRef.current = new window.google.maps.Marker({
          map: trackingMapInstanceRef.current,
          position: providerPos,
          label: {
            text: 'You',
            color: '#ffffff',
            fontWeight: 'bold'
          },
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: '#4285F4',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 3
          }
        })
      } else {
        trackingProviderMarkerRef.current.setPosition(providerPos)
      }
    }

    // Update or create user marker
    if (userPos) {
      if (!trackingUserMarkerRef.current) {
        trackingUserMarkerRef.current = new window.google.maps.Marker({
          map: trackingMapInstanceRef.current,
          position: userPos,
          label: {
            text: 'Customer',
            color: '#ffffff',
            fontWeight: 'bold'
          },
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: '#FF6B2B',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 3
          }
        })
      } else {
        trackingUserMarkerRef.current.setPosition(userPos)
      }
    }
  }

  useEffect(() => {
    if (!trackingBooking || !googleMapsLoaded) return

    // Send provider location update to backend
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
        // Send provider location update
        if (currentCoords) {
          await sendProviderLocationUpdate()
        }
        
        // Fetch both locations
        const response = await providerApi.trackBooking({
          bookingId: trackingBooking.bookingId,
          token: userData.token
        })
        const providerLoc = response?.provider_location
        const userLoc = response?.user_location
        
        // Use provider location from API, fallback to current position
        const providerPos = providerLoc && providerLoc.latitude && providerLoc.longitude
          ? { lat: Number(providerLoc.latitude), lng: Number(providerLoc.longitude) }
          : providerPosition
        
        // Use user location from API, fallback to booking initial location
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

    // Initial update
    updateFromBooking()
    
    // Send initial location update
    if (currentCoords) {
      sendProviderLocationUpdate()
    }
    
    // Update every 5 seconds
    trackingIntervalRef.current = setInterval(updateFromBooking, 5000)

    return () => {
      if (trackingIntervalRef.current) {
        clearInterval(trackingIntervalRef.current)
        trackingIntervalRef.current = null
      }
      trackingMapInstanceRef.current = null
      trackingProviderMarkerRef.current = null
      trackingUserMarkerRef.current = null
    }
  }, [trackingBooking, googleMapsLoaded, providerPosition, currentCoords, userData?.token])

  if (showOtp && selectedOrder) {
    if (otpPurpose === 'complete') {
      return (
        <HappyCode
          onBack={() => {
            setShowOtp(false)
            setSelectedOrder(null)
            setOtpPurpose(null)
          }}
          order={selectedOrder}
          customVerify={async (otpCode) => {
            await handleCompleteOrder(selectedOrder, otpCode)
            return { otp: otpCode }
          }}
          onVerifySuccess={() => {
            setShowOtp(false)
            setShowPaymentConfirmation(true)
            setOtpPurpose(null)
          }}
        />
      )
    }
    return (
      <OTP
        onBack={() => {
          setShowOtp(false)
          setSelectedOrder(null)
          setOtpPurpose(null)
        }}
        phoneNumber={userData?.phoneNumber || '+91 8950512356'}
        countryCode={userData?.countryCode || '+91'}
        onLogout={onLogout}
        onVerifySuccess={() => {
          setShowOtp(false)
          setShowPaymentConfirmation(true)
          setOtpPurpose(null)
        }}
      />
    )
  }

  if (showPaymentConfirmation && selectedOrder) {
    return (
      <PaymentConfirmation
        order={selectedOrder}
        onDone={() => {
          setShowPaymentConfirmation(false)
          setSelectedOrder(null)
          setShowOrderManagement(false)
          setActiveTab('Home')
        }}
      />
    )
  }

  const syncOnlineStatus = async (shouldGoOnline) => {
    if (!userData?.token || !providerId) {
      return
    }
    try {
      setIsSyncingLocation(true)
      let coords = currentCoords
      if (shouldGoOnline) {
        try {
          const liveCoords = await requestProviderLocation()
          coords = liveCoords
          setCurrentCoords(liveCoords)
        } catch (error) {
          console.warn('Unable to fetch live location for provider:', error)
        }
        startLiveTracking()
      } else {
        stopLiveTracking()
      }

      if (coords) {
        await pushLocationToBackend(coords, { force: true, onlineOverride: shouldGoOnline ? 1 : 0 })
      }
    } catch (error) {
      console.error('Failed to update provider availability:', error)
    } finally {
      setIsSyncingLocation(false)
    }
  }

  const toggleSwitch = async () => {
    if (isSyncingLocation) return
    const nextState = !isToggleOn
    setIsToggleOn(nextState)
    await syncOnlineStatus(nextState)
  }

  useEffect(() => {
    if (!providerId || !userData?.token || !isToggleOn) return
    if (autoOnlineSyncRef.current) return
    autoOnlineSyncRef.current = true
    syncOnlineStatus(true)
  }, [providerId, userData?.token, isToggleOn])

  const handleNavChange = (tab) => {
    setActiveTab(tab)
    if (tab === 'Orders') {
      setShowOrderManagement(true)
      setShowAccount(false)
      setShowWithdrawal(false)
    } else if (tab === 'Account') {
      setShowAccount(true)
      setShowOrderManagement(false)
      setShowWithdrawal(false)
    } else if (tab === 'Withdrawal') {
      setShowWithdrawal(true)
      setShowOrderManagement(false)
      setShowAccount(false)
    } else if (tab === 'Home') {
      setShowOrderManagement(false)
      setShowAccount(false)
      setShowWithdrawal(false)
    }
  }

  if (showWithdrawal) {
    return (
      <Withdrawal 
        onBack={() => {
          setShowWithdrawal(false)
          setActiveTab('Home')
        }}
        activeNavTab={activeTab}
        onNavChange={handleNavChange}
        userData={userData}
      />
    )
  }

  if (showAccount) {
    return (
      <Account 
        onBack={() => {
          setShowAccount(false)
          setActiveTab('Home')
        }}
        activeNavTab={activeTab}
        onNavChange={handleNavChange}
        onLogout={onLogout}
        userData={userData}
      />
    )
  }

  if (showOrderManagement) {
    return (
      <>
        <OrderManagement 
          onBack={() => {
            setShowOrderManagement(false)
            setActiveTab('Home')
          }}
          activeNavTab={activeTab}
          onNavChange={handleNavChange}
          onShowOtp={async (order) => {
            if (!order?.bookingId || !userData?.token) return
            
            try {
              // First, initiate completion - this sends OTP to user
              await providerApi.initiateComplete({
                bookingId: order.bookingId,
                token: userData.token
              })
              
              // Show success message
              showSuccess('OTP sent to user. Please enter the OTP received by the customer.')
              
              // Then show OTP input modal
              setSelectedOrder(order)
              setOtpPurpose('complete')
              setShowOtp(true)
            } catch (error) {
              console.error('Failed to initiate completion:', error)
              // Extract error message - apiClient throws plain Error objects
              const errorMessage = error?.message || 'Failed to send OTP. Please try again.'
              const lowerMessage = errorMessage.toLowerCase()
              
              // Check if it's a payment-related error - show as warning
              // Match common payment completion error patterns
              const isPaymentError = lowerMessage.includes('payment') && (
                lowerMessage.includes('must be completed') ||
                lowerMessage.includes('completed') || 
                lowerMessage.includes('must be') || 
                lowerMessage.includes('ensure') ||
                lowerMessage.includes('not done') ||
                lowerMessage.includes('pending') ||
                lowerMessage.includes('done') ||
                lowerMessage.includes('first')
              )
              
              // Show warning toast if payment is not completed, otherwise show error
              if (isPaymentError) {
                showWarning(errorMessage)
              } else {
                showError(errorMessage)
              }
            }
          }}
          liveOrders={liveOrders}
          onAcceptOrder={handleAcceptOrder}
          onRejectOrder={handleRejectOrder}
          onSendPaymentLink={handleSendPaymentLink}
          onViewTracking={handleViewTracking}
          userData={userData}
          toast={toast}
          showSuccess={showSuccess}
          showError={showError}
          showWarning={showWarning}
          hideToast={hideToast}
        />
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            duration={toast.duration}
            onClose={hideToast}
          />
        )}
      </>
    )
  }

  return (
    <div className="service-home-container">
      <div className="service-home-content">
        <div className="service-home-header">
          <div className="service-home-logo-section">
            <img src={serviceLogo} alt="Active Aid Fitness Academy Logo" className="service-logo-icon" />
          </div>
          <button
            className="service-home-toggle-button"
            onClick={toggleSwitch}
            disabled={isSyncingLocation}
            aria-pressed={isToggleOn}
          >
            <svg width="40" height="24" viewBox="0 0 40 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="2" y="2" width="36" height="20" rx="10" fill={isToggleOn ? '#FF6B2B' : '#CCCCCC'}/>
              <circle cx={isToggleOn ? 30 : 10} cy="12" r="8" fill="#FFFFFF"/>
            </svg>
          </button>
        </div>

        <div className="provider-map-wrapper">
          <div ref={mapContainerRef} className="provider-map" aria-label="Provider current location map">
            {!googleMapsLoaded && <p className="map-loading-text">Loading map...</p>}
          </div>
        </div>

        <div className="service-home-greeting">
          <h2 className="user-name">
            Hello {userData?.providerDetails?.full_name || userData?.name || 'Active Aid Fitness Academy Partner'}
          </h2>
        </div>

        <div className="service-home-stats">
          <button className="stat-card stat-card-left" onClick={() => setShowOrderManagement(true)}>
            <p className="stat-label">Total Orders</p>
            <p className="stat-value">{liveOrders.filter(o => o.status === 'Completed').length}</p>
          </button>
          <div className="stat-card stat-card-right">
            <p className="stat-label">Total Revenue</p>
            <p className="stat-value">
              ₹{transactions.reduce((sum, t) => {
                const amount = t.amount ? t.amount / 100 : 0
                return sum + amount
              }, 0).toFixed(2)}
            </p>
          </div>
        </div>

        <div className="service-home-promo">
          <img src={serviceHomeImage} alt="Service Home" className="service-home-image" />
        </div>

        <div className="service-home-tables">
          <div className="table-section">
            <h3 className="table-heading">Recent Orders</h3>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Username</th>
                    <th>Address</th>
                    <th>Price</th>
                    <th>Service</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoadingData ? (
                    <tr>
                      <td colSpan="4" style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                        Loading...
                      </td>
                    </tr>
                  ) : recentOrders.length > 0 ? (
                    recentOrders.map((order, index) => (
                      <tr key={index} className={index % 2 === 1 ? 'highlighted-row' : ''}>
                        <td>{order.username || order.name || order.full_name || 'Customer'}</td>
                        <td>{order.address || order.city || 'N/A'}</td>
                        <td>{order.price || order.amount || order.amountValue ? `₹${order.amountValue || order.amount || order.price}` : '₹0'}</td>
                        <td>{order.service || order.service_name || 'Service'}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" style={{ textAlign: 'center', padding: '20px', color: '#666', fontSize: '14px' }}>
                        No recent orders found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="table-section">
            <h3 className="table-heading">Transactions</h3>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Username</th>
                    <th>Withdrawal</th>
                    <th>Tax ID</th>
                    <th>Taxes</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoadingData ? (
                    <tr>
                      <td colSpan="4" style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                        Loading...
                      </td>
                    </tr>
                  ) : transactions.length > 0 ? (
                    transactions.map((transaction, index) => {
                      const amount = transaction.amount ? (transaction.amount / 100).toFixed(2) : '0.00'
                      const taxAmount = transaction.fee ? (transaction.fee / 100).toFixed(2) : '0.00'
                      const username = transaction.notes?.customer_name || transaction.customer?.name || transaction.email?.split('@')[0] || 'Customer'
                      const paymentId = transaction.id || transaction.payment_id || 'N/A'
                      
                      return (
                        <tr key={transaction.id || index} className={index % 2 === 1 ? 'highlighted-row' : ''}>
                          <td>{username}</td>
                          <td>₹{amount}</td>
                          <td>{paymentId.substring(0, 10)}</td>
                          <td>₹{taxAmount}</td>
                        </tr>
                      )
                    })
                  ) : (
                    <tr>
                      <td colSpan="4" style={{ textAlign: 'center', padding: '20px', color: '#666', fontSize: '14px' }}>
                        No transactions found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <BottomNavigation 
          activeTab={activeTab}
          onTabChange={handleNavChange}
        />
      </div>

      {activeNotification && (
        <div className="notification-popup" role="dialog" aria-modal="true">
          <div className="notification-card">
            <p className="notification-label">New Booking Request</p>
            <h3 className="notification-customer">{activeNotification.full_name || 'New Customer'}</h3>
            <p className="notification-service">{activeNotification.service_name || 'Requested Service'}</p>
            <p className="notification-address">{activeNotification.address}</p>
            <div className="notification-actions">
              <button type="button" className="notification-secondary" onClick={handleDismissNotification}>
                Later
              </button>
              <button type="button" className="notification-primary" onClick={handleViewNotification}>
                View Booking
              </button>
            </div>
          </div>
        </div>
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
            <div style={{ padding: '16px', borderTop: '1px solid #e0e0e0' }}>
              <button
                type="button"
                onClick={async () => {
                  if (!trackingBooking?.bookingId || !userData?.token) return
                  try {
                    await providerApi.markReached({
                      bookingId: trackingBooking.bookingId,
                      token: userData.token
                    })
                    showSuccess('You have marked as reached the location!')
                    setTimeout(() => {
                      setTrackingBooking(null)
                    }, 1500)
                  } catch (error) {
                    console.error('Failed to mark as reached:', error)
                    showError('Failed to mark as reached. Please try again.')
                  }
                }}
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: '#4CAF50',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" fill="currentColor"/>
                </svg>
                Reached
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={hideToast}
        />
      )}
    </div>
  )
}

export default ServiceHome

