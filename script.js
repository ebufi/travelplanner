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
    // Disabilita bottoni che dipendono da Firebase se init fallisce
    document.addEventListener('DOMContentLoaded', () => {
         const shareBtn = document.getElementById('share-trip-btn');
         if(shareBtn) shareBtn.disabled = true;
         const balanceBtn = document.getElementById('calculate-balance-btn');
         if(balanceBtn) balanceBtn.disabled = true;
    });
}


// ==========================================================================
// == INIZIO LOGICA APPLICAZIONE (dentro DOMContentLoaded) ==
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {

    // ==========================================================================
    // == CONFIGURAZIONE E COSTANTI ==
    // ==========================================================================
    const STORAGE_KEY = 'travelPlannerPro_Trips_v2.1_Firebase';
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
    // Funzione helper per selezionare elementi, ora senza log di errore diretto
    const getElement = (id, isQuerySelector = false) => {
        const element = isQuerySelector ? document.querySelector(id) : document.getElementById(id);
        if (!element) {
            console.warn(`Elemento non trovato: ${id}`); // Warning invece di errore
        }
        return element;
    };

    // Sidebar
    const tripListUl = getElement('trip-list');
    const newTripBtn = getElement('new-trip-btn');
    const createFromTemplateBtn = getElement('create-from-template-btn');
    const searchTripInput = getElement('search-trip-input');
    const noTripsMessage = getElement('no-trips-message');

    // Area Dettagli Generale
    const welcomeMessageDiv = getElement('welcome-message');
    const tripDetailsAreaDiv = getElement('trip-details-area');
    const tripTitleH2 = getElement('trip-title');
    const downloadTextBtn = getElement('download-text-btn');
    const downloadExcelBtn = getElement('download-excel-btn');
    const deleteTripBtn = getElement('delete-trip-btn');
    const shareTripBtn = getElement('share-trip-btn');
    const emailSummaryBtn = getElement('email-summary-btn');
    const copySummaryBtn = getElement('copy-summary-btn');
    const tabsContainer = getElement('.tabs', true);

    // Info Tab
    const tripInfoForm = getElement('trip-info-form');
    const editTripIdInput = getElement('edit-trip-id');
    const tripNameInput = getElement('trip-name');
    const tripOriginCityInput = getElement('trip-origin-city');
    const tripDestinationInput = getElement('trip-destination');
    const tripStartDateInput = getElement('trip-start-date');
    const tripEndDateInput = getElement('trip-end-date');
    const tripIsTemplateCheckbox = getElement('trip-is-template');
    const tripNotesTextarea = getElement('trip-notes');
    const tripExtraInfoTextarea = getElement('trip-extra-info');

    // Partecipanti Tab
    const addParticipantForm = getElement('add-participant-form');
    const editParticipantIdInput = getElement('edit-participant-id');
    const participantNameInput = getElement('participant-name');
    const participantNotesInput = getElement('participant-notes');
    const participantExtraInfoTextarea = getElement('participant-extra-info');
    const participantListUl = getElement('participant-list');
    const noParticipantsItemsP = getElement('no-participants-items');
    const participantSubmitBtn = getElement('participant-submit-btn');
    const participantCancelEditBtn = getElement('participant-cancel-edit-btn');
    const participantDatalist = getElement('participant-datalist');

    // Promemoria Tab
    const addReminderItemForm = getElement('add-reminder-item-form');
    const editReminderItemIdInput = getElement('edit-reminder-item-id');
    const reminderDescriptionInput = getElement('reminder-description');
    const reminderDueDateInput = getElement('reminder-due-date');
    const reminderStatusSelect = getElement('reminder-status');
    const reminderListUl = getElement('reminder-list');
    const noReminderItemsP = getElement('no-reminder-items');
    const reminderSubmitBtn = getElement('reminder-submit-btn');
    const reminderCancelEditBtn = getElement('reminder-cancel-edit-btn');
    const reminderSortControl = getElement('reminder-sort-control');

    // Trasporti Tab
    const addTransportItemForm = getElement('add-transport-item-form');
    const editTransportItemIdInput = getElement('edit-transport-item-id');
    const transportTypeSelect = getElement('transport-type');
    const transportDescriptionInput = getElement('transport-description');
    const transportDepartureLocInput = getElement('transport-departure-loc');
    const transportDepartureDatetimeInput = getElement('transport-departure-datetime');
    const transportArrivalLocInput = getElement('transport-arrival-loc');
    const transportArrivalDatetimeInput = getElement('transport-arrival-datetime');
    const transportBookingRefInput = getElement('transport-booking-ref');
    const transportCostInput = getElement('transport-cost');
    const transportNotesInput = getElement('transport-notes');
    const transportLinkInput = getElement('transport-link');
    const transportListUl = getElement('transport-list');
    const noTransportItemsP = getElement('no-transport-items');
    const transportSubmitBtn = getElement('transport-submit-btn');
    const transportCancelEditBtn = getElement('transport-cancel-edit-btn');
    const searchSkyscannerBtn = getElement('search-skyscanner-btn');
    const searchTrainlineBtn = getElement('search-trainline-btn');
    const addTransportTotalToBudgetBtn = getElement('add-transport-total-to-budget-btn');
    const transportSortControl = getElement('transport-sort-control');

    // Alloggio Tab
    const addAccommodationItemForm = getElement('add-accommodation-item-form');
    const editAccommodationItemIdInput = getElement('edit-accommodation-item-id');
    const accommodationNameInput = getElement('accommodation-name');
    const accommodationTypeSelect = getElement('accommodation-type');
    const accommodationAddressInput = getElement('accommodation-address');
    const accommodationCheckinInput = getElement('accommodation-checkin');
    const accommodationCheckoutInput = getElement('accommodation-checkout');
    const accommodationBookingRefInput = getElement('accommodation-booking-ref');
    const accommodationCostInput = getElement('accommodation-cost');
    const accommodationNotesInput = getElement('accommodation-notes');
    const accommodationLinkInput = getElement('accommodation-link');
    const accommodationListUl = getElement('accommodation-list');
    const noAccommodationItemsP = getElement('no-accommodation-items');
    const accommodationSubmitBtn = getElement('accommodation-submit-btn');
    const accommodationCancelEditBtn = getElement('accommodation-cancel-edit-btn');

    // Itinerario Tab
    const addItineraryItemForm = getElement('add-itinerary-item-form');
    const editItineraryItemIdInput = getElement('edit-itinerary-item-id');
    const itineraryDayInput = getElement('itinerary-day');
    const itineraryTimeInput = getElement('itinerary-time');
    const itineraryActivityInput = getElement('itinerary-activity');
    const itineraryLocationInput = getElement('itinerary-location');
    const itineraryBookingRefInput = getElement('itinerary-booking-ref');
    const itineraryCostInput = getElement('itinerary-cost');
    const itineraryNotesInput = getElement('itinerary-notes');
    const itineraryLinkInput = getElement('itinerary-link');
    const itineraryListUl = getElement('itinerary-list');
    const noItineraryItemsP = getElement('no-itinerary-items');
    const itinerarySubmitBtn = getElement('itinerary-submit-btn');
    const itineraryCancelEditBtn = getElement('itinerary-cancel-edit-btn');
    const searchItineraryInput = getElement('search-itinerary-input');
    const itinerarySortControl = getElement('itinerary-sort-control');

    // Budget Tab
    const addBudgetItemForm = getElement('add-budget-item-form');
    const editBudgetItemIdInput = getElement('edit-budget-item-id');
    const budgetCategorySelect = getElement('budget-category');
    const budgetDescriptionInput = getElement('budget-description');
    const budgetEstimatedInput = getElement('budget-estimated');
    const budgetActualInput = getElement('budget-actual');
    const budgetPaidByInput = getElement('budget-paid-by');
    const budgetSplitBetweenInput = getElement('budget-split-between');
    const budgetListUl = getElement('budget-list');
    const budgetTotalEstimatedStrong = getElement('budget-total-estimated');
    const budgetTotalActualStrong = getElement('budget-total-actual');
    const budgetDifferenceStrong = getElement('budget-difference');
    const noBudgetItemsP = getElement('no-budget-items');
    const budgetSubmitBtn = getElement('budget-submit-btn');
    const budgetCancelEditBtn = getElement('budget-cancel-edit-btn');
    const budgetSortControl = getElement('budget-sort-control');

    // Packing List Tab
    const predefinedChecklistsContainer = getElement('.predefined-checklists', true);
    const addPackingItemForm = getElement('add-packing-item-form');
    const editPackingItemIdInput = getElement('edit-packing-item-id');
    const packingItemNameInput = getElement('packing-item-name');
    const packingItemCategoryInput = getElement('packing-item-category');
    const packingItemQuantityInput = getElement('packing-item-quantity');
    const packingListUl = getElement('packing-list');
    const noPackingItemsP = getElement('no-packing-items');
    const packingSubmitBtn = getElement('packing-submit-btn');
    const packingCancelEditBtn = getElement('packing-cancel-edit-btn');
    const searchPackingInput = getElement('search-packing-input');
    const packingSortControl = getElement('packing-sort-control');
    const packingCategoryDatalist = getElement('packing-category-list');

     // Bilancio Tab
    const calculateBalanceBtn = getElement('calculate-balance-btn');
    const balanceResultsContainer = getElement('balance-results-container');
    const balanceResultsUl = getElement('balance-results');
    const balanceSummaryDiv = getElement('balance-summary');
    const balanceErrorMessageP = getElement('balance-error-message');

    // Modals & Toast
    const newTripModal = getElement('new-trip-modal');
    const newTripNameInput = getElement('new-trip-name-input');
    const newTripErrorP = getElement('new-trip-modal-error');
    const createTripConfirmBtn = getElement('create-trip-confirm-btn');
    const selectTemplateModal = getElement('select-template-modal');
    const templateSelectInput = getElement('template-select-input');
    const selectTemplateErrorP = getElement('select-template-modal-error');
    const createFromTemplateConfirmBtn = getElement('create-from-template-confirm-btn');
    const confirmationModal = getElement('confirmation-modal');
    const confirmationModalTitle = getElement('confirmation-modal-title');
    const confirmationModalMessage = getElement('confirmation-modal-message');
    const confirmationModalConfirmBtn = getElement('confirmation-modal-confirm-btn');
    const toastContainer = getElement('toast-container');

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
    const formatCurrency = (amount) => { const num = amount === null || typeof amount === 'undefined' ? 0 : Number(amount); if (isNaN(num)) { return new Intl.NumberFormat(DEFAULT_LOCALE, { style: 'currency', currency: DEFAULT_CURRENCY }).format(0); } return new Intl.NumberFormat(DEFAULT_LOCALE, { style: 'currency', currency: DEFAULT_CURRENCY }).format(num); };
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
    const toTimestampOrNull = (dateString) => { if (!dateString || typeof dateString !== 'string') return null; try { const date = new Date(dateString); return isNaN(date.getTime()) ? null : Timestamp.fromDate(date); } catch (e) { console.warn(`Impossibile convertire "${dateString}" in Timestamp:`, e); return null; } };
    const safeToNumberOrNull = (value) => { if (value === null || value === undefined || value === '') return null; const num = Number(value); if (isNaN(num) || !isFinite(num)) { console.warn(`Valore non numerico o infinito rilevato: "${value}". Convertito a null.`); return null; } return num; };
    const safeToPositiveIntegerOrDefault = (value, defaultValue = 1) => { if (value === null || value === undefined || value === '') return defaultValue; const num = parseInt(value, 10); if (isNaN(num) || !isFinite(num) || num < 1) { console.warn(`Quantità non valida rilevata: "${value}". Impostata a ${defaultValue}.`); return defaultValue; } return num; };
    const convertTimestampsToStrings = (data) => { if (data === null || typeof data !== 'object') return data; if (data instanceof Timestamp) { try { return data.toDate().toISOString(); } catch (e) { console.warn("Errore conversione Timestamp in stringa:", e); return null; } } if (Array.isArray(data)) { return data.map(item => convertTimestampsToStrings(item)); } const newData = {}; for (const key in data) { if (Object.prototype.hasOwnProperty.call(data, key)) { newData[key] = convertTimestampsToStrings(data[key]); } } return newData; };
    function fallbackCopyTextToClipboard(text) { const textArea = document.createElement("textarea"); textArea.value = text; textArea.style.position = "fixed"; textArea.style.top = "0"; textArea.style.left = "0"; textArea.style.opacity = "0"; document.body.appendChild(textArea); textArea.focus(); textArea.select(); try { const successful = document.execCommand('copy'); if (successful) { showToast("Riepilogo copiato (fallback)!", "success"); } else { throw new Error('Copia fallback fallita'); } } catch (err) { console.error('Fallback: Impossibile copiare testo: ', err); showToast("Errore durante la copia (fallback).", "error"); } document.body.removeChild(textArea); }


    // ==========================================================================
    // == GESTIONE STORAGE ==
    // ==========================================================================
    const saveTrips = () => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(trips)); } catch (e) { console.error("Errore salvataggio:", e); showToast("Errore: impossibile salvare i dati.", "error"); } };
    const loadTrips = () => { const stored = localStorage.getItem(STORAGE_KEY); try { trips = stored ? JSON.parse(stored) : []; if (!Array.isArray(trips)) trips = []; } catch (e) { console.error("Errore parsing localStorage:", e); trips = []; } trips.forEach(trip => { if (!trip || typeof trip !== 'object') return; trip.originCity = trip.originCity || ''; trip.destination = trip.destination || ''; trip.isTemplate = trip.isTemplate || false; trip.extraInfo = trip.extraInfo || ''; trip.participants = (Array.isArray(trip.participants) ? trip.participants : []).map(p => ({ ...p, extraInfo: p.extraInfo || '' })); trip.reminders = (Array.isArray(trip.reminders) ? trip.reminders : []).map(r => ({ ...r, status: r.status || 'todo' })); trip.transportations = (Array.isArray(trip.transportations) ? trip.transportations : []).map(t => ({ ...t, link: t.link || null, cost: t.cost ?? null })); trip.accommodations = (Array.isArray(trip.accommodations) ? trip.accommodations : []).map(a => ({ ...a, link: a.link || null, cost: a.cost ?? null })); trip.itinerary = (Array.isArray(trip.itinerary) ? trip.itinerary : []).map(i => ({ ...i, link: i.link || null, bookingRef: i.bookingRef || null, cost: i.cost ?? null })); trip.budget = (trip.budget && typeof trip.budget === 'object') ? trip.budget : { items: [], estimatedTotal: 0, actualTotal: 0 }; trip.budget.items = (Array.isArray(trip.budget.items) ? trip.budget.items : []).map(b => ({ ...b, paidBy: b.paidBy || null, splitBetween: b.splitBetween || null, estimated: b.estimated ?? 0, actual: b.actual ?? null })); trip.packingList = (Array.isArray(trip.packingList) ? trip.packingList : []).map(p => ({ ...p, category: p.category || 'Altro', quantity: p.quantity || 1 })); }); };

    // ==========================================================================
    // == LOGICA VIAGGI ==
    // ==========================================================================
    const findTripById = (id) => trips.find(trip => trip && trip.id === id);
    const renderTripList = () => { const searchTerm = currentSearchTerm.trip.toLowerCase(); tripListUl.innerHTML = ''; const nonTemplates = trips.filter(trip => !trip.isTemplate); const templates = trips.filter(trip => trip.isTemplate); const sortedNonTemplates = nonTemplates .sort((a, b) => (a?.name || '').localeCompare(b?.name || '')); sortedNonTemplates.forEach(trip => { if (!trip || !trip.id) return; const tripNameLower = (trip.name || '').toLowerCase(); const destinationLower = (trip.destination || '').toLowerCase(); const isVisible = !searchTerm || tripNameLower.includes(searchTerm) || destinationLower.includes(searchTerm); const li = createTripListItem(trip, isVisible); tripListUl.appendChild(li); }); if (templates.length > 0 && !searchTerm) { const divider = document.createElement('li'); divider.textContent = '--- Templates ---'; divider.style.textAlign = 'center'; divider.style.color = '#6c757d'; divider.style.marginTop = '10px'; divider.style.cursor = 'default'; divider.style.background = 'transparent'; tripListUl.appendChild(divider); const sortedTemplates = templates.sort((a, b) => (a?.name || '').localeCompare(b?.name || '')); sortedTemplates.forEach(trip => { if (!trip || !trip.id) return; const li = createTripListItem(trip, true); tripListUl.appendChild(li); }); } const hasVisibleTrips = nonTemplates.some(trip => { const tripNameLower = (trip.name || '').toLowerCase(); const destinationLower = (trip.destination || '').toLowerCase(); return !searchTerm || tripNameLower.includes(searchTerm) || destinationLower.includes(searchTerm); }); noTripsMessage.style.display = nonTemplates.length === 0 || (!hasVisibleTrips && searchTerm) ? 'block' : 'none'; };
    const createTripListItem = (trip, isVisible) => { const li = document.createElement('li'); li.dataset.tripId = trip.id; if (trip.isTemplate) li.classList.add('is-template'); li.innerHTML = `<span>${trip.name || 'Senza Nome'} ${trip.isTemplate ? '' : `(${formatDate(trip.startDate)} - ${formatDate(trip.endDate)})`}</span> <button class="btn-delete-trip" data-trip-id="${trip.id}" title="Elimina"><i class="fas fa-trash-alt"></i></button>`; if (trip.id === currentTripId && !trip.isTemplate) li.classList.add('active'); if (!isVisible) li.classList.add('hidden'); li.addEventListener('click', (e) => { if (!e.target.closest('.btn-delete-trip')) { if (!trip.isTemplate) { selectTrip(trip.id); } else { showToast("Questo è un template. Selezionalo da 'Da Template' per creare un viaggio.", "info"); } } }); li.querySelector('.btn-delete-trip').addEventListener('click', (e) => { e.stopPropagation(); handleDeleteTrip(trip.id); }); return li; };
    const selectTrip = (id) => { if (currentTripId === id && tripDetailsAreaDiv.style.display !== 'none') return; const trip = findTripById(id); if (trip && !trip.isTemplate) { currentTripId = id; currentSearchTerm.itinerary = ''; if(searchItineraryInput) searchItineraryInput.value = ''; currentSearchTerm.packing = ''; if(searchPackingInput) searchPackingInput.value = ''; currentSort = { transport: 'departureDateTime', itinerary: 'dateTime', budget: 'category', packing: 'name', reminder: 'dueDate' }; applyCurrentSortToControls(); renderTripList(); renderTripDetails(trip); tripDetailsAreaDiv.style.display = 'block'; welcomeMessageDiv.style.display = 'none'; Object.keys(editingItemId).forEach(resetEditState); switchTab('info-tab'); populateDatalists(trip); } else { if (trip && trip.isTemplate) { showToast("Non puoi modificare un template direttamente. Creane un viaggio.", "info"); } else { deselectTrip(); } } };
    const deselectTrip = () => { currentTripId = null; tripDetailsAreaDiv.style.display = 'none'; welcomeMessageDiv.style.display = 'block'; downloadTextBtn.disabled = true; downloadExcelBtn.disabled = true; deleteTripBtn.disabled = true; if (shareTripBtn) shareTripBtn.disabled = true; if(emailSummaryBtn) emailSummaryBtn.disabled = true; if(copySummaryBtn) copySummaryBtn.disabled = true; renderTripList(); };
    const renderTripDetails = (trip) => { if (!trip) { deselectTrip(); return; } tripTitleH2.textContent = trip.name || 'Senza Nome'; editTripIdInput.value = trip.id; tripNameInput.value = trip.name || ''; if(tripOriginCityInput) tripOriginCityInput.value = trip.originCity || ''; if(tripDestinationInput) tripDestinationInput.value = trip.destination || ''; if(tripStartDateInput) tripStartDateInput.value = trip.startDate || ''; if(tripEndDateInput) tripEndDateInput.value = trip.endDate || ''; if(tripIsTemplateCheckbox) tripIsTemplateCheckbox.checked = trip.isTemplate || false; if(tripNotesTextarea) tripNotesTextarea.value = trip.notes || ''; if(tripExtraInfoTextarea) tripExtraInfoTextarea.value = trip.extraInfo || ''; renderParticipants(trip.participants); renderReminders(trip.reminders); renderTransportations(trip.transportations); renderAccommodations(trip.accommodations); renderItinerary(trip.itinerary); renderBudget(trip.budget); renderPackingList(trip.packingList); downloadTextBtn.disabled = false; downloadExcelBtn.disabled = false; deleteTripBtn.disabled = false; if (shareTripBtn) shareTripBtn.disabled = !!trip.isTemplate; if(emailSummaryBtn) emailSummaryBtn.disabled = false; if(copySummaryBtn) copySummaryBtn.disabled = false; toggleSearchButtonsVisibility(); };
    const handleNewTrip = () => { openNewTripModal(); };
    const handleCreateTripConfirm = () => { const tripName = newTripNameInput.value.trim(); if (tripName) { if (newTripErrorP) newTripErrorP.style.display = 'none'; const newTrip = { id: generateId('trip'), name: tripName, originCity: '', destination: '', startDate: '', endDate: '', notes: '', isTemplate: false, extraInfo: '', participants: [], reminders: [], transportations: [], accommodations: [], itinerary: [], budget: { items: [], estimatedTotal: 0, actualTotal: 0 }, packingList: [] }; trips.push(newTrip); saveTrips(); closeNewTripModal(); selectTrip(newTrip.id); showToast(`Viaggio "${tripName}" creato!`, 'success'); } else { if (newTripErrorP) { newTripErrorP.textContent = 'Il nome non può essere vuoto.'; newTripErrorP.style.display = 'block'; } newTripNameInput.focus(); } };
    const handleSaveTripInfo = (e) => { e.preventDefault(); if (!currentTripId) return; const trip = findTripById(currentTripId); if (trip) { const start = tripStartDateInput.value, end = tripEndDateInput.value; if (start && end && start > end) { showToast('Data fine non valida.', 'error'); return; } trip.name = tripNameInput.value.trim() || 'Viaggio S.N.'; if (tripOriginCityInput) trip.originCity = tripOriginCityInput.value.trim(); if (tripDestinationInput) trip.destination = tripDestinationInput.value.trim(); trip.startDate = start; trip.endDate = end; if (tripIsTemplateCheckbox) trip.isTemplate = tripIsTemplateCheckbox.checked; if (tripNotesTextarea) trip.notes = tripNotesTextarea.value.trim(); if (tripExtraInfoTextarea) trip.extraInfo = tripExtraInfoTextarea.value.trim(); saveTrips(); tripTitleH2.textContent = trip.name; renderTripList(); if(shareTripBtn) shareTripBtn.disabled = trip.isTemplate; showToast('Informazioni salvate!', 'success'); } };
    const handleDeleteTrip = (id) => { const item = findTripById(id); if (!item) return; const type = item.isTemplate ? 'Template' : 'Viaggio'; showConfirmationModal( `Conferma Eliminazione ${type}`, `Eliminare "${item.name || 'S.N.'}"? L'azione è irreversibile.`, () => { trips = trips.filter(trip => trip.id !== id); saveTrips(); if (currentTripId === id) deselectTrip(); else renderTripList(); showToast(`${type} eliminato.`, 'info'); }); };
    const openSelectTemplateModal = () => { const templates = trips.filter(trip => trip.isTemplate); if (templates.length === 0) { showToast("Nessun template trovato. Crea un viaggio e spunta 'È un template'.", "info"); return; } templateSelectInput.innerHTML = '<option value="">-- Seleziona Template --</option>'; templates.forEach(t => { const option = document.createElement('option'); option.value = t.id; option.textContent = t.name; templateSelectInput.appendChild(option); }); if (selectTemplateErrorP) selectTemplateErrorP.style.display = 'none'; openModal(selectTemplateModal); };
    const closeSelectTemplateModal = () => closeModal(selectTemplateModal);
    const handleCreateFromTemplateConfirm = () => { const templateId = templateSelectInput.value; if (!templateId) { if(selectTemplateErrorP) { selectTemplateErrorP.textContent = 'Seleziona un template.'; selectTemplateErrorP.style.display = 'block';} return; } const template = findTripById(templateId); if (!template) { showToast("Template non valido.", "error"); return; } const newTrip = cloneAndRegenerateTripIds(template); trips.push(newTrip); saveTrips(); closeSelectTemplateModal(); selectTrip(newTrip.id); showToast(`Viaggio creato dal template "${template.name}"!`, 'success'); };
    const handleSearchTrip = (e) => { currentSearchTerm.trip = e.target.value; renderTripList(); };

    // ==========================================================================
    // == FUNZIONI MODIFICA ITEM ==
    // ==========================================================================
    const startEditItem = (listType, itemId) => { /* ... come prima ... */ };
    const handleItemFormSubmit = (e, listType) => { /* ... come prima, usando i safe helpers ... */ };


    // ==========================================================================
    // == FUNZIONI RENDER LISTE ==
    // ==========================================================================
    const populateDatalists = (trip) => { /* ... come prima ... */ };
    const populatePackingCategoriesDatalist = (packingList) => { /* ... come prima ... */ };
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
    // == FUNZIONI DOWNLOAD / EMAIL / COPIA ==
    // ==========================================================================
    const handleEmailSummary = () => {
        // Rimuovi i log di debug interni se funzionava
        try {
            if (!currentTripId) { showToast("Seleziona un viaggio.", "warning"); return; }
            const trip = findTripById(currentTripId);
            if (!trip) { showToast("Viaggio non trovato.", "error"); return; }

            let emailBody = `Riepilogo Viaggio: ${trip.name || 'S.N.'}\n========================\n\n`;
            emailBody += `Destinazione: ${trip.destination || 'N/D'}\n`;
            emailBody += `Date: ${formatDate(trip.startDate)} - ${formatDate(trip.endDate)}\n`;
            emailBody += `Partecipanti: ${(trip.participants || []).map(p => p.name).join(', ') || 'Nessuno'}\n\n`;
            emailBody += `Note: ${trip.notes || '-'}\n\n`;
            emailBody += `(Per i dettagli completi, chiedi il link di condivisione dell'app)\n`;

            const emailSubject = `Riepilogo Viaggio: ${trip.name || 'S.N.'}`;
            const mailtoLink = `mailto:?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;

             try {
                 const mailWindow = window.open(mailtoLink, '_blank');
                 if (!mailWindow || mailWindow.closed || typeof mailWindow.closed=='undefined') {
                      console.warn("Apertura finestra email bloccata o fallita, tento con reindirizzamento...");
                      window.location.href = mailtoLink;
                 }
             } catch (e) {
                 console.error("Errore apertura link mailto specifico:", e);
                 showToast("Impossibile aprire il client email.", "error");
             }
        } catch (error) {
            console.error("Errore generale in handleEmailSummary:", error);
            showToast("Errore nella preparazione dell'email.", "error");
        }
    };

    const handleCopySummary = () => {
        try {
            if (!currentTripId) { showToast("Seleziona un viaggio.", "warning"); return; }
            const trip = findTripById(currentTripId);
            if (!trip) { showToast("Viaggio non trovato.", "error"); return; }

            let textToCopy = `✈️ *Riepilogo Viaggio: ${trip.name || 'S.N.'}*\n`;
            textToCopy += `📍 Destinazione: ${trip.destination || 'N/D'}\n`;
            textToCopy += `📅 Date: ${formatDate(trip.startDate)} - ${formatDate(trip.endDate)}\n`;
            textToCopy += `👥 Partecipanti: ${(trip.participants || []).map(p => p.name).join(', ') || 'Nessuno'}\n`;
            textToCopy += `📝 Note: ${trip.notes || '-'}\n`;
            textToCopy += `(Per i dettagli completi, chiedi il link di condivisione dell'app)`;

             if (navigator.clipboard && navigator.clipboard.writeText) {
                 navigator.clipboard.writeText(textToCopy)
                     .then(() => { showToast("Riepilogo copiato negli appunti!", "success"); })
                     .catch(err => { console.error('Errore copia (navigator):', err); showToast("Errore durante la copia.", "error"); fallbackCopyTextToClipboard(textToCopy); });
             } else {
                 fallbackCopyTextToClipboard(textToCopy);
             }
        } catch (error) {
             console.error("Errore generale in handleCopySummary:", error);
             showToast("Errore nella preparazione del testo da copiare.", "error");
        }
    };

    const handleDownloadText = () => {
        try {
            if (!currentTripId) { showToast("Seleziona un viaggio.", "error"); return; }
            const trip = findTripById(currentTripId);
            if (!trip) { showToast("Viaggio non trovato.", "error"); return; }

            let content = '';
            try { // Blocco specifico per la generazione del contenuto
                content = `Riepilogo Viaggio: ${trip.name || 'S.N.'} ${trip.isTemplate ? '(TEMPLATE)' : ''}\n========================\n\n`;
                content += `**INFO**\nOrigine: ${trip.originCity || 'N/D'}\nDest.: ${trip.destination || 'N/D'}\nDate: ${formatDate(trip.startDate)} - ${formatDate(trip.endDate)}\nNote: ${trip.notes || '-'}\nExtra Info: ${trip.extraInfo || '-'}\n\n`;
                content += `**PARTECIPANTI** (${(trip.participants || []).length})\n`; (trip.participants || []).slice().sort((a,b)=>(a?.name||'').localeCompare(b?.name||'')).forEach(p => { content += `- ${p.name}${p.notes ? ' ('+p.notes+')':''}${p.extraInfo ? ' [Extra: '+p.extraInfo+']':''}\n`}); if((trip.participants || []).length === 0) content += "Nessuno\n"; content += "\n";
                content += `**PROMEMORIA** (${(trip.reminders || []).length})\n`; (trip.reminders || []).slice().sort((a,b)=>(a?.dueDate || '9999').localeCompare(b?.dueDate || '9999')).forEach(r => { content += `- [${r.status==='done'?'X':' '}] ${r.description}${r.dueDate ? ' (Scad: '+formatDate(r.dueDate)+')':''}\n`}); if((trip.reminders || []).length === 0) content += "Nessuno\n"; content += "\n";
                content += `**TRASPORTI** (${(trip.transportations || []).length})\n`; (trip.transportations || []).slice().sort((a,b)=>(a?.departureDateTime||'').localeCompare(b?.departureDateTime||'')).forEach(i => { content += `- ${i.type} (${i.description}): Da ${i.departureLoc||'?'} (${formatDateTime(i.departureDateTime)}) a ${i.arrivalLoc||'?'} (${formatDateTime(i.arrivalDateTime)})${i.cost!==null ? ' Costo: '+formatCurrency(i.cost):''}${i.bookingRef ? ' Rif: '+i.bookingRef:''}${i.notes ? ' Note: '+i.notes:''}${i.link ? ' Link: '+i.link:''}\n` }); if((trip.transportations || []).length === 0) content += "Nessuno\n"; content += "\n";
                content += `**ALLOGGI** (${(trip.accommodations || []).length})\n`; (trip.accommodations || []).slice().sort((a,b)=>(a?.checkinDateTime||'').localeCompare(b?.checkinDateTime||'')).forEach(i => { content += `- ${i.name} (${i.type}): ${i.address||'?'}. CheckIn: ${formatDateTime(i.checkinDateTime)}, CheckOut: ${formatDateTime(i.checkoutDateTime)}${i.cost!==null ? ' Costo: '+formatCurrency(i.cost):''}${i.bookingRef ? ' Rif: '+i.bookingRef:''}${i.notes ? ' Note: '+i.notes:''}${i.link ? ' Link: '+i.link:''}\n` }); if((trip.accommodations || []).length === 0) content += "Nessuno\n"; content += "\n";
                content += `**ITINERARIO** (${(trip.itinerary || []).length})\n`; (trip.itinerary || []).slice().sort((a,b)=>{const d=(a?.day||'').localeCompare(b?.day||''); return d!==0?d:(a?.time||'').localeCompare(b?.time||'');}).forEach(i => { content += `- ${formatDate(i.day)}${i.time?' ('+i.time+')':''} ${i.activity}${i.location?' @'+i.location:''}${i.bookingRef?' [Rif:'+i.bookingRef+']':''}${i.cost!==null?' Costo:'+formatCurrency(i.cost):''}${i.notes?' ('+i.notes+')':''}${i.link?' Link:'+i.link:''}\n` }); if((trip.itinerary || []).length === 0) content += "Nessuno\n"; content += "\n";
                content += `**BUDGET** (${(trip.budget?.items || []).length} voci)\n`; (trip.budget?.items || []).slice().sort((a,b)=>(a?.category||'').localeCompare(b?.category||'')).forEach(i => { content += `- ${i.category}: ${i.description} (Est: ${formatCurrency(i.estimated)}, Act: ${i.actual===null?'N/A':formatCurrency(i.actual)})${i.paidBy ? ' Pagato da: '+i.paidBy:''}${i.splitBetween ? ' Diviso: '+i.splitBetween:''}\n` }); if((trip.budget?.items || []).length > 0) content += `> Tot Est: ${formatCurrency(trip.budget?.estimatedTotal||0)}, Tot Act: ${formatCurrency(trip.budget?.actualTotal||0)}, Diff: ${formatCurrency((trip.budget?.actualTotal||0) - (trip.budget?.estimatedTotal||0))}\n`; else content += "Nessuna spesa\n"; content += "\n";
                content += `**PACKING LIST** (${(trip.packingList || []).length})\n`; (trip.packingList || []).slice().sort((a,b)=>(a?.category||'zzz').localeCompare(b?.category||'zzz') || (a?.name||'').localeCompare(b?.name||'')).forEach(i => { content += `- [${i.packed?'X':' '}] ${i.name}${i.quantity>1?' (x'+i.quantity+')':''} [${i.category||'Altro'}]\n` }); if((trip.packingList || []).length === 0) content += "Lista vuota\n";
                 if (content.length === 0) throw new Error("Contenuto TXT vuoto.");
            } catch (genError) {
                console.error("Errore durante la generazione del contenuto TXT:", genError);
                showToast("Errore nella preparazione del file di testo.", "error");
                return;
            }

            try {
                const blob = new Blob([content],{type:'text/plain;charset=utf-8'});
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `Viaggio-${(trip.name||'SN').replace(/[^a-z0-9]/gi,'_')}.txt`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            } catch (downloadError) {
                 console.error("Errore durante il download effettivo del TXT:", downloadError);
                 showToast("Errore durante il download del file.", "error");
            }

        } catch (error) {
            console.error("Errore generale in handleDownloadText:", error);
            showToast("Errore imprevisto nella generazione del file di testo.", "error");
        }
    };

    const handleDownloadExcel = () => {
        try {
            if (!currentTripId) { showToast("Seleziona un viaggio.", "error"); return; }
            const trip = findTripById(currentTripId);
            if (!trip) { showToast("Viaggio non trovato.", "error"); return; }

             if (typeof XLSX === 'undefined') {
                 console.error("Libreria XLSX (SheetJS) non trovata!");
                 showToast("Errore: libreria per Excel non caricata.", "error");
                 return;
             }

            let wb;
            try { // Blocco per la creazione del workbook
                wb = XLSX.utils.book_new();
                const cf = '#,##0.00 €';
                const nf = '#,##0';

                // Aggiungi tutti i fogli come nella versione precedente...
                const summary = [ ["Voce","Dettaglio"], ["Viaggio", trip.name||'S.N.'], ["Template", trip.isTemplate ? 'Sì' : 'No'], ["Origine", trip.originCity||'N/D'], ["Dest.", trip.destination||'N/D'], ["Periodo", `${formatDate(trip.startDate)} - ${formatDate(trip.endDate)}`], ["Note", trip.notes||'-'], ["Extra Info", trip.extraInfo||'-'], [], ["Budget Est.",{t:'n',v:trip.budget?.estimatedTotal||0,z:cf}], ["Budget Act.",{t:'n',v:trip.budget?.actualTotal||0,z:cf}], ["Diff.",{t:'n',v:(trip.budget?.actualTotal||0)-(trip.budget?.estimatedTotal||0),z:cf}], [], ["# Partecipanti", (trip.participants||[]).length], ["# Promemoria", (trip.reminders||[]).length], ["# Trasporti", (trip.transportations||[]).length], ["# Alloggi", (trip.accommodations||[]).length], ["# Itin.", (trip.itinerary||[]).length], ["# Budget", (trip.budget?.items||[]).length], ["# Packing", (trip.packingList||[]).length]];
                const wsSum = XLSX.utils.aoa_to_sheet(summary);
                wsSum['!cols']=[{wch:15},{wch:50}];
                XLSX.utils.book_append_sheet(wb, wsSum, "Riepilogo");
                const partH = ["Nome", "Note", "Extra Info"]; const partD = (trip.participants||[]).slice().sort((a,b)=>(a?.name||'').localeCompare(b?.name||'')).map(p=>[p.name, p.notes, p.extraInfo]); const wsPart = XLSX.utils.aoa_to_sheet([partH, ...partD]); wsPart['!cols']=[{wch:30},{wch:40},{wch:40}]; XLSX.utils.book_append_sheet(wb, wsPart, "Partecipanti");
                const remH = ["Stato", "Descrizione", "Scadenza"]; const remD = (trip.reminders||[]).slice().sort((a,b)=>(a?.dueDate || '9999').localeCompare(b?.dueDate || '9999')).map(r => [r.status === 'done' ? 'Fatto' : 'Da Fare', r.description, formatDate(r.dueDate)]); const wsRem = XLSX.utils.aoa_to_sheet([remH, ...remD]); wsRem['!cols'] = [{wch:10}, {wch:50}, {wch:12}]; XLSX.utils.book_append_sheet(wb, wsRem, "Promemoria");
                const th = ["Tipo","Desc.","Da Luogo","Da Data/Ora","A Luogo","A Data/Ora","Rif.","Costo","Note","Link/File"]; const td = (trip.transportations||[]).slice().sort((a,b)=>(a?.departureDateTime||'').localeCompare(b?.departureDateTime||'')).map(i=>[i.type, i.description, i.departureLoc, formatDateTime(i.departureDateTime), i.arrivalLoc, formatDateTime(i.arrivalDateTime), i.bookingRef, i.cost===null?null:{t:'n',v:i.cost,z:cf}, i.notes, i.link]); const wsT = XLSX.utils.aoa_to_sheet([th, ...td]); wsT['!cols']=[{wch:12},{wch:25},{wch:18},{wch:16},{wch:18},{wch:16},{wch:15},{wch:12},{wch:25},{wch:30}]; XLSX.utils.book_append_sheet(wb, wsT, "Trasporti");
                const ah = ["Nome","Tipo","Indirizzo","CheckIn","CheckOut","Rif.","Costo","Note","Link/File"]; const ad = (trip.accommodations||[]).slice().sort((a,b)=>(a?.checkinDateTime||'').localeCompare(b?.checkinDateTime||'')).map(i=>[i.name,i.type,i.address,formatDateTime(i.checkinDateTime),formatDateTime(i.checkoutDateTime),i.bookingRef,i.cost===null?null:{t:'n',v:i.cost,z:cf},i.notes, i.link]); const wsA = XLSX.utils.aoa_to_sheet([ah,...ad]); wsA['!cols']=[{wch:25},{wch:10},{wch:35},{wch:16},{wch:16},{wch:20},{wch:12},{wch:30},{wch:30}]; XLSX.utils.book_append_sheet(wb, wsA, "Alloggi");
                const ih = ["Giorno","Ora","Attività","Luogo","Rif. Pren.","Costo","Note","Link/File"]; const idata = (trip.itinerary||[]).slice().sort((a,b)=>{const d=(a?.day||'').localeCompare(b?.day||''); return d!==0?d:(a?.time||'').localeCompare(b?.time||'');}).map(i=>[formatDate(i.day),i.time,i.activity,i.location,i.bookingRef,i.cost===null?null:{t:'n',v:i.cost,z:cf},i.notes, i.link]); const wsI = XLSX.utils.aoa_to_sheet([ih, ...idata]); wsI['!cols']=[{wch:10},{wch:8},{wch:30},{wch:25},{wch:20},{wch:12},{wch:30},{wch:30}]; XLSX.utils.book_append_sheet(wb, wsI, "Itinerario");
                const bh = ["Cat.","Desc.","Est. (€)","Act. (€)", "Pagato Da", "Diviso Tra"]; const bd = (trip.budget?.items||[]).slice().sort((a,b)=>(a?.category||'').localeCompare(b?.category||'')).map(i=>[i.category,i.description,{t:'n',v:i.estimated||0,z:cf},i.actual===null?null:{t:'n',v:i.actual,z:cf}, i.paidBy, i.splitBetween]); bd.push([],["TOTALI","", {t:'n',v:trip.budget?.estimatedTotal||0,z:cf}, {t:'n',v:trip.budget?.actualTotal||0,z:cf}, "", ""]); const wsB = XLSX.utils.aoa_to_sheet([bh, ...bd]); wsB['!cols']=[{wch:15},{wch:35},{wch:15},{wch:15},{wch:20},{wch:20}]; XLSX.utils.book_append_sheet(wb, wsB, "Budget");
                const ph = ["Categoria", "Oggetto", "Qtà", "Fatto?"]; const pd = (trip.packingList||[]).slice().sort((a,b)=>(a?.category||'zzz').localeCompare(b?.category||'zzz') || (a?.name||'').localeCompare(b?.name||'')).map(i=>[i.category, i.name, {t:'n', v:i.quantity, z:nf}, i.packed?'Sì':'No']); const wsP = XLSX.utils.aoa_to_sheet([ph, ...pd]); wsP['!cols']=[{wch:20}, {wch:40},{wch:5},{wch:8}]; XLSX.utils.book_append_sheet(wb, wsP, "Packing List");

                if (!wb || !wb.SheetNames || wb.SheetNames.length === 0) {
                    throw new Error("Workbook vuoto o non creato correttamente.");
                 }
            } catch (buildError) {
                 console.error("Errore durante la costruzione del Workbook Excel:", buildError);
                 showToast("Errore nella preparazione del file Excel.", "error");
                 return;
            }

            try {
                const fn = `Viaggio-${(trip.name||'SN').replace(/[^a-z0-9]/gi,'_')}.xlsx`;
                XLSX.writeFile(wb, fn);
            } catch (writeError) {
                 console.error("Errore durante la scrittura/download del file Excel:", writeError);
                 showToast("Errore durante il download del file Excel.", "error");
            }

        } catch (error) {
            console.error("Errore generale in handleDownloadExcel:", error);
            showToast("Errore imprevisto nella generazione del file Excel.", "error");
        }
    };


    // ==========================================================================
    // == FUNZIONI CONDIVISIONE VIA FIREBASE ==
    // ==========================================================================
    // ... (handleShareViaLink, cloneAndRegenerateTripIds, handleImportSharedTrip, checkForSharedTrip - come prima) ...
    const handleShareViaLink = async () => { /* ... Funzione completa come nell'ultimo messaggio ... */ };
    const cloneAndRegenerateTripIds = (tripDataFromFirebase) => { /* ... Funzione completa come nell'ultimo messaggio ... */ };
    const handleImportSharedTrip = (sharedTripData) => { /* ... Funzione completa come nell'ultimo messaggio ... */ };
    const checkForSharedTrip = async () => { /* ... Funzione completa come nell'ultimo messaggio ... */ };

    // ==========================================================================
    // == FUNZIONI CALCOLO BILANCIO SPESE ==
    // ==========================================================================
     const calculateExpenseBalance = () => { /* ... come prima ... */ };
     const renderBalanceResults = (result) => { /* ... come prima ... */ };


    // ==========================================================================
    // == INIZIALIZZAZIONE E EVENT LISTENER ==
    // ==========================================================================
    const executeConfirmAction = () => { /* ... come prima ... */ };

    const init = () => {
        console.log("DEBUG: Esecuzione init() iniziata.");
        try {
            loadTrips();
            renderTripList();
            deselectTrip();
            applyCurrentSortToControls();

            // Aggiungi tutti i listener come nell'ultima versione di debug, ma senza i console.log interni a init()
            if (newTripBtn) newTripBtn.addEventListener('click', handleNewTrip);
            if (createFromTemplateBtn) createFromTemplateBtn.addEventListener('click', openSelectTemplateModal);
            if (searchTripInput) searchTripInput.addEventListener('input', handleSearchTrip);
            if (tripInfoForm) tripInfoForm.addEventListener('submit', handleSaveTripInfo);
            if (deleteTripBtn) deleteTripBtn.addEventListener('click', () => { if (currentTripId) handleDeleteTrip(currentTripId); });
            if (tabsContainer) tabsContainer.addEventListener('click', (e) => { const tl = e.target.closest('.tab-link'); if (tl?.dataset.tab) switchTab(tl.dataset.tab); });
            if (downloadTextBtn) downloadTextBtn.addEventListener('click', handleDownloadText);
            if (downloadExcelBtn) downloadExcelBtn.addEventListener('click', handleDownloadExcel);
            if (emailSummaryBtn) emailSummaryBtn.addEventListener('click', handleEmailSummary);
            if (copySummaryBtn) copySummaryBtn.addEventListener('click', handleCopySummary);
            if (shareTripBtn) shareTripBtn.addEventListener('click', handleShareViaLink);
            // ... (listener per submit form, annulla edit, azioni liste, import checklist, modals, budget trasporti, cerca voli/treni, sort, search interna, calcolo bilancio) ...
            if (addParticipantForm) addParticipantForm.addEventListener('submit', (e) => handleItemFormSubmit(e, 'participant'));
            if (addReminderItemForm) addReminderItemForm.addEventListener('submit', (e) => handleItemFormSubmit(e, 'reminder'));
            if (addTransportItemForm) addTransportItemForm.addEventListener('submit', (e) => handleItemFormSubmit(e, 'transport'));
            if (addAccommodationItemForm) addAccommodationItemForm.addEventListener('submit', (e) => handleItemFormSubmit(e, 'accommodation'));
            if (addItineraryItemForm) addItineraryItemForm.addEventListener('submit', (e) => handleItemFormSubmit(e, 'itinerary'));
            if (addBudgetItemForm) addBudgetItemForm.addEventListener('submit', (e) => handleItemFormSubmit(e, 'budget'));
            if (addPackingItemForm) addPackingItemForm.addEventListener('submit', (e) => handleItemFormSubmit(e, 'packing'));
            if (participantCancelEditBtn) participantCancelEditBtn.addEventListener('click', () => resetEditState('participant'));
            if (reminderCancelEditBtn) reminderCancelEditBtn.addEventListener('click', () => resetEditState('reminder'));
            if (transportCancelEditBtn) transportCancelEditBtn.addEventListener('click', () => resetEditState('transport'));
            if (accommodationCancelEditBtn) accommodationCancelEditBtn.addEventListener('click', () => resetEditState('accommodation'));
            if (itineraryCancelEditBtn) itineraryCancelEditBtn.addEventListener('click', () => resetEditState('itinerary'));
            if (budgetCancelEditBtn) budgetCancelEditBtn.addEventListener('click', () => resetEditState('budget'));
            if (packingCancelEditBtn) packingCancelEditBtn.addEventListener('click', () => resetEditState('packing'));
            if (tripDetailsAreaDiv) tripDetailsAreaDiv.addEventListener('click', (e) => { const editBtn = e.target.closest('.btn-icon.edit'); const deleteBtn = e.target.closest('.btn-icon.delete'); const packingCheckbox = e.target.closest('.packing-checkbox'); if (editBtn) { const itemId = editBtn.dataset.itemId; if(!itemId) return; if (editBtn.classList.contains('participant-edit-btn')) startEditItem('participant', itemId); else if (editBtn.classList.contains('reminder-edit-btn')) startEditItem('reminder', itemId); else if (editBtn.classList.contains('transport-edit-btn')) startEditItem('transport', itemId); else if (editBtn.classList.contains('accommodation-edit-btn')) startEditItem('accommodation', itemId); else if (editBtn.classList.contains('itinerary-edit-btn')) startEditItem('itinerary', itemId); else if (editBtn.classList.contains('budget-edit-btn')) startEditItem('budget', itemId); else if (editBtn.classList.contains('packing-edit-btn')) startEditItem('packing', itemId); } else if (deleteBtn) { const itemId = deleteBtn.dataset.itemId; if(!itemId) return; if (deleteBtn.classList.contains('participant-delete-btn')) handleDeleteItem('participant', itemId); else if (deleteBtn.classList.contains('reminder-delete-btn')) handleDeleteItem('reminder', itemId); else if (deleteBtn.classList.contains('transport-delete-btn')) handleDeleteItem('transport', itemId); else if (deleteBtn.classList.contains('accommodation-delete-btn')) handleDeleteItem('accommodation', itemId); else if (deleteBtn.classList.contains('itinerary-delete-btn')) handleDeleteItem('itinerary', itemId); else if (deleteBtn.classList.contains('budget-delete-btn')) handleDeleteItem('budget', itemId); else if (deleteBtn.classList.contains('packing-delete-btn')) handleDeleteItem('packing', itemId); } else if (packingCheckbox) { const itemId = packingCheckbox.dataset.itemId; if(itemId) handleTogglePacked(itemId, packingCheckbox.checked); } });
            if (predefinedChecklistsContainer) { predefinedChecklistsContainer.addEventListener('click', (e) => { const btn = e.target.closest('button[data-checklist]'); if (btn?.dataset.checklist) handleImportPackingList(btn.dataset.checklist); }); }
            if (newTripModal) { createTripConfirmBtn?.addEventListener('click', handleCreateTripConfirm); newTripModal.querySelectorAll('.modal-close').forEach(btn => btn.addEventListener('click', closeNewTripModal)); newTripNameInput?.addEventListener('keypress', (e) => { if(e.key === 'Enter') handleCreateTripConfirm(); }); newTripModal.addEventListener('click', (e) => { if (e.target === newTripModal) closeNewTripModal(); }); }
            if (selectTemplateModal) { createFromTemplateConfirmBtn?.addEventListener('click', handleCreateFromTemplateConfirm); selectTemplateModal.querySelectorAll('.modal-close').forEach(btn => btn.addEventListener('click', closeSelectTemplateModal)); selectTemplateModal.addEventListener('click', (e) => { if (e.target === selectTemplateModal) closeSelectTemplateModal(); }); }
            if (confirmationModal) { const confirmBtn = confirmationModal.querySelector('#confirmation-modal-confirm-btn'); const closeBtns = confirmationModal.querySelectorAll('.modal-close'); if(confirmBtn) { const newConfirmBtn = confirmBtn.cloneNode(true); confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn); newConfirmBtn.addEventListener('click', executeConfirmAction); } else { console.error("Bottone conferma modale non trovato");} closeBtns.forEach(btn => btn.addEventListener('click', closeConfirmationModal)); confirmationModal.addEventListener('click', (e) => { if (e.target === confirmationModal) closeConfirmationModal(); }); }
            if (addTransportTotalToBudgetBtn) { addTransportTotalToBudgetBtn.addEventListener('click', handleCalculateAndAddTransportCost); }
            if (searchSkyscannerBtn) { searchSkyscannerBtn.addEventListener('click', handleSearchFlights); }
            if (searchTrainlineBtn) { searchTrainlineBtn.addEventListener('click', handleSearchTrains); }
            if(transportTypeSelect) { transportTypeSelect.addEventListener('change', toggleSearchButtonsVisibility); }
            if(reminderSortControl) reminderSortControl.addEventListener('change', (e) => handleSortChange('reminder', e.target));
            if(transportSortControl) transportSortControl.addEventListener('change', (e) => handleSortChange('transport', e.target));
            if(itinerarySortControl) itinerarySortControl.addEventListener('change', (e) => handleSortChange('itinerary', e.target));
            if(budgetSortControl) budgetSortControl.addEventListener('change', (e) => handleSortChange('budget', e.target));
            if(packingSortControl) packingSortControl.addEventListener('change', (e) => handleSortChange('packing', e.target));
            if(searchItineraryInput) searchItineraryInput.addEventListener('input', (e) => handleInternalSearch('itinerary', e.target));
            if(searchPackingInput) searchPackingInput.addEventListener('input', (e) => handleInternalSearch('packing', e.target));
            if(calculateBalanceBtn) { calculateBalanceBtn.addEventListener('click', () => { const balanceResult = calculateExpenseBalance(); renderBalanceResults(balanceResult); }); }

            checkForSharedTrip();

        } catch (error) {
             console.error("ERRORE CRITICO durante l'inizializzazione dell'app (init):", error);
             alert("Si è verificato un errore grave durante l'avvio dell'app. Controlla la console.");
        }
    }; // Fine init

    // Avvia app
    init();

}); // Fine DOMContentLoaded
