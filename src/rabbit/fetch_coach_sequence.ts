import { DateTime } from 'luxon'
import database from '../database.js'
import { toSQLTimestamp } from '../dateTimeFormat.js'
import { getCoachSequence, getEvaByStation } from '../fetcher/bahn_expert.js'
import { debug } from '../logger.js'
import rabbitAsyncHandler from '../rabbitAsyncHandler.js'

type FetchCoachSequence = { trainId: number, trainNumber: number, trainType: string, evaDeparture: string, evaNumber: number }


const getTrainVehicle = async (
    train_vehicle_number: number,
    train_vehicle_name: string,
    train_type: string,
    building_series: { building_series: number | null, building_series_name: string } | null
    ): Promise<number> => {
    let trainVehicleId = (await database('train_vehicle').insert({
            train_vehicle_number,
            train_vehicle_name,
            train_type,
            building_series: building_series?.building_series,
            building_series_name: building_series?.building_series_name
        }).onConflict('train_vehicle_number').merge())[0]
    if (trainVehicleId) {
        return trainVehicleId
    } else {
        return (await database('train_vehicle').where({ train_vehicle_number }).select(['id']).first())["id"]
    }
}

const checkCoachIntegrity = async (trainVehicleId: number | null, coaches: { uic: string, category: string, class: number, type: string }[]): Promise<boolean> => {
    const coachSequence = trainVehicleId ? await database('coach_sequence').where({ train_vehicle_id: trainVehicleId }).orderBy('timestamp', 'desc').select('id').first() : null
    if (!coachSequence && trainVehicleId) return false
    const coachSequenceId = coachSequence ? coachSequence.id : null
    for (const [coachIndex, coach] of coaches.entries()) {
        let sql = database('coach').where({
            coach_sequence_id: coachSequenceId,
            uic: coach.uic,
            category: coach.category,
            class: coach.class,
            type: coach.type
        })
        if (trainVehicleId) {
            sql = sql.andWhere((builder) => {
                builder.where({ index: coachIndex }).orWhere({ index: coaches.length - coachIndex - 1 })
            })
        }
        const databaseCoach = await sql.first()
        if (!databaseCoach) return false
    }
    return true
}

const createCoaches = async (trainVehicleId: number | null, coaches: { uic: string, category: string, class: number, type: string }[]) => {
    let coachSequenceId = null
    if (trainVehicleId) {
        const coachSequence = await database('coach_sequence').insert({ train_vehicle_id: trainVehicleId })
        coachSequenceId = coachSequence[0]
    }
    for (const [coachIndex, coach] of coaches.entries()) {
        debug(`Create coach ${coach.uic} in sequence ${coachSequenceId}.`)
        await database('coach').insert({
            coach_sequence_id: coachSequenceId,
            index: trainVehicleId ? coachIndex : null,
            uic: coach.uic,
            category: coach.category,
            class: coach.class,
            type: coach.type
        })
    }
}

const createTrainTripVehicle = async (trainId: number, groupIndex: number, trainVehicleId: number, origin: number | null, destination: number | null) => {
    const oldTrainTripVehicle = await database('train_trip_vehicle').where({ train_trip_id: trainId, group_index: groupIndex }).select(['id', 'train_vehicle_id', 'timestamp', 'origin', 'destination']).first()
    if (oldTrainTripVehicle && oldTrainTripVehicle.train_vehicle_id != trainVehicleId) {
        debug(`Train vehicle changed from ${oldTrainTripVehicle.train_vehicle_id}.`)
        await database('train_trip_vehicle').where({ id: oldTrainTripVehicle.id }).delete()
        await database('train_trip_vehicle_change').insert({ train_trip_id: trainId, train_vehicle_id: oldTrainTripVehicle.train_vehicle_id, group_index: groupIndex, original_timestamp: oldTrainTripVehicle.timestamp, origin, destination })
    } else if (oldTrainTripVehicle && (oldTrainTripVehicle.origin != origin || oldTrainTripVehicle.destination != destination)) {
        debug(`Origin or destination on train_trip_vehicle ${oldTrainTripVehicle.id} changed. Updating.`)
        await database('train_trip_vehicle').where({ id: oldTrainTripVehicle.id }).update({
            origin,
            destination
        })
        return
    } else if (oldTrainTripVehicle)
        return
    await database('train_trip_vehicle').insert({
        train_trip_id: trainId,
        group_index: groupIndex,
        train_vehicle_id: trainVehicleId,
        origin,
        destination
    })
}

