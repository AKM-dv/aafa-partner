const API_BASE_URL = 'https://aafa.mycartly.in/api'

async function getJson(path) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  })

  let data
  try {
    data = await response.json()
  } catch {
    data = {}
  }

  if (!response.ok) {
    const message = data?.message || data?.error?.message || 'Request failed'
    throw new Error(message)
  }

  return data
}

async function postJson(path, payload) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  })

  let data
  try {
    data = await response.json()
  } catch {
    data = {}
  }

  if (!response.ok) {
    const message = data?.message || 'Request failed'
    throw new Error(message)
  }

  return data
}

async function postMultipart(path, formData) {
  console.log('Making multipart request to:', `${API_BASE_URL}${path}`)
  
  let response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'POST',
      body: formData
    })
  } catch (networkError) {
    console.error('Network error:', networkError)
    if (networkError.message.includes('Failed to fetch') || networkError.message.includes('CORS')) {
      throw new Error('CORS Error: Backend server needs to allow requests from this origin. Please contact backend team to add CORS headers for ' + window.location.origin)
    }
    throw new Error('Network error: ' + networkError.message)
  }

  console.log('Response status:', response.status, response.statusText)

  let data
  try {
    const text = await response.text()
    console.log('Response text:', text)
    data = text ? JSON.parse(text) : {}
  } catch (parseError) {
    console.error('Failed to parse response:', parseError)
    data = {}
  }

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`
    
    if (data?.error) {
      if (typeof data.error === 'string') {
        message = data.error
      } else if (data.error?.message) {
        message = data.error.message
      } else if (data.error?.code) {
        message = `${data.error.code}: ${data.error.message || 'Validation error'}`
      }
    } else if (data?.message) {
      message = data.message
    }
    
    console.error('Request failed:', message, data)
    throw new Error(message)
  }

  return data
}

async function authedJson(path, payload, token, method = 'POST') {
  if (!token) {
    throw new Error('Authentication token is required for this request')
  }

  const config = {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    }
  }

  if (payload && (method === 'POST' || method === 'PUT')) {
    config.body = JSON.stringify(payload)
  }

  const response = await fetch(`${API_BASE_URL}${path}`, config)

  let data
  try {
    data = await response.json()
  } catch {
    data = {}
  }

  if (!response.ok) {
    const message = data?.message || data?.error?.message || 'Request failed'
    throw new Error(message)
  }

  return data
}

export const authApi = {
  sendLoginOtp: (phoneNumber) =>
    postJson('/auth/login', { phone_number: phoneNumber }),

  verifyLoginOtp: (phoneNumber, otp) =>
    postJson('/auth/verify', { phone_number: phoneNumber, otp }),

  verifyProviderStatus: (phoneNumber) =>
    postJson('/provider/verify', { phone_number: phoneNumber }),

  registerUser: (payload) =>
    postJson('/auth/register', payload),

  verifyRegistrationOtp: (phoneNumber, otp) =>
    postJson('/auth/verify-register', { phone_number: phoneNumber, otp }),

  registerProvider: (formData) =>
    postMultipart('/provider/register', formData)
}

export const servicesApi = {
  getCategories: () =>
    getJson('/admin/categories'),

  getServices: (categoryId) => {
    const path = categoryId ? `/admin/services?category_id=${categoryId}` : '/admin/services'
    return getJson(path)
  }
}

export const providerApi = {
  setLocation: ({ providerId, latitude, longitude, isOnline = 1, token }) =>
    authedJson('/provider/location/set', {
      provider_id: providerId,
      latitude,
      longitude,
      is_online: isOnline ? 1 : 0
    }, token),

  updateLocation: ({ bookingId, latitude, longitude, token }) =>
    authedJson('/provider/location/update', {
      booking_id: bookingId,
      latitude,
      longitude
    }, token),

  stopTracking: ({ bookingId, token }) =>
    authedJson(`/provider/location/stop/${bookingId}`, null, token, 'PUT'),

  markReached: ({ bookingId, token }) =>
    authedJson(`/provider/reached/${bookingId}`, null, token, 'PUT'),

  getNotifications: ({ providerId, token, status = 'sent' }) =>
    authedJson(`/provider/booking/notifications?provider_id=${providerId}&status=${status}`, null, token, 'GET'),

  respondToNotification: ({ bookingId, providerId, action, token }) =>
    authedJson('/provider/booking/notification/respond', {
      booking_id: bookingId,
      provider_id: providerId,
      action
    }, token),

  trackBooking: ({ bookingId, token }) =>
    authedJson(`/booking/track/${bookingId}`, null, token, 'GET'),

  requestPaymentLink: ({ bookingId, providerId, userId, amount, serviceName, userPhone, token }) =>
    authedJson('/payment/request', {
      booking_id: bookingId,
      provider_id: providerId,
      user_id: userId,
      amount,
      service_name: serviceName,
      user_phone: userPhone
    }, token),

  initiateComplete: ({ bookingId, token }) =>
    authedJson(`/provider/booking/initiate-complete/${bookingId}`, null, token, 'POST'),

  completeBooking: ({ bookingId, otp, token }) =>
    authedJson(`/booking/complete/${bookingId}`, {
      otp
    }, token),

  getTransactions: ({ providerId, token, from, to, count, skip }) => {
    const params = new URLSearchParams()
    if (providerId) params.append('provider_id', providerId)
    if (from) params.append('from', from)
    if (to) params.append('to', to)
    if (count) params.append('count', count)
    if (skip) params.append('skip', skip)
    const query = params.toString()
    return authedJson(`/provider/transactions${query ? `?${query}` : ''}`, null, token, 'GET')
  },

  getRecentOrders: ({ providerId, token, limit = 10 }) =>
    authedJson(`/provider/orders/recent?provider_id=${providerId}&limit=${limit}`, null, token, 'GET'),

  getOngoingAppointments: ({ phoneNumber, token }) => {
    const params = new URLSearchParams()
    params.append('phone_number', phoneNumber)
    return authedJson(`/provider/appointments/ongoing?${params.toString()}`, null, token, 'GET')
  },

  getHistoryAppointments: ({ phoneNumber, token }) => {
    const params = new URLSearchParams()
    params.append('phone_number', phoneNumber)
    return authedJson(`/provider/appointments/history?${params.toString()}`, null, token, 'GET')
  },

  getAllAppointments: ({ phoneNumber, token, status }) => {
    const params = new URLSearchParams()
    params.append('phone_number', phoneNumber)
    if (status) params.append('status', status)
    return authedJson(`/provider/appointments/all?${params.toString()}`, null, token, 'GET')
  },

  updateProfile: ({ phoneNumber, token, full_name, email, gender, address, city, state, account_holder_name, bank_name, account_number, ifsc_code, latitude, longitude, is_online }) =>
    authedJson('/provider/update', {
      phone_number: phoneNumber,
      full_name,
      email,
      gender,
      address,
      city,
      state,
      account_holder_name,
      bank_name,
      account_number,
      ifsc_code,
      ...(latitude !== undefined && { latitude }),
      ...(longitude !== undefined && { longitude }),
      ...(is_online !== undefined && { is_online: is_online ? 1 : 0 })
    }, token, 'PUT'),

  getWalletSummary: ({ providerId, token }) =>
    authedJson(`/provider/wallet/${providerId}`, null, token, 'GET'),

  requestWithdrawal: ({ providerId, amount, token }) =>
    authedJson('/provider/withdrawals', {
      provider_id: providerId,
      amount
    }, token),

  getWithdrawals: ({ providerId, token }) =>
    authedJson(`/provider/withdrawals?provider_id=${providerId}`, null, token, 'GET')
}

export default authApi

