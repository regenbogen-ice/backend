import { Cache } from '../cache.js'
import { ApiModule, request } from './request.js'

const marudorCache = new Cache('marudor', 60)

type MarudorStationPlace = { evaNumber: string, name: string }
type MarudorDeparture = {
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
}
type MarudorIrisAbfahrtenResponse = { departures: MarudorDeparture[], wings: { [key: string]: MarudorDeparture } }
type MarudorCoachSequenceType = {
    stop: { stopPlace: { name: string, evaNumber: string } },
    product: { number: string, type: string, line: string },
    sequence: { groups: {
        name: string,
        originName: string,
        destinationName: string,
        trainName: string,
        number: string,
        baureihe: { // building_series
            name: string,
            baureihe: string,
            identifier: string
        },
        coaches: {
            class: number,
            category: string,
            closed: boolean,
            uic: string,
            type: string,
            identificationNumber: string,
        }[]
    }[] },
    direction: boolean
}

type MarudorDetailsType = {
    cancelled: boolean,
    changeDuration: number,
    finalDestination: string,
    jid: string,
    product: {
        name: string,
        number: string,
        icoX: number,
        cls: number,
        oprX: number,
        addName: string,
        nameS: string,
        matchId: string
    },
    stops: {
        arrival: { scheduledPlatform: string, platform: string, scheduledTime: string, time: string, delay: number, reihung: boolean, cancalled: boolean },
        departure: { scheduledPlatform: string, platform: string, scheduledTime: string, time: string, delay: number, reihung: boolean, cancalled: boolean },
        station: { title: string, id: string },
        auslastung: { first: number, second: string },
        additional: boolean,
        cancelled: boolean
    }[]
}

export const getStationByEva = async (evaNumber: number): Promise<MarudorStationPlace | void> => 
    await request(ApiModule.MARUDOR, '/stopPlace/v1/[evaNumber]', { evaNumber: String(evaNumber) }, { ignoreStatusCodes: [ 404 ], cache: marudorCache, cacheTTL: 60 * 60 * 24 * 30 })

    
export const getEvaByStation = async (station: string): Promise<MarudorStationPlace | void> => {
    const response = await request(ApiModule.MARUDOR, '/stopPlace/v1/search/[station]', { station, max: '1' }, { useGetArguments: ['max'], ignoreStatusCodes: [ 404 ], cache: marudorCache, cacheTTL: 60 * 60 * 24 * 30 })
    if (response && response.length > 0)
        return response[0]
}

export const getIRISDepartures = async (evaNumber: number, lookahead?: number, lookbehind?: number): Promise<MarudorIrisAbfahrtenResponse | void> =>
    await request(ApiModule.MARUDOR, '/iris/v2/abfahrten/[evaNumber]', { evaNumber: String(evaNumber), lookahead: lookahead ? String(lookahead) : null, lookbehind: lookbehind ? String(lookbehind) : null }, { ignoreStatusCodes: [404], cache: marudorCache, cacheTTL: 60 * 10, useGetArguments: ['lookahead', 'lookbehind'] })

export const getCoachSequence = async (trainNumber: number, departure: string, evaNumber: number): Promise<MarudorCoachSequenceType | void> =>
    await request(ApiModule.MARUDOR, '/reihung/v4/wagen/[trainNumber]', { trainNumber: String(trainNumber), departure, evaNumber: String(evaNumber) }, { ignoreStatusCodes: [404], cache: marudorCache, cacheTTL: 60 * 10, useGetArguments: ['departure', 'evaNumber']})

export const getTrainDetails = async (trainName: string, station: number, date: string): Promise<MarudorDetailsType | void> => 
    await request(ApiModule.MARUDOR, '/hafas/v2/details/[trainName]', { trainName, station: String(station), date }, { cache: marudorCache, cacheTTL: 60 * 5, useGetArguments: [ 'station', 'date'], ignoreStatusCodes: [404]})