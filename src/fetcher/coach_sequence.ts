import { DateTime } from 'luxon'
import { Cache } from '../cache.js'
import fetch from 'node-fetch'
import { BahnExpertCoachSequenceType } from './bahn_expert.js'

const coachSequenceCache= new Cache('coach_sequence', 60 * 20)

type CoachSequence = {
    istformation: {
        allFahrzeuggruppe: [{
            allFahrzeug: [{
                fahrzeugnummer: string,
                fahrzeugtyp: string,
                kategorie: string,
                orientierung: string,
                wagenordnungsnummer: string,
                positionamhalt: {
                    startprozent: string,
                    endeprozent: string
                }
            }],
            fahrzeuggruppebezeichnung: string,
            verkerlichezugnummer: string,
            startbetriebsstellename?: string,
            zielbetriebsstellename?: string
        }]
        istplaninformation: boolean,
        planstarttag: string
        serviceid: string,
        zuggattung: string,
        zugnummer: string
    },
    departureID: string,
    journeyID: string
}

type CoachSequenceResponse = {
    data: CoachSequence,
}

const translateCoachSequenceToBahnExpert  = (input: CoachSequence): BahnExpertCoachSequenceType => {
    return {
        sequence: { groups: input.istformation.allFahrzeuggruppe.map(fahrzeug => ({
            name: fahrzeug.fahrzeuggruppebezeichnung,
            originName: fahrzeug.startbetriebsstellename,
            destinationName: fahrzeug.zielbetriebsstellename,
            trainName: null,
            number: fahrzeug.verkerlichezugnummer,
            baureihe: {
                name: "-",
                baureihe: "-",
                identifier: "-"
            },
            coaches: fahrzeug.allFahrzeug.map(coach => ({
                class: 0,
                vehicleCategory: coach.kategorie,
                uic: coach.fahrzeugnummer,
                type: coach.fahrzeugtyp,
                identificationNumber: coach.wagenordnungsnummer
            }))
        }))},
        direction: parseFloat(input.istformation.allFahrzeuggruppe.slice(-1)[0].allFahrzeug.slice(-1)[0].positionamhalt.startprozent) > parseFloat(input.istformation.allFahrzeuggruppe[0].allFahrzeug[0].positionamhalt.startprozent)
    }
}

export const getCoachSequence = async (trainType: string, trainNumber: number, eva: number, date: DateTime, retry: boolean=true): Promise<BahnExpertCoachSequenceType | null> => {
    const path = `https://www.apps-bahn.de/wgr/wr/80/${date.toFormat('yyyyLLdd')}/${trainType}/${trainNumber}/${eva}/${date.toFormat('yyyyLLddHHmm')}`
    console.log(path)
    const cached = await coachSequenceCache.get(path)
    if (cached) {
        return cached
    }
    const response = await fetch(path)
    if (response.status == 400) {
        return null
    }
    if (response.status != 200) {
        throw new Error(`Response of coach sequence status code is ${response.status}`)
    }

    if (response.headers.get('content-type')!.startsWith('text/html')) {
        // rate limit reached
        if (retry) {
            console.log('rate limit reached uwu')
            return await new Promise((resolve, reject) => setTimeout(() => getCoachSequence(trainType, trainNumber, eva, date, false).then((r: (BahnExpertCoachSequenceType | null)) => resolve(r)).catch((e: any) => reject(e)), 30 * 1000))
        } else {
            throw new Error(`Rate limit of coach sequence api reached and retry parameter is disabled`)
        }
    }
    const data = translateCoachSequenceToBahnExpert((await response.json() as CoachSequenceResponse)["data"])
    await coachSequenceCache.set(path, data)
    return data
}