// ==========================================================================
// == FIREBASE MODULE IMPORTS & INITIALIZATION ==
// ==========================================================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-app.js";
import { getFirestore, collection, addDoc, doc, getDoc, Timestamp } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-firestore.js";
// import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-analytics.js"; // Importa se usi analytics

// La tua configurazione Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBV7k95kgUnMhIzTQR1Xae-O_ksNYzzvmw", // ATTENZIONE: Rendi più sicura in produzione!
  authDomain: "travel-planner-pro-5dd4f.firebaseapp.com",
  projectId: "travel-planner-pro-5dd4f",
  storageBucket: "travel-planner-pro-5dd4f.appspot.com",
  messagingSenderId: "95235228754",
  appId: "1:95235228754:web:5c8ce68dc8362e90260b8b",
  measurementId: "G-8H6FV393ZW" // Opzionale
};

// Inizializza Firebase
let app;
let db;
// let analytics;
try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    // analytics = getAnalytics(app);
    console.log("Firebase inizializzato correttamente.");
} catch (error) {
    console.error("Errore inizializzazione Firebase:", error);
    alert("Impossibile inizializzare le funzionalità di condivisione. Controlla la console per errori.");
    // Disabilita bottone condivisione se init fallisce
    document.addEventListener('DOMContentLoaded', () => {
         const shareBtn = document.getElementById('share-trip-btn');
         if(shareBtn) shareBtn.disabled = true;
    });
}


