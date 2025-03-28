// js/ui.js
import { getTrips, getCurrentTrip, getCurrentTripId } from './state.js';
import { formatCurrency, formatDate, formatDateTime, getTransportIcon } from './utils.js';

// Riferimenti DOM specifici per UI
const tripListUl = document.getElementById('trip-list');
const welcomeMessageDiv = document.getElementById('welcome-message');
const tripDetailsAreaDiv = document.getElementById('trip-details-area');
const noTripsMessage = document.getElementById('no-trips-message');
const tripTitleH2 = document.getElementById('trip-title');
const downloadTextBtn = document.getElementById('download-text-btn');
const downloadExcelBtn = document.getElementById('download-excel-btn');
const deleteTripBtn = document.getElementById('delete-trip-btn');
const tabsContainer = document.querySelector('.tabs');
const tripInfoForm = document.getElementById('trip-info-form');
const tripNameInput = document.getElementById('trip-name');
const tripOriginCityInput = document.getElementById('trip-origin-city');
const tripDestinationInput = document.getElementById('trip-destination');
// const tripDestinationDisplayInput = document.getElementById('trip-destination-display'); // Rimosso
const tripStartDateInput = document.getElementById('trip-start-date');
const tripEndDateInput = document.getElementById('trip-end-date');
const tripNotesTextarea = document.getElementById('trip-notes');
const transportListUl = document.getElementById('transport-list');
const noTransportItemsP = document.getElementById('no-transport-items');
const itineraryListUl = document.getElementById('itinerary-list');
const noItineraryItemsP = document.getElementById('no-itinerary-items');
const budgetListUl = document.getElementById('budget-list');
const budgetTotalEstimatedStrong = document.getElementById('budget-total-estimated');
const budgetTotalActualStrong = document.getElementById('budget-total-actual');
const budgetDifferenceStrong = document.getElementById('budget-difference');
const noBudgetItemsP = document.getElementById('no-budget-items');
const packingListUl = document.getElementById('packing-list');
const noPackingItemsP = document.getElementById('no-packing-items');
const newTripModal = document.getElementById('new-trip-modal');
const confirmationModal = document.getElementById('confirmation-modal');
// Riferimenti agli input dei form aggiunta/modifica
const addTransportItemForm = document.getElementById('add-transport-item-form');
const addItineraryItemForm = document.getElementById('add-itinerary-item-form');
const addBudgetItemForm = document.getElementById('add-budget-item-form');
const addPackingItemForm = document.getElementById('add-packing-item-form');
// Bottoni ricerca esterni
const searchSkyscannerBtn = document.getElementById('search-skyscanner-btn');
const searchTrainlineBtn = document.getElementById('search-trainline-btn');
const transportTypeSelect = document.getElementById('transport-type'); // Necessario per toggle


export const renderTripList = () => {
    const trips = getTrips();
    const currentId = getCurrentTripId();
    if (!tripListUl) return;
    tripListUl.innerHTML = '';
    trips.sort((a, b) => (a?.name || '').localeCompare(b?.name || ''));
    trips.forEach(trip => {
        if (!trip || !trip.id) return;
        const li = document.createElement('li');
        li.dataset.tripId = trip.id;
        li.innerHTML = `<span>${trip.name || 'Senza Nome'} (${formatDate(trip.startDate)} - ${formatDate(trip.endDate)})</span>
                        <button class="btn-delete-trip" data-trip-id="${trip.id}" title="Elimina"><i class="fas fa-trash-alt"></i></button>`;
        if (trip.id === currentId) li.classList.add('active');
        // Gli event listener verranno aggiunti in main.js usando delegation
        tripListUl.appendChild(li);
    });
    if(noTripsMessage) noTripsMessage.style.display = trips.length === 0 ? 'block' : 'none';
};

