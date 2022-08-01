import { MarudorDeparture } from "./fetcher/marudor.js"

type StaticConfig = {
    IRIS_LOOKAHEAD: number,
    FETCHABLE_TRAIN_TYPES: Array<string>,
    TRAIN_TYPE_FIND_NUMBER_REPLACEMENT: { [key: string]: (s: string) => string },
    AUTO_FETCH_EVA_NUMBERS: Array<number>
}
const staticConfig: StaticConfig = {
    IRIS_LOOKAHEAD: 60 * 24,
    FETCHABLE_TRAIN_TYPES: ['ICE', 'IC'],
    TRAIN_TYPE_FIND_NUMBER_REPLACEMENT: {
        'ICE': (s) => s.replace('ICE', ''),
        'IC': (s) => s.includes('ICK') ? s.replace('ICK', '') : 'NaN'
    },

    AUTO_FETCH_EVA_NUMBERS: [
        8002549, // Hamburg
        8000050, // Bremen
        8000152, // Hannover
        8000036, // Bielefeld
        8000149, // Hamm
        8000098, // Essen
        8000207, // Köln
        8000105, // Frankfurt Hbf
        8070003, // Frankfurt Flughafen
        8000244, // Mannheim
        8000191, // Karlsruhe
        8000096, // Stuttgart
        8000261, // München
        8010101, // Erfurt
        8003200, // Kassel-Wilhelmshöhe
        8010159, // Halle
        8010205, // Leipzig
        8010085, // Dresden
        8011160, // Berlin
    ]
}

export default staticConfig