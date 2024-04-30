import { Cache } from '../cache.js'
import { ApiModule, request } from './request.js'

const bahnExpertCache = new Cache('bahn_expert', 60)

type BahnExpertStationPlace = { evaNumber: string, name: string }
export type BahnExpertDeparture = {
    initialDeparture: string,
    arrival: {
        scheduledPlatform: string,
        platform: string,
        scheduledTime: string,
        time: string,
        delay: number,
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
type BahnExpertIrisAbfahrtenResponse = { departures: BahnExpertDeparture[], wings: { [key: string]: BahnExpertDeparture } }
type BahnExpertCoachSequenceType = {
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
            vehicleCategory: string,
            closed: boolean,
            uic: string,
            type: string,
            identificationNumber: string,
        }[]
    }[] },
    direction: boolean
}

type BahnExpertDetailsType = {
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
        arrival: { scheduledPlatform: string, platform: string, scheduledTime: string, time: string, delay: number, cancalled: boolean },
        departure: { scheduledPlatform: string, platform: string, scheduledTime: string, time: string, delay: number, cancalled: boolean },
        station: { name: string, evaNumber: string },
        auslastung: { first: number, second: string },
        additional: boolean,
        cancelled: boolean
    }[]
}

export const getStationByEva = async (evaNumber: number): Promise<BahnExpertStationPlace | void> => 
    await request(ApiModule.BAHN_EXPERT, '/stopPlace/v1/[evaNumber]', { evaNumber: String(evaNumber) }, { ignoreStatusCodes: [ 404 ], cache: bahnExpertCache, cacheTTL: 60 * 60 * 24 * 30 })

    
export const getEvaByStation = async (station: string): Promise<BahnExpertStationPlace | void> => {
    const response = await request(ApiModule.BAHN_EXPERT, '/stopPlace/v1/search/[station]', { station, max: '1' }, { useGetArguments: ['max'], ignoreStatusCodes: [ 404 ], cache: bahnExpertCache, cacheTTL: 60 * 60 * 24 * 30 })
    if (response && response.length > 0)
        return response[0]
}

export const getIRISDepartures = async (evaNumber: number, lookahead?: number, lookbehind?: number): Promise<BahnExpertIrisAbfahrtenResponse | void> =>
    await request(ApiModule.BAHN_EXPERT, '/iris/v2/abfahrten/[evaNumber]', { evaNumber: String(evaNumber), lookahead: lookahead ? String(lookahead) : null, lookbehind: lookbehind ? String(lookbehind) : null }, { ignoreStatusCodes: [404], cache: bahnExpertCache, cacheTTL: 60 * 10, useGetArguments: ['lookahead', 'lookbehind'] })

export const getCoachSequence = async (trainNumber: number, trainCategory: string, initialDeparture: string, departure: string, evaNumber: number): Promise<BahnExpertCoachSequenceType | void> =>
    await request(ApiModule.BAHN_EXPERT, '/coachSequence/v4/wagen/[trainNumber]', { trainNumber: String(trainNumber), category: trainCategory, initialDeparture, departure, evaNumber: String(evaNumber) }, { ignoreStatusCodes: [404], cache: bahnExpertCache, cacheTTL: 60 * 5, useGetArguments: ['initialDeparture', 'departure', 'evaNumber', 'category']})

export const getTrainDetails = async (trainName: string, station: number, date: string): Promise<BahnExpertDetailsType | void> => 
    await request(ApiModule.BAHN_EXPERT, '/hafas/v2/details/[trainName]', { trainName, station: String(station), date }, { cache: bahnExpertCache, cacheTTL: 60 * 3, useGetArguments: [ 'station', 'date'], ignoreStatusCodes: [404]})