export const renderTripDetails = () => {
    const trip = getCurrentTrip();
    if (!trip) { // Se nessun viaggio è selezionato o trovato
        if(tripDetailsAreaDiv) tripDetailsAreaDiv.style.display = 'none';
        if(welcomeMessageDiv) welcomeMessageDiv.style.display = 'block';
        if(downloadTextBtn) downloadTextBtn.disabled = true;
        if(downloadExcelBtn) downloadExcelBtn.disabled = true;
        if(deleteTripBtn) deleteTripBtn.disabled = true;
        return;
    }

    // Popola Info Tab
    if (tripTitleH2) tripTitleH2.textContent = trip.name || 'Senza Nome';
    if (editTripIdInput) editTripIdInput.value = trip.id; // Potrebbe non servire se non si modifica l'ID
    if (tripNameInput) tripNameInput.value = trip.name || '';
    if (tripOriginCityInput) tripOriginCityInput.value = trip.originCity || '';
    if (tripDestinationInput) tripDestinationInput.value = trip.destination || '';
    // Rimosso tripDestinationDisplayInput
    if (tripStartDateInput) tripStartDateInput.value = trip.startDate || '';
    if (tripEndDateInput) tripEndDateInput.value = trip.endDate || '';
    if (tripNotesTextarea) tripNotesTextarea.value = trip.notes || '';

    // Render liste
    renderTransportations(trip.transportations);
    renderItinerary(trip.itinerary);
    renderBudget(trip.budget);
    renderPackingList(trip.packingList);

    // Abilita bottoni azione viaggio
    if(downloadTextBtn) downloadTextBtn.disabled = false;
    if(downloadExcelBtn) downloadExcelBtn.disabled = false;
    if(deleteTripBtn) deleteTripBtn.disabled = false;

    // Aggiorna visibilità pulsanti ricerca
    toggleSearchButtonsVisibility();

    // Mostra area dettagli e nascondi welcome message
    if(tripDetailsAreaDiv) tripDetailsAreaDiv.style.display = 'block';
    if(welcomeMessageDiv) welcomeMessageDiv.style.display = 'none';
};

export const renderTransportations = (itemsInput = []) => {
    const items = Array.isArray(itemsInput) ? itemsInput : [];
    if (!transportListUl) return;
    transportListUl.innerHTML = ''; if(noTransportItemsP) noTransportItemsP.style.display = items.length === 0 ? 'block' : 'none';
    if (!Array.isArray(items)) return;
    try { items.sort((a, b) => (a?.departureDateTime || '').localeCompare(b?.departureDateTime || '')); } catch (e) { console.error("Sort err transport:", e); }
    items.forEach(item => { if (!item || !item.id) return; const li = document.createElement('li'); li.dataset.itemId = item.id; const iconClass = getTransportIcon(item.type); li.innerHTML = ` <div class="item-details"> <strong><i class="fas ${iconClass} fa-fw"></i> ${item.type}: ${item.description || 'N/D'}</strong> <span class="meta"><i class="fas fa-plane-departure fa-fw"></i> Da: ${item.departureLoc || '?'} (${formatDateTime(item.departureDateTime)})</span> <span class="meta"><i class="fas fa-plane-arrival fa-fw"></i> A: ${item.arrivalLoc || '?'} (${formatDateTime(item.arrivalDateTime)})</span> ${item.bookingRef ? `<span class="meta"><i class="fas fa-ticket-alt fa-fw"></i> Rif: ${item.bookingRef}</span>`:''} ${item.cost!==null ? `<span class="meta"><i class="fas fa-euro-sign fa-fw"></i> Costo: ${formatCurrency(item.cost)}</span>`:''} ${item.notes ? `<span class="meta"><i class="fas fa-info-circle fa-fw"></i> Note: ${item.notes}</span>`:''} </div> <div class="item-actions"> <button class="btn-icon edit transport-edit-btn" data-item-id="${item.id}" title="Modifica"><i class="fas fa-edit"></i></button> <button class="btn-icon delete transport-delete-btn" data-item-id="${item.id}" title="Elimina"><i class="fas fa-trash-alt"></i></button> </div>`; transportListUl.appendChild(li); });
};

