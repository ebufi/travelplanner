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
    const shareTripBtn = document.getElementById('share-trip-btn'); // Bottone Condividi Firebase/WebShare
    const emailSummaryBtn = document.getElementById('email-summary-btn'); // NUOVO
    const copySummaryBtn = document.getElementById('copy-summary-btn'); // NUOVO
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

     // Bilancio Tab (NUOVO)
    const calculateBalanceBtn = document.getElementById('calculate-balance-btn');
    const balanceResultsContainer = document.getElementById('balance-results-container');
    const balanceResultsUl = document.getElementById('balance-results');
    const balanceSummaryDiv = document.getElementById('balance-summary');
    const balanceErrorMessageP = document.getElementById('balance-error-message');

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
    const deselectTrip = () => { currentTripId = null; tripDetailsAreaDiv.style.display = 'none'; welcomeMessageDiv.style.display = 'block'; downloadTextBtn.disabled = true; downloadExcelBtn.disabled = true; deleteTripBtn.disabled = true; if (shareTripBtn) shareTripBtn.disabled = true; if(emailSummaryBtn) emailSummaryBtn.disabled = true; if(copySummaryBtn) copySummaryBtn.disabled = true; // Disabilita anche nuovi bottoni
        renderTripList(); };
    const renderTripDetails = (trip) => { if (!trip) { deselectTrip(); return; } tripTitleH2.textContent = trip.name || 'Senza Nome'; editTripIdInput.value = trip.id; tripNameInput.value = trip.name || ''; if(tripOriginCityInput) tripOriginCityInput.value = trip.originCity || ''; if(tripDestinationInput) tripDestinationInput.value = trip.destination || ''; if(tripStartDateInput) tripStartDateInput.value = trip.startDate || ''; if(tripEndDateInput) tripEndDateInput.value = trip.endDate || ''; if(tripIsTemplateCheckbox) tripIsTemplateCheckbox.checked = trip.isTemplate || false; if(tripNotesTextarea) tripNotesTextarea.value = trip.notes || ''; if(tripExtraInfoTextarea) tripExtraInfoTextarea.value = trip.extraInfo || ''; renderParticipants(trip.participants); renderReminders(trip.reminders); renderTransportations(trip.transportations); renderAccommodations(trip.accommodations); renderItinerary(trip.itinerary); renderBudget(trip.budget); renderPackingList(trip.packingList); downloadTextBtn.disabled = false; downloadExcelBtn.disabled = false; deleteTripBtn.disabled = false; if (shareTripBtn) shareTripBtn.disabled = !!trip.isTemplate; if(emailSummaryBtn) emailSummaryBtn.disabled = false; if(copySummaryBtn) copySummaryBtn.disabled = false; // Abilita nuovi bottoni
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
    const startEditItem = (listType, itemId) => { /* ... come prima ... */ };
    const handleItemFormSubmit = (e, listType) => { /* ... come prima, assicurati usi safeToNumber/safeToPositiveInt ... */
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
        if (currentEditId) { const idx = list.findIndex(i => i && i.id === currentEditId); if (idx > -1) { const oldItem = list[idx]; list[idx] = { ...oldItem, ...itemData, ...(listType === 'packing' ? { packed: oldItem.packed } : {}) }; } else { console.error(`Item ${currentEditId} non trovato`); return; } } else { itemData.id = generateId(listType); if (listType === 'packing') itemData.packed = false; if (listType === 'reminder') itemData.status = itemData.status || 'todo'; if (Array.isArray(list)) { list.push(itemData); } else { console.error(`Lista ${listType} non array`); showToast("Errore interno.", "error"); return; } }
        saveTrips(); if (listType === 'budget') { renderFn(listOwner); } else { renderFn(list); } resetEditState(listType); showToast(currentEditId ? 'Elemento aggiornato!' : 'Elemento aggiunto!', 'success'); if(listType === 'participant') populateDatalists(trip); if(listType === 'packing') populatePackingCategoriesDatalist(trip.packingList);
     };


    // ==========================================================================
    // == FUNZIONI RENDER LISTE ==
    // ==========================================================================
    const populateDatalists = (trip) => { if (!trip || !participantDatalist) return; participantDatalist.innerHTML = ''; (trip.participants || []).forEach(p => { const option = document.createElement('option'); option.value = p.name; participantDatalist.appendChild(option); }); populatePackingCategoriesDatalist(trip.packingList); };
    const populatePackingCategoriesDatalist = (packingList) => { if (!packingCategoryDatalist) return; packingCategoryDatalist.innerHTML = ''; const categories = new Set(DEFAULT_PACKING_CATEGORIES); (packingList || []).forEach(p => { if(p.category) categories.add(p.category); }); Array.from(categories).sort().forEach(cat => { const option = document.createElement('option'); option.value = cat; packingCategoryDatalist.appendChild(option); }); };
    const renderParticipants = (participantsInput = []) => { /* ... come prima ... */ };
    const renderReminders = (remindersInput = []) => { /* ... come prima ... */ };
    const renderTransportations = (transportItemsInput) => { /* ... come prima ... */ };
    const getTransportIcon = (type) => { /* ... come prima ... */ };
    const renderAccommodations = (accommodationsInput = []) => { /* ... come prima ... */ };
    const renderItinerary = (itineraryItemsInput) => { /* ... come prima ... */ };
    const renderBudget = (budgetData) => { /* ... come prima ... */ };
    const renderPackingList = (itemsInput = []) => { /* ... come prima ... */ };
    const createPackingListItem = (item) => { /* ... come prima ... */ };
    const handleTogglePacked = (itemId, isPacked) => { /* ... come prima ... */ };
    const handleImportPackingList = (type) => { /* ... come prima ... */ };
    const handleDeleteItem = (listType, itemId) => { /* ... come prima ... */ };

    // ==========================================================================
    // == FUNZIONE AGGIUNGI COSTO AL BUDGET ==
    // ==========================================================================
    const addCostToBudget = (category, description, cost) => { /* ... come prima ... */ };
    const handleCalculateAndAddTransportCost = () => { /* ... come prima ... */ };

    // ==========================================================================
    // == FUNZIONI UI ==
    // ==========================================================================
    const switchTab = (tabId) => { /* ... come prima ... */ };
    const toggleSearchButtonsVisibility = () => { /* ... come prima ... */ };
    const handleSortChange = (listType, selectElement) => { /* ... come prima ... */ };
    const applyCurrentSortToControls = () => { /* ... come prima ... */ };
    const handleInternalSearch = (listType, inputElement) => { /* ... come prima ... */ };

    // ==========================================================================
    // == FUNZIONI RICERCA ESTERNA ==
    // ==========================================================================
     const handleSearchFlights = () => { /* ... come prima ... */ };
    const handleSearchTrains = () => { /* ... come prima ... */ };

    // ==========================================================================
    // == FUNZIONI DOWNLOAD ==
    // ==========================================================================
    const handleDownloadText = () => { /* ... come prima ... */ };
    const handleDownloadExcel = () => { /* ... come prima ... */ };

    // ==========================================================================
    // == FUNZIONI CONDIVISIONE / BILANCIO ==
    // ==========================================================================

    // --- Condivisione via Link Firebase / Web Share API ---
    const handleShareViaLink = async () => { // Rinominata per chiarezza
        if (!db) { showToast("Funzionalità di condivisione non disponibile (Errore Init Firebase).", "error"); return; }
        if (!currentTripId) { showToast("Seleziona un viaggio da condividere.", "warning"); return; }
        const originalTrip = findTripById(currentTripId);
        if (!originalTrip) { showToast("Errore: viaggio non trovato.", "error"); return; }
        if (originalTrip.isTemplate) { showToast("Non puoi condividere un template.", "warning"); return; }

        const shareButton = shareTripBtn; // Usa il bottone corretto
        if (shareButton) {
            shareButton.disabled = true;
            shareButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Preparando...';
        }

        let dataToSend = null;
        let shareLink = null; // Per fallback

        try {
            const cleanTripBase = JSON.parse(JSON.stringify(originalTrip));
            dataToSend = { /* ... (costruisci dataToSend completo come nella versione finale precedente) ... */
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

            console.log("Invio a Firestore:", JSON.stringify(dataToSend, null, 2));
            if (shareButton) shareButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando...';

            const docRef = await addDoc(collection(db, "sharedTrips"), dataToSend);
            shareLink = `${window.location.origin}${window.location.pathname}?shareId=${docRef.id}`;
            console.log("Viaggio condiviso con ID: ", docRef.id);

            // Tentativo con Web Share API
            if (navigator.share) {
                const shareData = {
                    title: `Viaggio: ${originalTrip.name || 'S.N.'}`,
                    text: `Ecco i dettagli del mio viaggio "${originalTrip.name || 'S.N.'}":\nDestinazione: ${originalTrip.destination || 'N/D'}\nDate: ${formatDate(originalTrip.startDate)} - ${formatDate(originalTrip.endDate)}\n(Apri il link per importare nell'app!)`,
                    url: shareLink,
                };
                 if (shareButton) shareButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Apro condivisione...';
                await navigator.share(shareData);
                showToast("Pannello di condivisione aperto.", "success");
            } else {
                // Fallback con prompt
                prompt("Web Share non supportato. Copia questo link:", shareLink);
                showToast("Link di condivisione generato!", "success");
            }

        } catch (error) {
            if (error.name === 'AbortError') { // Utente ha annullato Web Share
                console.log('Condivisione annullata dall\'utente.');
                showToast("Condivisione annullata.", "info");
            } else { // Altri errori (Firestore o Web Share)
                console.error('Errore durante la condivisione:', error);
                console.error("Dati inviati:", dataToSend);
                showToast("Errore durante la condivisione. Controlla console.", "error");
                // Fallback estremo: mostra il link nel prompt se è stato generato prima dell'errore share
                if (shareLink && !navigator.share) { // Mostra solo se il fallback prompt non è stato già usato
                     prompt("Errore nell'aprire la condivisione. Copia manualmente il link:", shareLink);
                } else if (shareLink && navigator.share) {
                    // Se web share fallisce ma il link c'è, l'utente potrebbe volerlo copiare
                    showConfirmationModal("Errore Condivisione", "Impossibile aprire il pannello di condivisione, ma il link è stato generato. Vuoi copiarlo manualmente?", ()=>{
                        if(navigator.clipboard) {
                            navigator.clipboard.writeText(shareLink).then(() => showToast("Link copiato!", "success")).catch(()=> prompt("Copia manualmente:", shareLink));
                        } else {
                            prompt("Copia manualmente:", shareLink);
                        }
                    })
                }
            }
        } finally {
            if (shareButton) {
                shareButton.disabled = false;
                shareButton.innerHTML = '<i class="fas fa-share-alt"></i> Condividi';
            }
        }
    };

    // --- Condivisione via Email ---
    const handleEmailSummary = () => {
        if (!currentTripId) { showToast("Seleziona un viaggio.", "warning"); return; }
        const trip = findTripById(currentTripId);
        if (!trip) { showToast("Viaggio non trovato.", "error"); return; }

        let emailBody = `Riepilogo Viaggio: ${trip.name || 'S.N.'}\n========================\n\n`;
        emailBody += `Destinazione: ${trip.destination || 'N/D'}\n`;
        emailBody += `Date: ${formatDate(trip.startDate)} - ${formatDate(trip.endDate)}\n`;
        emailBody += `Partecipanti: ${(trip.participants || []).map(p => p.name).join(', ') || 'Nessuno'}\n\n`;
        // Aggiungi altre sezioni essenziali se vuoi (es. note)
        emailBody += `Note: ${trip.notes || '-'}\n\n`;
        // Aggiungere il link di condivisione qui NON è molto utile perché l'utente deve generarlo separatamente
        // emailBody += `(Per importare nell'app, chiedi il link di condivisione)\n`;

        const emailSubject = `Riepilogo Viaggio: ${trip.name || 'S.N.'}`;
        const mailtoLink = `mailto:?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;

        try {
            const mailWindow = window.open(mailtoLink, '_blank');
            if (!mailWindow) {
                 console.warn("Apertura finestra email bloccata, tento con reindirizzamento...");
                 window.location.href = mailtoLink;
            }
        } catch (e) {
            console.error("Errore apertura link mailto:", e);
            showToast("Impossibile aprire il client email.", "error");
        }
    };

    // --- Condivisione via Copia/Incolla ---
    const handleCopySummary = () => {
        if (!currentTripId) { showToast("Seleziona un viaggio.", "warning"); return; }
        const trip = findTripById(currentTripId);
        if (!trip) { showToast("Viaggio non trovato.", "error"); return; }

        let textToCopy = `✈️ *Riepilogo Viaggio: ${trip.name || 'S.N.'}*\n`;
        textToCopy += `📍 Destinazione: ${trip.destination || 'N/D'}\n`;
        textToCopy += `📅 Date: ${formatDate(trip.startDate)} - ${formatDate(trip.endDate)}\n`;
        textToCopy += `👥 Partecipanti: ${(trip.participants || []).map(p => p.name).join(', ') || 'Nessuno'}\n`;
        textToCopy += `📝 Note: ${trip.notes || '-'}\n`;
        // Aggiungere il link di condivisione qui NON è molto utile perché l'utente deve generarlo separatamente

         if (navigator.clipboard && navigator.clipboard.writeText) {
             navigator.clipboard.writeText(textToCopy)
                 .then(() => {
                     showToast("Riepilogo copiato negli appunti!", "success");
                 })
                 .catch(err => {
                     console.error('Errore durante la copia negli appunti:', err);
                     showToast("Errore durante la copia.", "error");
                     fallbackCopyTextToClipboard(textToCopy);
                 });
         } else {
             fallbackCopyTextToClipboard(textToCopy);
         }
    };
    function fallbackCopyTextToClipboard(text) { /* ... (funzione fallback come prima) ... */ const textArea = document.createElement("textarea"); textArea.value = text; textArea.style.position = "fixed"; textArea.style.top = "0"; textArea.style.left = "0"; textArea.style.opacity = "0"; document.body.appendChild(textArea); textArea.focus(); textArea.select(); try { const successful = document.execCommand('copy'); if (successful) { showToast("Riepilogo copiato (fallback)!", "success"); } else { throw new Error('Copia fallback fallita'); } } catch (err) { console.error('Fallback: Impossibile copiare testo: ', err); showToast("Errore durante la copia (fallback).", "error"); } document.body.removeChild(textArea); }

    // --- Importazione da Link ---
    const cloneAndRegenerateTripIds = (tripDataFromFirebase) => { /* ... come prima ... */ };
    const handleImportSharedTrip = (sharedTripData) => { /* ... come prima ... */ };
    const checkForSharedTrip = async () => { /* ... come prima ... */ };

     // --- Calcolo Bilancio Spese ---
     const calculateExpenseBalance = () => { /* ... come prima ... */ };
     const renderBalanceResults = (result) => { /* ... come prima ... */ };


    // ==========================================================================
    // == INIZIALIZZAZIONE E EVENT LISTENER ==
    // ==========================================================================
    const executeConfirmAction = () => { /* ... come prima ... */ };

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
        // Listener per i 3 bottoni di condivisione
        if (shareTripBtn) shareTripBtn.addEventListener('click', handleShareViaLink); // Usa il metodo Firebase/WebShare
        if (emailSummaryBtn) emailSummaryBtn.addEventListener('click', handleEmailSummary); // Nuovo listener
        if (copySummaryBtn) copySummaryBtn.addEventListener('click', handleCopySummary); // Nuovo listener

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

        // Listener per Calcolo Bilancio Spese
        if(calculateBalanceBtn) {
            calculateBalanceBtn.addEventListener('click', () => {
                const balanceResult = calculateExpenseBalance();
                renderBalanceResults(balanceResult);
            });
        }

        // Controllo URL per viaggi condivisi all'avvio
        checkForSharedTrip();

    }; // Fine init

    // Avvia app
    init();

}); // Fine DOMContentLoaded
