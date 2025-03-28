// js/itemManager.js
import * as state from './state.js';
import * as ui from './ui.js';
import { showToast } from './utils.js';

// Funzione per popolare il form quando si clicca modifica
export const startEditItem = (listType, itemId) => {
    const trip = state.getCurrentTrip();
    if (!trip) return;
    let list = [];
    switch(listType) {
        case 'transport': list = trip.transportations; break;
        case 'itinerary': list = trip.itinerary; break;
        case 'budget': list = trip.budget.items; break;
        case 'packing': list = trip.packingList; break;
        default: return;
    }
    const item = list.find(i => i && i.id === itemId);
    if (item) {
        state.resetAllEditingStates(); // Resetta altri stati di modifica
        state.setEditingItemId(listType, itemId); // Imposta lo stato di modifica corrente
        const populated = ui.populateFormForEdit(listType, item); // Chiama la funzione UI per popolare
        if (!populated) {
            state.resetEditingState(listType); // Resetta stato se UI fallisce
        }
    } else {
        console.error(`Item ${itemId} non trovato in ${listType}`);
    }
};

// Funzione chiamata al submit di un form di aggiunta/modifica item
export const handleItemFormSubmit = (e, listType) => {
    e.preventDefault();
    const currentTripId = state.getCurrentTripId();
    if (!currentTripId) return;

    const currentEditId = state.getEditingItemId(listType);
    let itemData = {};
    let isValid = true;

    // Leggi i dati dal form specifico e valida
    try {
        const form = e.target; // Il form che ha generato l'evento
        switch (listType) {
            case 'transport':
                const desc = form.querySelector('#transport-description').value.trim();
                if (!desc) throw new Error("Descrizione richiesta.");
                const costVal = form.querySelector('#transport-cost').value;
                const cost = costVal === '' ? null : parseFloat(costVal);
                 if (cost !== null && (isNaN(cost) || cost < 0)) throw new Error("Costo non valido.");
                itemData = { type: form.querySelector('#transport-type').value, description: desc, departureLoc: form.querySelector('#transport-departure-loc').value.trim() || null, departureDateTime: form.querySelector('#transport-departure-datetime').value || null, arrivalLoc: form.querySelector('#transport-arrival-loc').value.trim() || null, arrivalDateTime: form.querySelector('#transport-arrival-datetime').value || null, bookingRef: form.querySelector('#transport-booking-ref').value.trim() || null, cost: cost, notes: form.querySelector('#transport-notes').value.trim() || null };
                break;
            case 'itinerary':
                 const day = form.querySelector('#itinerary-day').value;
                 const activity = form.querySelector('#itinerary-activity').value.trim();
                 if (!day || !activity) throw new Error("Giorno e attività richiesti.");
                 const trip = state.getCurrentTrip(); // Serve per validazione date
                 if (trip.startDate && trip.endDate && day && (day < trip.startDate || day > trip.endDate)) throw new Error(`Data fuori dal periodo viaggio.`);
                 itemData = { day: day, time: form.querySelector('#itinerary-time').value || null, activity: activity, location: form.querySelector('#itinerary-location').value.trim() || null, notes: form.querySelector('#itinerary-notes').value.trim() || null };
                break;
             case 'budget':
                 const estR = form.querySelector('#budget-estimated').value;
                 const actR = form.querySelector('#budget-actual').value;
                 const est = parseFloat(estR);
                 const act = actR === '' ? null : parseFloat(actR);
                 if (!form.querySelector('#budget-description').value.trim() || isNaN(est) || est < 0) throw new Error("Descrizione/costo stimato non validi.");
                 if (act !== null && isNaN(act)) throw new Error("Costo effettivo non è numero.");
                 if (act !== null && act < 0) throw new Error("Costo effettivo non può essere negativo.");
                 itemData = { category: form.querySelector('#budget-category').value, description: form.querySelector('#budget-description').value.trim(), estimated: est, actual: act };
                break;
            case 'packing':
                const name = form.querySelector('#packing-item-name').value.trim();
                if (!name) throw new Error("Nome oggetto richiesto.");
                itemData = { name: name };
                break;
            default: isValid = false; console.error("Tipo lista non valido:", listType);
        }
    } catch (error) {
        isValid = false; showToast(`Errore: ${error.message}`, 'error');
    }

    if (!isValid) return; // Esce se validazione fallita

    // Aggiorna o Aggiungi nello stato
    let success = false;
    if (currentEditId) {
        success = state.updateTripItem(currentTripId, listType, currentEditId, itemData);
    } else {
        success = state.addTripItem(currentTripId, listType, itemData);
    }

    // Aggiorna UI e resetta stato/form
    if (success) {
        const trip = state.getCurrentTrip();
        if (listType === 'budget') { ui.renderBudget(trip.budget); }
        else if (listType === 'transport') { ui.renderTransportations(trip.transportations); }
        else if (listType === 'itinerary') { ui.renderItinerary(trip.itinerary); }
        else if (listType === 'packing') { ui.renderPackingList(trip.packingList); }
        ui.resetFormUI(listType); // Usa la funzione UI per resettare il form
        showToast(currentEditId ? 'Elemento aggiornato!' : 'Elemento aggiunto!', 'success');
    } else {
         showToast('Errore durante il salvataggio dell\'elemento.', 'error');
    }
};


export const handleDeleteItem = (listType, itemId) => {
    const currentTripId = state.getCurrentTripId();
    if (!currentTripId) return;
    const trip = state.getCurrentTrip();
    if (!trip) return;

    let list = []; let itemName = "voce";
    switch(listType) {
        case 'transport': list = trip.transportations; itemName="trasporto"; break;
        case 'itinerary': list = trip.itinerary; itemName="attività"; break;
        case 'budget': list = trip.budget.items; itemName="spesa"; break;
        case 'packing': list = trip.packingList; itemName="oggetto"; break;
        default: return;
    }
    if (!Array.isArray(list)) return;

    const itemIndex = list.findIndex(item => item && item.id === itemId);
    if (itemIndex > -1) {
        const itemDesc = list[itemIndex].description || list[itemIndex].activity || list[itemIndex].name || `ID: ${itemId}`;
        ui.showConfirmationModalUI( // Usa funzione UI per mostrare modal
            `Conferma Eliminazione ${itemName}`,
            `Eliminare "${itemDesc}"?`,
            () => { // onConfirm
                const deleted = state.deleteTripItem(currentTripId, listType, itemId);
                if (deleted) {
                    const updatedTrip = state.getCurrentTrip(); // Prendi trip aggiornato
                    if (listType === 'budget') { ui.renderBudget(updatedTrip.budget); }
                    else if (listType === 'transport') { ui.renderTransportations(updatedTrip.transportations); }
                    else if (listType === 'itinerary') { ui.renderItinerary(updatedTrip.itinerary); }
                    else if (listType === 'packing') { ui.renderPackingList(updatedTrip.packingList); }
                    if (state.getEditingItemId(listType) === itemId) ui.resetFormUI(listType);
                    showToast(`${itemName.charAt(0).toUpperCase() + itemName.slice(1)} eliminato/a.`, 'info');
                } else {
                    showToast("Errore durante l'eliminazione.", "error");
                }
            }
        );
    }
};

export const handleTogglePacked = (itemId, isPacked) => {
    const currentTripId = state.getCurrentTripId();
    if(!currentTripId) return;
    const success = state.togglePackedItem(currentTripId, itemId, isPacked);
    // UI update è gestito dal listener in main.js
    if(!success) console.warn(`Toggle packed fallito per item ${itemId}`);
};
