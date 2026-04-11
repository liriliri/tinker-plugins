export interface GeoResult {
  name: string
  admin1: string
  country: string
  latitude: number
  longitude: number
  timezone: string
  population: number
}

export interface CurrentWeather {
  temperature: number
  apparentTemperature: number
  humidity: number
  windSpeed: number
  windDirection: number
  weatherCode: number
  isDay: boolean
  uvIndex: number
  visibility: number
  cloudCover: number
}

export interface DailyForecast {
  date: string
  weatherCode: number
  tempMax: number
  tempMin: number
  precipProbability: number
  precipSum: number
  windSpeedMax: number
  uvIndexMax: number
  sunrise: string
  sunset: string
}

export interface WeatherData {
  current: CurrentWeather
  daily: DailyForecast[]
}
