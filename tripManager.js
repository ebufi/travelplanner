// js/tripManager.js
import * as state from './state.js';
import * as ui from './ui.js';
import { showToast } from './utils.js';

export const handleNewTrip = () => {
    ui.openNewTripModalUI();
};

export const handleCreateTripConfirm = () => {
    const newTripNameInput = document.getElementById('new-trip-name-input'); // Necessario qui
    const tripName = newTripNameInput.value.trim();
    if (tripName) {
        const newTrip = state.addTrip({ name: tripName }); // Usa funzione stato
        ui.closeNewTripModalUI();
        state.setCurrentTripId(newTrip.id);
        ui.renderTripList(); // Aggiorna lista
        ui.renderTripDetails(); // Mostra dettagli nuovo viaggio
        showToast(`Viaggio "${tripName}" creato!`, 'success');
    } else {
        ui.showNewTripModalError('Il nome non può essere vuoto.');
    }
};

export const handleSaveTripInfo = (e) => {
    e.preventDefault();
    const currentId = state.getCurrentTripId();
    if (!currentId) return;

    // Leggi valori dal DOM (alternativa: passarli come argomenti)
    const name = document.getElementById('trip-name').value.trim() || 'Viaggio S.N.';
    const originCity = document.getElementById('trip-origin-city').value.trim();
    const destination = document.getElementById('trip-destination').value.trim();
    const startDate = document.getElementById('trip-start-date').value;
    const endDate = document.getElementById('trip-end-date').value;
    const notes = document.getElementById('trip-notes').value.trim();

    if (startDate && endDate && startDate > endDate) {
        showToast('Data fine non valida.', 'error');
        return;
    }

    const updatedTrip = state.updateTripInfo(currentId, { name, originCity, destination, startDate, endDate, notes });

    if (updatedTrip) {
        ui.updateTripInfoUI(updatedTrip); // Aggiorna solo i campi info UI
        ui.renderTripList(); // Aggiorna la lista per nome/date
        showToast('Informazioni salvate!', 'success');
    } else {
         showToast('Errore durante il salvataggio.', 'error');
    }
};

export const handleDeleteTrip = (id) => {
    const trip = state.getTrips().find(t => t.id === id); // Usa getTrips()
    if (!trip) return;

    ui.showConfirmationModalUI(
        'Conferma Eliminazione Viaggio',
        `Eliminare "${trip.name || 'S.N.'}"? L'azione è irreversibile.`,
        () => { // onConfirm callback
            const deleted = state.deleteTrip(id);
            if (deleted) {
                 // Se il viaggio eliminato era quello corrente, deseleziona nell'UI
                 if(state.getCurrentTripId() === null) {
                     ui.renderTripDetails(); // Questo nasconderà l'area dettagli
                 }
                 ui.renderTripList();
                 showToast('Viaggio eliminato.', 'info');
            } else {
                 showToast('Errore durante l\'eliminazione.', 'error');
            }
        }
    );
};

export const handleSelectTrip = (id) => {
    const currentId = state.getCurrentTripId();
    // Evita re-render se si clicca sullo stesso viaggio già selezionato
    if (id === currentId && document.getElementById('trip-details-area')?.style.display !== 'none') return;

    state.setCurrentTripId(id);
    ui.renderTripList(); // Ri-renderizza lista per stile 'active'
    ui.renderTripDetails(); // Mostra i dettagli del nuovo viaggio
    ui.resetFormUI('transport'); // Resetta tutti i form item
    ui.resetFormUI('itinerary');
    ui.resetFormUI('budget');
    ui.resetFormUI('packing');
    ui.switchTab('info-tab'); // Vai sempre al tab info
};

export const handleDeselectTrip = () => {
    state.setCurrentTripId(null);
    ui.renderTripList(); // Aggiorna lista senza selezione attiva
    ui.renderTripDetails(); // Nasconde area dettagli
};
