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
    sendEmailVerification, // Per verifica email
    sendPasswordResetEmail, // Per reset password
    signInAnonymously       // Per login anonimo
} from "https://www.gstatic.com/firebasejs/11.5.0/firebase-auth.js";

// Configurazione Firebase (ATTENZIONE ALLA API KEY IN PRODUZIONE)
const firebaseConfig = {
    apiKey: "AIzaSyBV7k95kgUnMhIzTQR1Xae-O_ksNYzzvmw", // NASCONDI QUESTA CHIAVE IN PRODUZIONE O USA REGOLE DI SICUREZZA MOLTO ROBUSTE!
    authDomain: "travel-planner-pro-5dd4f.firebaseapp.com",
    projectId: "travel-planner-pro-5dd4f",
    storageBucket: "travel-planner-pro-5dd4f.appspot.com",
    messagingSenderId: "95235228754",
    appId: "1:95235228754:web:5c8ce68dc8362e90260b8b",
    measurementId: "G-8H6FV393ZW" // Opzionale
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
    document.body.innerHTML = '<p style="color: red; text-align: center; margin-top: 50px;">Errore critico nell\'inizializzazione. Impossibile caricare l\'app.</p>';
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
    const checkElement = (id, isQuerySelector = false) => {
        const element = isQuerySelector ? document.querySelector(id) : document.getElementById(id);
        if (!element) {
            console.error(`ERRORE SELEZIONE DOM: Elemento "${id}" non trovato!`);
            domSelectionError = true;
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
    const signupPromptP = checkElement('.signup-prompt', true); // Corretto con querySelector
    const emailVerificationNotice = checkElement('email-verification-notice');
    const resendVerificationBtn = checkElement('resend-verification-btn');
    const resendVerificationBtnNotice = checkElement('resend-verification-btn-notice');
    const anonymousUserPrompt = checkElement('anonymous-user-prompt');
    const linkAccountPrompt = checkElement('link-account-prompt');

    // Elementi App
    const loadingTripsDiv = checkElement('loading-trips');
    const tripListUl = checkElement('trip-list');
    const newTripBtn = checkElement('new-trip-btn');
    const createFromTemplateBtn = checkElement('create-from-template-btn');
    const searchTripInput = checkElement('search-trip-input');
    const noTripsMessage = checkElement('no-trips-message');
    const welcomeMessageDiv = checkElement('welcome-message');
    const tripDetailsAreaDiv = checkElement('trip-details-area');
    const tripTitleH2 = checkElement('trip-title');
    // --- Bottoni Azioni Viaggio (ora alcuni nel dropdown) ---
    const actionDropdownBtn = checkElement('action-dropdown-btn'); // Bottone trigger
    const actionDropdownMenu = checkElement('action-dropdown-menu'); // Contenitore menu
    const shareTripBtn = checkElement('share-trip-btn');         // Ora dentro il menu
    const emailSummaryBtn = checkElement('email-summary-btn');     // Ora dentro il menu
    const copySummaryBtn = checkElement('copy-summary-btn');       // Ora dentro il menu
    const downloadExcelBtn = checkElement('download-excel-btn');     // Ora dentro il menu
    const downloadTextBtn = checkElement('download-text-btn');       // Ora dentro il menu
    const deleteTripBtn = checkElement('delete-trip-btn');         // Rimane fuori
    // ----------------------------------------------------
    const tabsContainer = checkElement('.tabs', true);
    const tripInfoForm = checkElement('trip-info-form');
    const editTripIdInput = checkElement('edit-trip-id');
    const tripNameInput = checkElement('trip-name');
    const tripOriginCityInput = checkElement('trip-origin-city');
    const tripDestinationInput = checkElement('trip-destination');
    const tripStartDateInput = checkElement('trip-start-date');
    const tripEndDateInput = checkElement('trip-end-date');
    const tripIsTemplateCheckbox = checkElement('trip-is-template');
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
    const addTransportTotalToBudgetBtn = checkElement('add-transport-total-to-budget-btn');
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
    const selectTemplateModal = checkElement('select-template-modal');
    const templateSelectInput = checkElement('template-select-input');
    const selectTemplateErrorP = checkElement('select-template-modal-error');
    const createFromTemplateConfirmBtn = checkElement('create-from-template-confirm-btn');
    const confirmationModal = checkElement('confirmation-modal');
    const confirmationModalTitle = checkElement('confirmation-modal-title');
    const confirmationModalMessage = checkElement('confirmation-modal-message');
    const confirmationModalConfirmBtn = checkElement('confirmation-modal-confirm-btn');
    const toastContainer = checkElement('toast-container');
    const participantDatalist = checkElement('participant-datalist');
    const packingCategoryDatalist = checkElement('packing-category-list');

    if (domSelectionError) {
        alert("Errore critico: alcuni elementi dell'interfaccia non sono stati trovati.");
        return; // Interrompe l'esecuzione se mancano elementi DOM
    }
    console.log("DEBUG: Selezione elementi DOM completata.");

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
    const formatCurrency = (amount) => {
        const num = amount === null || typeof amount === 'undefined' ? 0 : Number(amount);
        if (isNaN(num)) { return new Intl.NumberFormat(DEFAULT_LOCALE, { style: 'currency', currency: DEFAULT_CURRENCY }).format(0); }
        return new Intl.NumberFormat(DEFAULT_LOCALE, { style: 'currency', currency: DEFAULT_CURRENCY }).format(num);
    };
    const formatDate = (dateString) => {
        if (!dateString || typeof dateString !== 'string') return '';
        const datePart = dateString.split('T')[0];
        try {
            const parts = datePart.split('-');
            if (parts.length !== 3) return dateString; // Ritorna la stringa originale se non è nel formato YYYY-MM-DD
            const year = parseInt(parts[0]), month = parseInt(parts[1]), day = parseInt(parts[2]);
            // Validazione più robusta delle parti della data
            if (isNaN(year) || isNaN(month) || isNaN(day) || month < 1 || month > 12 || day < 1 || day > 31 || year < 1000 || year > 3000) {
                 return dateString;
            }
            // Verifica ulteriore validità data (es. 31 Febbraio)
            const date = new Date(Date.UTC(year, month - 1, day)); // Usa UTC per evitare problemi timezone
            if (isNaN(date.getTime()) || date.getUTCFullYear() !== year || date.getUTCMonth() + 1 !== month || date.getUTCDate() !== day) {
                 return dateString; // Data non valida (es. 31 Feb)
            }
            return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
        } catch (e) {
            console.warn("Errore formattazione data:", dateString, e);
            return dateString; // Ritorna la stringa originale in caso di errore
        }
    };
    const formatDateTime = (dateTimeString) => {
        if (!dateTimeString || typeof dateTimeString !== 'string') return '';
        try {
            const date = new Date(dateTimeString);
            if (isNaN(date.getTime())) return ''; // Stringa non valida
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0'); // Mesi sono 0-indicizzati
            const year = date.getFullYear();
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            return `${day}/${month}/${year} ${hours}:${minutes}`;
        } catch (e) {
            console.warn("Errore formattazione data/ora:", dateTimeString, e);
            return ''; // Ritorna stringa vuota in caso di errore
        }
    };
    const formatSkyscannerDate = (isoDateString) => {
        if (!isoDateString || typeof isoDateString !== 'string' || !isoDateString.match(/^\d{4}-\d{2}-\d{2}/)) return null;
        try {
            const datePart = isoDateString.split('T')[0]; // Prendi solo la parte data YYYY-MM-DD
            const year = datePart.substring(2, 4); // YY
            const month = datePart.substring(5, 7); // MM
            const day = datePart.substring(8, 10); // DD
            return `${year}${month}${day}`; // YYMMDD
        } catch (e) {
            console.warn("Errore formattazione data Skyscanner:", isoDateString, e);
            return null;
        }
    };
    const showToast = (message, type = 'info') => {
        if (!toastContainer) return;
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        let iconClass = 'fas fa-info-circle';
        if (type === 'success') iconClass = 'fas fa-check-circle';
        if (type === 'error') iconClass = 'fas fa-exclamation-circle';
        toast.innerHTML = `<i class="${iconClass}"></i> ${message}`;
        toastContainer.appendChild(toast);
        setTimeout(() => toast.classList.add('show'), 10); // Delay per animazione entrata
        setTimeout(() => {
            toast.classList.remove('show');
            // Rimuovi elemento dopo transizione per evitare scatti
            toast.addEventListener('transitionend', () => toast.remove(), { once: true });
        }, 3000); // Durata toast
    };
    const openModal = (modalElement) => { if(modalElement) modalElement.style.display = 'block'; };
    const closeModal = (modalElement) => { if(modalElement) modalElement.style.display = 'none'; };
    const openNewTripModal = () => {
        if (!newTripModal) return;
        newTripNameInput.value = '';
        if (newTripErrorP) newTripErrorP.style.display = 'none';
        openModal(newTripModal);
        newTripNameInput.focus(); // Focus sul campo nome
    };
    const closeNewTripModal = () => closeModal(newTripModal);
    const showConfirmationModal = (title, message, onConfirm) => {
        if (!confirmationModal) return;
        confirmationModalTitle.textContent = title;
        confirmationModalMessage.textContent = message;
        confirmActionCallback = onConfirm; // Salva la callback
        openModal(confirmationModal);
    };
    const closeConfirmationModal = () => {
        confirmActionCallback = null; // Pulisci la callback
        closeModal(confirmationModal);
    };
    const resetEditState = (formType) => {
        editingItemId[formType] = null; // Resetta ID in modifica
        const form = document.getElementById(`add-${formType}-item-form`);
        const submitBtn = document.getElementById(`${formType}-submit-btn`);
        const cancelBtn = document.getElementById(`${formType}-cancel-edit-btn`);
        const hiddenInput = document.getElementById(`edit-${formType}-item-id`);

        if (form) form.reset(); // Resetta i campi del form
        if(hiddenInput) hiddenInput.value = ''; // Pulisci campo nascosto ID

        // Ripristina il bottone Submit allo stato "Aggiungi"
        if (submitBtn) {
            let addText = 'Aggiungi';
             switch(formType) {
                case 'participant': addText = 'Partecipante'; break;
                case 'reminder': addText = 'Promemoria'; break;
                case 'transport': addText = 'Trasporto'; break;
                case 'accommodation': addText = 'Alloggio'; break;
                case 'itinerary': addText = 'Attività'; break;
                case 'budget': addText = 'Spesa'; break;
                case 'packing': addText = 'Oggetto'; break;
            }
            submitBtn.innerHTML = `<i class="fas fa-plus"></i> ${addText}`;
            submitBtn.classList.remove('btn-warning'); // Rimuovi stile modifica
            submitBtn.classList.add('btn-secondary'); // Ripristina stile aggiunta
        }
        // Nascondi il bottone Annulla Modifica
        if (cancelBtn) cancelBtn.style.display = 'none';
        // Se è il form trasporti, aggiorna visibilità bottoni ricerca esterna
        if(formType === 'transport' && typeof toggleSearchButtonsVisibility === 'function') {
             toggleSearchButtonsVisibility();
        }
    };
    const createMapLink = (query) => query ? `${GOOGLE_MAPS_BASE_URL}${encodeURIComponent(query)}` : null;
    const formatDisplayLink = (link) => {
        if (!link) return '';
        try {
            // Verifica se è un URL valido
            new URL(link);
            // Accorcia link lungo per display
            const displayLink = link.length > 40 ? link.substring(0, 37) + '...' : link;
            return `<a href="${link}" target="_blank" rel="noopener noreferrer" class="external-link" title="${link}">${displayLink} <i class="fas fa-external-link-alt"></i></a>`;
        } catch (_) {
            // Se non è un URL valido, ritorna il testo com'è (potrebbe essere un rif. file)
            return link;
        }
    };
    const safeToNumberOrNull = (value) => {
        if (value === null || value === undefined || value === '') return null;
        const num = Number(value);
        // Controlla se è un numero valido e finito
        if (isNaN(num) || !isFinite(num)) {
             console.warn(`Valore non numerico o infinito: ${value}`);
             return null;
        }
        return num;
    };
    const safeToPositiveIntegerOrDefault = (value, defaultValue = 1) => {
        if (value === null || value === undefined || value === '') return defaultValue;
        const num = parseInt(value, 10); // Usa parseInt per interi
        // Controlla se è un numero valido, finito e >= 1
        if (isNaN(num) || !isFinite(num) || num < 1) {
             console.warn(`Valore non intero positivo: ${value}, usando default ${defaultValue}`);
             return defaultValue;
        }
        return num;
    };
    function fallbackCopyTextToClipboard(text) {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        // Evita scroll e rende invisibile
        textArea.style.position = "fixed"; textArea.style.top = "0"; textArea.style.left = "0"; textArea.style.opacity = "0";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
            const successful = document.execCommand('copy');
            if (!successful) { throw new Error('Copia fallback fallita'); }
            showToast("Riepilogo copiato (fallback)!", "success");
        } catch (err) {
            console.error('Fallback: Impossibile copiare testo: ', err);
            showToast("Errore durante la copia (fallback).", "error");
        }
        document.body.removeChild(textArea);
    }
    const toTimestampOrNull = (dateString) => {
        if (!dateString || typeof dateString !== 'string') return null;
        try {
            const date = new Date(dateString);
            return isNaN(date.getTime()) ? null : Timestamp.fromDate(date);
        } catch (e) {
            console.warn("Errore conversione a Timestamp:", dateString, e);
            return null;
        }
    };
    const fromTimestampToString = (timestamp) => {
        // Se è un oggetto Timestamp di Firestore
        if (timestamp && typeof timestamp.toDate === 'function') {
            try {
                const d = timestamp.toDate();
                const YYYY = d.getFullYear();
                const MM = String(d.getMonth() + 1).padStart(2, '0');
                const DD = String(d.getDate()).padStart(2, '0');
                const HH = String(d.getHours()).padStart(2, '0');
                const mm = String(d.getMinutes()).padStart(2, '0');
                return `${YYYY}-${MM}-${DD}T${HH}:${mm}`; // Formato per datetime-local
            } catch (e) {
                console.warn("Errore conversione da Timestamp a stringa datetime:", timestamp, e);
                return '';
            }
        }
        // Se è già una stringa (potrebbe succedere in alcuni casi o dati vecchi)
        if (timestamp && typeof timestamp === 'string') {
            // Prova a normalizzare al formato richiesto (tronca secondi/millisecondi)
            return timestamp.slice(0, 16);
        }
        return ''; // Ritorna vuoto se input non valido
    };
    const fromTimestampToDateString = (timestamp) => {
        // Se è un oggetto Timestamp di Firestore
        if (timestamp && typeof timestamp.toDate === 'function') {
            try {
                const d = timestamp.toDate();
                const YYYY = d.getFullYear();
                const MM = String(d.getMonth() + 1).padStart(2, '0');
                const DD = String(d.getDate()).padStart(2, '0');
                return `${YYYY}-${MM}-${DD}`; // Formato per input type="date"
            } catch (e) {
                 console.warn("Errore conversione da Timestamp a stringa data:", timestamp, e);
                return '';
            }
        }
         // Se è già una stringa (potrebbe succedere in alcuni casi o dati vecchi)
        if (timestamp && typeof timestamp === 'string') {
            const datePart = timestamp.split('T')[0];
            if (datePart && datePart.match(/^\d{4}-\d{2}-\d{2}$/)) {
                return datePart; // Se già nel formato corretto
            }
        }
        return ''; // Ritorna vuoto se input non valido
    };
    // Prepara i dati per Firestore (converte date, pulisce null/undefined)
    const prepareTripDataForFirestore = (tripObject) => {
        // Crea una copia profonda per non modificare l'oggetto originale
        const dataToSave = JSON.parse(JSON.stringify(tripObject));
        delete dataToSave.id; // Rimuovi l'ID locale prima di salvare

        // Converte date principali
        dataToSave.startDate = toTimestampOrNull(dataToSave.startDate);
        dataToSave.endDate = toTimestampOrNull(dataToSave.endDate);

        // Gestisce timestamp creazione/aggiornamento
        dataToSave.createdAt = dataToSave.createdAt instanceof Timestamp ? dataToSave.createdAt : (toTimestampOrNull(dataToSave.createdAt) || Timestamp.now());
        dataToSave.updatedAt = Timestamp.now(); // Imposta sempre all'ora attuale

        // Converte date negli array interni
        if (dataToSave.reminders) dataToSave.reminders.forEach(r => r.dueDate = toTimestampOrNull(r.dueDate));
        if (dataToSave.transportations) dataToSave.transportations.forEach(t => {
            t.departureDateTime = toTimestampOrNull(t.departureDateTime);
            t.arrivalDateTime = toTimestampOrNull(t.arrivalDateTime);
            t.cost = safeToNumberOrNull(t.cost);
        });
        if (dataToSave.accommodations) dataToSave.accommodations.forEach(a => {
            a.checkinDateTime = toTimestampOrNull(a.checkinDateTime);
            a.checkoutDateTime = toTimestampOrNull(a.checkoutDateTime);
            a.cost = safeToNumberOrNull(a.cost);
        });
        if (dataToSave.itinerary) dataToSave.itinerary.forEach(i => {
            i.cost = safeToNumberOrNull(i.cost); // Assumendo che date/ora siano stringhe qui
        });
        if (dataToSave.budget && dataToSave.budget.items) dataToSave.budget.items.forEach(b => {
            b.estimated = safeToNumberOrNull(b.estimated);
            b.actual = safeToNumberOrNull(b.actual);
        });
        if (dataToSave.packingList) dataToSave.packingList.forEach(p => {
            p.quantity = safeToPositiveIntegerOrDefault(p.quantity);
        });

        // Assicura che i campi opzionali stringa siano null se vuoti
        dataToSave.originCity = dataToSave.originCity || null;
        dataToSave.destination = dataToSave.destination || null;
        dataToSave.notes = dataToSave.notes || null;
        dataToSave.extraInfo = dataToSave.extraInfo || null;

        // Rimuovi eventuali campi rimasti undefined
        Object.keys(dataToSave).forEach(key => {
            if (dataToSave[key] === undefined) { delete dataToSave[key]; }
        });

        // Inizializza array vuoti se non presenti
        dataToSave.participants = dataToSave.participants || [];
        dataToSave.reminders = dataToSave.reminders || [];
        dataToSave.transportations = dataToSave.transportations || [];
        dataToSave.accommodations = dataToSave.accommodations || [];
        dataToSave.itinerary = dataToSave.itinerary || [];
        dataToSave.budget = dataToSave.budget || { items: [], estimatedTotal: 0, actualTotal: 0 };
        dataToSave.budget.items = dataToSave.budget.items || [];
        dataToSave.packingList = dataToSave.packingList || [];

        return dataToSave;
    };
    // Processa i dati letti da Firestore (converte timestamp, imposta default)
    const processTripDataFromFirestore = (docId, firestoreData) => {
        const trip = { ...firestoreData, id: docId }; // Aggiungi l'ID del documento

        // Converte timestamp principali in stringhe per i campi input
        trip.startDate = fromTimestampToDateString(trip.startDate);
        trip.endDate = fromTimestampToDateString(trip.endDate);
        trip.createdAt = fromTimestampToString(trip.createdAt); // Potrebbe servire per info
        trip.updatedAt = fromTimestampToString(trip.updatedAt); // Potrebbe servire per info

        // Converte timestamp negli array e imposta valori di default se mancano
        if (trip.reminders) trip.reminders.forEach(r => r.dueDate = fromTimestampToDateString(r.dueDate));
        if (trip.transportations) trip.transportations.forEach(t => {
            t.departureDateTime = fromTimestampToString(t.departureDateTime);
            t.arrivalDateTime = fromTimestampToString(t.arrivalDateTime);
        });
        if (trip.accommodations) trip.accommodations.forEach(a => {
            a.checkinDateTime = fromTimestampToString(a.checkinDateTime);
            a.checkoutDateTime = fromTimestampToString(a.checkoutDateTime);
        });

        // Assicura che gli array esistano e imposta valori default per campi opzionali
        trip.participants = (trip.participants || []).map(p => ({...p, extraInfo: p.extraInfo || '' }));
        trip.reminders = (trip.reminders || []).map(r => ({...r, status: r.status || 'todo' }));
        trip.transportations = (trip.transportations || []).map(t => ({ ...t, cost: t.cost ?? null, link: t.link || null }));
        trip.accommodations = (trip.accommodations || []).map(a => ({ ...a, cost: a.cost ?? null, link: a.link || null }));
        trip.itinerary = (trip.itinerary || []).map(i => ({ ...i, cost: i.cost ?? null, link: i.link || null, bookingRef: i.bookingRef || null }));
        trip.budget = trip.budget || { items: [], estimatedTotal: 0, actualTotal: 0 };
        trip.budget.items = (trip.budget.items || []).map(b => ({ ...b, estimated: b.estimated ?? 0, actual: b.actual ?? null, paidBy: b.paidBy || null, splitBetween: b.splitBetween || null }));
        trip.packingList = (trip.packingList || []).map(p => ({...p, quantity: p.quantity || 1, category: p.category || 'Altro', packed: p.packed || false }));

        // Ricalcola totali budget dai dati letti (più sicuro che fidarsi dei totali salvati)
        let calcEst = 0, calcAct = 0;
        trip.budget.items.forEach(item => {
            const est = safeToNumberOrNull(item.estimated);
            const act = safeToNumberOrNull(item.actual);
            if (est !== null) calcEst += est;
            if (act !== null) calcAct += act;
        });
        trip.budget.estimatedTotal = calcEst;
        trip.budget.actualTotal = calcAct;

        return trip;
    };

    // ==========================================================================
    // == GESTIONE STORAGE (Firestore) ==
    // ==========================================================================
    const loadUserTrips = async (uid) => {
        if (!uid || !db) {
            trips = []; renderTripList(); deselectTrip(); return;
        }
        if(loadingTripsDiv) loadingTripsDiv.style.display = 'block';
        if(noTripsMessage) noTripsMessage.style.display = 'none';
        if(tripListUl) tripListUl.innerHTML = ''; // Pulisce lista prima di caricare
        deselectTrip(); // Deseleziona viaggio corrente

        try {
            const tripsColRef = collection(db, 'users', uid, 'trips');
            // Ordina per data creazione discendente (i più recenti prima)
            const q = query(tripsColRef, orderBy("createdAt", "desc"));
            const querySnapshot = await getDocs(q);
            const userTrips = [];
            querySnapshot.forEach((doc) => {
                // Processa ogni documento letto
                userTrips.push(processTripDataFromFirestore(doc.id, doc.data()));
            });
            trips = userTrips; // Aggiorna lo stato globale
            console.log(`Caricati ${trips.length} viaggi per l'utente ${uid}`);
            renderTripList(); // Aggiorna la UI della lista
        } catch (error) {
            console.error("Errore caricamento viaggi:", error);
            showToast("Errore nel caricamento dei tuoi viaggi.", "error");
            trips = []; // Resetta i viaggi in caso di errore
            renderTripList();
            deselectTrip();
        } finally {
            // Nascondi indicatore caricamento e mostra messaggio se non ci sono viaggi
            if(loadingTripsDiv) loadingTripsDiv.style.display = 'none';
            if(noTripsMessage && trips.length === 0) noTripsMessage.style.display = 'block';
        }
    };
    // Salva o aggiorna un viaggio su Firestore
    const saveTripToFirestore = async (tripData) => {
        if (!currentUserId) { showToast("Errore: Utente non loggato.", "error"); return null; }
        if (!tripData || typeof tripData !== 'object') { showToast("Errore: Dati viaggio non validi.", "error"); return null; }

        // Determina se è un nuovo viaggio o un aggiornamento
        const isNewTrip = !tripData.id || !findTripById(tripData.id);
        const dataToSave = prepareTripDataForFirestore(tripData); // Prepara i dati
        const tripsColRef = collection(db, 'users', currentUserId, 'trips');

        try {
            let docRef;
            let message;
            if (isNewTrip) {
                // Aggiungi nuovo documento
                docRef = await addDoc(tripsColRef, dataToSave);
                console.log("Nuovo viaggio salvato con ID:", docRef.id);
                message = `Viaggio "${dataToSave.name}" creato!`;
                tripData.id = docRef.id; // Aggiorna l'oggetto locale con il nuovo ID
                showToast(message, "success");
                return docRef.id; // Ritorna il nuovo ID
            } else {
                // Aggiorna documento esistente
                docRef = doc(db, 'users', currentUserId, 'trips', tripData.id);
                await setDoc(docRef, dataToSave, { merge: true }); // Usa merge: true per sicurezza (anche se prepariamo tutto)
                console.log("Viaggio aggiornato con ID:", tripData.id);
                message = `Viaggio "${dataToSave.name}" aggiornato!`;
                showToast(message, "success");
                return tripData.id; // Ritorna l'ID esistente
            }
        } catch (error) {
            console.error("Errore salvataggio viaggio:", error);
            showToast("Errore durante il salvataggio.", "error");
            return null; // Ritorna null in caso di errore
        }
    };
    // Elimina un viaggio da Firestore
    const deleteTripFromFirestore = async (tripId) => {
        if (!currentUserId || !tripId) {
            showToast("Errore: Utente non loggato o ID viaggio mancante.", "error");
            return false;
        }
        console.log(`DEBUG: Tentativo eliminazione viaggio ${tripId} per utente ${currentUserId}`);
        const tripDocRef = doc(db, 'users', currentUserId, 'trips', tripId);
        try {
            await deleteDoc(tripDocRef);
            console.log(`DEBUG: Viaggio ${tripId} eliminato con successo.`);
            return true; // Successo
        } catch (error) {
            console.error(`Errore eliminazione viaggio ${tripId}:`, error);
            showToast("Errore durante l'eliminazione.", "error");
            return false; // Fallimento
        }
    };

    // ==========================================================================
    // == LOGICA VIAGGI ==
    // ==========================================================================
    const findTripById = (id) => trips.find(trip => trip && trip.id === id);
    // Renderizza la lista dei viaggi nella sidebar
    const renderTripList = () => {
        if (!tripListUl) return;
        const searchTerm = currentSearchTerm.trip.toLowerCase();
        tripListUl.innerHTML = ''; // Pulisci lista esistente

        // Filtra i viaggi (escludi template, applica ricerca)
        const filteredTrips = trips.filter(trip => {
            if (!trip || !trip.id) return false; // Ignora viaggi non validi
            if (trip.isTemplate) return false; // Escludi template (se implementato)
            const tripNameLower = (trip.name || '').toLowerCase();
            const destinationLower = (trip.destination || '').toLowerCase();
            // Mostra se non c'è termine di ricerca O se nome/destinazione contengono il termine
            return !searchTerm || tripNameLower.includes(searchTerm) || destinationLower.includes(searchTerm);
        });

        // Ordina i viaggi filtrati alfabeticamente per nome
        const sortedTrips = filteredTrips.sort((a, b) => (a.name || '').localeCompare(b?.name || ''));

        // Crea e aggiungi elementi <li> per ogni viaggio
        sortedTrips.forEach(trip => {
            const li = createTripListItem(trip, true); // Crea elemento lista visibile
            tripListUl.appendChild(li);
        });

        // Aggiorna messaggio "Nessun viaggio"
        const hasVisibleTrips = sortedTrips.length > 0;
        if(noTripsMessage) noTripsMessage.style.display = trips.length === 0 || !hasVisibleTrips ? 'block' : 'none';
        // Assicura che il loading sia nascosto
        if(loadingTripsDiv) loadingTripsDiv.style.display = 'none';
    };
    // Crea un elemento <li> per la lista viaggi
    const createTripListItem = (trip, isVisible) => {
        const li = document.createElement('li');
        li.dataset.tripId = trip.id; // Salva ID viaggio nel dataset
        li.innerHTML = `
            <span>${trip.name || 'Senza Nome'} (${formatDate(trip.startDate)} - ${formatDate(trip.endDate)})</span>
            <button class="btn-icon delete btn-delete-trip" data-trip-id="${trip.id}" title="Elimina">
                <i class="fas fa-trash-alt"></i>
            </button>
        `;
        // Applica classe 'active' se è il viaggio selezionato
        if (trip.id === currentTripId) { li.classList.add('active'); }
        // Nascondi se non visibile (per filtri futuri?)
        if (!isVisible) li.classList.add('hidden');

        // Listener per selezionare il viaggio (su click li, ma non sul bottone delete)
        li.addEventListener('click', (e) => {
            if (!e.target.closest('.btn-delete-trip')) { // Se il click non è sul bottone elimina
                selectTrip(trip.id);
            }
        });

        // Listener specifico per il bottone elimina
        const deleteButton = li.querySelector('.btn-delete-trip');
        if (deleteButton) {
            deleteButton.addEventListener('click', (e) => {
                e.stopPropagation(); // Impedisce al click di propagarsi al <li>
                handleDeleteTrip(trip.id);
            });
        }
        return li;
    };
    // Seleziona un viaggio e mostra i dettagli
    const selectTrip = (id) => {
        if (!id) { deselectTrip(); return; } // Se ID nullo, deseleziona
        // Evita ricarica se già selezionato e visibile
        if (currentTripId === id && tripDetailsAreaDiv && tripDetailsAreaDiv.style.display !== 'none') return;

        const trip = findTripById(id);
        if (trip) {
            currentTripId = id; // Aggiorna stato globale
            saveLocalStorageAppState(); // Salva stato UI

            // Resetta ricerche interne e ordinamenti alle impostazioni predefinite
            currentSearchTerm.itinerary = ''; if(searchItineraryInput) searchItineraryInput.value = '';
            currentSearchTerm.packing = ''; if(searchPackingInput) searchPackingInput.value = '';
            currentSort = { transport: 'departureDateTime', itinerary: 'dateTime', budget: 'category', packing: 'name', reminder: 'dueDate' };
            applyCurrentSortToControls(); // Aggiorna select di ordinamento

            renderTripList(); // Aggiorna highlight nella lista sidebar
            renderTripDetails(trip); // Mostra i dettagli del viaggio selezionato

            // Mostra area dettagli e nascondi messaggio benvenuto
            if(tripDetailsAreaDiv) tripDetailsAreaDiv.style.display = 'block';
            if(welcomeMessageDiv) welcomeMessageDiv.style.display = 'none';

            // Resetta tutti i form di modifica item
            Object.keys(editingItemId).forEach(resetEditState);
            // Torna alla tab Info di default
            switchTab('info-tab');
        } else {
            console.warn(`Tentativo di selezionare viaggio con ID ${id} non trovato.`);
            deselectTrip(); // Se il viaggio non esiste, deseleziona
        }
    };
    // Deseleziona il viaggio corrente
    const deselectTrip = () => {
        currentTripId = null; // Resetta ID corrente
        saveLocalStorageAppState(); // Salva stato UI

        // Nascondi area dettagli e mostra messaggio benvenuto (se utente loggato)
        if(tripDetailsAreaDiv) tripDetailsAreaDiv.style.display = 'none';
        if(welcomeMessageDiv && currentUserId) welcomeMessageDiv.style.display = 'flex';

        // Disabilita tutti i bottoni delle azioni viaggio
        if(downloadTextBtn) downloadTextBtn.disabled = true;
        if(downloadExcelBtn) downloadExcelBtn.disabled = true;
        if(deleteTripBtn) deleteTripBtn.disabled = true;
        if (shareTripBtn) shareTripBtn.disabled = true;
        if(emailSummaryBtn) emailSummaryBtn.disabled = true;
        if(copySummaryBtn) copySummaryBtn.disabled = true;

        renderTripList(); // Aggiorna lista sidebar (rimuove highlight)
    };
    // Renderizza i dettagli generali del viaggio nel form Info e abilita/disabilita azioni
    const renderTripDetails = (trip) => {
        if (!trip || !trip.id) { deselectTrip(); return; } // Sicurezza

        // Popola form Info
        if(tripTitleH2) tripTitleH2.textContent = trip.name || 'Senza Nome';
        if(editTripIdInput) editTripIdInput.value = trip.id; // Campo nascosto per riferimento
        if(tripNameInput) tripNameInput.value = trip.name || '';
        if(tripOriginCityInput) tripOriginCityInput.value = trip.originCity || '';
        if(tripDestinationInput) tripDestinationInput.value = trip.destination || '';
        if(tripStartDateInput) tripStartDateInput.value = trip.startDate || '';
        if(tripEndDateInput) tripEndDateInput.value = trip.endDate || '';
        if(tripIsTemplateCheckbox) tripIsTemplateCheckbox.checked = trip.isTemplate || false; // Usa valore booleano
        if(tripNotesTextarea) tripNotesTextarea.value = trip.notes || '';
        if(tripExtraInfoTextarea) tripExtraInfoTextarea.value = trip.extraInfo || '';

        // Renderizza le liste nelle altre tab
        renderParticipants(trip.participants);
        renderReminders(trip.reminders);
        renderTransportations(trip.transportations);
        renderAccommodations(trip.accommodations);
        renderItinerary(trip.itinerary);
        renderBudget(trip.budget);
        renderPackingList(trip.packingList);

        // Popola datalist (per autocompletamento partecipanti, categorie packing)
        populateDatalists(trip);

        // Abilita/Disabilita bottoni azioni viaggio
        const actionsEnabled = !!trip.id; // Abilitati solo se c'è un ID viaggio
        const isAnon = currentUser && currentUser.isAnonymous; // Controlla se utente anonimo

        if(downloadTextBtn) downloadTextBtn.disabled = !actionsEnabled;
        if(downloadExcelBtn) downloadExcelBtn.disabled = !actionsEnabled;
        if(deleteTripBtn) deleteTripBtn.disabled = !actionsEnabled;
        if (shareTripBtn) shareTripBtn.disabled = !actionsEnabled || isAnon; // Disabilitato se anonimo
        if(emailSummaryBtn) emailSummaryBtn.disabled = !actionsEnabled;
        if(copySummaryBtn) copySummaryBtn.disabled = !actionsEnabled;

        // Aggiorna visibilità bottoni ricerca esterna nel form trasporti
        toggleSearchButtonsVisibility();
    };
    // Apre il modale per creare un nuovo viaggio
    const handleNewTrip = () => {
        if (!currentUserId) {
            showToast("Devi essere loggato per creare un viaggio.", "warning");
            return;
        }
        openNewTripModal(); // Apre il modale definito in Utility
    };
    // Gestisce la conferma di creazione nuovo viaggio dal modale
    const handleCreateTripConfirm = async () => {
        const tripName = newTripNameInput.value.trim();
        if (!tripName) { // Validazione nome non vuoto
            if (newTripErrorP) {
                newTripErrorP.textContent = 'Il nome del viaggio non può essere vuoto.';
                newTripErrorP.style.display = 'block';
            }
            newTripNameInput.focus();
            return;
        }
        if (!currentUserId) { showToast("Errore: Utente non identificato.", "error"); return; }
        if (newTripErrorP) newTripErrorP.style.display = 'none'; // Nascondi errore precedente

        // Dati di default per un nuovo viaggio
        const newTripData = {
            name: tripName,
            originCity: '', destination: '', startDate: null, endDate: null,
            notes: '', isTemplate: false, extraInfo: '',
            participants: [], reminders: [], transportations: [], accommodations: [],
            itinerary: [],
            budget: { items: [], estimatedTotal: 0, actualTotal: 0 },
            packingList: [],
            createdAt: Timestamp.now() // Imposta data creazione
        };

        if(createTripConfirmBtn) createTripConfirmBtn.disabled = true; // Disabilita bottone durante salvataggio
        const newTripId = await saveTripToFirestore(newTripData); // Salva su Firestore
        if(createTripConfirmBtn) createTripConfirmBtn.disabled = false; // Riabilita bottone

        if (newTripId) {
            // Se salvataggio riuscito, processa i dati (per avere timestamp come stringhe etc.)
            const savedTrip = processTripDataFromFirestore(newTripId, prepareTripDataForFirestore({ ...newTripData, id: newTripId }));
            trips.unshift(savedTrip); // Aggiungi all'inizio dell'array locale
            closeNewTripModal();      // Chiudi modale
            renderTripList();         // Aggiorna sidebar
            selectTrip(newTripId);    // Seleziona il nuovo viaggio
        } else {
            // Se salvataggio fallito
            if (newTripErrorP) {
                newTripErrorP.textContent = 'Errore durante la creazione del viaggio. Riprova.';
                newTripErrorP.style.display = 'block';
            }
        }
    };
    // Salva le modifiche alle informazioni generali del viaggio (Tab Info)
    const handleSaveTripInfo = async (e) => {
        e.preventDefault(); // Impedisce submit standard del form
        if (!currentTripId || !currentUserId) return; // Verifica ID viaggio e utente

        const tripIndex = trips.findIndex(t => t.id === currentTripId);
        if (tripIndex === -1) { showToast("Errore: Viaggio corrente non trovato.", "error"); return; }

        const trip = trips[tripIndex]; // Ottieni riferimento all'oggetto viaggio
        const start = tripStartDateInput.value, end = tripEndDateInput.value;

        // Validazione date
        if (start && end && start > end) {
            showToast('La data di ritorno non può precedere la data di partenza.', 'error');
            tripEndDateInput.focus();
            return;
        }

        // Aggiorna i campi dell'oggetto viaggio locale
        trip.name = tripNameInput.value.trim() || 'Viaggio Senza Nome'; // Nome default se vuoto
        trip.originCity = tripOriginCityInput ? tripOriginCityInput.value.trim() : trip.originCity;
        trip.destination = tripDestinationInput ? tripDestinationInput.value.trim() : trip.destination;
        trip.startDate = start || null; // Salva null se data vuota
        trip.endDate = end || null;
        trip.notes = tripNotesTextarea ? tripNotesTextarea.value.trim() : trip.notes;
        trip.extraInfo = tripExtraInfoTextarea ? tripExtraInfoTextarea.value.trim() : trip.extraInfo;
        // trip.isTemplate non è modificabile dall'utente qui

        trip.updatedAt = new Date().toISOString(); // Registra data aggiornamento (per ora solo locale)

        // Salva le modifiche su Firestore
        const success = await saveTripToFirestore(trip);

        if (success) {
            // Se salvataggio OK, aggiorna UI (titolo e lista sidebar)
            if(tripTitleH2) tripTitleH2.textContent = trip.name;
            renderTripList();
        }
        // Non è necessario un else, saveTripToFirestore mostra già un toast in caso di errore
    };
    // Gestisce la richiesta di eliminazione di un viaggio (da sidebar o bottone dettagli)
    const handleDeleteTrip = (id) => {
        if (!currentUserId || !id) return;
        const trip = findTripById(id);
        if (!trip) {
            showToast(`Viaggio non trovato`, "warning");
            return; // Esce se il viaggio non esiste più localmente
        }
        // Mostra modale di conferma
        showConfirmationModal(
            `Conferma Eliminazione Viaggio`,
            `Sei sicuro di voler eliminare il viaggio "${trip.name || 'Senza Nome'}"? L'azione è irreversibile.`,
            async () => { // Callback eseguita alla conferma
                const success = await deleteTripFromFirestore(id); // Tenta eliminazione da DB
                if (success) {
                    // Se eliminazione DB OK:
                    trips = trips.filter(t => t.id !== id); // Rimuovi da array locale
                    saveLocalStorageAppState(); // Aggiorna stato UI (rimuove ID selezionato se era questo)
                    if (currentTripId === id) {
                        deselectTrip(); // Se era il viaggio corrente, deseleziona
                    } else {
                        renderTripList(); // Altrimenti, aggiorna solo la lista
                    }
                    showToast(`Viaggio "${trip.name || 'S.N.'}" eliminato.`, 'info');
                }
                // Se fallisce, deleteTripFromFirestore mostra già un toast
            }
        );
    };
    // Funzioni Template (attualmente disabilitate)
    const openSelectTemplateModal = () => { showToast("Funzionalità template non ancora disponibile.", "info"); };
    const handleCreateFromTemplateConfirm = () => {}; // Da implementare
    // Gestisce input nella barra di ricerca viaggi
    const handleSearchTrip = (e) => {
        currentSearchTerm.trip = e.target.value; // Aggiorna termine ricerca
        renderTripList(); // Rirenderizza la lista filtrata
    };

    // ==========================================================================
    // == FUNZIONI MODIFICA ITEM (Partecipanti, Trasporti, etc.) ==
    // ==========================================================================
    // Popola il form per modificare un item esistente
    const startEditItem = (listType, itemId) => {
        if (!currentTripId) return;
        const trip = findTripById(currentTripId);
        if (!trip) return;

        let itemToEdit = null;
        let list = [];
        // Trova la lista corretta e l'item da modificare
        switch (listType) {
            case 'participant': list = trip.participants || []; break;
            case 'reminder': list = trip.reminders || []; break;
            case 'transport': list = trip.transportations || []; break;
            case 'accommodation': list = trip.accommodations || []; break;
            case 'itinerary': list = trip.itinerary || []; break;
            case 'budget': list = trip.budget?.items || []; break;
            case 'packing': list = trip.packingList || []; break;
            default: console.error("Tipo lista non valido per modifica:", listType); return;
        }
        itemToEdit = list.find(item => item && item.id === itemId);

        if (!itemToEdit) {
            console.error(`Item ${itemId} non trovato in lista ${listType} per modifica.`);
            showToast("Elemento non trovato.", "error");
            return;
        }

        // Resetta lo stato di modifica per altri tipi di lista
        Object.keys(editingItemId).forEach(type => {
            if (type !== listType) resetEditState(type);
        });

        editingItemId[listType] = itemId; // Imposta ID corrente in modifica
        const form = document.getElementById(`add-${listType}-item-form`);
        const submitBtn = document.getElementById(`${listType}-submit-btn`);
        const cancelBtn = document.getElementById(`${listType}-cancel-edit-btn`);
        const hiddenInput = document.getElementById(`edit-${listType}-item-id`);

        if (hiddenInput) hiddenInput.value = itemId; // Imposta ID nel campo nascosto

        // Popola i campi del form con i dati dell'item
        try {
            switch (listType) {
                case 'participant':
                    participantNameInput.value = itemToEdit.name || '';
                    participantNotesInput.value = itemToEdit.notes || '';
                    participantExtraInfoTextarea.value = itemToEdit.extraInfo || '';
                    break;
                case 'reminder':
                    reminderDescriptionInput.value = itemToEdit.description || '';
                    reminderDueDateInput.value = itemToEdit.dueDate || ''; // Formato YYYY-MM-DD
                    reminderStatusSelect.value = itemToEdit.status || 'todo';
                    break;
                case 'transport':
                    transportTypeSelect.value = itemToEdit.type || 'Altro';
                    transportDescriptionInput.value = itemToEdit.description || '';
                    transportDepartureLocInput.value = itemToEdit.departureLoc || '';
                    transportDepartureDatetimeInput.value = itemToEdit.departureDateTime || ''; // Formato YYYY-MM-DDTHH:mm
                    transportArrivalLocInput.value = itemToEdit.arrivalLoc || '';
                    transportArrivalDatetimeInput.value = itemToEdit.arrivalDateTime || ''; // Formato YYYY-MM-DDTHH:mm
                    transportBookingRefInput.value = itemToEdit.bookingRef || '';
                    transportCostInput.value = itemToEdit.cost ?? ''; // Usa stringa vuota se null/undefined
                    transportNotesInput.value = itemToEdit.notes || '';
                    transportLinkInput.value = itemToEdit.link || '';
                    break;
                case 'accommodation':
                    accommodationNameInput.value = itemToEdit.name || '';
                    accommodationTypeSelect.value = itemToEdit.type || 'Hotel';
                    accommodationAddressInput.value = itemToEdit.address || '';
                    accommodationCheckinInput.value = itemToEdit.checkinDateTime || ''; // Formato YYYY-MM-DDTHH:mm
                    accommodationCheckoutInput.value = itemToEdit.checkoutDateTime || ''; // Formato YYYY-MM-DDTHH:mm
                    accommodationBookingRefInput.value = itemToEdit.bookingRef || '';
                    accommodationCostInput.value = itemToEdit.cost ?? ''; // Usa stringa vuota se null/undefined
                    accommodationNotesInput.value = itemToEdit.notes || '';
                    accommodationLinkInput.value = itemToEdit.link || '';
                    break;
                 case 'itinerary':
                     itineraryDayInput.value = itemToEdit.day || ''; // Formato YYYY-MM-DD
                     itineraryTimeInput.value = itemToEdit.time || ''; // Formato HH:mm
                     itineraryActivityInput.value = itemToEdit.activity || '';
                     itineraryLocationInput.value = itemToEdit.location || '';
                     itineraryBookingRefInput.value = itemToEdit.bookingRef || '';
                     itineraryCostInput.value = itemToEdit.cost ?? ''; // Usa stringa vuota se null/undefined
                     itineraryNotesInput.value = itemToEdit.notes || '';
                     itineraryLinkInput.value = itemToEdit.link || '';
                     break;
                 case 'budget':
                     budgetCategorySelect.value = itemToEdit.category || 'Altro';
                     budgetDescriptionInput.value = itemToEdit.description || '';
                     budgetEstimatedInput.value = itemToEdit.estimated ?? ''; // Usa stringa vuota
                     budgetActualInput.value = itemToEdit.actual ?? ''; // Usa stringa vuota
                     budgetPaidByInput.value = itemToEdit.paidBy || '';
                     budgetSplitBetweenInput.value = itemToEdit.splitBetween || '';
                     break;
                 case 'packing':
                     packingItemNameInput.value = itemToEdit.name || '';
                     packingItemCategoryInput.value = itemToEdit.category || 'Altro';
                     packingItemQuantityInput.value = itemToEdit.quantity || 1;
                     break;
            }
        } catch (error) {
            console.error(`Errore nel popolare il form per ${listType}:`, error);
            showToast(`Errore nel caricamento dati per la modifica.`, 'error');
            resetEditState(listType); // Resetta lo stato se c'è errore
            return;
        }

        // Aggiorna UI del form allo stato "Modifica"
        if (submitBtn) {
            submitBtn.innerHTML = '<i class="fas fa-save"></i> Salva Modifiche';
            submitBtn.classList.remove('btn-secondary');
            submitBtn.classList.add('btn-warning'); // Usa stile warning per modifica
        }
        if (cancelBtn) cancelBtn.style.display = 'inline-flex'; // Mostra bottone Annulla

        // Aggiorna bottoni ricerca esterna se è form trasporti
        if (listType === 'transport') toggleSearchButtonsVisibility();

        // Scrolla fino al form per visibilità
        if (form) form.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    };
    // Gestisce il submit dei form per aggiungere/modificare items
    const handleItemFormSubmit = async (e, listType) => {
        e.preventDefault(); // Impedisce submit standard
        if (!currentTripId || !currentUserId) return; // Verifica stato

        const tripIndex = trips.findIndex(t => t.id === currentTripId);
        if (tripIndex === -1) { showToast("Errore: Viaggio corrente non trovato.", "error"); return; }
        const trip = trips[tripIndex]; // Riferimento al viaggio

        const currentEditId = editingItemId[listType]; // ID dell'item in modifica (null se nuovo)
        let itemData = {}; // Oggetto per i dati del nuovo/modificato item
        let list = [];     // Riferimento all'array corretto dentro l'oggetto trip
        let listOwner = trip; // A volte l'array è dentro trip.budget
        let renderFn;      // Funzione per ri-renderizzare la lista specifica

        // Imposta list, listOwner, renderFn in base a listType
        switch (listType) {
            case 'participant': list = trip.participants = trip.participants || []; renderFn = renderParticipants; break;
            case 'reminder': list = trip.reminders = trip.reminders || []; renderFn = renderReminders; break;
            case 'transport': list = trip.transportations = trip.transportations || []; renderFn = renderTransportations; break;
            case 'accommodation': list = trip.accommodations = trip.accommodations || []; renderFn = renderAccommodations; break;
            case 'itinerary': list = trip.itinerary = trip.itinerary || []; renderFn = renderItinerary; break;
            case 'budget':
                 trip.budget = trip.budget || { items: [], estimatedTotal: 0, actualTotal: 0 }; // Assicura che budget esista
                 list = trip.budget.items = trip.budget.items || [];
                 listOwner = trip.budget; // Qui listOwner è trip.budget
                 renderFn = renderBudget;
                 break;
            case 'packing': list = trip.packingList = trip.packingList || []; renderFn = renderPackingList; break;
            default: console.error("Tipo lista non valido:", listType); return;
        }

        // Raccogli e valida i dati dal form specifico
        try {
            switch (listType) {
                case 'participant':
                    if (!participantNameInput.value.trim()) throw new Error("Il nome del partecipante è richiesto.");
                    itemData = {
                        name: participantNameInput.value.trim(),
                        notes: participantNotesInput.value.trim() || null,
                        extraInfo: participantExtraInfoTextarea.value.trim() || null
                    };
                    break;
                 case 'reminder':
                    if (!reminderDescriptionInput.value.trim()) throw new Error("La descrizione del promemoria è richiesta.");
                    itemData = {
                        description: reminderDescriptionInput.value.trim(),
                        dueDate: reminderDueDateInput.value || null, // Salva null se vuoto
                        status: reminderStatusSelect.value // 'todo' o 'done'
                    };
                    break;
                case 'transport':
                    if (!transportDescriptionInput.value.trim()) throw new Error("La descrizione del trasporto è richiesta.");
                    const depDateTime = transportDepartureDatetimeInput.value || null;
                    const arrDateTime = transportArrivalDatetimeInput.value || null;
                    if (depDateTime && arrDateTime && depDateTime >= arrDateTime) throw new Error("La data/ora di arrivo deve essere successiva alla partenza.");
                    const transportCost = safeToNumberOrNull(transportCostInput.value);
                    if(transportCost !== null && transportCost < 0) throw new Error("Il costo del trasporto non può essere negativo.");
                     itemData = {
                        type: transportTypeSelect.value,
                        description: transportDescriptionInput.value.trim(),
                        departureLoc: transportDepartureLocInput.value.trim() || null,
                        departureDateTime: depDateTime,
                        arrivalLoc: transportArrivalLocInput.value.trim() || null,
                        arrivalDateTime: arrDateTime,
                        bookingRef: transportBookingRefInput.value.trim() || null,
                        cost: transportCost,
                        notes: transportNotesInput.value.trim() || null,
                        link: transportLinkInput.value.trim() || null
                    };
                    break;
                 case 'accommodation':
                    if (!accommodationNameInput.value.trim()) throw new Error("Il nome dell'alloggio è richiesto.");
                    const checkin = accommodationCheckinInput.value || null;
                    const checkout = accommodationCheckoutInput.value || null;
                    if(checkin && checkout && checkin >= checkout) throw new Error("La data/ora di check-out deve essere successiva al check-in.");
                    const accomCost = safeToNumberOrNull(accommodationCostInput.value);
                    if(accomCost !== null && accomCost < 0) throw new Error("Il costo dell'alloggio non può essere negativo.");
                    itemData = {
                        name: accommodationNameInput.value.trim(),
                        type: accommodationTypeSelect.value,
                        address: accommodationAddressInput.value.trim() || null,
                        checkinDateTime: checkin,
                        checkoutDateTime: checkout,
                        bookingRef: accommodationBookingRefInput.value.trim() || null,
                        cost: accomCost,
                        notes: accommodationNotesInput.value.trim() || null,
                        link: accommodationLinkInput.value.trim() || null
                    };
                    break;
                 case 'itinerary':
                    const itinDay = itineraryDayInput.value;
                    const itinAct = itineraryActivityInput.value.trim();
                    if (!itinDay || !itinAct) throw new Error("Il giorno e la descrizione dell'attività sono richiesti.");
                    // Warning se data fuori range viaggio
                    const itinStartDate = trip.startDate ? trip.startDate.split('T')[0] : null;
                    const itinEndDate = trip.endDate ? trip.endDate.split('T')[0] : null;
                    if (itinStartDate && itinEndDate && itinDay && (itinDay < itinStartDate || itinDay > itinEndDate)) {
                        showToast(`Attenzione: data ${formatDate(itinDay)} fuori dal periodo del viaggio (${formatDate(itinStartDate)} - ${formatDate(itinEndDate)}).`, 'warning');
                    }
                    const itinCost = safeToNumberOrNull(itineraryCostInput.value);
                    if(itinCost !== null && itinCost < 0) throw new Error("Il costo dell'attività non può essere negativo.");
                    itemData = {
                        day: itinDay,
                        time: itineraryTimeInput.value || null,
                        activity: itinAct,
                        location: itineraryLocationInput.value.trim() || null,
                        bookingRef: itineraryBookingRefInput.value.trim() || null,
                        cost: itinCost,
                        notes: itineraryNotesInput.value.trim() || null,
                        link: itineraryLinkInput.value.trim() || null
                    };
                    break;
                 case 'budget':
                    const descBudget = budgetDescriptionInput.value.trim();
                    const est = safeToNumberOrNull(budgetEstimatedInput.value);
                    const act = safeToNumberOrNull(budgetActualInput.value);
                    if (!descBudget || est === null || est < 0) throw new Error("Descrizione e costo stimato (>=0) richiesti.");
                    if (act !== null && act < 0) throw new Error("Il costo effettivo non può essere negativo.");
                    itemData = {
                        category: budgetCategorySelect.value,
                        description: descBudget,
                        estimated: est,
                        actual: act,
                        paidBy: budgetPaidByInput.value.trim() || null,
                        splitBetween: budgetSplitBetweenInput.value.trim() || null
                    };
                    break;
                 case 'packing':
                    if (!packingItemNameInput.value.trim()) throw new Error("Il nome dell'oggetto è richiesto.");
                    const quantity = safeToPositiveIntegerOrDefault(packingItemQuantityInput.value);
                    itemData = {
                        name: packingItemNameInput.value.trim(),
                        category: packingItemCategoryInput.value.trim() || 'Altro', // Default se vuoto
                        quantity: quantity
                    };
                    break;
            }
        } catch (error) { // Cattura errori di validazione
            showToast(`Errore dati: ${error.message}`, "error");
            return; // Interrompe esecuzione
        }

        // Aggiorna o aggiungi l'item nell'array locale
        if (currentEditId) { // Se stiamo modificando
            const idx = list.findIndex(i => i && i.id === currentEditId);
            if (idx > -1) {
                const oldItem = list[idx];
                 // Mantieni 'packed' stato se è packing list, altrimenti sovrascrivi
                 list[idx] = { ...itemData, id: currentEditId, ...(listType === 'packing' ? { packed: oldItem.packed } : {}) };
            } else {
                console.error(`Item ${currentEditId} non trovato per aggiornamento.`);
                showToast("Errore: elemento da modificare non trovato.", "error");
                resetEditState(listType); // Resetta stato modifica
                return;
            }
        } else { // Se stiamo aggiungendo
            itemData.id = generateId(listType); // Genera nuovo ID
            if (listType === 'packing') itemData.packed = false; // Default non impacchettato
            if (listType === 'reminder') itemData.status = itemData.status || 'todo'; // Default da fare
            list.push(itemData); // Aggiungi in fondo alla lista
        }

        // Se è budget, ricalcola totali
        if (listType === 'budget') {
            let calcEst = 0, calcAct = 0;
            trip.budget.items.forEach(item => {
                const est = safeToNumberOrNull(item.estimated);
                const act = safeToNumberOrNull(item.actual);
                if (est !== null) calcEst += est;
                if (act !== null) calcAct += act;
            });
            trip.budget.estimatedTotal = calcEst;
            trip.budget.actualTotal = calcAct;
        }

        trip.updatedAt = new Date().toISOString(); // Aggiorna timestamp (locale)

        // Salva l'intero oggetto viaggio su Firestore
        const success = await saveTripToFirestore(trip);

        if (success) {
            // Se salvataggio OK:
            if (listType === 'budget') {
                renderFn(listOwner); // Render budget passa trip.budget
            } else {
                renderFn(list); // Render altre liste passa l'array
            }
            resetEditState(listType); // Pulisci form e stato modifica
            // Aggiorna datalist se necessario
            if(listType === 'participant') populateDatalists(trip);
            if(listType === 'packing') populatePackingCategoriesDatalist(trip.packingList);
        }
        // Se fallisce, saveTripToFirestore mostra già toast
    };
    // Gestisce la richiesta di eliminazione di un item da una lista
    const handleDeleteItem = (listType, itemId) => {
        if (!currentTripId || !currentUserId) return;
        const tripIndex = trips.findIndex(t => t.id === currentTripId);
        if (tripIndex === -1) return;
        const trip = trips[tripIndex];

        let list, renderFn, listOwner = trip, itemName = "voce";
        // Imposta variabili in base al tipo di lista
        switch(listType) {
            case 'participant': list = trip.participants || []; renderFn = renderParticipants; itemName="partecipante"; break;
            case 'reminder': list = trip.reminders || []; renderFn = renderReminders; itemName="promemoria"; break;
            case 'transport': list = trip.transportations || []; renderFn = renderTransportations; itemName="trasporto"; break;
            case 'accommodation': list = trip.accommodations || []; renderFn = renderAccommodations; itemName="alloggio"; break;
            case 'itinerary': list = trip.itinerary || []; renderFn = renderItinerary; itemName="attività"; break;
            case 'budget':
                 if (!trip.budget || !trip.budget.items) return; // Verifica esistenza budget
                 list = trip.budget.items;
                 renderFn = renderBudget;
                 listOwner = trip.budget;
                 itemName="spesa";
                 break;
            case 'packing': list = trip.packingList || []; renderFn = renderPackingList; itemName="oggetto"; break;
            default: console.error("Tipo lista non valido per eliminazione:", listType); return;
        }

        if (!Array.isArray(list)) { console.error(`Lista ${listType} non è un array.`); return; } // Verifica tipo lista

        const itemIndex = list.findIndex(item => item && item.id === itemId);
        if (itemIndex > -1) { // Se l'item esiste
            // Ottieni una descrizione per il messaggio di conferma
            const itemDesc = list[itemIndex].name || list[itemIndex].description || list[itemIndex].activity || `ID: ${itemId}`;
            // Mostra modale conferma
            showConfirmationModal(
                `Conferma Eliminazione ${itemName}`,
                `Sei sicuro di voler eliminare "${itemDesc}"?`,
                async () => { // Callback alla conferma
                    // Rimuovi l'item dall'array locale
                    list.splice(itemIndex, 1);

                    // Se è budget, ricalcola totali
                    if (listType === 'budget') {
                        let calcEst = 0, calcAct = 0;
                        trip.budget.items.forEach(item => {
                            const est = safeToNumberOrNull(item.estimated);
                            const act = safeToNumberOrNull(item.actual);
                            if (est !== null) calcEst += est;
                            if (act !== null) calcAct += act;
                        });
                        trip.budget.estimatedTotal = calcEst;
                        trip.budget.actualTotal = calcAct;
                    }

                    trip.updatedAt = new Date().toISOString(); // Aggiorna timestamp (locale)

                    // Salva il viaggio modificato su Firestore
                    const success = await saveTripToFirestore(trip);

                    if (success) {
                        // Se salvataggio OK:
                        if (listType === 'budget') { renderFn(listOwner); } // Render budget
                        else { renderFn(list); } // Render altre liste

                        // Se l'item eliminato era quello in modifica, resetta il form
                        if (editingItemId[listType] === itemId) resetEditState(listType);

                        showToast(`${itemName.charAt(0).toUpperCase() + itemName.slice(1)} eliminato/a.`, 'info');
                        // Aggiorna datalist se necessario
                         if(listType === 'participant') populateDatalists(trip);
                         if(listType === 'packing') populatePackingCategoriesDatalist(trip.packingList);
                    }
                     // Se fallisce, saveTripToFirestore mostra già toast
                }
            );
        } else {
             console.warn(`Item ${itemId} non trovato in ${listType} per eliminazione.`);
             showToast("Elemento non trovato per l'eliminazione.", "warning");
        }
    };
    // Gestisce il toggle dello stato 'packed' per un item della packing list
    const handleTogglePacked = async (itemId, isPacked) => {
        if (!currentTripId || !currentUserId) return;
        const tripIndex = trips.findIndex(t => t.id === currentTripId);
        if (tripIndex === -1) return;
        const trip = trips[tripIndex];

        if (!trip.packingList) trip.packingList = []; // Assicura che lista esista

        const idx = trip.packingList.findIndex(i => i && i.id === itemId);
        if (idx > -1) { // Se item trovato
            trip.packingList[idx].packed = isPacked; // Aggiorna stato locale
            trip.updatedAt = new Date().toISOString(); // Aggiorna timestamp

            // Salva su Firestore
            const success = await saveTripToFirestore(trip);

            if (success) {
                // Se ordinamento è per stato, ri-renderizza intera lista
                if (currentSort.packing === 'status') {
                    renderPackingList(trip.packingList);
                } else {
                    // Altrimenti, aggiorna solo l'elemento specifico nella UI
                    const li = packingListUl?.querySelector(`li[data-item-id="${itemId}"]`);
                    if (li) li.classList.toggle('packed', isPacked);
                    const checkbox = packingListUl?.querySelector(`input[data-item-id="${itemId}"]`);
                    if (checkbox) checkbox.checked = isPacked; // Assicura coerenza checkbox
                }
            } else {
                // Se salvataggio fallisce, ripristina stato locale e UI
                trip.packingList[idx].packed = !isPacked;
                const li = packingListUl?.querySelector(`li[data-item-id="${itemId}"]`);
                 if (li) li.classList.toggle('packed', !isPacked);
                 const checkbox = packingListUl?.querySelector(`input[data-item-id="${itemId}"]`);
                 if (checkbox) checkbox.checked = !isPacked;
            }
        } else {
            console.warn(`Packing item ${itemId} non trovato per toggle.`);
        }
    };
    // Importa una lista predefinita di packing items
    const handleImportPackingList = async (type) => {
        if (!currentTripId || !PREDEFINED_PACKING_LISTS[type] || !currentUserId) return;
        const tripIndex = trips.findIndex(t => t.id === currentTripId);
        if (tripIndex === -1) return;
        const trip = trips[tripIndex];

        const predefined = PREDEFINED_PACKING_LISTS[type];
        let added = 0;
        trip.packingList = trip.packingList || []; // Assicura array esista
        // Nomi attuali in lowercase per check duplicati (case-insensitive)
        const currentLower = trip.packingList.map(i => (i?.name || '').toLowerCase());

        predefined.forEach(predefItem => {
            // Aggiungi solo se non già presente (ignorando maiuscole/minuscole)
            if (!currentLower.includes(predefItem.name.toLowerCase())) {
                trip.packingList.push({
                    id: generateId('pack'),
                    name: predefItem.name,
                    packed: false, // Default non impacchettato
                    category: predefItem.category || 'Altro',
                    quantity: predefItem.quantity || 1
                });
                added++;
            }
        });

        if (added > 0) { // Se abbiamo aggiunto qualcosa
            trip.updatedAt = new Date().toISOString();
            const success = await saveTripToFirestore(trip); // Salva
            if (success) {
                renderPackingList(trip.packingList); // Aggiorna UI
                populatePackingCategoriesDatalist(trip.packingList); // Aggiorna datalist categorie
                showToast(`${added} oggetti aggiunti dalla lista predefinita!`, 'success');
            }
        } else {
            showToast(`Nessun nuovo oggetto da aggiungere dalla lista ${type}.`, 'info');
        }
    };
    // Funzione helper per aggiungere una spesa al budget (usata da trasporti)
    const addCostToBudget = async (category, description, cost) => {
        if (!currentTripId || cost === null || cost <= 0 || !currentUserId) return false;
        const tripIndex = trips.findIndex(t => t.id === currentTripId);
        if (tripIndex === -1) return false;
        const trip = trips[tripIndex];

        // Crea nuovo item budget
        const budgetItem = {
            id: generateId('budget'),
            category: category,
            description: description,
            estimated: cost, // Aggiunto come costo stimato
            actual: null,    // Costo effettivo nullo
            paidBy: null,
            splitBetween: null
        };

        trip.budget = trip.budget || { items: [], estimatedTotal: 0, actualTotal: 0 };
        trip.budget.items = trip.budget.items || [];
        trip.budget.items.push(budgetItem); // Aggiungi all'array locale
        // Aggiorna totale stimato locale
        trip.budget.estimatedTotal = (trip.budget.estimatedTotal || 0) + cost;
        trip.updatedAt = new Date().toISOString();

        // Salva su Firestore
        const success = await saveTripToFirestore(trip);

        if (success) {
            renderBudget(trip.budget); // Aggiorna UI budget
            return true;
        } else {
            // Se fallisce, rimuovi l'item aggiunto localmente e ripristina totale
            trip.budget.items.pop();
            trip.budget.estimatedTotal -= cost;
            renderBudget(trip.budget); // Aggiorna UI per riflettere rollback
            return false;
        }
    };
    // Aggiunge il costo totale dei trasporti al budget
    const handleCalculateAndAddTransportCost = async () => {
        if (!currentTripId) { showToast("Seleziona prima un viaggio.", "error"); return; }
        const trip = findTripById(currentTripId);
        if (!trip || !Array.isArray(trip.transportations)) { showToast("Errore nel caricamento dei dati dei trasporti.", "error"); return; }

        let totalCost = 0;
        trip.transportations.forEach(item => {
            const cost = Number(item?.cost || 0); // Converte costo a numero, default 0
            if (!isNaN(cost) && cost > 0) {
                totalCost += cost; // Somma solo costi validi e positivi
            }
        });

        if (totalCost <= 0) {
            showToast("Nessun costo valido trovato tra i trasporti da aggiungere.", "info");
            return;
        }

        // Chiedi conferma prima di aggiungere
        showConfirmationModal(
            "Aggiungi Costo Trasporti al Budget",
            `Aggiungere ${formatCurrency(totalCost)} come costo stimato per "Trasporti" nel budget?`,
            async () => {
                const success = await addCostToBudget(
                    "Trasporti", // Categoria
                    `Totale Costi Trasporti (del ${formatDate(new Date().toISOString().slice(0,10))})`, // Descrizione
                    totalCost // Costo
                );
                if(success) {
                    showToast(`Costo trasporti (${formatCurrency(totalCost)}) aggiunto al budget!`, 'success');
                    switchTab('budget-tab'); // Passa alla tab budget
                }
                // Se fallisce, addCostToBudget mostra già toast
            }
        );
    };

    // ==========================================================================
    // == FUNZIONI RENDER LISTE DETTAGLIATE ==
    // ==========================================================================
    const populateDatalists = (trip) => {
        if (!trip || !participantDatalist) return;
        participantDatalist.innerHTML = ''; // Pulisci datalist partecipanti
        (trip.participants || []).forEach(p => {
            const option = document.createElement('option');
            option.value = p.name; // Aggiungi nomi partecipanti per autocompletamento
            participantDatalist.appendChild(option);
        });
        // Popola datalist categorie packing
        populatePackingCategoriesDatalist(trip.packingList);
    };
    const populatePackingCategoriesDatalist = (packingList) => {
        if (!packingCategoryDatalist) return;
        packingCategoryDatalist.innerHTML = ''; // Pulisci
        // Usa un Set per avere categorie uniche, partendo dai default
        const categories = new Set(DEFAULT_PACKING_CATEGORIES);
        // Aggiungi categorie usate nella lista corrente
        (packingList || []).forEach(p => { if(p.category) categories.add(p.category); });
        // Ordina e aggiungi come options
        Array.from(categories).sort().forEach(cat => {
            const option = document.createElement('option');
            option.value = cat;
            packingCategoryDatalist.appendChild(option);
        });
    };
    const renderParticipants = (participantsInput = []) => {
        const items = Array.isArray(participantsInput) ? participantsInput : [];
        if (!participantListUl) return;
        participantListUl.innerHTML = ''; // Pulisci
        if(noParticipantsItemsP) noParticipantsItemsP.style.display = items.length === 0 ? 'block' : 'none';
        if (!Array.isArray(items)) return; // Sicurezza
        // Ordina per nome
        items.sort((a, b) => (a?.name || '').localeCompare(b?.name || ''));
        items.forEach(item => {
            if (!item || !item.id) return; // Salta items non validi
            const li = document.createElement('li');
            li.dataset.itemId = item.id;
            li.innerHTML = `
                <div class="item-details">
                    <strong><i class="fas fa-user fa-fw"></i> ${item.name || 'N/D'}</strong>
                    ${item.notes ? `<span class="meta"><i class="fas fa-info-circle fa-fw"></i> ${item.notes}</span>`:''}
                    ${item.extraInfo ? `<span class="meta"><i class="fas fa-sticky-note fa-fw"></i> ${item.extraInfo}</span>`:''}
                </div>
                <div class="item-actions">
                    <button class="btn-icon edit participant-edit-btn" data-item-id="${item.id}" title="Modifica"><i class="fas fa-edit"></i></button>
                    <button class="btn-icon delete participant-delete-btn" data-item-id="${item.id}" title="Elimina"><i class="fas fa-trash-alt"></i></button>
                </div>`;
            participantListUl.appendChild(li);
        });
    };
    const renderReminders = (remindersInput = []) => {
        let items = Array.isArray(remindersInput) ? remindersInput : [];
        if (!reminderListUl) return;
        reminderListUl.innerHTML = '';
        if(noReminderItemsP) noReminderItemsP.style.display = items.length === 0 ? 'block' : 'none';
        if (!Array.isArray(items)) return; // Sicurezza
        // Ordina in base alla selezione corrente
        const sortKey = currentSort.reminder;
        items.sort((a, b) => {
            if (sortKey === 'dueDate') {
                // Ordina per data, mettendo quelli senza data alla fine
                return (a?.dueDate || '9999-12-31').localeCompare(b?.dueDate || '9999-12-31');
            }
            if (sortKey === 'status') {
                // Ordina per stato (Da Fare prima di Fatto), poi per data
                const statusOrder = { 'todo': 0, 'done': 1 };
                return (statusOrder[a?.status] ?? 9) - (statusOrder[b?.status] ?? 9) || (a?.dueDate || '9999').localeCompare(b?.dueDate || '9999');
            }
            // Default: ordina per descrizione
            return (a?.description || '').localeCompare(b?.description || '');
        });
        items.forEach(item => {
            if (!item || !item.id) return;
            const li = document.createElement('li');
            li.dataset.itemId = item.id;
            li.classList.toggle('done', item.status === 'done'); // Classe per stile item fatti
            const statusClass = item.status === 'done' ? 'done' : 'todo';
            const statusText = item.status === 'done' ? 'FATTO' : 'DA FARE';
            li.innerHTML = `
                <div class="item-details">
                    <strong>
                        <span class="status-indicator ${statusClass}">${statusText}</span>
                        ${item.description || 'N/D'}
                    </strong>
                    ${item.dueDate ? `<span class="meta due-date"><i class="fas fa-calendar-alt fa-fw"></i> Scadenza: ${formatDate(item.dueDate)}</span>` : ''}
                </div>
                <div class="item-actions">
                    <button class="btn-icon edit reminder-edit-btn" data-item-id="${item.id}" title="Modifica"><i class="fas fa-edit"></i></button>
                    <button class="btn-icon delete reminder-delete-btn" data-item-id="${item.id}" title="Elimina"><i class="fas fa-trash-alt"></i></button>
                </div>`;
            reminderListUl.appendChild(li);
        });
    };
    const renderTransportations = (transportItemsInput) => {
        let items = Array.isArray(transportItemsInput) ? transportItemsInput : [];
        if (!transportListUl) return;
        transportListUl.innerHTML = '';
        if(noTransportItemsP) noTransportItemsP.style.display = items.length === 0 ? 'block' : 'none';
        if (!Array.isArray(items)) return; // Sicurezza
        // Ordina in base alla selezione corrente
        const sortKey = currentSort.transport;
        items.sort((a, b) => {
            if (sortKey === 'type') {
                // Ordina per tipo, poi per data partenza
                return (a?.type || '').localeCompare(b?.type || '') || (a?.departureDateTime || '').localeCompare(b?.departureDateTime || '');
            }
            if (sortKey === 'cost') {
                 // Ordina per costo decrescente (i più costosi prima)
                 // Metti null/undefined per ultimi (o primi se cambi -Infinity)
                return (b?.cost ?? -Infinity) - (a?.cost ?? -Infinity);
            }
            // Default: ordina per data/ora partenza
            return (a?.departureDateTime || '').localeCompare(b?.departureDateTime || '');
        });
        items.forEach(item => {
            if (!item || !item.id) return;
            const li = document.createElement('li');
            li.dataset.itemId = item.id;
            const iconClass = getTransportIcon(item.type); // Ottieni icona corrispondente
            li.innerHTML = `
                <div class="item-details">
                    <strong><i class="fas ${iconClass} fa-fw"></i> ${item.type}: ${item.description || 'N/D'}</strong>
                    <span class="meta"><i class="fas fa-plane-departure fa-fw"></i> Da: ${item.departureLoc || '?'} (${formatDateTime(item.departureDateTime)})</span>
                    <span class="meta"><i class="fas fa-plane-arrival fa-fw"></i> A: ${item.arrivalLoc || '?'} (${formatDateTime(item.arrivalDateTime)})</span>
                    ${item.bookingRef ? `<span class="meta"><i class="fas fa-ticket-alt fa-fw"></i> Rif: ${item.bookingRef}</span>`:''}
                    ${item.cost!==null ? `<span class="meta"><i class="fas fa-euro-sign fa-fw"></i> Costo: ${formatCurrency(item.cost)}</span>`:''}
                    ${item.notes ? `<span class="meta"><i class="fas fa-info-circle fa-fw"></i> Note: ${item.notes}</span>`:''}
                    ${item.link ? `<span class="meta"><i class="fas fa-link fa-fw"></i> Link: ${formatDisplayLink(item.link)}</span>`:''}
                </div>
                <div class="item-actions">
                    <button class="btn-icon edit transport-edit-btn" data-item-id="${item.id}" title="Modifica"><i class="fas fa-edit"></i></button>
                    <button class="btn-icon delete transport-delete-btn" data-item-id="${item.id}" title="Elimina"><i class="fas fa-trash-alt"></i></button>
                </div>`;
            transportListUl.appendChild(li);
        });
    };
    const getTransportIcon = (type) => {
        switch(String(type).toLowerCase()) { // Usa toLowerCase per sicurezza
            case 'volo': return 'fa-plane-departure';
            case 'treno': return 'fa-train';
            case 'auto': return 'fa-car';
            case 'bus': return 'fa-bus-alt';
            case 'traghetto': case 'traghetto/nave': return 'fa-ship';
            case 'metro/mezzi pubblici': return 'fa-subway';
            case 'taxi/ride sharing': return 'fa-taxi';
            default: return 'fa-road'; // Icona generica
        }
    };
    const renderAccommodations = (accommodationsInput = []) => {
        const items = Array.isArray(accommodationsInput) ? accommodationsInput : [];
        if (!accommodationListUl) return;
        accommodationListUl.innerHTML = '';
        if(noAccommodationItemsP) noAccommodationItemsP.style.display = items.length === 0 ? 'block' : 'none';
        if (!Array.isArray(items)) return; // Sicurezza
        // Ordina per data check-in
        items.sort((a, b) => (a?.checkinDateTime || '').localeCompare(b?.checkinDateTime || ''));
        items.forEach(item => {
            if (!item || !item.id) return;
            const li = document.createElement('li');
            li.dataset.itemId = item.id;
            const mapLink = createMapLink(item.address); // Genera link mappa se indirizzo presente
            li.innerHTML = `
                <div class="item-details">
                    <strong><i class="fas fa-hotel fa-fw"></i> ${item.name || 'N/D'} (${item.type || 'N/D'})</strong>
                    ${item.address ? `<span class="meta"><i class="fas fa-map-marker-alt fa-fw"></i> ${item.address} ${mapLink ? `<a href="${mapLink}" target="_blank" rel="noopener noreferrer" class="btn-map-link" title="Mostra Mappa"><i class="fas fa-map-marked-alt"></i></a>` : ''}</span>`:''}
                    <span class="meta"><i class="fas fa-calendar-check fa-fw"></i> Check-in: ${formatDateTime(item.checkinDateTime)}</span>
                    <span class="meta"><i class="fas fa-calendar-times fa-fw"></i> Check-out: ${formatDateTime(item.checkoutDateTime)}</span>
                    ${item.bookingRef ? `<span class="meta"><i class="fas fa-key fa-fw"></i> Rif: ${item.bookingRef}</span>`:''}
                    ${item.cost!==null ? `<span class="meta"><i class="fas fa-euro-sign fa-fw"></i> Costo: ${formatCurrency(item.cost)}</span>`:''}
                    ${item.notes ? `<span class="meta"><i class="fas fa-info-circle fa-fw"></i> Note: ${item.notes}</span>`:''}
                    ${item.link ? `<span class="meta"><i class="fas fa-link fa-fw"></i> Link: ${formatDisplayLink(item.link)}</span>`:''}
                </div>
                <div class="item-actions">
                    <button class="btn-icon edit accommodation-edit-btn" data-item-id="${item.id}" title="Modifica"><i class="fas fa-edit"></i></button>
                    <button class="btn-icon delete accommodation-delete-btn" data-item-id="${item.id}" title="Elimina"><i class="fas fa-trash-alt"></i></button>
                </div>`;
            accommodationListUl.appendChild(li);
        });
    };
    const renderItinerary = (itineraryItemsInput) => {
        let items = Array.isArray(itineraryItemsInput) ? itineraryItemsInput : [];
        if (!itineraryListUl) return;
        itineraryListUl.innerHTML = '';
        if(noItineraryItemsP) noItineraryItemsP.style.display = items.length === 0 ? 'block' : 'none';
        if (!Array.isArray(items)) return; // Sicurezza

        // Filtra per ricerca interna
        const searchTerm = currentSearchTerm.itinerary.toLowerCase();
        if (searchTerm) {
            items = items.filter(item =>
                (item.activity?.toLowerCase() || '').includes(searchTerm) ||
                (item.location?.toLowerCase() || '').includes(searchTerm) ||
                (item.notes?.toLowerCase() || '').includes(searchTerm)
            );
        }

        // Ordina in base alla selezione corrente
        const sortKey = currentSort.itinerary;
        items.sort((a, b) => {
            if (sortKey === 'activity') {
                // Ordina per attività
                return (a?.activity || '').localeCompare(b?.activity || '');
            }
            // Default: ordina per data e poi ora
            const dateTimeA = `${a?.day || ''} ${a?.time || ''}`;
            const dateTimeB = `${b?.day || ''} ${b?.time || ''}`;
            return dateTimeA.localeCompare(dateTimeB);
        });
        items.forEach(item => {
            if (!item || !item.id) return;
            const li = document.createElement('li');
            li.dataset.itemId = item.id;
            const mapLink = createMapLink(item.location); // Genera link mappa
            li.innerHTML = `
                <div class="item-details">
                    <strong>${formatDate(item.day)} ${item.time?'('+item.time+')':''} - ${item.activity||'N/D'}</strong>
                    ${item.location ? `<span class="meta"><i class="fas fa-map-marker-alt fa-fw"></i> ${item.location} ${mapLink ? `<a href="${mapLink}" target="_blank" rel="noopener noreferrer" class="btn-map-link" title="Mostra Mappa"><i class="fas fa-map-marked-alt"></i></a>` : ''}</span>`:''}
                    ${item.bookingRef ? `<span class="meta"><i class="fas fa-ticket-alt fa-fw"></i> Rif: ${item.bookingRef}</span>`:''}
                    ${item.cost!==null ? `<span class="meta"><i class="fas fa-euro-sign fa-fw"></i> Costo: ${formatCurrency(item.cost)}</span>`:''}
                    ${item.notes ? `<span class="meta"><i class="fas fa-info-circle fa-fw"></i> Note: ${item.notes}</span>`:''}
                    ${item.link ? `<span class="meta"><i class="fas fa-link fa-fw"></i> Link: ${formatDisplayLink(item.link)}</span>`:''}
                </div>
                <div class="item-actions">
                    <button class="btn-icon edit itinerary-edit-btn" data-item-id="${item.id}" title="Modifica"><i class="fas fa-edit"></i></button>
                    <button class="btn-icon delete itinerary-delete-btn" data-item-id="${item.id}" title="Elimina"><i class="fas fa-trash-alt"></i></button>
                </div>`;
            itineraryListUl.appendChild(li);
        });
    };
    const renderBudget = (budgetData) => {
        // Gestisce caso in cui budgetData sia null o non un oggetto
        const safeData = budgetData && typeof budgetData === 'object' ? budgetData : { items: [], estimatedTotal: 0, actualTotal: 0 };
        let items = Array.isArray(safeData.items) ? safeData.items : [];
        if (!budgetListUl) return;
        budgetListUl.innerHTML = '';
        if(noBudgetItemsP) noBudgetItemsP.style.display = items.length === 0 ? 'block' : 'none';

        let calcEst = 0; let calcAct = 0; // Ricalcola sempre i totali per sicurezza
        if (!Array.isArray(items)) return; // Sicurezza

        // Ordina in base alla selezione corrente
        const sortKey = currentSort.budget;
        items.sort((a, b) => {
            if (sortKey === 'estimatedDesc') { return (b?.estimated ?? 0) - (a?.estimated ?? 0); }
            if (sortKey === 'actualDesc') { return (b?.actual ?? -Infinity) - (a?.actual ?? -Infinity); }
            if (sortKey === 'description') { return (a?.description || '').localeCompare(b?.description || ''); }
            // Default: ordina per categoria
            return (a?.category||'').localeCompare(b?.category||'');
        });

        items.forEach(item => {
            if (!item || !item.id) return;
            // Calcola totali durante il ciclo
            const est = Number(item.estimated || 0);
            const act = item.actual === null || typeof item.actual === 'undefined' ? null : Number(item.actual || 0);
            if (!isNaN(est)) calcEst += est;
            if (act !== null && !isNaN(act)) calcAct += act;

            // Applica stile a costo effettivo se > o < di stimato
            let diffClass = '';
            if (act !== null && !isNaN(act) && est > 0) {
                if (act > est) diffClass = 'negative'; // Costo effettivo maggiore
                else if (act < est) diffClass = 'positive'; // Costo effettivo minore
            }

            const li = document.createElement('li');
            li.dataset.itemId = item.id;
            li.innerHTML = `
                <div class="item-details">
                    <strong>${item.category||'N/D'}: ${item.description||'N/D'}</strong>
                    <span class="meta">Stimato: ${formatCurrency(est)} | Effettivo: <span class="${diffClass}">${act === null ? 'N/A' : formatCurrency(act)}</span></span>
                    ${ (item.paidBy || item.splitBetween) ? `<span class="meta split-info"><i class="fas fa-user-friends fa-fw"></i> Pagato da: ${item.paidBy || '?'} / Diviso tra: ${item.splitBetween || '?'}</span>` : '' }
                </div>
                <div class="item-actions">
                    <button class="btn-icon edit budget-edit-btn" data-item-id="${item.id}" title="Modifica"><i class="fas fa-edit"></i></button>
                    <button class="btn-icon delete budget-delete-btn" data-item-id="${item.id}" title="Elimina"><i class="fas fa-trash-alt"></i></button>
                </div>`;
            budgetListUl.appendChild(li);
        });

        // Aggiorna riepilogo totali
        if(budgetTotalEstimatedStrong) budgetTotalEstimatedStrong.textContent = formatCurrency(calcEst);
        if(budgetTotalActualStrong) budgetTotalActualStrong.textContent = formatCurrency(calcAct);
        const diff = calcAct - calcEst;
        if (budgetDifferenceStrong) {
            budgetDifferenceStrong.textContent = formatCurrency(diff);
            budgetDifferenceStrong.className = ''; // Resetta classe
            if (diff < 0) budgetDifferenceStrong.classList.add('positive'); // Risparmiato
            else if (diff > 0) budgetDifferenceStrong.classList.add('negative'); // Sforato
        }
    };
    const renderPackingList = (itemsInput = []) => {
        let items = Array.isArray(itemsInput) ? itemsInput : [];
        if (!packingListUl) return;
        packingListUl.innerHTML = '';
        if(noPackingItemsP) noPackingItemsP.style.display = items.length === 0 ? 'block' : 'none';
        if (!Array.isArray(items)) return; // Sicurezza

        // Filtra per ricerca interna
        const searchTerm = currentSearchTerm.packing.toLowerCase();
        if (searchTerm) {
            items = items.filter(item =>
                (item.name?.toLowerCase() || '').includes(searchTerm) ||
                (item.category?.toLowerCase() || '').includes(searchTerm)
            );
        }

        // Ordina in base alla selezione corrente
        const sortKey = currentSort.packing;
        items.sort((a, b) => {
            if (sortKey === 'category') {
                // Ordina per categoria (Altro alla fine), poi per nome
                const catA = a?.category || 'zzz'; // Mette 'Altro' o null/undefined alla fine
                const catB = b?.category || 'zzz';
                return catA.localeCompare(catB) || (a?.name || '').localeCompare(b?.name || '');
            }
            if (sortKey === 'status') {
                // Ordina per stato (non impacchettati prima), poi per nome
                const packedA = a.packed ? 1 : 0;
                const packedB = b.packed ? 1 : 0;
                return packedA - packedB || (a?.name || '').localeCompare(b?.name || '');
            }
            // Default: ordina per nome
            return (a?.name||'').localeCompare(b?.name||'');
        });

        // Se ordinato per categoria, raggruppa
        if (sortKey === 'category') {
            const grouped = items.reduce((acc, item) => {
                const cat = item.category || 'Altro'; // Raggruppa null/undefined in 'Altro'
                if (!acc[cat]) acc[cat] = [];
                acc[cat].push(item);
                return acc;
            }, {});
            // Ordina le categorie (Altro alla fine)
            const sortedCategories = Object.keys(grouped).sort((a, b) =>
                 (a === 'Altro' ? 1 : (b === 'Altro' ? -1 : a.localeCompare(b)))
            );
            packingListUl.innerHTML = ''; // Pulisci ul principale
            sortedCategories.forEach(category => {
                const groupDiv = document.createElement('div');
                groupDiv.classList.add('packing-list-category-group');
                const title = document.createElement('h5');
                title.textContent = category;
                groupDiv.appendChild(title);
                const groupUl = document.createElement('ul'); // Crea sub-lista
                groupUl.classList.add('item-list', 'packing-list', 'nested');
                // Crea items per questa categoria
                grouped[category].forEach(item => groupUl.appendChild(createPackingListItem(item)));
                groupDiv.appendChild(groupUl);
                packingListUl.appendChild(groupDiv); // Aggiungi gruppo al DOM
            });
        } else {
            // Altrimenti, renderizza lista semplice
            items.forEach(item => packingListUl.appendChild(createPackingListItem(item)));
        }
    };
    // Crea un elemento <li> per la packing list
    const createPackingListItem = (item) => {
        if (!item || !item.id) return document.createDocumentFragment(); // Ritorna fragment vuoto se item non valido
        const li = document.createElement('li');
        li.dataset.itemId = item.id;
        li.classList.toggle('packed', item.packed); // Applica classe se impacchettato
        li.innerHTML = `
            <div class="form-check">
                <input class="form-check-input packing-checkbox" type="checkbox" id="pack-${item.id}" data-item-id="${item.id}" ${item.packed?'checked':''}>
                <label class="form-check-label" for="pack-${item.id}">
                    ${item.name||'N/D'}
                    ${item.quantity > 1 ? `<span class="packing-quantity">(x${item.quantity})</span>` : ''}
                </label>
            </div>
            <div class="item-details">
                 ${item.category && item.category !== 'Altro' ? `<span class="packing-category">${item.category}</span>` : ''}
            </div>
            <div class="item-actions">
                <button class="btn-icon edit packing-edit-btn" data-item-id="${item.id}" title="Modifica"><i class="fas fa-edit"></i></button>
                <button class="btn-icon delete packing-delete-btn" data-item-id="${item.id}" title="Elimina"><i class="fas fa-trash-alt"></i></button>
            </div>`;
        return li;
    };

    // ==========================================================================
    // == FUNZIONI UI GENERICHE ==
    // ==========================================================================
    const switchTab = (tabId) => {
        if (!tabId) return;
        // Nascondi tutti i contenuti e rimuovi classe active dai link
        document.querySelectorAll(".tab-content").forEach(t => { t.style.display="none"; t.classList.remove("active"); });
        document.querySelectorAll(".tab-link").forEach(l => l.classList.remove("active"));
        // Mostra contenuto e attiva link corrispondente
        const contentToShow = document.getElementById(tabId);
        const linkToActivate = tabsContainer?.querySelector(`.tab-link[data-tab="${tabId}"]`);
        if(contentToShow){
             contentToShow.style.display="block";
             // Ritardo leggero per permettere animazione fade-in (se presente nel CSS)
             setTimeout(()=>contentToShow.classList.add("active"), 10);
        }
        if(linkToActivate) linkToActivate.classList.add("active");
    };
    // Mostra/nasconde bottoni Skyscanner/Trainline nel form trasporti
    const toggleSearchButtonsVisibility = () => {
        if (!transportTypeSelect) return;
        const type = transportTypeSelect.value;
        if(searchSkyscannerBtn) searchSkyscannerBtn.style.display = (type === 'Volo') ? 'inline-flex' : 'none';
        if(searchTrainlineBtn) searchTrainlineBtn.style.display = (type === 'Treno') ? 'inline-flex' : 'none';
    };
    // Gestisce cambio ordinamento in una lista
    const handleSortChange = (listType, selectElement) => {
        if (!currentTripId) return;
        const trip = findTripById(currentTripId);
        if (!trip) return;
        currentSort[listType] = selectElement.value; // Aggiorna stato ordinamento
        // Chiama la funzione di rendering appropriata per riordinare la lista
        switch(listType) {
            case 'reminder': renderReminders(trip.reminders); break;
            case 'transport': renderTransportations(trip.transportations); break;
            case 'itinerary': renderItinerary(trip.itinerary); break;
            case 'budget': renderBudget(trip.budget); break;
            case 'packing': renderPackingList(trip.packingList); break;
        }
        saveLocalStorageAppState(); // Salva preferenza ordinamento
    };
    // Imposta i valori dei select di ordinamento in base allo stato corrente
    const applyCurrentSortToControls = () => {
        if(reminderSortControl) reminderSortControl.value = currentSort.reminder;
        if(transportSortControl) transportSortControl.value = currentSort.transport;
        if(itinerarySortControl) itinerarySortControl.value = currentSort.itinerary;
        if(budgetSortControl) budgetSortControl.value = currentSort.budget;
        if(packingSortControl) packingSortControl.value = currentSort.packing;
    };
    // Gestisce input nelle barre di ricerca interne (itinerario, packing)
    const handleInternalSearch = (listType, inputElement) => {
        if (!currentTripId) return;
        const trip = findTripById(currentTripId);
        if (!trip) return;
        currentSearchTerm[listType] = inputElement.value.toLowerCase(); // Aggiorna termine
        // Chiama funzione render per applicare filtro
        if (listType === 'itinerary') renderItinerary(trip.itinerary);
        else if (listType === 'packing') renderPackingList(trip.packingList);
        saveLocalStorageAppState(); // Salva termine ricerca
    };

    // ==========================================================================
    // == FUNZIONI RICERCA ESTERNA (Voli, Treni) ==
    // ==========================================================================
    const handleSearchFlights = () => {
        const origin = transportDepartureLocInput.value.trim();
        const dest = transportArrivalLocInput.value.trim();
        const startRaw = transportDepartureDatetimeInput.value ? transportDepartureDatetimeInput.value.split('T')[0] : '';
        const endRaw = transportArrivalDatetimeInput.value ? transportArrivalDatetimeInput.value.split('T')[0] : ''; // Skyscanner usa solo data partenza/ritorno

        // Validazione input base
        if (!origin || !dest) { showToast("Inserisci Origine e Destinazione per la ricerca.", "warning"); return; }
        if (!startRaw) { showToast("Inserisci almeno la data di partenza.", "warning"); return; }
        // Format date per Skyscanner (YYMMDD)
        const startSky = formatSkyscannerDate(startRaw);
        const endSky = formatSkyscannerDate(endRaw); // Opzionale, usato come data ritorno se presente

        if (!startSky) { showToast("Formato data partenza non valido.", "warning"); return; }
        // Costruisci URL Skyscanner
        const base = "https://www.skyscanner.it/trasporti/voli/";
        const origCode = origin.toLowerCase().replace(/\s+/g, '-') || 'anywhere'; // Sostituisci spazi, fallback 'anywhere'
        const destCode = dest.toLowerCase().replace(/\s+/g, '-') || 'anywhere';
        // Aggiunge data ritorno solo se valida
        const dateSegment = endSky ? `${startSky}/${endSky}/` : `${startSky}/`;
        // Parametri URL (adulti, cabina, etc.)
        const params = `?rtn=${endSky ? 1 : 0}&adults=1&children=0&infants=0&cabinclass=economy&preferdirects=false`;
        const url = `${base}${origCode}/${destCode}/${dateSegment}${params}`;
        console.log("Opening Skyscanner URL:", url);
        window.open(url, '_blank', 'noopener,noreferrer'); // Apri in nuova tab
    };
    const handleSearchTrains = () => {
        const origin = transportDepartureLocInput.value.trim();
        const dest = transportArrivalLocInput.value.trim();
        const startRaw = transportDepartureDatetimeInput.value ? transportDepartureDatetimeInput.value.split('T')[0] : '';
        // Trainline usa solo data partenza (per ricerca A/R serve interazione sul sito)
        if (!origin || !dest) { showToast("Inserisci Origine e Destinazione per la ricerca.", "warning"); return; }
        if (!startRaw) { showToast("Inserisci la data di partenza.", "warning"); return; }
        // Trainline URL format (semplificato, potrebbe cambiare)
        const base = "https://www.thetrainline.com/it/orari-treni/";
        // Formatta nomi stazioni (potrebbe non essere sempre corretto)
        const origFmt = origin.toLowerCase().replace(/\s+/g, '-');
        const destFmt = dest.toLowerCase().replace(/\s+/g, '-');
        const url = `${base}${origFmt}-a-${destFmt}?departureDate=${startRaw}&adults=1`;
        console.log("Opening Trainline URL:", url);
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    // ==========================================================================
    // == FUNZIONI DOWNLOAD / EMAIL / COPIA RIEPILOGO ==
    // ==========================================================================
    const handleEmailSummary = () => {
        if (!currentTripId) { showToast("Seleziona un viaggio.", "warning"); return; }
        const trip = findTripById(currentTripId);
        if (!trip) { showToast("Viaggio non trovato.", "error"); return; }
        // Costruisci corpo email semplice
        let emailBody = `Riepilogo Viaggio: ${trip.name || 'S.N.'}\n========================\n\n`;
        emailBody += `Destinazione: ${trip.destination || 'N/D'}\n`;
        emailBody += `Date: ${formatDate(trip.startDate)} - ${formatDate(trip.endDate)}\n`;
        emailBody += `Partecipanti: ${(trip.participants || []).map(p => p.name).join(', ') || 'Nessuno'}\n\n`;
        emailBody += `Note: ${trip.notes || '-'}\n\n`;
        emailBody += `(Per i dettagli completi, chiedi il link di condivisione o il file Excel/TXT)\n`;
        const emailSubject = `Riepilogo Viaggio: ${trip.name || 'S.N.'}`;
        // Crea link mailto
        const mailtoLink = `mailto:?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
        try {
            window.open(mailtoLink, '_blank'); // Tenta di aprire client email
        } catch (e) {
            console.error("Errore apertura mailto:", e);
            showToast("Impossibile aprire il client email automaticamente.", "error");
        }
    };
    const handleCopySummary = () => {
        if (!currentTripId) { showToast("Seleziona un viaggio.", "warning"); return; }
        const trip = findTripById(currentTripId);
        if (!trip) { showToast("Viaggio non trovato.", "error"); return; }
        // Costruisci testo per copia (stile chat)
        let textToCopy = `✈️ *Riepilogo Viaggio: ${trip.name || 'S.N.'}*\n`;
        textToCopy += `📍 Destinazione: ${trip.destination || 'N/D'}\n`;
        textToCopy += `📅 Date: ${formatDate(trip.startDate)} - ${formatDate(trip.endDate)}\n`;
        textToCopy += `👥 Partecipanti: ${(trip.participants || []).map(p => p.name).join(', ') || 'Nessuno'}\n`;
        textToCopy += `📝 Note: ${trip.notes || '-'}\n`;
        textToCopy += `(Per i dettagli, chiedi il link o il file completo)`;
        // Usa API Clipboard se disponibile, altrimenti fallback
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(textToCopy)
                .then(() => showToast("Riepilogo copiato negli appunti!", "success"))
                .catch(err => {
                    console.error('Errore copia (Clipboard API): ', err);
                    fallbackCopyTextToClipboard(textToCopy); // Prova fallback
                });
        } else {
            fallbackCopyTextToClipboard(textToCopy); // Usa fallback direttamente
        }
    };
    const handleDownloadText = () => {
        if (!currentTripId) { showToast("Seleziona un viaggio.", "error"); return; }
        const trip = findTripById(currentTripId);
        if (!trip) { showToast("Viaggio non trovato.", "error"); return; }

        let content = '';
        try {
            // Costruisci contenuto file TXT
            content = `Riepilogo Viaggio: ${trip.name || 'S.N.'}\n========================\n\n`;
            // Info Generali
            content += `**INFO GENERALI**\n`;
            content += `Nome: ${trip.name || 'S.N.'}\n`;
            content += `Origine: ${trip.originCity || 'N/D'}\n`;
            content += `Destinazione Principale: ${trip.destination || 'N/D'}\n`;
            content += `Date: ${formatDate(trip.startDate)} - ${formatDate(trip.endDate)}\n`;
            content += `Note Generali:\n${trip.notes || '-'}\n`;
            content += `Altre Info:\n${trip.extraInfo || '-'}\n\n`;
            // Partecipanti
            content += `**PARTECIPANTI (${(trip.participants || []).length})**\n`;
            (trip.participants || []).slice().sort((a,b)=>(a?.name||'').localeCompare(b?.name||'')).forEach(p => {
                content += `- ${p.name}${p.notes ? ' ('+p.notes+')':''}${p.extraInfo ? ' [Extra: '+p.extraInfo+']':''}\n`;
            });
            if((trip.participants || []).length === 0) content += "Nessun partecipante aggiunto.\n";
            content += "\n";
            // Promemoria
            content += `**PROMEMORIA / DA FARE (${(trip.reminders || []).length})**\n`;
            (trip.reminders || []).slice().sort((a,b)=>(a?.dueDate || '9999').localeCompare(b?.dueDate || '9999')).forEach(r => {
                content += `- [${r.status==='done'?'X':' '}] ${r.description}${r.dueDate ? ' (Scadenza: '+formatDate(r.dueDate)+')':''}\n`;
            });
             if((trip.reminders || []).length === 0) content += "Nessun promemoria aggiunto.\n";
            content += "\n";
            // Trasporti
            content += `**TRASPORTI (${(trip.transportations || []).length})**\n`;
            (trip.transportations || []).slice().sort((a,b)=>(a?.departureDateTime||'').localeCompare(b?.departureDateTime||'')).forEach(t => {
                content += `- ${t.type} (${t.description}):\n`;
                content += `  Da: ${t.departureLoc||'?'} (${formatDateTime(t.departureDateTime)})\n`;
                content += `  A: ${t.arrivalLoc||'?'} (${formatDateTime(t.arrivalDateTime)})\n`;
                if(t.bookingRef) content += `  Rif. Prenotazione: ${t.bookingRef}\n`;
                if(t.cost!==null) content += `  Costo: ${formatCurrency(t.cost)}\n`;
                if(t.notes) content += `  Note: ${t.notes}\n`;
                if(t.link) content += `  Link: ${t.link}\n`;
                content += '\n';
            });
             if((trip.transportations || []).length === 0) content += "Nessun trasporto aggiunto.\n";
            content += "\n";
            // Alloggi
            content += `**ALLOGGI (${(trip.accommodations || []).length})**\n`;
            (trip.accommodations || []).slice().sort((a,b)=>(a?.checkinDateTime||'').localeCompare(b?.checkinDateTime||'')).forEach(a => {
                content += `- ${a.name} (${a.type}):\n`;
                if(a.address) content += `  Indirizzo: ${a.address}\n`;
                content += `  Check-in: ${formatDateTime(a.checkinDateTime)}\n`;
                content += `  Check-out: ${formatDateTime(a.checkoutDateTime)}\n`;
                if(a.bookingRef) content += `  Rif. Prenotazione/Contatto: ${a.bookingRef}\n`;
                if(a.cost!==null) content += `  Costo Totale: ${formatCurrency(a.cost)}\n`;
                if(a.notes) content += `  Note: ${a.notes}\n`;
                if(a.link) content += `  Link: ${a.link}\n`;
                content += '\n';
            });
             if((trip.accommodations || []).length === 0) content += "Nessun alloggio aggiunto.\n";
            content += "\n";
            // Itinerario
            content += `**ITINERARIO (${(trip.itinerary || []).length})**\n`;
            (trip.itinerary || []).slice().sort((a,b)=>{const d=(a?.day||'').localeCompare(b?.day||''); return d!==0?d:(a?.time||'').localeCompare(b?.time||'');}).forEach(i => {
                 content += `- ${formatDate(i.day)}${i.time?' ('+i.time+')':''} - ${i.activity}\n`;
                 if(i.location) content += `  Luogo: ${i.location}\n`;
                 if(i.bookingRef) content += `  Rif. Prenotazione: ${i.bookingRef}\n`;
                 if(i.cost!==null) content += `  Costo: ${formatCurrency(i.cost)}\n`;
                 if(i.notes) content += `  Note: ${i.notes}\n`;
                 if(i.link) content += `  Link: ${i.link}\n`;
                 content += '\n';
            });
             if((trip.itinerary || []).length === 0) content += "Nessun itinerario aggiunto.\n";
            content += "\n";
            // Budget
            content += `**BUDGET (${(trip.budget?.items || []).length} voci)**\n`;
            (trip.budget?.items || []).slice().sort((a,b)=>(a?.category||'').localeCompare(b?.category||'')).forEach(b => {
                content += `- ${b.category}: ${b.description}\n`;
                content += `  Stimato: ${formatCurrency(b.estimated)}\n`;
                content += `  Effettivo: ${b.actual===null?'N/A':formatCurrency(b.actual)}\n`;
                if(b.paidBy) content += `  Pagato da: ${b.paidBy}\n`;
                if(b.splitBetween) content += `  Diviso tra: ${b.splitBetween}\n`;
                 content += '\n';
            });
            if((trip.budget?.items || []).length > 0) {
                content += `> Totale Stimato: ${formatCurrency(trip.budget?.estimatedTotal||0)}\n`;
                content += `> Totale Effettivo: ${formatCurrency(trip.budget?.actualTotal||0)}\n`;
                content += `> Differenza: ${formatCurrency((trip.budget?.actualTotal||0) - (trip.budget?.estimatedTotal||0))}\n`;
            } else {
                content += "Nessuna spesa aggiunta.\n";
            }
            content += "\n";
            // Packing List
            content += `**PACKING LIST (${(trip.packingList || []).length})**\n`;
            (trip.packingList || []).slice().sort((a,b)=>(a?.category||'zzz').localeCompare(b?.category||'zzz') || (a?.name||'').localeCompare(b?.name||'')).forEach(p => {
                content += `- [${p.packed?'X':' '}] ${p.name}${p.quantity>1?' (x'+p.quantity+')':''} [${p.category||'Altro'}]\n`;
            });
             if((trip.packingList || []).length === 0) content += "Packing list vuota.\n";

        } catch (genError) {
            console.error("Errore durante la generazione del contenuto TXT:", genError);
            showToast("Errore nella preparazione del file di testo.", "error");
            return;
        }

        try {
            // Crea Blob e link per il download
            const blob = new Blob([content], {type:'text/plain;charset=utf-8'});
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Viaggio-${(trip.name||'SenzaNome').replace(/[^a-z0-9]/gi,'_')}.txt`; // Nome file pulito
            document.body.appendChild(a); // Aggiungi link al DOM
            a.click(); // Simula click per avviare download
            document.body.removeChild(a); // Rimuovi link
            URL.revokeObjectURL(url); // Rilascia risorsa
        } catch (downloadError) {
            console.error("Errore durante il download del file TXT:", downloadError);
            showToast("Errore durante il download del file.", "error");
        }
    };
    const handleDownloadExcel = () => {
        if (!currentTripId) { showToast("Seleziona un viaggio.", "error"); return; }
        const trip = findTripById(currentTripId);
        if (!trip) { showToast("Viaggio non trovato.", "error"); return; }
        // Verifica se la libreria SheetJS è caricata
        if (typeof XLSX === 'undefined') {
            console.error("Libreria SheetJS (XLSX) non trovata.");
            showToast("Errore: libreria per Excel non caricata.", "error");
            return;
        }

        let wb; // Workbook
        try {
            wb = XLSX.utils.book_new(); // Crea nuovo workbook

            // --- Foglio Riepilogo ---
            const cf = '#,##0.00 €'; // Formato valuta
            const nf = '#,##0'; // Formato numero intero
            const summary = [
                ["Voce","Dettaglio"], // Header
                ["Viaggio", trip.name||'S.N.'],
                ["Origine", trip.originCity||'N/D'],
                ["Dest.", trip.destination||'N/D'],
                ["Periodo", `${formatDate(trip.startDate)} - ${formatDate(trip.endDate)}`],
                ["Note", trip.notes||'-'],
                ["Extra Info", trip.extraInfo||'-'],
                [], // Riga vuota
                ["Budget Stimato",{t:'n',v:trip.budget?.estimatedTotal||0,z:cf}], // Valuta
                ["Budget Effettivo",{t:'n',v:trip.budget?.actualTotal||0,z:cf}],
                ["Differenza",{t:'n',v:(trip.budget?.actualTotal||0)-(trip.budget?.estimatedTotal||0),z:cf}],
                [], // Riga vuota
                ["# Partecipanti", (trip.participants||[]).length],
                ["# Promemoria", (trip.reminders||[]).length],
                ["# Trasporti", (trip.transportations||[]).length],
                ["# Alloggi", (trip.accommodations||[]).length],
                ["# Itinerario", (trip.itinerary||[]).length],
                ["# Voci Budget", (trip.budget?.items||[]).length],
                ["# Oggetti Packing", (trip.packingList||[]).length]
            ];
            const wsSum = XLSX.utils.aoa_to_sheet(summary);
            wsSum['!cols']=[{wch:15},{wch:50}]; // Larghezza colonne
            XLSX.utils.book_append_sheet(wb, wsSum, "Riepilogo");

            // --- Foglio Partecipanti ---
            const partH = ["Nome", "Note", "Extra Info"];
            const partD = (trip.participants||[]).slice().sort((a,b)=>(a?.name||'').localeCompare(b?.name||'')).map(p=>[p.name, p.notes, p.extraInfo]);
            const wsPart = XLSX.utils.aoa_to_sheet([partH, ...partD]);
            wsPart['!cols']=[{wch:30},{wch:40},{wch:40}];
            XLSX.utils.book_append_sheet(wb, wsPart, "Partecipanti");

             // --- Foglio Promemoria ---
            const remH = ["Stato", "Descrizione", "Scadenza"];
            const remD = (trip.reminders||[]).slice().sort((a,b)=>(a?.dueDate || '9999').localeCompare(b?.dueDate || '9999')).map(r => [r.status === 'done' ? 'Fatto' : 'Da Fare', r.description, formatDate(r.dueDate)]);
            const wsRem = XLSX.utils.aoa_to_sheet([remH, ...remD]);
            wsRem['!cols'] = [{wch:10}, {wch:50}, {wch:12}];
            XLSX.utils.book_append_sheet(wb, wsRem, "Promemoria");

            // --- Foglio Trasporti ---
            const th = ["Tipo","Descrizione","Da Luogo","Da Data/Ora","A Luogo","A Data/Ora","Rif. Pren.","Costo","Note","Link/File"];
            const td = (trip.transportations||[]).slice().sort((a,b)=>(a?.departureDateTime||'').localeCompare(b?.departureDateTime||'')).map(t=>[
                t.type, t.description, t.departureLoc, formatDateTime(t.departureDateTime),
                t.arrivalLoc, formatDateTime(t.arrivalDateTime), t.bookingRef,
                t.cost===null?null:{t:'n',v:t.cost,z:cf}, // Formato valuta
                t.notes, t.link
            ]);
            const wsT = XLSX.utils.aoa_to_sheet([th, ...td]);
            wsT['!cols']=[{wch:12},{wch:25},{wch:18},{wch:16},{wch:18},{wch:16},{wch:15},{wch:12},{wch:25},{wch:30}];
            XLSX.utils.book_append_sheet(wb, wsT, "Trasporti");

            // --- Foglio Alloggi ---
            const ah = ["Nome","Tipo","Indirizzo","Check-In","Check-Out","Rif. Pren./Contatto","Costo Tot.","Note","Link/File"];
            const ad = (trip.accommodations||[]).slice().sort((a,b)=>(a?.checkinDateTime||'').localeCompare(b?.checkinDateTime||'')).map(a=>[
                 a.name,a.type,a.address,formatDateTime(a.checkinDateTime),formatDateTime(a.checkoutDateTime),
                 a.bookingRef, a.cost===null?null:{t:'n',v:a.cost,z:cf}, // Formato valuta
                 a.notes, a.link
            ]);
            const wsA = XLSX.utils.aoa_to_sheet([ah,...ad]);
            wsA['!cols']=[{wch:25},{wch:10},{wch:35},{wch:16},{wch:16},{wch:20},{wch:12},{wch:30},{wch:30}];
            XLSX.utils.book_append_sheet(wb, wsA, "Alloggi");

            // --- Foglio Itinerario ---
            const ih = ["Giorno","Ora","Attività","Luogo","Rif. Pren.","Costo","Note","Link/File"];
            const idata = (trip.itinerary||[]).slice().sort((a,b)=>{const d=(a?.day||'').localeCompare(b?.day||''); return d!==0?d:(a?.time||'').localeCompare(b?.time||'');}).map(i=>[
                formatDate(i.day), i.time, i.activity, i.location, i.bookingRef,
                i.cost===null?null:{t:'n',v:i.cost,z:cf}, // Formato valuta
                i.notes, i.link
            ]);
            const wsI = XLSX.utils.aoa_to_sheet([ih, ...idata]);
            wsI['!cols']=[{wch:10},{wch:8},{wch:30},{wch:25},{wch:20},{wch:12},{wch:30},{wch:30}];
            XLSX.utils.book_append_sheet(wb, wsI, "Itinerario");

             // --- Foglio Budget ---
            const bh = ["Categoria","Descrizione","Costo Stimato (€)","Costo Effettivo (€)", "Pagato Da", "Diviso Tra"];
            const bd = (trip.budget?.items||[]).slice().sort((a,b)=>(a?.category||'').localeCompare(b?.category||'')).map(b=>[
                b.category, b.description,
                {t:'n',v:b.estimated||0,z:cf}, // Stimato (valuta)
                b.actual===null?null:{t:'n',v:b.actual,z:cf}, // Effettivo (valuta), null se non presente
                b.paidBy, b.splitBetween
            ]);
            // Aggiungi riga totali
            bd.push([],["TOTALI","", {t:'n',v:trip.budget?.estimatedTotal||0,z:cf}, {t:'n',v:trip.budget?.actualTotal||0,z:cf}, "", ""]);
            const wsB = XLSX.utils.aoa_to_sheet([bh, ...bd]);
            wsB['!cols']=[{wch:15},{wch:35},{wch:18},{wch:18},{wch:20},{wch:20}];
            XLSX.utils.book_append_sheet(wb, wsB, "Budget");

            // --- Foglio Packing List ---
            const ph = ["Categoria", "Oggetto", "Qtà", "Fatto?"];
            const pd = (trip.packingList||[]).slice().sort((a,b)=>(a?.category||'zzz').localeCompare(b?.category||'zzz') || (a?.name||'').localeCompare(b?.name||'')).map(p=>[
                p.category, p.name,
                {t:'n', v:p.quantity, z:nf}, // Quantità (numero)
                p.packed?'Sì':'No' // Stato
            ]);
            const wsP = XLSX.utils.aoa_to_sheet([ph, ...pd]);
            wsP['!cols']=[{wch:20}, {wch:40},{wch:5},{wch:8}];
            XLSX.utils.book_append_sheet(wb, wsP, "Packing List");

        } catch (buildError) {
            console.error("Errore durante la costruzione del workbook Excel:", buildError);
            showToast("Errore nella preparazione del file Excel.", "error");
            return;
        }

        try {
             // Genera nome file e avvia download
            const filename = `Viaggio-${(trip.name||'SenzaNome').replace(/[^a-z0-9]/gi,'_')}.xlsx`;
            XLSX.writeFile(wb, filename);
        } catch (writeError) {
            console.error("Errore durante il salvataggio del file Excel:", writeError);
            showToast("Errore durante il download del file Excel.", "error");
        }
    };

    // ==========================================================================
    // == FUNZIONI CONDIVISIONE VIA FIREBASE (Link) ==
    // ==========================================================================
    const handleShareViaLink = async () => {
        if (!db) { showToast("Condivisione non disponibile (DB non inizializzato).", "error"); return; }
        if (!currentTripId || !currentUserId) { showToast("Seleziona un viaggio e accedi per condividerlo.", "warning"); return; }
        if (currentUser && currentUser.isAnonymous) { showToast("Devi registrarti o accedere per poter condividere un viaggio.", "warning"); return; }

        const originalTrip = findTripById(currentTripId);
        if (!originalTrip) { showToast("Viaggio non trovato.", "error"); return; }

        const shareButtonElement = shareTripBtn; // Riferimento al bottone
        if (shareButtonElement) {
            shareButtonElement.disabled = true; // Disabilita durante processo
            shareButtonElement.innerHTML = '<i class="fas fa-spinner fa-spin fa-fw"></i> Preparando...';
        }

        let dataToSend = null;
        let shareLink = null;
        try {
            // 1. Pulisci e prepara i dati per la condivisione (rimuovi ID, converti date)
            // Crea una copia pulita senza riferimenti all'originale
            const cleanTripBase = JSON.parse(JSON.stringify(originalTrip));
            // Prepara dati specifici per la collezione 'sharedTrips'
            dataToSend = {
                name: cleanTripBase.name || 'S.N.',
                originCity: cleanTripBase.originCity || null,
                destination: cleanTripBase.destination || null,
                notes: cleanTripBase.notes || null,
                extraInfo: cleanTripBase.extraInfo || null,
                startDate: toTimestampOrNull(cleanTripBase.startDate), // Converte in Timestamp
                endDate: toTimestampOrNull(cleanTripBase.endDate),
                // Mappa gli array interni, convertendo le date e selezionando i campi necessari
                participants: (cleanTripBase.participants || []).map(p => ({ name: p.name || '?', notes: p.notes || null, extraInfo: p.extraInfo || null })),
                reminders: (cleanTripBase.reminders || []).map(r => ({ description: r.description || '?', dueDate: toTimestampOrNull(r.dueDate), status: r.status || 'todo' })),
                transportations: (cleanTripBase.transportations || []).map(t => ({ type: t.type || 'Altro', description: t.description || '?', departureLoc: t.departureLoc || null, departureDateTime: toTimestampOrNull(t.departureDateTime), arrivalLoc: t.arrivalLoc || null, arrivalDateTime: toTimestampOrNull(t.arrivalDateTime), bookingRef: t.bookingRef || null, cost: safeToNumberOrNull(t.cost), notes: t.notes || null, link: t.link || null })),
                accommodations: (cleanTripBase.accommodations || []).map(a => ({ name: a.name || '?', type: a.type || 'Altro', address: a.address || null, checkinDateTime: toTimestampOrNull(a.checkinDateTime), checkoutDateTime: toTimestampOrNull(a.checkoutDateTime), bookingRef: a.bookingRef || null, cost: safeToNumberOrNull(a.cost), notes: a.notes || null, link: a.link || null })),
                itinerary: (cleanTripBase.itinerary || []).map(i => ({ day: i.day || null, time: i.time || null, activity: i.activity || '?', location: i.location || null, bookingRef: i.bookingRef || null, cost: safeToNumberOrNull(i.cost), notes: i.notes || null, link: i.link || null })), // Qui date/ore potrebbero già essere stringhe corrette
                budget: { items: (cleanTripBase.budget?.items || []).map(b => ({ category: b.category || 'Altro', description: b.description || '?', estimated: safeToNumberOrNull(b.estimated), actual: safeToNumberOrNull(b.actual), paidBy: b.paidBy || null, splitBetween: b.splitBetween || null })) }, // Non servono totali qui
                packingList: (cleanTripBase.packingList || []).map(p => ({ name: p.name || '?', category: p.category || 'Altro', quantity: safeToPositiveIntegerOrDefault(p.quantity), packed: p.packed || false })), // Mantiene stato packed
                sharedAt: Timestamp.now() // Data condivisione
                // NON includere createdAt, updatedAt, userId originale
            };

            if (shareButtonElement) shareButtonElement.innerHTML = '<i class="fas fa-spinner fa-spin fa-fw"></i> Salvando...';

            // 2. Salva i dati puliti nella collezione 'sharedTrips' di Firestore
            const docRef = await addDoc(collection(db, "sharedTrips"), dataToSend);
            // 3. Genera il link di condivisione usando l'ID del nuovo documento
            shareLink = `${window.location.origin}${window.location.pathname}?shareId=${docRef.id}`;
            console.log("Viaggio condiviso con ID:", docRef.id, "Link:", shareLink);

            // 4. Usa l'API Web Share se disponibile, altrimenti mostra prompt
            if (navigator.share) {
                const shareData = {
                    title: `Viaggio Condiviso: ${originalTrip.name || 'S.N.'}`,
                    text: `Ecco i dettagli per il viaggio "${originalTrip.name || 'S.N.'}". Apri il link per vederli e importarli nella tua app!\nDest: ${originalTrip.destination || 'N/D'}, Date: ${formatDate(originalTrip.startDate)} - ${formatDate(originalTrip.endDate)}`,
                    url: shareLink,
                };
                if (shareButtonElement) shareButtonElement.innerHTML = '<i class="fas fa-spinner fa-spin fa-fw"></i> Apro condivisione...';
                await navigator.share(shareData);
                showToast("Pannello di condivisione del browser aperto.", "success");
            } else {
                // Fallback per browser senza Web Share API
                prompt("Copia questo link per condividere il viaggio:", shareLink);
                showToast("Link di condivisione generato e pronto per essere copiato!", "success");
            }
        } catch (error) {
            // Gestione errori specifici (es. utente annulla condivisione)
            if (error.name === 'AbortError') {
                showToast("Condivisione annullata dall'utente.", "info");
            } else {
                console.error('Errore durante la condivisione:', error);
                showToast("Si è verificato un errore durante la condivisione.", "error");
                // Mostra comunque il link se generato, in caso di errore API Share
                if (shareLink) {
                    prompt("Errore apertura condivisione. Copia manualmente il link:", shareLink);
                }
            }
        } finally {
            // Riabilita il bottone in ogni caso
            if (shareButtonElement) {
                shareButtonElement.disabled = false;
                shareButtonElement.innerHTML = '<i class="fas fa-share-alt fa-fw"></i> Condividi';
            }
        }
    };
    // Clona i dati di un viaggio condiviso, rigenerando gli ID interni
    const cloneAndRegenerateTripIds = (tripDataFromFirebaseShared) => {
        // Funzione ricorsiva per convertire Timestamp in stringhe ISO
        const convertTimestampsToStringsImport = (data) => {
            if (data === null || typeof data !== 'object') return data;
            if (data instanceof Timestamp) {
                try { return data.toDate().toISOString(); } // Converte Timestamp
                catch (e) { return null; } // Gestisce errore conversione
            }
            if (Array.isArray(data)) {
                return data.map(item => convertTimestampsToStringsImport(item)); // Ricorsione su array
            }
            // Ricorsione su oggetti
            const newData = {};
            for (const key in data) {
                if (Object.prototype.hasOwnProperty.call(data, key)) {
                    newData[key] = convertTimestampsToStringsImport(data[key]);
                }
            }
            return newData;
        };

        // Converti tutti i Timestamp in stringhe ISO
        const tripDataWithStrings = convertTimestampsToStringsImport(tripDataFromFirebaseShared);
        // Crea copia profonda dei dati con stringhe
        const newTrip = JSON.parse(JSON.stringify(tripDataWithStrings));

        // Rimuovi/resetta campi specifici della condivisione o non necessari
        delete newTrip.id; // Non serve l'ID della collezione sharedTrips
        delete newTrip.sharedAt;
        newTrip.isTemplate = false; // Non è un template
        newTrip.createdAt = null; // Verrà impostato al salvataggio
        newTrip.updatedAt = null;

        // Funzione per rigenerare ID negli array di sotto-items
        const regenerateSubItemsIds = (items) => {
            if (!Array.isArray(items)) return [];
            return items.map(item => {
                const prefix = item?.id?.split('_')[0] || 'item'; // Prova a mantenere il prefisso originale
                return { ...item, id: generateId(prefix) }; // Assegna nuovo ID
            });
        };

        // Rigenera ID per tutti gli array di sotto-items
        newTrip.participants = regenerateSubItemsIds(newTrip.participants);
        newTrip.reminders = regenerateSubItemsIds(newTrip.reminders);
        newTrip.transportations = regenerateSubItemsIds(newTrip.transportations);
        newTrip.accommodations = regenerateSubItemsIds(newTrip.accommodations);
        newTrip.itinerary = regenerateSubItemsIds(newTrip.itinerary);
        newTrip.budget = newTrip.budget || { items: [], estimatedTotal: 0, actualTotal: 0 };
        newTrip.budget.items = regenerateSubItemsIds(newTrip.budget.items);
        newTrip.packingList = regenerateSubItemsIds(newTrip.packingList);

        // Ricalcola totali budget per sicurezza (anche se non presenti nel dato condiviso)
        let calcEst = 0, calcAct = 0;
        (newTrip.budget.items || []).forEach(item => {
            const est = safeToNumberOrNull(item.estimated);
            const act = safeToNumberOrNull(item.actual);
            if (est !== null) calcEst += est;
            if (act !== null) calcAct += act;
        });
        newTrip.budget.estimatedTotal = calcEst;
        newTrip.budget.actualTotal = calcAct;

        return newTrip; // Ritorna l'oggetto viaggio pronto per essere salvato dall'utente
    }
    // Gestisce l'importazione di un viaggio condiviso
    const handleImportSharedTrip = async (sharedTripData) => {
        if (!sharedTripData || !currentUserId) {
            showToast("Errore durante l'importazione: utente non loggato o dati mancanti.", "error");
            return;
        }
        try {
            // 1. Clona i dati e rigenera gli ID interni
            const newTripObjectForUser = cloneAndRegenerateTripIds(sharedTripData);
            // 2. Imposta il timestamp di creazione per il nuovo viaggio
            newTripObjectForUser.createdAt = Timestamp.now();
            // 3. Salva il nuovo viaggio nel database dell'utente corrente
            const newTripId = await saveTripToFirestore(newTripObjectForUser);

            if (newTripId) {
                // 4. Se salvataggio OK, aggiorna lo stato locale e la UI
                const savedTrip = processTripDataFromFirestore(newTripId, prepareTripDataForFirestore({...newTripObjectForUser, id: newTripId}));
                trips.unshift(savedTrip); // Aggiungi all'inizio lista
                renderTripList();         // Aggiorna sidebar
                selectTrip(newTripId);    // Seleziona il viaggio importato
                showToast(`Viaggio "${newTripObjectForUser.name || 'S.N.'}" importato con successo!`, "success");
            }
             // Se fallisce, saveTripToFirestore mostra già toast
        } catch (error) {
            console.error("Errore durante l'importazione del viaggio condiviso:", error);
            showToast("Si è verificato un errore durante l'importazione del viaggio.", "error");
        }
    };
    // Controlla se l'URL contiene un ID di viaggio condiviso all'avvio o dopo login
    const checkForSharedTrip = async () => {
        if (!db) { return; } // Esce se DB non disponibile
        const urlParams = new URLSearchParams(window.location.search);
        const shareId = urlParams.get('shareId'); // Legge parametro shareId dall'URL

        if (shareId) {
            console.log("Trovato shareId nell'URL:", shareId);
            // Rimuovi il parametro dall'URL per non riprocessarlo al refresh
            const currentUrl = new URL(window.location.href);
            currentUrl.searchParams.delete('shareId');
            history.replaceState(null, '', currentUrl.toString()); // Aggiorna URL senza ricaricare

            if (!currentUserId) {
                // Se utente non loggato, mostra messaggio e salva ID per dopo
                showToast("Accedi o registrati per poter importare il viaggio condiviso.", "warning");
                try {
                    // Salva in sessionStorage (si cancella alla chiusura del browser)
                    sessionStorage.setItem('pendingShareId', shareId);
                } catch(e) { console.warn("Impossibile salvare pendingShareId in sessionStorage", e); }
                return; // Interrompe esecuzione qui
            }

            // Se utente loggato, prova a recuperare e importare
            showToast("Recupero dati viaggio condiviso...", "info");
            try {
                const docRef = doc(db, "sharedTrips", shareId); // Riferimento al documento condiviso
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    // Se documento trovato, chiedi conferma importazione
                    const sharedTripData = docSnap.data();
                    showConfirmationModal(
                        'Importa Viaggio Condiviso',
                        `Vuoi importare il viaggio "${sharedTripData.name || 'Senza Nome'}" nel tuo account?`,
                        () => handleImportSharedTrip(sharedTripData) // Callback per importare
                    );
                } else {
                    // Se documento non trovato
                    showToast("Link di condivisione non valido o viaggio non più disponibile.", "error");
                }
            } catch (error) {
                console.error("Errore recupero viaggio condiviso:", error);
                showToast("Errore durante il recupero del viaggio condiviso.", "error");
            }
        } else {
            // Se non c'è shareId nell'URL, controlla se ce n'è uno in attesa da sessionStorage
            if (currentUserId) { // Solo se utente è loggato
                try {
                    const pendingId = sessionStorage.getItem('pendingShareId');
                    if (pendingId) {
                        sessionStorage.removeItem('pendingShareId'); // Rimuovi ID da sessionStorage
                        // Simula di nuovo la presenza del parametro nell'URL e richiama la funzione
                        const fakeUrl = new URL(window.location.href);
                        fakeUrl.searchParams.set('shareId', pendingId);
                        window.history.pushState({}, '', fakeUrl); // Cambia URL (non visibile all'utente)
                        await checkForSharedTrip(); // Richiama la funzione per processarlo
                    }
                } catch(e) { console.warn("Errore accesso a sessionStorage per pendingShareId", e); }
            }
        }
    };

    // ==========================================================================
    // == FUNZIONI CALCOLO BILANCIO SPESE ==
    // ==========================================================================
    const calculateExpenseBalance = () => {
        if (!currentTripId) return { error: "Nessun viaggio selezionato." };
        const trip = findTripById(currentTripId);
        if (!trip) return { error: "Viaggio non trovato." };

        // Verifica requisiti minimi
        if (!Array.isArray(trip.participants) || trip.participants.length === 0) {
            return { error: "Aggiungi almeno un partecipante per calcolare il bilancio." };
        }
        if (!trip.budget || !Array.isArray(trip.budget.items) || trip.budget.items.length === 0) {
             // Se non ci sono spese, il bilancio è 0 per tutti
            const zeroBalances = {};
            trip.participants.forEach(p => zeroBalances[p.name.trim()] = 0);
            return { balances: zeroBalances, totalSharedExpense: 0, errors: [] };
        }

        const participantNames = trip.participants.map(p => p.name.trim());
        const balances = {}; // Oggetto per tenere traccia di quanto ognuno deve dare/ricevere
        participantNames.forEach(name => balances[name] = 0); // Inizializza a 0

        let totalSharedExpense = 0; // Totale delle spese divise
        const calculationErrors = []; // Array per messaggi di errore

        // Itera su ogni voce di spesa nel budget
        trip.budget.items.forEach((item, index) => {
            const actualCost = safeToNumberOrNull(item.actual); // Costo effettivo

            // Ignora la spesa se: non ha costo effettivo, non è > 0, manca chi paga o come dividere
            if (actualCost === null || actualCost <= 0 || !item.splitBetween || !item.paidBy) {
                return; // Passa alla prossima spesa
            }

            const payerName = item.paidBy.trim(); // Chi ha pagato
            const splitRule = item.splitBetween.trim(); // Come dividere (es. "Tutti", "Mario, Anna")

            // Verifica che chi ha pagato sia un partecipante valido
            if (!participantNames.includes(payerName)) {
                calculationErrors.push(`Riga budget ${index + 1}: Pagante "${payerName}" non trovato tra i partecipanti.`);
                return; // Ignora questa spesa
            }

            let sharers = []; // Array dei nomi tra cui dividere la spesa
            if (splitRule.toLowerCase() === 'tutti') {
                sharers = [...participantNames]; // Tutti i partecipanti
            } else {
                // Se specificati nomi, valida ciascun nome
                const potentialSharers = splitRule.split(',').map(name => name.trim()).filter(name => name); // Nomi separati da virgola
                const invalidSharers = potentialSharers.filter(name => !participantNames.includes(name)); // Nomi non validi

                if (invalidSharers.length > 0) {
                    calculationErrors.push(`Riga budget ${index + 1}: Partecipanti per divisione non validi: ${invalidSharers.join(', ')}.`);
                    // Continua solo con i partecipanti validi trovati
                    sharers = potentialSharers.filter(name => participantNames.includes(name));
                } else {
                    sharers = potentialSharers; // Tutti validi
                }
            }

            // Se non ci sono partecipanti validi per la divisione, ignora la spesa
            if (sharers.length === 0) {
                // Aggiungi errore solo se non già presente per questa riga
                if (!calculationErrors.some(err => err.startsWith(`Riga budget ${index + 1}`))) {
                    calculationErrors.push(`Riga budget ${index + 1}: Nessun partecipante valido trovato per la divisione.`);
                }
                return; // Ignora questa spesa
            }

            // Calcola costo per partecipante
            const costPerSharer = actualCost / sharers.length;
            totalSharedExpense += actualCost; // Aggiungi al totale spese divise

            // Aggiorna i saldi:
            balances[payerName] += actualCost; // Chi ha pagato "riceve" l'intera somma (il suo saldo aumenta)
            sharers.forEach(sharerName => {
                balances[sharerName] -= costPerSharer; // Ogni partecipante coinvolto "dà" la sua quota (il suo saldo diminuisce)
            });
        });

        // Arrotonda i saldi finali a 2 decimali per evitare errori floating point
        for (const name in balances) {
            balances[name] = Math.round(balances[name] * 100) / 100;
        }

        // Ritorna risultati
        return { balances, totalSharedExpense, errors: calculationErrors };
    };
    // Mostra i risultati del calcolo bilancio nella UI
    const renderBalanceResults = (result) => {
        if (!balanceResultsContainer || !balanceResultsUl || !balanceSummaryDiv || !balanceErrorMessageP) return;

        // Pulisci risultati precedenti
        balanceResultsUl.innerHTML = '';
        balanceSummaryDiv.innerHTML = '';
        balanceErrorMessageP.textContent = '';
        balanceErrorMessageP.style.display = 'none';
        balanceResultsContainer.style.display = 'block'; // Mostra contenitore

        // Se c'è un errore bloccante (es. no partecipanti)
        if (result.error) {
            balanceErrorMessageP.textContent = `Errore: ${result.error}`;
            balanceErrorMessageP.style.display = 'block';
            balanceResultsContainer.style.display = 'none'; // Nascondi il resto
            return;
        }

        const { balances, totalSharedExpense, errors } = result;
        let hasBalancesToShow = false; // Flag per sapere se c'è qualcosa da regolare

        // Mostra saldo per ogni partecipante (solo se non è ~0)
        Object.entries(balances).forEach(([name, balance]) => {
            if(Math.abs(balance) > 0.005) { // Tolleranza per errori arrotondamento
                hasBalancesToShow = true;
                const li = document.createElement('li');
                const nameSpan = document.createElement('span');
                const balanceSpan = document.createElement('span');
                nameSpan.textContent = name;
                balanceSpan.textContent = formatCurrency(Math.abs(balance)); // Mostra importo assoluto

                // Indica se deve dare o ricevere
                if (balance > 0) { // Saldo positivo = deve ricevere
                    li.classList.add('positive-balance');
                    nameSpan.textContent += " (Deve Ricevere)";
                } else { // Saldo negativo = deve dare
                    li.classList.add('negative-balance');
                    nameSpan.textContent += " (Deve Dare)";
                }
                li.appendChild(nameSpan);
                li.appendChild(balanceSpan);
                balanceResultsUl.appendChild(li);
            }
        });

        // Messaggio se tutti i saldi sono 0
        if (!hasBalancesToShow && errors.length === 0) {
            const li = document.createElement('li');
            li.textContent = "Tutti i conti sono a posto! Nessun saldo da regolare.";
            balanceResultsUl.appendChild(li);
        } else if (!hasBalancesToShow && errors.length > 0) {
             const li = document.createElement('li');
            li.textContent = "Nessun saldo da regolare (ma ci sono stati errori nel calcolo, vedi sotto).";
            balanceResultsUl.appendChild(li);
        }

        // Mostra totale spese divise
        balanceSummaryDiv.textContent = `Spesa Totale Condivisa Calcolata: ${formatCurrency(totalSharedExpense)}`;

        // Mostra eventuali errori di calcolo non bloccanti
        if (errors.length > 0) {
            balanceErrorMessageP.innerHTML = `<strong>Attenzione, possibili errori nel calcolo:</strong><br>` + errors.join('<br>');
            balanceErrorMessageP.style.display = 'block';
        }
    };

     // ==========================================================================
     // == FUNZIONI DI AUTENTICAZIONE ==
     // ==========================================================================
     const showAuthSuccess = (message) => {
         if (authSuccessDiv) {
            authSuccessDiv.textContent = message;
            authSuccessDiv.style.display = message ? 'block' : 'none';
            if(message && authErrorDiv) authErrorDiv.style.display = 'none'; // Nasconde errore se c'è successo
         }
     };
     const showAuthError = (message) => {
         if (authErrorDiv) {
            authErrorDiv.textContent = message;
            authErrorDiv.style.display = message ? 'block' : 'none';
            if(message && authSuccessDiv) authSuccessDiv.style.display = 'none'; // Nasconde successo se c'è errore
         }
     };
     const handleSignUp = async (e) => {
        e.preventDefault();
        const emailInput = signupForm?.querySelector('#signup-email');
        const passwordInput = signupForm?.querySelector('#signup-password');
        const confirmInput = signupForm?.querySelector('#signup-password-confirm');
        // Verifica esistenza elementi prima di accedere a .value
        if (!emailInput || !passwordInput || !confirmInput) {
             showAuthError("Errore interno del form di registrazione."); return;
        }
        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();
        const confirm = confirmInput.value.trim();

        // Validazione input
        if (!email || !password || !confirm) { showAuthError("Compila tutti i campi per la registrazione."); return; }
        if (password.length < 6) { showAuthError("La password deve essere di almeno 6 caratteri."); return; }
        if (password !== confirm) { showAuthError("Le password non coincidono."); return; }

        showAuthError(''); showAuthSuccess(''); // Pulisci messaggi precedenti
        signupForm.querySelectorAll('input, button').forEach(el => el.disabled = true); // Disabilita form

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            // Invia email di verifica dopo la registrazione
            await sendEmailVerification(userCredential.user);
            showAuthSuccess("Registrazione completata! Controlla la tua email (anche spam) per il link di verifica necessario per accedere.");
            showToast(`Benvenuto ${userCredential.user.email}! Email di verifica inviata.`, 'success');
            // Potresti voler nascondere il form di signup qui o reindirizzare
            signupForm.style.display = 'none';
            signupPromptP.style.display = 'block'; // Mostra di nuovo il link "Registrati"

        } catch (error) {
            showAuthError(getFirebaseErrorMessage(error)); // Mostra errore specifico
        } finally {
            signupForm.querySelectorAll('input, button').forEach(el => el.disabled = false); // Riabilita form
        }
     };
     const handleSignIn = async (e) => {
        e.preventDefault();
        const emailInput = loginForm?.querySelector('#login-email');
        const passwordInput = loginForm?.querySelector('#login-password');
        if (!emailInput || !passwordInput) {
             showAuthError("Errore interno del form di accesso."); return;
        }
        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();

        if (!email || !password) { showAuthError("Inserisci email e password."); return; }

        showAuthError(''); showAuthSuccess('');
        loginForm.querySelectorAll('input, button').forEach(el => el.disabled = true);

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            // Non serve mostrare toast qui, onAuthStateChanged lo gestirà
             // showToast(`Bentornato ${userCredential.user.email}!`, 'success');
             // Se l'email non è verificata, potresti voler mostrare un messaggio qui
             // o lasciare che venga gestito da onAuthStateChanged
             if (!userCredential.user.emailVerified) {
                showAuthError("Accesso riuscito, ma l'email non è verificata. Controlla la tua posta (anche spam) per il link o richiedine uno nuovo dall'app.");
             }
        } catch (error) {
            showAuthError(getFirebaseErrorMessage(error));
        } finally {
            loginForm.querySelectorAll('input, button').forEach(el => el.disabled = false);
        }
     };
     const handleSignOut = async () => {
        try {
            await signOut(auth);
            showToast("Logout effettuato con successo.", 'info');
            // Non serve altro, onAuthStateChanged gestirà il cambio UI
        } catch (error) {
            console.error("Errore durante il logout:", error);
            showToast("Errore durante il logout.", "error");
        }
     };
     const handlePasswordResetRequest = async (e) => {
        e.preventDefault();
        if (!passwordResetForm) return;
        const emailInput = passwordResetForm.querySelector('#reset-email');
        if (!emailInput) { showAuthError("Errore interno del form reset password."); return; }
        const email = emailInput.value.trim();

        if (!email) { showAuthError("Inserisci l'indirizzo email per il reset."); return; }

        showAuthError(''); showAuthSuccess(''); // Pulisci messaggi
        passwordResetForm.querySelectorAll('input, button').forEach(el => el.disabled = true);

        try {
            await sendPasswordResetEmail(auth, email);
            // Messaggio generico per non rivelare se l'email esiste
            showAuthSuccess(`Se esiste un account associato a ${email}, è stata inviata un'email con le istruzioni per reimpostare la password.`);
            passwordResetForm.style.display = 'none'; // Nascondi form reset
            loginForm.style.display = 'block'; // Mostra form login
        } catch (error) {
            // Anche in caso di errore (es. email non trovata), mostra messaggio generico
            // per motivi di sicurezza (non rivelare email registrate).
             console.warn("Errore invio email reset (o email non trovata):", error.code);
             showAuthSuccess(`Se esiste un account associato a ${email}, riceverai un'email con le istruzioni.`);
             passwordResetForm.style.display = 'none';
             loginForm.style.display = 'block';
        } finally {
            passwordResetForm.querySelectorAll('input, button').forEach(el => el.disabled = false);
        }
     };
     const handleAnonymousSignIn = async () => {
        showAuthError(''); showAuthSuccess('');
        if(anonymousSigninBtn) anonymousSigninBtn.disabled = true;
        try {
            await signInAnonymously(auth);
            showToast("Accesso come ospite effettuato.", "info");
            // onAuthStateChanged gestirà il cambio UI
        } catch (error) {
            showAuthError(getFirebaseErrorMessage(error));
        } finally {
            if(anonymousSigninBtn) anonymousSigninBtn.disabled = false;
        }
     };
     const handleResendVerificationEmail = async () => {
        if (!auth.currentUser || auth.currentUser.isAnonymous) {
             showToast("Funzione disponibile solo per utenti registrati.", "warning"); return;
        }
        if (auth.currentUser.emailVerified) {
            showToast("Il tuo indirizzo email è già verificato.", "info");
            return;
        }

        // Disabilita bottoni per evitare spam
        if(resendVerificationBtn) resendVerificationBtn.disabled = true;
        if(resendVerificationBtnNotice) resendVerificationBtnNotice.disabled = true;

        try {
            await sendEmailVerification(auth.currentUser);
            showToast("Nuova email di verifica inviata. Controlla la tua casella di posta (anche spam).", "success");
        } catch (error) {
             console.error("Errore reinvio email verifica:", error);
            showToast("Errore durante il reinvio dell'email di verifica.", "error");
            showAuthError(getFirebaseErrorMessage(error)); // Mostra errore specifico se possibile
        } finally {
            // Riabilita bottoni dopo un timeout
            setTimeout(() => {
                if(resendVerificationBtn) resendVerificationBtn.disabled = false;
                if(resendVerificationBtnNotice) resendVerificationBtnNotice.disabled = false;
            }, 60000); // Riabilita dopo 1 minuto
        }
     };
     // Traduce codici errore Firebase in messaggi user-friendly
     const getFirebaseErrorMessage = (error) => {
        switch (error.code) {
            case 'auth/invalid-email': return 'Formato email non valido.';
            case 'auth/user-disabled': return 'Questo account utente è stato disabilitato.';
            case 'auth/user-not-found': return 'Nessun utente trovato con questa email.';
            case 'auth/wrong-password': return 'Password errata. Riprova.';
            case 'auth/email-already-in-use': return 'Questa email è già stata registrata. Prova ad accedere.';
            case 'auth/weak-password': return 'Password troppo debole. Deve essere di almeno 6 caratteri.';
            case 'auth/operation-not-allowed': return 'Operazione non permessa. Contatta supporto se il problema persiste.';
            case 'auth/network-request-failed': return 'Errore di rete. Controlla la tua connessione e riprova.';
            case 'auth/too-many-requests': return 'Troppi tentativi falliti. Riprova più tardi.';
            case 'auth/requires-recent-login': return 'Questa operazione richiede un accesso recente. Effettua nuovamente il login.';
            // Aggiungere altri codici errore comuni se necessario
            default:
                console.error("Errore Firebase non gestito:", error);
                return 'Si è verificato un errore imprevisto. Riprova.';
        }
     };

     // ===== Gestione Cambio Stato Autenticazione (Callback di onAuthStateChanged) =====
     const updateUIBasedOnAuthState = async (user) => {
        currentUser = user; // Aggiorna stato globale utente

        if (user) { // Utente Loggato (Registrato o Anonimo)
            currentUserId = user.uid; // Salva ID utente

            if(authContainer) authContainer.style.display = 'none'; // Nascondi auth
            if(appMainContainer) appMainContainer.style.display = 'flex'; // Mostra app

            // Distingui tra utente Anonimo e Registrato
            if (user.isAnonymous) {
                if(userEmailDisplay) userEmailDisplay.textContent = "Ospite";
                if(logoutBtn) logoutBtn.innerHTML = '<i class="fas fa-user-plus"></i> Registrati/Accedi'; // Cambia testo bottone
                if(resendVerificationBtn) resendVerificationBtn.style.display = 'none';
                if(emailVerificationNotice) emailVerificationNotice.style.display = 'none';
                if(anonymousUserPrompt) anonymousUserPrompt.style.display = 'block'; // Mostra prompt per anonimo
                if(linkAccountPrompt) linkAccountPrompt.onclick = (e) => { e.preventDefault(); handleSignOut(); }; // Link per fare logout
            } else { // Utente Registrato (Email/Password)
                if(userEmailDisplay) userEmailDisplay.textContent = user.email;
                if(logoutBtn) logoutBtn.innerHTML = '<i class="fas fa-sign-out-alt"></i> Logout'; // Bottone logout standard
                if(anonymousUserPrompt) anonymousUserPrompt.style.display = 'none'; // Nascondi prompt anonimo

                // Gestisci avviso email non verificata
                if (!user.emailVerified) {
                    if(emailVerificationNotice) emailVerificationNotice.style.display = 'flex';
                    if(resendVerificationBtn) resendVerificationBtn.style.display = 'inline-flex';
                } else {
                    if(emailVerificationNotice) emailVerificationNotice.style.display = 'none';
                    if(resendVerificationBtn) resendVerificationBtn.style.display = 'none';
                }
            }

            // Pulisci eventuali messaggi di errore/successo dell'autenticazione
            if(authErrorDiv) authErrorDiv.style.display = 'none';
            if(authSuccessDiv) authSuccessDiv.style.display = 'none';

            // Carica i viaggi dell'utente
            await loadUserTrips(user.uid);
            // Carica stato UI da localStorage (ultimo viaggio, ordinamenti)
            loadLocalStorageAppState();
            applyCurrentSortToControls(); // Applica ordinamenti letti

            // Se c'era un viaggio selezionato nello stato e esiste ancora, selezionalo
            if(currentTripId && findTripById(currentTripId)) {
                selectTrip(currentTripId);
            } else {
                deselectTrip(); // Altrimenti, non selezionare nulla
            }
            // Controlla se c'è un viaggio condiviso da importare
            await checkForSharedTrip();

        } else { // Utente NON Loggato
            currentUser = null;
            currentUserId = null;

            if(authContainer) authContainer.style.display = 'flex'; // Mostra auth
            if(appMainContainer) appMainContainer.style.display = 'none'; // Nascondi app
            if(userEmailDisplay) userEmailDisplay.textContent = ''; // Pulisci display email

            // Resetta UI autenticazione
            if(passwordResetForm) passwordResetForm.style.display = 'none';
            if(loginForm) loginForm.style.display = 'block'; // Mostra login di default
            if(signupForm) signupForm.style.display = 'none';
            if(signupPromptP) signupPromptP.style.display = 'block';

            clearAppDataUI(); // Pulisci completamente i dati e la UI dell'app
        }
     };
     // Pulisce la UI dell'applicazione (liste, form, totali, etc.)
     const clearAppDataUI = () => {
        console.log("DEBUG: Pulizia UI applicazione...");
        // Resetta stato locale
        trips = [];
        currentTripId = null;
        editingItemId = { participant: null, transport: null, accommodation: null, itinerary: null, budget: null, packing: null, reminder: null };
        currentSort = { transport: 'departureDateTime', itinerary: 'dateTime', budget: 'category', packing: 'name', reminder: 'dueDate' };
        currentSearchTerm = { trip: '', itinerary: '', packing: '' };

        // Pulisci elementi UI
        if (tripListUl) tripListUl.innerHTML = '';
        if (noTripsMessage) noTripsMessage.style.display = 'block'; // Mostra "nessun viaggio"
        if (tripDetailsAreaDiv) tripDetailsAreaDiv.style.display = 'none'; // Nascondi dettagli
        if (welcomeMessageDiv) welcomeMessageDiv.style.display = 'none'; // Nascondi benvenuto
        if(tripInfoForm) tripInfoForm.reset(); // Resetta form info
        document.querySelectorAll('.add-item-form').forEach(form => form.reset()); // Resetta tutti i form item
        Object.keys(editingItemId).forEach(resetEditState); // Assicura stato modifica resettato
        document.querySelectorAll('.item-list').forEach(ul => ul.innerHTML = ''); // Pulisci tutte le liste
        document.querySelectorAll('.item-list-container p[id^="no-"]').forEach(p => p.style.display = 'block'); // Mostra "nessun item"
        // Resetta totali budget
        if(budgetTotalEstimatedStrong) budgetTotalEstimatedStrong.textContent = formatCurrency(0);
        if(budgetTotalActualStrong) budgetTotalActualStrong.textContent = formatCurrency(0);
        if(budgetDifferenceStrong) budgetDifferenceStrong.textContent = formatCurrency(0);
        // Nascondi risultati bilancio
        if(balanceResultsContainer) balanceResultsContainer.style.display = 'none';
        // Disabilita bottoni azioni viaggio
        if(downloadTextBtn) downloadTextBtn.disabled = true;
        if(downloadExcelBtn) downloadExcelBtn.disabled = true;
        if(deleteTripBtn) deleteTripBtn.disabled = true;
        if(shareTripBtn) shareTripBtn.disabled = true;
        if(emailSummaryBtn) emailSummaryBtn.disabled = true;
        if(copySummaryBtn) copySummaryBtn.disabled = true;
        if(tripTitleH2) tripTitleH2.textContent = 'Dettagli Viaggio'; // Resetta titolo

         // Chiudi dropdown se aperto
         if(actionDropdownMenu) actionDropdownMenu.classList.remove('show');
         if(actionDropdownBtn) actionDropdownBtn.setAttribute('aria-expanded', 'false');

        console.log("DEBUG: Pulizia UI completata.");
     };

    // ==========================================================================
    // == GESTIONE STATO UI (LocalStorage) ==
    // ==========================================================================
    const APP_STATE_KEY = 'travelPlannerPro_UIState_v1';
    // Salva stato UI rilevante in localStorage
    const saveLocalStorageAppState = () => {
        try {
            const stateToSave = {
                userId: currentUserId, // Salva ID utente per validazione al caricamento
                // Salva ID viaggio selezionato solo se utente loggato
                selectedTripId: (currentUserId && currentTripId) ? currentTripId : null,
                currentSort: currentSort,
                currentSearchTerm: currentSearchTerm,
            };
            localStorage.setItem(APP_STATE_KEY, JSON.stringify(stateToSave));
        } catch (e) {
            console.warn("Errore salvataggio stato UI in localStorage:", e);
        }
    };
    // Carica stato UI da localStorage
    const loadLocalStorageAppState = () => {
        try {
            const savedState = localStorage.getItem(APP_STATE_KEY);
            if (savedState) {
                const state = JSON.parse(savedState);
                // Carica stato solo se corrisponde all'utente corrente
                if (currentUserId && state.userId === currentUserId && state.selectedTripId) {
                    // Verifica se il viaggio salvato esiste ancora
                    const tripExists = trips.some(t => t.id === state.selectedTripId);
                    if(tripExists){
                        currentTripId = state.selectedTripId; // Ripristina selezione
                    } else {
                        currentTripId = null; // Viaggio non più esistente
                    }
                } else {
                    currentTripId = null; // Utente diverso o nessun viaggio salvato
                }
                // Ripristina ordinamenti e ricerche
                if (state.currentSort) currentSort = state.currentSort;
                if (state.currentSearchTerm) currentSearchTerm = state.currentSearchTerm;
            } else {
                 // Nessuno stato salvato
                currentTripId = null;
            }
        } catch (e) {
            console.warn("Errore caricamento stato UI da localStorage:", e);
            currentTripId = null; // Resetta in caso di errore
        }
    };

    // ==========================================================================
    // == INIZIALIZZAZIONE E EVENT LISTENER PRINCIPALI ==
    // ==========================================================================
    // Funzione eseguita alla conferma nel modale generico
    const executeConfirmAction = () => {
        if (typeof confirmActionCallback === 'function') {
            try {
                confirmActionCallback(); // Esegui la callback salvata
            } catch(err) {
                console.error("Errore esecuzione callback di conferma:", err);
                showToast("Si è verificato un errore.", "error");
            }
        }
        closeConfirmationModal(); // Chiudi modale dopo esecuzione (o fallimento)
    };
    // Inizializza tutti gli event listener dell'applicazione (chiamata dopo login)
    const initAppEventListeners = () => {
        console.log("DEBUG: Inizializzazione Event Listeners Applicazione...");
        // --- Listener Sidebar ---
        if (newTripBtn) newTripBtn.onclick = handleNewTrip;
        if (createFromTemplateBtn) createFromTemplateBtn.onclick = openSelectTemplateModal;
        if (searchTripInput) searchTripInput.oninput = handleSearchTrip;

        // --- Listener Header Dettagli Viaggio ---
        if (tripInfoForm) tripInfoForm.onsubmit = handleSaveTripInfo; // Salva info generali
        if (deleteTripBtn) deleteTripBtn.onclick = () => { if (currentTripId) handleDeleteTrip(currentTripId); };

        // Listener per bottoni dentro il dropdown (delegati a funzioni specifiche)
        if (downloadTextBtn) downloadTextBtn.onclick = handleDownloadText;
        if (downloadExcelBtn) downloadExcelBtn.onclick = handleDownloadExcel;
        if (emailSummaryBtn) emailSummaryBtn.onclick = handleEmailSummary;
        if (copySummaryBtn) copySummaryBtn.onclick = handleCopySummary;
        if (shareTripBtn) shareTripBtn.onclick = handleShareViaLink;

        // === Gestione Dropdown Azioni Viaggio ===
        if (actionDropdownBtn && actionDropdownMenu) {
            actionDropdownBtn.addEventListener('click', (event) => {
                event.stopPropagation(); // Evita chiusura immediata da listener window
                actionDropdownMenu.classList.toggle('show');
                actionDropdownBtn.setAttribute('aria-expanded', actionDropdownMenu.classList.contains('show'));
            });
            // Chiudi menu se si clicca su un item (l'azione del bottone viene eseguita comunque)
            actionDropdownMenu.addEventListener('click', (event) => {
                if (event.target.closest('.dropdown-item:not(:disabled)')) { // Solo se item cliccabile
                     actionDropdownMenu.classList.remove('show');
                     actionDropdownBtn.setAttribute('aria-expanded', 'false');
                }
            });
            // Il listener su window per chiudere cliccando fuori è gestito globalmente
        }
        // =========================================

        // --- Listener Tabs ---
        if (tabsContainer) tabsContainer.onclick = (e) => {
            const tabLink = e.target.closest('.tab-link');
            if (tabLink?.dataset.tab) switchTab(tabLink.dataset.tab);
        };

        // --- Listener Form Aggiungi/Modifica Item ---
        const formsToListen = [
            { form: 'add-participant-form', type: 'participant' }, { form: 'add-reminder-item-form', type: 'reminder' },
            { form: 'add-transport-item-form', type: 'transport' }, { form: 'add-accommodation-item-form', type: 'accommodation' },
            { form: 'add-itinerary-item-form', type: 'itinerary' }, { form: 'add-budget-item-form', type: 'budget' },
            { form: 'add-packing-item-form', type: 'packing' },
        ];
        formsToListen.forEach(item => {
            const formElement = document.getElementById(item.form);
            if (formElement) {
                 // Usa onsubmit per catturare submit via Enter o bottone
                formElement.onsubmit = (e) => handleItemFormSubmit(e, item.type);
            }
        });

        // --- Listener Bottoni Annulla Modifica ---
        const cancelButtons = [
            { btn: 'participant-cancel-edit-btn', type: 'participant'}, { btn: 'reminder-cancel-edit-btn', type: 'reminder'},
            { btn: 'transport-cancel-edit-btn', type: 'transport'}, { btn: 'accommodation-cancel-edit-btn', type: 'accommodation'},
            { btn: 'itinerary-cancel-edit-btn', type: 'itinerary'}, { btn: 'budget-cancel-edit-btn', type: 'budget'},
            { btn: 'packing-cancel-edit-btn', type: 'packing'},
        ];
        cancelButtons.forEach(item => {
            const btnElement = document.getElementById(item.btn);
            if(btnElement) { btnElement.onclick = () => resetEditState(item.type); }
        });

        // --- Listener Delegato per Edit/Delete/Toggle nelle Liste ---
        if (tripDetailsAreaDiv) {
            tripDetailsAreaDiv.addEventListener('click', (e) => { // Usa addEventListener per coesistenza
                const editBtn = e.target.closest('.btn-icon.edit');
                const deleteBtn = e.target.closest('.btn-icon.delete');
                const packingCheckbox = e.target.closest('.packing-checkbox');

                if (editBtn) {
                    const itemId = editBtn.dataset.itemId;
                    if(!itemId) return;
                    // Estrai tipo lista dalla classe del bottone (es. participant-edit-btn)
                    const typeMatch = editBtn.className.match(/(\w+)-edit-btn/);
                    const type = typeMatch ? typeMatch[1] : null;
                    if(type) startEditItem(type, itemId);
                } else if (deleteBtn) {
                    const itemId = deleteBtn.dataset.itemId;
                    if(!itemId) return;
                     const typeMatch = deleteBtn.className.match(/(\w+)-delete-btn/);
                     const type = typeMatch ? typeMatch[1] : null;
                    if(type) handleDeleteItem(type, itemId);
                } else if (packingCheckbox) {
                    const itemId = packingCheckbox.dataset.itemId;
                    if(itemId) handleTogglePacked(itemId, packingCheckbox.checked);
                }
            });
        }

        // --- Listener Packing List Predefinite ---
        if (predefinedChecklistsContainer) {
            predefinedChecklistsContainer.addEventListener('click', (e) => { // Usa addEventListener
                const btn = e.target.closest('button[data-checklist]');
                if (btn?.dataset.checklist) handleImportPackingList(btn.dataset.checklist);
            });
        }

        // --- Listener Modali (Nuovo Viaggio, Conferma) ---
        if (newTripModal) {
            if(createTripConfirmBtn) createTripConfirmBtn.onclick = handleCreateTripConfirm;
            newTripModal.querySelectorAll('.modal-close').forEach(btn => btn.onclick = closeNewTripModal);
            if(newTripNameInput) newTripNameInput.onkeypress = (e) => { if(e.key === 'Enter') handleCreateTripConfirm(); };
            newTripModal.onclick = (e) => { if (e.target === newTripModal) closeNewTripModal(); }; // Chiudi cliccando sfondo
        }
        if (confirmationModal) {
            if(confirmationModalConfirmBtn) { confirmationModalConfirmBtn.onclick = executeConfirmAction; }
            confirmationModal.querySelectorAll('.modal-close').forEach(btn => btn.onclick = closeConfirmationModal);
            confirmationModal.onclick = (e) => { if (e.target === confirmationModal) closeConfirmationModal(); };
        }

        // --- Listener Azioni Specifiche Tab ---
        if (addTransportTotalToBudgetBtn) { addTransportTotalToBudgetBtn.onclick = handleCalculateAndAddTransportCost; }
        if (searchSkyscannerBtn) { searchSkyscannerBtn.onclick = handleSearchFlights; }
        if (searchTrainlineBtn) { searchTrainlineBtn.onclick = handleSearchTrains; }
        if(transportTypeSelect) { transportTypeSelect.onchange = toggleSearchButtonsVisibility; } // Aggiorna bottoni ricerca esterna
        // Listener per select ordinamento
        const sortControls = [
            { ctrl: 'reminder-sort-control', type: 'reminder' }, { ctrl: 'transport-sort-control', type: 'transport' },
            { ctrl: 'itinerary-sort-control', type: 'itinerary' }, { ctrl: 'budget-sort-control', type: 'budget' },
            { ctrl: 'packing-sort-control', type: 'packing' },
        ];
        sortControls.forEach(item => {
            const ctrlElement = document.getElementById(item.ctrl);
            if(ctrlElement) { ctrlElement.onchange = (e) => handleSortChange(item.type, e.target); }
        });
        // Listener per search input interni
        if(searchItineraryInput) searchItineraryInput.oninput = (e) => handleInternalSearch('itinerary', e.target);
        if(searchPackingInput) searchPackingInput.oninput = (e) => handleInternalSearch('packing', e.target);
        // Listener bottone calcolo bilancio
        if(calculateBalanceBtn) { calculateBalanceBtn.onclick = () => { const balanceResult = calculateExpenseBalance(); renderBalanceResults(balanceResult); }; }

        // --- Listener Bottoni Verifica Email (header e notice) ---
        if(resendVerificationBtn) resendVerificationBtn.onclick = handleResendVerificationEmail;
        if(resendVerificationBtnNotice) resendVerificationBtnNotice.onclick = handleResendVerificationEmail;

        console.log("DEBUG: App listeners aggiunti.");
    }; // Fine initAppEventListeners

    // ==========================================================================
    // == PUNTO DI INGRESSO E LISTENER GLOBALI ==
    // ==========================================================================

    // --- Listener UI Autenticazione (sempre attivi) ---
    if (showSignupLink && signupForm && signupPromptP) {
        showSignupLink.addEventListener('click', (event) => {
            event.preventDefault();
            if (signupForm.style.display === 'none') {
                signupForm.style.display = 'block'; // Mostra signup
                signupPromptP.style.display = 'none'; // Nascondi prompt
                if(passwordResetForm) passwordResetForm.style.display = 'none'; // Nascondi reset
                // loginForm.style.display = 'block'; // Lascia visibile login? O nascondi? Dipende da UI
                showAuthError(''); showAuthSuccess(''); // Pulisci messaggi
            }
        });
    }
    if (forgotPasswordLink && passwordResetForm && loginForm) {
        forgotPasswordLink.addEventListener('click', (e) => {
            e.preventDefault();
            passwordResetForm.style.display = 'block'; // Mostra reset
            loginForm.style.display = 'none'; // Nascondi login
            if(signupForm) signupForm.style.display = 'none'; // Nascondi signup
            if(signupPromptP) signupPromptP.style.display = 'block'; // Mostra prompt signup
            showAuthError(''); showAuthSuccess('');
        });
    }
    if (cancelResetBtn && passwordResetForm && loginForm) {
        cancelResetBtn.addEventListener('click', () => {
            passwordResetForm.style.display = 'none'; // Nascondi reset
            loginForm.style.display = 'block'; // Mostra login
            showAuthError(''); showAuthSuccess('');
        });
    }
    if(passwordResetForm) passwordResetForm.addEventListener('submit', handlePasswordResetRequest);
    if(anonymousSigninBtn) anonymousSigninBtn.addEventListener('click', handleAnonymousSignIn);
    if(loginForm) loginForm.addEventListener('submit', handleSignIn);
    if(signupForm) signupForm.addEventListener('submit', handleSignUp);
    if(logoutBtn) logoutBtn.addEventListener('click', handleSignOut);

    // --- Listener Globale per chiudere Dropdown ---
    window.addEventListener('click', (event) => {
        // Chiudi il dropdown Azioni Viaggio se aperto e si clicca fuori
        if (actionDropdownMenu && actionDropdownMenu.classList.contains('show')) {
            // Controlla se il click NON è avvenuto sul bottone trigger O all'interno del menu
            if (actionDropdownBtn && !actionDropdownBtn.contains(event.target) && !actionDropdownMenu.contains(event.target)) {
                actionDropdownMenu.classList.remove('show');
                actionDropdownBtn.setAttribute('aria-expanded', 'false');
            }
        }
        // Aggiungere qui la logica per chiudere ALTRI eventuali dropdown/popup
    });

    // --- Listener Stato Autenticazione Firebase (avvia l'app) ---
    if (auth) {
        let listenersInitialized = false; // Flag per inizializzare listener app solo una volta
        onAuthStateChanged(auth, async (user) => {
            console.log("Auth state changed. User:", user ? (user.isAnonymous ? `Anon ${user.uid}`: user.uid) : 'None');
            // Aggiorna UI in base allo stato (mostra/nascondi sezioni, carica dati)
            await updateUIBasedOnAuthState(user);
            // Inizializza i listener dell'app solo la prima volta che l'utente è loggato
            if (user && !listenersInitialized) {
                 initAppEventListeners();
                 listenersInitialized = true;
            } else if (!user) {
                 // Se utente fa logout, resetta il flag
                 listenersInitialized = false;
                 // Potresti voler rimuovere i listener qui se causano problemi,
                 // ma spesso non è necessario se gli elementi non sono interagibili.
            }
        });
    } else {
        console.error("Modulo Firebase Auth non inizializzato correttamente.");
        showAuthError("Errore critico: impossibile inizializzare l'autenticazione.");
    }

}); // Fine DOMContentLoaded