export const renderItinerary = (itemsInput = []) => {
    const items = Array.isArray(itemsInput) ? itemsInput : [];
    if (!itineraryListUl) return;
    itineraryListUl.innerHTML = ''; if(noItineraryItemsP) noItineraryItemsP.style.display = items.length === 0 ? 'block' : 'none';
    if (!Array.isArray(items)) return;
    try { items.sort((a, b) => { const d=(a?.day||'').localeCompare(b?.day||''); return d!==0?d:(a?.time||'').localeCompare(b?.time||''); }); } catch (e) { console.error("Sort err itinerary:", e); }
    items.forEach(item => { if (!item || !item.id) return; const li = document.createElement('li'); li.dataset.itemId = item.id; li.innerHTML = ` <div class="item-details"> <strong>${formatDate(item.day)} ${item.time?'('+item.time+')':''} - ${item.activity||'N/D'}</strong> ${item.location ? `<span class="meta"><i class="fas fa-map-marker-alt fa-fw"></i> ${item.location}</span>`:''} ${item.notes ? `<span class="meta"><i class="fas fa-info-circle fa-fw"></i> ${item.notes}</span>`:''} </div> <div class="item-actions"> <button class="btn-icon edit itinerary-edit-btn" data-item-id="${item.id}" title="Modifica"><i class="fas fa-edit"></i></button> <button class="btn-icon delete itinerary-delete-btn" data-item-id="${item.id}" title="Elimina"><i class="fas fa-trash-alt"></i></button> </div>`; itineraryListUl.appendChild(li); });
};

export const renderBudget = (budgetData) => {
    const safeData = budgetData && typeof budgetData === 'object' ? budgetData : { items: [], estimatedTotal: 0, actualTotal: 0 };
    const items = Array.isArray(safeData.items) ? safeData.items : [];
    if (!budgetListUl) return; budgetListUl.innerHTML = ''; if(noBudgetItemsP) noBudgetItemsP.style.display = items.length === 0 ? 'block' : 'none';
    let calcEst = 0; let calcAct = 0; if (!Array.isArray(items)) return;
    try { items.sort((a, b) => (a?.category||'').localeCompare(b?.category||'')); } catch (e) { console.error("Sort err budget:", e); }
    items.forEach(item => { if (!item || !item.id) return; const est = Number(item.estimated || 0); const act = item.actual === null || typeof item.actual === 'undefined' ? null : Number(item.actual || 0); if (!isNaN(est)) calcEst += est; if (act !== null && !isNaN(act)) calcAct += act; let cls = ''; if (act !== null && !isNaN(act) && est > 0) { if (act > est) cls = 'negative'; else if (act < est) cls = 'positive'; } const li = document.createElement('li'); li.dataset.itemId = item.id; li.innerHTML = ` <div class="item-details"> <strong>${item.category||'N/D'}: ${item.description||'N/D'}</strong> <span class="meta">Stimato: ${formatCurrency(est)} | Effettivo: <span class="${cls}">${act === null ? 'N/A' : formatCurrency(act)}</span></span> </div> <div class="item-actions"> <button class="btn-icon edit budget-edit-btn" data-item-id="${item.id}" title="Modifica"><i class="fas fa-edit"></i></button> <button class="btn-icon delete budget-delete-btn" data-item-id="${item.id}" title="Elimina"><i class="fas fa-trash-alt"></i></button> </div>`; budgetListUl.appendChild(li); });
    if(budgetTotalEstimatedStrong) budgetTotalEstimatedStrong.textContent = formatCurrency(calcEst); if(budgetTotalActualStrong) budgetTotalActualStrong.textContent = formatCurrency(calcAct); const diff = calcAct - calcEst; if (budgetDifferenceStrong) { budgetDifferenceStrong.textContent = formatCurrency(diff); budgetDifferenceStrong.className = ''; if (diff < 0) budgetDifferenceStrong.classList.add('positive'); else if (diff > 0) budgetDifferenceStrong.classList.add('negative'); }
    // Aggiorna i totali nello stato (anche se non salviamo qui)
    const trip = getCurrentTrip(); if (trip?.budget) { trip.budget.estimatedTotal = calcEst; trip.budget.actualTotal = calcAct; }
};

