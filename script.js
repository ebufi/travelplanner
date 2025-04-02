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
    apiKey: "AIzaSyBV7k95kgUnMhIzTQR1Xae-O_ksNYzzvmw", // NASCONDI IN PRODUZIONE!
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
    // Array che definisce quali form usano la logica mostra/nascondi
    const FORMS_TO_TOGGLE = ['participant', 'reminder', 'transport', 'accommodation', 'itinerary'];

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
    const signupPromptP = document.querySelector('.signup-prompt');
    const emailVerificationNotice = checkElement('email-verification-notice');
    const resendVerificationBtn = checkElement('resend-verification-btn');
    const resendVerificationBtnNotice = checkElement('resend-verification-btn-notice');
    const anonymousUserPrompt = checkElement('anonymous-user-prompt');
    const linkAccountPrompt = checkElement('link-account-prompt');

    // Elementi App Generali
    const loadingTripsDiv = checkElement('loading-trips');
    const tripListUl = checkElement('trip-list');
    const newTripBtn = checkElement('new-trip-btn');
    const createFromTemplateBtn = checkElement('create-from-template-btn');
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

    // Info Tab
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

    // Participants Tab (Form Toggle)
    const showAddParticipantFormBtn = checkElement('show-add-participant-form-btn');
    const addParticipantForm = checkElement('add-participant-form');
    const participantFormTitle = checkElement('participant-form-title');
    const hideAddParticipantFormBtn = checkElement('hide-add-participant-form-btn');
    const editParticipantIdInput = checkElement('edit-participant-id');
    const participantNameInput = checkElement('participant-name');
    const participantNotesInput = checkElement('participant-notes');
    const participantExtraInfoTextarea = checkElement('participant-extra-info');
    const participantListUl = checkElement('participant-list');
    const noParticipantsItemsP = checkElement('no-participants-items');
    const participantSubmitBtn = checkElement('participant-submit-btn');
    const participantCancelEditBtn = checkElement('participant-cancel-edit-btn');

    // Reminders Tab (Form Toggle)
    const showAddReminderFormBtn = checkElement('show-add-reminder-form-btn');
    const addReminderItemForm = checkElement('add-reminder-item-form');
    const reminderFormTitle = checkElement('reminder-form-title');
    const hideAddReminderFormBtn = checkElement('hide-add-reminder-form-btn');
    const editReminderItemIdInput = checkElement('edit-reminder-item-id');
    const reminderDescriptionInput = checkElement('reminder-description');
    const reminderDueDateInput = checkElement('reminder-due-date');
    const reminderStatusSelect = checkElement('reminder-status');
    const reminderListUl = checkElement('reminder-list');
    const noReminderItemsP = checkElement('no-reminder-items');
    const reminderSubmitBtn = checkElement('reminder-submit-btn');
    const reminderCancelEditBtn = checkElement('reminder-cancel-edit-btn');
    const reminderSortControl = checkElement('reminder-sort-control');

    // Transport Tab (Form Toggle)
    const showAddTransportFormBtn = checkElement('show-add-transport-form-btn');
    const addTransportItemForm = checkElement('add-transport-item-form');
    const transportFormTitle = checkElement('transport-form-title');
    const hideAddTransportFormBtn = checkElement('hide-add-transport-form-btn');
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

    // Accommodation Tab (Form Toggle)
    const showAddAccommodationFormBtn = checkElement('show-add-accommodation-form-btn');
    const addAccommodationItemForm = checkElement('add-accommodation-item-form');
    const accommodationFormTitle = checkElement('accommodation-form-title');
    const hideAddAccommodationFormBtn = checkElement('hide-add-accommodation-form-btn');
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

    // Itinerary Tab (Form Toggle)
    const showAddItineraryFormBtn = checkElement('show-add-itinerary-form-btn');
    const addItineraryItemForm = checkElement('add-itinerary-item-form');
    const itineraryFormTitle = checkElement('itinerary-form-title');
    const hideAddItineraryFormBtn = checkElement('hide-add-itinerary-form-btn');
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

    // Budget Tab (Form Always Visible)
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

    // Packing List Tab (Form Always Visible)
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

    // Balance Tab
    const calculateBalanceBtn = checkElement('calculate-balance-btn');
    const balanceResultsContainer = checkElement('balance-results-container');
    const balanceResultsUl = checkElement('balance-results');
    const balanceSummaryDiv = checkElement('balance-summary');
    const balanceErrorMessageP = checkElement('balance-error-message');

    // Modals & Misc
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
        alert("Errore critico: alcuni elementi dell'interfaccia non sono stati trovati. L'app potrebbe non funzionare correttamente.");
        // Considera di bloccare l'app o mostrare un messaggio più permanente
        return;
    }
    console.log("DEBUG: Selezione elementi DOM completata.");

    // ==========================================================================
    // == STATO APPLICAZIONE ==
    // ==========================================================================
    let currentUser = null;
    let currentUserId = null;
    let trips = [];
    let currentTripId = null;
    // Oggetto per tracciare l'ID dell'item in modifica per ciascun tipo di lista
    let editingItemId = { participant: null, reminder: null, transport: null, accommodation: null, itinerary: null, budget: null, packing: null };
    let confirmActionCallback = null; // Callback per il modal di conferma
    // Stato per l'ordinamento corrente di ciascuna lista
    let currentSort = { transport: 'departureDateTime', itinerary: 'dateTime', budget: 'category', packing: 'name', reminder: 'dueDate' };
    // Stato per i termini di ricerca correnti
    let currentSearchTerm = { trip: '', itinerary: '', packing: '' };

    // ==========================================================================
    // == FUNZIONI UTILITY ==
    // ==========================================================================
    const generateId = (prefix = 'item') => `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    const formatCurrency = (amount) => { const num = amount === null || typeof amount === 'undefined' ? 0 : Number(amount); if (isNaN(num)) { return new Intl.NumberFormat(DEFAULT_LOCALE, { style: 'currency', currency: DEFAULT_CURRENCY }).format(0); } return new Intl.NumberFormat(DEFAULT_LOCALE, { style: 'currency', currency: DEFAULT_CURRENCY }).format(num); };
    const formatDate = (dateString) => { if (!dateString || typeof dateString !== 'string') return ''; const datePart = dateString.split('T')[0]; if (!datePart || !datePart.match(/^\d{4}-\d{2}-\d{2}$/)) return dateString; try { const [year, month, day] = datePart.split('-').map(Number); const date = new Date(Date.UTC(year, month - 1, day)); if (isNaN(date.getTime()) || date.getUTCFullYear() !== year || date.getUTCMonth() + 1 !== month || date.getUTCDate() !== day) return dateString; return date.toLocaleDateString(DEFAULT_LOCALE, { year: 'numeric', month: '2-digit', day: '2-digit' }); } catch (e) { return dateString; } };
    const formatDateTime = (dateTimeString) => { if (!dateTimeString || typeof dateTimeString !== 'string') return ''; try { const date = new Date(dateTimeString); if (isNaN(date.getTime())) return ''; return date.toLocaleString(DEFAULT_LOCALE, { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }); } catch (e) { return ''; } };
    const formatSkyscannerDate = (isoDateString) => { if (!isoDateString || typeof isoDateString !== 'string' || !isoDateString.match(/^\d{4}-\d{2}-\d{2}/)) return null; try { const datePart = isoDateString.split('T')[0]; const year = datePart.substring(2, 4); const month = datePart.substring(5, 7); const day = datePart.substring(8, 10); return `${year}${month}${day}`; } catch (e) { return null; } };
    const showToast = (message, type = 'info') => { if (!toastContainer) return; const toast = document.createElement('div'); toast.className = `toast ${type}`; let iconClass = 'fas fa-info-circle'; if (type === 'success') iconClass = 'fas fa-check-circle'; if (type === 'error') iconClass = 'fas fa-exclamation-circle'; toast.innerHTML = `<i class="${iconClass}"></i> ${message}`; toastContainer.appendChild(toast); setTimeout(() => toast.classList.add('show'), 10); setTimeout(() => { toast.classList.remove('show'); toast.addEventListener('transitionend', () => toast.remove(), { once: true }); }, 3000); };
    const openModal = (modalElement) => { if(modalElement) modalElement.style.display = 'block'; };
    const closeModal = (modalElement) => { if(modalElement) modalElement.style.display = 'none'; };
    const openNewTripModal = () => { if (!newTripModal) return; newTripNameInput.value = ''; if (newTripErrorP) newTripErrorP.style.display = 'none'; openModal(newTripModal); newTripNameInput.focus(); };
    const closeNewTripModal = () => closeModal(newTripModal);
    const showConfirmationModal = (title, message, onConfirm) => { if (!confirmationModal) return; confirmationModalTitle.textContent = title; confirmationModalMessage.textContent = message; confirmActionCallback = onConfirm; openModal(confirmationModal); };
    const closeConfirmationModal = () => { confirmActionCallback = null; closeModal(confirmationModal); };

    // --- MODIFICATA PER GESTIRE VISIBILITA' FORM ---
    const resetEditState = (formType) => {
        editingItemId[formType] = null;
        const form = document.getElementById(`add-${formType}-item-form`);
        const submitBtn = document.getElementById(`${formType}-submit-btn`);
        const cancelBtn = document.getElementById(`${formType}-cancel-edit-btn`);
        const hiddenInput = document.getElementById(`edit-${formType}-item-id`);
        const showFormBtn = document.getElementById(`show-add-${formType}-form-btn`); // Può essere null
        const formTitleEl = document.getElementById(`${formType}-form-title`); // Può essere null

        // Resetta e nasconde il form SOLO se è uno di quelli toggleabili
        if (form && FORMS_TO_TOGGLE.includes(formType)) {
            form.reset();
            form.style.display = 'none'; // NASCONDE il form al reset
            if (showFormBtn) {
                showFormBtn.style.display = 'inline-flex'; // MOSTRA il bottone "Aggiungi Nuovo"
            }
        } else if (form) {
            // Per Info/Budget/Packing che rimangono visibili, resetta solo i campi
             form.reset();
        }

        if(hiddenInput) hiddenInput.value = '';

        // Aggiorna testo bottone Submit
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
            submitBtn.classList.remove('btn-warning');
            submitBtn.classList.add('btn-secondary');
        }

        if (cancelBtn) cancelBtn.style.display = 'none'; // Nasconde "Annulla Modifica"

        // Resetta il titolo del form (solo per quelli toggleabili)
        if (formTitleEl && FORMS_TO_TOGGLE.includes(formType)) {
             let titleText = 'Nuovo Elemento'; // Default generico
             switch(formType) {
                  case 'participant': titleText = 'Nuovo Partecipante'; break;
                  case 'reminder': titleText = 'Nuovo Promemoria'; break;
                  case 'transport': titleText = 'Nuovo Trasporto'; break;
                  case 'accommodation': titleText = 'Nuovo Alloggio'; break;
                  case 'itinerary': titleText = 'Nuova Attività'; break;
             }
             formTitleEl.textContent = `Aggiungi ${titleText}`;
        }

        // Logica specifica (es. bottoni Skyscanner/Trainline)
        if(formType === 'transport' && typeof toggleSearchButtonsVisibility === 'function') {
             toggleSearchButtonsVisibility();
        }
    };

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
    const saveTripToFirestore = async (tripData) => { if (!currentUserId) { showToast("Errore: Utente non loggato.", "error"); return null; } if (!tripData || typeof tripData !== 'object') { showToast("Errore: Dati viaggio non validi.", "error"); return null; } const isNewTrip = !findTripById(tripData.id); const dataToSave = prepareTripDataForFirestore(tripData); const tripsColRef = collection(db, 'users', currentUserId, 'trips'); try { let docRef; let message; if (isNewTrip) { docRef = await addDoc(tripsColRef, dataToSave); console.log("Nuovo viaggio salvato con ID:", docRef.id); message = `Viaggio "${dataToSave.name}" creato!`; tripData.id = docRef.id; showToast(message, "success"); return docRef.id; } else { docRef = doc(db, 'users', currentUserId, 'trips', tripData.id); await setDoc(docRef, dataToSave); console.log("Viaggio aggiornato con ID:", tripData.id); message = `Viaggio "${dataToSave.name}" aggiornato!`; /* Non mostrare toast per ogni piccolo update showToast(message, "success"); */ return tripData.id; } } catch (error) { console.error("Errore salvataggio viaggio:", error); showToast("Errore durante il salvataggio.", "error"); return null; } };
    const deleteTripFromFirestore = async (tripId) => { if (!currentUserId || !tripId) { showToast("Errore: Utente non loggato o ID viaggio mancante.", "error"); return false; } console.log(`DEBUG: Eliminazione viaggio ${tripId} per utente ${currentUserId}`); const tripDocRef = doc(db, 'users', currentUserId, 'trips', tripId); try { await deleteDoc(tripDocRef); console.log(`DEBUG: Viaggio ${tripId} eliminato.`); return true; } catch (error) { console.error(`Errore eliminazione viaggio ${tripId}:`, error); showToast("Errore durante l'eliminazione.", "error"); return false; } };

    // ==========================================================================
    // == LOGICA VIAGGI ==
    // ==========================================================================
    const findTripById = (id) => trips.find(trip => trip && trip.id === id);
    const renderTripList = () => { const searchTerm = currentSearchTerm.trip.toLowerCase(); tripListUl.innerHTML = ''; const filteredTrips = trips.filter(trip => { if (!trip || !trip.id) return false; if (trip.isTemplate) return false; const tripNameLower = (trip.name || '').toLowerCase(); const destinationLower = (trip.destination || '').toLowerCase(); return !searchTerm || tripNameLower.includes(searchTerm) || destinationLower.includes(searchTerm); }); const sortedTrips = filteredTrips.sort((a, b) => (a.name || '').localeCompare(b?.name || '')); sortedTrips.forEach(trip => { const li = createTripListItem(trip, true); tripListUl.appendChild(li); }); const hasVisibleTrips = sortedTrips.length > 0; if(noTripsMessage) noTripsMessage.style.display = trips.length === 0 || !hasVisibleTrips ? 'block' : 'none'; if(loadingTripsDiv) loadingTripsDiv.style.display = 'none'; };
    const createTripListItem = (trip, isVisible) => { const li = document.createElement('li'); li.dataset.tripId = trip.id; li.innerHTML = `<span>${trip.name || 'Senza Nome'} (${formatDate(trip.startDate)} - ${formatDate(trip.endDate)})</span> <button class="btn-icon delete btn-delete-trip" data-trip-id="${trip.id}" title="Elimina"><i class="fas fa-trash-alt"></i></button>`; if (trip.id === currentTripId) { li.classList.add('active'); } if (!isVisible) li.classList.add('hidden'); li.addEventListener('click', (e) => { if (!e.target.closest('.btn-delete-trip')) { selectTrip(trip.id); } }); const deleteButton = li.querySelector('.btn-delete-trip'); if (deleteButton) { deleteButton.addEventListener('click', (e) => { e.stopPropagation(); handleDeleteTrip(trip.id); }); } return li; };
    const selectTrip = (id) => { if (!id) { deselectTrip(); return; } if (currentTripId === id && tripDetailsAreaDiv.style.display !== 'none') return; const trip = findTripById(id); if (trip) { currentTripId = id; saveLocalStorageAppState(); currentSearchTerm.itinerary = ''; if(searchItineraryInput) searchItineraryInput.value = ''; currentSearchTerm.packing = ''; if(searchPackingInput) searchPackingInput.value = ''; currentSort = { transport: 'departureDateTime', itinerary: 'dateTime', budget: 'category', packing: 'name', reminder: 'dueDate' }; applyCurrentSortToControls(); renderTripList(); renderTripDetails(trip); if(tripDetailsAreaDiv) tripDetailsAreaDiv.style.display = 'block'; if(welcomeMessageDiv) welcomeMessageDiv.style.display = 'none'; Object.keys(editingItemId).forEach(resetEditState); // Resetta tutti i form (nasconde quelli toggleabili) switchTab('info-tab'); } else { console.warn(`Tentativo di selezionare viaggio con ID ${id} non trovato.`); deselectTrip(); } };
    const deselectTrip = () => { currentTripId = null; saveLocalStorageAppState(); if(tripDetailsAreaDiv) tripDetailsAreaDiv.style.display = 'none'; if(welcomeMessageDiv && currentUserId) welcomeMessageDiv.style.display = 'flex'; if(downloadTextBtn) downloadTextBtn.disabled = true; if(downloadExcelBtn) downloadExcelBtn.disabled = true; if(deleteTripBtn) deleteTripBtn.disabled = true; if (shareTripBtn) shareTripBtn.disabled = true; if(emailSummaryBtn) emailSummaryBtn.disabled = true; if(copySummaryBtn) copySummaryBtn.disabled = true; renderTripList(); };
    const renderTripDetails = (trip) => { if (!trip || !trip.id) { deselectTrip(); return; } if(tripTitleH2) tripTitleH2.textContent = trip.name || 'Senza Nome'; if(editTripIdInput) editTripIdInput.value = trip.id; if(tripNameInput) tripNameInput.value = trip.name || ''; if(tripOriginCityInput) tripOriginCityInput.value = trip.originCity || ''; if(tripDestinationInput) tripDestinationInput.value = trip.destination || ''; if(tripStartDateInput) tripStartDateInput.value = trip.startDate || ''; if(tripEndDateInput) tripEndDateInput.value = trip.endDate || ''; if(tripIsTemplateCheckbox) tripIsTemplateCheckbox.checked = false; if(tripNotesTextarea) tripNotesTextarea.value = trip.notes || ''; if(tripExtraInfoTextarea) tripExtraInfoTextarea.value = trip.extraInfo || ''; renderParticipants(trip.participants); renderReminders(trip.reminders); renderTransportations(trip.transportations); renderAccommodations(trip.accommodations); renderItinerary(trip.itinerary); renderBudget(trip.budget); renderPackingList(trip.packingList); populateDatalists(trip); const actionsEnabled = !!trip.id; if(downloadTextBtn) downloadTextBtn.disabled = !actionsEnabled; if(downloadExcelBtn) downloadExcelBtn.disabled = !actionsEnabled; if(deleteTripBtn) deleteTripBtn.disabled = !actionsEnabled; if (shareTripBtn) shareTripBtn.disabled = !actionsEnabled || (currentUser && currentUser.isAnonymous); if(emailSummaryBtn) emailSummaryBtn.disabled = !actionsEnabled; if(copySummaryBtn) copySummaryBtn.disabled = !actionsEnabled; toggleSearchButtonsVisibility(); };
    const handleNewTrip = () => { if (!currentUserId) { showToast("Devi essere loggato per creare un viaggio.", "warning"); return; } openNewTripModal(); };
    const handleCreateTripConfirm = async () => { const tripName = newTripNameInput.value.trim(); if (!tripName) { if (newTripErrorP) { newTripErrorP.textContent = 'Il nome non può essere vuoto.'; newTripErrorP.style.display = 'block'; } newTripNameInput.focus(); return; } if (!currentUserId) { showToast("Errore: Utente non identificato.", "error"); return; } if (newTripErrorP) newTripErrorP.style.display = 'none'; const newTripData = { name: tripName, originCity: '', destination: '', startDate: null, endDate: null, notes: '', isTemplate: false, extraInfo: '', participants: [], reminders: [], transportations: [], accommodations: [], itinerary: [], budget: { items: [], estimatedTotal: 0, actualTotal: 0 }, packingList: [], createdAt: Timestamp.now() }; if(createTripConfirmBtn) createTripConfirmBtn.disabled = true; const newTripId = await saveTripToFirestore(newTripData); if(createTripConfirmBtn) createTripConfirmBtn.disabled = false; if (newTripId) { const savedTrip = processTripDataFromFirestore(newTripId, prepareTripDataForFirestore({ ...newTripData, id: newTripId })); trips.unshift(savedTrip); closeNewTripModal(); renderTripList(); selectTrip(newTripId); } else { if (newTripErrorP) { newTripErrorP.textContent = 'Errore durante la creazione.'; newTripErrorP.style.display = 'block'; } } };
    const handleSaveTripInfo = async (e) => { e.preventDefault(); if (!currentTripId || !currentUserId) return; const tripIndex = trips.findIndex(t => t.id === currentTripId); if (tripIndex === -1) { showToast("Errore: Viaggio non trovato.", "error"); return; } const trip = trips[tripIndex]; const start = tripStartDateInput.value, end = tripEndDateInput.value; if (start && end && start > end) { showToast('Data fine non valida.', 'error'); return; } trip.name = tripNameInput.value.trim() || 'Viaggio S.N.'; trip.originCity = tripOriginCityInput ? tripOriginCityInput.value.trim() : trip.originCity; trip.destination = tripDestinationInput ? tripDestinationInput.value.trim() : trip.destination; trip.startDate = start || null; trip.endDate = end || null; trip.notes = tripNotesTextarea ? tripNotesTextarea.value.trim() : trip.notes; trip.extraInfo = tripExtraInfoTextarea ? tripExtraInfoTextarea.value.trim() : trip.extraInfo; trip.updatedAt = new Date().toISOString(); const success = await saveTripToFirestore(trip); if (success) { if(tripTitleH2) tripTitleH2.textContent = trip.name; renderTripList(); showToast("Informazioni viaggio salvate!", "success"); // Feedback per salvataggio info } };
    const handleDeleteTrip = (id) => { if (!currentUserId || !id) return; const trip = findTripById(id); if (!trip) { showToast(`Viaggio non trovato`, "warning"); return; } showConfirmationModal( `Conferma Eliminazione Viaggio`, `Eliminare "${trip.name || 'S.N.'}"? Questa azione è irreversibile.`, async () => { const success = await deleteTripFromFirestore(id); if (success) { trips = trips.filter(t => t.id !== id); saveLocalStorageAppState(); if (currentTripId === id) { deselectTrip(); } else { renderTripList(); } showToast(`Viaggio "${trip.name || 'S.N.'}" eliminato.`, 'info'); } } ); };
    const openSelectTemplateModal = () => { showToast("Funzionalità template non disponibile.", "info"); };
    const handleCreateFromTemplateConfirm = () => {};
    const handleSearchTrip = (e) => { currentSearchTerm.trip = e.target.value; renderTripList(); };

    // ==========================================================================
    // == FUNZIONI MODIFICA ITEM ==
    // ==========================================================================

    // --- MODIFICATA PER GESTIRE VISIBILITA' FORM ---
    const startEditItem = (listType, itemId) => {
        // Verifica se il form è uno di quelli da nascondere/mostrare
        const shouldToggleForm = FORMS_TO_TOGGLE.includes(listType);

        if (!currentTripId) return;
        const trip = findTripById(currentTripId);
        if (!trip) return;

        let itemToEdit = null;
        let list = [];
        // Trova la lista corretta
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

        // Resetta altri form (resetEditState gestisce la visibilità)
        Object.keys(editingItemId).forEach(type => {
            if (type !== listType) {
                resetEditState(type);
            }
        });
        editingItemId[listType] = itemId;

        const form = document.getElementById(`add-${listType}-item-form`);
        const submitBtn = document.getElementById(`${listType}-submit-btn`);
        const cancelBtn = document.getElementById(`${listType}-cancel-edit-btn`);
        const hiddenInput = document.getElementById(`edit-${listType}-item-id`);
        const showFormBtn = document.getElementById(`show-add-${listType}-form-btn`); // Può essere null
        const formTitleEl = document.getElementById(`${listType}-form-title`); // Può essere null

        // MOSTRA IL FORM E NASCONDI IL BOTTONE "AGGIUNGI NUOVO" (solo se applicabile)
        if (form && shouldToggleForm) {
            form.style.display = 'block';
            if (showFormBtn) showFormBtn.style.display = 'none';
        } else if (form && !shouldToggleForm) {
             // Per Budget/Packing, assicurati che il form sia visibile
             form.style.display = 'block';
        }

        // Aggiorna Titolo del Form (solo se applicabile)
        if (formTitleEl && shouldToggleForm) {
             let titleText = 'Elemento'; // Default
             switch(listType) {
                  case 'participant': titleText = 'Partecipante'; break;
                  case 'reminder': titleText = 'Promemoria'; break;
                  case 'transport': titleText = 'Trasporto'; break;
                  case 'accommodation': titleText = 'Alloggio'; break;
                  case 'itinerary': titleText = 'Attività'; break;
             }
            formTitleEl.textContent = `Modifica ${titleText}`;
        }

        if (hiddenInput) hiddenInput.value = itemId;

        // Popola i campi del form
        try {
            switch (listType) {
                 case 'participant': participantNameInput.value = itemToEdit.name || ''; participantNotesInput.value = itemToEdit.notes || ''; participantExtraInfoTextarea.value = itemToEdit.extraInfo || ''; break;
                 case 'reminder': reminderDescriptionInput.value = itemToEdit.description || ''; reminderDueDateInput.value = itemToEdit.dueDate || ''; reminderStatusSelect.value = itemToEdit.status || 'todo'; break;
                 case 'transport': transportTypeSelect.value = itemToEdit.type || 'Altro'; transportDescriptionInput.value = itemToEdit.description || ''; transportDepartureLocInput.value = itemToEdit.departureLoc || ''; transportDepartureDatetimeInput.value = itemToEdit.departureDateTime || ''; transportArrivalLocInput.value = itemToEdit.arrivalLoc || ''; transportArrivalDatetimeInput.value = itemToEdit.arrivalDateTime || ''; transportBookingRefInput.value = itemToEdit.bookingRef || ''; transportCostInput.value = itemToEdit.cost ?? ''; transportNotesInput.value = itemToEdit.notes || ''; transportLinkInput.value = itemToEdit.link || ''; break;
                 case 'accommodation': accommodationNameInput.value = itemToEdit.name || ''; accommodationTypeSelect.value = itemToEdit.type || 'Hotel'; accommodationAddressInput.value = itemToEdit.address || ''; accommodationCheckinInput.value = itemToEdit.checkinDateTime || ''; accommodationCheckoutInput.value = itemToEdit.checkoutDateTime || ''; accommodationBookingRefInput.value = itemToEdit.bookingRef || ''; accommodationCostInput.value = itemToEdit.cost ?? ''; accommodationNotesInput.value = itemToEdit.notes || ''; accommodationLinkInput.value = itemToEdit.link || ''; break;
                 case 'itinerary': itineraryDayInput.value = itemToEdit.day || ''; itineraryTimeInput.value = itemToEdit.time || ''; itineraryActivityInput.value = itemToEdit.activity || ''; itineraryLocationInput.value = itemToEdit.location || ''; itineraryBookingRefInput.value = itemToEdit.bookingRef || ''; itineraryCostInput.value = itemToEdit.cost ?? ''; itineraryNotesInput.value = itemToEdit.notes || ''; itineraryLinkInput.value = itemToEdit.link || ''; break;
                 case 'budget': budgetCategorySelect.value = itemToEdit.category || 'Altro'; budgetDescriptionInput.value = itemToEdit.description || ''; budgetEstimatedInput.value = itemToEdit.estimated ?? ''; budgetActualInput.value = itemToEdit.actual ?? ''; budgetPaidByInput.value = itemToEdit.paidBy || ''; budgetSplitBetweenInput.value = itemToEdit.splitBetween || ''; break;
                 case 'packing': packingItemNameInput.value = itemToEdit.name || ''; packingItemCategoryInput.value = itemToEdit.category || 'Altro'; packingItemQuantityInput.value = itemToEdit.quantity || 1; break;
            }
        } catch (error) {
            console.error(`Errore popola form ${listType}:`, error);
            showToast(`Errore caricamento dati per modifica.`, 'error');
            resetEditState(listType); // Nascondi/resetta form in caso di errore nel popolare
            return;
        }

        // Aggiorna bottone Submit
        if (submitBtn) {
            submitBtn.innerHTML = '<i class="fas fa-save"></i> Salva Modifiche';
            submitBtn.classList.remove('btn-secondary');
            submitBtn.classList.add('btn-warning');
        }
        if (cancelBtn) cancelBtn.style.display = 'inline-flex'; // Mostra "Annulla Modifica"

        if (listType === 'transport') toggleSearchButtonsVisibility();
        if (form) form.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    };

    // --- MODIFICATA PER SPINNER E FEEDBACK ---
    const handleItemFormSubmit = async (e, listType) => {
        e.preventDefault();
        if (!currentTripId || !currentUserId) return;
        const tripIndex = trips.findIndex(t => t.id === currentTripId);
        if (tripIndex === -1) { showToast("Errore: Viaggio corrente non trovato.", "error"); return; }

        const trip = trips[tripIndex];
        const currentEditId = editingItemId[listType]; // ID se stiamo modificando, null se aggiungendo
        let itemData = {};
        let list = [];
        let listOwner = trip;
        let renderFn;
        let friendlyListName = listType.charAt(0).toUpperCase() + listType.slice(1); // Nome per i messaggi

        // Determina lista, proprietario, funzione di rendering e nome user-friendly
        switch (listType) {
            case 'participant': list = trip.participants = trip.participants || []; renderFn = renderParticipants; break;
            case 'reminder': list = trip.reminders = trip.reminders || []; renderFn = renderReminders; break;
            case 'transport': list = trip.transportations = trip.transportations || []; renderFn = renderTransportations; break;
            case 'accommodation': list = trip.accommodations = trip.accommodations || []; renderFn = renderAccommodations; break;
            case 'itinerary': list = trip.itinerary = trip.itinerary || []; renderFn = renderItinerary; break;
            case 'budget': trip.budget = trip.budget || { items: [], estimatedTotal: 0, actualTotal: 0 }; list = trip.budget.items = trip.budget.items || []; listOwner = trip.budget; friendlyListName="Spesa"; break;
            case 'packing': list = trip.packingList = trip.packingList || []; renderFn = renderPackingList; friendlyListName="Oggetto"; break;
            default: console.error("Tipo lista non valido:", listType); return;
        }

        // Validazione e preparazione dati
        try {
            switch (listType) {
                 case 'participant': if (!participantNameInput.value.trim()) throw new Error("Nome partecipante richiesto."); itemData = { name: participantNameInput.value.trim(), notes: participantNotesInput.value.trim() || null, extraInfo: participantExtraInfoTextarea.value.trim() || null }; break;
                 case 'reminder': if (!reminderDescriptionInput.value.trim()) throw new Error("Descrizione promemoria richiesta."); itemData = { description: reminderDescriptionInput.value.trim(), dueDate: reminderDueDateInput.value || null, status: reminderStatusSelect.value }; break;
                 case 'transport': if (!transportDescriptionInput.value.trim()) throw new Error("Descrizione trasporto richiesta."); const depDateTime = transportDepartureDatetimeInput.value || null; const arrDateTime = transportArrivalDatetimeInput.value || null; if (depDateTime && arrDateTime && depDateTime >= arrDateTime) throw new Error("Arrivo deve essere dopo partenza."); const transportCost = safeToNumberOrNull(transportCostInput.value); if(transportCost !== null && transportCost < 0) throw new Error("Costo trasporto non valido."); itemData = { type: transportTypeSelect.value, description: transportDescriptionInput.value.trim(), departureLoc: transportDepartureLocInput.value.trim() || null, departureDateTime: depDateTime, arrivalLoc: transportArrivalLocInput.value.trim() || null, arrivalDateTime: arrDateTime, bookingRef: transportBookingRefInput.value.trim() || null, cost: transportCost, notes: transportNotesInput.value.trim() || null, link: transportLinkInput.value.trim() || null }; break;
                 case 'accommodation': if (!accommodationNameInput.value.trim()) throw new Error("Nome alloggio richiesto."); const checkin = accommodationCheckinInput.value || null; const checkout = accommodationCheckoutInput.value || null; if(checkin && checkout && checkin >= checkout) throw new Error("Check-out deve essere dopo check-in."); const accomCost = safeToNumberOrNull(accommodationCostInput.value); if(accomCost !== null && accomCost < 0) throw new Error("Costo alloggio non valido."); itemData = { name: accommodationNameInput.value.trim(), type: accommodationTypeSelect.value, address: accommodationAddressInput.value.trim() || null, checkinDateTime: checkin, checkoutDateTime: checkout, bookingRef: accommodationBookingRefInput.value.trim() || null, cost: accomCost, notes: accommodationNotesInput.value.trim() || null, link: accommodationLinkInput.value.trim() || null }; break;
                 case 'itinerary': const itinDay = itineraryDayInput.value; const itinAct = itineraryActivityInput.value.trim(); if (!itinDay || !itinAct) throw new Error("Giorno e attività richiesti."); const itinStartDate = trip.startDate ? trip.startDate.split('T')[0] : null; const itinEndDate = trip.endDate ? trip.endDate.split('T')[0] : null; if (itinStartDate && itinEndDate && itinDay && (itinDay < itinStartDate || itinDay > itinEndDate)) showToast(`Attenzione: data ${formatDate(itinDay)} fuori dal periodo del viaggio (${formatDate(itinStartDate)} - ${formatDate(itinEndDate)}).`, 'warning'); const itinCost = safeToNumberOrNull(itineraryCostInput.value); if(itinCost !== null && itinCost < 0) throw new Error("Costo attività non valido."); itemData = { day: itinDay, time: itineraryTimeInput.value || null, activity: itinAct, location: itineraryLocationInput.value.trim() || null, bookingRef: itineraryBookingRefInput.value.trim() || null, cost: itinCost, notes: itineraryNotesInput.value.trim() || null, link: itineraryLinkInput.value.trim() || null }; break;
                 case 'budget': const descBudget = budgetDescriptionInput.value.trim(); const est = safeToNumberOrNull(budgetEstimatedInput.value); const act = safeToNumberOrNull(budgetActualInput.value); if (!descBudget || est === null || est < 0) throw new Error("Descrizione e costo stimato validi richiesti."); if (act !== null && act < 0) throw new Error("Costo effettivo non valido."); itemData = { category: budgetCategorySelect.value, description: descBudget, estimated: est, actual: act, paidBy: budgetPaidByInput.value.trim() || null, splitBetween: budgetSplitBetweenInput.value.trim() || null }; break;
                 case 'packing': if (!packingItemNameInput.value.trim()) throw new Error("Nome oggetto richiesto."); const quantity = safeToPositiveIntegerOrDefault(packingItemQuantityInput.value); itemData = { name: packingItemNameInput.value.trim(), category: packingItemCategoryInput.value.trim() || 'Altro', quantity: quantity }; break;
            }
        } catch (error) {
            showToast(`Errore: ${error.message}`, "error");
            return; // Non procedere se la validazione fallisce
        }

        // Salva l'ID dell'eventuale nuovo elemento PRIMA del salvataggio async
        let newItemId = null;

        // Aggiunta o Modifica nella lista locale
        if (currentEditId) {
            const idx = list.findIndex(i => i && i.id === currentEditId);
            if (idx > -1) {
                const oldItem = list[idx];
                list[idx] = { ...itemData, id: currentEditId, ...(listType === 'packing' ? { packed: oldItem.packed } : {}) };
            } else {
                console.error(`Item ${currentEditId} non trovato per modifica.`);
                showToast("Errore: elemento da modificare non trovato.", "error");
                return;
            }
        } else {
            itemData.id = generateId(listType);
            newItemId = itemData.id; // Salva l'ID del nuovo elemento
            if (listType === 'packing') itemData.packed = false;
            if (listType === 'reminder') itemData.status = itemData.status || 'todo';
            list.push(itemData);
        }

        // Ricalcolo totali budget se necessario
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

        trip.updatedAt = new Date().toISOString();

        // Disabilita bottone e mostra spinner
        const submitBtn = document.getElementById(`${listType}-submit-btn`);
        let originalButtonText = '';
        if (submitBtn) {
            originalButtonText = submitBtn.innerHTML; // Salva il testo originale
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvataggio...';
        }

        // Salva su Firestore
        const success = await saveTripToFirestore(trip);

        // Riabilita bottone (il testo verrà resettato da resetEditState)
         if (submitBtn) {
             submitBtn.disabled = false;
             // Non ripristinare il testo qui, ci pensa resetEditState
         }

        if (success) {
            // Renderizza la lista aggiornata
            if (listType === 'budget') {
                renderFn(listOwner);
            } else {
                renderFn(list);
            }

            // Resetta lo stato del form (nasconde form toggleabili, resetta campi, ecc.)
            resetEditState(listType);

            // Aggiorna datalist se necessario
            if(listType === 'participant') populateDatalists(trip);
            if(listType === 'packing') populatePackingCategoriesDatalist(trip.packingList);

             // Mostra toast di successo
             const actionVerb = currentEditId ? 'modificato/a' : 'aggiunto/a';
             showToast(`${friendlyListName} ${actionVerb} con successo!`, 'success');

        } else {
           // Gestione errore salvataggio
           showToast(`Errore durante il salvataggio ${friendlyListName}. Riprova.`, 'error');
           // Ripristina il bottone al suo stato pre-submit in caso di errore
            if(submitBtn) submitBtn.innerHTML = originalButtonText;

           // Rimuovi l'elemento aggiunto localmente se era una nuova aggiunta e il salvataggio è fallito
           if (newItemId) { // Usa l'ID salvato prima dell'await
                const addedItemIndex = list.findIndex(i => i.id === newItemId);
                if (addedItemIndex > -1) {
                    list.splice(addedItemIndex, 1);
                    console.log(`Rollback: Rimosso localmente ${listType} con id ${newItemId} causa fallimento salvataggio.`);
                     // Ricalcola e ri-renderizza se necessario (es. budget)
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
                         renderBudget(trip.budget); // Rerender budget UI
                     } else {
                         renderFn(list); // Rerender la lista senza l'elemento fallito
                     }
                }
           }
        }
    };

    const handleDeleteItem = (listType, itemId) => { if (!currentTripId || !currentUserId) return; const tripIndex = trips.findIndex(t => t.id === currentTripId); if (tripIndex === -1) return; const trip = trips[tripIndex]; let list, renderFn, listOwner = trip, itemName = "voce", friendlyListName = listType.charAt(0).toUpperCase() + listType.slice(1); switch(listType) { case 'participant': list = trip.participants || []; renderFn = renderParticipants; itemName="partecipante"; break; case 'reminder': list = trip.reminders || []; renderFn = renderReminders; itemName="promemoria"; break; case 'transport': list = trip.transportations || []; renderFn = renderTransportations; itemName="trasporto"; break; case 'accommodation': list = trip.accommodations || []; renderFn = renderAccommodations; itemName="alloggio"; break; case 'itinerary': list = trip.itinerary || []; renderFn = renderItinerary; itemName="attività"; break; case 'budget': if (!trip.budget || !trip.budget.items) return; list = trip.budget.items; renderFn = renderBudget; listOwner = trip.budget; itemName="spesa"; friendlyListName="Spesa"; break; case 'packing': list = trip.packingList || []; renderFn = renderPackingList; itemName="oggetto"; friendlyListName="Oggetto"; break; default: return; } if (!Array.isArray(list)) { return; } const itemIndex = list.findIndex(item => item && item.id === itemId); if (itemIndex > -1) { const itemDesc = list[itemIndex].name || list[itemIndex].description || list[itemIndex].activity || `ID: ${itemId}`; showConfirmationModal( `Conferma Eliminazione ${friendlyListName}`, `Eliminare "${itemDesc}"?`, async () => { list.splice(itemIndex, 1); if (listType === 'budget') { let calcEst = 0, calcAct = 0; trip.budget.items.forEach(item => { const est = safeToNumberOrNull(item.estimated); const act = safeToNumberOrNull(item.actual); if (est !== null) calcEst += est; if (act !== null) calcAct += act; }); trip.budget.estimatedTotal = calcEst; trip.budget.actualTotal = calcAct; } trip.updatedAt = new Date().toISOString(); const success = await saveTripToFirestore(trip); if (success) { if (listType === 'budget') { renderFn(listOwner); } else { renderFn(list); } if (editingItemId[listType] === itemId) resetEditState(listType); showToast(`${friendlyListName} eliminato/a.`, 'info'); if(listType === 'participant') populateDatalists(trip); if(listType === 'packing') populatePackingCategoriesDatalist(trip.packingList); } else { // Rollback in caso di fallimento eliminazione Firestore list.splice(itemIndex, 0, list[itemIndex]); // Reinserisci l'elemento showToast(`Errore eliminazione ${friendlyListName}.`, 'error'); // Ricalcola budget se necessario e ri-renderizza if (listType === 'budget') { let calcEst = 0, calcAct = 0; trip.budget.items.forEach(item => { const est = safeToNumberOrNull(item.estimated); const act = safeToNumberOrNull(item.actual); if (est !== null) calcEst += est; if (act !== null) calcAct += act; }); trip.budget.estimatedTotal = calcEst; trip.budget.actualTotal = calcAct; renderBudget(trip.budget); } else { renderFn(list); } } } ); } };
    const handleTogglePacked = async (itemId, isPacked) => { if (!currentTripId || !currentUserId) return; const tripIndex = trips.findIndex(t => t.id === currentTripId); if (tripIndex === -1) return; const trip = trips[tripIndex]; if (!trip.packingList) trip.packingList = []; const idx = trip.packingList.findIndex(i => i && i.id === itemId); if (idx > -1) { const originalPackedState = trip.packingList[idx].packed; trip.packingList[idx].packed = isPacked; trip.updatedAt = new Date().toISOString(); const success = await saveTripToFirestore(trip); if (success) { if (currentSort.packing === 'status') { renderPackingList(trip.packingList); } else { const li = packingListUl?.querySelector(`li[data-item-id="${itemId}"]`); if (li) li.classList.toggle('packed', isPacked); const checkbox = packingListUl?.querySelector(`input[data-item-id="${itemId}"]`); if (checkbox) checkbox.checked = isPacked; } } else { // Rollback UI if save fails showToast("Errore aggiornamento stato packing list.", "error"); trip.packingList[idx].packed = originalPackedState; // Ripristina stato locale const li = packingListUl?.querySelector(`li[data-item-id="${itemId}"]`); if (li) li.classList.toggle('packed', originalPackedState); const checkbox = packingListUl?.querySelector(`input[data-item-id="${itemId}"]`); if (checkbox) checkbox.checked = originalPackedState; } } };
    const handleImportPackingList = async (type) => { if (!currentTripId || !PREDEFINED_PACKING_LISTS[type] || !currentUserId) return; const tripIndex = trips.findIndex(t => t.id === currentTripId); if (tripIndex === -1) return; const trip = trips[tripIndex]; const predefined = PREDEFINED_PACKING_LISTS[type]; let addedItems = []; trip.packingList = trip.packingList || []; const currentLower = trip.packingList.map(i => (i?.name || '').toLowerCase()); predefined.forEach(predefItem => { if (!currentLower.includes(predefItem.name.toLowerCase())) { const newItem = { id: generateId('pack'), name: predefItem.name, packed: false, category: predefItem.category || 'Altro', quantity: predefItem.quantity || 1 }; trip.packingList.push(newItem); addedItems.push(newItem); } }); if (addedItems.length > 0) { trip.updatedAt = new Date().toISOString(); const success = await saveTripToFirestore(trip); if (success) { renderPackingList(trip.packingList); populatePackingCategoriesDatalist(trip.packingList); showToast(`${addedItems.length} oggetti aggiunti dalla lista "${type}"!`, 'success'); } else { // Rollback locale se salvataggio fallisce showToast("Errore salvataggio lista importata.", "error"); trip.packingList = trip.packingList.filter(item => !addedItems.some(added => added.id === item.id)); renderPackingList(trip.packingList); populatePackingCategoriesDatalist(trip.packingList); } } else { showToast(`Nessun nuovo oggetto da aggiungere dalla lista "${type}".`, 'info'); } };
    const addCostToBudget = async (category, description, cost) => { if (!currentTripId || cost === null || cost <= 0 || !currentUserId) return false; const tripIndex = trips.findIndex(t => t.id === currentTripId); if (tripIndex === -1) return false; const trip = trips[tripIndex]; const budgetItem = { id: generateId('budget'), category: category, description: description, estimated: cost, actual: null, paidBy: null, splitBetween: null }; trip.budget = trip.budget || { items: [], estimatedTotal: 0, actualTotal: 0 }; trip.budget.items = trip.budget.items || []; trip.budget.items.push(budgetItem); trip.budget.estimatedTotal = (trip.budget.estimatedTotal || 0) + cost; trip.updatedAt = new Date().toISOString(); const success = await saveTripToFirestore(trip); if (success) { renderBudget(trip.budget); return true; } else { // Rollback locale se salvataggio fallisce showToast("Errore aggiunta costo al budget.", "error"); trip.budget.items.pop(); trip.budget.estimatedTotal -= cost; renderBudget(trip.budget); return false; } };
    const handleCalculateAndAddTransportCost = async () => { if (!currentTripId) { showToast("Seleziona un viaggio.", "error"); return; } const trip = findTripById(currentTripId); if (!trip || !Array.isArray(trip.transportations)) { showToast("Errore dati trasporti.", "error"); return; } let totalCost = 0; trip.transportations.forEach(item => { const cost = Number(item?.cost || 0); if (!isNaN(cost) && cost > 0) { totalCost += cost; } }); if (totalCost <= 0) { showToast("Nessun costo trasporto valido da aggiungere.", "info"); return; } const success = await addCostToBudget("Trasporti", `Totale Costi Trasporti (al ${formatDate(new Date().toISOString().slice(0,10))})`, totalCost); if(success) { showToast(`Costo trasporti (${formatCurrency(totalCost)}) aggiunto al budget!`, 'success'); switchTab('budget-tab'); } };

    // ==========================================================================
    // == FUNZIONI RENDER LISTE ==
    // ==========================================================================
    const populateDatalists = (trip) => { if (!trip || !participantDatalist) return; participantDatalist.innerHTML = ''; (trip.participants || []).forEach(p => { const option = document.createElement('option'); option.value = p.name; participantDatalist.appendChild(option); }); populatePackingCategoriesDatalist(trip.packingList); };
    const populatePackingCategoriesDatalist = (packingList) => { if (!packingCategoryDatalist) return; packingCategoryDatalist.innerHTML = ''; const categories = new Set(DEFAULT_PACKING_CATEGORIES); (packingList || []).forEach(p => { if(p.category) categories.add(p.category); }); Array.from(categories).sort((a,b) => a.localeCompare(b, DEFAULT_LOCALE)).forEach(cat => { const option = document.createElement('option'); option.value = cat; packingCategoryDatalist.appendChild(option); }); };
    const renderParticipants = (participantsInput = []) => { const items = Array.isArray(participantsInput) ? participantsInput : []; if (!participantListUl) return; participantListUl.innerHTML = ''; if(noParticipantsItemsP) noParticipantsItemsP.style.display = items.length === 0 ? 'block' : 'none'; if (!Array.isArray(items)) return; items.sort((a, b) => (a?.name || '').localeCompare(b?.name || '', DEFAULT_LOCALE)); items.forEach(item => { if (!item || !item.id) return; const li = document.createElement('li'); li.dataset.itemId = item.id; li.innerHTML = ` <div class="item-details"> <strong><i class="fas fa-user fa-fw"></i> ${item.name || 'N/D'}</strong> ${item.notes ? `<span class="meta"><i class="fas fa-info-circle fa-fw"></i> ${item.notes}</span>`:''} ${item.extraInfo ? `<span class="meta"><i class="fas fa-sticky-note fa-fw"></i> ${item.extraInfo}</span>`:''} </div> <div class="item-actions"> <button class="btn-icon edit participant-edit-btn" data-item-id="${item.id}" title="Modifica"><i class="fas fa-edit"></i></button> <button class="btn-icon delete participant-delete-btn" data-item-id="${item.id}" title="Elimina"><i class="fas fa-trash-alt"></i></button> </div>`; participantListUl.appendChild(li); }); };
    const renderReminders = (remindersInput = []) => { let items = Array.isArray(remindersInput) ? remindersInput : []; if (!reminderListUl) return; reminderListUl.innerHTML = ''; if(noReminderItemsP) noReminderItemsP.style.display = items.length === 0 ? 'block' : 'none'; if (!Array.isArray(items)) return; const sortKey = currentSort.reminder; items.sort((a, b) => { if (sortKey === 'dueDate') { return (a?.dueDate || '9999-12-31').localeCompare(b?.dueDate || '9999-12-31'); } if (sortKey === 'status') { const statusOrder = { 'todo': 0, 'done': 1 }; return (statusOrder[a?.status] ?? 9) - (statusOrder[b?.status] ?? 9) || (a?.dueDate || '9999').localeCompare(b?.dueDate || '9999'); } return (a?.description || '').localeCompare(b?.description || '', DEFAULT_LOCALE); }); items.forEach(item => { if (!item || !item.id) return; const li = document.createElement('li'); li.dataset.itemId = item.id; li.classList.toggle('done', item.status === 'done'); const statusClass = item.status === 'done' ? 'done' : 'todo'; const statusText = item.status === 'done' ? 'FATTO' : 'DA FARE'; li.innerHTML = ` <div class="item-details"> <strong> <span class="status-indicator ${statusClass}">${statusText}</span> ${item.description || 'N/D'} </strong> ${item.dueDate ? `<span class="meta due-date"><i class="fas fa-calendar-alt fa-fw"></i> Scadenza: ${formatDate(item.dueDate)}</span>` : ''} </div> <div class="item-actions"> <button class="btn-icon edit reminder-edit-btn" data-item-id="${item.id}" title="Modifica"><i class="fas fa-edit"></i></button> <button class="btn-icon delete reminder-delete-btn" data-item-id="${item.id}" title="Elimina"><i class="fas fa-trash-alt"></i></button> </div>`; reminderListUl.appendChild(li); }); };
    const renderTransportations = (transportItemsInput) => { let items = Array.isArray(transportItemsInput) ? transportItemsInput : []; if (!transportListUl) return; transportListUl.innerHTML = ''; if(noTransportItemsP) noTransportItemsP.style.display = items.length === 0 ? 'block' : 'none'; if (!Array.isArray(items)) return; const sortKey = currentSort.transport; items.sort((a, b) => { if (sortKey === 'type') { return (a?.type || '').localeCompare(b?.type || '', DEFAULT_LOCALE) || (a?.departureDateTime || '').localeCompare(b?.departureDateTime || ''); } if (sortKey === 'cost') { return (b?.cost ?? -Infinity) - (a?.cost ?? -Infinity); } return (a?.departureDateTime || '').localeCompare(b?.departureDateTime || ''); }); items.forEach(item => { if (!item || !item.id) return; const li = document.createElement('li'); li.dataset.itemId = item.id; const iconClass = getTransportIcon(item.type); li.innerHTML = ` <div class="item-details"> <strong><i class="fas ${iconClass} fa-fw"></i> ${item.type}: ${item.description || 'N/D'}</strong> <span class="meta"><i class="fas fa-plane-departure fa-fw"></i> Da: ${item.departureLoc || '?'} (${formatDateTime(item.departureDateTime)})</span> <span class="meta"><i class="fas fa-plane-arrival fa-fw"></i> A: ${item.arrivalLoc || '?'} (${formatDateTime(item.arrivalDateTime)})</span> ${item.bookingRef ? `<span class="meta"><i class="fas fa-ticket-alt fa-fw"></i> Rif: ${item.bookingRef}</span>`:''} ${item.cost!==null ? `<span class="meta"><i class="fas fa-euro-sign fa-fw"></i> Costo: ${formatCurrency(item.cost)}</span>`:''} ${item.notes ? `<span class="meta"><i class="fas fa-info-circle fa-fw"></i> Note: ${item.notes}</span>`:''} ${item.link ? `<span class="meta"><i class="fas fa-link fa-fw"></i> Link: ${formatDisplayLink(item.link)}</span>`:''} </div> <div class="item-actions"> <button class="btn-icon edit transport-edit-btn" data-item-id="${item.id}" title="Modifica"><i class="fas fa-edit"></i></button> <button class="btn-icon delete transport-delete-btn" data-item-id="${item.id}" title="Elimina"><i class="fas fa-trash-alt"></i></button> </div>`; transportListUl.appendChild(li); }); };
    const getTransportIcon = (type) => { switch(type) { case 'Volo': return 'fa-plane-departure'; case 'Treno': return 'fa-train'; case 'Auto': return 'fa-car'; case 'Bus': return 'fa-bus-alt'; case 'Traghetto': return 'fa-ship'; case 'Metro/Mezzi Pubblici': return 'fa-subway'; case 'Taxi/Ride Sharing': return 'fa-taxi'; default: return 'fa-road'; } };
    const renderAccommodations = (accommodationsInput = []) => { const items = Array.isArray(accommodationsInput) ? accommodationsInput : []; if (!accommodationListUl) return; accommodationListUl.innerHTML = ''; if(noAccommodationItemsP) noAccommodationItemsP.style.display = items.length === 0 ? 'block' : 'none'; if (!Array.isArray(items)) return; items.sort((a, b) => (a?.checkinDateTime || '').localeCompare(b?.checkinDateTime || '')); items.forEach(item => { if (!item || !item.id) return; const li = document.createElement('li'); li.dataset.itemId = item.id; const mapLink = createMapLink(item.address); li.innerHTML = ` <div class="item-details"> <strong><i class="fas fa-hotel fa-fw"></i> ${item.name || 'N/D'} (${item.type || 'N/D'})</strong> ${item.address ? `<span class="meta"><i class="fas fa-map-marker-alt fa-fw"></i> ${item.address} ${mapLink ? `<a href="${mapLink}" target="_blank" rel="noopener noreferrer" class="btn-map-link" title="Mostra Mappa"><i class="fas fa-map-marked-alt"></i></a>` : ''}</span>`:''} <span class="meta"><i class="fas fa-calendar-check fa-fw"></i> Check-in: ${formatDateTime(item.checkinDateTime)}</span> <span class="meta"><i class="fas fa-calendar-times fa-fw"></i> Check-out: ${formatDateTime(item.checkoutDateTime)}</span> ${item.bookingRef ? `<span class="meta"><i class="fas fa-key fa-fw"></i> Rif: ${item.bookingRef}</span>`:''} ${item.cost!==null ? `<span class="meta"><i class="fas fa-euro-sign fa-fw"></i> Costo: ${formatCurrency(item.cost)}</span>`:''} ${item.notes ? `<span class="meta"><i class="fas fa-info-circle fa-fw"></i> Note: ${item.notes}</span>`:''} ${item.link ? `<span class="meta"><i class="fas fa-link fa-fw"></i> Link: ${formatDisplayLink(item.link)}</span>`:''} </div> <div class="item-actions"> <button class="btn-icon edit accommodation-edit-btn" data-item-id="${item.id}" title="Modifica"><i class="fas fa-edit"></i></button> <button class="btn-icon delete accommodation-delete-btn" data-item-id="${item.id}" title="Elimina"><i class="fas fa-trash-alt"></i></button> </div>`; accommodationListUl.appendChild(li); }); };
    const renderItinerary = (itineraryItemsInput) => { let items = Array.isArray(itineraryItemsInput) ? itineraryItemsInput : []; if (!itineraryListUl) return; itineraryListUl.innerHTML = ''; if(noItineraryItemsP) noItineraryItemsP.style.display = items.length === 0 ? 'block' : 'none'; if (!Array.isArray(items)) return; const searchTerm = currentSearchTerm.itinerary.toLowerCase(); if (searchTerm) { items = items.filter(item => (item.activity?.toLowerCase() || '').includes(searchTerm) || (item.location?.toLowerCase() || '').includes(searchTerm) || (item.notes?.toLowerCase() || '').includes(searchTerm)); } const sortKey = currentSort.itinerary; items.sort((a, b) => { if (sortKey === 'activity') { return (a?.activity || '').localeCompare(b?.activity || '', DEFAULT_LOCALE); } const dateTimeA = `${a?.day || ''} ${a?.time || ''}`; const dateTimeB = `${b?.day || ''} ${b?.time || ''}`; return dateTimeA.localeCompare(dateTimeB); }); items.forEach(item => { if (!item || !item.id) return; const li = document.createElement('li'); li.dataset.itemId = item.id; const mapLink = createMapLink(item.location); li.innerHTML = ` <div class="item-details"> <strong>${formatDate(item.day)} ${item.time?'('+item.time+')':''} - ${item.activity||'N/D'}</strong> ${item.location ? `<span class="meta"><i class="fas fa-map-marker-alt fa-fw"></i> ${item.location} ${mapLink ? `<a href="${mapLink}" target="_blank" rel="noopener noreferrer" class="btn-map-link" title="Mostra Mappa"><i class="fas fa-map-marked-alt"></i></a>` : ''}</span>`:''} ${item.bookingRef ? `<span class="meta"><i class="fas fa-ticket-alt fa-fw"></i> Rif: ${item.bookingRef}</span>`:''} ${item.cost!==null ? `<span class="meta"><i class="fas fa-euro-sign fa-fw"></i> Costo: ${formatCurrency(item.cost)}</span>`:''} ${item.notes ? `<span class="meta"><i class="fas fa-info-circle fa-fw"></i> Note: ${item.notes}</span>`:''} ${item.link ? `<span class="meta"><i class="fas fa-link fa-fw"></i> Link: ${formatDisplayLink(item.link)}</span>`:''} </div> <div class="item-actions"> <button class="btn-icon edit itinerary-edit-btn" data-item-id="${item.id}" title="Modifica"><i class="fas fa-edit"></i></button> <button class="btn-icon delete itinerary-delete-btn" data-item-id="${item.id}" title="Elimina"><i class="fas fa-trash-alt"></i></button> </div>`; itineraryListUl.appendChild(li); }); };
    const renderBudget = (budgetData) => { const safeData = budgetData && typeof budgetData === 'object' ? budgetData : { items: [], estimatedTotal: 0, actualTotal: 0 }; let items = Array.isArray(safeData.items) ? safeData.items : []; if (!budgetListUl) return; budgetListUl.innerHTML = ''; if(noBudgetItemsP) noBudgetItemsP.style.display = items.length === 0 ? 'block' : 'none'; let calcEst = 0; let calcAct = 0; if (!Array.isArray(items)) return; const sortKey = currentSort.budget; items.sort((a, b) => { if (sortKey === 'estimatedDesc') { return (b?.estimated ?? 0) - (a?.estimated ?? 0); } if (sortKey === 'actualDesc') { return (b?.actual ?? -Infinity) - (a?.actual ?? -Infinity); } if (sortKey === 'description') { return (a?.description || '').localeCompare(b?.description || '', DEFAULT_LOCALE); } return (a?.category||'').localeCompare(b?.category||'', DEFAULT_LOCALE); }); items.forEach(item => { if (!item || !item.id) return; const est = Number(item.estimated || 0); const act = item.actual === null || typeof item.actual === 'undefined' ? null : Number(item.actual || 0); if (!isNaN(est)) calcEst += est; if (act !== null && !isNaN(act)) calcAct += act; let cls = ''; if (act !== null && !isNaN(act) && est > 0) { if (act > est) cls = 'negative'; else if (act < est) cls = 'positive'; } const li = document.createElement('li'); li.dataset.itemId = item.id; li.innerHTML = ` <div class="item-details"> <strong>${item.category||'N/D'}: ${item.description||'N/D'}</strong> <span class="meta">Stimato: ${formatCurrency(est)} | Effettivo: <span class="${cls}">${act === null ? 'N/A' : formatCurrency(act)}</span></span> ${ (item.paidBy || item.splitBetween) ? `<span class="meta split-info"><i class="fas fa-user-friends fa-fw"></i> Pagato da: ${item.paidBy || '?'} / Diviso tra: ${item.splitBetween || '?'}</span>` : '' } </div> <div class="item-actions"> <button class="btn-icon edit budget-edit-btn" data-item-id="${item.id}" title="Modifica"><i class="fas fa-edit"></i></button> <button class="btn-icon delete budget-delete-btn" data-item-id="${item.id}" title="Elimina"><i class="fas fa-trash-alt"></i></button> </div>`; budgetListUl.appendChild(li); }); if(budgetTotalEstimatedStrong) budgetTotalEstimatedStrong.textContent = formatCurrency(calcEst); if(budgetTotalActualStrong) budgetTotalActualStrong.textContent = formatCurrency(calcAct); const diff = calcAct - calcEst; if (budgetDifferenceStrong) { budgetDifferenceStrong.textContent = formatCurrency(diff); budgetDifferenceStrong.className = ''; if (diff < 0) budgetDifferenceStrong.classList.add('positive'); else if (diff > 0) budgetDifferenceStrong.classList.add('negative'); } };
    const renderPackingList = (itemsInput = []) => { let items = Array.isArray(itemsInput) ? itemsInput : []; if (!packingListUl) return; packingListUl.innerHTML = ''; if(noPackingItemsP) noPackingItemsP.style.display = items.length === 0 ? 'block' : 'none'; if (!Array.isArray(items)) return; const searchTerm = currentSearchTerm.packing.toLowerCase(); if (searchTerm) { items = items.filter(item => (item.name?.toLowerCase() || '').includes(searchTerm) || (item.category?.toLowerCase() || '').includes(searchTerm)); } const sortKey = currentSort.packing; items.sort((a, b) => { if (sortKey === 'category') { return (a?.category || 'zzz').localeCompare(b?.category || 'zzz', DEFAULT_LOCALE) || (a?.name || '').localeCompare(b?.name || '', DEFAULT_LOCALE); } if (sortKey === 'status') { const packedA = a.packed ? 1 : 0; const packedB = b.packed ? 1 : 0; return packedA - packedB || (a?.name || '').localeCompare(b?.name || '', DEFAULT_LOCALE); } return (a?.name||'').localeCompare(b?.name||'', DEFAULT_LOCALE); }); if (sortKey === 'category') { const grouped = items.reduce((acc, item) => { const cat = item.category || 'Altro'; if (!acc[cat]) acc[cat] = []; acc[cat].push(item); return acc; }, {}); const sortedCategories = Object.keys(grouped).sort((a, b) => (a === 'Altro' ? 1 : b === 'Altro' ? -1 : a.localeCompare(b, DEFAULT_LOCALE))); packingListUl.innerHTML = ''; sortedCategories.forEach(category => { const groupDiv = document.createElement('div'); groupDiv.classList.add('packing-list-category-group'); const title = document.createElement('h5'); title.textContent = category; groupDiv.appendChild(title); const groupUl = document.createElement('ul'); groupUl.classList.add('item-list', 'packing-list', 'nested'); grouped[category].forEach(item => groupUl.appendChild(createPackingListItem(item))); groupDiv.appendChild(groupUl); packingListUl.appendChild(groupDiv); }); } else { items.forEach(item => packingListUl.appendChild(createPackingListItem(item))); } };
    const createPackingListItem = (item) => { if (!item || !item.id) return document.createDocumentFragment(); const li = document.createElement('li'); li.dataset.itemId = item.id; li.classList.toggle('packed', item.packed); li.innerHTML = ` <div class="form-check"> <input class="form-check-input packing-checkbox" type="checkbox" id="pack-${item.id}" data-item-id="${item.id}" ${item.packed?'checked':''}> <label class="form-check-label" for="pack-${item.id}"> ${item.name||'N/D'} ${item.quantity > 1 ? `<span class="packing-quantity">(x${item.quantity})</span>` : ''} </label> </div> <div class="item-details"> ${item.category && item.category !== 'Altro' ? `<span class="packing-category">${item.category}</span>` : ''} </div> <div class="item-actions"> <button class="btn-icon edit packing-edit-btn" data-item-id="${item.id}" title="Modifica"><i class="fas fa-edit"></i></button> <button class="btn-icon delete packing-delete-btn" data-item-id="${item.id}" title="Elimina"><i class="fas fa-trash-alt"></i></button> </div>`; return li; };

    // ==========================================================================
    // == FUNZIONI UI ==
    // ==========================================================================
    const switchTab = (tabId) => { if (!tabId) return; document.querySelectorAll(".tab-content").forEach(t => { t.style.display="none"; t.classList.remove("active"); }); document.querySelectorAll(".tab-link").forEach(l => l.classList.remove("active")); const c = document.getElementById(tabId); const l = tabsContainer?.querySelector(`.tab-link[data-tab="${tabId}"]`); if(c){ c.style.display="block"; setTimeout(()=>c.classList.add("active"),10); } if(l) l.classList.add("active"); };
    const toggleSearchButtonsVisibility = () => { if (!transportTypeSelect) return; const type = transportTypeSelect.value; const formVisible = addTransportItemForm && addTransportItemForm.style.display === 'block'; if(searchSkyscannerBtn) searchSkyscannerBtn.style.display = (formVisible && type === 'Volo') ? 'inline-flex' : 'none'; if(searchTrainlineBtn) searchTrainlineBtn.style.display = (formVisible && type === 'Treno') ? 'inline-flex' : 'none'; };
    const handleSortChange = (listType, selectElement) => { if (!currentTripId) return; const trip = findTripById(currentTripId); if (!trip) return; currentSort[listType] = selectElement.value; switch(listType) { case 'reminder': renderReminders(trip.reminders); break; case 'transport': renderTransportations(trip.transportations); break; case 'itinerary': renderItinerary(trip.itinerary); break; case 'budget': renderBudget(trip.budget); break; case 'packing': renderPackingList(trip.packingList); break; } saveLocalStorageAppState(); };
    const applyCurrentSortToControls = () => { if(reminderSortControl) reminderSortControl.value = currentSort.reminder; if(transportSortControl) transportSortControl.value = currentSort.transport; if(itinerarySortControl) itinerarySortControl.value = currentSort.itinerary; if(budgetSortControl) budgetSortControl.value = currentSort.budget; if(packingSortControl) packingSortControl.value = currentSort.packing; };
    const handleInternalSearch = (listType, inputElement) => { if (!currentTripId) return; const trip = findTripById(currentTripId); if (!trip) return; currentSearchTerm[listType] = inputElement.value.toLowerCase(); if (listType === 'itinerary') renderItinerary(trip.itinerary); else if (listType === 'packing') renderPackingList(trip.packingList); saveLocalStorageAppState(); };

    // --- NUOVA FUNZIONE PER GESTIRE MOSTRA/NASCONDI FORM ---
    const setupToggleFormButtons = () => {
        console.log("DEBUG: Setup Toggle Form Buttons...");
        const formToggleConfigs = [
            { showBtnId: 'show-add-participant-form-btn', formId: 'add-participant-form', hideBtnId: 'hide-add-participant-form-btn', listType: 'participant' },
            { showBtnId: 'show-add-reminder-form-btn', formId: 'add-reminder-item-form', hideBtnId: 'hide-add-reminder-form-btn', listType: 'reminder' },
            { showBtnId: 'show-add-transport-form-btn', formId: 'add-transport-item-form', hideBtnId: 'hide-add-transport-form-btn', listType: 'transport' },
            { showBtnId: 'show-add-accommodation-form-btn', formId: 'add-accommodation-item-form', hideBtnId: 'hide-add-accommodation-form-btn', listType: 'accommodation' },
            { showBtnId: 'show-add-itinerary-form-btn', formId: 'add-itinerary-item-form', hideBtnId: 'hide-add-itinerary-form-btn', listType: 'itinerary' },
        ];

        formToggleConfigs.forEach(({ showBtnId, formId, hideBtnId, listType }) => {
            const showBtn = document.getElementById(showBtnId);
            const form = document.getElementById(formId);
            const hideBtn = document.getElementById(hideBtnId);
            const formTitleEl = document.getElementById(`${listType}-form-title`); // Titolo dinamico

            if (showBtn && form) {
                showBtn.addEventListener('click', () => {
                    // Prima resetta per assicurarsi che sia in modalità "Aggiungi"
                    resetEditState(listType);
                    // Mostra il form
                    form.style.display = 'block';
                    showBtn.style.display = 'none'; // Nasconde il bottone "Aggiungi"
                    // Aggiorna il titolo del form
                    if (formTitleEl) {
                        let titleText = 'Nuovo Elemento'; // Default
                        switch(listType) {
                             case 'participant': titleText = 'Partecipante'; break;
                             case 'reminder': titleText = 'Promemoria'; break;
                             case 'transport': titleText = 'Trasporto'; break;
                             case 'accommodation': titleText = 'Alloggio'; break;
                             case 'itinerary': titleText = 'Attività'; break;
                        }
                         formTitleEl.textContent = `Aggiungi ${titleText}`;
                    }
                    form.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                     // Focus sul primo input del form (opzionale, migliora UX)
                     const firstInput = form.querySelector('input:not([type="hidden"]), select, textarea');
                     if (firstInput) firstInput.focus();
                });
            }

            if (hideBtn && form && showBtn) {
                 hideBtn.addEventListener('click', () => {
                    form.style.display = 'none';
                    showBtn.style.display = 'inline-flex'; // Mostra di nuovo il bottone "Aggiungi"
                    resetEditState(listType); // Pulisce il form
                 });
            }
        });
        console.log("DEBUG: Toggle Form Buttons Setup Complete.");
    }

    // ==========================================================================
    // == FUNZIONI RICERCA ESTERNA ==
    // ==========================================================================
    const handleSearchFlights = () => { const origin = transportDepartureLocInput.value.trim(); const dest = transportArrivalLocInput.value.trim(); const startRaw = transportDepartureDatetimeInput.value ? transportDepartureDatetimeInput.value.split('T')[0] : ''; const endRaw = transportArrivalDatetimeInput.value ? transportArrivalDatetimeInput.value.split('T')[0] : ''; const startSky = formatSkyscannerDate(startRaw); const endSky = formatSkyscannerDate(endRaw); if (!origin || !dest) { showToast("Inserisci Origine e Destinazione.", "warning"); return; } if (!startSky || !endSky) { showToast("Inserisci date valide.", "warning"); return; } if (startRaw > endRaw) { showToast("Data arrivo non valida.", "warning"); return; } const base = "https://www.skyscanner.it/trasporti/voli/"; const origCode = origin.toLowerCase().replace(/\s+/g, '-') || 'anywhere'; const destCode = dest.toLowerCase().replace(/\s+/g, '-') || 'anywhere'; const url = `${base}${origCode}/${destCode}/${startSky}/${endSky}/?rtn=1&adults=1&children=0&infants=0&cabinclass=economy&preferdirects=false`; window.open(url, '_blank', 'noopener,noreferrer'); };
    const handleSearchTrains = () => { const origin = transportDepartureLocInput.value.trim(); const dest = transportArrivalLocInput.value.trim(); const startRaw = transportDepartureDatetimeInput.value ? transportDepartureDatetimeInput.value.split('T')[0] : ''; const endRaw = transportArrivalDatetimeInput.value ? transportArrivalDatetimeInput.value.split('T')[0] : ''; if (!origin || !dest) { showToast("Inserisci Origine e Destinazione.", "warning"); return; } if (!startRaw || !endRaw) { showToast("Inserisci Date valide.", "warning"); return; } if (startRaw > endRaw) { showToast("Data arrivo non valida.", "warning"); return; } const base = "https://www.thetrainline.com/it/orari-treni/"; const origFmt = origin.toUpperCase().replace(/\s+/g, '-'); const destFmt = dest.toUpperCase().replace(/\s+/g, '-'); const url = `${base}${origFmt}-a-${destFmt}?departureDate=${startRaw}&returnDate=${endRaw}&adults=1`; window.open(url, '_blank', 'noopener,noreferrer'); };

    // ==========================================================================
    // == FUNZIONI DOWNLOAD / EMAIL / COPIA ==
    // ==========================================================================
    const handleEmailSummary = () => { if (!currentTripId) { showToast("Seleziona un viaggio.", "warning"); return; } const trip = findTripById(currentTripId); if (!trip) { showToast("Viaggio non trovato.", "error"); return; } let emailBody = `Riepilogo Viaggio: ${trip.name || 'S.N.'}\n========================\n\n`; emailBody += `Destinazione: ${trip.destination || 'N/D'}\n`; emailBody += `Date: ${formatDate(trip.startDate)} - ${formatDate(trip.endDate)}\n`; emailBody += `Partecipanti: ${(trip.participants || []).map(p => p.name).join(', ') || 'Nessuno'}\n\n`; emailBody += `Note: ${trip.notes || '-'}\n\n`; emailBody += `(Per i dettagli completi, chiedi il link)\n`; const emailSubject = `Riepilogo Viaggio: ${trip.name || 'S.N.'}`; const mailtoLink = `mailto:?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`; try { window.open(mailtoLink, '_blank'); } catch (e) { showToast("Impossibile aprire il client email.", "error"); } };
    const handleCopySummary = () => { if (!currentTripId) { showToast("Seleziona un viaggio.", "warning"); return; } const trip = findTripById(currentTripId); if (!trip) { showToast("Viaggio non trovato.", "error"); return; } let textToCopy = `✈️ *Riepilogo Viaggio: ${trip.name || 'S.N.'}*\n`; textToCopy += `📍 Destinazione: ${trip.destination || 'N/D'}\n`; textToCopy += `📅 Date: ${formatDate(trip.startDate)} - ${formatDate(trip.endDate)}\n`; textToCopy += `👥 Partecipanti: ${(trip.participants || []).map(p => p.name).join(', ') || 'Nessuno'}\n`; textToCopy += `📝 Note: ${trip.notes || '-'}\n`; textToCopy += `(Per i dettagli, chiedi il link)`; if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(textToCopy).then(() => showToast("Riepilogo copiato!", "success")).catch(err => { fallbackCopyTextToClipboard(textToCopy); }); } else { fallbackCopyTextToClipboard(textToCopy); } };
    const handleDownloadText = () => { if (!currentTripId) { showToast("Seleziona un viaggio.", "error"); return; } const trip = findTripById(currentTripId); if (!trip) { showToast("Viaggio non trovato.", "error"); return; } let content = ''; try { content = `Riepilogo Viaggio: ${trip.name || 'S.N.'}\n========================\n\n`; content += `**INFO**\nOrigine: ${trip.originCity || 'N/D'}\nDest.: ${trip.destination || 'N/D'}\nDate: ${formatDate(trip.startDate)} - ${formatDate(trip.endDate)}\nNote: ${trip.notes || '-'}\nExtra Info: ${trip.extraInfo || '-'}\n\n`; content += `**PARTECIPANTI** (${(trip.participants || []).length})\n`; (trip.participants || []).slice().sort((a,b)=>(a?.name||'').localeCompare(b?.name||'')).forEach(p => { content += `- ${p.name}${p.notes ? ' ('+p.notes+')':''}${p.extraInfo ? ' [Extra: '+p.extraInfo+']':''}\n`}); if((trip.participants || []).length === 0) content += "Nessuno\n"; content += "\n"; content += `**PROMEMORIA** (${(trip.reminders || []).length})\n`; (trip.reminders || []).slice().sort((a,b)=>(a?.dueDate || '9999').localeCompare(b?.dueDate || '9999')).forEach(r => { content += `- [${r.status==='done'?'X':' '}] ${r.description}${r.dueDate ? ' (Scad: '+formatDate(r.dueDate)+')':''}\n`}); if((trip.reminders || []).length === 0) content += "Nessuno\n"; content += "\n"; content += `**TRASPORTI** (${(trip.transportations || []).length})\n`; (trip.transportations || []).slice().sort((a,b)=>(a?.departureDateTime||'').localeCompare(b?.departureDateTime||'')).forEach(i => { content += `- ${i.type} (${i.description}): Da ${i.departureLoc||'?'} (${formatDateTime(i.departureDateTime)}) a ${i.arrivalLoc||'?'} (${formatDateTime(i.arrivalDateTime)})${i.cost!==null ? ' Costo: '+formatCurrency(i.cost):''}${i.bookingRef ? ' Rif: '+i.bookingRef:''}${i.notes ? ' Note: '+i.notes:''}${i.link ? ' Link: '+i.link:''}\n` }); if((trip.transportations || []).length === 0) content += "Nessuno\n"; content += "\n"; content += `**ALLOGGI** (${(trip.accommodations || []).length})\n`; (trip.accommodations || []).slice().sort((a,b)=>(a?.checkinDateTime||'').localeCompare(b?.checkinDateTime||'')).forEach(i => { content += `- ${i.name} (${i.type}): ${i.address||'?'}. CheckIn: ${formatDateTime(i.checkinDateTime)}, CheckOut: ${formatDateTime(i.checkoutDateTime)}${i.cost!==null ? ' Costo: '+formatCurrency(i.cost):''}${i.bookingRef ? ' Rif: '+i.bookingRef:''}${i.notes ? ' Note: '+i.notes:''}${i.link ? ' Link: '+i.link:''}\n` }); if((trip.accommodations || []).length === 0) content += "Nessuno\n"; content += "\n"; content += `**ITINERARIO** (${(trip.itinerary || []).length})\n`; (trip.itinerary || []).slice().sort((a,b)=>{const d=(a?.day||'').localeCompare(b?.day||''); return d!==0?d:(a?.time||'').localeCompare(b?.time||'');}).forEach(i => { content += `- ${formatDate(i.day)}${i.time?' ('+i.time+')':''} ${i.activity}${i.location?' @'+i.location:''}${i.bookingRef?' [Rif:'+i.bookingRef+']':''}${i.cost!==null?' Costo:'+formatCurrency(i.cost):''}${i.notes?' ('+i.notes+')':''}${i.link?' Link:'+i.link:''}\n` }); if((trip.itinerary || []).length === 0) content += "Nessuno\n"; content += "\n"; content += `**BUDGET** (${(trip.budget?.items || []).length} voci)\n`; (trip.budget?.items || []).slice().sort((a,b)=>(a?.category||'').localeCompare(b?.category||'')).forEach(i => { content += `- ${i.category}: ${i.description} (Est: ${formatCurrency(i.estimated)}, Act: ${i.actual===null?'N/A':formatCurrency(i.actual)})${i.paidBy ? ' Pagato da: '+i.paidBy:''}${i.splitBetween ? ' Diviso: '+i.splitBetween:''}\n` }); if((trip.budget?.items || []).length > 0) content += `> Tot Est: ${formatCurrency(trip.budget?.estimatedTotal||0)}, Tot Act: ${formatCurrency(trip.budget?.actualTotal||0)}, Diff: ${formatCurrency((trip.budget?.actualTotal||0) - (trip.budget?.estimatedTotal||0))}\n`; else content += "Nessuna spesa\n"; content += "\n"; content += `**PACKING LIST** (${(trip.packingList || []).length})\n`; (trip.packingList || []).slice().sort((a,b)=>(a?.category||'zzz').localeCompare(b?.category||'zzz') || (a?.name||'').localeCompare(b?.name||'')).forEach(i => { content += `- [${i.packed?'X':' '}] ${i.name}${i.quantity>1?' (x'+i.quantity+')':''} [${i.category||'Altro'}]\n` }); if((trip.packingList || []).length === 0) content += "Lista vuota\n"; } catch (genError) { console.error("Errore generazione contenuto TXT:", genError); showToast("Errore preparazione file di testo.", "error"); return; } try { const blob = new Blob([content],{type:'text/plain;charset=utf-8'}); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `Viaggio-${(trip.name||'SN').replace(/[^a-z0-9]/gi,'_')}.txt`; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url); } catch (downloadError) { console.error("Errore download TXT:", downloadError); showToast("Errore download file di testo.", "error"); } };
    const handleDownloadExcel = () => { if (!currentTripId) { showToast("Seleziona un viaggio.", "error"); return; } const trip = findTripById(currentTripId); if (!trip) { showToast("Viaggio non trovato.", "error"); return; } if (typeof XLSX === 'undefined') { showToast("Errore: libreria Excel non caricata.", "error"); return; } let wb; try { wb = XLSX.utils.book_new(); const cf = '#,##0.00 €'; const nf = '#,##0'; const summary = [ ["Voce","Dettaglio"], ["Viaggio", trip.name||'S.N.'], ["Origine", trip.originCity||'N/D'], ["Dest.", trip.destination||'N/D'], ["Periodo", `${formatDate(trip.startDate)} - ${formatDate(trip.endDate)}`], ["Note", trip.notes||'-'], ["Extra Info", trip.extraInfo||'-'], [], ["Budget Est.",{t:'n',v:trip.budget?.estimatedTotal||0,z:cf}], ["Budget Act.",{t:'n',v:trip.budget?.actualTotal||0,z:cf}], ["Diff.",{t:'n',v:(trip.budget?.actualTotal||0)-(trip.budget?.estimatedTotal||0),z:cf}], [], ["# Partecipanti", (trip.participants||[]).length], ["# Promemoria", (trip.reminders||[]).length], ["# Trasporti", (trip.transportations||[]).length], ["# Alloggi", (trip.accommodations||[]).length], ["# Itin.", (trip.itinerary||[]).length], ["# Budget", (trip.budget?.items||[]).length], ["# Packing", (trip.packingList||[]).length]]; const wsSum = XLSX.utils.aoa_to_sheet(summary); wsSum['!cols']=[{wch:15},{wch:50}]; XLSX.utils.book_append_sheet(wb, wsSum, "Riepilogo"); const partH = ["Nome", "Note", "Extra Info"]; const partD = (trip.participants||[]).slice().sort((a,b)=>(a?.name||'').localeCompare(b?.name||'')).map(p=>[p.name, p.notes, p.extraInfo]); const wsPart = XLSX.utils.aoa_to_sheet([partH, ...partD]); wsPart['!cols']=[{wch:30},{wch:40},{wch:40}]; XLSX.utils.book_append_sheet(wb, wsPart, "Partecipanti"); const remH = ["Stato", "Descrizione", "Scadenza"]; const remD = (trip.reminders||[]).slice().sort((a,b)=>(a?.dueDate || '9999').localeCompare(b?.dueDate || '9999')).map(r => [r.status === 'done' ? 'Fatto' : 'Da Fare', r.description, formatDate(r.dueDate)]); const wsRem = XLSX.utils.aoa_to_sheet([remH, ...remD]); wsRem['!cols'] = [{wch:10}, {wch:50}, {wch:12}]; XLSX.utils.book_append_sheet(wb, wsRem, "Promemoria"); const th = ["Tipo","Desc.","Da Luogo","Da Data/Ora","A Luogo","A Data/Ora","Rif.","Costo","Note","Link/File"]; const td = (trip.transportations||[]).slice().sort((a,b)=>(a?.departureDateTime||'').localeCompare(b?.departureDateTime||'')).map(i=>[i.type, i.description, i.departureLoc, formatDateTime(i.departureDateTime), i.arrivalLoc, formatDateTime(i.arrivalDateTime), i.bookingRef, i.cost===null?null:{t:'n',v:i.cost,z:cf}, i.notes, i.link]); const wsT = XLSX.utils.aoa_to_sheet([th, ...td]); wsT['!cols']=[{wch:12},{wch:25},{wch:18},{wch:16},{wch:18},{wch:16},{wch:15},{wch:12},{wch:25},{wch:30}]; XLSX.utils.book_append_sheet(wb, wsT, "Trasporti"); const ah = ["Nome","Tipo","Indirizzo","CheckIn","CheckOut","Rif.","Costo","Note","Link/File"]; const ad = (trip.accommodations||[]).slice().sort((a,b)=>(a?.checkinDateTime||'').localeCompare(b?.checkinDateTime||'')).map(i=>[i.name,i.type,i.address,formatDateTime(i.checkinDateTime),formatDateTime(i.checkoutDateTime),i.bookingRef,i.cost===null?null:{t:'n',v:i.cost,z:cf},i.notes, i.link]); const wsA = XLSX.utils.aoa_to_sheet([ah,...ad]); wsA['!cols']=[{wch:25},{wch:10},{wch:35},{wch:16},{wch:16},{wch:20},{wch:12},{wch:30},{wch:30}]; XLSX.utils.book_append_sheet(wb, wsA, "Alloggi"); const ih = ["Giorno","Ora","Attività","Luogo","Rif. Pren.","Costo","Note","Link/File"]; const idata = (trip.itinerary||[]).slice().sort((a,b)=>{const d=(a?.day||'').localeCompare(b?.day||''); return d!==0?d:(a?.time||'').localeCompare(b?.time||'');}).map(i=>[formatDate(i.day),i.time,i.activity,i.location,i.bookingRef,i.cost===null?null:{t:'n',v:i.cost,z:cf},i.notes, i.link]); const wsI = XLSX.utils.aoa_to_sheet([ih, ...idata]); wsI['!cols']=[{wch:10},{wch:8},{wch:30},{wch:25},{wch:20},{wch:12},{wch:30},{wch:30}]; XLSX.utils.book_append_sheet(wb, wsI, "Itinerario"); const bh = ["Cat.","Desc.","Est. (€)","Act. (€)", "Pagato Da", "Diviso Tra"]; const bd = (trip.budget?.items||[]).slice().sort((a,b)=>(a?.category||'').localeCompare(b?.category||'')).map(i=>[i.category,i.description,{t:'n',v:i.estimated||0,z:cf},i.actual===null?null:{t:'n',v:i.actual,z:cf}, i.paidBy, i.splitBetween]); bd.push([],["TOTALI","", {t:'n',v:trip.budget?.estimatedTotal||0,z:cf}, {t:'n',v:trip.budget?.actualTotal||0,z:cf}, "", ""]); const wsB = XLSX.utils.aoa_to_sheet([bh, ...bd]); wsB['!cols']=[{wch:15},{wch:35},{wch:15},{wch:15},{wch:20},{wch:20}]; XLSX.utils.book_append_sheet(wb, wsB, "Budget"); const ph = ["Categoria", "Oggetto", "Qtà", "Fatto?"]; const pd = (trip.packingList||[]).slice().sort((a,b)=>(a?.category||'zzz').localeCompare(b?.category||'zzz') || (a?.name||'').localeCompare(b?.name||'')).map(i=>[i.category, i.name, {t:'n', v:i.quantity, z:nf}, i.packed?'Sì':'No']); const wsP = XLSX.utils.aoa_to_sheet([ph, ...pd]); wsP['!cols']=[{wch:20}, {wch:40},{wch:5},{wch:8}]; XLSX.utils.book_append_sheet(wb, wsP, "Packing List"); } catch (buildError) { console.error("Errore generazione Excel:", buildError); showToast("Errore preparazione file Excel.", "error"); return; } try { const fn = `Viaggio-${(trip.name||'SN').replace(/[^a-z0-9]/gi,'_')}.xlsx`; XLSX.writeFile(wb, fn); } catch (writeError) { console.error("Errore scrittura file Excel:", writeError); showToast("Errore download file Excel.", "error"); } };

    // ==========================================================================
    // == FUNZIONI CONDIVISIONE VIA FIREBASE ==
    // ==========================================================================
    const handleShareViaLink = async () => { if (!db) { showToast("Condivisione non disponibile.", "error"); return; } if (!currentTripId || !currentUserId) { showToast("Seleziona un viaggio e accedi.", "warning"); return; } if (currentUser && currentUser.isAnonymous) { showToast("Registrati o accedi per condividere.", "warning"); return; } const originalTrip = findTripById(currentTripId); if (!originalTrip) { showToast("Viaggio non trovato.", "error"); return; } const shareButton = shareTripBtn; if (shareButton) { shareButton.disabled = true; shareButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Preparando...'; } let dataToSend = null; let shareLink = null; try { const cleanTripBase = JSON.parse(JSON.stringify(originalTrip)); dataToSend = { name: cleanTripBase.name || 'S.N.', originCity: cleanTripBase.originCity || null, destination: cleanTripBase.destination || null, notes: cleanTripBase.notes || null, extraInfo: cleanTripBase.extraInfo || null, startDate: toTimestampOrNull(cleanTripBase.startDate), endDate: toTimestampOrNull(cleanTripBase.endDate), participants: (cleanTripBase.participants || []).map(p => ({ name: p.name || '?', notes: p.notes || null, extraInfo: p.extraInfo || null })), reminders: (cleanTripBase.reminders || []).map(r => ({ description: r.description || '?', dueDate: toTimestampOrNull(r.dueDate), status: r.status || 'todo' })), transportations: (cleanTripBase.transportations || []).map(t => ({ type: t.type || 'Altro', description: t.description || '?', departureLoc: t.departureLoc || null, departureDateTime: toTimestampOrNull(t.departureDateTime), arrivalLoc: t.arrivalLoc || null, arrivalDateTime: toTimestampOrNull(t.arrivalDateTime), bookingRef: t.bookingRef || null, cost: safeToNumberOrNull(t.cost), notes: t.notes || null, link: t.link || null })), accommodations: (cleanTripBase.accommodations || []).map(a => ({ name: a.name || '?', type: a.type || 'Altro', address: a.address || null, checkinDateTime: toTimestampOrNull(a.checkinDateTime), checkoutDateTime: toTimestampOrNull(a.checkoutDateTime), bookingRef: a.bookingRef || null, cost: safeToNumberOrNull(a.cost), notes: a.notes || null, link: a.link || null })), itinerary: (cleanTripBase.itinerary || []).map(i => ({ day: i.day || null, time: i.time || null, activity: i.activity || '?', location: i.location || null, bookingRef: i.bookingRef || null, cost: safeToNumberOrNull(i.cost), notes: i.notes || null, link: i.link || null })), budget: { items: (cleanTripBase.budget?.items || []).map(b => ({ category: b.category || 'Altro', description: b.description || '?', estimated: safeToNumberOrNull(b.estimated), actual: safeToNumberOrNull(b.actual), paidBy: b.paidBy || null, splitBetween: b.splitBetween || null })) }, packingList: (cleanTripBase.packingList || []).map(p => ({ name: p.name || '?', category: p.category || 'Altro', quantity: safeToPositiveIntegerOrDefault(p.quantity), packed: p.packed || false })), sharedAt: Timestamp.now() }; if (shareButton) shareButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando...'; const docRef = await addDoc(collection(db, "sharedTrips"), dataToSend); shareLink = `${window.location.origin}${window.location.pathname}?shareId=${docRef.id}`; console.log("Viaggio condiviso con ID:", docRef.id); if (navigator.share) { const shareData = { title: `Viaggio: ${originalTrip.name || 'S.N.'}`, text: `Dettagli viaggio "${originalTrip.name || 'S.N.'}": Dest: ${originalTrip.destination || 'N/D'}, Date: ${formatDate(originalTrip.startDate)} - ${formatDate(originalTrip.endDate)}. Apri il link per importare!`, url: shareLink, }; if (shareButton) shareButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Apro...'; await navigator.share(shareData); showToast("Pannello condivisione aperto.", "success"); } else { prompt("Copia questo link:", shareLink); showToast("Link condivisione generato!", "success"); } } catch (error) { if (error.name === 'AbortError') { showToast("Condivisione annullata.", "info"); } else { console.error('Errore condivisione:', error); showToast("Errore condivisione.", "error"); if (shareLink) { prompt("Errore apertura condivisione. Copia manualmente:", shareLink); } } } finally { if (shareButton) { shareButton.disabled = false; shareButton.innerHTML = '<i class="fas fa-share-alt"></i> Condividi'; } } };
    const cloneAndRegenerateTripIds = (tripDataFromFirebaseShared) => { const convertTimestampsToStringsImport = (data) => { if (data === null || typeof data !== 'object') return data; if (data instanceof Timestamp) { try { return data.toDate().toISOString(); } catch (e) { return null; } } if (Array.isArray(data)) { return data.map(item => convertTimestampsToStringsImport(item)); } const newData = {}; for (const key in data) { if (Object.prototype.hasOwnProperty.call(data, key)) { newData[key] = convertTimestampsToStringsImport(data[key]); } } return newData; }; const tripDataWithStrings = convertTimestampsToStringsImport(tripDataFromFirebaseShared); const newTrip = JSON.parse(JSON.stringify(tripDataWithStrings)); delete newTrip.id; newTrip.isTemplate = false; newTrip.sharedAt = null; const regenerateSubItemsIds = (items) => { if (!Array.isArray(items)) return []; return items.map(item => ({ ...item, id: generateId(item?.id?.split('_')[0] || 'item') })); }; newTrip.participants = regenerateSubItemsIds(newTrip.participants); newTrip.reminders = regenerateSubItemsIds(newTrip.reminders); newTrip.transportations = regenerateSubItemsIds(newTrip.transportations); newTrip.accommodations = regenerateSubItemsIds(newTrip.accommodations); newTrip.itinerary = regenerateSubItemsIds(newTrip.itinerary); if (!newTrip.budget) newTrip.budget = { items: [], estimatedTotal: 0, actualTotal: 0 }; newTrip.budget.items = regenerateSubItemsIds(newTrip.budget.items); newTrip.packingList = regenerateSubItemsIds(newTrip.packingList); let calcEst = 0, calcAct = 0; (newTrip.budget.items || []).forEach(item => { const est = safeToNumberOrNull(item.estimated); const act = safeToNumberOrNull(item.actual); if (est !== null) calcEst += est; if (act !== null) calcAct += act; }); newTrip.budget.estimatedTotal = calcEst; newTrip.budget.actualTotal = calcAct; return newTrip; }
    const handleImportSharedTrip = async (sharedTripData) => { if (!sharedTripData || !currentUserId) { showToast("Errore import: utente non loggato o dati mancanti.", "error"); return; } try { const newTripObjectForUser = cloneAndRegenerateTripIds(sharedTripData); newTripObjectForUser.createdAt = Timestamp.now(); const newTripId = await saveTripToFirestore(newTripObjectForUser); if (newTripId) { const savedTrip = processTripDataFromFirestore(newTripId, prepareTripDataForFirestore({...newTripObjectForUser, id: newTripId})); trips.unshift(savedTrip); renderTripList(); selectTrip(newTripId); showToast(`Viaggio "${newTripObjectForUser.name || 'S.N.'}" importato!`, "success"); } } catch (error) { console.error("Errore import viaggio:", error); showToast("Errore durante l'importazione.", "error"); } };
    const checkForSharedTrip = async () => { if (!db) { return; } const urlParams = new URLSearchParams(window.location.search); const shareId = urlParams.get('shareId'); if (shareId) { console.log("Trovato shareId:", shareId); const currentUrl = new URL(window.location.href); currentUrl.searchParams.delete('shareId'); history.replaceState(null, '', currentUrl.toString()); if (!currentUserId) { showToast("Accedi o registrati per importare il viaggio.", "warning"); try { sessionStorage.setItem('pendingShareId', shareId); } catch(e) { console.warn("Impossibile salvare pendingShareId in sessionStorage.") } return; } showToast("Recupero viaggio condiviso...", "info"); try { const docRef = doc(db, "sharedTrips", shareId); const docSnap = await getDoc(docRef); if (docSnap.exists()) { const sharedTripData = docSnap.data(); showConfirmationModal( 'Importa Viaggio Condiviso', `Importare il viaggio "${sharedTripData.name || 'S.N.'}"?`, () => handleImportSharedTrip(sharedTripData) ); } else { showToast("Viaggio condiviso non trovato o scaduto.", "error"); } } catch (error) { console.error("Errore recupero viaggio condiviso:", error); showToast("Errore recupero viaggio condiviso.", "error"); } } else { if (currentUserId) { try { const pendingId = sessionStorage.getItem('pendingShareId'); if (pendingId) { sessionStorage.removeItem('pendingShareId'); const fakeUrl = new URL(window.location.href); fakeUrl.searchParams.set('shareId', pendingId); window.history.pushState({}, '', fakeUrl); // Mette l'ID nell'URL per il prossimo check await checkForSharedTrip(); } } catch(e) { console.warn("Errore lettura pendingShareId da sessionStorage.") } } } };

    // ==========================================================================
    // == FUNZIONI CALCOLO BILANCIO SPESE ==
    // ==========================================================================
    const calculateExpenseBalance = () => { if (!currentTripId) return { error: "Nessun viaggio selezionato." }; const trip = findTripById(currentTripId); if (!trip) return { error: "Viaggio non trovato." }; if (!Array.isArray(trip.participants) || trip.participants.length === 0) { return { error: "Aggiungi partecipanti per calcolare il bilancio." }; } if (!trip.budget || !Array.isArray(trip.budget.items) || trip.budget.items.length === 0) { return { balances: {}, totalSharedExpense: 0, errors: ["Nessuna spesa inserita nel budget."] }; } const participantNames = trip.participants.map(p => p.name.trim()); const balances = {}; participantNames.forEach(name => balances[name] = 0); let totalSharedExpense = 0; const calculationErrors = []; trip.budget.items.forEach((item, index) => { const actualCost = safeToNumberOrNull(item.actual); // Usa costo effettivo! if (actualCost === null || actualCost <= 0 || !item.splitBetween || !item.paidBy) { // Ignora se non c'è costo effettivo, divisione o pagante return; } const payerName = item.paidBy.trim(); const splitRule = item.splitBetween.trim(); if (!participantNames.includes(payerName)) { calculationErrors.push(`Riga Spesa ${index + 1} ("${item.description || 'N/D'}"): Pagante "${payerName}" non trovato tra i partecipanti.`); return; } let sharers = []; if (splitRule.toLowerCase() === 'tutti') { sharers = [...participantNames]; } else { const potentialSharers = splitRule.split(',').map(name => name.trim()).filter(name => name); const invalidSharers = potentialSharers.filter(name => !participantNames.includes(name)); if (invalidSharers.length > 0) { calculationErrors.push(`Riga Spesa ${index + 1} ("${item.description || 'N/D'}"): Partecipanti divisione non validi: ${invalidSharers.join(', ')}.`); sharers = potentialSharers.filter(name => participantNames.includes(name)); } else { sharers = potentialSharers; } } if (sharers.length === 0) { if (!calculationErrors.some(err => err.includes(`Riga Spesa ${index + 1}`))) { // Evita duplicati per la stessa riga calculationErrors.push(`Riga Spesa ${index + 1} ("${item.description || 'N/D'}"): Nessun partecipante valido specificato per la divisione.`); } return; } const costPerSharer = actualCost / sharers.length; totalSharedExpense += actualCost; // Somma solo le spese effettive condivise balances[payerName] += actualCost; // Chi paga riceve indietro l'intera somma (inizialmente) sharers.forEach(sharerName => { balances[sharerName] -= costPerSharer; // Ogni partecipante alla divisione "paga" la sua quota }); }); // Arrotonda i saldi finali a 2 decimali per evitare errori floating point for (const name in balances) { balances[name] = Math.round(balances[name] * 100) / 100; } return { balances, totalSharedExpense, errors: calculationErrors }; };
    const renderBalanceResults = (result) => { if (!balanceResultsContainer || !balanceResultsUl || !balanceSummaryDiv || !balanceErrorMessageP) return; balanceResultsUl.innerHTML = ''; balanceSummaryDiv.innerHTML = ''; balanceErrorMessageP.textContent = ''; balanceErrorMessageP.style.display = 'none'; balanceResultsContainer.style.display = 'block'; if (result.error) { balanceErrorMessageP.textContent = `Errore: ${result.error}`; balanceErrorMessageP.style.display = 'block'; balanceResultsContainer.style.display = 'none'; return; } const { balances, totalSharedExpense, errors } = result; let hasBalancesToShow = false; Object.entries(balances).forEach(([name, balance]) => { if(Math.abs(balance) > 0.01) { // Usa una tolleranza piccola per evitare 0.00 dovuto ad arrotondamenti hasBalancesToShow = true; const li = document.createElement('li'); const nameSpan = document.createElement('span'); const balanceSpan = document.createElement('span'); nameSpan.textContent = name; balanceSpan.textContent = formatCurrency(Math.abs(balance)); if (balance > 0) { li.classList.add('positive-balance'); nameSpan.textContent += " (Deve Ricevere)"; } else { li.classList.add('negative-balance'); nameSpan.textContent += " (Deve Dare)"; } li.appendChild(nameSpan); li.appendChild(balanceSpan); balanceResultsUl.appendChild(li); } }); if (!hasBalancesToShow && errors.length === 0) { const li = document.createElement('li'); li.textContent = "Tutti i conti sono pari o non ci sono spese da dividere."; balanceResultsUl.appendChild(li); } else if (!hasBalancesToShow && errors.length > 0) { const li = document.createElement('li'); li.textContent = "Nessun saldo da regolare (ma ci sono errori nel calcolo)."; balanceResultsUl.appendChild(li); } balanceSummaryDiv.textContent = `Spesa Totale Condivisa Considerata: ${formatCurrency(totalSharedExpense)}`; if (errors.length > 0) { balanceErrorMessageP.innerHTML = `<strong>Attenzione, errori o omissioni nel calcolo:</strong><br>` + errors.join('<br>'); balanceErrorMessageP.style.display = 'block'; } };

     // ==========================================================================
     // == FUNZIONI DI AUTENTICAZIONE ==
     // ==========================================================================
     const showAuthSuccess = (message) => { if (authSuccessDiv) { authSuccessDiv.textContent = message; authSuccessDiv.style.display = message ? 'block' : 'none'; if (message && authErrorDiv) authErrorDiv.style.display = 'none'; } };
     const handleSignUp = async (e) => { e.preventDefault(); const emailInput = signupForm.querySelector('#signup-email'); const passwordInput = signupForm.querySelector('#signup-password'); const confirmInput = signupForm.querySelector('#signup-password-confirm'); const email = emailInput.value.trim(); const password = passwordInput.value.trim(); const confirm = confirmInput.value.trim(); if (!email || !password || !confirm) { showAuthError("Compila tutti i campi."); return; } if (password.length < 6) { showAuthError("La password deve essere di almeno 6 caratteri."); return; } if (password !== confirm) { showAuthError("Le password non coincidono."); return; } showAuthError(''); showAuthSuccess(''); signupForm.querySelectorAll('input, button').forEach(el => el.disabled = true); try { const userCredential = await createUserWithEmailAndPassword(auth, email, password); await sendEmailVerification(userCredential.user); showAuthSuccess("Registrazione completata! Controlla la tua email per il link di verifica."); showToast(`Benvenuto ${userCredential.user.email}! Email di verifica inviata.`, 'success'); } catch (error) { showAuthError(getFirebaseErrorMessage(error)); } finally { signupForm.querySelectorAll('input, button').forEach(el => el.disabled = false); } };
     const handleSignIn = async (e) => { e.preventDefault(); const emailInput = loginForm.querySelector('#login-email'); const passwordInput = loginForm.querySelector('#login-password'); const email = emailInput.value.trim(); const password = passwordInput.value.trim(); if (!email || !password) { showAuthError("Inserisci email e password."); return; } showAuthError(''); showAuthSuccess(''); loginForm.querySelectorAll('input, button').forEach(el => el.disabled = true); try { const userCredential = await signInWithEmailAndPassword(auth, email, password); showToast(`Bentornato ${userCredential.user.email}!`, 'success'); } catch (error) { showAuthError(getFirebaseErrorMessage(error)); } finally { loginForm.querySelectorAll('input, button').forEach(el => el.disabled = false); } };
     const handleSignOut = async () => { try { await signOut(auth); showToast("Logout effettuato.", 'info'); } catch (error) { console.error("Errore logout:", error); showToast("Errore logout.", "error"); } };
     const handlePasswordResetRequest = async (e) => { e.preventDefault(); if (!passwordResetForm) return; const emailInput = passwordResetForm.querySelector('#reset-email'); const email = emailInput?.value.trim(); if (!email) { showAuthError("Inserisci l'indirizzo email."); return; } showAuthError(''); showAuthSuccess(''); passwordResetForm.querySelectorAll('input, button').forEach(el => el.disabled = true); try { await sendPasswordResetEmail(auth, email); showAuthSuccess(`Se esiste un account per ${email}, è stata inviata un'email con le istruzioni per reimpostare la password.`); passwordResetForm.style.display = 'none'; loginForm.style.display = 'block'; } catch (error) { // Mostra comunque messaggio generico per non rivelare se email esiste console.error("Errore invio reset password (ma mostro messaggio generico):", error); showAuthSuccess(`Se esiste un account per ${email}, è stata inviata un'email con le istruzioni per reimpostare la password.`); passwordResetForm.style.display = 'none'; loginForm.style.display = 'block'; } finally { passwordResetForm.querySelectorAll('input, button').forEach(el => el.disabled = false); } };
     const handleAnonymousSignIn = async () => { showAuthError(''); showAuthSuccess(''); if(anonymousSigninBtn) anonymousSigninBtn.disabled = true; try { await signInAnonymously(auth); showToast("Accesso come ospite effettuato.", "info"); } catch (error) { showAuthError(getFirebaseErrorMessage(error)); } finally { if(anonymousSigninBtn) anonymousSigninBtn.disabled = false; } };
     const handleResendVerificationEmail = async () => { if (!auth.currentUser || auth.currentUser.isAnonymous) return; if (auth.currentUser.emailVerified) { showToast("Email già verificata.", "info"); return; } if(resendVerificationBtn) resendVerificationBtn.disabled = true; if(resendVerificationBtnNotice) resendVerificationBtnNotice.disabled = true; try { await sendEmailVerification(auth.currentUser); showToast("Email di verifica reinviata. Controlla la tua casella di posta (anche spam).", "success"); } catch (error) { showToast("Errore reinvio email. Riprova tra poco.", "error"); showAuthError(getFirebaseErrorMessage(error)); } finally { // Riabilita dopo un po' per evitare spam setTimeout(() => { if(resendVerificationBtn) resendVerificationBtn.disabled = false; if(resendVerificationBtnNotice) resendVerificationBtnNotice.disabled = false; }, 60000); // 60 secondi } };
     const showAuthError = (message) => { if (authErrorDiv) { authErrorDiv.textContent = message; authErrorDiv.style.display = message ? 'block' : 'none'; if(message && authSuccessDiv) authSuccessDiv.style.display = 'none'; } };
     const getFirebaseErrorMessage = (error) => { switch (error.code) { case 'auth/invalid-email': return 'Formato email non valido.'; case 'auth/user-disabled': return 'Account disabilitato.'; case 'auth/user-not-found': return 'Utente non trovato.'; case 'auth/wrong-password': return 'Password errata.'; case 'auth/email-already-in-use': return 'Email già registrata.'; case 'auth/weak-password': return 'Password troppo debole (min. 6 caratteri).'; case 'auth/operation-not-allowed': return 'Operazione non permessa.'; case 'auth/network-request-failed': return 'Errore di rete. Controlla la connessione.'; case 'auth/too-many-requests': return 'Troppi tentativi. Riprova più tardi.'; default: console.error("Errore Firebase Auth:", error); return 'Errore imprevisto. Riprova.'; } };

     // ===== Gestione Cambio Stato Autenticazione =====
     const updateUIBasedOnAuthState = async (user) => { currentUser = user; if (user) { currentUserId = user.uid; if(authContainer) authContainer.style.display = 'none'; if(appMainContainer) appMainContainer.style.display = 'flex'; if (user.isAnonymous) { if(userEmailDisplay) userEmailDisplay.textContent = "Ospite"; if(logoutBtn) logoutBtn.innerHTML = '<i class="fas fa-user-plus"></i> Registrati/Accedi'; if(resendVerificationBtn) resendVerificationBtn.style.display = 'none'; if(emailVerificationNotice) emailVerificationNotice.style.display = 'none'; if(anonymousUserPrompt) anonymousUserPrompt.style.display = 'block'; if(linkAccountPrompt) linkAccountPrompt.onclick = (e) => { e.preventDefault(); handleSignOut(); }; } else { if(userEmailDisplay) userEmailDisplay.textContent = user.email; if(logoutBtn) logoutBtn.innerHTML = '<i class="fas fa-sign-out-alt"></i> Logout'; if(anonymousUserPrompt) anonymousUserPrompt.style.display = 'none'; if (!user.emailVerified) { if(emailVerificationNotice) emailVerificationNotice.style.display = 'flex'; if(resendVerificationBtn) resendVerificationBtn.style.display = 'inline-flex'; if(resendVerificationBtnNotice) resendVerificationBtnNotice.style.display = 'inline-flex'; } else { if(emailVerificationNotice) emailVerificationNotice.style.display = 'none'; if(resendVerificationBtn) resendVerificationBtn.style.display = 'none'; if(resendVerificationBtnNotice) resendVerificationBtnNotice.style.display = 'none'; } } if(authErrorDiv) authErrorDiv.style.display = 'none'; if(authSuccessDiv) authSuccessDiv.style.display = 'none'; await loadUserTrips(user.uid); loadLocalStorageAppState(); applyCurrentSortToControls(); if(currentTripId && findTripById(currentTripId)) { selectTrip(currentTripId); } else { deselectTrip(); } await checkForSharedTrip(); } else { currentUser = null; currentUserId = null; if(authContainer) authContainer.style.display = 'flex'; if(appMainContainer) appMainContainer.style.display = 'none'; if(userEmailDisplay) userEmailDisplay.textContent = ''; if(passwordResetForm) passwordResetForm.style.display = 'none'; if(loginForm) loginForm.style.display = 'block'; if(signupForm) signupForm.style.display = 'none'; if(signupPromptP) signupPromptP.style.display = 'block'; clearAppDataUI(); } };

     // --- MODIFICATA PER USARE resetEditState ---
     const clearAppDataUI = () => {
         console.log("DEBUG: Pulizia UI...");
         trips = [];
         currentTripId = null;
         // Resetta lo stato di modifica per tutti i tipi
         Object.keys(editingItemId).forEach(resetEditState);

         if (tripListUl) tripListUl.innerHTML = '';
         if (noTripsMessage) noTripsMessage.style.display = 'block';
         if (tripDetailsAreaDiv) tripDetailsAreaDiv.style.display = 'none';
         if (welcomeMessageDiv) welcomeMessageDiv.style.display = 'none'; // Nasconde il welcome se si fa logout
         if (tripInfoForm) tripInfoForm.reset();

         // Resetta le liste
         document.querySelectorAll('.item-list').forEach(ul => ul.innerHTML = '');
         document.querySelectorAll('.item-list-container p[id^="no-"]').forEach(p => p.style.display = 'block');

         // Resetta i totali del budget
         if(budgetTotalEstimatedStrong) budgetTotalEstimatedStrong.textContent = formatCurrency(0);
         if(budgetTotalActualStrong) budgetTotalActualStrong.textContent = formatCurrency(0);
         if(budgetDifferenceStrong) {
             budgetDifferenceStrong.textContent = formatCurrency(0);
             budgetDifferenceStrong.className = '';
         }
         // Nasconde risultati bilancio
         if(balanceResultsContainer) balanceResultsContainer.style.display = 'none';

         // Disabilita i bottoni di azione viaggio
         if(downloadTextBtn) downloadTextBtn.disabled = true;
         if(downloadExcelBtn) downloadExcelBtn.disabled = true;
         if(deleteTripBtn) deleteTripBtn.disabled = true;
         if(shareTripBtn) shareTripBtn.disabled = true;
         if(emailSummaryBtn) emailSummaryBtn.disabled = true;
         if(copySummaryBtn) copySummaryBtn.disabled = true;

         if(tripTitleH2) tripTitleH2.textContent = 'Dettagli Viaggio';
         console.log("DEBUG: Pulizia UI completata.");
     };

    // ==========================================================================
    // == GESTIONE STATO UI (LocalStorage) ==
    // ==========================================================================
    const APP_STATE_KEY = 'travelPlannerPro_UIState_v1';
    const saveLocalStorageAppState = () => { try { const stateToSave = { userId: currentUserId, selectedTripId: (currentUserId && currentTripId) ? currentTripId : null, currentSort: currentSort, currentSearchTerm: currentSearchTerm, }; localStorage.setItem(APP_STATE_KEY, JSON.stringify(stateToSave)); } catch (e) { console.warn("Errore salvataggio stato UI in localStorage:", e); } };
    const loadLocalStorageAppState = () => { try { const savedState = localStorage.getItem(APP_STATE_KEY); if (savedState) { const state = JSON.parse(savedState); if (currentUserId && state.userId === currentUserId && state.selectedTripId) { const tripExists = trips.some(t => t.id === state.selectedTripId); if(tripExists){ currentTripId = state.selectedTripId; } else { console.log(`Viaggio salvato (${state.selectedTripId}) non trovato per l'utente corrente, deseleziono.`); currentTripId = null; } } else { currentTripId = null; } if (state.currentSort) currentSort = state.currentSort; if (state.currentSearchTerm) currentSearchTerm = state.currentSearchTerm; } else { currentTripId = null; } } catch (e) { console.warn("Errore caricamento stato UI da localStorage:", e); currentTripId = null; } };

    // ==========================================================================
    // == INIZIALIZZAZIONE E EVENT LISTENER ==
    // ==========================================================================
    const executeConfirmAction = () => { if (typeof confirmActionCallback === 'function') { try { confirmActionCallback(); } catch(err) { console.error("Errore callback conferma:", err); showToast("Errore esecuzione azione.", "error"); } } closeConfirmationModal(); };
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

        // Listener per submit dei form item
        const formsToListen = [
            { form: 'add-participant-form', type: 'participant' },
            { form: 'add-reminder-item-form', type: 'reminder' },
            { form: 'add-transport-item-form', type: 'transport' },
            { form: 'add-accommodation-item-form', type: 'accommodation' },
            { form: 'add-itinerary-item-form', type: 'itinerary' },
            { form: 'add-budget-item-form', type: 'budget' },
            { form: 'add-packing-item-form', type: 'packing' },
        ];
        formsToListen.forEach(item => {
            const formElement = document.getElementById(item.form);
            if (formElement) {
                formElement.onsubmit = (e) => handleItemFormSubmit(e, item.type);
            }
        });

        // Listener per bottoni Annulla Modifica
        const cancelButtons = [
            { btn: 'participant-cancel-edit-btn', type: 'participant'},
            { btn: 'reminder-cancel-edit-btn', type: 'reminder'},
            { btn: 'transport-cancel-edit-btn', type: 'transport'},
            { btn: 'accommodation-cancel-edit-btn', type: 'accommodation'},
            { btn: 'itinerary-cancel-edit-btn', type: 'itinerary'},
            { btn: 'budget-cancel-edit-btn', type: 'budget'},
            { btn: 'packing-cancel-edit-btn', type: 'packing'},
        ];
        cancelButtons.forEach(item => {
            const btnElement = document.getElementById(item.btn);
            if(btnElement) {
                btnElement.onclick = () => resetEditState(item.type);
            }
        });

        // Listener delegato per azioni su item (Edit, Delete, Checkbox Packing)
        if (tripDetailsAreaDiv) {
            tripDetailsAreaDiv.addEventListener('click', (e) => { // Usiamo addEventListener per più flessibilità
                const editBtn = e.target.closest('.btn-icon.edit');
                const deleteBtn = e.target.closest('.btn-icon.delete');
                const packingCheckbox = e.target.closest('.packing-checkbox');

                if (editBtn) {
                    const itemId = editBtn.dataset.itemId;
                    if(!itemId) return;
                    const typeMatch = Array.from(editBtn.classList).find(cls => cls.endsWith('-edit-btn'));
                    const type = typeMatch ? typeMatch.replace('-edit-btn', '') : null;
                    if(type && Object.keys(editingItemId).includes(type)) { // Verifica che il tipo sia valido
                         startEditItem(type, itemId);
                    } else {
                         console.warn("Tipo non riconosciuto o non gestito per bottone edit:", typeMatch);
                    }
                } else if (deleteBtn) {
                    const itemId = deleteBtn.dataset.itemId;
                    if(!itemId) return;
                    const typeMatch = Array.from(deleteBtn.classList).find(cls => cls.endsWith('-delete-btn'));
                    const type = typeMatch ? typeMatch.replace('-delete-btn', '') : null;
                     if(type && Object.keys(editingItemId).includes(type)) { // Verifica che il tipo sia valido
                         handleDeleteItem(type, itemId);
                     } else {
                          console.warn("Tipo non riconosciuto o non gestito per bottone delete:", typeMatch);
                     }
                } else if (packingCheckbox) {
                    const itemId = packingCheckbox.dataset.itemId;
                    if(itemId) handleTogglePacked(itemId, packingCheckbox.checked);
                }
            });
        }

        // Listener per import liste predefinite Packing
        if (predefinedChecklistsContainer) {
            predefinedChecklistsContainer.addEventListener('click', (e) => { // Usiamo addEventListener
                const btn = e.target.closest('button[data-checklist]');
                if (btn?.dataset.checklist) handleImportPackingList(btn.dataset.checklist);
            });
        }

        // Listener Modals
        if (newTripModal) {
            if(createTripConfirmBtn) createTripConfirmBtn.onclick = handleCreateTripConfirm;
            newTripModal.querySelectorAll('.modal-close').forEach(btn => btn.onclick = closeNewTripModal);
            if(newTripNameInput) newTripNameInput.onkeypress = (e) => { if(e.key === 'Enter' && !createTripConfirmBtn.disabled) handleCreateTripConfirm(); };
            newTripModal.onclick = (e) => { if (e.target === newTripModal) closeNewTripModal(); };
        }
        if (confirmationModal) {
            const confirmBtn = confirmationModal.querySelector('#confirmation-modal-confirm-btn');
            const closeBtns = confirmationModal.querySelectorAll('.modal-close');
            if(confirmBtn) { confirmBtn.onclick = executeConfirmAction; }
            closeBtns.forEach(btn => btn.onclick = closeConfirmationModal);
            confirmationModal.onclick = (e) => { if (e.target === confirmationModal) closeConfirmationModal(); };
        }

        // Altri Listener Specifici
        if (addTransportTotalToBudgetBtn) { addTransportTotalToBudgetBtn.onclick = handleCalculateAndAddTransportCost; }
        if (searchSkyscannerBtn) { searchSkyscannerBtn.onclick = handleSearchFlights; }
        if (searchTrainlineBtn) { searchTrainlineBtn.onclick = handleSearchTrains; }
        if(transportTypeSelect) { transportTypeSelect.onchange = toggleSearchButtonsVisibility; }

        // Listener Controlli Ordinamento
        const sortControls = [
            { ctrl: 'reminder-sort-control', type: 'reminder' },
            { ctrl: 'transport-sort-control', type: 'transport' },
            { ctrl: 'itinerary-sort-control', type: 'itinerary' },
            { ctrl: 'budget-sort-control', type: 'budget' },
            { ctrl: 'packing-sort-control', type: 'packing' },
        ];
        sortControls.forEach(item => {
            const ctrlElement = document.getElementById(item.ctrl);
            if(ctrlElement) {
                ctrlElement.onchange = (e) => handleSortChange(item.type, e.target);
            }
        });

        // Listener Ricerca Interna
        if(searchItineraryInput) searchItineraryInput.oninput = (e) => handleInternalSearch('itinerary', e.target);
        if(searchPackingInput) searchPackingInput.oninput = (e) => handleInternalSearch('packing', e.target);

        // Listener Calcolo Bilancio
        if(calculateBalanceBtn) {
            calculateBalanceBtn.onclick = () => {
                const balanceResult = calculateExpenseBalance();
                renderBalanceResults(balanceResult);
            };
        }

        // Listener Reinvia Email Verifica
        if(resendVerificationBtn) resendVerificationBtn.onclick = handleResendVerificationEmail;
        if(resendVerificationBtnNotice) resendVerificationBtnNotice.onclick = handleResendVerificationEmail;

        // Setup per mostrare/nascondere i form
        setupToggleFormButtons(); // <<-- CHIAMATA ALLA NUOVA FUNZIONE

        console.log("DEBUG: App listeners aggiunti.");
    };

    // ==========================================================================
    // == PUNTO DI INGRESSO PRINCIPALE ==
    // ==========================================================================
    // Listener UI Autenticazione
    if (showSignupLink && signupForm && loginForm && signupPromptP) {
        showSignupLink.addEventListener('click', (event) => {
            event.preventDefault();
            signupForm.style.display = 'block';
            loginForm.style.display = 'none'; // Nasconde login quando si mostra signup
            signupPromptP.style.display = 'none'; // Nasconde il prompt "Non hai un account?"
            if(passwordResetForm) passwordResetForm.style.display = 'none';
            showAuthError('');
            showAuthSuccess('');
        });
     } else {
        console.warn("Elementi signup/login mancanti per toggle.")
     }

    if (forgotPasswordLink && passwordResetForm && loginForm) {
         forgotPasswordLink.addEventListener('click', (e) => {
             e.preventDefault();
             passwordResetForm.style.display = 'block';
             loginForm.style.display = 'none';
             if(signupForm) signupForm.style.display = 'none';
             if(signupPromptP) signupPromptP.style.display = 'block'; // Mostra di nuovo il prompt signup? Forse no.
             showAuthError('');
             showAuthSuccess('');
         });
     }
     if (cancelResetBtn && passwordResetForm && loginForm) {
         cancelResetBtn.addEventListener('click', () => {
             passwordResetForm.style.display = 'none';
             loginForm.style.display = 'block';
             // Ri-mostra signup form se era quello visibile prima? Potrebbe complicare. Lasciamo login.
             if(signupForm) signupForm.style.display = 'none';
             if(signupPromptP) signupPromptP.style.display = 'block';
             showAuthError('');
             showAuthSuccess('');
         });
     }

    if(passwordResetForm) passwordResetForm.addEventListener('submit', handlePasswordResetRequest);
    if(anonymousSigninBtn) anonymousSigninBtn.addEventListener('click', handleAnonymousSignIn);
    if(loginForm) loginForm.addEventListener('submit', handleSignIn);
    if(signupForm) signupForm.addEventListener('submit', handleSignUp);
    if(logoutBtn) logoutBtn.addEventListener('click', handleSignOut);

    // Listener Stato Autenticazione Firebase
    if (auth) {
        let listenersInitialized = false;
        onAuthStateChanged(auth, async (user) => {
            console.log("Auth state changed. User:", user ? (user.isAnonymous ? `Anon ${user.uid}`: user.uid) : 'None');
            await updateUIBasedOnAuthState(user);
            // Inizializza i listener dell'app SOLO dopo che l'utente è loggato
            // e solo la prima volta che l'utente si logga in questa sessione.
            if (user && !listenersInitialized) {
                 initAppEventListeners();
                 listenersInitialized = true;
                 console.log("Listeners dell'app inizializzati.");
            } else if (!user) {
                // Se l'utente fa logout, listenersInitialized viene resettato a false.
                // Non è necessario rimuovere esplicitamente i listener se l'intera area dell'app
                // viene nascosta e la logica viene rieseguita al login successivo.
                listenersInitialized = false;
                console.log("Utente sloggato, stato listener resettato.");
            }
        });
    } else {
        console.error("Auth non inizializzato.");
        showAuthError("Errore critico: impossibile inizializzare l'autenticazione.");
        if(authContainer) authContainer.style.display = 'flex';
        if(appMainContainer) appMainContainer.style.display = 'none';
    }

}); // Fine DOMContentLoaded