export const fetch_coach_sequence = rabbitAsyncHandler(async (msg: FetchCoachSequence) => {
    debug(`Starting to fetch coach sequence for ${msg.trainType}${msg.trainNumber} (ID ${msg.trainId})`)
    const coachSequence = await getCoachSequence(msg.trainNumber, msg.evaDeparture, msg.evaNumber)
    if (!coachSequence) return

    const vehicleGroups = coachSequence.sequence.groups.filter(e => +e.number == msg.trainNumber)
    
    for (const [originalGroupIndex, coaches] of vehicleGroups.entries()) {
        if (+coaches.number != msg.trainNumber || vehicleGroups === null || coaches.coaches === null) continue
        const groupIndex = coachSequence.direction ? originalGroupIndex : vehicleGroups.length -originalGroupIndex - 1
        if (coaches.name.includes('planned') || (!coaches.baureihe && msg.trainType !== 'IC')) {
            debug(`${msg.trainType}${msg.trainNumber}[${groupIndex}]: Vehicle is planned because coaches name is ${coaches.name}.`)
            continue
        }
        const IC_1 = ((coaches.name.includes('regrouped') || coaches.name.includes('RP')) && msg.trainType == 'IC')
        if (!(coaches.name.includes('ICE') || coaches.name.includes('ICK') || coaches.name.includes('ICD') || IC_1) || coaches.name.length < 3) {
            debug(`Train ${msg.trainId}[${groupIndex}] (${msg.trainType}) seems to be a non fetchable train.`)
            continue
        }
        let trainVehicleId: number | null = null
        if (!IC_1) {
            const trainType = coaches.name.slice(0,3).toUpperCase()
            const trainVehicleNumber = +coaches.name.slice(3)
            if (!trainVehicleNumber || !trainType) {
                debug(`Train ${msg.trainId}[${groupIndex}] (${msg.trainType}) seems to be a train without product group.`)
                continue
            }
            trainVehicleId = await getTrainVehicle(
                trainVehicleNumber,
                coaches.trainName,
                trainType,
                coaches.baureihe ? {
                    building_series: coaches.baureihe.baureihe ? +coaches.baureihe.baureihe : null,
                    building_series_name: coaches.baureihe.name
                } : null
            )
        }
        if (!(await checkCoachIntegrity(trainVehicleId, coaches.coaches))) {
            debug(`No coach integrity. Creating coaches.`)
            await createCoaches(trainVehicleId, coaches.coaches)
            await database('train_trip_coaches_identification').where({ train_trip_id: msg.trainId }).delete()
            for (const coach of coaches.coaches) {
                if (coach.uic)
                debug(`Created coach_identification for ${coach.uic} on identification_number ${coach.identificationNumber}.`)
                    await database.raw('INSERT INTO train_trip_coaches_identification (train_trip_id, coach_id, identification_number) SELECT ?, coach.id, ? FROM coach WHERE uic = ?', [msg.trainId, coach.identificationNumber || null, coach.uic])
            }
        }
        const originStation = coaches.originName ? await getEvaByStation(coaches.originName) : null
        const origin = originStation ? +originStation.evaNumber : null
        const destinationStation = coaches.destinationName ? await getEvaByStation(coaches.destinationName) : null
        const destination = destinationStation ? +destinationStation.evaNumber : null
        if (trainVehicleId) {
            await createTrainTripVehicle(msg.trainId, groupIndex, trainVehicleId, origin, destination)
        }
    }
    await database('train_trip').where({ id: msg.trainId }).update({ coach_sequence_update_expire: toSQLTimestamp(DateTime.now().plus({ hours: 1 })) })
}) 