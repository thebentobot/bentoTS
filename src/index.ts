import Client from './client/index'

new Client().init()

process.on(`unhandledRejection`, (error) => {
	console.error(`Unhandled promise rejection:`, error)
})
