/**
 * Weather service using wttr.in (free, no API key needed)
 */

export async function fetchWeather(city) {
  if (!city) return null

  try {
    const res = await fetch(
      `https://wttr.in/${encodeURIComponent(city)}?format=j1`,
      { signal: AbortSignal.timeout(5000) }
    )
    if (!res.ok) return null
    const data = await res.json()

    const current = data.current_condition?.[0]
    if (!current) return null

    // Get local time from the nearest area
    const area = data.nearest_area?.[0]
    const localTime = area ? `${data.weather?.[0]?.date || ''} ${current.observation_time || ''}` : ''

    return {
      city: area?.areaName?.[0]?.value || city,
      region: area?.region?.[0]?.value || '',
      tempC: current.temp_C,
      feelsLikeC: current.FeelsLikeC,
      humidity: current.humidity,
      weatherDesc: current.weatherDesc?.[0]?.value || '',
      windSpeed: current.windspeedKmph,
      windDir: current.winddir16Point,
      uvIndex: current.uvIndex,
      visibility: current.visibility,
      localTime,
      icon: getWeatherIcon(current.weatherCode),
    }
  } catch (err) {
    console.error('Failed to fetch weather:', err)
    return null
  }
}

function getWeatherIcon(code) {
  const c = parseInt(code)
  if (c === 113) return '☀️'
  if (c === 116) return '⛅'
  if (c <= 122) return '☁️'
  if (c <= 200) return '🌫️'
  if (c <= 302) return '🌧️'
  if (c <= 314) return '🌧️'
  if (c <= 329) return '❄️'
  if (c <= 395) return '🌨️'
  return '🌤️'
}
