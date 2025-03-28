// js/main.js
import { initializeState, setConfirmCallback, executeConfirmCallback, getCurrentTripId } from './state.js';
import * as ui from './ui.js';
import * as tripManager from './tripManager.js';
import * as itemManager from './itemManager.js';
import * as features from './features.js';

// ==========================================================================
// == INIZIALIZZAZIONE E EVENT LISTENER PRINCIPALI ==
// ==========================================================================
const init = () => {
    initializeState(); // Carica dati da localStorage nello stato
    ui.renderTripList();
    tripManager.handleDeselectTrip(); // Inizia con welcome message

    // --- Listener Globali ---
    const newTripBtn = document.getElementById('new-trip-btn');
    const tripInfoForm = document.getElementById('trip-info-form');
    const deleteTripBtn = document.getElementById('delete-trip-btn');
    const downloadTextBtn = document.getElementById('download-text-btn');
    const downloadExcelBtn = document.getElementById('download-excel-btn');
    const tabsContainer = document.querySelector('.tabs');
    const addTransportItemForm = document.getElementById('add-transport-item-form');
    const addItineraryItemForm = document.getElementById('add-itinerary-item-form');
    const addBudgetItemForm = document.getElementById('add-budget-item-form');
    const addPackingItemForm = document.getElementById('add-packing-item-form');
    const transportCancelEditBtn = document.getElementById('transport-cancel-edit-btn');
    const itineraryCancelEditBtn = document.getElementById('itinerary-cancel-edit-btn');
    const budgetCancelEditBtn = document.getElementById('budget-cancel-edit-btn');
    const packingCancelEditBtn = document.getElementById('packing-cancel-edit-btn');
    const tripDetailsAreaDiv = document.getElementById('trip-details-area');
    const predefinedChecklistsContainer = document.querySelector('.predefined-checklists');
    const newTripModal = document.getElementById('new-trip-modal');
    const createTripConfirmBtn = document.getElementById('create-trip-confirm-btn');
    const newTripNameInput = document.getElementById('new-trip-name-input');
    const confirmationModal = document.getElementById('confirmation-modal');
    const confirmationModalConfirmBtn = document.getElementById('confirmation-modal-confirm-btn');
    const addTransportTotalToBudgetBtn = document.getElementById('add-transport-total-to-budget-btn');
    const searchSkyscannerBtn = document.getElementById('search-skyscanner-btn');
    const searchTrainlineBtn = document.getElementById('search-trainline-btn');
    const transportTypeSelect = document.getElementById('transport-type');

    if (newTripBtn) newTripBtn.addEventListener('click', tripManager.handleNewTrip);
    if (tripInfoForm) tripInfoForm.addEventListener('submit', tripManager.handleSaveTripInfo);
    if (deleteTripBtn) deleteTripBtn.addEventListener('click', () => { const id = getCurrentTripId(); if(id) tripManager.handleDeleteTrip(id); });
    if (downloadTextBtn) downloadTextBtn.addEventListener('click', features.handleDownloadText); // Spostato in features? O tenerlo qui? Mettiamo in features.
    if (downloadExcelBtn) downloadExcelBtn.addEventListener('click', features.handleDownloadExcel); // Spostato in features? Mettiamo in features.
    if (tabsContainer) tabsContainer.addEventListener('click', (e) => { const tl = e.target.closest('.tab-link'); if (tl?.dataset.tab) ui.switchTab(tl.dataset.tab); });

    // Listener Submit Forms
    if (addTransportItemForm) addTransportItemForm.addEventListener('submit', (e) => itemManager.handleItemFormSubmit(e, 'transport'));
    if (addItineraryItemForm) addItineraryItemForm.addEventListener('submit', (e) => itemManager.handleItemFormSubmit(e, 'itinerary'));
    if (addBudgetItemForm) addBudgetItemForm.addEventListener('submit', (e) => itemManager.handleItemFormSubmit(e, 'budget'));
    if (addPackingItemForm) addPackingItemForm.addEventListener('submit', (e) => itemManager.handleItemFormSubmit(e, 'packing'));

    // Listener Annulla Modifica
    if (transportCancelEditBtn) transportCancelEditBtn.addEventListener('click', () => ui.resetFormUI('transport'));
    if (itineraryCancelEditBtn) itineraryCancelEditBtn.addEventListener('click', () => ui.resetFormUI('itinerary'));
    if (budgetCancelEditBtn) budgetCancelEditBtn.addEventListener('click', () => ui.resetFormUI('budget'));
    if (packingCancelEditBtn) packingCancelEditBtn.addEventListener('click', () => ui.resetFormUI('packing'));

     // Listener Delegati per Azioni Liste
     if(tripDetailsAreaDiv) {
        tripDetailsAreaDiv.addEventListener('click', (e) => {
            const editBtn = e.target.closest('.btn-icon.edit');
            const deleteBtn = e.target.closest('.btn-icon.delete');
            const packingCheckbox = e.target.closest('.packing-checkbox');

            if (editBtn) { const itemId = editBtn.dataset.itemId; if(!itemId) return;
                if (editBtn.classList.contains('transport-edit-btn')) itemManager.startEditItem('transport', itemId);
                else if (editBtn.classList.contains('itinerary-edit-btn')) itemManager.startEditItem('itinerary', itemId);
                else if (editBtn.classList.contains('budget-edit-btn')) itemManager.startEditItem('budget', itemId);
                else if (editBtn.classList.contains('packing-edit-btn')) itemManager.startEditItem('packing', itemId);
            } else if (deleteBtn) { const itemId = deleteBtn.dataset.itemId; if(!itemId) return;
                if (deleteBtn.classList.contains('transport-delete-btn')) itemManager.handleDeleteItem('transport', itemId);
                else if (deleteBtn.classList.contains('itinerary-delete-btn')) itemManager.handleDeleteItem('itinerary', itemId);
                else if (deleteBtn.classList.contains('budget-delete-btn')) itemManager.handleDeleteItem('budget', itemId);
                else if (deleteBtn.classList.contains('packing-delete-btn')) itemManager.handleDeleteItem('packing', itemId);
            } else if (packingCheckbox) { const itemId = packingCheckbox.dataset.itemId; if(itemId) itemManager.handleTogglePacked(itemId, packingCheckbox.checked); packingCheckbox.closest('li').classList.toggle('packed', packingCheckbox.checked); }
        });
     }

     // Listener Import Checklist
     if (predefinedChecklistsContainer) { predefinedChecklistsContainer.addEventListener('click', (e) => { const btn = e.target.closest('button[data-checklist]'); if (btn?.dataset.checklist) features.handleImportPackingList(btn.dataset.checklist); }); }

     // Listener Modals
     if (newTripModal) { createTripConfirmBtn?.addEventListener('click', tripManager.handleCreateTripConfirm); newTripModal.querySelectorAll('.modal-close').forEach(btn => btn.addEventListener('click', ui.closeNewTripModalUI)); newTripNameInput?.addEventListener('keypress', (e) => { if(e.key === 'Enter') tripManager.handleCreateTripConfirm(); }); newTripModal.addEventListener('click', (e) => { if (e.target === newTripModal) ui.closeNewTripModalUI(); }); }
     if (confirmationModal) { const confirmBtn = confirmationModal.querySelector('#confirmation-modal-confirm-btn'); const closeBtns = confirmationModal.querySelectorAll('.modal-close'); if(confirmBtn) { const newConfirmBtn = confirmBtn.cloneNode(true); confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn); newConfirmBtn.addEventListener('click', () => { const callback = state.getConfirmCallback(); if(callback) callback(); ui.closeConfirmationModalUI(); }); } closeBtns.forEach(btn => btn.addEventListener('click', ui.closeConfirmationModalUI)); confirmationModal.addEventListener('click', (e) => { if (e.target === confirmationModal) ui.closeConfirmationModalUI(); }); }

     // Listener Calcolo Budget Trasporti
     if (addTransportTotalToBudgetBtn) { addTransportTotalToBudgetBtn.addEventListener('click', features.handleCalculateAndAddTransportCost); }

     // Listener Cerca Voli/Treni
     if (searchSkyscannerBtn) { searchSkyscannerBtn.addEventListener('click', features.handleSearchFlights); }
     if (searchTrainlineBtn) { searchTrainlineBtn.addEventListener('click', features.handleSearchTrains); }

     // Listener per visibilità bottoni Cerca (Volo/Treno)
     if(transportTypeSelect) { transportTypeSelect.addEventListener('change', ui.toggleSearchButtonsVisibility); }

     // Listener per selezione viaggio dalla lista (Delegation su UL)
     if (tripListUl) {
         tripListUl.addEventListener('click', (e) => {
             const targetLi = e.target.closest('li[data-trip-id]');
             const deleteBtn = e.target.closest('.btn-delete-trip');
             if (targetLi && !deleteBtn) { // Se cliccato su li ma non sul bottone delete
                 tripManager.handleSelectTrip(targetLi.dataset.tripId);
             }
         });
     }


    // Registra Service Worker per PWA
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/service-worker.js') // Assicurati che il path sia corretto
                .then(registration => { console.log('Service Worker registrato:', registration.scope); })
                .catch(error => { console.error('Registrazione Service Worker fallita:', error); });
        });
    }

}; // Fine init

// Avvia app
init();

}); // Fine DOMContentLoaded
