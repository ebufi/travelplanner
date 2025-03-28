// js/storage.js
import { STORAGE_KEY } from './config.js';
import { showToast } from './utils.js';

export const saveTripsToStorage = (tripsArray) => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(tripsArray));
    } catch (e) {
        console.error("Errore salvataggio su localStorage:", e);
        showToast("Errore: impossibile salvare i dati.", "error");
    }
};

export const loadTripsFromStorage = () => {
    const stored = localStorage.getItem(STORAGE_KEY);
    let trips = [];
    try {
        trips = stored ? JSON.parse(stored) : [];
        if (!Array.isArray(trips)) trips = [];
    } catch (e) {
        console.error("Errore parsing localStorage:", e);
        trips = [];
    }
    // Assicura struttura dati base per ogni viaggio
    trips.forEach(trip => {
        if (!trip || typeof trip !== 'object') return;
        trip.originCity = trip.originCity || '';
        trip.destination = trip.destination || '';
        trip.transportations = Array.isArray(trip.transportations) ? trip.transportations : [];
        trip.itinerary = Array.isArray(trip.itinerary) ? trip.itinerary : [];
        trip.budget = (trip.budget && typeof trip.budget === 'object') ? trip.budget : { items: [], estimatedTotal: 0, actualTotal: 0 };
        trip.budget.items = Array.isArray(trip.budget.items) ? trip.budget.items : [];
        trip.packingList = Array.isArray(trip.packingList) ? trip.packingList : [];
    });
    return trips;
};
