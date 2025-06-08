// ==========================================================================
// == FIREBASE MODULE IMPORTS & INITIALIZATION ==
// ==========================================================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-app.js";
import {
    getFirestore, collection, addDoc, doc, getDoc, getDocs, setDoc, deleteDoc, Timestamp, query, orderBy
} from "https://www.gstatic.com/firebasejs/11.5.0/firebase-firestore.js";
import {
    getAuth,
    onAuthStateChanged,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    sendEmailVerification,
    sendPasswordResetEmail,
    signInAnonymously
} from "https://www.gstatic.com/firebasejs/11.5.0/firebase-auth.js";

// Configurazione Firebase (ATTENZIONE ALLA API KEY IN PRODUZIONE)
const firebaseConfig = {
    apiKey: "AIzaSyBV7k95kgUnMhIzTQR1Xae-O_ksNYzzvmw",
    authDomain: "travel-planner-pro-5dd4f.firebaseapp.com",
    projectId: "travel-planner-pro-5dd4f",
    storageBucket: "travel-planner-pro-5dd4f.appspot.com",
    messagingSenderId: "95235228754",
    appId: "1:95235228754:web:5c8ce68dc8362e90260b8b",
    measurementId: "G-8H6FV393ZW"
};

// Inizializzazione Firebase
let app; let db; let auth;
try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
    console.log("Firebase (App, Firestore, Auth) inizializzato correttamente.");
} catch (error) {
    console.error("Errore inizializzazione Firebase:", error);
    alert("Impossibile inizializzare l'applicazione. Controlla la console per errori.");
    const appContainer = document.getElementById('app-container');
    if (appContainer) {
        appContainer.innerHTML = '<p style="color: red; text-align: center; margin-top: 50px;">Errore critico nell\'inizializzazione. Impossibile caricare l\'app.</p>';
        appContainer.style.display = 'block';
    }
}

