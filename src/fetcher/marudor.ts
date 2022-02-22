import { Cache } from '../cache.js'
import { ApiModule, request } from './request.js'

const marudorCache = new Cache('marudor', 60)

type MarudorStationPlace = { evaNumber: string, name: string }
type MarudorIrisAbfahrtenResponse = { departures: {
    initialDeparture: string,
    arrival: {
        scheduledPlatform: string,
        platform: string,
        scheduledTime: string,
        time: string,
        delay: number,
        reihung: boolean,
        cancelled: boolean,
        hidden: boolean
    },
    auslastung: boolean,
    currentStopPlace: { name: string, evaNumber: string },
    departure: {
        scheduledPlatform: string,
        platform: string,
        scheduledTime: string,
        time: string,
        delay: number,
        reihung: boolean,
        cancelled: boolean,
        hidden: boolean
    },
    destination: string,
    id: string,
    additionel: boolean,
    cancelled: boolean,
    mediumId: string,
    platform: string,
    rawId: string,
    ref: { trainNumber: string, trainType: string, train: string },
    reihung: boolean,
    route: { additional: boolean, cancelled: boolean, showVia: boolean, name: string }[],
    scheduledDestination: string,
    scheduledPlatform: string,
    substitute: boolean,
    train: {
        name: string,
        line: string,
        number: string,
        type: string,
        admin: string,
        longDistance: boolean,
        operator: { name: string, icoX: number }
    }
}[]}
export const getStationByEva = async (evaNumber: number): Promise<MarudorStationPlace | void> => 
    await request(ApiModule.MARUDOR, '/stopPlace/v1/[evaNumber]', { evaNumber: String(evaNumber) }, { ignoreStatusCodes: [ 404 ], cache: marudorCache, cacheTTL: 60 * 60 * 24 * 30 })

export const getIRISDepartures = async (evaNumber: number, lookahead?: number, lookbehind?: number): Promise<MarudorIrisAbfahrtenResponse | void> =>
    await request(ApiModule.MARUDOR, '/iris/v2/abfahrten/[evaNumber]', { evaNumber: String(evaNumber), lookahead: lookahead ? String(lookahead) : null, lookbehind: lookbehind ? String(lookbehind) : null }, { ignoreStatusCodes: [404], cache: marudorCache, cacheTTL: 60 * 5, useGetArguments: ['lookahead', 'llokbehind'] })