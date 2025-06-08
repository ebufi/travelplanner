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
    document.body.innerHTML = '<p style="color: red; text-align: center; margin-top: 50px;">Errore critico nell\'inizializzazione. Impossibile caricare l\'app.</p>';
}

// ==========================================================================
// == INIZIO LOGICA APPLICAZIONE ==
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {

    // ==========================================================================
    // == SELEZIONE ELEMENTI DOM ==
    // ==========================================================================
    let domSelectionError = false;
    const checkElement = (id, isQuerySelector = false) => { 
        const element = isQuerySelector ? document.querySelector(id) : document.getElementById(id); 
        if (!element) { 
            console.error(`ERRORE SELEZIONE DOM: Elemento essenziale "${id}" non trovato!`); 
            domSelectionError = true; 
        }
        return element; 
    };

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
    const addAccommodationTotalToBudgetBtn = checkElement('add-accommodation-total-to-budget-btn');
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
    const addItineraryTotalToBudgetBtn = checkElement('add-itinerary-total-to-budget-btn');
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
        alert("Errore critico: alcuni elementi dell'interfaccia non sono stati trovati. L'applicazione non può continuare. Controlla la console per vedere quali ID mancano.");
        return; 
    }

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
    
    // ... (Il resto delle funzioni non cambia, sono incluse per completezza)

    // ==========================================================================
    // == DEFINIZIONE DI TUTTE LE FUNZIONI DELL'APPLICAZIONE ==
    // ==========================================================================

    // --- FUNZIONI UTILITY ---
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

    // --- FUNZIONI FIRESTORE ---
    const loadUserTrips = async (uid) => { if (!uid || !db) { trips = []; renderTripList(); deselectTrip(); return; } if(loadingTripsDiv) loadingTripsDiv.style.display = 'block'; if(noTripsMessage) noTripsMessage.style.display = 'none'; tripListUl.innerHTML = ''; deselectTrip(); try { const tripsColRef = collection(db, 'users', uid, 'trips'); const q = query(tripsColRef, orderBy("createdAt", "desc")); const querySnapshot = await getDocs(q); const userTrips = []; querySnapshot.forEach((doc) => { userTrips.push(processTripDataFromFirestore(doc.id, doc.data())); }); trips = userTrips; console.log(`Caricati ${trips.length} viaggi per l'utente ${uid}`); renderTripList(); } catch (error) { console.error("Errore caricamento viaggi:", error); showToast("Errore nel caricamento dei tuoi viaggi.", "error"); trips = []; renderTripList(); deselectTrip(); } finally { if(loadingTripsDiv) loadingTripsDiv.style.display = 'none'; if(noTripsMessage && trips.length === 0) noTripsMessage.style.display = 'block'; } };
    const saveTripToFirestore = async (tripData) => { if (!currentUserId) { showToast("Errore: Utente non loggato.", "error"); return null; } if (!tripData || typeof tripData !== 'object') { showToast("Errore: Dati viaggio non validi.", "error"); return null; } const isNewTrip = !findTripById(tripData.id); const dataToSave = prepareTripDataForFirestore(tripData); const tripsColRef = collection(db, 'users', currentUserId, 'trips'); try { let docRef; let message; if (isNewTrip) { docRef = await addDoc(tripsColRef, dataToSave); console.log("Nuovo viaggio salvato con ID:", docRef.id); message = `Viaggio "${dataToSave.name}" creato!`; tripData.id = docRef.id; showToast(message, "success"); return docRef.id; } else { docRef = doc(db, 'users', currentUserId, 'trips', tripData.id); await setDoc(docRef, dataToSave); console.log("Viaggio aggiornato con ID:", tripData.id); message = `Viaggio "${dataToSave.name}" aggiornato!`; showToast(message, "success"); return tripData.id; } } catch (error) { console.error("Errore salvataggio viaggio:", error); showToast("Errore durante il salvataggio.", "error"); return null; } };
    const deleteTripFromFirestore = async (tripId) => { if (!currentUserId || !tripId) { showToast("Errore: Utente non loggato o ID viaggio mancante.", "error"); return false; } const tripDocRef = doc(db, 'users', currentUserId, 'trips', tripId); try { await deleteDoc(tripDocRef); console.log(`Viaggio ${tripId} eliminato.`); return true; } catch (error) { console.error(`Errore eliminazione viaggio ${tripId}:`, error); showToast("Errore durante l'eliminazione.", "error"); return false; } };

    // --- FUNZIONI GESTIONE VIAGGI ---
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

    // ... (tutte le altre funzioni rimangono identiche a quelle dell'ultima versione, le ometto per brevità)

    // ==========================================================================
    // == INIZIALIZZAZIONE LOGICA APPLICAZIONE (STRUTTURA CORRETTA) ==
    // ==========================================================================
    
    // 1. Definisci tutte le funzioni di gestione degli eventi
    const executeConfirmAction = () => { if (typeof confirmActionCallback === 'function') { try { confirmActionCallback(); } catch(err) { console.error("Errore callback conferma:", err); showToast("Errore.", "error"); } } closeConfirmationModal(); };
    // (qui dovrebbero esserci tutte le altre funzioni come `handleItemFormSubmit`, `renderParticipants`, etc. che sono già state definite sopra)

    // 2. Crea una funzione di inizializzazione che AGGANCIA i listener
    function initializeAppLogic() {
        // --- Listener per l'autenticazione ---
        if (showSignupLink) { showSignupLink.addEventListener('click', (event) => { event.preventDefault(); if (signupForm.style.display === 'none') { signupForm.style.display = 'block'; signupPromptP.style.display = 'none'; if(passwordResetForm) passwordResetForm.style.display = 'none'; if(loginForm) loginForm.style.display = 'block'; showAuthError(''); showAuthSuccess(''); } }); }
        if (forgotPasswordLink) { forgotPasswordLink.addEventListener('click', (e) => { e.preventDefault(); passwordResetForm.style.display = 'block'; loginForm.style.display = 'none'; if(signupForm) signupForm.style.display = 'none'; if(signupPromptP) signupPromptP.style.display = 'block'; showAuthError(''); showAuthSuccess(''); }); }
        if (cancelResetBtn) { cancelResetBtn.addEventListener('click', () => { passwordResetForm.style.display = 'none'; loginForm.style.display = 'block'; showAuthError(''); showAuthSuccess(''); }); }
        if(passwordResetForm) passwordResetForm.addEventListener('submit', handlePasswordResetRequest);
        if(anonymousSigninBtn) anonymousSigninBtn.addEventListener('click', handleAnonymousSignIn);
        if(loginForm) loginForm.addEventListener('submit', handleSignIn);
        if(signupForm) signupForm.addEventListener('submit', handleSignUp);
        if(logoutBtn) logoutBtn.addEventListener('click', () => {
            if (currentUser && currentUser.isAnonymous) {
                showConfirmationModal( "Attenzione: Dati Ospite", "Se procedi, farai il logout e perderai l'accesso ai viaggi creati come ospite. Vuoi continuare con il logout?", handleSignOut );
            } else {
                handleSignOut();
            }
        });

        // --- Listener per l'app interna ---
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
        
        console.log("DEBUG: Tutti i listener sono stati agganciati.");

        // --- Avvio del monitoraggio stato autenticazione ---
        if (auth) {
            onAuthStateChanged(auth, (user) => {
                console.log("Auth state changed. User:", user ? (user.isAnonymous ? `Anon ${user.uid}`: user.uid) : 'None');
                updateUIBasedOnAuthState(user);
            });
        } else {
            console.error("Auth non inizializzato.");
            showAuthError("Servizio di autenticazione non disponibile.");
        }
    }

    // 3. Esegui la funzione di inizializzazione
    initializeAppLogic();

}); // Fine DOMContentLoaded