export const renderPackingList = (itemsInput = []) => {
    const items = Array.isArray(itemsInput) ? itemsInput : []; if (!packingListUl) return; packingListUl.innerHTML = ''; if(noPackingItemsP) noPackingItemsP.style.display = items.length === 0 ? 'block' : 'none'; if (!Array.isArray(items)) return;
    try { items.sort((a, b) => (a?.name||'').localeCompare(b?.name||'')); } catch(e) { console.error("Sort err packing list:", e); }
    items.forEach(item => { if (!item || !item.id) return; const li = document.createElement('li'); li.dataset.itemId = item.id; li.classList.toggle('packed', item.packed); li.innerHTML = ` <div class="form-check"> <input class="form-check-input packing-checkbox" type="checkbox" id="pack-${item.id}" data-item-id="${item.id}" ${item.packed?'checked':''}> <label class="form-check-label" for="pack-${item.id}">${item.name||'N/D'}</label> </div> <div class="item-actions"> <button class="btn-icon edit packing-edit-btn" data-item-id="${item.id}" title="Modifica Nome"><i class="fas fa-edit"></i></button> <button class="btn-icon delete packing-delete-btn" data-item-id="${item.id}" title="Elimina"><i class="fas fa-trash-alt"></i></button> </div>`; packingListUl.appendChild(li); });
};


export const switchTab = (tabId) => { if (!tabId) return; document.querySelectorAll(".tab-content").forEach(tab => { tab.style.display = "none"; tab.classList.remove("active"); }); document.querySelectorAll(".tab-link").forEach(link => link.classList.remove("active")); const content = document.getElementById(tabId); const link = tabsContainer ? tabsContainer.querySelector(`.tab-link[data-tab="${tabId}"]`) : null; if (content) { content.style.display = "block"; setTimeout(() => content.classList.add("active"), 10); } else { console.error(`Contenuto tab "${tabId}" non trovato!`); } if (link) { link.classList.add("active"); } else { console.error(`Link tab "${tabId}" non trovato!`); } };

export const toggleSearchButtonsVisibility = () => { const selectedType = transportTypeSelect ? transportTypeSelect.value : null; if (searchSkyscannerBtn) searchSkyscannerBtn.style.display = (selectedType === 'Volo') ? 'inline-flex' : 'none'; if (searchTrainlineBtn) searchTrainlineBtn.style.display = (selectedType === 'Treno') ? 'inline-flex' : 'none'; };

export const resetFormUI = (formType) => {
    const form = document.getElementById(`add-${formType}-item-form`);
    const submitBtn = document.getElementById(`${formType}-submit-btn`);
    const cancelBtn = document.getElementById(`${formType}-cancel-edit-btn`);
    const hiddenInput = document.getElementById(`edit-${formType}-item-id`);

    if (form) form.reset();
    if (hiddenInput) hiddenInput.value = '';
    if (submitBtn) {
        let addText = 'Aggiungi'; if(formType === 'transport') addText = 'Trasporto'; else if(formType === 'itinerary') addText = 'Attività'; else if(formType === 'budget') addText = 'Spesa'; else if(formType === 'packing') addText = 'Oggetto';
        submitBtn.innerHTML = `<i class="fas fa-plus"></i> ${addText}`; submitBtn.classList.remove('btn-warning'); submitBtn.classList.add('btn-secondary');
    }
    if (cancelBtn) cancelBtn.style.display = 'none';
    if(formType === 'transport') toggleSearchButtonsVisibility();
};