// ==========================================================================
// == INIZIO LOGICA APPLICAZIONE (dentro DOMContentLoaded) ==
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {

    // ==========================================================================
    // == CONFIGURAZIONE E COSTANTI ==
    // ==========================================================================
    const STORAGE_KEY = 'travelPlannerPro_Trips_v2.1_Firebase'; // Chiave per dati locali
    const DEFAULT_CURRENCY = 'EUR';
    const DEFAULT_LOCALE = 'it-IT';
    const GOOGLE_MAPS_BASE_URL = 'https://www.google.com/maps/search/?api=1&query=';
    const PREDEFINED_PACKING_LISTS = {
        beach: [ { name: "Costume da bagno", category: "Vestiti", quantity: 2 }, { name: "Asciugamano da spiaggia", category: "Accessori", quantity: 1 }, { name: "Crema solare", category: "Igiene", quantity: 1 }, { name: "Occhiali da sole", category: "Accessori", quantity: 1 }, { name: "Cappello", category: "Accessori", quantity: 1 }, { name: "Libro/Rivista", category: "Intrattenimento", quantity: 1 }, { name: "Borsa da spiaggia", category: "Accessori", quantity: 1 }, { name: "Infradito/Sandali", category: "Vestiti", quantity: 1 }, { name: "Dopasole", category: "Igiene", quantity: 1 } ],
        city: [ { name: "Scarpe comode", category: "Vestiti", quantity: 1 }, { name: "Mappa/App navigazione", category: "Documenti/Tech", quantity: 1 }, { name: "Macchina fotografica", category: "Documenti/Tech", quantity: 1 }, { name: "Power bank", category: "Documenti/Tech", quantity: 1 }, { name: "Borraccia", category: "Accessori", quantity: 1 }, { name: "Giacca leggera/Impermeabile", category: "Vestiti", quantity: 1 }, { name: "Zainetto", category: "Accessori", quantity: 1 }, { name: "Documenti", category: "Documenti/Tech", quantity: 1 }, { name: "Adattatore presa (se necessario)", category: "Documenti/Tech", quantity: 1 } ],
        mountain: [ { name: "Scarponcini da trekking", category: "Vestiti", quantity: 1 }, { name: "Zaino", category: "Accessori", quantity: 1 }, { name: "Borraccia/Thermos", category: "Accessori", quantity: 1 }, { name: "Giacca a vento/pioggia", category: "Vestiti", quantity: 1 }, { name: "Pile/Maglione pesante", category: "Vestiti", quantity: 1 }, { name: "Pantaloni lunghi", category: "Vestiti", quantity: 2 }, { name: "Cappello/Berretto", category: "Accessori", quantity: 1 }, { name: "Guanti", category: "Accessori", quantity: 1 }, { name: "Occhiali da sole", category: "Accessori", quantity: 1 }, { name: "Crema solare", category: "Igiene", quantity: 1 }, { name: "Kit primo soccorso", category: "Salute", quantity: 1 }, { name: "Mappa/Bussola/GPS", category: "Documenti/Tech", quantity: 1 } ],
        camping: [ { name: "Tenda", category: "Attrezzatura", quantity: 1 }, { name: "Sacco a pelo", category: "Attrezzatura", quantity: 1 }, { name: "Materassino", category: "Attrezzatura", quantity: 1 }, { name: "Fornello da campeggio + Gas", category: "Attrezzatura", quantity: 1 }, { name: "Gavetta/Stoviglie", category: "Attrezzatura", quantity: 1 }, { name: "Coltellino multiuso", category: "Attrezzatura", quantity: 1 }, { name: "Torcia frontale/Lanterna + Batterie", category: "Attrezzatura", quantity: 1 }, { name: "Kit igiene personale", category: "Igiene", quantity: 1 }, { name: "Asciugamano microfibra", category: "Igiene", quantity: 1 }, { name: "Repellente insetti", category: "Salute", quantity: 1 }, { name: "Sedia pieghevole (opzionale)", category: "Attrezzatura", quantity: 1 }, { name: "Cibo a lunga conservazione", category: "Cibo", quantity: 1 } ]
    };
    const DEFAULT_PACKING_CATEGORIES = ["Vestiti", "Accessori", "Igiene", "Salute", "Documenti/Tech", "Attrezzatura", "Intrattenimento", "Cibo", "Altro"];


    // ==========================================================================
    // == ELEMENTI DOM ==
    // ==========================================================================
    // Sidebar
    const tripListUl = document.getElementById('trip-list');
    const newTripBtn = document.getElementById('new-trip-btn');
    const createFromTemplateBtn = document.getElementById('create-from-template-btn');
    const searchTripInput = document.getElementById('search-trip-input');
    const noTripsMessage = document.getElementById('no-trips-message');

    // Area Dettagli Generale
    const welcomeMessageDiv = document.getElementById('welcome-message');
    const tripDetailsAreaDiv = document.getElementById('trip-details-area');
    const tripTitleH2 = document.getElementById('trip-title');
    const downloadTextBtn = document.getElementById('download-text-btn');
    const downloadExcelBtn = document.getElementById('download-excel-btn');
    const deleteTripBtn = document.getElementById('delete-trip-btn');
    const shareTripBtn = document.getElementById('share-trip-btn'); // Bottone Condividi
    const tabsContainer = document.querySelector('.tabs');

    // Info Tab
    const tripInfoForm = document.getElementById('trip-info-form');
    const editTripIdInput = document.getElementById('edit-trip-id');
    const tripNameInput = document.getElementById('trip-name');
    const tripOriginCityInput = document.getElementById('trip-origin-city');
    const tripDestinationInput = document.getElementById('trip-destination');
    const tripStartDateInput = document.getElementById('trip-start-date');
    const tripEndDateInput = document.getElementById('trip-end-date');
    const tripIsTemplateCheckbox = document.getElementById('trip-is-template');
    const tripNotesTextarea = document.getElementById('trip-notes');
    const tripExtraInfoTextarea = document.getElementById('trip-extra-info');

    // Partecipanti Tab
    const addParticipantForm = document.getElementById('add-participant-form');
    const editParticipantIdInput = document.getElementById('edit-participant-id');
    const participantNameInput = document.getElementById('participant-name');
    const participantNotesInput = document.getElementById('participant-notes');
    const participantExtraInfoTextarea = document.getElementById('participant-extra-info');
    const participantListUl = document.getElementById('participant-list');
    const noParticipantsItemsP = document.getElementById('no-participants-items');
    const participantSubmitBtn = document.getElementById('participant-submit-btn');
    const participantCancelEditBtn = document.getElementById('participant-cancel-edit-btn');
    const participantDatalist = document.getElementById('participant-datalist');

    // Promemoria Tab
    const addReminderItemForm = document.getElementById('add-reminder-item-form');
    const editReminderItemIdInput = document.getElementById('edit-reminder-item-id');
    const reminderDescriptionInput = document.getElementById('reminder-description');
    const reminderDueDateInput = document.getElementById('reminder-due-date');
    const reminderStatusSelect = document.getElementById('reminder-status');
    const reminderListUl = document.getElementById('reminder-list');
    const noReminderItemsP = document.getElementById('no-reminder-items');
    const reminderSubmitBtn = document.getElementById('reminder-submit-btn');
    const reminderCancelEditBtn = document.getElementById('reminder-cancel-edit-btn');
    const reminderSortControl = document.getElementById('reminder-sort-control');

    // Trasporti Tab
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
    const transportLinkInput = document.getElementById('transport-link');
    const transportListUl = document.getElementById('transport-list');
    const noTransportItemsP = document.getElementById('no-transport-items');
    const transportSubmitBtn = document.getElementById('transport-submit-btn');
    const transportCancelEditBtn = document.getElementById('transport-cancel-edit-btn');
    const searchSkyscannerBtn = document.getElementById('search-skyscanner-btn');
    const searchTrainlineBtn = document.getElementById('search-trainline-btn');
    const addTransportTotalToBudgetBtn = document.getElementById('add-transport-total-to-budget-btn');
    const transportSortControl = document.getElementById('transport-sort-control');

    // Alloggio Tab
    const addAccommodationItemForm = document.getElementById('add-accommodation-item-form');
    const editAccommodationItemIdInput = document.getElementById('edit-accommodation-item-id');
    const accommodationNameInput = document.getElementById('accommodation-name');
    const accommodationTypeSelect = document.getElementById('accommodation-type');
    const accommodationAddressInput = document.getElementById('accommodation-address');
    const accommodationCheckinInput = document.getElementById('accommodation-checkin');
    const accommodationCheckoutInput = document.getElementById('accommodation-checkout');
    const accommodationBookingRefInput = document.getElementById('accommodation-booking-ref');
    const accommodationCostInput = document.getElementById('accommodation-cost');
    const accommodationNotesInput = document.getElementById('accommodation-notes');
    const accommodationLinkInput = document.getElementById('accommodation-link');
    const accommodationListUl = document.getElementById('accommodation-list');
    const noAccommodationItemsP = document.getElementById('no-accommodation-items');
    const accommodationSubmitBtn = document.getElementById('accommodation-submit-btn');
    const accommodationCancelEditBtn = document.getElementById('accommodation-cancel-edit-btn');

    // Itinerario Tab
    const addItineraryItemForm = document.getElementById('add-itinerary-item-form');
    const editItineraryItemIdInput = document.getElementById('edit-itinerary-item-id');
    const itineraryDayInput = document.getElementById('itinerary-day');
    const itineraryTimeInput = document.getElementById('itinerary-time');
    const itineraryActivityInput = document.getElementById('itinerary-activity');
    const itineraryLocationInput = document.getElementById('itinerary-location');
    const itineraryBookingRefInput = document.getElementById('itinerary-booking-ref');
    const itineraryCostInput = document.getElementById('itinerary-cost');
    const itineraryNotesInput = document.getElementById('itinerary-notes');
    const itineraryLinkInput = document.getElementById('itinerary-link');
    const itineraryListUl = document.getElementById('itinerary-list');
    const noItineraryItemsP = document.getElementById('no-itinerary-items');
    const itinerarySubmitBtn = document.getElementById('itinerary-submit-btn');
    const itineraryCancelEditBtn = document.getElementById('itinerary-cancel-edit-btn');
    const searchItineraryInput = document.getElementById('search-itinerary-input');
    const itinerarySortControl = document.getElementById('itinerary-sort-control');

    // Budget Tab
    const addBudgetItemForm = document.getElementById('add-budget-item-form');
    const editBudgetItemIdInput = document.getElementById('edit-budget-item-id');
    const budgetCategorySelect = document.getElementById('budget-category');
    const budgetDescriptionInput = document.getElementById('budget-description');
    const budgetEstimatedInput = document.getElementById('budget-estimated');
    const budgetActualInput = document.getElementById('budget-actual');
    const budgetPaidByInput = document.getElementById('budget-paid-by');
    const budgetSplitBetweenInput = document.getElementById('budget-split-between');
    const budgetListUl = document.getElementById('budget-list');
    const budgetTotalEstimatedStrong = document.getElementById('budget-total-estimated');
    const budgetTotalActualStrong = document.getElementById('budget-total-actual');
    const budgetDifferenceStrong = document.getElementById('budget-difference');
    const noBudgetItemsP = document.getElementById('no-budget-items');
    const budgetSubmitBtn = document.getElementById('budget-submit-btn');
    const budgetCancelEditBtn = document.getElementById('budget-cancel-edit-btn');
    const budgetSortControl = document.getElementById('budget-sort-control');

    // Packing List Tab
    const predefinedChecklistsContainer = document.querySelector('.predefined-checklists');
    const addPackingItemForm = document.getElementById('add-packing-item-form');
    const editPackingItemIdInput = document.getElementById('edit-packing-item-id');
    const packingItemNameInput = document.getElementById('packing-item-name');
    const packingItemCategoryInput = document.getElementById('packing-item-category');
    const packingItemQuantityInput = document.getElementById('packing-item-quantity');
    const packingListUl = document.getElementById('packing-list');
    const noPackingItemsP = document.getElementById('no-packing-items');
    const packingSubmitBtn = document.getElementById('packing-submit-btn');
    const packingCancelEditBtn = document.getElementById('packing-cancel-edit-btn');
    const searchPackingInput = document.getElementById('search-packing-input');
    const packingSortControl = document.getElementById('packing-sort-control');
    const packingCategoryDatalist = document.getElementById('packing-category-list');

    // Modals & Toast
    const newTripModal = document.getElementById('new-trip-modal');
    const newTripNameInput = document.getElementById('new-trip-name-input');
    const newTripErrorP = document.getElementById('new-trip-modal-error');
    const createTripConfirmBtn = document.getElementById('create-trip-confirm-btn');
    const selectTemplateModal = document.getElementById('select-template-modal');
    const templateSelectInput = document.getElementById('template-select-input');
    const selectTemplateErrorP = document.getElementById('select-template-modal-error');
    const createFromTemplateConfirmBtn = document.getElementById('create-from-template-confirm-btn');
    const confirmationModal = document.getElementById('confirmation-modal');
    const confirmationModalTitle = document.getElementById('confirmation-modal-title');
    const confirmationModalMessage = document.getElementById('confirmation-modal-message');
    const confirmationModalConfirmBtn = document.getElementById('confirmation-modal-confirm-btn');
    const toastContainer = document.getElementById('toast-container');

    // ==========================================================================
    // == STATO APPLICAZIONE ==
    // ==========================================================================
    let trips = [];
    let currentTripId = null;
    let editingItemId = { participant: null, transport: null, accommodation: null, itinerary: null, budget: null, packing: null, reminder: null };
    let confirmActionCallback = null;
    let currentSort = {
        transport: 'departureDateTime',
        itinerary: 'dateTime',
        budget: 'category',
        packing: 'name',
        reminder: 'dueDate'
    };
    let currentSearchTerm = {
        trip: '',
        itinerary: '',
        packing: ''
    }

    // ==========================================================================
    // == FUNZIONI UTILITY ==
    // ==========================================================================
    const generateId = (prefix = 'item') => `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    const formatCurrency = (amount) => { const num = amount === null || typeof amount === 'undefined' ? 0 : Number(amount); if (isNaN(num)) { console.warn(`Valore non numerico per formatCurrency: ${amount}`); return new Intl.NumberFormat(DEFAULT_LOCALE, { style: 'currency', currency: DEFAULT_CURRENCY }).format(0); } return new Intl.NumberFormat(DEFAULT_LOCALE, { style: 'currency', currency: DEFAULT_CURRENCY }).format(num); };
    const formatDate = (dateString) => { if (!dateString || typeof dateString !== 'string') return ''; try { const parts = dateString.split('-'); if (parts.length !== 3) return dateString; const year = parseInt(parts[0]), month = parseInt(parts[1]), day = parseInt(parts[2]); if (isNaN(year) || isNaN(month) || isNaN(day) || month < 1 || month > 12 || day < 1 || day > 31 || year < 1000 || year > 3000) return dateString; const date = new Date(Date.UTC(year, month - 1, day)); if (isNaN(date.getTime()) || date.getUTCFullYear() !== year || date.getUTCMonth() + 1 !== month || date.getUTCDate() !== day) return dateString; return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`; } catch (e) { console.error("Errore formatDate:", e); return dateString; } };
    const formatDateTime = (dateTimeString) => { if (!dateTimeString || typeof dateTimeString !== 'string') return ''; try { const date = new Date(dateTimeString); if (isNaN(date.getTime())) return ''; const day = String(date.getDate()).padStart(2, '0'); const month = String(date.getMonth() + 1).padStart(2, '0'); const year = date.getFullYear(); const hours = String(date.getHours()).padStart(2, '0'); const minutes = String(date.getMinutes()).padStart(2, '0'); return `${day}/${month}/${year} ${hours}:${minutes}`; } catch (e) { return ''; } };
    const formatSkyscannerDate = (isoDateString) => { if (!isoDateString || typeof isoDateString !== 'string' || !isoDateString.match(/^\d{4}-\d{2}-\d{2}$/)) return null; try { const year = isoDateString.substring(2, 4); const month = isoDateString.substring(5, 7); const day = isoDateString.substring(8, 10); return `${year}${month}${day}`; } catch (e) { console.error("Errore formattazione data Skyscanner:", e); return null; } };
    const showToast = (message, type = 'info') => { if (!toastContainer) return; const toast = document.createElement('div'); toast.className = `toast ${type}`; let iconClass = 'fas fa-info-circle'; if (type === 'success') iconClass = 'fas fa-check-circle'; if (type === 'error') iconClass = 'fas fa-exclamation-circle'; toast.innerHTML = `<i class="${iconClass}"></i> ${message}`; toastContainer.appendChild(toast); setTimeout(() => toast.classList.add('show'), 10); setTimeout(() => { toast.classList.remove('show'); toast.addEventListener('transitionend', () => toast.remove(), { once: true }); }, 3000); };
    const openModal = (modalElement) => { if(modalElement) modalElement.style.display = 'block'; };
    const closeModal = (modalElement) => { if(modalElement) modalElement.style.display = 'none'; };
    const openNewTripModal = () => { if (!newTripModal) return; newTripNameInput.value = ''; if (newTripErrorP) newTripErrorP.style.display = 'none'; openModal(newTripModal); newTripNameInput.focus(); };
    const closeNewTripModal = () => closeModal(newTripModal);
    const showConfirmationModal = (title, message, onConfirm) => { if (!confirmationModal) return; confirmationModalTitle.textContent = title; confirmationModalMessage.textContent = message; confirmActionCallback = onConfirm; openModal(confirmationModal); };
    const closeConfirmationModal = () => { confirmActionCallback = null; closeModal(confirmationModal); };
    const resetEditState = (formType) => { editingItemId[formType] = null; const form = document.getElementById(`add-${formType}-item-form`); const submitBtn = document.getElementById(`${formType}-submit-btn`); const cancelBtn = document.getElementById(`${formType}-cancel-edit-btn`); const hiddenInput = document.getElementById(`edit-${formType}-item-id`); if (form) form.reset(); if(hiddenInput) hiddenInput.value = ''; if (submitBtn) { let addText = 'Aggiungi'; switch(formType) { case 'participant': addText = 'Partecipante'; break; case 'reminder': addText = 'Promemoria'; break; case 'transport': addText = 'Trasporto'; break; case 'accommodation': addText = 'Alloggio'; break; case 'itinerary': addText = 'Attività'; break; case 'budget': addText = 'Spesa'; break; case 'packing': addText = 'Oggetto'; break; } submitBtn.innerHTML = `<i class="fas fa-plus"></i> ${addText}`; submitBtn.classList.remove('btn-warning'); submitBtn.classList.add('btn-secondary'); } if (cancelBtn) cancelBtn.style.display = 'none'; if(formType === 'transport') toggleSearchButtonsVisibility(); };
    const createMapLink = (query) => query ? `${GOOGLE_MAPS_BASE_URL}${encodeURIComponent(query)}` : null;
    const formatDisplayLink = (link) => { if (!link) return ''; try { new URL(link); const displayLink = link.length > 40 ? link.substring(0, 37) + '...' : link; return `<a href="${link}" target="_blank" rel="noopener noreferrer" class="external-link" title="${link}">${displayLink} <i class="fas fa-external-link-alt"></i></a>`; } catch (_) { return link; } };

    // ==========================================================================
    // == UTILITY SPECIFICHE per Firestore & Data Handling ==
    // ==========================================================================
    const toTimestampOrNull = (dateString) => {
        if (!dateString || typeof dateString !== 'string') return null;
        try {
            const date = new Date(dateString);
            return isNaN(date.getTime()) ? null : Timestamp.fromDate(date);
        } catch (e) {
            console.warn(`Impossibile convertire "${dateString}" in Timestamp:`, e);
            return null;
        }
    };
     const safeToNumberOrNull = (value) => {
        if (value === null || value === undefined || value === '') return null;
        const num = Number(value);
        if (isNaN(num) || !isFinite(num)) {
             console.warn(`Valore non numerico o infinito rilevato: "${value}". Convertito a null.`);
             return null;
        }
        return num;
     };
     const safeToPositiveIntegerOrDefault = (value, defaultValue = 1) => {
         if (value === null || value === undefined || value === '') return defaultValue;
         const num = parseInt(value, 10);
         if (isNaN(num) || !isFinite(num) || num < 1) {
             console.warn(`Quantità non valida rilevata: "${value}". Impostata a ${defaultValue}.`);
             return defaultValue;
         }
         return num;
     };
    const convertTimestampsToStrings = (data) => {
        if (data === null || typeof data !== 'object') return data;
        if (data instanceof Timestamp) {
            try { return data.toDate().toISOString(); }
            catch (e) { console.warn("Errore conversione Timestamp in stringa:", e); return null; }
        }
        if (Array.isArray(data)) {
            return data.map(item => convertTimestampsToStrings(item));
        }
        const newData = {};
        for (const key in data) {
            if (Object.prototype.hasOwnProperty.call(data, key)) {
                newData[key] = convertTimestampsToStrings(data[key]);
            }
        }
        return newData;
    };


    // ==========================================================================
    // == GESTIONE STORAGE ==
    // ==========================================================================
    const saveTrips = () => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(trips)); } catch (e) { console.error("Errore salvataggio:", e); showToast("Errore: impossibile salvare i dati.", "error"); } };
    const loadTrips = () => { const stored = localStorage.getItem(STORAGE_KEY); try { trips = stored ? JSON.parse(stored) : []; if (!Array.isArray(trips)) trips = []; } catch (e) { console.error("Errore parsing localStorage:", e); trips = []; } trips.forEach(trip => { if (!trip || typeof trip !== 'object') return; trip.originCity = trip.originCity || ''; trip.destination = trip.destination || ''; trip.isTemplate = trip.isTemplate || false; trip.extraInfo = trip.extraInfo || ''; trip.participants = (Array.isArray(trip.participants) ? trip.participants : []).map(p => ({ ...p, extraInfo: p.extraInfo || '' })); trip.reminders = (Array.isArray(trip.reminders) ? trip.reminders : []).map(r => ({ ...r, status: r.status || 'todo' })); trip.transportations = (Array.isArray(trip.transportations) ? trip.transportations : []).map(t => ({ ...t, link: t.link || null, cost: t.cost ?? null })); trip.accommodations = (Array.isArray(trip.accommodations) ? trip.accommodations : []).map(a => ({ ...a, link: a.link || null, cost: a.cost ?? null })); trip.itinerary = (Array.isArray(trip.itinerary) ? trip.itinerary : []).map(i => ({ ...i, link: i.link || null, bookingRef: i.bookingRef || null, cost: i.cost ?? null })); trip.budget = (trip.budget && typeof trip.budget === 'object') ? trip.budget : { items: [], estimatedTotal: 0, actualTotal: 0 }; trip.budget.items = (Array.isArray(trip.budget.items) ? trip.budget.items : []).map(b => ({ ...b, paidBy: b.paidBy || null, splitBetween: b.splitBetween || null, estimated: b.estimated ?? 0, actual: b.actual ?? null })); trip.packingList = (Array.isArray(trip.packingList) ? trip.packingList : []).map(p => ({ ...p, category: p.category || 'Altro', quantity: p.quantity || 1 })); }); };

    // ==========================================================================
    // == LOGICA VIAGGI (CRUD, Selezione, Template, Ricerca) ==
    // ==========================================================================
    const findTripById = (id) => trips.find(trip => trip && trip.id === id);
    const renderTripList = () => { const searchTerm = currentSearchTerm.trip.toLowerCase(); tripListUl.innerHTML = ''; const nonTemplates = trips.filter(trip => !trip.isTemplate); const templates = trips.filter(trip => trip.isTemplate); const sortedNonTemplates = nonTemplates .sort((a, b) => (a?.name || '').localeCompare(b?.name || '')); sortedNonTemplates.forEach(trip => { if (!trip || !trip.id) return; const tripNameLower = (trip.name || '').toLowerCase(); const destinationLower = (trip.destination || '').toLowerCase(); const isVisible = !searchTerm || tripNameLower.includes(searchTerm) || destinationLower.includes(searchTerm); const li = createTripListItem(trip, isVisible); tripListUl.appendChild(li); }); if (templates.length > 0 && !searchTerm) { const divider = document.createElement('li'); divider.textContent = '--- Templates ---'; divider.style.textAlign = 'center'; divider.style.color = '#6c757d'; divider.style.marginTop = '10px'; divider.style.cursor = 'default'; divider.style.background = 'transparent'; tripListUl.appendChild(divider); const sortedTemplates = templates.sort((a, b) => (a?.name || '').localeCompare(b?.name || '')); sortedTemplates.forEach(trip => { if (!trip || !trip.id) return; const li = createTripListItem(trip, true); tripListUl.appendChild(li); }); } const hasVisibleTrips = nonTemplates.some(trip => { const tripNameLower = (trip.name || '').toLowerCase(); const destinationLower = (trip.destination || '').toLowerCase(); return !searchTerm || tripNameLower.includes(searchTerm) || destinationLower.includes(searchTerm); }); noTripsMessage.style.display = nonTemplates.length === 0 || (!hasVisibleTrips && searchTerm) ? 'block' : 'none'; };
    const createTripListItem = (trip, isVisible) => { const li = document.createElement('li'); li.dataset.tripId = trip.id; if (trip.isTemplate) li.classList.add('is-template'); li.innerHTML = `<span>${trip.name || 'Senza Nome'} ${trip.isTemplate ? '' : `(${formatDate(trip.startDate)} - ${formatDate(trip.endDate)})`}</span> <button class="btn-delete-trip" data-trip-id="${trip.id}" title="Elimina"><i class="fas fa-trash-alt"></i></button>`; if (trip.id === currentTripId && !trip.isTemplate) li.classList.add('active'); if (!isVisible) li.classList.add('hidden'); li.addEventListener('click', (e) => { if (!e.target.closest('.btn-delete-trip')) { if (!trip.isTemplate) { selectTrip(trip.id); } else { showToast("Questo è un template. Selezionalo da 'Da Template' per creare un viaggio.", "info"); } } }); li.querySelector('.btn-delete-trip').addEventListener('click', (e) => { e.stopPropagation(); handleDeleteTrip(trip.id); }); return li; };
    const selectTrip = (id) => { if (currentTripId === id && tripDetailsAreaDiv.style.display !== 'none') return; const trip = findTripById(id); if (trip && !trip.isTemplate) { currentTripId = id; currentSearchTerm.itinerary = ''; if(searchItineraryInput) searchItineraryInput.value = ''; currentSearchTerm.packing = ''; if(searchPackingInput) searchPackingInput.value = ''; currentSort = { transport: 'departureDateTime', itinerary: 'dateTime', budget: 'category', packing: 'name', reminder: 'dueDate' }; applyCurrentSortToControls(); renderTripList(); renderTripDetails(trip); tripDetailsAreaDiv.style.display = 'block'; welcomeMessageDiv.style.display = 'none'; Object.keys(editingItemId).forEach(resetEditState); switchTab('info-tab'); populateDatalists(trip); } else { if (trip && trip.isTemplate) { showToast("Non puoi modificare un template direttamente. Creane un viaggio.", "info"); } else { deselectTrip(); } } };
    const deselectTrip = () => { currentTripId = null; tripDetailsAreaDiv.style.display = 'none'; welcomeMessageDiv.style.display = 'block'; downloadTextBtn.disabled = true; downloadExcelBtn.disabled = true; deleteTripBtn.disabled = true; if (shareTripBtn) shareTripBtn.disabled = true; renderTripList(); };
    const renderTripDetails = (trip) => { if (!trip) { deselectTrip(); return; } tripTitleH2.textContent = trip.name || 'Senza Nome'; editTripIdInput.value = trip.id; tripNameInput.value = trip.name || ''; if(tripOriginCityInput) tripOriginCityInput.value = trip.originCity || ''; if(tripDestinationInput) tripDestinationInput.value = trip.destination || ''; if(tripStartDateInput) tripStartDateInput.value = trip.startDate || ''; if(tripEndDateInput) tripEndDateInput.value = trip.endDate || ''; if(tripIsTemplateCheckbox) tripIsTemplateCheckbox.checked = trip.isTemplate || false; if(tripNotesTextarea) tripNotesTextarea.value = trip.notes || ''; if(tripExtraInfoTextarea) tripExtraInfoTextarea.value = trip.extraInfo || ''; renderParticipants(trip.participants); renderReminders(trip.reminders); renderTransportations(trip.transportations); renderAccommodations(trip.accommodations); renderItinerary(trip.itinerary); renderBudget(trip.budget); renderPackingList(trip.packingList); downloadTextBtn.disabled = false; downloadExcelBtn.disabled = false; deleteTripBtn.disabled = false; if (shareTripBtn) shareTripBtn.disabled = !!trip.isTemplate; // Disabilita share per template
        toggleSearchButtonsVisibility(); };
    const handleNewTrip = () => { openNewTripModal(); };
    const handleCreateTripConfirm = () => { const tripName = newTripNameInput.value.trim(); if (tripName) { if (newTripErrorP) newTripErrorP.style.display = 'none'; const newTrip = { id: generateId('trip'), name: tripName, originCity: '', destination: '', startDate: '', endDate: '', notes: '', isTemplate: false, extraInfo: '', participants: [], reminders: [], transportations: [], accommodations: [], itinerary: [], budget: { items: [], estimatedTotal: 0, actualTotal: 0 }, packingList: [] }; trips.push(newTrip); saveTrips(); closeNewTripModal(); selectTrip(newTrip.id); showToast(`Viaggio "${tripName}" creato!`, 'success'); } else { if (newTripErrorP) { newTripErrorP.textContent = 'Il nome non può essere vuoto.'; newTripErrorP.style.display = 'block'; } newTripNameInput.focus(); } };
    const handleSaveTripInfo = (e) => { e.preventDefault(); if (!currentTripId) return; const trip = findTripById(currentTripId); if (trip) { const start = tripStartDateInput.value, end = tripEndDateInput.value; if (start && end && start > end) { showToast('Data fine non valida.', 'error'); return; } trip.name = tripNameInput.value.trim() || 'Viaggio S.N.'; if (tripOriginCityInput) trip.originCity = tripOriginCityInput.value.trim(); if (tripDestinationInput) trip.destination = tripDestinationInput.value.trim(); trip.startDate = start; trip.endDate = end; if (tripIsTemplateCheckbox) trip.isTemplate = tripIsTemplateCheckbox.checked; if (tripNotesTextarea) trip.notes = tripNotesTextarea.value.trim(); if (tripExtraInfoTextarea) trip.extraInfo = tripExtraInfoTextarea.value.trim(); saveTrips(); tripTitleH2.textContent = trip.name; renderTripList(); if(shareTripBtn) shareTripBtn.disabled = trip.isTemplate; showToast('Informazioni salvate!', 'success'); } };
    const handleDeleteTrip = (id) => { const item = findTripById(id); if (!item) return; const type = item.isTemplate ? 'Template' : 'Viaggio'; showConfirmationModal( `Conferma Eliminazione ${type}`, `Eliminare "${item.name || 'S.N.'}"? L'azione è irreversibile.`, () => { trips = trips.filter(trip => trip.id !== id); saveTrips(); if (currentTripId === id) deselectTrip(); else renderTripList(); showToast(`${type} eliminato.`, 'info'); }); };
    const openSelectTemplateModal = () => { const templates = trips.filter(trip => trip.isTemplate); if (templates.length === 0) { showToast("Nessun template trovato. Crea un viaggio e spunta 'È un template'.", "info"); return; } templateSelectInput.innerHTML = '<option value="">-- Seleziona Template --</option>'; templates.forEach(t => { const option = document.createElement('option'); option.value = t.id; option.textContent = t.name; templateSelectInput.appendChild(option); }); if (selectTemplateErrorP) selectTemplateErrorP.style.display = 'none'; openModal(selectTemplateModal); };
    const closeSelectTemplateModal = () => closeModal(selectTemplateModal);
    const handleCreateFromTemplateConfirm = () => { const templateId = templateSelectInput.value; if (!templateId) { if(selectTemplateErrorP) { selectTemplateErrorP.textContent = 'Seleziona un template.'; selectTemplateErrorP.style.display = 'block';} return; } const template = findTripById(templateId); if (!template) { showToast("Template non valido.", "error"); return; } const newTrip = cloneAndRegenerateTripIds(template); trips.push(newTrip); saveTrips(); closeSelectTemplateModal(); selectTrip(newTrip.id); showToast(`Viaggio creato dal template "${template.name}"!`, 'success'); };
    const handleSearchTrip = (e) => { currentSearchTerm.trip = e.target.value; renderTripList(); };

    // ==========================================================================
    // == FUNZIONI MODIFICA ITEM (Generica - Estesa e con controlli numerici) ==
    // ==========================================================================
    const startEditItem = (listType, itemId) => {
         if (!currentTripId) return;
         const trip = findTripById(currentTripId);
         if (!trip) return;
         let itemToEdit = null;
         let list = [];
         switch (listType) {
             case 'participant': list = trip.participants || []; break;
             case 'reminder': list = trip.reminders || []; break;
             case 'transport': list = trip.transportations || []; break;
             case 'accommodation': list = trip.accommodations || []; break;
             case 'itinerary': list = trip.itinerary || []; break;
             case 'budget': list = trip.budget?.items || []; break;
             case 'packing': list = trip.packingList || []; break;
             default: return;
         }
         itemToEdit = list.find(item => item && item.id === itemId);
         if (!itemToEdit) { console.error(`Item ${itemId} non trovato in lista ${listType}`); return; }

         Object.keys(editingItemId).forEach(type => { if (type !== listType) resetEditState(type); });
         editingItemId[listType] = itemId;

         const form = document.getElementById(`add-${listType}-item-form`);
         const submitBtn = document.getElementById(`${listType}-submit-btn`);
         const cancelBtn = document.getElementById(`${listType}-cancel-edit-btn`);
         const hiddenInput = document.getElementById(`edit-${listType}-item-id`);

         if (hiddenInput) hiddenInput.value = itemId;

         try {
             switch (listType) {
                 case 'participant':
                     participantNameInput.value = itemToEdit.name || '';
                     participantNotesInput.value = itemToEdit.notes || '';
                     participantExtraInfoTextarea.value = itemToEdit.extraInfo || '';
                     break;
                 case 'reminder':
                     reminderDescriptionInput.value = itemToEdit.description || '';
                     reminderDueDateInput.value = itemToEdit.dueDate || '';
                     reminderStatusSelect.value = itemToEdit.status || 'todo';
                     break;
                 case 'transport':
                     transportTypeSelect.value = itemToEdit.type || 'Altro';
                     transportDescriptionInput.value = itemToEdit.description || '';
                     transportDepartureLocInput.value = itemToEdit.departureLoc || '';
                     transportDepartureDatetimeInput.value = itemToEdit.departureDateTime || '';
                     transportArrivalLocInput.value = itemToEdit.arrivalLoc || '';
                     transportArrivalDatetimeInput.value = itemToEdit.arrivalDateTime || '';
                     transportBookingRefInput.value = itemToEdit.bookingRef || '';
                     transportCostInput.value = itemToEdit.cost ?? ''; // Usa ?? per permettere 0
                     transportNotesInput.value = itemToEdit.notes || '';
                     transportLinkInput.value = itemToEdit.link || '';
                     break;
                 case 'accommodation':
                     accommodationNameInput.value = itemToEdit.name || '';
                     accommodationTypeSelect.value = itemToEdit.type || 'Hotel';
                     accommodationAddressInput.value = itemToEdit.address || '';
                     accommodationCheckinInput.value = itemToEdit.checkinDateTime || '';
                     accommodationCheckoutInput.value = itemToEdit.checkoutDateTime || '';
                     accommodationBookingRefInput.value = itemToEdit.bookingRef || '';
                     accommodationCostInput.value = itemToEdit.cost ?? '';
                     accommodationNotesInput.value = itemToEdit.notes || '';
                     accommodationLinkInput.value = itemToEdit.link || '';
                     break;
                 case 'itinerary':
                     itineraryDayInput.value = itemToEdit.day || '';
                     itineraryTimeInput.value = itemToEdit.time || '';
                     itineraryActivityInput.value = itemToEdit.activity || '';
                     itineraryLocationInput.value = itemToEdit.location || '';
                     itineraryBookingRefInput.value = itemToEdit.bookingRef || '';
                     itineraryCostInput.value = itemToEdit.cost ?? '';
                     itineraryNotesInput.value = itemToEdit.notes || '';
                     itineraryLinkInput.value = itemToEdit.link || '';
                     break;
                 case 'budget':
                     budgetCategorySelect.value = itemToEdit.category || 'Altro';
                     budgetDescriptionInput.value = itemToEdit.description || '';
                     budgetEstimatedInput.value = itemToEdit.estimated ?? '';
                     budgetActualInput.value = itemToEdit.actual ?? '';
                     budgetPaidByInput.value = itemToEdit.paidBy || '';
                     budgetSplitBetweenInput.value = itemToEdit.splitBetween || '';
                     break;
                 case 'packing':
                     packingItemNameInput.value = itemToEdit.name || '';
                     packingItemCategoryInput.value = itemToEdit.category || 'Altro';
                     packingItemQuantityInput.value = itemToEdit.quantity || 1;
                     break;
             }
         } catch (error) { console.error(`Errore popola form ${listType}:`, error); showToast(`Errore caricamento dati.`, 'error'); resetEditState(listType); return; }

         if (submitBtn) { submitBtn.innerHTML = '<i class="fas fa-save"></i> Salva Modifiche'; submitBtn.classList.remove('btn-secondary'); submitBtn.classList.add('btn-warning'); }
         if (cancelBtn) cancelBtn.style.display = 'inline-flex';
         if (listType === 'transport') toggleSearchButtonsVisibility();
         if (form) form.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
     };

    const handleItemFormSubmit = (e, listType) => {
        e.preventDefault(); if (!currentTripId) return; const trip = findTripById(currentTripId); if (!trip) return; const currentEditId = editingItemId[listType]; let itemData = {}; let list = []; let listOwner = trip; let renderFn; switch (listType) { case 'participant': trip.participants = Array.isArray(trip.participants)?trip.participants:[]; list = trip.participants; renderFn = renderParticipants; break; case 'reminder': trip.reminders = Array.isArray(trip.reminders)?trip.reminders:[]; list = trip.reminders; renderFn = renderReminders; break; case 'transport': trip.transportations = Array.isArray(trip.transportations)?trip.transportations:[]; list = trip.transportations; renderFn = renderTransportations; break; case 'accommodation': trip.accommodations = Array.isArray(trip.accommodations)?trip.accommodations:[]; list = trip.accommodations; renderFn = renderAccommodations; break; case 'itinerary': trip.itinerary = Array.isArray(trip.itinerary)?trip.itinerary:[]; list = trip.itinerary; renderFn = renderItinerary; break; case 'budget': trip.budget = (trip.budget&&typeof trip.budget==='object')?trip.budget:{items:[], estimatedTotal: 0, actualTotal: 0 }; trip.budget.items=Array.isArray(trip.budget.items)?trip.budget.items:[]; list=trip.budget.items; listOwner=trip.budget; renderFn = renderBudget; break; case 'packing': trip.packingList = Array.isArray(trip.packingList)?trip.packingList:[]; list = trip.packingList; renderFn = renderPackingList; break; default: console.error("Tipo lista non valido:", listType); return; }
        try {
            switch (listType) {
                case 'participant': if (!participantNameInput.value.trim()) throw new Error("Nome partecipante richiesto."); itemData = { name: participantNameInput.value.trim(), notes: participantNotesInput.value.trim() || null, extraInfo: participantExtraInfoTextarea.value.trim() || null }; break;
                case 'reminder': if (!reminderDescriptionInput.value.trim()) throw new Error("Descrizione promemoria richiesta."); itemData = { description: reminderDescriptionInput.value.trim(), dueDate: reminderDueDateInput.value || null, status: reminderStatusSelect.value }; break;
                case 'transport': if (!transportDescriptionInput.value.trim()) throw new Error("Descrizione trasporto richiesta."); const depDateTime = transportDepartureDatetimeInput.value || null; const arrDateTime = transportArrivalDatetimeInput.value || null; if (depDateTime && arrDateTime && depDateTime >= arrDateTime) throw new Error("Data/ora arrivo deve essere dopo la partenza."); const transportCost = safeToNumberOrNull(transportCostInput.value); if(transportCost !== null && transportCost < 0) throw new Error("Costo trasporto non valido."); itemData = { type: transportTypeSelect.value, description: transportDescriptionInput.value.trim(), departureLoc: transportDepartureLocInput.value.trim() || null, departureDateTime: depDateTime, arrivalLoc: transportArrivalLocInput.value.trim() || null, arrivalDateTime: arrDateTime, bookingRef: transportBookingRefInput.value.trim() || null, cost: transportCost, notes: transportNotesInput.value.trim() || null, link: transportLinkInput.value.trim() || null }; break;
                case 'accommodation': if (!accommodationNameInput.value.trim()) throw new Error("Nome alloggio richiesto."); const checkin = accommodationCheckinInput.value || null; const checkout = accommodationCheckoutInput.value || null; if(checkin && checkout && checkin >= checkout) throw new Error("Check-out deve essere dopo check-in."); const accomCost = safeToNumberOrNull(accommodationCostInput.value); if(accomCost !== null && accomCost < 0) throw new Error("Costo alloggio non valido."); itemData = { name: accommodationNameInput.value.trim(), type: accommodationTypeSelect.value, address: accommodationAddressInput.value.trim() || null, checkinDateTime: checkin, checkoutDateTime: checkout, bookingRef: accommodationBookingRefInput.value.trim() || null, cost: accomCost, notes: accommodationNotesInput.value.trim() || null, link: accommodationLinkInput.value.trim() || null }; break;
                case 'itinerary': const itinDay = itineraryDayInput.value; const itinAct = itineraryActivityInput.value.trim(); if (!itinDay || !itinAct) throw new Error("Giorno e attività richiesti."); if (trip.startDate && trip.endDate && itinDay && (itinDay < trip.startDate || itinDay > trip.endDate)) showToast(`Attenzione: data ${formatDate(itinDay)} fuori dal periodo del viaggio (${formatDate(trip.startDate)} - ${formatDate(trip.endDate)}).`, 'warning'); const itinCost = safeToNumberOrNull(itineraryCostInput.value); if(itinCost !== null && itinCost < 0) throw new Error("Costo attività non valido."); itemData = { day: itinDay, time: itineraryTimeInput.value || null, activity: itinAct, location: itineraryLocationInput.value.trim() || null, bookingRef: itineraryBookingRefInput.value.trim() || null, cost: itinCost, notes: itineraryNotesInput.value.trim() || null, link: itineraryLinkInput.value.trim() || null }; break;
                case 'budget': const descBudget = budgetDescriptionInput.value.trim(); const est = safeToNumberOrNull(budgetEstimatedInput.value); const act = safeToNumberOrNull(budgetActualInput.value); if (!descBudget || est === null || est < 0) throw new Error("Descrizione e costo stimato validi richiesti."); if (act !== null && act < 0) throw new Error("Costo effettivo non valido."); itemData = { category: budgetCategorySelect.value, description: descBudget, estimated: est, actual: act, paidBy: budgetPaidByInput.value.trim() || null, splitBetween: budgetSplitBetweenInput.value.trim() || null }; break;
                case 'packing': if (!packingItemNameInput.value.trim()) throw new Error("Nome oggetto richiesto."); const quantity = safeToPositiveIntegerOrDefault(packingItemQuantityInput.value); itemData = { name: packingItemNameInput.value.trim(), category: packingItemCategoryInput.value.trim() || 'Altro', quantity: quantity }; break;
            }
        } catch (error) { showToast(`Errore: ${error.message}`, 'error'); return; }

        if (currentEditId) {
            const idx = list.findIndex(i => i && i.id === currentEditId);
            if (idx > -1) {
                 const oldItem = list[idx];
                 list[idx] = { ...oldItem, ...itemData, ...(listType === 'packing' ? { packed: oldItem.packed } : {}) };
             } else { console.error(`Item ${currentEditId} non trovato`); return; }
        } else {
            itemData.id = generateId(listType);
            if (listType === 'packing') itemData.packed = false;
            if (listType === 'reminder') itemData.status = itemData.status || 'todo';
            if (Array.isArray(list)) { list.push(itemData); } else { console.error(`Lista ${listType} non array`); showToast("Errore interno.", "error"); return; }
        }

        saveTrips();
        if (listType === 'budget') { renderFn(listOwner); } else { renderFn(list); }
        resetEditState(listType);
        showToast(currentEditId ? 'Elemento aggiornato!' : 'Elemento aggiunto!', 'success');
        if(listType === 'participant') populateDatalists(trip);
        if(listType === 'packing') populatePackingCategoriesDatalist(trip.packingList);
    };


    // ==========================================================================
    // == FUNZIONI RENDER LISTE ==
    // ==========================================================================
    const populateDatalists = (trip) => { if (!trip || !participantDatalist) return; participantDatalist.innerHTML = ''; (trip.participants || []).forEach(p => { const option = document.createElement('option'); option.value = p.name; participantDatalist.appendChild(option); }); populatePackingCategoriesDatalist(trip.packingList); };
    const populatePackingCategoriesDatalist = (packingList) => { if (!packingCategoryDatalist) return; packingCategoryDatalist.innerHTML = ''; const categories = new Set(DEFAULT_PACKING_CATEGORIES); (packingList || []).forEach(p => { if(p.category) categories.add(p.category); }); Array.from(categories).sort().forEach(cat => { const option = document.createElement('option'); option.value = cat; packingCategoryDatalist.appendChild(option); }); };
    const renderParticipants = (participantsInput = []) => { const items = Array.isArray(participantsInput) ? participantsInput : []; if (!participantListUl) return; participantListUl.innerHTML = ''; if(noParticipantsItemsP) noParticipantsItemsP.style.display = items.length === 0 ? 'block' : 'none'; if (!Array.isArray(items)) return; items.sort((a, b) => (a?.name || '').localeCompare(b?.name || '')); items.forEach(item => { if (!item || !item.id) return; const li = document.createElement('li'); li.dataset.itemId = item.id; li.innerHTML = ` <div class="item-details"> <strong><i class="fas fa-user fa-fw"></i> ${item.name || 'N/D'}</strong> ${item.notes ? `<span class="meta"><i class="fas fa-info-circle fa-fw"></i> ${item.notes}</span>`:''} ${item.extraInfo ? `<span class="meta"><i class="fas fa-sticky-note fa-fw"></i> ${item.extraInfo}</span>`:''} </div> <div class="item-actions"> <button class="btn-icon edit participant-edit-btn" data-item-id="${item.id}" title="Modifica"><i class="fas fa-edit"></i></button> <button class="btn-icon delete participant-delete-btn" data-item-id="${item.id}" title="Elimina"><i class="fas fa-trash-alt"></i></button> </div>`; participantListUl.appendChild(li); }); if (!editingItemId.participant) addParticipantForm.reset(); };
    const renderReminders = (remindersInput = []) => { let items = Array.isArray(remindersInput) ? remindersInput : []; if (!reminderListUl) return; reminderListUl.innerHTML = ''; if(noReminderItemsP) noReminderItemsP.style.display = items.length === 0 ? 'block' : 'none'; if (!Array.isArray(items)) return; const sortKey = currentSort.reminder; items.sort((a, b) => { if (sortKey === 'dueDate') { return (a?.dueDate || '9999-12-31').localeCompare(b?.dueDate || '9999-12-31'); } if (sortKey === 'status') { const statusOrder = { 'todo': 0, 'done': 1 }; return (statusOrder[a?.status] ?? 9) - (statusOrder[b?.status] ?? 9) || (a?.dueDate || '9999').localeCompare(b?.dueDate || '9999'); } return (a?.description || '').localeCompare(b?.description || ''); }); items.forEach(item => { if (!item || !item.id) return; const li = document.createElement('li'); li.dataset.itemId = item.id; li.classList.toggle('done', item.status === 'done'); const statusClass = item.status === 'done' ? 'done' : 'todo'; const statusText = item.status === 'done' ? 'FATTO' : 'DA FARE'; li.innerHTML = ` <div class="item-details"> <strong> <span class="status-indicator ${statusClass}">${statusText}</span> ${item.description || 'N/D'} </strong> ${item.dueDate ? `<span class="meta due-date"><i class="fas fa-calendar-alt fa-fw"></i> Scadenza: ${formatDate(item.dueDate)}</span>` : ''} </div> <div class="item-actions"> <button class="btn-icon edit reminder-edit-btn" data-item-id="${item.id}" title="Modifica"><i class="fas fa-edit"></i></button> <button class="btn-icon delete reminder-delete-btn" data-item-id="${item.id}" title="Elimina"><i class="fas fa-trash-alt"></i></button> </div>`; reminderListUl.appendChild(li); }); if (!editingItemId.reminder) addReminderItemForm.reset(); };
    const renderTransportations = (transportItemsInput) => { let items = Array.isArray(transportItemsInput) ? transportItemsInput : []; if (!transportListUl) return; transportListUl.innerHTML = ''; if(noTransportItemsP) noTransportItemsP.style.display = items.length === 0 ? 'block' : 'none'; if (!Array.isArray(items)) return; const sortKey = currentSort.transport; items.sort((a, b) => { if (sortKey === 'type') { return (a?.type || '').localeCompare(b?.type || '') || (a?.departureDateTime || '').localeCompare(b?.departureDateTime || ''); } if (sortKey === 'cost') { return (b?.cost ?? -Infinity) - (a?.cost ?? -Infinity); } return (a?.departureDateTime || '').localeCompare(b?.departureDateTime || ''); }); items.forEach(item => { if (!item || !item.id) return; const li = document.createElement('li'); li.dataset.itemId = item.id; const iconClass = getTransportIcon(item.type); li.innerHTML = ` <div class="item-details"> <strong><i class="fas ${iconClass} fa-fw"></i> ${item.type}: ${item.description || 'N/D'}</strong> <span class="meta"><i class="fas fa-plane-departure fa-fw"></i> Da: ${item.departureLoc || '?'} (${formatDateTime(item.departureDateTime)})</span> <span class="meta"><i class="fas fa-plane-arrival fa-fw"></i> A: ${item.arrivalLoc || '?'} (${formatDateTime(item.arrivalDateTime)})</span> ${item.bookingRef ? `<span class="meta"><i class="fas fa-ticket-alt fa-fw"></i> Rif: ${item.bookingRef}</span>`:''} ${item.cost!==null ? `<span class="meta"><i class="fas fa-euro-sign fa-fw"></i> Costo: ${formatCurrency(item.cost)}</span>`:''} ${item.notes ? `<span class="meta"><i class="fas fa-info-circle fa-fw"></i> Note: ${item.notes}</span>`:''} ${item.link ? `<span class="meta"><i class="fas fa-link fa-fw"></i> Link: ${formatDisplayLink(item.link)}</span>`:''} </div> <div class="item-actions"> <button class="btn-icon edit transport-edit-btn" data-item-id="${item.id}" title="Modifica"><i class="fas fa-edit"></i></button> <button class="btn-icon delete transport-delete-btn" data-item-id="${item.id}" title="Elimina"><i class="fas fa-trash-alt"></i></button> </div>`; transportListUl.appendChild(li); }); if (!editingItemId.transport) addTransportItemForm.reset(); };
    const getTransportIcon = (type) => { switch(type) { case 'Volo': return 'fa-plane-departure'; case 'Treno': return 'fa-train'; case 'Auto': return 'fa-car'; case 'Bus': return 'fa-bus-alt'; case 'Traghetto': return 'fa-ship'; case 'Metro/Mezzi Pubblici': return 'fa-subway'; case 'Taxi/Ride Sharing': return 'fa-taxi'; default: return 'fa-road'; } };
    const renderAccommodations = (accommodationsInput = []) => { const items = Array.isArray(accommodationsInput) ? accommodationsInput : []; if (!accommodationListUl) return; accommodationListUl.innerHTML = ''; if(noAccommodationItemsP) noAccommodationItemsP.style.display = items.length === 0 ? 'block' : 'none'; if (!Array.isArray(items)) return; items.sort((a, b) => (a?.checkinDateTime || '').localeCompare(b?.checkinDateTime || '')); items.forEach(item => { if (!item || !item.id) return; const li = document.createElement('li'); li.dataset.itemId = item.id; const mapLink = createMapLink(item.address); li.innerHTML = ` <div class="item-details"> <strong><i class="fas fa-hotel fa-fw"></i> ${item.name || 'N/D'} (${item.type || 'N/D'})</strong> ${item.address ? `<span class="meta"><i class="fas fa-map-marker-alt fa-fw"></i> ${item.address} ${mapLink ? `<a href="${mapLink}" target="_blank" rel="noopener noreferrer" class="btn-map-link" title="Mostra Mappa"><i class="fas fa-map-marked-alt"></i></a>` : ''}</span>`:''} <span class="meta"><i class="fas fa-calendar-check fa-fw"></i> Check-in: ${formatDateTime(item.checkinDateTime)}</span> <span class="meta"><i class="fas fa-calendar-times fa-fw"></i> Check-out: ${formatDateTime(item.checkoutDateTime)}</span> ${item.bookingRef ? `<span class="meta"><i class="fas fa-key fa-fw"></i> Rif: ${item.bookingRef}</span>`:''} ${item.cost!==null ? `<span class="meta"><i class="fas fa-euro-sign fa-fw"></i> Costo: ${formatCurrency(item.cost)}</span>`:''} ${item.notes ? `<span class="meta"><i class="fas fa-info-circle fa-fw"></i> Note: ${item.notes}</span>`:''} ${item.link ? `<span class="meta"><i class="fas fa-link fa-fw"></i> Link: ${formatDisplayLink(item.link)}</span>`:''} </div> <div class="item-actions"> <button class="btn-icon edit accommodation-edit-btn" data-item-id="${item.id}" title="Modifica"><i class="fas fa-edit"></i></button> <button class="btn-icon delete accommodation-delete-btn" data-item-id="${item.id}" title="Elimina"><i class="fas fa-trash-alt"></i></button> </div>`; accommodationListUl.appendChild(li); }); if (!editingItemId.accommodation) addAccommodationItemForm.reset(); };
    const renderItinerary = (itineraryItemsInput) => { let items = Array.isArray(itineraryItemsInput) ? itineraryItemsInput : []; if (!itineraryListUl) return; itineraryListUl.innerHTML = ''; if(noItineraryItemsP) noItineraryItemsP.style.display = items.length === 0 ? 'block' : 'none'; if (!Array.isArray(items)) return; const searchTerm = currentSearchTerm.itinerary.toLowerCase(); if (searchTerm) { items = items.filter(item => (item.activity?.toLowerCase() || '').includes(searchTerm) || (item.location?.toLowerCase() || '').includes(searchTerm) || (item.notes?.toLowerCase() || '').includes(searchTerm)); } const sortKey = currentSort.itinerary; items.sort((a, b) => { if (sortKey === 'activity') { return (a?.activity || '').localeCompare(b?.activity || ''); } const dateTimeA = `${a?.day || ''} ${a?.time || ''}`; const dateTimeB = `${b?.day || ''} ${b?.time || ''}`; return dateTimeA.localeCompare(dateTimeB); }); items.forEach(item => { if (!item || !item.id) return; const li = document.createElement('li'); li.dataset.itemId = item.id; const mapLink = createMapLink(item.location); li.innerHTML = ` <div class="item-details"> <strong>${formatDate(item.day)} ${item.time?'('+item.time+')':''} - ${item.activity||'N/D'}</strong> ${item.location ? `<span class="meta"><i class="fas fa-map-marker-alt fa-fw"></i> ${item.location} ${mapLink ? `<a href="${mapLink}" target="_blank" rel="noopener noreferrer" class="btn-map-link" title="Mostra Mappa"><i class="fas fa-map-marked-alt"></i></a>` : ''}</span>`:''} ${item.bookingRef ? `<span class="meta"><i class="fas fa-ticket-alt fa-fw"></i> Rif: ${item.bookingRef}</span>`:''} ${item.cost!==null ? `<span class="meta"><i class="fas fa-euro-sign fa-fw"></i> Costo: ${formatCurrency(item.cost)}</span>`:''} ${item.notes ? `<span class="meta"><i class="fas fa-info-circle fa-fw"></i> Note: ${item.notes}</span>`:''} ${item.link ? `<span class="meta"><i class="fas fa-link fa-fw"></i> Link: ${formatDisplayLink(item.link)}</span>`:''} </div> <div class="item-actions"> <button class="btn-icon edit itinerary-edit-btn" data-item-id="${item.id}" title="Modifica"><i class="fas fa-edit"></i></button> <button class="btn-icon delete itinerary-delete-btn" data-item-id="${item.id}" title="Elimina"><i class="fas fa-trash-alt"></i></button> </div>`; itineraryListUl.appendChild(li); }); if (!editingItemId.itinerary) { addItineraryItemForm.reset(); const trip = findTripById(currentTripId); if (trip?.startDate) itineraryDayInput.value = trip.startDate; } };
    const renderBudget = (budgetData) => { const safeData = budgetData && typeof budgetData === 'object' ? budgetData : { items: [], estimatedTotal: 0, actualTotal: 0 }; let items = Array.isArray(safeData.items) ? safeData.items : []; if (!budgetListUl) return; budgetListUl.innerHTML = ''; if(noBudgetItemsP) noBudgetItemsP.style.display = items.length === 0 ? 'block' : 'none'; let calcEst = 0; let calcAct = 0; if (!Array.isArray(items)) return; const sortKey = currentSort.budget; items.sort((a, b) => { if (sortKey === 'estimatedDesc') { return (b?.estimated ?? 0) - (a?.estimated ?? 0); } if (sortKey === 'actualDesc') { return (b?.actual ?? -Infinity) - (a?.actual ?? -Infinity); } if (sortKey === 'description') { return (a?.description || '').localeCompare(b?.description || ''); } return (a?.category||'').localeCompare(b?.category||''); }); items.forEach(item => { if (!item || !item.id) return; const est = Number(item.estimated || 0); const act = item.actual === null || typeof item.actual === 'undefined' ? null : Number(item.actual || 0); if (!isNaN(est)) calcEst += est; if (act !== null && !isNaN(act)) calcAct += act; let cls = ''; if (act !== null && !isNaN(act) && est > 0) { if (act > est) cls = 'negative'; else if (act < est) cls = 'positive'; } const li = document.createElement('li'); li.dataset.itemId = item.id; li.innerHTML = ` <div class="item-details"> <strong>${item.category||'N/D'}: ${item.description||'N/D'}</strong> <span class="meta">Stimato: ${formatCurrency(est)} | Effettivo: <span class="${cls}">${act === null ? 'N/A' : formatCurrency(act)}</span></span> ${ (item.paidBy || item.splitBetween) ? `<span class="meta split-info"><i class="fas fa-user-friends fa-fw"></i> Pagato da: ${item.paidBy || '?'} / Diviso tra: ${item.splitBetween || '?'}</span>` : '' } </div> <div class="item-actions"> <button class="btn-icon edit budget-edit-btn" data-item-id="${item.id}" title="Modifica"><i class="fas fa-edit"></i></button> <button class="btn-icon delete budget-delete-btn" data-item-id="${item.id}" title="Elimina"><i class="fas fa-trash-alt"></i></button> </div>`; budgetListUl.appendChild(li); }); if(budgetTotalEstimatedStrong) budgetTotalEstimatedStrong.textContent = formatCurrency(calcEst); if(budgetTotalActualStrong) budgetTotalActualStrong.textContent = formatCurrency(calcAct); const diff = calcAct - calcEst; if (budgetDifferenceStrong) { budgetDifferenceStrong.textContent = formatCurrency(diff); budgetDifferenceStrong.className = ''; if (diff < 0) budgetDifferenceStrong.classList.add('positive'); else if (diff > 0) budgetDifferenceStrong.classList.add('negative'); } const trip = findTripById(currentTripId); if (trip) { if (!trip.budget) trip.budget = { items: [], estimatedTotal: 0, actualTotal: 0 }; trip.budget.estimatedTotal = calcEst; trip.budget.actualTotal = calcAct; } if (!editingItemId.budget) { addBudgetItemForm.reset(); } };
    const renderPackingList = (itemsInput = []) => { let items = Array.isArray(itemsInput) ? itemsInput : []; if (!packingListUl) return; packingListUl.innerHTML = ''; if(noPackingItemsP) noPackingItemsP.style.display = items.length === 0 ? 'block' : 'none'; if (!Array.isArray(items)) return; const searchTerm = currentSearchTerm.packing.toLowerCase(); if (searchTerm) { items = items.filter(item => (item.name?.toLowerCase() || '').includes(searchTerm) || (item.category?.toLowerCase() || '').includes(searchTerm)); } const sortKey = currentSort.packing; items.sort((a, b) => { if (sortKey === 'category') { return (a?.category || 'zzz').localeCompare(b?.category || 'zzz') || (a?.name || '').localeCompare(b?.name || ''); } if (sortKey === 'status') { const packedA = a.packed ? 1 : 0; const packedB = b.packed ? 1 : 0; return packedA - packedB || (a?.name || '').localeCompare(b?.name || ''); } return (a?.name||'').localeCompare(b?.name||''); }); if (sortKey === 'category') { const grouped = items.reduce((acc, item) => { const cat = item.category || 'Altro'; if (!acc[cat]) acc[cat] = []; acc[cat].push(item); return acc; }, {}); const sortedCategories = Object.keys(grouped).sort((a, b) => (a === 'Altro' ? 1 : b === 'Altro' ? -1 : a.localeCompare(b))); packingListUl.innerHTML = ''; sortedCategories.forEach(category => { const groupDiv = document.createElement('div'); groupDiv.classList.add('packing-list-category-group'); const title = document.createElement('h5'); title.textContent = category; groupDiv.appendChild(title); const groupUl = document.createElement('ul'); groupUl.classList.add('item-list', 'packing-list', 'nested'); grouped[category].forEach(item => groupUl.appendChild(createPackingListItem(item))); groupDiv.appendChild(groupUl); packingListUl.appendChild(groupDiv); }); } else { items.forEach(item => packingListUl.appendChild(createPackingListItem(item))); } if (!editingItemId.packing) { addPackingItemForm.reset(); if(packingItemQuantityInput) packingItemQuantityInput.value = 1; } };
    const createPackingListItem = (item) => { if (!item || !item.id) return document.createDocumentFragment(); const li = document.createElement('li'); li.dataset.itemId = item.id; li.classList.toggle('packed', item.packed); li.innerHTML = ` <div class="form-check"> <input class="form-check-input packing-checkbox" type="checkbox" id="pack-${item.id}" data-item-id="${item.id}" ${item.packed?'checked':''}> <label class="form-check-label" for="pack-${item.id}"> ${item.name||'N/D'} ${item.quantity > 1 ? `<span class="packing-quantity">(x${item.quantity})</span>` : ''} </label> </div> <div class="item-details"> ${item.category && item.category !== 'Altro' ? `<span class="packing-category">${item.category}</span>` : ''} </div> <div class="item-actions"> <button class="btn-icon edit packing-edit-btn" data-item-id="${item.id}" title="Modifica"><i class="fas fa-edit"></i></button> <button class="btn-icon delete packing-delete-btn" data-item-id="${item.id}" title="Elimina"><i class="fas fa-trash-alt"></i></button> </div>`; return li; };
    const handleTogglePacked = (itemId, isPacked) => { if (!currentTripId) return; const trip = findTripById(currentTripId); if (!trip) return; trip.packingList = Array.isArray(trip.packingList) ? trip.packingList : []; const idx = trip.packingList.findIndex(i => i && i.id === itemId); if (idx > -1) { trip.packingList[idx].packed = isPacked; saveTrips(); if (currentSort.packing === 'status') { renderPackingList(trip.packingList); } } };
    const handleImportPackingList = (type) => { if (!currentTripId || !PREDEFINED_PACKING_LISTS[type]) return; const trip = findTripById(currentTripId); if (!trip) return; const predefined = PREDEFINED_PACKING_LISTS[type]; let added = 0; trip.packingList = Array.isArray(trip.packingList) ? trip.packingList : []; const currentLower = trip.packingList.map(i => (i?.name || '').toLowerCase()); predefined.forEach(predefItem => { if (!currentLower.includes(predefItem.name.toLowerCase())) { trip.packingList.push({ id: generateId('pack'), name: predefItem.name, packed: false, category: predefItem.category || 'Altro', quantity: predefItem.quantity || 1 }); added++; }}); if (added > 0) { saveTrips(); renderPackingList(trip.packingList); populatePackingCategoriesDatalist(trip.packingList); showToast(`${added} oggetti aggiunti!`, 'success'); } else { showToast(`Nessun nuovo oggetto da aggiungere.`, 'info'); } };
    const handleDeleteItem = (listType, itemId) => { if (!currentTripId) return; const trip = findTripById(currentTripId); if (!trip) return; let list, renderFn, listOwner = trip; let itemName = "voce"; switch(listType) { case 'participant': list = trip.participants; renderFn = renderParticipants; itemName="partecipante"; break; case 'reminder': list = trip.reminders; renderFn = renderReminders; itemName="promemoria"; break; case 'transport': list = trip.transportations; renderFn = renderTransportations; itemName="trasporto"; break; case 'accommodation': list = trip.accommodations; renderFn = renderAccommodations; itemName="alloggio"; break; case 'itinerary': list = trip.itinerary; renderFn = renderItinerary; itemName="attività"; break; case 'budget': list = trip.budget.items; renderFn = renderBudget; listOwner = trip.budget; itemName="spesa"; break; case 'packing': list = trip.packingList; renderFn = renderPackingList; itemName="oggetto"; break; default: return; } if (!Array.isArray(list)) { console.error(`handleDeleteItem: ${listType} non array`); return; } const itemIndex = list.findIndex(item => item && item.id === itemId); if (itemIndex > -1) { const itemDesc = list[itemIndex].name || list[itemIndex].description || list[itemIndex].activity || `ID: ${itemId}`; showConfirmationModal( `Conferma Eliminazione ${itemName}`, `Eliminare "${itemDesc}"?`, () => { list.splice(itemIndex, 1); saveTrips(); if (listType === 'budget') { renderFn(listOwner); } else { renderFn(list); } if (editingItemId[listType] === itemId) resetEditState(listType); showToast(`${itemName.charAt(0).toUpperCase() + itemName.slice(1)} eliminato/a.`, 'info'); if(listType === 'participant') populateDatalists(trip); if(listType === 'packing') populatePackingCategoriesDatalist(trip.packingList); }); } };

    // ==========================================================================
    // == FUNZIONE AGGIUNGI COSTO AL BUDGET ==
    // ==========================================================================
    const addCostToBudget = (category, description, cost) => { if (!currentTripId || cost === null || cost <= 0) return; const trip = findTripById(currentTripId); if (!trip) return; const budgetItem = { id: generateId('budget'), category: category, description: description, estimated: cost, actual: null, paidBy: null, splitBetween: null }; if (!trip.budget) trip.budget = { items: [], estimatedTotal: 0, actualTotal: 0 }; if (!Array.isArray(trip.budget.items)) trip.budget.items = []; trip.budget.items.push(budgetItem); saveTrips(); renderBudget(trip.budget); };
    const handleCalculateAndAddTransportCost = () => { if (!currentTripId) { showToast("Seleziona un viaggio.", "error"); return; } const trip = findTripById(currentTripId); if (!trip || !Array.isArray(trip.transportations)) { showToast("Errore dati trasporti.", "error"); return; } let totalCost = 0; trip.transportations.forEach(item => { const cost = Number(item?.cost || 0); if (!isNaN(cost) && cost > 0) { totalCost += cost; } }); if (totalCost <= 0) { showToast("Nessun costo trasporto trovato.", "info"); return; } addCostToBudget("Trasporti", `Totale Costi Trasporti (del ${formatDate(new Date().toISOString().slice(0,10))})`, totalCost); showToast(`Costo trasporti (${formatCurrency(totalCost)}) aggiunto al budget!`, 'success'); switchTab('budget-tab'); };

    // ==========================================================================
    // == FUNZIONI UI ==
    // ==========================================================================
    const switchTab = (tabId) => { if (!tabId) return; document.querySelectorAll(".tab-content").forEach(t => { t.style.display="none"; t.classList.remove("active"); }); document.querySelectorAll(".tab-link").forEach(l => l.classList.remove("active")); const c = document.getElementById(tabId); const l = tabsContainer?.querySelector(`.tab-link[data-tab="${tabId}"]`); if(c){ c.style.display="block"; setTimeout(()=>c.classList.add("active"),10); } else { console.error(`Contenuto tab ${tabId} non trovato`); } if(l) l.classList.add("active"); else { console.error(`Link tab ${tabId} non trovato`); }};
    const toggleSearchButtonsVisibility = () => { if (!transportTypeSelect) return; const type = transportTypeSelect.value; if(searchSkyscannerBtn) searchSkyscannerBtn.style.display = (type === 'Volo') ? 'inline-flex' : 'none'; if(searchTrainlineBtn) searchTrainlineBtn.style.display = (type === 'Treno') ? 'inline-flex' : 'none'; };
    const handleSortChange = (listType, selectElement) => { if (!currentTripId) return; const trip = findTripById(currentTripId); if (!trip) return; currentSort[listType] = selectElement.value; switch(listType) { case 'reminder': renderReminders(trip.reminders); break; case 'transport': renderTransportations(trip.transportations); break; case 'itinerary': renderItinerary(trip.itinerary); break; case 'budget': renderBudget(trip.budget); break; case 'packing': renderPackingList(trip.packingList); break; } };
    const applyCurrentSortToControls = () => { if(reminderSortControl) reminderSortControl.value = currentSort.reminder; if(transportSortControl) transportSortControl.value = currentSort.transport; if(itinerarySortControl) itinerarySortControl.value = currentSort.itinerary; if(budgetSortControl) budgetSortControl.value = currentSort.budget; if(packingSortControl) packingSortControl.value = currentSort.packing; };
    const handleInternalSearch = (listType, inputElement) => { if (!currentTripId) return; const trip = findTripById(currentTripId); if (!trip) return; currentSearchTerm[listType] = inputElement.value.toLowerCase(); if (listType === 'itinerary') renderItinerary(trip.itinerary); else if (listType === 'packing') renderPackingList(trip.packingList); };

    // ==========================================================================
    // == FUNZIONI RICERCA ESTERNA ==
    // ==========================================================================
     const handleSearchFlights = () => { const origin = transportDepartureLocInput.value.trim(); const dest = transportArrivalLocInput.value.trim(); const startRaw = transportDepartureDatetimeInput.value ? transportDepartureDatetimeInput.value.split('T')[0] : ''; const endRaw = transportArrivalDatetimeInput.value ? transportArrivalDatetimeInput.value.split('T')[0] : ''; const startSky = formatSkyscannerDate(startRaw); const endSky = formatSkyscannerDate(endRaw); if (!origin || !dest) { showToast("Inserisci Origine e Destinazione nel form.", "warning"); return; } if (!startSky || !endSky) { showToast("Inserisci date valide nel form.", "warning"); return; } if (startRaw > endRaw) { showToast("Data arrivo non valida.", "warning"); return; } const base = "https://www.skyscanner.it/trasporti/voli/"; const origCode = origin.toLowerCase().replace(/\s+/g, '-') || 'anywhere'; const destCode = dest.toLowerCase().replace(/\s+/g, '-') || 'anywhere'; const url = `${base}${origCode}/${destCode}/${startSky}/${endSky}/?rtn=1&adults=1&children=0&infants=0&cabinclass=economy&preferdirects=false`; console.log("URL Skyscanner:", url); window.open(url, '_blank', 'noopener,noreferrer'); };
    const handleSearchTrains = () => { const origin = transportDepartureLocInput.value.trim(); const dest = transportArrivalLocInput.value.trim(); const startRaw = transportDepartureDatetimeInput.value ? transportDepartureDatetimeInput.value.split('T')[0] : ''; const endRaw = transportArrivalDatetimeInput.value ? transportArrivalDatetimeInput.value.split('T')[0] : ''; if (!origin || !dest) { showToast("Inserisci Origine e Destinazione.", "warning"); return; } if (!startRaw.match(/^\d{4}-\d{2}-\d{2}$/) || !endRaw.match(/^\d{4}-\d{2}-\d{2}$/)) { showToast("Inserisci Date valide.", "warning"); return; } if (startRaw > endRaw) { showToast("Data arrivo non valida.", "warning"); return; } const base = "https://www.thetrainline.com/it/orari-treni/"; const origFmt = origin.toUpperCase().replace(/\s+/g, '-'); const destFmt = dest.toUpperCase().replace(/\s+/g, '-'); const url = `${base}${origFmt}-a-${destFmt}?departureDate=${startRaw}&returnDate=${endRaw}&adults=1`; console.log("URL Trainline:", url); window.open(url, '_blank', 'noopener,noreferrer'); };

    // ==========================================================================
    // == FUNZIONI DOWNLOAD ==
    // ==========================================================================
    const handleDownloadText = () => { if (!currentTripId) { showToast("Seleziona un viaggio.", "error"); return; } const trip = findTripById(currentTripId); if (!trip) return; let content = `Riepilogo Viaggio: ${trip.name || 'S.N.'} ${trip.isTemplate ? '(TEMPLATE)' : ''}\n========================\n\n`; content += `**INFO**\nOrigine: ${trip.originCity || 'N/D'}\nDest.: ${trip.destination || 'N/D'}\nDate: ${formatDate(trip.startDate)} - ${formatDate(trip.endDate)}\nNote: ${trip.notes || '-'}\nExtra Info: ${trip.extraInfo || '-'}\n\n`; content += `**PARTECIPANTI** (${(trip.participants || []).length})\n`; (trip.participants || []).slice().sort((a,b)=>(a?.name||'').localeCompare(b?.name||'')).forEach(p => { content += `- ${p.name}${p.notes ? ' ('+p.notes+')':''}${p.extraInfo ? ' [Extra: '+p.extraInfo+']':''}\n`}); if((trip.participants || []).length === 0) content += "Nessuno\n"; content += "\n"; content += `**PROMEMORIA** (${(trip.reminders || []).length})\n`; (trip.reminders || []).slice().sort((a,b)=>(a?.dueDate || '9999').localeCompare(b?.dueDate || '9999')).forEach(r => { content += `- [${r.status==='done'?'X':' '}] ${r.description}${r.dueDate ? ' (Scad: '+formatDate(r.dueDate)+')':''}\n`}); if((trip.reminders || []).length === 0) content += "Nessuno\n"; content += "\n"; content += `**TRASPORTI** (${(trip.transportations || []).length})\n`; (trip.transportations || []).slice().sort((a,b)=>(a?.departureDateTime||'').localeCompare(b?.departureDateTime||'')).forEach(i => { content += `- ${i.type} (${i.description}): Da ${i.departureLoc||'?'} (${formatDateTime(i.departureDateTime)}) a ${i.arrivalLoc||'?'} (${formatDateTime(i.arrivalDateTime)})${i.cost!==null ? ' Costo: '+formatCurrency(i.cost):''}${i.bookingRef ? ' Rif: '+i.bookingRef:''}${i.notes ? ' Note: '+i.notes:''}${i.link ? ' Link: '+i.link:''}\n` }); if((trip.transportations || []).length === 0) content += "Nessuno\n"; content += "\n"; content += `**ALLOGGI** (${(trip.accommodations || []).length})\n`; (trip.accommodations || []).slice().sort((a,b)=>(a?.checkinDateTime||'').localeCompare(b?.checkinDateTime||'')).forEach(i => { content += `- ${i.name} (${i.type}): ${i.address||'?'}. CheckIn: ${formatDateTime(i.checkinDateTime)}, CheckOut: ${formatDateTime(i.checkoutDateTime)}${i.cost!==null ? ' Costo: '+formatCurrency(i.cost):''}${i.bookingRef ? ' Rif: '+i.bookingRef:''}${i.notes ? ' Note: '+i.notes:''}${i.link ? ' Link: '+i.link:''}\n` }); if((trip.accommodations || []).length === 0) content += "Nessuno\n"; content += "\n"; content += `**ITINERARIO** (${(trip.itinerary || []).length})\n`; (trip.itinerary || []).slice().sort((a,b)=>{const d=(a?.day||'').localeCompare(b?.day||''); return d!==0?d:(a?.time||'').localeCompare(b?.time||'');}).forEach(i => { content += `- ${formatDate(i.day)}${i.time?' ('+i.time+')':''} ${i.activity}${i.location?' @'+i.location:''}${i.bookingRef?' [Rif:'+i.bookingRef+']':''}${i.cost!==null?' Costo:'+formatCurrency(i.cost):''}${i.notes?' ('+i.notes+')':''}${i.link?' Link:'+i.link:''}\n` }); if((trip.itinerary || []).length === 0) content += "Nessuno\n"; content += "\n"; content += `**BUDGET** (${(trip.budget?.items || []).length} voci)\n`; (trip.budget?.items || []).slice().sort((a,b)=>(a?.category||'').localeCompare(b?.category||'')).forEach(i => { content += `- ${i.category}: ${i.description} (Est: ${formatCurrency(i.estimated)}, Act: ${i.actual===null?'N/A':formatCurrency(i.actual)})${i.paidBy ? ' Pagato da: '+i.paidBy:''}${i.splitBetween ? ' Diviso: '+i.splitBetween:''}\n` }); if((trip.budget?.items || []).length > 0) content += `> Tot Est: ${formatCurrency(trip.budget?.estimatedTotal||0)}, Tot Act: ${formatCurrency(trip.budget?.actualTotal||0)}, Diff: ${formatCurrency((trip.budget?.actualTotal||0) - (trip.budget?.estimatedTotal||0))}\n`; else content += "Nessuna spesa\n"; content += "\n"; content += `**PACKING LIST** (${(trip.packingList || []).length})\n`; (trip.packingList || []).slice().sort((a,b)=>(a?.category||'zzz').localeCompare(b?.category||'zzz') || (a?.name||'').localeCompare(b?.name||'')).forEach(i => { content += `- [${i.packed?'X':' '}] ${i.name}${i.quantity>1?' (x'+i.quantity+')':''} [${i.category||'Altro'}]\n` }); if((trip.packingList || []).length === 0) content += "Lista vuota\n"; const blob = new Blob([content],{type:'text/plain;charset=utf-8'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=`Viaggio-${(trip.name||'SN').replace(/[^a-z0-9]/gi,'_')}.txt`; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url); };
    const handleDownloadExcel = () => { if (!currentTripId) { showToast("Seleziona un viaggio.", "error"); return; } const trip = findTripById(currentTripId); if (!trip) return; try { const wb = XLSX.utils.book_new(); const cf = '#,##0.00 €'; const nf = '#,##0'; const summary = [ ["Voce","Dettaglio"], ["Viaggio", trip.name||'S.N.'], ["Template", trip.isTemplate ? 'Sì' : 'No'], ["Origine", trip.originCity||'N/D'], ["Dest.", trip.destination||'N/D'], ["Periodo", `${formatDate(trip.startDate)} - ${formatDate(trip.endDate)}`], ["Note", trip.notes||'-'], ["Extra Info", trip.extraInfo||'-'], [], ["Budget Est.",{t:'n',v:trip.budget?.estimatedTotal||0,z:cf}], ["Budget Act.",{t:'n',v:trip.budget?.actualTotal||0,z:cf}], ["Diff.",{t:'n',v:(trip.budget?.actualTotal||0)-(trip.budget?.estimatedTotal||0),z:cf}], [], ["# Partecipanti", (trip.participants||[]).length], ["# Promemoria", (trip.reminders||[]).length], ["# Trasporti", (trip.transportations||[]).length], ["# Alloggi", (trip.accommodations||[]).length], ["# Itin.", (trip.itinerary||[]).length], ["# Budget", (trip.budget?.items||[]).length], ["# Packing", (trip.packingList||[]).length]]; const wsSum = XLSX.utils.aoa_to_sheet(summary); wsSum['!cols']=[{wch:15},{wch:50}]; XLSX.utils.book_append_sheet(wb, wsSum, "Riepilogo"); const partH = ["Nome", "Note", "Extra Info"]; const partD = (trip.participants||[]).slice().sort((a,b)=>(a?.name||'').localeCompare(b?.name||'')).map(p=>[p.name, p.notes, p.extraInfo]); const wsPart = XLSX.utils.aoa_to_sheet([partH, ...partD]); wsPart['!cols']=[{wch:30},{wch:40},{wch:40}]; XLSX.utils.book_append_sheet(wb, wsPart, "Partecipanti"); const remH = ["Stato", "Descrizione", "Scadenza"]; const remD = (trip.reminders||[]).slice().sort((a,b)=>(a?.dueDate || '9999').localeCompare(b?.dueDate || '9999')).map(r => [r.status === 'done' ? 'Fatto' : 'Da Fare', r.description, formatDate(r.dueDate)]); const wsRem = XLSX.utils.aoa_to_sheet([remH, ...remD]); wsRem['!cols'] = [{wch:10}, {wch:50}, {wch:12}]; XLSX.utils.book_append_sheet(wb, wsRem, "Promemoria"); const th = ["Tipo","Desc.","Da Luogo","Da Data/Ora","A Luogo","A Data/Ora","Rif.","Costo","Note","Link/File"]; const td = (trip.transportations||[]).slice().sort((a,b)=>(a?.departureDateTime||'').localeCompare(b?.departureDateTime||'')).map(i=>[i.type, i.description, i.departureLoc, formatDateTime(i.departureDateTime), i.arrivalLoc, formatDateTime(i.arrivalDateTime), i.bookingRef, i.cost===null?null:{t:'n',v:i.cost,z:cf}, i.notes, i.link]); const wsT = XLSX.utils.aoa_to_sheet([th, ...td]); wsT['!cols']=[{wch:12},{wch:25},{wch:18},{wch:16},{wch:18},{wch:16},{wch:15},{wch:12},{wch:25},{wch:30}]; XLSX.utils.book_append_sheet(wb, wsT, "Trasporti"); const ah = ["Nome","Tipo","Indirizzo","CheckIn","CheckOut","Rif.","Costo","Note","Link/File"]; const ad = (trip.accommodations||[]).slice().sort((a,b)=>(a?.checkinDateTime||'').localeCompare(b?.checkinDateTime||'')).map(i=>[i.name,i.type,i.address,formatDateTime(i.checkinDateTime),formatDateTime(i.checkoutDateTime),i.bookingRef,i.cost===null?null:{t:'n',v:i.cost,z:cf},i.notes, i.link]); const wsA = XLSX.utils.aoa_to_sheet([ah,...ad]); wsA['!cols']=[{wch:25},{wch:10},{wch:35},{wch:16},{wch:16},{wch:20},{wch:12},{wch:30},{wch:30}]; XLSX.utils.book_append_sheet(wb, wsA, "Alloggi"); const ih = ["Giorno","Ora","Attività","Luogo","Rif. Pren.","Costo","Note","Link/File"]; const idata = (trip.itinerary||[]).slice().sort((a,b)=>{const d=(a?.day||'').localeCompare(b?.day||''); return d!==0?d:(a?.time||'').localeCompare(b?.time||'');}).map(i=>[formatDate(i.day),i.time,i.activity,i.location,i.bookingRef,i.cost===null?null:{t:'n',v:i.cost,z:cf},i.notes, i.link]); const wsI = XLSX.utils.aoa_to_sheet([ih, ...idata]); wsI['!cols']=[{wch:10},{wch:8},{wch:30},{wch:25},{wch:20},{wch:12},{wch:30},{wch:30}]; XLSX.utils.book_append_sheet(wb, wsI, "Itinerario"); const bh = ["Cat.","Desc.","Est. (€)","Act. (€)", "Pagato Da", "Diviso Tra"]; const bd = (trip.budget?.items||[]).slice().sort((a,b)=>(a?.category||'').localeCompare(b?.category||'')).map(i=>[i.category,i.description,{t:'n',v:i.estimated||0,z:cf},i.actual===null?null:{t:'n',v:i.actual,z:cf}, i.paidBy, i.splitBetween]); bd.push([],["TOTALI","", {t:'n',v:trip.budget?.estimatedTotal||0,z:cf}, {t:'n',v:trip.budget?.actualTotal||0,z:cf}, "", ""]); const wsB = XLSX.utils.aoa_to_sheet([bh, ...bd]); wsB['!cols']=[{wch:15},{wch:35},{wch:15},{wch:15},{wch:20},{wch:20}]; XLSX.utils.book_append_sheet(wb, wsB, "Budget"); const ph = ["Categoria", "Oggetto", "Qtà", "Fatto?"]; const pd = (trip.packingList||[]).slice().sort((a,b)=>(a?.category||'zzz').localeCompare(b?.category||'zzz') || (a?.name||'').localeCompare(b?.name||'')).map(i=>[i.category, i.name, {t:'n', v:i.quantity, z:nf}, i.packed?'Sì':'No']); const wsP = XLSX.utils.aoa_to_sheet([ph, ...pd]); wsP['!cols']=[{wch:20}, {wch:40},{wch:5},{wch:8}]; XLSX.utils.book_append_sheet(wb, wsP, "Packing List"); const fn = `Viaggio-${(trip.name||'SN').replace(/[^a-z0-9]/gi,'_')}.xlsx`; XLSX.writeFile(wb, fn); } catch(e){ console.error("Err Excel:",e); showToast("Errore creazione Excel.", "error"); } };

    // ==========================================================================
    // == FUNZIONI CONDIVISIONE VIA FIREBASE (Versione Finale) ==
    // ==========================================================================
    const handleShareTrip = async () => {
        if (!db) { showToast("Funzionalità di condivisione non disponibile (Errore Init Firebase).", "error"); return; }
        if (!currentTripId) { showToast("Seleziona un viaggio da condividere.", "warning"); return; }
        const originalTrip = findTripById(currentTripId);
        if (!originalTrip) { showToast("Errore: viaggio non trovato.", "error"); return; }
        if (originalTrip.isTemplate) { showToast("Non puoi condividere un template.", "warning"); return; }

        if (shareTripBtn) {
            shareTripBtn.disabled = true;
            shareTripBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Preparando...';
        }

        let dataToSend = null;

        try {
            const cleanTripBase = JSON.parse(JSON.stringify(originalTrip));
            dataToSend = {
                name: cleanTripBase.name || 'Senza Nome',
                originCity: cleanTripBase.originCity || null,
                destination: cleanTripBase.destination || null,
                notes: cleanTripBase.notes || null,
                extraInfo: cleanTripBase.extraInfo || null,
                startDate: toTimestampOrNull(cleanTripBase.startDate),
                endDate: toTimestampOrNull(cleanTripBase.endDate),
                participants: (cleanTripBase.participants || []).map(p => ({ name: p.name || '?', notes: p.notes || null, extraInfo: p.extraInfo || null })),
                reminders: (cleanTripBase.reminders || []).map(r => ({ description: r.description || '?', dueDate: toTimestampOrNull(r.dueDate), status: r.status || 'todo' })),
                transportations: (cleanTripBase.transportations || []).map(t => ({ type: t.type || 'Altro', description: t.description || '?', departureLoc: t.departureLoc || null, departureDateTime: toTimestampOrNull(t.departureDateTime), arrivalLoc: t.arrivalLoc || null, arrivalDateTime: toTimestampOrNull(t.arrivalDateTime), bookingRef: t.bookingRef || null, cost: safeToNumberOrNull(t.cost), notes: t.notes || null, link: t.link || null })),
                accommodations: (cleanTripBase.accommodations || []).map(a => ({ name: a.name || '?', type: a.type || 'Altro', address: a.address || null, checkinDateTime: toTimestampOrNull(a.checkinDateTime), checkoutDateTime: toTimestampOrNull(a.checkoutDateTime), bookingRef: a.bookingRef || null, cost: safeToNumberOrNull(a.cost), notes: a.notes || null, link: a.link || null })),
                itinerary: (cleanTripBase.itinerary || []).map(i => ({ day: i.day || null, time: i.time || null, activity: i.activity || '?', location: i.location || null, bookingRef: i.bookingRef || null, cost: safeToNumberOrNull(i.cost), notes: i.notes || null, link: i.link || null })),
                budget: { items: (cleanTripBase.budget?.items || []).map(b => ({ category: b.category || 'Altro', description: b.description || '?', estimated: safeToNumberOrNull(b.estimated), actual: safeToNumberOrNull(b.actual), paidBy: b.paidBy || null, splitBetween: b.splitBetween || null })) },
                packingList: (cleanTripBase.packingList || []).map(p => ({ name: p.name || '?', category: p.category || 'Altro', quantity: safeToPositiveIntegerOrDefault(p.quantity), packed: p.packed || false })),
                sharedAt: Timestamp.now()
            };

            console.log("Invio a Firestore (versione completa):", JSON.stringify(dataToSend, null, 2));
            if (shareTripBtn) shareTripBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando...';

            const docRef = await addDoc(collection(db, "sharedTrips"), dataToSend);
            console.log("Viaggio condiviso con ID: ", docRef.id);

            const shareLink = `${window.location.origin}${window.location.pathname}?shareId=${docRef.id}`;
            prompt("Copia questo link per condividere il viaggio:", shareLink);
            showToast("Link di condivisione generato!", "success");

        } catch (error) {
            console.error("Errore durante la condivisione del viaggio:", error);
            console.error("Dati inviati (potrebbero essere parziali o problematici):", dataToSend);
            showToast("Errore durante la condivisione. Controlla la console.", "error");
        } finally {
            if (shareTripBtn) {
                shareTripBtn.disabled = false;
                shareTripBtn.innerHTML = '<i class="fas fa-share-alt"></i> Condividi';
            }
        }
    };

    const cloneAndRegenerateTripIds = (tripDataFromFirebase) => {
        const tripDataWithStrings = convertTimestampsToStrings(tripDataFromFirebase);
        const newTrip = JSON.parse(JSON.stringify(tripDataWithStrings));
        newTrip.id = generateId('trip');
        newTrip.isTemplate = false;

        const regenerateSubItemsIds = (items) => {
            if (!Array.isArray(items)) return [];
            return items.map(item => ({ ...item, id: generateId(item?.id?.split('_')[0] || 'item') }));
        };

        newTrip.participants = regenerateSubItemsIds(newTrip.participants);
        newTrip.reminders = regenerateSubItemsIds(newTrip.reminders);
        newTrip.transportations = regenerateSubItemsIds(newTrip.transportations);
        newTrip.accommodations = regenerateSubItemsIds(newTrip.accommodations);
        newTrip.itinerary = regenerateSubItemsIds(newTrip.itinerary);
        if (!newTrip.budget) newTrip.budget = { items: [], estimatedTotal: 0, actualTotal: 0 };
        newTrip.budget.items = regenerateSubItemsIds(newTrip.budget.items);
        newTrip.packingList = regenerateSubItemsIds(newTrip.packingList);

        let calcEst = 0;
        let calcAct = 0;
        (newTrip.budget.items || []).forEach(item => {
            const est = safeToNumberOrNull(item.estimated);
            const act = safeToNumberOrNull(item.actual);
            if (est !== null) calcEst += est;
            if (act !== null) calcAct += act;
        });
        newTrip.budget.estimatedTotal = calcEst;
        newTrip.budget.actualTotal = calcAct;

        return newTrip;
    }

    const handleImportSharedTrip = (sharedTripData) => {
        if (!sharedTripData) return;
        try {
            const newTrip = cloneAndRegenerateTripIds(sharedTripData);
            trips.push(newTrip);
            saveTrips();
            currentTripId = null;
            renderTripList();
            selectTrip(newTrip.id);
            showToast(`Viaggio "${newTrip.name || 'Senza Nome'}" importato con successo!`, "success");
            // URL già pulito da checkForSharedTrip
        } catch (error) {
            console.error("Errore durante l'importazione del viaggio condiviso:", error);
            showToast("Errore durante l'importazione del viaggio.", "error");
        }
    };

    const checkForSharedTrip = async () => {
         if (!db) { console.warn("Firestore non inizializzato, impossibile controllare viaggi condivisi."); return; }
        const urlParams = new URLSearchParams(window.location.search);
        const shareId = urlParams.get('shareId');

        if (shareId) {
            console.log("Trovato shareId:", shareId);
            const currentUrl = new URL(window.location.href);
            currentUrl.searchParams.delete('shareId');
            history.replaceState(null, '', currentUrl.toString());

            showToast("Recupero viaggio condiviso...", "info");
            try {
                const docRef = doc(db, "sharedTrips", shareId);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const sharedTripData = docSnap.data();
                    console.log("Dati viaggio recuperati:", sharedTripData);
                    showConfirmationModal(
                        'Importa Viaggio Condiviso',
                        `È stato condiviso con te il viaggio "${sharedTripData.name || 'Senza Nome'}". Vuoi importarlo?`,
                        () => handleImportSharedTrip(sharedTripData)
                    );
                } else {
                    console.warn("Nessun viaggio trovato con questo shareId:", shareId);
                    showToast("Viaggio condiviso non trovato o scaduto.", "error");
                }
            } catch (error) {
                console.error("Errore nel recuperare il viaggio condiviso:", error);
                showToast("Errore nel recuperare il viaggio condiviso.", "error");
            }
        }
    };

    // ==========================================================================
    // == INIZIALIZZAZIONE E EVENT LISTENER ==
    // ==========================================================================
    const executeConfirmAction = () => { if (typeof confirmActionCallback === 'function') { try { confirmActionCallback(); } catch(err) { console.error("Errore durante esecuzione callback conferma:", err); showToast("Si è verificato un errore.", "error"); } } closeConfirmationModal(); };

    const init = () => {
        loadTrips();
        renderTripList();
        deselectTrip();
        applyCurrentSortToControls();

        // Listener Globali Sidebar
        if (newTripBtn) newTripBtn.addEventListener('click', handleNewTrip);
        if (createFromTemplateBtn) createFromTemplateBtn.addEventListener('click', openSelectTemplateModal);
        if (searchTripInput) searchTripInput.addEventListener('input', handleSearchTrip);

        // Listener Dettagli Viaggio Generali
        if (tripInfoForm) tripInfoForm.addEventListener('submit', handleSaveTripInfo);
        if (deleteTripBtn) deleteTripBtn.addEventListener('click', () => { if (currentTripId) handleDeleteTrip(currentTripId); });
        if (downloadTextBtn) downloadTextBtn.addEventListener('click', handleDownloadText);
        if (downloadExcelBtn) downloadExcelBtn.addEventListener('click', handleDownloadExcel);
        if (tabsContainer) tabsContainer.addEventListener('click', (e) => { const tl = e.target.closest('.tab-link'); if (tl?.dataset.tab) switchTab(tl.dataset.tab); });
        if (shareTripBtn) shareTripBtn.addEventListener('click', handleShareTrip);

        // Listener Submit Forms
        if (addParticipantForm) addParticipantForm.addEventListener('submit', (e) => handleItemFormSubmit(e, 'participant'));
        if (addReminderItemForm) addReminderItemForm.addEventListener('submit', (e) => handleItemFormSubmit(e, 'reminder'));
        if (addTransportItemForm) addTransportItemForm.addEventListener('submit', (e) => handleItemFormSubmit(e, 'transport'));
        if (addAccommodationItemForm) addAccommodationItemForm.addEventListener('submit', (e) => handleItemFormSubmit(e, 'accommodation'));
        if (addItineraryItemForm) addItineraryItemForm.addEventListener('submit', (e) => handleItemFormSubmit(e, 'itinerary'));
        if (addBudgetItemForm) addBudgetItemForm.addEventListener('submit', (e) => handleItemFormSubmit(e, 'budget'));
        if (addPackingItemForm) addPackingItemForm.addEventListener('submit', (e) => handleItemFormSubmit(e, 'packing'));

        // Listener Annulla Modifica
        if (participantCancelEditBtn) participantCancelEditBtn.addEventListener('click', () => resetEditState('participant'));
        if (reminderCancelEditBtn) reminderCancelEditBtn.addEventListener('click', () => resetEditState('reminder'));
        if (transportCancelEditBtn) transportCancelEditBtn.addEventListener('click', () => resetEditState('transport'));
        if (accommodationCancelEditBtn) accommodationCancelEditBtn.addEventListener('click', () => resetEditState('accommodation'));
        if (itineraryCancelEditBtn) itineraryCancelEditBtn.addEventListener('click', () => resetEditState('itinerary'));
        if (budgetCancelEditBtn) budgetCancelEditBtn.addEventListener('click', () => resetEditState('budget'));
        if (packingCancelEditBtn) packingCancelEditBtn.addEventListener('click', () => resetEditState('packing'));

         // Listener Delegati per Azioni Liste
        if (tripDetailsAreaDiv) tripDetailsAreaDiv.addEventListener('click', (e) => { const editBtn = e.target.closest('.btn-icon.edit'); const deleteBtn = e.target.closest('.btn-icon.delete'); const packingCheckbox = e.target.closest('.packing-checkbox'); if (editBtn) { const itemId = editBtn.dataset.itemId; if(!itemId) return; if (editBtn.classList.contains('participant-edit-btn')) startEditItem('participant', itemId); else if (editBtn.classList.contains('reminder-edit-btn')) startEditItem('reminder', itemId); else if (editBtn.classList.contains('transport-edit-btn')) startEditItem('transport', itemId); else if (editBtn.classList.contains('accommodation-edit-btn')) startEditItem('accommodation', itemId); else if (editBtn.classList.contains('itinerary-edit-btn')) startEditItem('itinerary', itemId); else if (editBtn.classList.contains('budget-edit-btn')) startEditItem('budget', itemId); else if (editBtn.classList.contains('packing-edit-btn')) startEditItem('packing', itemId); } else if (deleteBtn) { const itemId = deleteBtn.dataset.itemId; if(!itemId) return; if (deleteBtn.classList.contains('participant-delete-btn')) handleDeleteItem('participant', itemId); else if (deleteBtn.classList.contains('reminder-delete-btn')) handleDeleteItem('reminder', itemId); else if (deleteBtn.classList.contains('transport-delete-btn')) handleDeleteItem('transport', itemId); else if (deleteBtn.classList.contains('accommodation-delete-btn')) handleDeleteItem('accommodation', itemId); else if (deleteBtn.classList.contains('itinerary-delete-btn')) handleDeleteItem('itinerary', itemId); else if (deleteBtn.classList.contains('budget-delete-btn')) handleDeleteItem('budget', itemId); else if (deleteBtn.classList.contains('packing-delete-btn')) handleDeleteItem('packing', itemId); } else if (packingCheckbox) { const itemId = packingCheckbox.dataset.itemId; if(itemId) handleTogglePacked(itemId, packingCheckbox.checked); } });

         // Listener Import Checklist Predefinite
         if (predefinedChecklistsContainer) { predefinedChecklistsContainer.addEventListener('click', (e) => { const btn = e.target.closest('button[data-checklist]'); if (btn?.dataset.checklist) handleImportPackingList(btn.dataset.checklist); }); }

         // Listener Modals
         if (newTripModal) { createTripConfirmBtn?.addEventListener('click', handleCreateTripConfirm); newTripModal.querySelectorAll('.modal-close').forEach(btn => btn.addEventListener('click', closeNewTripModal)); newTripNameInput?.addEventListener('keypress', (e) => { if(e.key === 'Enter') handleCreateTripConfirm(); }); newTripModal.addEventListener('click', (e) => { if (e.target === newTripModal) closeNewTripModal(); }); }
         if (selectTemplateModal) { createFromTemplateConfirmBtn?.addEventListener('click', handleCreateFromTemplateConfirm); selectTemplateModal.querySelectorAll('.modal-close').forEach(btn => btn.addEventListener('click', closeSelectTemplateModal)); selectTemplateModal.addEventListener('click', (e) => { if (e.target === selectTemplateModal) closeSelectTemplateModal(); }); }
         if (confirmationModal) { const confirmBtn = confirmationModal.querySelector('#confirmation-modal-confirm-btn'); const closeBtns = confirmationModal.querySelectorAll('.modal-close'); if(confirmBtn) { const newConfirmBtn = confirmBtn.cloneNode(true); confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn); newConfirmBtn.addEventListener('click', executeConfirmAction); } else { console.error("Bottone conferma modale non trovato");} closeBtns.forEach(btn => btn.addEventListener('click', closeConfirmationModal)); confirmationModal.addEventListener('click', (e) => { if (e.target === confirmationModal) closeConfirmationModal(); }); }

         // Listener Calcolo Budget Trasporti
         if (addTransportTotalToBudgetBtn) { addTransportTotalToBudgetBtn.addEventListener('click', handleCalculateAndAddTransportCost); }

         // Listener Cerca Voli/Treni
         if (searchSkyscannerBtn) { searchSkyscannerBtn.addEventListener('click', handleSearchFlights); }
         if (searchTrainlineBtn) { searchTrainlineBtn.addEventListener('click', handleSearchTrains); }
         if(transportTypeSelect) { transportTypeSelect.addEventListener('change', toggleSearchButtonsVisibility); }

         // Listener per Controlli Ordinamento
         if(reminderSortControl) reminderSortControl.addEventListener('change', (e) => handleSortChange('reminder', e.target));
         if(transportSortControl) transportSortControl.addEventListener('change', (e) => handleSortChange('transport', e.target));
         if(itinerarySortControl) itinerarySortControl.addEventListener('change', (e) => handleSortChange('itinerary', e.target));
         if(budgetSortControl) budgetSortControl.addEventListener('change', (e) => handleSortChange('budget', e.target));
         if(packingSortControl) packingSortControl.addEventListener('change', (e) => handleSortChange('packing', e.target));

        // Listener per Ricerca Interna
        if(searchItineraryInput) searchItineraryInput.addEventListener('input', (e) => handleInternalSearch('itinerary', e.target));
        if(searchPackingInput) searchPackingInput.addEventListener('input', (e) => handleInternalSearch('packing', e.target));

        // Controllo URL per viaggi condivisi all'avvio
        checkForSharedTrip();

    }; // Fine init

    // Avvia app
    init();

}); // Fine DOMContentLoaded
