// js/state.js
import { saveTripsToStorage, loadTripsFromStorage } from './storage.js';
import { generateId } from './utils.js';

let trips = [];
let currentTripId = null;
let editingItemId = { transport: null, itinerary: null, budget: null, packing: null };
let confirmActionCallback = null; // Per modal conferma

export const initializeState = () => {
    trips = loadTripsFromStorage();
};

export const getTrips = () => [...trips]; // Restituisce una copia per evitare modifiche esterne dirette
export const getCurrentTrip = () => trips.find(trip => trip && trip.id === currentTripId);
export const getCurrentTripId = () => currentTripId;
export const getEditingItemId = (type) => editingItemId[type];

export const setCurrentTripId = (id) => {
    currentTripId = id;
};

export const setEditingItemId = (type, id) => {
    editingItemId[type] = id;
};

export const resetEditingState = (formType) => {
    if(editingItemId.hasOwnProperty(formType)) {
        editingItemId[formType] = null;
        // La logica di reset UI è in ui.js o main.js
    }
};

export const resetAllEditingStates = () => {
    editingItemId = { transport: null, itinerary: null, budget: null, packing: null };
     // La logica di reset UI è in ui.js o main.js
};


export const addTrip = (tripData) => {
    const newTrip = {
        id: generateId('trip'),
        name: tripData.name || 'Nuovo Viaggio',
        originCity: tripData.originCity || '',
        destination: tripData.destination || '',
        startDate: tripData.startDate || '',
        endDate: tripData.endDate || '',
        notes: tripData.notes || '',
        transportations: [],
        itinerary: [],
        budget: { items: [], estimatedTotal: 0, actualTotal: 0 },
        packingList: []
    };
    trips.push(newTrip);
    saveTripsToStorage(trips);
    return newTrip; // Restituisce il viaggio creato
};

export const deleteTrip = (id) => {
    const initialLength = trips.length;
    trips = trips.filter(trip => trip.id !== id);
    if (trips.length < initialLength) {
        saveTripsToStorage(trips);
        if (currentTripId === id) {
            currentTripId = null; // Deseleziona se era quello corrente
        }
        return true; // Eliminato con successo
    }
    return false; // Non trovato
};

export const updateTripInfo = (id, data) => {
    const tripIndex = trips.findIndex(t => t && t.id === id);
    if (tripIndex > -1) {
        trips[tripIndex] = { ...trips[tripIndex], ...data };
        saveTripsToStorage(trips);
        return trips[tripIndex];
    }
    return null;
};

// Funzioni per manipolare sotto-liste
const findTripAndList = (tripId, listType) => {
    const trip = trips.find(t => t && t.id === tripId);
    if (!trip) return { trip: null, list: null };
    let list;
    switch (listType) {
        case 'transport': list = trip.transportations; break;
        case 'itinerary': list = trip.itinerary; break;
        case 'budget': list = trip.budget.items; break; // Prende .items
        case 'packing': list = trip.packingList; break;
        default: return { trip: trip, list: null };
    }
    // Assicura che la lista sia un array
    if (!Array.isArray(list)) {
        console.warn(`Lista ${listType} non è array nel viaggio ${tripId}, inizializzo.`);
        if (listType === 'budget') trip.budget.items = []; else trip[listType + 's'] = []; // Es: trip.transportations = []
        list = (listType === 'budget') ? trip.budget.items : trip[listType + 's'];
    }
    return { trip, list };
};

export const addTripItem = (tripId, listType, itemData) => {
    const { trip, list } = findTripAndList(tripId, listType);
    if (!trip || !list) return false;
    itemData.id = generateId(listType);
    if (listType === 'packing') itemData.packed = false;
    list.push(itemData);
    saveTripsToStorage(trips);
    return true;
};

export const updateTripItem = (tripId, listType, itemId, itemData) => {
    const { trip, list } = findTripAndList(tripId, listType);
    if (!trip || !list) return false;
    const itemIndex = list.findIndex(i => i && i.id === itemId);
    if (itemIndex > -1) {
        list[itemIndex] = { ...list[itemIndex], ...itemData };
        saveTripsToStorage(trips);
        return true;
    }
    return false;
};

export const deleteTripItem = (tripId, listType, itemId) => {
    const { trip, list } = findTripAndList(tripId, listType);
    if (!trip || !list) return false;
    const initialLength = list.length;
    const newList = list.filter(i => !i || i.id !== itemId); // Filtra tenendo conto di item null/undefined
    if (newList.length < initialLength) {
         if (listType === 'budget') trip.budget.items = newList;
         else if(listType === 'transport') trip.transportations = newList;
         else if(listType === 'itinerary') trip.itinerary = newList;
         else if(listType === 'packing') trip.packingList = newList;
        saveTripsToStorage(trips);
        return true;
    }
    return false;
};

export const togglePackedItem = (tripId, itemId, isPacked) => {
    const { trip, list } = findTripAndList(tripId, 'packing');
    if (!trip || !list) return false;
    const itemIndex = list.findIndex(i => i && i.id === itemId);
    if (itemIndex > -1) {
        list[itemIndex].packed = isPacked;
        saveTripsToStorage(trips);
        return true;
    }
    return false;
};

// --- Gestione Callback Conferma ---
export const setConfirmCallback = (callback) => { confirmActionCallback = callback; };
export const executeConfirmCallback = () => { if(typeof confirmActionCallback === 'function') confirmActionCallback(); confirmActionCallback = null;};
export const getConfirmCallback = () => confirmActionCallback;