// Popola form per modifica
export const populateFormForEdit = (listType, itemData) => {
     const form = document.getElementById(`add-${listType}-item-form`);
     const submitBtn = document.getElementById(`${listType}-submit-btn`);
     const cancelBtn = document.getElementById(`${listType}-cancel-edit-btn`);
     const hiddenInput = document.getElementById(`edit-${listType}-item-id`);

     if(!form || !submitBtn || !cancelBtn || !hiddenInput || !itemData) return false;

     hiddenInput.value = itemData.id;

     try {
        switch (listType) {
            case 'transport':
                form.querySelector('#transport-type').value = itemData.type || 'Altro'; form.querySelector('#transport-description').value = itemData.description || '';
                form.querySelector('#transport-departure-loc').value = itemData.departureLoc || ''; form.querySelector('#transport-departure-datetime').value = itemData.departureDateTime || '';
                form.querySelector('#transport-arrival-loc').value = itemData.arrivalLoc || ''; form.querySelector('#transport-arrival-datetime').value = itemData.arrivalDateTime || '';
                form.querySelector('#transport-booking-ref').value = itemData.bookingRef || ''; form.querySelector('#transport-cost').value = itemData.cost ?? ''; form.querySelector('#transport-notes').value = itemData.notes || '';
                break;
            case 'itinerary':
                form.querySelector('#itinerary-day').value = itemData.day || ''; form.querySelector('#itinerary-time').value = itemData.time || '';
                form.querySelector('#itinerary-activity').value = itemData.activity || ''; form.querySelector('#itinerary-location').value = itemData.location || ''; form.querySelector('#itinerary-notes').value = itemData.notes || '';
                break;
            case 'budget':
                form.querySelector('#budget-category').value = itemData.category || 'Altro'; form.querySelector('#budget-description').value = itemData.description || '';
                form.querySelector('#budget-estimated').value = itemData.estimated ?? ''; form.querySelector('#budget-actual').value = itemData.actual ?? '';
                break;
            case 'packing':
                form.querySelector('#packing-item-name').value = itemData.name || ''; break;
        }
     } catch(e) {
         console.error("Errore popolamento form:", e); return false;
     }

     submitBtn.innerHTML = '<i class="fas fa-save"></i> Salva Modifiche'; submitBtn.classList.remove('btn-secondary'); submitBtn.classList.add('btn-warning');
     cancelBtn.style.display = 'inline-flex';
     if(listType === 'transport') toggleSearchButtonsVisibility();
     form.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
     return true;
};

export const updateTripInfoUI = (trip) => {
     if (!trip) return;
     if (tripTitleH2) tripTitleH2.textContent = trip.name || 'Senza Nome';
     if (tripNameInput) tripNameInput.value = trip.name || '';
     if (tripOriginCityInput) tripOriginCityInput.value = trip.originCity || '';
     if (tripDestinationInput) tripDestinationInput.value = trip.destination || '';
     // if (tripDestinationDisplayInput) tripDestinationDisplayInput.value = trip.destination || ''; // Rimosso
     if (tripStartDateInput) tripStartDateInput.value = trip.startDate || '';
     if (tripEndDateInput) tripEndDateInput.value = trip.endDate || '';
     if (tripNotesTextarea) tripNotesTextarea.value = trip.notes || '';
     // Non aggiorna le liste, solo i campi info
};

// --- Modal Functions ---
export const openNewTripModalUI = () => { if (newTripModal) { newTripNameInput.value = ''; if (newTripErrorP) newTripErrorP.style.display = 'none'; newTripModal.style.display = 'block'; newTripNameInput.focus(); } };
export const closeNewTripModalUI = () => { if (newTripModal) newTripModal.style.display = 'none'; };
export const showNewTripModalError = (message) => { if(newTripErrorP) { newTripErrorP.textContent = message; newTripErrorP.style.display = 'block'; } if(newTripNameInput) newTripNameInput.focus(); };
export const showConfirmationModalUI = (title, message) => { if (!confirmationModal) return; confirmationModalTitle.textContent = title; confirmationModalMessage.textContent = message; confirmationModal.style.display = 'block'; };
export const closeConfirmationModalUI = () => { if (confirmationModal) confirmationModal.style.display = 'none'; };
