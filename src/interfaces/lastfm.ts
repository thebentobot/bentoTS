/* eslint-disable linebreak-style */
interface lastfmUserRegisteredAttributes {
	unixtime: string
	[`#text`]: number
}

interface lastfmUserImageObjectAttributes {
	size: string
	[`#text`]: string
}

interface lastfmUserAttributes {
	country: string
	age: string
	playcount: string
	realname: string
	playlists: string
	bootstrap: string
	image: lastfmUserImageObjectAttributes[]
	registered: lastfmUserRegisteredAttributes[]
	url: string
	gender: string
	name: string
	type: string
}

interface lastfmRecentTrackElement {
	mbid: string
	[`#text`]: string
}

interface lastfmRecentTrackDate {
	uts: string
	[`#text`]: string
}

interface lastfmRecentTrack {
	artist: lastfmRecentTrackElement
	streamable: string
	image: lastfmUserImageObjectAttributes[]
	mbid: string
	album: lastfmRecentTrackElement
	name: string
	url: string
	date: lastfmRecentTrackDate
}

interface lastfmRecentTrackUserAttributes {
	user: string
	totalPages: string
	page: string
	perPage: string
	total: string
}

interface lastfmRecentTracksAttributes {
	track: lastfmRecentTrack[]
	[`@attr`]: lastfmRecentTrackUserAttributes
}

export interface lastfmUser {
	user: lastfmUserAttributes
}

export interface lastfmRecentTracks {
	recenttracks: lastfmRecentTracksAttributes
}
