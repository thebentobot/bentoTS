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
	registered: lastfmUserRegisteredAttributes
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

interface lastfmNowPlayingAttributes {
	nowplaying: string
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
	[`@attr`]?: lastfmNowPlayingAttributes
}

interface lastfmRecentTrackUserAttributes {
	user: string
	totalPages: string
	page: string
	perPage: string
	total: string
}

interface lastfmStreamableAttributes {
	fulltrack: string
	[`#text`]: string
}

interface lastfmArtistAttributes {
	url: string
	name: string
	mbid: string
}

interface lastfmRankAttribute {
	rank: string
}

export interface lastfmTopTrack {
	streamable: lastfmStreamableAttributes
	mbid: string
	name: string
	image: lastfmUserImageObjectAttributes[]
	artist: lastfmArtistAttributes
	url: string
	duration: string
	[`@attr`]: lastfmRankAttribute
	playcount: string
}

export interface lastfmTopAlbum {
	artist: lastfmArtistAttributes
	image: lastfmUserImageObjectAttributes[]
	mbid: string
	url: string
	playcount: string
	[`@attr`]: lastfmRankAttribute
	name: string
}

export interface lastfmTopArtist {
	streamable: lastfmStreamableAttributes
	image: lastfmUserImageObjectAttributes[]
	mbid: string
	url: string
	playcount: string
	[`@attr`]: lastfmRankAttribute
	name: string
}

interface lastfmRecentTracksAttributes {
	track: lastfmRecentTrack[]
	[`@attr`]: lastfmRecentTrackUserAttributes
}

interface lastfmTopTracksAttributes {
	track: lastfmTopTrack[]
	[`@attr`]: lastfmRecentTrackUserAttributes
}

interface lastfmTopAlbumsAttributes {
	album: lastfmTopAlbum[]
	[`@attr`]: lastfmRecentTrackUserAttributes
}

interface lastfmTopArtistsAttributes {
	artist: lastfmTopArtist[]
	[`@attr`]: lastfmRecentTrackUserAttributes
}

export interface lastfmUser {
	user: lastfmUserAttributes
}

export interface lastfmRecentTracks {
	recenttracks: lastfmRecentTracksAttributes
}

export interface lastfmTopTracks {
	toptracks: lastfmTopTracksAttributes
}

export interface lastfmTopAlbums {
	topalbums: lastfmTopAlbumsAttributes
}

export interface lastfmTopArtists {
	topartists: lastfmTopArtistsAttributes
}

export interface lastfmProfile {
	user: lastfmUserAttributes
}
