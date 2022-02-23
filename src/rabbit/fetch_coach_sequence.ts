import database from '../database.js'
import { getCoachSequence } from '../fetcher/marudor.js'
import rabbitAsyncHandler from '../rabbitAsyncHandler.js'

type FetchCoachSequence = { trainId: number, trainNumber: number, trainType: string, initialDeparture: string, evaDeparture: string, evaNumber: number }


const getTrainVehicle = async (train_vehicle_number: number, train_vehicle_name: string, train_type: string, building_series: number): Promise<number> => {
    const trainVehicle = await database('train_vehicle').where({ train_vehicle_number }).select('*').first()
    if (!trainVehicle) {
        return (await database('train_vehicle').insert({
            train_vehicle_number,
            train_vehicle_name,
            train_type,
            building_series
        }))[0]
    }
    if (trainVehicle.train_vehicle_name != train_vehicle_name) {
        await database('train_vehicle').where({ id: trainVehicle.id }).update({ train_vehicle_name })
    }
    return trainVehicle.id
}

const checkCoachIntegrity = async (trainVehicleId: number, coaches: { uic: string, category: string, class: number, type: string }[]): Promise<boolean> => {
    const coachSequence = await database('coach_sequence').where({ train_vehicle_id: trainVehicleId }).select('id')
    if (coachSequence.length === 0) return false
    const coachSequenceId = coachSequence[0].id
    for (const [coachIndex, coach] of coaches.entries()) {
        const databaseCoach = await database('coach').where({
            coach_sequence_id: coachSequenceId,
            index: coachIndex,
            uic: coach.uic,
            category: coach.category,
            class: coach.class,
            type: coach.type
        }).first()
        if (!databaseCoach) return false
    }
    return true
}

const createCoaches = async (trainVehicleId: number, coaches: { uic: string, category: string, class: number, type: string }[]) => {
    const coachSequence = await database('coach_sequence').insert({ train_vehicle_id: trainVehicleId })
    const coachSequenceId = coachSequence[0]
    for (const [coachIndex, coach] of coaches.entries()) {
        await database('coach').insert({
            coach_sequence_id: coachSequenceId,
            index: coachIndex,
            uic: coach.uic,
            category: coach.category,
            class: coach.class,
            type: coach.type
        })
    }
}

const createTrainTripVehicle = async (trainId: number, groupIndex: number, trainVehicleId: number) => {
    const oldTrainTripVehicle = await database('train_trip_vehicle').where({ train_trip_id: trainId, group_index: groupIndex }).select(['id', 'train_vehicle_id', 'timestamp']).first()
    if (oldTrainTripVehicle && oldTrainTripVehicle.train_vehicle_id != trainVehicleId) {
        await database('train_trip_vehicle').where({ id: oldTrainTripVehicle.id }).delete()
        await database('train_trip_vehicle_change').insert({ train_trip_id: trainId, train_vehicle_id: oldTrainTripVehicle.train_vehicle_id, group_index: groupIndex, original_timestamp: oldTrainTripVehicle.timestamp })
    }
    await database('train_trip_vehicle').insert({
        train_trip_id: trainId,
        group_index: groupIndex,
        train_vehicle_id: trainVehicleId
    })
}

export const fetch_coach_sequence = rabbitAsyncHandler(async (msg: FetchCoachSequence) => {
    const coachSequence = await getCoachSequence(msg.trainNumber, msg.evaDeparture, msg.evaNumber)
    if (!coachSequence) {
        return
    }
    
    for (const [originalGroupIndex, coaches] of coachSequence.sequence.groups.entries()) {
        if (coaches.name.includes('planned') || !coaches.baureihe) {
            continue
        }
        const groupIndex = coachSequence.direction ? originalGroupIndex : -originalGroupIndex + coachSequence.sequence.groups.length - 1
        const trainVehicleNumber = +coaches.name.replace(msg.trainType.toUpperCase(), '')
        const trainVehicleId = await getTrainVehicle(trainVehicleNumber, coaches.trainName, msg.trainType, +coaches.baureihe.baureihe)
        if (!(await checkCoachIntegrity(trainVehicleId, coaches.coaches))) {
            await createCoaches(trainVehicleId, coaches.coaches)
            await database('train_trip_coaches_identification').where({ train_trip_id: msg.trainId }).delete()
            for (const coach of coaches.coaches) {
                if (coach.uic)
                    await database.raw('INSERT INTO train_trip_coaches_identification (train_trip_id, coach_id, identification_number) SELECT ?, coach.id, ? FROM coach WHERE uic = ?', [msg.trainId, coach.identificationNumber || null, coach.uic])
            }
        }
        await createTrainTripVehicle(msg.trainId, groupIndex, trainVehicleId)
    }
})