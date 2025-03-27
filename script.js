document.addEventListener('DOMContentLoaded', () => {
    // ==========================================================================
    // == CONFIGURAZIONE E COSTANTI ==
    // ==========================================================================
    const STORAGE_KEY = 'travelPlannerPro_Trips_vFinal_NoImport';
    const DEFAULT_CURRENCY = 'EUR';
    const DEFAULT_LOCALE = 'it-IT';
    const PREDEFINED_PACKING_LISTS = {
        beach: ["Costume da bagno", "Asciugamano da spiaggia", "Crema solare", "Occhiali da sole", "Cappello", "Libro/Rivista", "Borsa da spiaggia", "Infradito/Sandali", "Dopasole"],
        city: ["Scarpe comode", "Mappa/App navigazione", "Macchina fotografica", "Power bank", "Borraccia", "Giacca leggera/Impermeabile", "Zainetto", "Documenti", "Adattatore presa (se necessario)"],
        mountain: ["Scarponcini da trekking", "Zaino", "Borraccia/Thermos", "Giacca a vento/pioggia", "Pile/Maglione pesante", "Pantaloni lunghi", "Cappello/Berretto", "Guanti", "Occhiali da sole", "Crema solare", "Kit primo soccorso", "Mappa/Bussola/GPS"],
        camping: ["Tenda", "Sacco a pelo", "Materassino", "Fornello da campeggio + Gas", "Gavetta/Stoviglie", "Coltellino multiuso", "Torcia frontale/Lanterna + Batterie", "Kit igiene personale", "Asciugamano microfibra", "Repellente insetti", "Sedia pieghevole (opzionale)", "Cibo a lunga conservazione"]
    };

    // ==========================================================================
    // == ELEMENTI DOM ==
    // ==========================================================================
    const tripListUl = document.getElementById('trip-list');
    const newTripBtn = document.getElementById('new-trip-btn');
    const welcomeMessageDiv = document.getElementById('welcome-message');
    const tripDetailsAreaDiv = document.getElementById('trip-details-area');
    const noTripsMessage = document.getElementById('no-trips-message');
    const tripTitleH2 = document.getElementById('trip-title');
    const downloadTextBtn = document.getElementById('download-text-btn');
    const downloadExcelBtn = document.getElementById('download-excel-btn');
    const deleteTripBtn = document.getElementById('delete-trip-btn');
    const tabsContainer = document.querySelector('.tabs');
    const tripInfoForm = document.getElementById('trip-info-form');
    const editTripIdInput = document.getElementById('edit-trip-id');
    const tripNameInput = document.getElementById('trip-name');
    const tripDestinationInput = document.getElementById('trip-destination');
    const tripStartDateInput = document.getElementById('trip-start-date');
    const tripEndDateInput = document.getElementById('trip-end-date');
    const tripNotesTextarea = document.getElementById('trip-notes');
    const addTransportItemForm = document.getElementById('add-transport-item-form');
    const editTransportItemIdInput = document.getElementById('edit-transport-item-id');
    const transportTypeSelect = document.getElementById('transport-type');
    const transportDescriptionInput = document.getElementById('transport-description');
    const transportDepartureLocInput = document.getElementById('transport-departure-loc');
    const transportDepartureDatetimeInput = document.getElementById('transport-departure-datetime');
    const transportArrivalLocInput = document.getElementById('transport-arrival-loc');
    const transportArrivalDatetimeInput = document.getElementById('transport-arrival-datetime');
    const transportBookingRefInput = document.getElementById('transport-booking-ref');
    const transportCostInput = document.getElementById('transport-cost');
    const transportNotesInput = document.getElementById('transport-notes');
    const transportListUl = document.getElementById('transport-list');
    const noTransportItemsP = document.getElementById('no-transport-items');
    const transportSubmitBtn = document.getElementById('transport-submit-btn');
    const transportCancelEditBtn = document.getElementById('transport-cancel-edit-btn');
    const addItineraryItemForm = document.getElementById('add-itinerary-item-form');
    const editItineraryItemIdInput = document.getElementById('edit-itinerary-item-id');
    const itineraryDayInput = document.getElementById('itinerary-day');
    const itineraryTimeInput = document.getElementById('itinerary-time');
    const itineraryActivityInput = document.getElementById('itinerary-activity');
    const itineraryLocationInput = document.getElementById('itinerary-location');
    const itineraryNotesInput = document.getElementById('itinerary-notes');
    const itineraryListUl = document.getElementById('itinerary-list');
    const noItineraryItemsP = document.getElementById('no-itinerary-items');
    const itinerarySubmitBtn = document.getElementById('itinerary-submit-btn');
    const itineraryCancelEditBtn = document.getElementById('itinerary-cancel-edit-btn');
    const addBudgetItemForm = document.getElementById('add-budget-item-form');
    const editBudgetItemIdInput = document.getElementById('edit-budget-item-id');
    const budgetCategorySelect = document.getElementById('budget-category');
    const budgetDescriptionInput = document.getElementById('budget-description');
    const budgetEstimatedInput = document.getElementById('budget-estimated');
    const budgetActualInput = document.getElementById('budget-actual');
    const budgetListUl = document.getElementById('budget-list');
    const budgetTotalEstimatedStrong = document.getElementById('budget-total-estimated');
    const budgetTotalActualStrong = document.getElementById('budget-total-actual');
    const budgetDifferenceStrong = document.getElementById('budget-difference');
    const noBudgetItemsP = document.getElementById('no-budget-items');
    const budgetSubmitBtn = document.getElementById('budget-submit-btn');
    const budgetCancelEditBtn = document.getElementById('budget-cancel-edit-btn');
    const predefinedChecklistsContainer = document.querySelector('.predefined-checklists');
    const addPackingItemForm = document.getElementById('add-packing-item-form');
    const editPackingItemIdInput = document.getElementById('edit-packing-item-id');
    const packingItemNameInput = document.getElementById('packing-item-name');
    const packingListUl = document.getElementById('packing-list');
    const noPackingItemsP = document.getElementById('no-packing-items');
    const packingSubmitBtn = document.getElementById('packing-submit-btn');
    const packingCancelEditBtn = document.getElementById('packing-cancel-edit-btn');
    const newTripModal = document.getElementById('new-trip-modal');
    const newTripNameInput = document.getElementById('new-trip-name-input');
    const newTripErrorP = document.getElementById('new-trip-modal-error');
    const createTripConfirmBtn = document.getElementById('create-trip-confirm-btn');
    const confirmationModal = document.getElementById('confirmation-modal');
    const confirmationModalTitle = document.getElementById('confirmation-modal-title');
    const confirmationModalMessage = document.getElementById('confirmation-modal-message');
    const confirmationModalConfirmBtn = document.getElementById('confirmation-modal-confirm-btn');
    const toastContainer = document.getElementById('toast-container');
    const addTransportTotalToBudgetBtn = document.getElementById('add-transport-total-to-budget-btn');
    const searchSkyscannerBtn = document.getElementById('search-skyscanner-btn'); // Bottone Skyscanner

    // ==========================================================================
    // == STATO APPLICAZIONE ==
    // ==========================================================================
    let trips = [];
    let currentTripId = null;
    let editingItemId = { transport: null, itinerary: null, budget: null, packing: null };
    let confirmActionCallback = null;

    // ==========================================================================
    // == FUNZIONI UTILITY ==
    // ==========================================================================
    const generateId = (prefix = 'item') => `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    const formatCurrency = (amount) => { const num = amount === null || typeof amount === 'undefined' ? 0 : Number(amount); if (isNaN(num)) { console.warn(`Valore non numerico per formatCurrency: ${amount}`); return new Intl.NumberFormat(DEFAULT_LOCALE, { style: 'currency', currency: DEFAULT_CURRENCY }).format(0); } return new Intl.NumberFormat(DEFAULT_LOCALE, { style: 'currency', currency: DEFAULT_CURRENCY }).format(num); };
    const formatDate = (dateString) => { if (!dateString || typeof dateString !== 'string') return ''; try { const parts = dateString.split('-'); if (parts.length !== 3) return ''; const year = parseInt(parts[0]), month = parseInt(parts[1]), day = parseInt(parts[2]); if (isNaN(year) || isNaN(month) || isNaN(day) || month < 1 || month > 12 || day < 1 || day > 31) return ''; const date = new Date(Date.UTC(year, month - 1, day)); if (isNaN(date.getTime()) || date.getUTCFullYear() !== year || date.getUTCMonth() + 1 !== month || date.getUTCDate() !== day) return ''; return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`; } catch (e) { return ''; } };
    const formatDateTime = (dateTimeString) => { if (!dateTimeString || typeof dateTimeString !== 'string') return ''; try { const date = new Date(dateTimeString); if (isNaN(date.getTime())) return ''; const day = String(date.getDate()).padStart(2, '0'); const month = String(date.getMonth() + 1).padStart(2, '0'); const year = date.getFullYear(); const hours = String(date.getHours()).padStart(2, '0'); const minutes = String(date.getMinutes()).padStart(2, '0'); return `${day}/${month}/${year} ${hours}:${minutes}`; } catch (e) { return ''; } };
    const showToast = (message, type = 'info') => { if (!toastContainer) return; const toast = document.createElement('div'); toast.className = `toast ${type}`; let iconClass = 'fas fa-info-circle'; if (type === 'success') iconClass = 'fas fa-check-circle'; if (type === 'error') iconClass = 'fas fa-exclamation-circle'; toast.innerHTML = `<i class="${iconClass}"></i> ${message}`; toastContainer.appendChild(toast); setTimeout(() => toast.classList.add('show'), 10); setTimeout(() => { toast.classList.remove('show'); toast.addEventListener('transitionend', () => toast.remove(), { once: true }); }, 3000); };
    const openNewTripModal = () => { if (!newTripModal) return; newTripNameInput.value = ''; if (newTripErrorP) newTripErrorP.style.display = 'none'; newTripModal.style.display = 'block'; newTripNameInput.focus(); };
    const closeNewTripModal = () => { if (newTripModal) newTripModal.style.display = 'none'; };
    const showConfirmationModal = (title, message, onConfirm) => { if (!confirmationModal) return; confirmationModalTitle.textContent = title; confirmationModalMessage.textContent = message; confirmActionCallback = onConfirm; confirmationModal.style.display = 'block'; };
    const closeConfirmationModal = () => { if (!confirmationModal) return; confirmActionCallback = null; confirmationModal.style.display = 'none'; };
    const resetEditState = (formType) => {
        editingItemId[formType] = null;
        const form = document.getElementById(`add-${formType}-item-form`); const submitBtn = document.getElementById(`${formType}-submit-btn`);
        const cancelBtn = document.getElementById(`${formType}-cancel-edit-btn`); const hiddenInput = document.getElementById(`edit-${formType}-item-id`);
        if (form) form.reset(); if(hiddenInput) hiddenInput.value = '';
        if (submitBtn) {
            let addText = 'Aggiungi'; if(formType === 'transport') addText = 'Trasporto'; else if(formType === 'itinerary') addText = 'Attività'; else if(formType === 'budget') addText = 'Spesa'; else if(formType === 'packing') addText = 'Oggetto';
            submitBtn.innerHTML = `<i class="fas fa-plus"></i> ${addText}`; submitBtn.classList.remove('btn-warning'); submitBtn.classList.add('btn-secondary');
        }
        if (cancelBtn) cancelBtn.style.display = 'none';
    };

    // ==========================================================================
    // == GESTIONE STORAGE ==
    // ==========================================================================
    const saveTrips = () => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(trips)); } catch (e) { console.error("Errore salvataggio:", e); showToast("Errore: impossibile salvare i dati.", "error"); } };
    const loadTrips = () => {
        const stored = localStorage.getItem(STORAGE_KEY); try { trips = stored ? JSON.parse(stored) : []; if (!Array.isArray(trips)) trips = []; } catch (e) { console.error("Errore parsing localStorage:", e); trips = []; }
        trips.forEach(trip => { if (!trip || typeof trip !== 'object') return; trip.transportations = Array.isArray(trip.transportations) ? trip.transportations : []; trip.itinerary = Array.isArray(trip.itinerary) ? trip.itinerary : []; trip.budget = (trip.budget && typeof trip.budget === 'object') ? trip.budget : { items: [], estimatedTotal: 0, actualTotal: 0 }; trip.budget.items = Array.isArray(trip.budget.items) ? trip.budget.items : []; trip.packingList = Array.isArray(trip.packingList) ? trip.packingList : []; });
    };

    // ==========================================================================
    // == LOGICA VIAGGI (CRUD, Selezione) ==
    // ==========================================================================
    const findTripById = (id) => trips.find(trip => trip && trip.id === id);

    const renderTripList = () => {
        tripListUl.innerHTML = ''; trips.sort((a, b) => (a?.name || '').localeCompare(b?.name || ''));
        trips.forEach(trip => { if (!trip || !trip.id) return; const li = document.createElement('li'); li.dataset.tripId = trip.id; li.innerHTML = `<span>${trip.name || 'Senza Nome'} (${formatDate(trip.startDate)} - ${formatDate(trip.endDate)})</span> <button class="btn-delete-trip" data-trip-id="${trip.id}" title="Elimina"><i class="fas fa-trash-alt"></i></button>`; if (trip.id === currentTripId) li.classList.add('active'); li.addEventListener('click', (e) => { if (!e.target.closest('.btn-delete-trip')) selectTrip(trip.id); }); li.querySelector('.btn-delete-trip').addEventListener('click', (e) => { e.stopPropagation(); handleDeleteTrip(trip.id); }); tripListUl.appendChild(li); });
        noTripsMessage.style.display = trips.length === 0 ? 'block' : 'none';
    };

    const selectTrip = (id) => { if (currentTripId === id && tripDetailsAreaDiv.style.display !== 'none') return; currentTripId = id; const trip = findTripById(id); if (trip) { renderTripList(); renderTripDetails(trip); tripDetailsAreaDiv.style.display = 'block'; welcomeMessageDiv.style.display = 'none'; Object.keys(editingItemId).forEach(resetEditState); switchTab('info-tab'); } else { deselectTrip(); } };
    const deselectTrip = () => { currentTripId = null; tripDetailsAreaDiv.style.display = 'none'; welcomeMessageDiv.style.display = 'block'; downloadTextBtn.disabled = true; downloadExcelBtn.disabled = true; deleteTripBtn.disabled = true; renderTripList(); };
    const renderTripDetails = (trip) => { if (!trip) { deselectTrip(); return; } tripTitleH2.textContent = trip.name || 'Senza Nome'; editTripIdInput.value = trip.id; tripNameInput.value = trip.name || ''; tripDestinationInput.value = trip.destination || ''; tripStartDateInput.value = trip.startDate || ''; tripEndDateInput.value = trip.endDate || ''; tripNotesTextarea.value = trip.notes || ''; renderTransportations(trip.transportations); renderItinerary(trip.itinerary); renderBudget(trip.budget); renderPackingList(trip.packingList); downloadTextBtn.disabled = false; downloadExcelBtn.disabled = false; deleteTripBtn.disabled = false; };
    const handleNewTrip = () => { openNewTripModal(); };
    const handleCreateTripConfirm = () => { const tripName = newTripNameInput.value.trim(); if (tripName) { if (newTripErrorP) newTripErrorP.style.display = 'none'; const newTrip = { id: generateId('trip'), name: tripName, destination: '', startDate: '', endDate: '', notes: '', transportations: [], itinerary: [], budget: { items: [], estimatedTotal: 0, actualTotal: 0 }, packingList: [] }; trips.push(newTrip); saveTrips(); closeNewTripModal(); selectTrip(newTrip.id); showToast(`Viaggio "${tripName}" creato!`, 'success'); } else { if (newTripErrorP) { newTripErrorP.textContent = 'Il nome non può essere vuoto.'; newTripErrorP.style.display = 'block'; } newTripNameInput.focus(); } };
    const handleSaveTripInfo = (e) => { e.preventDefault(); if (!currentTripId) return; const trip = findTripById(currentTripId); if (trip) { const start = tripStartDateInput.value, end = tripEndDateInput.value; if (start && end && start > end) { showToast('Data fine non valida.', 'error'); return; } trip.name = tripNameInput.value.trim() || 'Viaggio S.N.'; trip.destination = tripDestinationInput.value.trim(); trip.startDate = start; trip.endDate = end; trip.notes = tripNotesTextarea.value.trim(); saveTrips(); tripTitleH2.textContent = trip.name; renderTripList(); showToast('Informazioni salvate!', 'success'); } };
    const handleDeleteTrip = (id) => { const item = findTripById(id); if (!item) return; showConfirmationModal( 'Conferma Eliminazione Viaggio', `Eliminare "${item.name || 'S.N.'}"? L'azione è irreversibile.`, () => { trips = trips.filter(trip => trip.id !== id); saveTrips(); if (currentTripId === id) deselectTrip(); else renderTripList(); showToast('Viaggio eliminato.', 'info'); }); };

    // ==========================================================================
    // == FUNZIONI MODIFICA ITEM (Generica) ==
    // ==========================================================================
    const startEditItem = (listType, itemId) => {
        if (!currentTripId) return; const trip = findTripById(currentTripId); if (!trip) return;
        let itemToEdit = null; let list = [];
        switch (listType) { case 'transport': list = trip.transportations; break; case 'itinerary': list = trip.itinerary; break; case 'budget': list = trip.budget.items; break; case 'packing': list = trip.packingList; break; default: return; }
        if (!Array.isArray(list)) { console.error(`Lista ${listType} non array`); return; }
        itemToEdit = list.find(item => item && item.id === itemId); if (!itemToEdit) { console.error(`Item ${itemId} non trovato`); return; }
        Object.keys(editingItemId).forEach(type => { if (type !== listType) resetEditState(type); });
        editingItemId[listType] = itemId;
        const form = document.getElementById(`add-${listType}-item-form`); const submitBtn = document.getElementById(`${listType}-submit-btn`); const cancelBtn = document.getElementById(`${listType}-cancel-edit-btn`); const hiddenInput = document.getElementById(`edit-${listType}-item-id`); if(hiddenInput) hiddenInput.value = itemId;
        try {
            switch (listType) {
                case 'transport': transportTypeSelect.value = itemToEdit.type || 'Altro'; transportDescriptionInput.value = itemToEdit.description || ''; transportDepartureLocInput.value = itemToEdit.departureLoc || ''; transportDepartureDatetimeInput.value = itemToEdit.departureDateTime || ''; transportArrivalLocInput.value = itemToEdit.arrivalLoc || ''; transportArrivalDatetimeInput.value = itemToEdit.arrivalDateTime || ''; transportBookingRefInput.value = itemToEdit.bookingRef || ''; transportCostInput.value = itemToEdit.cost ?? ''; transportNotesInput.value = itemToEdit.notes || ''; break;
                case 'itinerary': itineraryDayInput.value = itemToEdit.day || ''; itineraryTimeInput.value = itemToEdit.time || ''; itineraryActivityInput.value = itemToEdit.activity || ''; itineraryLocationInput.value = itemToEdit.location || ''; itineraryNotesInput.value = itemToEdit.notes || ''; break;
                case 'budget': budgetCategorySelect.value = itemToEdit.category || 'Altro'; budgetDescriptionInput.value = itemToEdit.description || ''; budgetEstimatedInput.value = itemToEdit.estimated ?? ''; budgetActualInput.value = itemToEdit.actual ?? ''; break;
                case 'packing': packingItemNameInput.value = itemToEdit.name || ''; break;
            }
        } catch (error) { console.error(`Errore popola form ${listType}:`, error); showToast(`Errore caricamento dati.`, 'error'); resetEditState(listType); return; }
        if (submitBtn) { submitBtn.innerHTML = '<i class="fas fa-save"></i> Salva Modifiche'; submitBtn.classList.remove('btn-secondary'); submitBtn.classList.add('btn-warning'); } if (cancelBtn) cancelBtn.style.display = 'inline-flex';
        form.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    };

    const handleItemFormSubmit = (e, listType) => {
        e.preventDefault(); if (!currentTripId) return; const trip = findTripById(currentTripId); if (!trip) return;
        const currentEditId = editingItemId[listType]; let itemData = {}; let list = []; let listOwner = trip; let renderFn;
        switch (listType) { case 'transport': trip.transportations = Array.isArray(trip.transportations)?trip.transportations:[]; list = trip.transportations; renderFn = renderTransportations; break; case 'itinerary': trip.itinerary = Array.isArray(trip.itinerary)?trip.itinerary:[]; list = trip.itinerary; renderFn = renderItinerary; break; case 'budget': trip.budget = (trip.budget&&typeof trip.budget==='object')?trip.budget:{items:[]}; trip.budget.items=Array.isArray(trip.budget.items)?trip.budget.items:[]; list=trip.budget.items; listOwner=trip.budget; renderFn = renderBudget; break; case 'packing': trip.packingList = Array.isArray(trip.packingList)?trip.packingList:[]; list = trip.packingList; renderFn = renderPackingList; break; default: console.error("Tipo lista non valido:", listType); return; }
        try {
            switch (listType) {
                 case 'transport': if (!transportDescriptionInput.value.trim()) throw new Error("Descrizione richiesta."); itemData = { type: transportTypeSelect.value, description: transportDescriptionInput.value.trim(), departureLoc: transportDepartureLocInput.value.trim() || null, departureDateTime: transportDepartureDatetimeInput.value || null, arrivalLoc: transportArrivalLocInput.value.trim() || null, arrivalDateTime: transportArrivalDatetimeInput.value || null, bookingRef: transportBookingRefInput.value.trim() || null, cost: transportCostInput.value === '' ? null : parseFloat(transportCostInput.value), notes: transportNotesInput.value.trim() || null }; if (itemData.cost !== null && (isNaN(itemData.cost) || itemData.cost < 0)) throw new Error("Costo non valido."); break;
                case 'itinerary': if (!itineraryDayInput.value || !itineraryActivityInput.value.trim()) throw new Error("Giorno e attività richiesti."); if (trip.startDate && trip.endDate && itineraryDayInput.value && (itineraryDayInput.value < trip.startDate || itineraryDayInput.value > trip.endDate)) throw new Error(`Data fuori dal periodo viaggio.`); itemData = { day: itineraryDayInput.value, time: itineraryTimeInput.value || null, activity: itineraryActivityInput.value.trim(), location: itineraryLocationInput.value.trim() || null, notes: itineraryNotesInput.value.trim() || null }; break;
                case 'budget': const estR = budgetEstimatedInput.value; const actR = budgetActualInput.value; const est = parseFloat(estR); const act = actR === '' ? null : parseFloat(actR); if (!budgetDescriptionInput.value.trim() || isNaN(est) || est < 0) throw new Error("Descrizione/costo stimato non validi."); if (act !== null && isNaN(act)) throw new Error("Costo effettivo non è numero."); if (act !== null && act < 0) throw new Error("Costo effettivo non può essere negativo."); itemData = { category: budgetCategorySelect.value, description: budgetDescriptionInput.value.trim(), estimated: est, actual: act }; break;
                case 'packing': if (!packingItemNameInput.value.trim()) throw new Error("Nome oggetto richiesto."); itemData = { name: packingItemNameInput.value.trim() }; break;
            }
        } catch (error) { showToast(`Errore: ${error.message}`, 'error'); return; }
        if (currentEditId) { const idx = list.findIndex(i => i && i.id === currentEditId); if (idx > -1) list[idx] = { ...list[idx], ...itemData }; else { console.error(`Item ${currentEditId} non trovato`); return;} }
        else { itemData.id = generateId(listType); if(listType === 'packing') itemData.packed = false; if (Array.isArray(list)) { list.push(itemData); } else { console.error(`Lista ${listType} non array`); showToast("Errore interno.", "error"); return; } }
        saveTrips(); if (listType === 'budget') { renderFn(listOwner); } else { renderFn(list); } resetEditState(listType); showToast(currentEditId ? 'Elemento aggiornato!' : 'Elemento aggiunto!', 'success');
    };

    // ==========================================================================
    // == FUNZIONI RENDER LISTE ==
    // ==========================================================================
    const renderTransportations = (transportItemsInput) => { /* ... (invariato, con try-catch sort) ... */ };
    const getTransportIcon = (type) => { /* ... (invariato) ... */ };
    const renderItinerary = (itineraryItemsInput) => { /* ... (invariato, con try-catch sort) ... */ };
    const renderBudget = (budgetData) => { /* ... (invariato, con correzione calcolo e try-catch sort) ... */ };
    const renderPackingList = (itemsInput = []) => { /* ... (invariato, con try-catch sort) ... */ };
    const handleTogglePacked = (itemId, isPacked) => { /* ... (invariato) ... */ };
    const handleImportPackingList = (type) => { /* ... (invariato, usa showToast) ... */ };
    const handleDeleteItem = (listType, itemId) => { /* ... (invariato, usa showConfirmationModal) ... */ };

    // ==========================================================================
    // == FUNZIONE AGGIUNGI COSTO TRASPORTI AL BUDGET ==
    // ==========================================================================
    const handleCalculateAndAddTransportCost = () => {
        if (!currentTripId) { showToast("Seleziona prima un viaggio.", "error"); return; }
        const trip = findTripById(currentTripId);
        if (!trip || !Array.isArray(trip.transportations)) { showToast("Errore recupero dati trasporti.", "error"); return; }
        let totalTransportCost = 0;
        trip.transportations.forEach(item => { const cost = Number(item?.cost || 0); if (!isNaN(cost) && cost > 0) { totalTransportCost += cost; } });
        if (totalTransportCost <= 0) { showToast("Nessun costo di trasporto valido trovato.", "info"); return; }
        const budgetItem = { id: generateId('budget'), category: "Trasporti", description: `Totale Costi Trasporti (del ${formatDate(new Date().toISOString().slice(0,10))})`, estimated: totalTransportCost, actual: null };
        trip.budget = (trip.budget && typeof trip.budget === 'object') ? trip.budget : { items: [], estimatedTotal: 0, actualTotal: 0 };
        trip.budget.items = Array.isArray(trip.budget.items) ? trip.budget.items : [];
        trip.budget.items.push(budgetItem); saveTrips(); renderBudget(trip.budget);
        showToast(`Costo trasporti (${formatCurrency(totalTransportCost)}) aggiunto al budget!`, 'success'); switchTab('budget-tab');
    };

    // ==========================================================================
    // == FUNZIONI UI (Tabs) ==
    // ==========================================================================
    const switchTab = (tabId) => { /* ... (invariato) ... */ };

    // ==========================================================================
    // == FUNZIONI DOWNLOAD ==
    // ==========================================================================
    const handleDownloadText = () => { /* ... (invariato) ... */ };
    const handleDownloadExcel = () => { /* ... (invariato, usa showToast per errore) ... */ };

    // ==========================================================================
    // == FUNZIONE RICERCA VOLI SKYSCANNER ==
    // ==========================================================================
     const handleSearchFlights = () => {
        if (!currentTripId) { showToast("Seleziona un viaggio.", "error"); return; }
        const trip = findTripById(currentTripId); if (!trip) { showToast("Viaggio non trovato.", "error"); return; }
        const origin = "rome"; // Esempio fisso - DA PERSONALIZZARE
        const destination = trip.destination?.trim() || 'anywhere';
        let startDate = trip.startDate || ''; let endDate = trip.endDate || '';
        if (destination === 'anywhere') { showToast("Inserisci una destinazione.", "warning"); return; }
        if (!startDate || !endDate) { showToast("Inserisci date di inizio e fine.", "warning"); return; }
        if (!startDate.match(/^\d{4}-\d{2}-\d{2}$/)) startDate = ''; if (!endDate.match(/^\d{4}-\d{2}-\d{2}$/)) endDate = '';
        if (!startDate || !endDate) { showToast("Formato date non valido (YYYY-MM-DD).", "error"); return; }
        const baseUrl = "https://www.skyscanner.it/trasporti/voli/";
        const originCode = origin.toLowerCase().replace(/[^a-z0-9]/gi, '') || 'anywhere';
        const destinationCode = destination.toLowerCase().replace(/[^a-z0-9]/gi, '') || 'anywhere';
        const searchUrl = `${baseUrl}${originCode}/${destinationCode}/${startDate}/${endDate}/?rtn=1&adults=1&children=0&infants=0&cabinclass=economy&preferdirects=false`;
        console.log("Apertura URL Skyscanner:", searchUrl); window.open(searchUrl, '_blank', 'noopener,noreferrer');
    };

    // ==========================================================================
    // == INIZIALIZZAZIONE E EVENT LISTENER ==
    // ==========================================================================
    const init = () => {
        loadTrips(); renderTripList(); deselectTrip();

        // Listener Globali
        newTripBtn.addEventListener('click', handleNewTrip);
        tripInfoForm.addEventListener('submit', handleSaveTripInfo);
        deleteTripBtn.addEventListener('click', () => { if (currentTripId) handleDeleteTrip(currentTripId); });
        downloadTextBtn.addEventListener('click', handleDownloadText);
        downloadExcelBtn.addEventListener('click', handleDownloadExcel);
        tabsContainer.addEventListener('click', (e) => { const tl = e.target.closest('.tab-link'); if (tl?.dataset.tab) switchTab(tl.dataset.tab); });

        // Listener Submit Forms
        addTransportItemForm.addEventListener('submit', (e) => handleItemFormSubmit(e, 'transport'));
        addItineraryItemForm.addEventListener('submit', (e) => handleItemFormSubmit(e, 'itinerary'));
        addBudgetItemForm.addEventListener('submit', (e) => handleItemFormSubmit(e, 'budget'));
        addPackingItemForm.addEventListener('submit', (e) => handleItemFormSubmit(e, 'packing'));

        // Listener Annulla Modifica
        transportCancelEditBtn.addEventListener('click', () => resetEditState('transport'));
        itineraryCancelEditBtn.addEventListener('click', () => resetEditState('itinerary'));
        budgetCancelEditBtn.addEventListener('click', () => resetEditState('budget'));
        packingCancelEditBtn.addEventListener('click', () => resetEditState('packing'));

         // Listener Delegati per Azioni Liste
        tripDetailsAreaDiv.addEventListener('click', (e) => {
            const editBtn = e.target.closest('.btn-icon.edit');
            const deleteBtn = e.target.closest('.btn-icon.delete');
            const packingCheckbox = e.target.closest('.packing-checkbox');
            if (editBtn) { const itemId = editBtn.dataset.itemId; if(!itemId) return;
                if (editBtn.classList.contains('transport-edit-btn')) startEditItem('transport', itemId);
                else if (editBtn.classList.contains('itinerary-edit-btn')) startEditItem('itinerary', itemId);
                else if (editBtn.classList.contains('budget-edit-btn')) startEditItem('budget', itemId);
                else if (editBtn.classList.contains('packing-edit-btn')) startEditItem('packing', itemId);
            } else if (deleteBtn) { const itemId = deleteBtn.dataset.itemId; if(!itemId) return;
                 if (deleteBtn.classList.contains('transport-delete-btn')) handleDeleteItem('transport', itemId);
                 else if (deleteBtn.classList.contains('itinerary-delete-btn')) handleDeleteItem('itinerary', itemId);
                 else if (deleteBtn.classList.contains('budget-delete-btn')) handleDeleteItem('budget', itemId);
                 else if (deleteBtn.classList.contains('packing-delete-btn')) handleDeleteItem('packing', itemId);
            } else if (packingCheckbox) { const itemId = packingCheckbox.dataset.itemId; if(itemId) handleTogglePacked(itemId, packingCheckbox.checked); packingCheckbox.closest('li').classList.toggle('packed', packingCheckbox.checked); }
        });

         // Listener Import Checklist
         if (predefinedChecklistsContainer) {
             predefinedChecklistsContainer.addEventListener('click', (e) => {
                 const btn = e.target.closest('button[data-checklist]');
                 if (btn?.dataset.checklist) handleImportPackingList(btn.dataset.checklist);
             });
         } else { console.warn("Elemento .predefined-checklists non trovato."); }

         // Listener Modals
         if (newTripModal) {
             createTripConfirmBtn?.addEventListener('click', handleCreateTripConfirm);
             newTripModal.querySelectorAll('.modal-close').forEach(btn => btn.addEventListener('click', closeNewTripModal));
             newTripNameInput?.addEventListener('keypress', (e) => { if(e.key === 'Enter') handleCreateTripConfirm(); });
             newTripModal.addEventListener('click', (e) => { if (e.target === newTripModal) closeNewTripModal(); });
         } else { console.warn("Modal #new-trip-modal non trovato."); }
         if (confirmationModal) {
            const confirmBtn = confirmationModal.querySelector('#confirmation-modal-confirm-btn');
            const closeBtns = confirmationModal.querySelectorAll('.modal-close');
            if(confirmBtn) { const newConfirmBtn = confirmBtn.cloneNode(true); confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn); newConfirmBtn.addEventListener('click', () => { if (typeof confirmActionCallback === 'function') confirmActionCallback(); closeConfirmationModal(); }); } else { console.error("Bottone conferma modal non trovato"); }
            closeBtns.forEach(btn => btn.addEventListener('click', closeConfirmationModal));
            confirmationModal.addEventListener('click', (e) => { if (e.target === confirmationModal) closeConfirmationModal(); });
         } else { console.warn("Modal #confirmation-modal non trovato."); }

         // Listener per Calcolo Budget Trasporti
         if (addTransportTotalToBudgetBtn) { addTransportTotalToBudgetBtn.addEventListener('click', handleCalculateAndAddTransportCost); } else { console.warn("Bottone #add-transport-total-to-budget-btn non trovato."); }

         // Listener per Cerca Voli Skyscanner
         if (searchSkyscannerBtn) { searchSkyscannerBtn.addEventListener('click', handleSearchFlights); } else { console.warn("Bottone #search-skyscanner-btn non trovato."); }

    }; // Fine init

    // Avvia app
    init();

}); // Fine DOMContentLoaded
