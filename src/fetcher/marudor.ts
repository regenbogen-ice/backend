import { Cache } from '../cache'
import { ApiModule, request } from './request'

const marudorCache = new Cache('marudor', 60)

type MarudorStationPlace = { evaNumber: string, name: string }
export const getStationByEva = async (evaNumber: number): Promise<MarudorStationPlace | void> => 
    await request(ApiModule.MARUDOR, '/stopPlace/v1/[evaNumber]', { evaNumber: String(evaNumber) }, { ignoreStatusCodes: [ 404 ], cache: marudorCache, cacheTTL: 60 * 60 * 24 * 30 })

