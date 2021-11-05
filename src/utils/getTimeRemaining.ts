export function getTimeRemaining(endtime: string) {
	const timeConvert = {
		theTime: `${new Date()}`,
	}
	const total = Date.parse(endtime) - Date.parse(timeConvert.theTime)
	const seconds = Math.floor((total / 1000) % 60)
	const minutes = Math.floor((total / 1000 / 60) % 60)
	const hours = Math.floor((total / (1000 * 60 * 60)) % 24)
	const days = Math.floor(total / (1000 * 60 * 60 * 24))

	return {
		total,
		days,
		hours,
		minutes,
		seconds,
	}
}
