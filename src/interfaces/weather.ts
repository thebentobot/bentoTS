/* eslint-disable linebreak-style */
interface weatherAPIWeatherObjectInterface {
	id: number
	main: string
	description: string
	icon: string
}

interface weatherAPISysObjectInterface {
	country: string
	sunrise: number
	sunset: number
}

interface weatherAPIMainObjectInterface {
	temp: number
	feels_like: number
	temp_min: number
	temp_max: number
	pressure: number
	humidity: number
}

interface weatherAPICloudsObjectInterface {
	all: number
}

interface weatherAPIWindObjectInterface {
	speed: number
	deg: number
}

interface weatherAPICoordObjectInterface {
	lon: number
	lat: number
}

export interface weatherAPIObjectInterface {
	name: string
	id: number
	weather: Array<weatherAPIWeatherObjectInterface>
	sys: weatherAPISysObjectInterface
	main: weatherAPIMainObjectInterface
	dt: number
	timezone: number
	clouds: weatherAPICloudsObjectInterface
	wind: weatherAPIWindObjectInterface
	coord: weatherAPICoordObjectInterface
}
