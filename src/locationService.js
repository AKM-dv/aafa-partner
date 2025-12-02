export function isGeolocationAvailable() {
  return typeof window !== 'undefined' && 'geolocation' in window.navigator
}

export function requestProviderLocation(options = {}) {
  if (!isGeolocationAvailable()) {
    return Promise.reject(new Error('Geolocation is not supported in this browser'))
  }

  const geolocationOptions = {
    enableHighAccuracy: true,
    timeout: 15000,
    maximumAge: 0,
    ...options
  }

  return new Promise((resolve, reject) => {
    window.navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: Number(position.coords.latitude.toFixed(6)),
          longitude: Number(position.coords.longitude.toFixed(6)),
          accuracy: position.coords.accuracy
        })
      },
      (error) => {
        reject(error)
      },
      geolocationOptions
    )
  })
}

export function watchProviderLocation(onUpdate, onError, options = {}) {
  if (!isGeolocationAvailable()) {
    if (typeof onError === 'function') {
      onError(new Error('Geolocation is not supported in this browser'))
    }
    return null
  }

  const geolocationOptions = {
    enableHighAccuracy: true,
    timeout: 15000,
    maximumAge: 0,
    ...options
  }

  const watchId = window.navigator.geolocation.watchPosition(
    (position) => {
      const coords = {
        latitude: Number(position.coords.latitude.toFixed(6)),
        longitude: Number(position.coords.longitude.toFixed(6)),
        accuracy: position.coords.accuracy,
        heading: position.coords.heading,
        speed: position.coords.speed
      }
      if (typeof onUpdate === 'function') {
        onUpdate(coords)
      }
    },
    (error) => {
      if (typeof onError === 'function') {
        onError(error)
      }
    },
    geolocationOptions
  )

  return watchId
}

export function clearLocationWatch(watchId) {
  if (!isGeolocationAvailable() || watchId == null) return
  window.navigator.geolocation.clearWatch(watchId)
}

