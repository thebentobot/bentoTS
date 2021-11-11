// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import Client from '../client'
import { ClientEvents } from 'discord.js'

interface Run {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	(client: Client, ...args: any[])
}

export interface Event {
	name: keyof ClientEvents
	run: Run
}