// ==========================================================================
// == INIZIO LOGICA APPLICAZIONE ==
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {

    // ==========================================================================
    // == CONFIGURAZIONE E COSTANTI ==
    // ==========================================================================
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
    let domSelectionError = false;
    const checkElement = (id, isQuerySelector = false, isEssential = true) => { 
        const element = isQuerySelector ? document.querySelector(id) : document.getElementById(id); 
        if (!element && isEssential) { 
            console.error(`ERRORE SELEZIONE DOM: Elemento ESSENZIALE "${id}" non trovato!`); 
            domSelectionError = true; 
        } else if (!element && !isEssential) {
            console.warn(`ATTENZIONE: Elemento opzionale "${id}" non trovato. La funzionalità associata potrebbe non essere disponibile.`);
        }
        return element; 
    };

    // Auth Elements
    const authContainer = checkElement('auth-container');
    const appMainContainer = checkElement('app-container');
    const loginForm = checkElement('login-form');
    const signupForm = checkElement('signup-form');
    const logoutBtn = checkElement('logout-btn');
    const userEmailDisplay = checkElement('user-email-display');
    const authErrorDiv = checkElement('auth-error');
    const authSuccessDiv = checkElement('auth-success');
    const forgotPasswordLink = checkElement('forgot-password-link');
    const passwordResetForm = checkElement('password-reset-form');
    const cancelResetBtn = checkElement('cancel-reset-btn');
    const anonymousSigninBtn = checkElement('anonymous-signin-btn');
    const showSignupLink = checkElement('show-signup-link');
    const signupPromptP = document.querySelector('.signup-prompt');
    const emailVerificationNotice = checkElement('email-verification-notice');
    const resendVerificationBtn = checkElement('resend-verification-btn');
    const resendVerificationBtnNotice = checkElement('resend-verification-btn-notice');
    const anonymousUserPrompt = checkElement('anonymous-user-prompt');
    const linkAccountPrompt = checkElement('link-account-prompt');

    // Elementi App
    const loadingTripsDiv = checkElement('loading-trips');
    const tripListUl = checkElement('trip-list');
    const newTripBtn = checkElement('new-trip-btn');
    const createFromTemplateBtn = checkElement('create-from-template-btn', false, false); 
    const searchTripInput = checkElement('search-trip-input');
    const noTripsMessage = checkElement('no-trips-message');
    const welcomeMessageDiv = checkElement('welcome-message');
    const tripDetailsAreaDiv = checkElement('trip-details-area');
    const tripTitleH2 = checkElement('trip-title');
    const downloadTextBtn = checkElement('download-text-btn');
    const downloadExcelBtn = checkElement('download-excel-btn');
    const deleteTripBtn = checkElement('delete-trip-btn');
    const shareTripBtn = checkElement('share-trip-btn');
    const emailSummaryBtn = checkElement('email-summary-btn');
    const copySummaryBtn = checkElement('copy-summary-btn');
    const tabsContainer = checkElement('.tabs', true);
    const tripInfoForm = checkElement('trip-info-form');
    const editTripIdInput = checkElement('edit-trip-id');
    const tripNameInput = checkElement('trip-name');
    const tripOriginCityInput = checkElement('trip-origin-city');
    const tripDestinationInput = checkElement('trip-destination');
    const tripStartDateInput = checkElement('trip-start-date');
    const tripEndDateInput = checkElement('trip-end-date');
    const tripIsTemplateCheckbox = checkElement('trip-is-template', false, false);
    const tripNotesTextarea = checkElement('trip-notes');
    const tripExtraInfoTextarea = checkElement('trip-extra-info');
    const addParticipantForm = checkElement('add-participant-form');
    const editParticipantIdInput = checkElement('edit-participant-id');
    const participantNameInput = checkElement('participant-name');
    const participantNotesInput = checkElement('participant-notes');
    const participantExtraInfoTextarea = checkElement('participant-extra-info');
    const participantListUl = checkElement('participant-list');
    const noParticipantsItemsP = checkElement('no-participants-items');
    const participantSubmitBtn = checkElement('participant-submit-btn');
    const participantCancelEditBtn = checkElement('participant-cancel-edit-btn');
    const addReminderItemForm = checkElement('add-reminder-item-form');
    const editReminderItemIdInput = checkElement('edit-reminder-item-id');
    const reminderDescriptionInput = checkElement('reminder-description');
    const reminderDueDateInput = checkElement('reminder-due-date');
    const reminderStatusSelect = checkElement('reminder-status');
    const reminderListUl = checkElement('reminder-list');
    const noReminderItemsP = checkElement('no-reminder-items');
    const reminderSubmitBtn = checkElement('reminder-submit-btn');
    const reminderCancelEditBtn = checkElement('reminder-cancel-edit-btn');
    const reminderSortControl = checkElement('reminder-sort-control');
    const addTransportItemForm = checkElement('add-transport-item-form');
    const editTransportItemIdInput = checkElement('edit-transport-item-id');
    const transportTypeSelect = checkElement('transport-type');
    const transportDescriptionInput = checkElement('transport-description');
    const transportDepartureLocInput = checkElement('transport-departure-loc');
    const transportDepartureDatetimeInput = checkElement('transport-departure-datetime');
    const transportArrivalLocInput = checkElement('transport-arrival-loc');
    const transportArrivalDatetimeInput = checkElement('transport-arrival-datetime');
    const transportBookingRefInput = checkElement('transport-booking-ref');
    const transportCostInput = checkElement('transport-cost');
    const transportNotesInput = checkElement('transport-notes');
    const transportLinkInput = checkElement('transport-link');
    const transportListUl = checkElement('transport-list');
    const noTransportItemsP = checkElement('no-transport-items');
    const transportSubmitBtn = checkElement('transport-submit-btn');
    const transportCancelEditBtn = checkElement('transport-cancel-edit-btn');
    const searchSkyscannerBtn = checkElement('search-skyscanner-btn');
    const searchTrainlineBtn = checkElement('search-trainline-btn');
    const addTransportTotalToBudgetBtn = checkElement('add-transport-total-to-budget-btn', false, false);
    const transportSortControl = checkElement('transport-sort-control');
    const addAccommodationItemForm = checkElement('add-accommodation-item-form');
    const editAccommodationItemIdInput = checkElement('edit-accommodation-item-id');
    const accommodationNameInput = checkElement('accommodation-name');
    const accommodationTypeSelect = checkElement('accommodation-type');
    const accommodationAddressInput = checkElement('accommodation-address');
    const accommodationCheckinInput = checkElement('accommodation-checkin');
    const accommodationCheckoutInput = checkElement('accommodation-checkout');
    const accommodationBookingRefInput = checkElement('accommodation-booking-ref');
    const accommodationCostInput = checkElement('accommodation-cost');
    const accommodationNotesInput = checkElement('accommodation-notes');
    const accommodationLinkInput = checkElement('accommodation-link');
    const accommodationListUl = checkElement('accommodation-list');
    const noAccommodationItemsP = checkElement('no-accommodation-items');
    const accommodationSubmitBtn = checkElement('accommodation-submit-btn');
    const accommodationCancelEditBtn = checkElement('accommodation-cancel-edit-btn');
    const addAccommodationTotalToBudgetBtn = checkElement('add-accommodation-total-to-budget-btn', false, false);
    const addItineraryItemForm = checkElement('add-itinerary-item-form');
    const editItineraryItemIdInput = checkElement('edit-itinerary-item-id');
    const itineraryDayInput = checkElement('itinerary-day');
    const itineraryTimeInput = checkElement('itinerary-time');
    const itineraryActivityInput = checkElement('itinerary-activity');
    const itineraryLocationInput = checkElement('itinerary-location');
    const itineraryBookingRefInput = checkElement('itinerary-booking-ref');
    const itineraryCostInput = checkElement('itinerary-cost');
    const itineraryNotesInput = checkElement('itinerary-notes');
    const itineraryLinkInput = checkElement('itinerary-link');
    const itineraryListUl = checkElement('itinerary-list');
    const noItineraryItemsP = checkElement('no-itinerary-items');
    const itinerarySubmitBtn = checkElement('itinerary-submit-btn');
    const itineraryCancelEditBtn = checkElement('itinerary-cancel-edit-btn');
    const searchItineraryInput = checkElement('search-itinerary-input');
    const itinerarySortControl = checkElement('itinerary-sort-control');
    const addItineraryTotalToBudgetBtn = checkElement('add-itinerary-total-to-budget-btn', false, false);
    const addBudgetItemForm = checkElement('add-budget-item-form');
    const editBudgetItemIdInput = checkElement('edit-budget-item-id');
    const budgetCategorySelect = checkElement('budget-category');
    const budgetDescriptionInput = checkElement('budget-description');
    const budgetEstimatedInput = checkElement('budget-estimated');
    const budgetActualInput = checkElement('budget-actual');
    const budgetPaidByInput = checkElement('budget-paid-by');
    const budgetSplitBetweenInput = checkElement('budget-split-between');
    const budgetListUl = checkElement('budget-list');
    const budgetTotalEstimatedStrong = checkElement('budget-total-estimated');
    const budgetTotalActualStrong = checkElement('budget-total-actual');
    const budgetDifferenceStrong = checkElement('budget-difference');
    const noBudgetItemsP = checkElement('no-budget-items');
    const budgetSubmitBtn = checkElement('budget-submit-btn');
    const budgetCancelEditBtn = checkElement('budget-cancel-edit-btn');
    const budgetSortControl = checkElement('budget-sort-control');
    const predefinedChecklistsContainer = checkElement('.predefined-checklists', true);
    const addPackingItemForm = checkElement('add-packing-item-form');
    const editPackingItemIdInput = checkElement('edit-packing-item-id');
    const packingItemNameInput = checkElement('packing-item-name');
    const packingItemCategoryInput = checkElement('packing-item-category');
    const packingItemQuantityInput = checkElement('packing-item-quantity');
    const packingListUl = checkElement('packing-list');
    const noPackingItemsP = checkElement('no-packing-items');
    const packingSubmitBtn = checkElement('packing-submit-btn');
    const packingCancelEditBtn = checkElement('packing-cancel-edit-btn');
    const searchPackingInput = checkElement('search-packing-input');
    const packingSortControl = checkElement('packing-sort-control');
    const calculateBalanceBtn = checkElement('calculate-balance-btn');
    const balanceResultsContainer = checkElement('balance-results-container');
    const balanceResultsUl = checkElement('balance-results');
    const balanceSummaryDiv = checkElement('balance-summary');
    const balanceErrorMessageP = checkElement('balance-error-message');
    const newTripModal = checkElement('new-trip-modal');
    const newTripNameInput = checkElement('new-trip-name-input');
    const newTripErrorP = checkElement('new-trip-modal-error');
    const createTripConfirmBtn = checkElement('create-trip-confirm-btn');
    const selectTemplateModal = checkElement('select-template-modal', false, false);
    const templateSelectInput = checkElement('template-select-input', false, false);
    const selectTemplateErrorP = checkElement('select-template-modal-error', false, false);
    const createFromTemplateConfirmBtn = checkElement('create-from-template-confirm-btn', false, false);
    const confirmationModal = checkElement('confirmation-modal');
    const confirmationModalTitle = checkElement('confirmation-modal-title');
    const confirmationModalMessage = checkElement('confirmation-modal-message');
    const confirmationModalConfirmBtn = checkElement('confirmation-modal-confirm-btn');
    const toastContainer = checkElement('toast-container');
    const participantDatalist = checkElement('participant-datalist');
    const packingCategoryDatalist = checkElement('packing-category-list');

    if (domSelectionError) { alert("Errore critico: alcuni elementi dell'interfaccia non sono stati trovati. L'app non può continuare."); return; }

    // ==========================================================================
    // == STATO APPLICAZIONE ==
    // ==========================================================================
    let currentUser = null;
    let currentUserId = null;
    let trips = [];
    let currentTripId = null;
    let editingItemId = { participant: null, transport: null, accommodation: null, itinerary: null, budget: null, packing: null, reminder: null };
    let confirmActionCallback = null;
    let currentSort = { transport: 'departureDateTime', itinerary: 'dateTime', budget: 'category', packing: 'name', reminder: 'dueDate' };
    let currentSearchTerm = { trip: '', itinerary: '', packing: '' };

    // ==========================================================================
    // == FUNZIONI UTILITY ==
    // ==========================================================================
    const generateId = (prefix = 'item') => `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    const formatCurrency = (amount) => { const num = amount === null || typeof amount === 'undefined' ? 0 : Number(amount); if (isNaN(num)) { return new Intl.NumberFormat(DEFAULT_LOCALE, { style: 'currency', currency: DEFAULT_CURRENCY }).format(0); } return new Intl.NumberFormat(DEFAULT_LOCALE, { style: 'currency', currency: DEFAULT_CURRENCY }).format(num); };
    const formatDate = (dateString) => { if (!dateString || typeof dateString !== 'string') return ''; const datePart = dateString.split('T')[0]; try { const parts = datePart.split('-'); if (parts.length !== 3) return dateString; const year = parseInt(parts[0]), month = parseInt(parts[1]), day = parseInt(parts[2]); if (isNaN(year) || isNaN(month) || isNaN(day) || month < 1 || month > 12 || day < 1 || day > 31 || year < 1000 || year > 3000) return dateString; const date = new Date(Date.UTC(year, month - 1, day)); if (isNaN(date.getTime()) || date.getUTCFullYear() !== year || date.getUTCMonth() + 1 !== month || date.getUTCDate() !== day) return dateString; return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`; } catch (e) { return dateString; } };
    const formatDateTime = (dateTimeString) => { if (!dateTimeString || typeof dateTimeString !== 'string') return ''; try { const date = new Date(dateTimeString); if (isNaN(date.getTime())) return ''; const day = String(date.getDate()).padStart(2, '0'); const month = String(date.getMonth() + 1).padStart(2, '0'); const year = date.getFullYear(); const hours = String(date.getHours()).padStart(2, '0'); const minutes = String(date.getMinutes()).padStart(2, '0'); return `${day}/${month}/${year} ${hours}:${minutes}`; } catch (e) { return ''; } };
    const formatSkyscannerDate = (isoDateString) => { if (!isoDateString || typeof isoDateString !== 'string' || !isoDateString.match(/^\d{4}-\d{2}-\d{2}/)) return null; try { const datePart = isoDateString.split('T')[0]; const year = datePart.substring(2, 4); const month = datePart.substring(5, 7); const day = datePart.substring(8, 10); return `${year}${month}${day}`; } catch (e) { return null; } };
    const showToast = (message, type = 'info') => { if (!toastContainer) return; const toast = document.createElement('div'); toast.className = `toast ${type}`; let iconClass = 'fas fa-info-circle'; if (type === 'success') iconClass = 'fas fa-check-circle'; if (type === 'error') iconClass = 'fas fa-exclamation-circle'; toast.innerHTML = `<i class="${iconClass}"></i> ${message}`; toastContainer.appendChild(toast); setTimeout(() => toast.classList.add('show'), 10); setTimeout(() => { toast.classList.remove('show'); toast.addEventListener('transitionend', () => toast.remove(), { once: true }); }, 3000); };
    const openModal = (modalElement) => { if(modalElement) modalElement.style.display = 'block'; };
    const closeModal = (modalElement) => { if(modalElement) modalElement.style.display = 'none'; };
    const openNewTripModal = () => { if (!newTripModal) return; newTripNameInput.value = ''; if (newTripErrorP) newTripErrorP.style.display = 'none'; openModal(newTripModal); newTripNameInput.focus(); };
    const closeNewTripModal = () => closeModal(newTripModal);
    const showConfirmationModal = (title, message, onConfirm) => { if (!confirmationModal) return; confirmationModalTitle.textContent = title; confirmationModalMessage.textContent = message; confirmActionCallback = onConfirm; openModal(confirmationModal); };
    const closeConfirmationModal = () => { confirmActionCallback = null; closeModal(confirmationModal); };
    const resetEditState = (formType) => { editingItemId[formType] = null; const form = document.getElementById(`add-${formType}-item-form`); const submitBtn = document.getElementById(`${formType}-submit-btn`); const cancelBtn = document.getElementById(`${formType}-cancel-edit-btn`); const hiddenInput = document.getElementById(`edit-${formType}-item-id`); if (form) form.reset(); if(hiddenInput) hiddenInput.value = ''; if (submitBtn) { let addText = 'Aggiungi'; switch(formType) { case 'participant': addText = 'Partecipante'; break; case 'reminder': addText = 'Promemoria'; break; case 'transport': addText = 'Trasporto'; break; case 'accommodation': addText = 'Alloggio'; break; case 'itinerary': addText = 'Attività'; break; case 'budget': addText = 'Spesa'; break; case 'packing': addText = 'Oggetto'; break; } submitBtn.innerHTML = `<i class="fas fa-plus"></i> ${addText}`; submitBtn.classList.remove('btn-warning'); submitBtn.classList.add('btn-secondary'); } if (cancelBtn) cancelBtn.style.display = 'none'; if(formType === 'transport' && typeof toggleSearchButtonsVisibility === 'function') toggleSearchButtonsVisibility(); };
    const createMapLink = (query) => query ? `${GOOGLE_MAPS_BASE_URL}${encodeURIComponent(query)}` : null;
    const formatDisplayLink = (link) => { if (!link) return ''; try { new URL(link); const displayLink = link.length > 40 ? link.substring(0, 37) + '...' : link; return `<a href="${link}" target="_blank" rel="noopener noreferrer" class="external-link" title="${link}">${displayLink} <i class="fas fa-external-link-alt"></i></a>`; } catch (_) { return link; } };
    const safeToNumberOrNull = (value) => { if (value === null || value === undefined || value === '') return null; const num = Number(value); if (isNaN(num) || !isFinite(num)) { return null; } return num; };
    const safeToPositiveIntegerOrDefault = (value, defaultValue = 1) => { if (value === null || value === undefined || value === '') return defaultValue; const num = parseInt(value, 10); if (isNaN(num) || !isFinite(num) || num < 1) { return defaultValue; } return num; };
    function fallbackCopyTextToClipboard(text) { const textArea = document.createElement("textarea"); textArea.value = text; textArea.style.position = "fixed"; textArea.style.top = "0"; textArea.style.left = "0"; textArea.style.opacity = "0"; document.body.appendChild(textArea); textArea.focus(); textArea.select(); try { const successful = document.execCommand('copy'); if (!successful) { throw new Error('Copia fallback fallita'); } showToast("Riepilogo copiato (fallback)!", "success"); } catch (err) { console.error('Fallback: Impossibile copiare testo: ', err); showToast("Errore durante la copia (fallback).", "error"); } document.body.removeChild(textArea); }
    const toTimestampOrNull = (dateString) => { if (!dateString || typeof dateString !== 'string') return null; try { const date = new Date(dateString); return isNaN(date.getTime()) ? null : Timestamp.fromDate(date); } catch (e) { return null; } };
    const fromTimestampToString = (timestamp) => { if (timestamp && typeof timestamp.toDate === 'function') { try { const d = timestamp.toDate(); const YYYY = d.getFullYear(); const MM = String(d.getMonth() + 1).padStart(2, '0'); const DD = String(d.getDate()).padStart(2, '0'); const HH = String(d.getHours()).padStart(2, '0'); const mm = String(d.getMinutes()).padStart(2, '0'); return `${YYYY}-${MM}-${DD}T${HH}:${mm}`; } catch (e) { return ''; } } if (timestamp && typeof timestamp === 'string') { return timestamp.slice(0, 16); } return ''; };
    const fromTimestampToDateString = (timestamp) => { if (timestamp && typeof timestamp.toDate === 'function') { try { const d = timestamp.toDate(); const YYYY = d.getFullYear(); const MM = String(d.getMonth() + 1).padStart(2, '0'); const DD = String(d.getDate()).padStart(2, '0'); return `${YYYY}-${MM}-${DD}`; } catch (e) { return ''; } } if (timestamp && typeof timestamp === 'string') { const datePart = timestamp.split('T')[0]; if (datePart && datePart.match(/^\d{4}-\d{2}-\d{2}$/)) { return datePart; } } return ''; };
    const prepareTripDataForFirestore = (tripObject) => { const dataToSave = JSON.parse(JSON.stringify(tripObject)); delete dataToSave.id; dataToSave.startDate = toTimestampOrNull(dataToSave.startDate); dataToSave.endDate = toTimestampOrNull(dataToSave.endDate); dataToSave.createdAt = dataToSave.createdAt ? toTimestampOrNull(dataToSave.createdAt) : Timestamp.now(); dataToSave.updatedAt = Timestamp.now(); if (dataToSave.reminders) dataToSave.reminders.forEach(r => r.dueDate = toTimestampOrNull(r.dueDate)); if (dataToSave.transportations) dataToSave.transportations.forEach(t => { t.departureDateTime = toTimestampOrNull(t.departureDateTime); t.arrivalDateTime = toTimestampOrNull(t.arrivalDateTime); t.cost = safeToNumberOrNull(t.cost); }); if (dataToSave.accommodations) dataToSave.accommodations.forEach(a => { a.checkinDateTime = toTimestampOrNull(a.checkinDateTime); a.checkoutDateTime = toTimestampOrNull(a.checkoutDateTime); a.cost = safeToNumberOrNull(a.cost); }); if (dataToSave.itinerary) dataToSave.itinerary.forEach(i => { i.cost = safeToNumberOrNull(i.cost); }); if (dataToSave.budget && dataToSave.budget.items) dataToSave.budget.items.forEach(b => { b.estimated = safeToNumberOrNull(b.estimated); b.actual = safeToNumberOrNull(b.actual); }); if (dataToSave.packingList) dataToSave.packingList.forEach(p => { p.quantity = safeToPositiveIntegerOrDefault(p.quantity); }); dataToSave.originCity = dataToSave.originCity || null; dataToSave.destination = dataToSave.destination || null; dataToSave.notes = dataToSave.notes || null; dataToSave.extraInfo = dataToSave.extraInfo || null; Object.keys(dataToSave).forEach(key => { if (dataToSave[key] === undefined) { delete dataToSave[key]; } }); dataToSave.participants = dataToSave.participants || []; dataToSave.reminders = dataToSave.reminders || []; dataToSave.transportations = dataToSave.transportations || []; dataToSave.accommodations = dataToSave.accommodations || []; dataToSave.itinerary = dataToSave.itinerary || []; dataToSave.budget = dataToSave.budget || { items: [], estimatedTotal: 0, actualTotal: 0 }; dataToSave.budget.items = dataToSave.budget.items || []; dataToSave.packingList = dataToSave.packingList || []; return dataToSave; };
    const processTripDataFromFirestore = (docId, firestoreData) => { const trip = { ...firestoreData, id: docId }; trip.startDate = fromTimestampToDateString(trip.startDate); trip.endDate = fromTimestampToDateString(trip.endDate); trip.createdAt = fromTimestampToString(trip.createdAt); trip.updatedAt = fromTimestampToString(trip.updatedAt); if (trip.reminders) trip.reminders.forEach(r => r.dueDate = fromTimestampToDateString(r.dueDate)); if (trip.transportations) trip.transportations.forEach(t => { t.departureDateTime = fromTimestampToString(t.departureDateTime); t.arrivalDateTime = fromTimestampToString(t.arrivalDateTime); }); if (trip.accommodations) trip.accommodations.forEach(a => { a.checkinDateTime = fromTimestampToString(a.checkinDateTime); a.checkoutDateTime = fromTimestampToString(a.checkoutDateTime); }); trip.participants = (trip.participants || []).map(p => ({...p, extraInfo: p.extraInfo || '' })); trip.reminders = (trip.reminders || []).map(r => ({...r, status: r.status || 'todo' })); trip.transportations = (trip.transportations || []).map(t => ({ ...t, cost: t.cost ?? null, link: t.link || null })); trip.accommodations = (trip.accommodations || []).map(a => ({ ...a, cost: a.cost ?? null, link: a.link || null })); trip.itinerary = (trip.itinerary || []).map(i => ({ ...i, cost: i.cost ?? null, link: i.link || null, bookingRef: i.bookingRef || null })); trip.budget = trip.budget || { items: [], estimatedTotal: 0, actualTotal: 0 }; trip.budget.items = (trip.budget.items || []).map(b => ({ ...b, estimated: b.estimated ?? 0, actual: b.actual ?? null, paidBy: b.paidBy || null, splitBetween: b.splitBetween || null })); trip.packingList = (trip.packingList || []).map(p => ({...p, quantity: p.quantity || 1, category: p.category || 'Altro', packed: p.packed || false })); let calcEst = 0, calcAct = 0; trip.budget.items.forEach(item => { const est = safeToNumberOrNull(item.estimated); const act = safeToNumberOrNull(item.actual); if (est !== null) calcEst += est; if (act !== null) calcAct += act; }); trip.budget.estimatedTotal = calcEst; trip.budget.actualTotal = calcAct; return trip; };

    // ==========================================================================
    // == GESTIONE STORAGE (Firestore) ==
    // ==========================================================================
    const loadUserTrips = async (uid) => { if (!uid || !db) { trips = []; renderTripList(); deselectTrip(); return; } if(loadingTripsDiv) loadingTripsDiv.style.display = 'block'; if(noTripsMessage) noTripsMessage.style.display = 'none'; tripListUl.innerHTML = ''; deselectTrip(); try { const tripsColRef = collection(db, 'users', uid, 'trips'); const q = query(tripsColRef, orderBy("createdAt", "desc")); const querySnapshot = await getDocs(q); const userTrips = []; querySnapshot.forEach((doc) => { userTrips.push(processTripDataFromFirestore(doc.id, doc.data())); }); trips = userTrips; console.log(`Caricati ${trips.length} viaggi per l'utente ${uid}`); renderTripList(); } catch (error) { console.error("Errore caricamento viaggi:", error); showToast("Errore nel caricamento dei tuoi viaggi.", "error"); trips = []; renderTripList(); deselectTrip(); } finally { if(loadingTripsDiv) loadingTripsDiv.style.display = 'none'; if(noTripsMessage && trips.length === 0) noTripsMessage.style.display = 'block'; } };
    const saveTripToFirestore = async (tripData) => { if (!currentUserId) { showToast("Errore: Utente non loggato.", "error"); return null; } if (!tripData || typeof tripData !== 'object') { showToast("Errore: Dati viaggio non validi.", "error"); return null; } const isNewTrip = !findTripById(tripData.id); const dataToSave = prepareTripDataForFirestore(tripData); const tripsColRef = collection(db, 'users', currentUserId, 'trips'); try { let docRef; let message; if (isNewTrip) { docRef = await addDoc(tripsColRef, dataToSave); console.log("Nuovo viaggio salvato con ID:", docRef.id); message = `Viaggio "${dataToSave.name}" creato!`; tripData.id = docRef.id; showToast(message, "success"); return docRef.id; } else { docRef = doc(db, 'users', currentUserId, 'trips', tripData.id); await setDoc(docRef, dataToSave); console.log("Viaggio aggiornato con ID:", tripData.id); message = `Viaggio "${dataToSave.name}" aggiornato!`; showToast(message, "success"); return tripData.id; } } catch (error) { console.error("Errore salvataggio viaggio:", error); showToast("Errore durante il salvataggio.", "error"); return null; } };
    const deleteTripFromFirestore = async (tripId) => { if (!currentUserId || !tripId) { showToast("Errore: Utente non loggato o ID viaggio mancante.", "error"); return false; } const tripDocRef = doc(db, 'users', currentUserId, 'trips', tripId); try { await deleteDoc(tripDocRef); console.log(`Viaggio ${tripId} eliminato.`); return true; } catch (error) { console.error(`Errore eliminazione viaggio ${tripId}:`, error); showToast("Errore durante l'eliminazione.", "error"); return false; } };

    // ==========================================================================
    // == LOGICA VIAGGI ==
    // ==========================================================================
    const findTripById = (id) => trips.find(trip => trip && trip.id === id);
    const renderTripList = () => { const searchTerm = currentSearchTerm.trip.toLowerCase(); tripListUl.innerHTML = ''; const filteredTrips = trips.filter(trip => { if (!trip || !trip.id) return false; if (trip.isTemplate) return false; const tripNameLower = (trip.name || '').toLowerCase(); const destinationLower = (trip.destination || '').toLowerCase(); return !searchTerm || tripNameLower.includes(searchTerm) || destinationLower.includes(searchTerm); }); const sortedTrips = filteredTrips.sort((a, b) => (a.name || '').localeCompare(b?.name || '')); sortedTrips.forEach(trip => { const li = createTripListItem(trip, true); tripListUl.appendChild(li); }); const hasVisibleTrips = sortedTrips.length > 0; if(noTripsMessage) noTripsMessage.style.display = trips.length === 0 || !hasVisibleTrips ? 'block' : 'none'; if(loadingTripsDiv) loadingTripsDiv.style.display = 'none'; };
    const createTripListItem = (trip, isVisible) => { const li = document.createElement('li'); li.dataset.tripId = trip.id; li.innerHTML = `<span>${trip.name || 'Senza Nome'} (${formatDate(trip.startDate)} - ${formatDate(trip.endDate)})</span> <button class="btn-icon delete btn-delete-trip" data-trip-id="${trip.id}" title="Elimina"><i class="fas fa-trash-alt"></i></button>`; if (trip.id === currentTripId) { li.classList.add('active'); } if (!isVisible) li.classList.add('hidden'); li.addEventListener('click', (e) => { if (!e.target.closest('.btn-delete-trip')) { selectTrip(trip.id); } }); const deleteButton = li.querySelector('.btn-delete-trip'); if (deleteButton) { deleteButton.addEventListener('click', (e) => { e.stopPropagation(); handleDeleteTrip(trip.id); }); } return li; };
    const selectTrip = (id) => { if (!id) { deselectTrip(); return; } if (currentTripId === id && tripDetailsAreaDiv.style.display !== 'none') return; const trip = findTripById(id); if (trip) { currentTripId = id; saveLocalStorageAppState(); currentSearchTerm.itinerary = ''; if(searchItineraryInput) searchItineraryInput.value = ''; currentSearchTerm.packing = ''; if(searchPackingInput) searchPackingInput.value = ''; currentSort = { transport: 'departureDateTime', itinerary: 'dateTime', budget: 'category', packing: 'name', reminder: 'dueDate' }; applyCurrentSortToControls(); renderTripList(); renderTripDetails(trip); if(tripDetailsAreaDiv) tripDetailsAreaDiv.style.display = 'block'; if(welcomeMessageDiv) welcomeMessageDiv.style.display = 'none'; Object.keys(editingItemId).forEach(key => { if (editingItemId[key]) resetEditState(key); }); switchTab('info-tab'); } else { console.warn(`Tentativo di selezionare viaggio con ID ${id} non trovato.`); deselectTrip(); } };
    const deselectTrip = () => { currentTripId = null; saveLocalStorageAppState(); if(tripDetailsAreaDiv) tripDetailsAreaDiv.style.display = 'none'; if(welcomeMessageDiv && currentUserId) welcomeMessageDiv.style.display = 'flex'; if(downloadTextBtn) downloadTextBtn.disabled = true; if(downloadExcelBtn) downloadExcelBtn.disabled = true; if(deleteTripBtn) deleteTripBtn.disabled = true; if (shareTripBtn) shareTripBtn.disabled = true; if(emailSummaryBtn) emailSummaryBtn.disabled = true; if(copySummaryBtn) copySummaryBtn.disabled = true; renderTripList(); };
    const renderTripDetails = (trip) => { if (!trip || !trip.id) { deselectTrip(); return; } if(tripTitleH2) tripTitleH2.textContent = trip.name || 'Senza Nome'; if(editTripIdInput) editTripIdInput.value = trip.id; if(tripNameInput) tripNameInput.value = trip.name || ''; if(tripOriginCityInput) tripOriginCityInput.value = trip.originCity || ''; if(tripDestinationInput) tripDestinationInput.value = trip.destination || ''; if(tripStartDateInput) tripStartDateInput.value = trip.startDate || ''; if(tripEndDateInput) tripEndDateInput.value = trip.endDate || ''; if(tripIsTemplateCheckbox) tripIsTemplateCheckbox.checked = false; if(tripNotesTextarea) tripNotesTextarea.value = trip.notes || ''; if(tripExtraInfoTextarea) tripExtraInfoTextarea.value = trip.extraInfo || ''; renderParticipants(trip.participants); renderReminders(trip.reminders); renderTransportations(trip.transportations); renderAccommodations(trip.accommodations); renderItinerary(trip.itinerary); renderBudget(trip.budget); renderPackingList(trip.packingList); populateDatalists(trip); const actionsEnabled = !!trip.id; if(downloadTextBtn) downloadTextBtn.disabled = !actionsEnabled; if(downloadExcelBtn) downloadExcelBtn.disabled = !actionsEnabled; if(deleteTripBtn) deleteTripBtn.disabled = !actionsEnabled; if (shareTripBtn) shareTripBtn.disabled = !actionsEnabled || (currentUser && currentUser.isAnonymous); if(emailSummaryBtn) emailSummaryBtn.disabled = !actionsEnabled; if(copySummaryBtn) copySummaryBtn.disabled = !actionsEnabled; toggleSearchButtonsVisibility(); };
    const handleNewTrip = () => { if (!currentUserId) { showToast("Devi essere loggato per creare un viaggio.", "warning"); return; } openNewTripModal(); };
    const handleCreateTripConfirm = async () => { const tripName = newTripNameInput.value.trim(); if (!tripName) { if (newTripErrorP) { newTripErrorP.textContent = 'Il nome non può essere vuoto.'; newTripErrorP.style.display = 'block'; } newTripNameInput.focus(); return; } if (!currentUserId) { showToast("Errore: Utente non identificato.", "error"); return; } if (newTripErrorP) newTripErrorP.style.display = 'none'; const newTripData = { name: tripName, originCity: '', destination: '', startDate: null, endDate: null, notes: '', isTemplate: false, extraInfo: '', participants: [], reminders: [], transportations: [], accommodations: [], itinerary: [], budget: { items: [], estimatedTotal: 0, actualTotal: 0 }, packingList: [], createdAt: Timestamp.now() }; if(createTripConfirmBtn) createTripConfirmBtn.disabled = true; const newTripId = await saveTripToFirestore(newTripData); if(createTripConfirmBtn) createTripConfirmBtn.disabled = false; if (newTripId) { const savedTrip = processTripDataFromFirestore(newTripId, prepareTripDataForFirestore({ ...newTripData, id: newTripId })); trips.unshift(savedTrip); closeNewTripModal(); renderTripList(); selectTrip(newTripId); } else { if (newTripErrorP) { newTripErrorP.textContent = 'Errore durante la creazione.'; newTripErrorP.style.display = 'block'; } } };
    const handleSaveTripInfo = async (e) => { e.preventDefault(); if (!currentTripId || !currentUserId) return; const tripIndex = trips.findIndex(t => t.id === currentTripId); if (tripIndex === -1) { showToast("Errore: Viaggio non trovato.", "error"); return; } const trip = trips[tripIndex]; const start = tripStartDateInput.value, end = tripEndDateInput.value; if (start && end && start > end) { showToast('Data fine non valida.', 'error'); return; } trip.name = tripNameInput.value.trim() || 'Viaggio S.N.'; trip.originCity = tripOriginCityInput ? tripOriginCityInput.value.trim() : trip.originCity; trip.destination = tripDestinationInput ? tripDestinationInput.value.trim() : trip.destination; trip.startDate = start || null; trip.endDate = end || null; trip.notes = tripNotesTextarea ? tripNotesTextarea.value.trim() : trip.notes; trip.extraInfo = tripExtraInfoTextarea ? tripExtraInfoTextarea.value.trim() : trip.extraInfo; trip.updatedAt = new Date().toISOString(); const success = await saveTripToFirestore(trip); if (success) { if(tripTitleH2) tripTitleH2.textContent = trip.name; renderTripList(); } };
    const handleDeleteTrip = (id) => { if (!currentUserId || !id) return; const trip = findTripById(id); if (!trip) { showToast(`Viaggio non trovato`, "warning"); return; } showConfirmationModal( `Conferma Eliminazione Viaggio`, `Eliminare "${trip.name || 'S.N.'}"?`, async () => { const success = await deleteTripFromFirestore(id); if (success) { trips = trips.filter(t => t.id !== id); saveLocalStorageAppState(); if (currentTripId === id) { deselectTrip(); } else { renderTripList(); } showToast(`Viaggio "${trip.name || 'S.N.'}" eliminato.`, 'info'); } } ); };
    const openSelectTemplateModal = () => { showToast("Funzionalità template non disponibile.", "info"); };
    const handleSearchTrip = (e) => { currentSearchTerm.trip = e.target.value; renderTripList(); };

    // ==========================================================================
    // == FUNZIONI MODIFICA ITEM ==
    // ==========================================================================
    const startEditItem = (listType, itemId) => { if (!currentTripId) return; const trip = findTripById(currentTripId); if (!trip) return; let itemToEdit = null; let list = []; switch (listType) { case 'participant': list = trip.participants || []; break; case 'reminder': list = trip.reminders || []; break; case 'transport': list = trip.transportations || []; break; case 'accommodation': list = trip.accommodations || []; break; case 'itinerary': list = trip.itinerary || []; break; case 'budget': list = trip.budget?.items || []; break; case 'packing': list = trip.packingList || []; break; default: return; } itemToEdit = list.find(item => item && item.id === itemId); if (!itemToEdit) { console.error(`Item ${itemId} non trovato in lista ${listType}`); return; } editingItemId[listType] = itemId; const form = document.getElementById(`add-${listType}-item-form`); const submitBtn = document.getElementById(`${listType}-submit-btn`); const cancelBtn = document.getElementById(`${listType}-cancel-edit-btn`); const hiddenInput = document.getElementById(`edit-${listType}-item-id`); if (hiddenInput) hiddenInput.value = itemId; try { switch (listType) { case 'participant': participantNameInput.value = itemToEdit.name || ''; participantNotesInput.value = itemToEdit.notes || ''; participantExtraInfoTextarea.value = itemToEdit.extraInfo || ''; break; case 'reminder': reminderDescriptionInput.value = itemToEdit.description || ''; reminderDueDateInput.value = itemToEdit.dueDate || ''; reminderStatusSelect.value = itemToEdit.status || 'todo'; break; case 'transport': transportTypeSelect.value = itemToEdit.type || 'Altro'; transportDescriptionInput.value = itemToEdit.description || ''; transportDepartureLocInput.value = itemToEdit.departureLoc || ''; transportDepartureDatetimeInput.value = itemToEdit.departureDateTime || ''; transportArrivalLocInput.value = itemToEdit.arrivalLoc || ''; transportArrivalDatetimeInput.value = itemToEdit.arrivalDateTime || ''; transportBookingRefInput.value = itemToEdit.bookingRef || ''; transportCostInput.value = itemToEdit.cost ?? ''; transportNotesInput.value = itemToEdit.notes || ''; transportLinkInput.value = itemToEdit.link || ''; break; case 'accommodation': accommodationNameInput.value = itemToEdit.name || ''; accommodationTypeSelect.value = itemToEdit.type || 'Hotel'; accommodationAddressInput.value = itemToEdit.address || ''; accommodationCheckinInput.value = itemToEdit.checkinDateTime || ''; accommodationCheckoutInput.value = itemToEdit.checkoutDateTime || ''; accommodationBookingRefInput.value = itemToEdit.bookingRef || ''; accommodationCostInput.value = itemToEdit.cost ?? ''; accommodationNotesInput.value = itemToEdit.notes || ''; accommodationLinkInput.value = itemToEdit.link || ''; break; case 'itinerary': itineraryDayInput.value = itemToEdit.day || ''; itineraryTimeInput.value = itemToEdit.time || ''; itineraryActivityInput.value = itemToEdit.activity || ''; itineraryLocationInput.value = itemToEdit.location || ''; itineraryBookingRefInput.value = itemToEdit.bookingRef || ''; itineraryCostInput.value = itemToEdit.cost ?? ''; itineraryNotesInput.value = itemToEdit.notes || ''; itineraryLinkInput.value = itemToEdit.link || ''; break; case 'budget': budgetCategorySelect.value = itemToEdit.category || 'Altro'; budgetDescriptionInput.value = itemToEdit.description || ''; budgetEstimatedInput.value = itemToEdit.estimated ?? ''; budgetActualInput.value = itemToEdit.actual ?? ''; budgetPaidByInput.value = itemToEdit.paidBy || ''; budgetSplitBetweenInput.value = itemToEdit.splitBetween || ''; break; case 'packing': packingItemNameInput.value = itemToEdit.name || ''; packingItemCategoryInput.value = itemToEdit.category || 'Altro'; packingItemQuantityInput.value = itemToEdit.quantity || 1; break; } } catch (error) { console.error(`Errore popola form ${listType}:`, error); showToast(`Errore caricamento dati.`, 'error'); resetEditState(listType); return; } if (submitBtn) { submitBtn.innerHTML = '<i class="fas fa-save"></i> Salva Modifiche'; submitBtn.classList.remove('btn-secondary'); submitBtn.classList.add('btn-warning'); } if (cancelBtn) cancelBtn.style.display = 'inline-flex'; if (listType === 'transport') toggleSearchButtonsVisibility(); if (form) form.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); };
    const handleItemFormSubmit = async (e, listType) => { e.preventDefault(); if (!currentTripId || !currentUserId) return; const tripIndex = trips.findIndex(t => t.id === currentTripId); if (tripIndex === -1) { showToast("Errore: Viaggio corrente non trovato.", "error"); return; } const trip = trips[tripIndex]; const currentEditId = editingItemId[listType]; let itemData = {}; let list = []; let listOwner = trip; let renderFn; switch (listType) { case 'participant': list = trip.participants = trip.participants || []; renderFn = renderParticipants; break; case 'reminder': list = trip.reminders = trip.reminders || []; renderFn = renderReminders; break; case 'transport': list = trip.transportations = trip.transportations || []; renderFn = renderTransportations; break; case 'accommodation': list = trip.accommodations = trip.accommodations || []; renderFn = renderAccommodations; break; case 'itinerary': list = trip.itinerary = trip.itinerary || []; renderFn = renderItinerary; break; case 'budget': trip.budget = trip.budget || { items: [], estimatedTotal: 0, actualTotal: 0 }; list = trip.budget.items = trip.budget.items || []; listOwner = trip.budget; renderFn = renderBudget; break; case 'packing': list = trip.packingList = trip.packingList || []; renderFn = renderPackingList; break; default: console.error("Tipo lista non valido:", listType); return; } try { switch (listType) { case 'participant': if (!participantNameInput.value.trim()) throw new Error("Nome partecipante richiesto."); itemData = { name: participantNameInput.value.trim(), notes: participantNotesInput.value.trim() || null, extraInfo: participantExtraInfoTextarea.value.trim() || null }; break; case 'reminder': if (!reminderDescriptionInput.value.trim()) throw new Error("Descrizione promemoria richiesta."); itemData = { description: reminderDescriptionInput.value.trim(), dueDate: reminderDueDateInput.value || null, status: reminderStatusSelect.value }; break; case 'transport': if (!transportDescriptionInput.value.trim()) throw new Error("Descrizione trasporto richiesta."); const depDateTime = transportDepartureDatetimeInput.value || null; const arrDateTime = transportArrivalDatetimeInput.value || null; if (depDateTime && arrDateTime && depDateTime >= arrDateTime) throw new Error("Arrivo deve essere dopo partenza."); const transportCost = safeToNumberOrNull(transportCostInput.value); if(transportCost !== null && transportCost < 0) throw new Error("Costo trasporto non valido."); itemData = { type: transportTypeSelect.value, description: transportDescriptionInput.value.trim(), departureLoc: transportDepartureLocInput.value.trim() || null, departureDateTime: depDateTime, arrivalLoc: transportArrivalLocInput.value.trim() || null, arrivalDateTime: arrDateTime, bookingRef: transportBookingRefInput.value.trim() || null, cost: transportCost, notes: transportNotesInput.value.trim() || null, link: transportLinkInput.value.trim() || null }; break; case 'accommodation': if (!accommodationNameInput.value.trim()) throw new Error("Nome alloggio richiesto."); const checkin = accommodationCheckinInput.value || null; const checkout = accommodationCheckoutInput.value || null; if(checkin && checkout && checkin >= checkout) throw new Error("Check-out deve essere dopo check-in."); const accomCost = safeToNumberOrNull(accommodationCostInput.value); if(accomCost !== null && accomCost < 0) throw new Error("Costo alloggio non valido."); itemData = { name: accommodationNameInput.value.trim(), type: accommodationTypeSelect.value, address: accommodationAddressInput.value.trim() || null, checkinDateTime: checkin, checkoutDateTime: checkout, bookingRef: accommodationBookingRefInput.value.trim() || null, cost: accomCost, notes: accommodationNotesInput.value.trim() || null, link: accommodationLinkInput.value.trim() || null }; break; case 'itinerary': const itinDay = itineraryDayInput.value; const itinAct = itineraryActivityInput.value.trim(); if (!itinDay || !itinAct) throw new Error("Giorno e attività richiesti."); const itinStartDate = trip.startDate ? trip.startDate.split('T')[0] : null; const itinEndDate = trip.endDate ? trip.endDate.split('T')[0] : null; if (itinStartDate && itinEndDate && itinDay && (itinDay < itinStartDate || itinDay > itinEndDate)) showToast(`Attenzione: data ${formatDate(itinDay)} fuori dal periodo del viaggio (${formatDate(itinStartDate)} - ${formatDate(itinEndDate)}).`, 'warning'); const itinCost = safeToNumberOrNull(itineraryCostInput.value); if(itinCost !== null && itinCost < 0) throw new Error("Costo attività non valido."); itemData = { day: itinDay, time: itineraryTimeInput.value || null, activity: itinAct, location: itineraryLocationInput.value.trim() || null, bookingRef: itineraryBookingRefInput.value.trim() || null, cost: itinCost, notes: itineraryNotesInput.value.trim() || null, link: itineraryLinkInput.value.trim() || null }; break; case 'budget': const descBudget = budgetDescriptionInput.value.trim(); const est = safeToNumberOrNull(budgetEstimatedInput.value); const act = safeToNumberOrNull(budgetActualInput.value); if (!descBudget || est === null || est < 0) throw new Error("Descrizione e costo stimato validi richiesti."); if (act !== null && act < 0) throw new Error("Costo effettivo non valido."); itemData = { category: budgetCategorySelect.value, description: descBudget, estimated: est, actual: act, paidBy: budgetPaidByInput.value.trim() || null, splitBetween: budgetSplitBetweenInput.value.trim() || null }; break; case 'packing': if (!packingItemNameInput.value.trim()) throw new Error("Nome oggetto richiesto."); const quantity = safeToPositiveIntegerOrDefault(packingItemQuantityInput.value); itemData = { name: packingItemNameInput.value.trim(), category: packingItemCategoryInput.value.trim() || 'Altro', quantity: quantity }; break; } } catch (error) { showToast(`Errore: ${error.message}`, "error"); return; } if (currentEditId) { const idx = list.findIndex(i => i && i.id === currentEditId); if (idx > -1) { const oldItem = list[idx]; list[idx] = { ...itemData, id: currentEditId, ...(listType === 'packing' ? { packed: oldItem.packed } : {}) }; } else { console.error(`Item ${currentEditId} non trovato.`); showToast("Errore: elemento da modificare non trovato.", "error"); return; } } else { itemData.id = generateId(listType); if (listType === 'packing') itemData.packed = false; if (listType === 'reminder') itemData.status = itemData.status || 'todo'; list.push(itemData); } if (listType === 'budget') { let calcEst = 0, calcAct = 0; trip.budget.items.forEach(item => { const est = safeToNumberOrNull(item.estimated); const act = safeToNumberOrNull(item.actual); if (est !== null) calcEst += est; if (act !== null) calcAct += act; }); trip.budget.estimatedTotal = calcEst; trip.budget.actualTotal = calcAct; } trip.updatedAt = new Date().toISOString(); const success = await saveTripToFirestore(trip); if (success) { if (listType === 'budget') { renderFn(listOwner); } else { renderFn(list); } resetEditState(listType); if(listType === 'participant') populateDatalists(trip); if(listType === 'packing') populatePackingCategoriesDatalist(trip.packingList); } };
    const handleDeleteItem = (listType, itemId) => { if (!currentTripId || !currentUserId) return; const tripIndex = trips.findIndex(t => t.id === currentTripId); if (tripIndex === -1) return; const trip = trips[tripIndex]; let list, renderFn, listOwner = trip, itemName = "voce"; switch(listType) { case 'participant': list = trip.participants || []; renderFn = renderParticipants; itemName="partecipante"; break; case 'reminder': list = trip.reminders || []; renderFn = renderReminders; itemName="promemoria"; break; case 'transport': list = trip.transportations || []; renderFn = renderTransportations; itemName="trasporto"; break; case 'accommodation': list = trip.accommodations || []; renderFn = renderAccommodations; itemName="alloggio"; break; case 'itinerary': list = trip.itinerary || []; renderFn = renderItinerary; itemName="attività"; break; case 'budget': if (!trip.budget || !trip.budget.items) return; list = trip.budget.items; renderFn = renderBudget; listOwner = trip.budget; itemName="spesa"; break; case 'packing': list = trip.packingList || []; renderFn = renderPackingList; itemName="oggetto"; break; default: return; } if (!Array.isArray(list)) { return; } const itemIndex = list.findIndex(item => item && item.id === itemId); if (itemIndex > -1) { const itemDesc = list[itemIndex].name || list[itemIndex].description || list[itemIndex].activity || `ID: ${itemId}`; showConfirmationModal( `Conferma Eliminazione ${itemName}`, `Eliminare "${itemDesc}"?`, async () => { list.splice(itemIndex, 1); if (listType === 'budget') { let calcEst = 0, calcAct = 0; trip.budget.items.forEach(item => { const est = safeToNumberOrNull(item.estimated); const act = safeToNumberOrNull(item.actual); if (est !== null) calcEst += est; if (act !== null) calcAct += act; }); trip.budget.estimatedTotal = calcEst; trip.budget.actualTotal = calcAct; } trip.updatedAt = new Date().toISOString(); const success = await saveTripToFirestore(trip); if (success) { if (listType === 'budget') { renderFn(listOwner); } else { renderFn(list); } if (editingItemId[listType] === itemId) resetEditState(listType); showToast(`${itemName.charAt(0).toUpperCase() + itemName.slice(1)} eliminato/a.`, 'info'); if(listType === 'participant') populateDatalists(trip); if(listType === 'packing') populatePackingCategoriesDatalist(trip.packingList); } } ); } };
    const handleTogglePacked = async (itemId, isPacked) => { if (!currentTripId || !currentUserId) return; const tripIndex = trips.findIndex(t => t.id === currentTripId); if (tripIndex === -1) return; const trip = trips[tripIndex]; if (!trip.packingList) trip.packingList = []; const idx = trip.packingList.findIndex(i => i && i.id === itemId); if (idx > -1) { trip.packingList[idx].packed = isPacked; trip.updatedAt = new Date().toISOString(); const success = await saveTripToFirestore(trip); if (success) { if (currentSort.packing === 'status') { renderPackingList(trip.packingList); } else { const li = packingListUl?.querySelector(`li[data-item-id="${itemId}"]`); if (li) li.classList.toggle('packed', isPacked); const checkbox = packingListUl?.querySelector(`input[data-item-id="${itemId}"]`); if (checkbox) checkbox.checked = isPacked; } } } };
    const handleImportPackingList = async (type) => { if (!currentTripId || !PREDEFINED_PACKING_LISTS[type] || !currentUserId) return; const tripIndex = trips.findIndex(t => t.id === currentTripId); if (tripIndex === -1) return; const trip = trips[tripIndex]; const predefined = PREDEFINED_PACKING_LISTS[type]; let added = 0; trip.packingList = trip.packingList || []; const currentLower = trip.packingList.map(i => (i?.name || '').toLowerCase()); predefined.forEach(predefItem => { if (!currentLower.includes(predefItem.name.toLowerCase())) { trip.packingList.push({ id: generateId('pack'), name: predefItem.name, packed: false, category: predefItem.category || 'Altro', quantity: predefItem.quantity || 1 }); added++; } }); if (added > 0) { trip.updatedAt = new Date().toISOString(); const success = await saveTripToFirestore(trip); if (success) { renderPackingList(trip.packingList); populatePackingCategoriesDatalist(trip.packingList); showToast(`${added} oggetti aggiunti!`, 'success'); } } else { showToast(`Nessun nuovo oggetto da aggiungere.`, 'info'); } };
    const addCostToBudget = async (category, description, cost) => { if (!currentTripId || cost === null || cost <= 0 || !currentUserId) return false; const tripIndex = trips.findIndex(t => t.id === currentTripId); if (tripIndex === -1) return false; const trip = trips[tripIndex]; const budgetItem = { id: generateId('budget'), category: category, description: description, estimated: cost, actual: null, paidBy: null, splitBetween: null }; trip.budget = trip.budget || { items: [], estimatedTotal: 0, actualTotal: 0 }; trip.budget.items = trip.budget.items || []; trip.budget.items.push(budgetItem); trip.budget.estimatedTotal = (trip.budget.estimatedTotal || 0) + cost; trip.updatedAt = new Date().toISOString(); const success = await saveTripToFirestore(trip); if (success) { renderBudget(trip.budget); return true; } else { trip.budget.items.pop(); trip.budget.estimatedTotal -= cost; renderBudget(trip.budget); return false; } };
    const handleCalculateAndAddTotalCostToBudget = async (itemTypeKey, categoryName) => { if (!currentTripId) { showToast("Seleziona un viaggio.", "error"); return; } const trip = findTripById(currentTripId); if (!trip || !Array.isArray(trip[itemTypeKey])) { showToast(`Errore dati ${categoryName.toLowerCase()}.`, "error"); return; } let totalCost = 0; trip[itemTypeKey].forEach(item => { const cost = Number(item?.cost || 0); if (!isNaN(cost) && cost > 0) { totalCost += cost; } }); if (totalCost <= 0) { showToast(`Nessun costo valido da aggiungere per ${categoryName.toLowerCase()}.`, "info"); return; } const success = await addCostToBudget( categoryName, `Totale Costi ${categoryName} (del ${formatDate(new Date().toISOString().slice(0,10))})`, totalCost ); if(success) { showToast(`Costo ${categoryName.toLowerCase()} (${formatCurrency(totalCost)}) aggiunto al budget!`, 'success'); switchTab('budget-tab'); } };

    // ==========================================================================
    // == FUNZIONI RENDER LISTE ==
    // ==========================================================================
    const populateDatalists = (trip) => { if (!trip || !participantDatalist) return; participantDatalist.innerHTML = ''; (trip.participants || []).forEach(p => { const option = document.createElement('option'); option.value = p.name; participantDatalist.appendChild(option); }); populatePackingCategoriesDatalist(trip.packingList); };
    const populatePackingCategoriesDatalist = (packingList) => { if (!packingCategoryDatalist) return; packingCategoryDatalist.innerHTML = ''; const categories = new Set(DEFAULT_PACKING_CATEGORIES); (packingList || []).forEach(p => { if(p.category) categories.add(p.category); }); Array.from(categories).sort().forEach(cat => { const option = document.createElement('option'); option.value = cat; packingCategoryDatalist.appendChild(option); }); };
    const renderParticipants = (participantsInput = []) => { const items = Array.isArray(participantsInput) ? participantsInput : []; if (!participantListUl) return; participantListUl.innerHTML = ''; if(noParticipantsItemsP) noParticipantsItemsP.style.display = items.length === 0 ? 'block' : 'none'; if (!Array.isArray(items)) return; items.sort((a, b) => (a?.name || '').localeCompare(b?.name || '')); items.forEach(item => { if (!item || !item.id) return; const li = document.createElement('li'); li.dataset.itemId = item.id; li.innerHTML = ` <div class="item-details"> <strong><i class="fas fa-user fa-fw"></i> ${item.name || 'N/D'}</strong> ${item.notes ? `<span class="meta"><i class="fas fa-info-circle fa-fw"></i> ${item.notes}</span>`:''} ${item.extraInfo ? `<span class="meta"><i class="fas fa-sticky-note fa-fw"></i> ${item.extraInfo}</span>`:''} </div> <div class="item-actions"> <button class="btn-icon edit" data-item-id="${item.id}" data-item-type="participant" title="Modifica"><i class="fas fa-edit"></i></button> <button class="btn-icon delete" data-item-id="${item.id}" data-item-type="participant" title="Elimina"><i class="fas fa-trash-alt"></i></button> </div>`; participantListUl.appendChild(li); }); };
    const renderReminders = (remindersInput = []) => { let items = Array.isArray(remindersInput) ? remindersInput : []; if (!reminderListUl) return; reminderListUl.innerHTML = ''; if(noReminderItemsP) noReminderItemsP.style.display = items.length === 0 ? 'block' : 'none'; if (!Array.isArray(items)) return; const sortKey = currentSort.reminder; items.sort((a, b) => { if (sortKey === 'dueDate') { return (a?.dueDate || '9999-12-31').localeCompare(b?.dueDate || '9999-12-31'); } if (sortKey === 'status') { const statusOrder = { 'todo': 0, 'done': 1 }; return (statusOrder[a?.status] ?? 9) - (statusOrder[b?.status] ?? 9) || (a?.dueDate || '9999').localeCompare(b?.dueDate || '9999'); } return (a?.description || '').localeCompare(b?.description || ''); }); items.forEach(item => { if (!item || !item.id) return; const li = document.createElement('li'); li.dataset.itemId = item.id; li.classList.toggle('done', item.status === 'done'); const statusClass = item.status === 'done' ? 'done' : 'todo'; const statusText = item.status === 'done' ? 'FATTO' : 'DA FARE'; li.innerHTML = ` <div class="item-details"> <strong> <span class="status-indicator ${statusClass}">${statusText}</span> ${item.description || 'N/D'} </strong> ${item.dueDate ? `<span class="meta due-date"><i class="fas fa-calendar-alt fa-fw"></i> Scadenza: ${formatDate(item.dueDate)}</span>` : ''} </div> <div class="item-actions"> <button class="btn-icon edit" data-item-id="${item.id}" data-item-type="reminder" title="Modifica"><i class="fas fa-edit"></i></button> <button class="btn-icon delete" data-item-id="${item.id}" data-item-type="reminder" title="Elimina"><i class="fas fa-trash-alt"></i></button> </div>`; reminderListUl.appendChild(li); }); };
    const renderTransportations = (transportItemsInput) => { let items = Array.isArray(transportItemsInput) ? transportItemsInput : []; if (!transportListUl) return; transportListUl.innerHTML = ''; if(noTransportItemsP) noTransportItemsP.style.display = items.length === 0 ? 'block' : 'none'; if (!Array.isArray(items)) return; const sortKey = currentSort.transport; items.sort((a, b) => { if (sortKey === 'type') { return (a?.type || '').localeCompare(b?.type || '') || (a?.departureDateTime || '').localeCompare(b?.departureDateTime || ''); } if (sortKey === 'cost') { return (b?.cost ?? -Infinity) - (a?.cost ?? -Infinity); } return (a?.departureDateTime || '').localeCompare(b?.departureDateTime || ''); }); items.forEach(item => { if (!item || !item.id) return; const li = document.createElement('li'); li.dataset.itemId = item.id; const iconClass = getTransportIcon(item.type); li.innerHTML = ` <div class="item-details"> <strong><i class="fas ${iconClass} fa-fw"></i> ${item.type}: ${item.description || 'N/D'}</strong> <span class="meta"><i class="fas fa-plane-departure fa-fw"></i> Da: ${item.departureLoc || '?'} (${formatDateTime(item.departureDateTime)})</span> <span class="meta"><i class="fas fa-plane-arrival fa-fw"></i> A: ${item.arrivalLoc || '?'} (${formatDateTime(item.arrivalDateTime)})</span> ${item.bookingRef ? `<span class="meta"><i class="fas fa-ticket-alt fa-fw"></i> Rif: ${item.bookingRef}</span>`:''} ${item.cost!==null ? `<span class="meta"><i class="fas fa-euro-sign fa-fw"></i> Costo: ${formatCurrency(item.cost)}</span>`:''} ${item.notes ? `<span class="meta"><i class="fas fa-info-circle fa-fw"></i> Note: ${item.notes}</span>`:''} ${item.link ? `<span class="meta"><i class="fas fa-link fa-fw"></i> Link: ${formatDisplayLink(item.link)}</span>`:''} </div> <div class="item-actions"> <button class="btn-icon edit" data-item-id="${item.id}" data-item-type="transport" title="Modifica"><i class="fas fa-edit"></i></button> <button class="btn-icon delete" data-item-id="${item.id}" data-item-type="transport" title="Elimina"><i class="fas fa-trash-alt"></i></button> </div>`; transportListUl.appendChild(li); }); };
    const getTransportIcon = (type) => { switch(type) { case 'Volo': return 'fa-plane-departure'; case 'Treno': return 'fa-train'; case 'Auto': return 'fa-car'; case 'Bus': return 'fa-bus-alt'; case 'Traghetto': return 'fa-ship'; case 'Metro/Mezzi Pubblici': return 'fa-subway'; case 'Taxi/Ride Sharing': return 'fa-taxi'; default: return 'fa-road'; } };
    const renderAccommodations = (accommodationsInput = []) => { const items = Array.isArray(accommodationsInput) ? accommodationsInput : []; if (!accommodationListUl) return; accommodationListUl.innerHTML = ''; if(noAccommodationItemsP) noAccommodationItemsP.style.display = items.length === 0 ? 'block' : 'none'; if (!Array.isArray(items)) return; items.sort((a, b) => (a?.checkinDateTime || '').localeCompare(b?.checkinDateTime || '')); items.forEach(item => { if (!item || !item.id) return; const li = document.createElement('li'); li.dataset.itemId = item.id; const mapLink = createMapLink(item.address); li.innerHTML = ` <div class="item-details"> <strong><i class="fas fa-hotel fa-fw"></i> ${item.name || 'N/D'} (${item.type || 'N/D'})</strong> ${item.address ? `<span class="meta"><i class="fas fa-map-marker-alt fa-fw"></i> ${item.address} ${mapLink ? `<a href="${mapLink}" target="_blank" rel="noopener noreferrer" class="btn-map-link" title="Mostra Mappa"><i class="fas fa-map-marked-alt"></i></a>` : ''}</span>`:''} <span class="meta"><i class="fas fa-calendar-check fa-fw"></i> Check-in: ${formatDateTime(item.checkinDateTime)}</span> <span class="meta"><i class="fas fa-calendar-times fa-fw"></i> Check-out: ${formatDateTime(item.checkoutDateTime)}</span> ${item.bookingRef ? `<span class="meta"><i class="fas fa-key fa-fw"></i> Rif: ${item.bookingRef}</span>`:''} ${item.cost!==null ? `<span class="meta"><i class="fas fa-euro-sign fa-fw"></i> Costo: ${formatCurrency(item.cost)}</span>`:''} ${item.notes ? `<span class="meta"><i class="fas fa-info-circle fa-fw"></i> Note: ${item.notes}</span>`:''} ${item.link ? `<span class="meta"><i class="fas fa-link fa-fw"></i> Link: ${formatDisplayLink(item.link)}</span>`:''} </div> <div class="item-actions"> <button class="btn-icon edit" data-item-id="${item.id}" data-item-type="accommodation" title="Modifica"><i class="fas fa-edit"></i></button> <button class="btn-icon delete" data-item-id="${item.id}" data-item-type="accommodation" title="Elimina"><i class="fas fa-trash-alt"></i></button> </div>`; accommodationListUl.appendChild(li); }); };
    const renderItinerary = (itineraryItemsInput) => { let items = Array.isArray(itineraryItemsInput) ? itineraryItemsInput : []; if (!itineraryListUl) return; itineraryListUl.innerHTML = ''; if(noItineraryItemsP) noItineraryItemsP.style.display = items.length === 0 ? 'block' : 'none'; if (!Array.isArray(items)) return; const searchTerm = currentSearchTerm.itinerary.toLowerCase(); if (searchTerm) { items = items.filter(item => (item.activity?.toLowerCase() || '').includes(searchTerm) || (item.location?.toLowerCase() || '').includes(searchTerm) || (item.notes?.toLowerCase() || '').includes(searchTerm)); } const sortKey = currentSort.itinerary; items.sort((a, b) => { if (sortKey === 'activity') { return (a?.activity || '').localeCompare(b?.activity || ''); } const dateTimeA = `${a?.day || ''} ${a?.time || ''}`; const dateTimeB = `${b?.day || ''} ${b?.time || ''}`; return dateTimeA.localeCompare(dateTimeB); }); items.forEach(item => { if (!item || !item.id) return; const li = document.createElement('li'); li.dataset.itemId = item.id; const mapLink = createMapLink(item.location); li.innerHTML = ` <div class="item-details"> <strong>${formatDate(item.day)} ${item.time?'('+item.time+')':''} - ${item.activity||'N/D'}</strong> ${item.location ? `<span class="meta"><i class="fas fa-map-marker-alt fa-fw"></i> ${item.location} ${mapLink ? `<a href="${mapLink}" target="_blank" rel="noopener noreferrer" class="btn-map-link" title="Mostra Mappa"><i class="fas fa-map-marked-alt"></i></a>` : ''}</span>`:''} ${item.bookingRef ? `<span class="meta"><i class="fas fa-ticket-alt fa-fw"></i> Rif: ${item.bookingRef}</span>`:''} ${item.cost!==null ? `<span class="meta"><i class="fas fa-euro-sign fa-fw"></i> Costo: ${formatCurrency(item.cost)}</span>`:''} ${item.notes ? `<span class="meta"><i class="fas fa-info-circle fa-fw"></i> Note: ${item.notes}</span>`:''} ${item.link ? `<span class="meta"><i class="fas fa-link fa-fw"></i> Link: ${formatDisplayLink(item.link)}</span>`:''} </div> <div class="item-actions"> <button class="btn-icon edit" data-item-id="${item.id}" data-item-type="itinerary" title="Modifica"><i class="fas fa-edit"></i></button> <button class="btn-icon delete" data-item-id="${item.id}" data-item-type="itinerary" title="Elimina"><i class="fas fa-trash-alt"></i></button> </div>`; itineraryListUl.appendChild(li); }); };
    const renderBudget = (budgetData) => { const safeData = budgetData && typeof budgetData === 'object' ? budgetData : { items: [], estimatedTotal: 0, actualTotal: 0 }; let items = Array.isArray(safeData.items) ? safeData.items : []; if (!budgetListUl) return; budgetListUl.innerHTML = ''; if(noBudgetItemsP) noBudgetItemsP.style.display = items.length === 0 ? 'block' : 'none'; let calcEst = 0; let calcAct = 0; if (!Array.isArray(items)) return; const sortKey = currentSort.budget; items.sort((a, b) => { if (sortKey === 'estimatedDesc') { return (b?.estimated ?? 0) - (a?.estimated ?? 0); } if (sortKey === 'actualDesc') { return (b?.actual ?? -Infinity) - (a?.actual ?? -Infinity); } if (sortKey === 'description') { return (a?.description || '').localeCompare(b?.description || ''); } return (a?.category||'').localeCompare(b?.category||''); }); items.forEach(item => { if (!item || !item.id) return; const est = Number(item.estimated || 0); const act = item.actual === null || typeof item.actual === 'undefined' ? null : Number(item.actual || 0); if (!isNaN(est)) calcEst += est; if (act !== null && !isNaN(act)) calcAct += act; let cls = ''; if (act !== null && !isNaN(act) && est > 0) { if (act > est) cls = 'negative'; else if (act < est) cls = 'positive'; } const li = document.createElement('li'); li.dataset.itemId = item.id; li.innerHTML = ` <div class="item-details"> <strong>${item.category||'N/D'}: ${item.description||'N/D'}</strong> <span class="meta">Stimato: ${formatCurrency(est)} | Effettivo: <span class="${cls}">${act === null ? 'N/A' : formatCurrency(act)}</span></span> ${ (item.paidBy || item.splitBetween) ? `<span class="meta split-info"><i class="fas fa-user-friends fa-fw"></i> Pagato da: ${item.paidBy || '?'} / Diviso tra: ${item.splitBetween || '?'}</span>` : '' } </div> <div class="item-actions"> <button class="btn-icon edit" data-item-id="${item.id}" data-item-type="budget" title="Modifica"><i class="fas fa-edit"></i></button> <button class="btn-icon delete" data-item-id="${item.id}" data-item-type="budget" title="Elimina"><i class="fas fa-trash-alt"></i></button> </div>`; budgetListUl.appendChild(li); }); if(budgetTotalEstimatedStrong) budgetTotalEstimatedStrong.textContent = formatCurrency(calcEst); if(budgetTotalActualStrong) budgetTotalActualStrong.textContent = formatCurrency(calcAct); const diff = calcAct - calcEst; if (budgetDifferenceStrong) { budgetDifferenceStrong.textContent = formatCurrency(diff); budgetDifferenceStrong.className = ''; if (diff < 0) budgetDifferenceStrong.classList.add('positive'); else if (diff > 0) budgetDifferenceStrong.classList.add('negative'); } };
    const renderPackingList = (itemsInput = []) => { let items = Array.isArray(itemsInput) ? itemsInput : []; if (!packingListUl) return; packingListUl.innerHTML = ''; if(noPackingItemsP) noPackingItemsP.style.display = items.length === 0 ? 'block' : 'none'; if (!Array.isArray(items)) return; const searchTerm = currentSearchTerm.packing.toLowerCase(); if (searchTerm) { items = items.filter(item => (item.name?.toLowerCase() || '').includes(searchTerm) || (item.category?.toLowerCase() || '').includes(searchTerm)); } const sortKey = currentSort.packing; items.sort((a, b) => { if (sortKey === 'category') { return (a?.category || 'zzz').localeCompare(b?.category || 'zzz') || (a?.name || '').localeCompare(b?.name || ''); } if (sortKey === 'status') { const packedA = a.packed ? 1 : 0; const packedB = b.packed ? 1 : 0; return packedA - packedB || (a?.name || '').localeCompare(b?.name || ''); } return (a?.name||'').localeCompare(b?.name||''); }); if (sortKey === 'category') { const grouped = items.reduce((acc, item) => { const cat = item.category || 'Altro'; if (!acc[cat]) acc[cat] = []; acc[cat].push(item); return acc; }, {}); const sortedCategories = Object.keys(grouped).sort((a, b) => (a === 'Altro' ? 1 : b === 'Altro' ? -1 : a.localeCompare(b))); packingListUl.innerHTML = ''; sortedCategories.forEach(category => { const groupDiv = document.createElement('div'); groupDiv.classList.add('packing-list-category-group'); const title = document.createElement('h5'); title.textContent = category; groupDiv.appendChild(title); const groupUl = document.createElement('ul'); groupUl.classList.add('item-list', 'packing-list', 'nested'); grouped[category].forEach(item => groupUl.appendChild(createPackingListItem(item))); groupDiv.appendChild(groupUl); packingListUl.appendChild(groupDiv); }); } else { items.forEach(item => packingListUl.appendChild(createPackingListItem(item))); } };
    const createPackingListItem = (item) => { if (!item || !item.id) return document.createDocumentFragment(); const li = document.createElement('li'); li.dataset.itemId = item.id; li.classList.toggle('packed', item.packed); li.innerHTML = ` <div class="form-check"> <input class="form-check-input packing-checkbox" type="checkbox" id="pack-${item.id}" data-item-id="${item.id}" ${item.packed?'checked':''}> <label class="form-check-label" for="pack-${item.id}"> ${item.name||'N/D'} ${item.quantity > 1 ? `<span class="packing-quantity">(x${item.quantity})</span>` : ''} </label> </div> <div class="item-details"> ${item.category && item.category !== 'Altro' ? `<span class="packing-category">${item.category}</span>` : ''} </div> <div class="item-actions"> <button class="btn-icon edit" data-item-id="${item.id}" data-item-type="packing" title="Modifica"><i class="fas fa-edit"></i></button> <button class="btn-icon delete" data-item-id="${item.id}" data-item-type="packing" title="Elimina"><i class="fas fa-trash-alt"></i></button> </div>`; return li; };

    // ==========================================================================
    // == FUNZIONI UI ==
    // ==========================================================================
    const switchTab = (tabId) => { if (!tabId) return; document.querySelectorAll(".tab-content").forEach(t => { t.style.display="none"; t.classList.remove("active"); }); document.querySelectorAll(".tab-link").forEach(l => l.classList.remove("active")); const c = document.getElementById(tabId); const l = tabsContainer?.querySelector(`.tab-link[data-tab="${tabId}"]`); if(c){ c.style.display="block"; setTimeout(()=>c.classList.add("active"),10); } if(l) l.classList.add("active"); };
    const toggleSearchButtonsVisibility = () => { if (!transportTypeSelect) return; const type = transportTypeSelect.value; if(searchSkyscannerBtn) searchSkyscannerBtn.style.display = (type === 'Volo') ? 'inline-flex' : 'none'; if(searchTrainlineBtn) searchTrainlineBtn.style.display = (type === 'Treno') ? 'inline-flex' : 'none'; };
    const handleSortChange = (listType, selectElement) => { if (!currentTripId) return; const trip = findTripById(currentTripId); if (!trip) return; currentSort[listType] = selectElement.value; switch(listType) { case 'reminder': renderReminders(trip.reminders); break; case 'transport': renderTransportations(trip.transportations); break; case 'itinerary': renderItinerary(trip.itinerary); break; case 'budget': renderBudget(trip.budget); break; case 'packing': renderPackingList(trip.packingList); break; } saveLocalStorageAppState(); };
    const applyCurrentSortToControls = () => { if(reminderSortControl) reminderSortControl.value = currentSort.reminder; if(transportSortControl) transportSortControl.value = currentSort.transport; if(itinerarySortControl) itinerarySortControl.value = currentSort.itinerary; if(budgetSortControl) budgetSortControl.value = currentSort.budget; if(packingSortControl) packingSortControl.value = currentSort.packing; };
    const handleInternalSearch = (listType, inputElement) => { if (!currentTripId) return; const trip = findTripById(currentTripId); if (!trip) return; currentSearchTerm[listType] = inputElement.value.toLowerCase(); if (listType === 'itinerary') renderItinerary(trip.itinerary); else if (listType === 'packing') renderPackingList(trip.packingList); saveLocalStorageAppState(); };

    // ==========================================================================
    // == FUNZIONI RICERCA ESTERNA (CON CORREZIONE) ==
    // ==========================================================================
    const handleSearchFlights = () => {
        const origin = transportDepartureLocInput.value.trim();
        const dest = transportArrivalLocInput.value.trim();
        // CORREZIONE: Usa la data di partenza del segmento e la data di fine viaggio per andata/ritorno
        const startRaw = transportDepartureDatetimeInput.value ? transportDepartureDatetimeInput.value.split('T')[0] : '';
        const endRaw = tripEndDateInput.value || ''; // Usa la data di fine del viaggio come ritorno
        const startSky = formatSkyscannerDate(startRaw);
        const endSky = formatSkyscannerDate(endRaw);

        if (!origin || !dest) { showToast("Inserisci Origine e Destinazione.", "warning"); return; }
        if (!startSky) { showToast("Inserisci una data di partenza valida.", "warning"); return; }
        if (startRaw && endRaw && startRaw > endRaw) { showToast("La data di ritorno non può essere prima della partenza.", "warning"); return; }

        const baseUrl = "https://www.skyscanner.it/trasporti/voli/";
        const origCode = origin.toLowerCase().replace(/\s+/g, '-') || 'anywhere';
        const destCode = dest.toLowerCase().replace(/\s+/g, '-') || 'anywhere';
        // Costruisce l'URL in base alla presenza della data di ritorno
        const url = endSky 
            ? `${baseUrl}${origCode}/${destCode}/${startSky}/${endSky}/?rtn=1`
            : `${baseUrl}${origCode}/${destCode}/${startSky}/`;
        
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    const handleSearchTrains = () => {
        const origin = transportDepartureLocInput.value.trim();
        const dest = transportArrivalLocInput.value.trim();
        // CORREZIONE: Usa la data di partenza del segmento e la data di fine viaggio
        const startRaw = transportDepartureDatetimeInput.value ? transportDepartureDatetimeInput.value.split('T')[0] : '';
        const endRaw = tripEndDateInput.value || ''; // Usa la data di fine del viaggio come ritorno

        if (!origin || !dest) { showToast("Inserisci Origine e Destinazione.", "warning"); return; }
        if (!startRaw) { showToast("Inserisci una data di partenza valida.", "warning"); return; }
        if (startRaw && endRaw && startRaw > endRaw) { showToast("La data di ritorno non può essere prima della partenza.", "warning"); return; }

        const baseUrl = "https://www.thetrainline.com/it/orari-treni/";
        const origFmt = origin.toUpperCase().replace(/\s+/g, '-');
        const destFmt = dest.toUpperCase().replace(/\s+/g, '-');
        
        let url = `${baseUrl}${origFmt}-a-${destFmt}?departureDate=${startRaw}&adults=1`;
        if (endRaw) {
            url += `&returnDate=${endRaw}`;
        }
        window.open(url, '_blank', 'noopener,noreferrer');
    };
    
    // ... (Il resto del codice rimane invariato)
    
    // ==========================================================================
    // == INIZIALIZZAZIONE E EVENT LISTENER ==
    // ==========================================================================
    const executeConfirmAction = () => { if (typeof confirmActionCallback === 'function') { try { confirmActionCallback(); } catch(err) { console.error("Errore callback conferma:", err); showToast("Errore.", "error"); } } closeConfirmationModal(); };
    const initAppEventListeners = () => {
        console.log("DEBUG: Init App Event Listeners...");
        if (newTripBtn) newTripBtn.onclick = handleNewTrip;
        if (createFromTemplateBtn) createFromTemplateBtn.onclick = openSelectTemplateModal;
        if (searchTripInput) searchTripInput.oninput = handleSearchTrip;
        if (tripInfoForm) tripInfoForm.onsubmit = handleSaveTripInfo;
        if (deleteTripBtn) deleteTripBtn.onclick = () => { if (currentTripId) handleDeleteTrip(currentTripId); };
        if (tabsContainer) tabsContainer.onclick = (e) => { const tl = e.target.closest('.tab-link'); if (tl?.dataset.tab) switchTab(tl.dataset.tab); };
        if (downloadTextBtn) downloadTextBtn.onclick = handleDownloadText;
        if (downloadExcelBtn) downloadExcelBtn.onclick = handleDownloadExcel;
        if (emailSummaryBtn) emailSummaryBtn.onclick = handleEmailSummary;
        if (copySummaryBtn) copySummaryBtn.onclick = handleCopySummary;
        if (shareTripBtn) shareTripBtn.onclick = handleShareViaLink;

        const formsToListen = [ 'participant', 'reminder', 'transport', 'accommodation', 'itinerary', 'budget', 'packing' ];
        formsToListen.forEach(type => {
            const formElement = document.getElementById(`add-${type}-item-form`);
            if (formElement) {
                formElement.addEventListener('submit', (event) => {
                    handleItemFormSubmit(event, type);
                });
            }
            const cancelBtn = document.getElementById(`${type}-cancel-edit-btn`);
            if(cancelBtn) {
                cancelBtn.onclick = () => resetEditState(type);
            }
        });

        if (tripDetailsAreaDiv) {
            tripDetailsAreaDiv.addEventListener('click', (e) => {
                const target = e.target;
                const editBtn = target.closest('.btn-icon.edit');
                const deleteBtn = target.closest('.btn-icon.delete');
                const packingCheckbox = target.closest('.packing-checkbox');

                if (editBtn && editBtn.dataset.itemId && editBtn.dataset.itemType) {
                    startEditItem(editBtn.dataset.itemType, editBtn.dataset.itemId);
                } else if (deleteBtn && deleteBtn.dataset.itemId && deleteBtn.dataset.itemType) {
                    handleDeleteItem(deleteBtn.dataset.itemType, deleteBtn.dataset.itemId);
                } else if (packingCheckbox && packingCheckbox.dataset.itemId) {
                    handleTogglePacked(packingCheckbox.dataset.itemId, packingCheckbox.checked);
                }
            });
        }

        if (predefinedChecklistsContainer) { predefinedChecklistsContainer.onclick = (e) => { const btn = e.target.closest('button[data-checklist]'); if (btn?.dataset.checklist) handleImportPackingList(btn.dataset.checklist); }; }
        if (newTripModal) { if(createTripConfirmBtn) createTripConfirmBtn.onclick = handleCreateTripConfirm; newTripModal.querySelectorAll('.modal-close').forEach(btn => btn.onclick = closeNewTripModal); if(newTripNameInput) newTripNameInput.onkeypress = (e) => { if(e.key === 'Enter') handleCreateTripConfirm(); }; newTripModal.onclick = (e) => { if (e.target === newTripModal) closeNewTripModal(); }; }
        if (confirmationModal) { const confirmBtn = confirmationModal.querySelector('#confirmation-modal-confirm-btn'); const closeBtns = confirmationModal.querySelectorAll('.modal-close'); if(confirmBtn) { confirmBtn.onclick = executeConfirmAction; } closeBtns.forEach(btn => btn.onclick = closeConfirmationModal); confirmationModal.onclick = (e) => { if (e.target === confirmationModal) closeConfirmationModal(); }; }
        
        if (addTransportTotalToBudgetBtn) { addTransportTotalToBudgetBtn.onclick = () => handleCalculateAndAddTotalCostToBudget('transportations', 'Trasporti'); }
        if (addAccommodationTotalToBudgetBtn) { addAccommodationTotalToBudgetBtn.onclick = () => handleCalculateAndAddTotalCostToBudget('accommodations', 'Alloggi'); }
        if (addItineraryTotalToBudgetBtn) { addItineraryTotalToBudgetBtn.onclick = () => handleCalculateAndAddTotalCostToBudget('itinerary', 'Itinerario'); }
        
        if (searchSkyscannerBtn) { searchSkyscannerBtn.onclick = handleSearchFlights; }
        if (searchTrainlineBtn) { searchTrainlineBtn.onclick = handleSearchTrains; }
        if(transportTypeSelect) { transportTypeSelect.onchange = toggleSearchButtonsVisibility; }
        
        const sortControls = [ 'reminder', 'transport', 'itinerary', 'budget', 'packing' ];
        sortControls.forEach(type => {
            const ctrlElement = document.getElementById(`${type}-sort-control`);
            if(ctrlElement) ctrlElement.onchange = (e) => handleSortChange(type, e.target);
        });

        if(searchItineraryInput) searchItineraryInput.oninput = (e) => handleInternalSearch('itinerary', e.target);
        if(searchPackingInput) searchPackingInput.oninput = (e) => handleInternalSearch('packing', e.target);
        if(calculateBalanceBtn) { calculateBalanceBtn.onclick = () => { const balanceResult = calculateExpenseBalance(); renderBalanceResults(balanceResult); }; }
        if(resendVerificationBtn) resendVerificationBtn.onclick = handleResendVerificationEmail;
        if(resendVerificationBtnNotice) resendVerificationBtnNotice.onclick = handleResendVerificationEmail;
        console.log("DEBUG: App listeners aggiunti.");
    };

    // ==========================================================================
    // == PUNTO DI INGRESSO PRINCIPALE ==
    // ==========================================================================
    if (showSignupLink && signupForm && signupPromptP) { showSignupLink.addEventListener('click', (event) => { event.preventDefault(); if (signupForm.style.display === 'none') { signupForm.style.display = 'block'; signupPromptP.style.display = 'none'; if(passwordResetForm) passwordResetForm.style.display = 'none'; if(loginForm) loginForm.style.display = 'block'; showAuthError(''); showAuthSuccess(''); } }); }
    if (forgotPasswordLink && passwordResetForm && loginForm) { forgotPasswordLink.addEventListener('click', (e) => { e.preventDefault(); passwordResetForm.style.display = 'block'; loginForm.style.display = 'none'; if(signupForm) signupForm.style.display = 'none'; if(signupPromptP) signupPromptP.style.display = 'block'; showAuthError(''); showAuthSuccess(''); }); }
    if (cancelResetBtn && passwordResetForm && loginForm) { cancelResetBtn.addEventListener('click', () => { passwordResetForm.style.display = 'none'; loginForm.style.display = 'block'; showAuthError(''); showAuthSuccess(''); }); }
    if(passwordResetForm) passwordResetForm.addEventListener('submit', handlePasswordResetRequest);
    if(anonymousSigninBtn) anonymousSigninBtn.addEventListener('click', handleAnonymousSignIn);
    if(loginForm) loginForm.addEventListener('submit', handleSignIn);
    if(signupForm) signupForm.addEventListener('submit', handleSignUp);
    if(logoutBtn) logoutBtn.addEventListener('click', handleSignOut);

    if (auth) {
        let listenersInitialized = false;
        onAuthStateChanged(auth, async (user) => {
            console.log("Auth state changed. User:", user ? (user.isAnonymous ? `Anon ${user.uid}`: user.uid) : 'None');
            await updateUIBasedOnAuthState(user);
            if (user && !listenersInitialized) {
                 initAppEventListeners();
                 listenersInitialized = true;
            } else if (!user) {
                 listenersInitialized = false;
            }
        });
    } else {
        console.error("Auth non inizializzato.");
        showAuthError("Servizio di autenticazione non disponibile.");
    }

}); // Fine DOMContentLoaded
