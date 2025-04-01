// ==========================================================================
// == FIREBASE MODULE IMPORTS & INITIALIZATION ==
// ==========================================================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-app.js"; // Mantieni versione aggiornata
// ===== NUOVO: Importazioni Auth =====
import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged // FONDAMENTALE
} from "https://www.gstatic.com/firebasejs/11.5.0/firebase-auth.js";
// ===== FINE NUOVO =====
import {
    getFirestore, collection, addDoc, doc, getDoc, Timestamp,
    query, where, orderBy, getDocs, writeBatch, deleteDoc, updateDoc, serverTimestamp,
    onSnapshot, // Per aggiornamenti realtime
    limit // Utile per deleteSubcollection
} from "https://www.gstatic.com/firebasejs/11.5.0/firebase-firestore.js";
// import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-analytics.js";

// La tua configurazione Firebase (Assicurati siano corrette e la API Key protetta!)
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
let auth; // ===== NUOVO: Istanza Auth =====
// let analytics;
try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app); // ===== NUOVO: Ottieni istanza Auth =====
    // analytics = getAnalytics(app);
    console.log("Firebase inizializzato correttamente (incluso Auth).");
} catch (error) {
    console.error("Errore inizializzazione Firebase:", error);
    alert("Impossibile inizializzare le funzionalità principali. Controlla la console per errori.");
    // Disabilita bottoni che dipendono da Firebase se init fallisce
    document.addEventListener('DOMContentLoaded', () => {
         document.body.innerHTML = '<h2 style="color: red; text-align: center; margin-top: 50px;">Errore critico di inizializzazione. Impossibile caricare l\'app.</h2>';
    });
}


// ==========================================================================
// == INIZIO LOGICA APPLICAZIONE ==
// ==========================================================================

// ===== NUOVO: Variabile Globale per l'Utente Corrente =====
let currentUserId = null;
let currentTripId = null; // Manteniamo questo stato per il viaggio selezionato
let currentTripDataCache = null; // Cache per i dati del viaggio selezionato
let unsubscribeTripListListener = null; // Per scollegare listener Firestore lista viaggi
let unsubscribeSubcollectionListeners = []; // Array per listeners sottocollezioni

// ===== NUOVO: Riferimenti Elementi DOM per Auth (Assicurati che l'HTML li contenga!) =====
const authContainer = document.getElementById('auth-container');
const appContainer = document.querySelector('.app-container');
const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const loginEmailInput = document.getElementById('login-email');
const loginPasswordInput = document.getElementById('login-password');
const loginError = document.getElementById('login-error');
const signupEmailInput = document.getElementById('signup-email');
const signupPasswordInput = document.getElementById('signup-password');
const signupPasswordConfirmInput = document.getElementById('signup-password-confirm');
const signupError = document.getElementById('signup-error');
const showSignupLink = document.getElementById('show-signup');
const showLoginLink = document.getElementById('show-login');
const userStatusDiv = document.getElementById('user-status');
const userEmailDisplay = document.getElementById('user-email-display');
const logoutBtn = document.getElementById('logout-btn');

// ===== INIZIO: Elementi DOM Esistenti (verranno ottenuti DENTRO DOMContentLoaded) =====
let tripListUl, newTripBtn, createFromTemplateBtn, searchTripInput, noTripsMessage,
    welcomeMessageDiv, tripDetailsAreaDiv, tripTitleH2, downloadTextBtn, downloadExcelBtn,
    deleteTripBtn, shareTripBtn, emailSummaryBtn, copySummaryBtn, tabsContainer,
    tripInfoForm, editTripIdInput, tripNameInput, tripOriginCityInput, tripDestinationInput,
    tripStartDateInput, tripEndDateInput, tripIsTemplateCheckbox, tripNotesTextarea, tripExtraInfoTextarea,
    addParticipantForm, editParticipantIdInput, participantNameInput, participantNotesInput, participantExtraInfoTextarea,
    participantListUl, noParticipantsItemsP, participantSubmitBtn, participantCancelEditBtn, participantDatalist,
    addReminderItemForm, editReminderItemIdInput, reminderDescriptionInput, reminderDueDateInput, reminderStatusSelect,
    reminderListUl, noReminderItemsP, reminderSubmitBtn, reminderCancelEditBtn, reminderSortControl,
    addTransportItemForm, editTransportItemIdInput, transportTypeSelect, transportDescriptionInput, transportDepartureLocInput,
    transportDepartureDatetimeInput, transportArrivalLocInput, transportArrivalDatetimeInput, transportBookingRefInput,
    transportCostInput, transportNotesInput, transportLinkInput, transportListUl, noTransportItemsP,
    transportSubmitBtn, transportCancelEditBtn, searchSkyscannerBtn, searchTrainlineBtn, addTransportTotalToBudgetBtn, transportSortControl,
    addAccommodationItemForm, editAccommodationItemIdInput, accommodationNameInput, accommodationTypeSelect, accommodationAddressInput,
    accommodationCheckinInput, accommodationCheckoutInput, accommodationBookingRefInput, accommodationCostInput,
    accommodationNotesInput, accommodationLinkInput, accommodationListUl, noAccommodationItemsP,
    accommodationSubmitBtn, accommodationCancelEditBtn,
    addItineraryItemForm, editItineraryItemIdInput, itineraryDayInput, itineraryTimeInput, itineraryActivityInput,
    itineraryLocationInput, itineraryBookingRefInput, itineraryCostInput, itineraryNotesInput, itineraryLinkInput,
    itineraryListUl, noItineraryItemsP, itinerarySubmitBtn, itineraryCancelEditBtn, searchItineraryInput, itinerarySortControl,
    addBudgetItemForm, editBudgetItemIdInput, budgetCategorySelect, budgetDescriptionInput, budgetEstimatedInput,
    budgetActualInput, budgetPaidByInput, budgetSplitBetweenInput, budgetListUl, budgetTotalEstimatedStrong,
    budgetTotalActualStrong, budgetDifferenceStrong, noBudgetItemsP, budgetSubmitBtn, budgetCancelEditBtn, budgetSortControl,
    predefinedChecklistsContainer, addPackingItemForm, editPackingItemIdInput, packingItemNameInput, packingItemCategoryInput,
    packingItemQuantityInput, packingListUl, noPackingItemsP, packingSubmitBtn, packingCancelEditBtn,
    searchPackingInput, packingSortControl, packingCategoryDatalist,
    calculateBalanceBtn, balanceResultsContainer, balanceResultsUl, balanceSummaryDiv, balanceErrorMessageP,
    newTripModal, newTripNameInput, newTripErrorP, createTripConfirmBtn,
    selectTemplateModal, templateSelectInput, selectTemplateErrorP, createFromTemplateConfirmBtn,
    confirmationModal, confirmationModalTitle, confirmationModalMessage, confirmationModalConfirmBtn,
    toastContainer;
// ===== FINE: Elementi DOM Esistenti =====

// ==========================================================================
// == Costanti e Configurazioni Applicazione ==
// ==========================================================================
const DEFAULT_CURRENCY = 'EUR';
const DEFAULT_LOCALE = 'it-IT';
const GOOGLE_MAPS_BASE_URL = 'https://www.google.com/maps/search/?api=1&query=';
const PREDEFINED_PACKING_LISTS = { beach: [ { name: "Costume da bagno", category: "Vestiti", quantity: 2 }, { name: "Asciugamano da spiaggia", category: "Accessori", quantity: 1 }, { name: "Crema solare", category: "Igiene", quantity: 1 }, { name: "Occhiali da sole", category: "Accessori", quantity: 1 }, { name: "Cappello", category: "Accessori", quantity: 1 }, { name: "Libro/Rivista", category: "Intrattenimento", quantity: 1 }, { name: "Borsa da spiaggia", category: "Accessori", quantity: 1 }, { name: "Infradito/Sandali", category: "Vestiti", quantity: 1 }, { name: "Dopasole", category: "Igiene", quantity: 1 } ], city: [ { name: "Scarpe comode", category: "Vestiti", quantity: 1 }, { name: "Mappa/App navigazione", category: "Documenti/Tech", quantity: 1 }, { name: "Macchina fotografica", category: "Documenti/Tech", quantity: 1 }, { name: "Power bank", category: "Documenti/Tech", quantity: 1 }, { name: "Borraccia", category: "Accessori", quantity: 1 }, { name: "Giacca leggera/Impermeabile", category: "Vestiti", quantity: 1 }, { name: "Zainetto", category: "Accessori", quantity: 1 }, { name: "Documenti", category: "Documenti/Tech", quantity: 1 }, { name: "Adattatore presa (se necessario)", category: "Documenti/Tech", quantity: 1 } ], mountain: [ { name: "Scarponcini da trekking", category: "Vestiti", quantity: 1 }, { name: "Zaino", category: "Accessori", quantity: 1 }, { name: "Borraccia/Thermos", category: "Accessori", quantity: 1 }, { name: "Giacca a vento/pioggia", category: "Vestiti", quantity: 1 }, { name: "Pile/Maglione pesante", category: "Vestiti", quantity: 1 }, { name: "Pantaloni lunghi", category: "Vestiti", quantity: 2 }, { name: "Cappello/Berretto", category: "Accessori", quantity: 1 }, { name: "Guanti", category: "Accessori", quantity: 1 }, { name: "Occhiali da sole", category: "Accessori", quantity: 1 }, { name: "Crema solare", category: "Igiene", quantity: 1 }, { name: "Kit primo soccorso", category: "Salute", quantity: 1 }, { name: "Mappa/Bussola/GPS", category: "Documenti/Tech", quantity: 1 } ], camping: [ { name: "Tenda", category: "Attrezzatura", quantity: 1 }, { name: "Sacco a pelo", category: "Attrezzatura", quantity: 1 }, { name: "Materassino", category: "Attrezzatura", quantity: 1 }, { name: "Fornello da campeggio + Gas", category: "Attrezzatura", quantity: 1 }, { name: "Gavetta/Stoviglie", category: "Attrezzatura", quantity: 1 }, { name: "Coltellino multiuso", category: "Attrezzatura", quantity: 1 }, { name: "Torcia frontale/Lanterna + Batterie", category: "Attrezzatura", quantity: 1 }, { name: "Kit igiene personale", category: "Igiene", quantity: 1 }, { name: "Asciugamano microfibra", category: "Igiene", quantity: 1 }, { name: "Repellente insetti", category: "Salute", quantity: 1 }, { name: "Sedia pieghevole (opzionale)", category: "Attrezzatura", quantity: 1 }, { name: "Cibo a lunga conservazione", category: "Cibo", quantity: 1 } ] };
const DEFAULT_PACKING_CATEGORIES = ["Vestiti", "Accessori", "Igiene", "Salute", "Documenti/Tech", "Attrezzatura", "Intrattenimento", "Cibo", "Altro"];

// ==========================================================================
// == FUNZIONI UTILITY (Aggiornate per Timestamp) ==
// ==========================================================================
const generateId = (prefix = 'item') => `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
const formatCurrency = (amount) => { const num = amount === null || typeof amount === 'undefined' ? 0 : Number(amount); if (isNaN(num)) { console.warn(`Valore non numerico per formatCurrency: ${amount}`); return new Intl.NumberFormat(DEFAULT_LOCALE, { style: 'currency', currency: DEFAULT_CURRENCY }).format(0); } return new Intl.NumberFormat(DEFAULT_LOCALE, { style: 'currency', currency: DEFAULT_CURRENCY }).format(num); };
const formatDate = (dateStringOrTimestamp) => { // Gestisce Timestamp o Stringa ISO
    if (!dateStringOrTimestamp) return '';
    let date;
    try {
        if (dateStringOrTimestamp instanceof Timestamp) {
            date = dateStringOrTimestamp.toDate();
        } else if (typeof dateStringOrTimestamp === 'string') {
             if (dateStringOrTimestamp.includes('T')) { date = new Date(dateStringOrTimestamp); }
             else if (dateStringOrTimestamp.match(/^\d{4}-\d{2}-\d{2}$/)) { const parts = dateStringOrTimestamp.split('-'); date = new Date(Date.UTC(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]))); }
             else { return dateStringOrTimestamp; }
        } else { return ''; }
        if (isNaN(date.getTime())) { return ''; }
        const day = String(date.getUTCDate()).padStart(2, '0');
        const month = String(date.getUTCMonth() + 1).padStart(2, '0');
        const year = date.getUTCFullYear();
        return `${day}/${month}/${year}`;
    } catch (e) { console.error("Errore formatDate:", e, "Input:", dateStringOrTimestamp); return String(dateStringOrTimestamp); }
};
const formatDateTime = (dateTimeStringOrTimestamp) => { // Gestisce Timestamp o Stringa ISO
    if (!dateTimeStringOrTimestamp) return '';
    let date;
     try {
         if (dateTimeStringOrTimestamp instanceof Timestamp) { date = dateTimeStringOrTimestamp.toDate(); }
         else if (typeof dateTimeStringOrTimestamp === 'string') { date = new Date(dateTimeStringOrTimestamp); }
         else { return ''; }
         if (isNaN(date.getTime())) { return ''; }
         const day = String(date.getDate()).padStart(2, '0');
         const month = String(date.getMonth() + 1).padStart(2, '0');
         const year = date.getFullYear();
         const hours = String(date.getHours()).padStart(2, '0');
         const minutes = String(date.getMinutes()).padStart(2, '0');
         return `${day}/${month}/${year} ${hours}:${minutes}`;
     } catch (e) { console.error("Errore formatDateTime:", e, "Input:", dateTimeStringOrTimestamp); return String(dateTimeStringOrTimestamp); }
};
const formatSkyscannerDate = (isoDateString) => { if (!isoDateString || typeof isoDateString !== 'string' || !isoDateString.match(/^\d{4}-\d{2}-\d{2}$/)) return null; try { const year = isoDateString.substring(2, 4); const month = isoDateString.substring(5, 7); const day = isoDateString.substring(8, 10); return `${year}${month}${day}`; } catch (e) { console.error("Errore formattazione data Skyscanner:", e); return null; } };
const showToast = (message, type = 'info') => { if (!toastContainer) return; const toast = document.createElement('div'); toast.className = `toast toast-${type}`; let iconClass = 'fas fa-info-circle'; if (type === 'success') iconClass = 'fas fa-check-circle'; if (type === 'error') iconClass = 'fas fa-exclamation-circle'; if (type === 'warning') iconClass = 'fas fa-exclamation-triangle'; toast.innerHTML = `<i class="${iconClass}"></i> ${message}`; toastContainer.appendChild(toast); setTimeout(() => toast.classList.add('show'), 10); setTimeout(() => { toast.classList.remove('show'); toast.addEventListener('transitionend', () => toast.remove(), { once: true }); }, 3000); };
const openModal = (modalElement) => { if(modalElement) modalElement.style.display = 'block'; };
const closeModal = (modalElement) => { if(modalElement) modalElement.style.display = 'none'; };
const openNewTripModal = () => { if (!newTripModal) return; newTripNameInput.value = ''; if (newTripErrorP) newTripErrorP.style.display = 'none'; openModal(newTripModal); newTripNameInput.focus(); };
const closeNewTripModal = () => closeModal(newTripModal);
const showConfirmationModal = (title, message, onConfirm) => { if (!confirmationModal) return; confirmationModalTitle.textContent = title; confirmationModalMessage.textContent = message; const confirmBtn = document.getElementById('confirmation-modal-confirm-btn'); if (!confirmBtn) { console.error("Bottone conferma modale non trovato!"); return; } const newConfirmBtn = confirmBtn.cloneNode(true); confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn); newConfirmBtn.onclick = () => { if (typeof onConfirm === 'function') { try { onConfirm(); } catch(err) { console.error("Errore durante esecuzione callback conferma:", err); showToast("Si è verificato un errore.", "error"); } } closeConfirmationModal(); }; openModal(confirmationModal); };
const closeConfirmationModal = () => { closeModal(confirmationModal); };
const resetEditState = (formType) => { const form = document.getElementById(`add-${formType}-item-form`); const submitBtn = document.getElementById(`${formType}-submit-btn`); const cancelBtn = document.getElementById(`${formType}-cancel-edit-btn`); const hiddenInput = document.getElementById(`edit-${formType}-item-id`); if (form) form.reset(); if(hiddenInput) hiddenInput.value = ''; if (submitBtn) { let addText = 'Aggiungi'; switch(formType) { case 'participant': addText = 'Partecipante'; break; case 'reminder': addText = 'Promemoria'; break; case 'transport': addText = 'Trasporto'; break; case 'accommodation': addText = 'Alloggio'; break; case 'itinerary': addText = 'Attività'; break; case 'budget': addText = 'Spesa'; break; case 'packing': addText = 'Oggetto'; break; } submitBtn.innerHTML = `<i class="fas fa-plus"></i> ${addText}`; submitBtn.classList.remove('btn-warning'); submitBtn.classList.add('btn-secondary'); } if (cancelBtn) cancelBtn.style.display = 'none'; if(formType === 'transport' && typeof toggleSearchButtonsVisibility === 'function') toggleSearchButtonsVisibility(); };
const createMapLink = (query) => query ? `${GOOGLE_MAPS_BASE_URL}${encodeURIComponent(query)}` : null;
const formatDisplayLink = (link) => { if (!link) return ''; try { new URL(link); const displayLink = link.length > 40 ? link.substring(0, 37) + '...' : link; return `<a href="${link}" target="_blank" rel="noopener noreferrer" class="external-link" title="${link}">${displayLink} <i class="fas fa-external-link-alt"></i></a>`; } catch (_) { return link; } };
const toTimestampOrNull = (dateString) => { if (!dateString || typeof dateString !== 'string') return null; try { let date; if (dateString.includes('T')) { date = new Date(dateString); } else if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) { const parts = dateString.split('-'); date = new Date(Date.UTC(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]))); } else { date = new Date(dateString); } if (isNaN(date.getTime())) { return null; } return Timestamp.fromDate(date); } catch (e) { console.warn(`Impossibile convertire "${dateString}" in Timestamp:`, e); return null; } };
const safeToNumberOrNull = (value) => { if (value === null || value === undefined || value === '') return null; const num = Number(value); if (isNaN(num) || !isFinite(num)) { console.warn(`Valore non numerico o infinito rilevato: "${value}". Convertito a null.`); return null; } return num; };
const safeToPositiveIntegerOrDefault = (value, defaultValue = 1) => { if (value === null || value === undefined || value === '') return defaultValue; const num = parseInt(value, 10); if (isNaN(num) || !isFinite(num) || num < 1) { console.warn(`Quantità non valida rilevata: "${value}". Impostata a ${defaultValue}.`); return defaultValue; } return num; };
function fallbackCopyTextToClipboard(text) { const textArea = document.createElement("textarea"); textArea.value = text; textArea.style.position = "fixed"; textArea.style.top = "0"; textArea.style.left = "0"; textArea.style.opacity = "0"; document.body.appendChild(textArea); textArea.focus(); textArea.select(); try { const successful = document.execCommand('copy'); if (successful) { showToast("Riepilogo copiato (fallback)!", "success"); } else { throw new Error('Copia fallback fallita'); } } catch (err) { console.error('Fallback: Impossibile copiare testo: ', err); showToast("Errore durante la copia (fallback).", "error"); } document.body.removeChild(textArea); }

// ==========================================================================
// == GESTIONE STORAGE (Rimosso LocalStorage, Gestito da Firestore) ==
// ==========================================================================
// Funzioni saveTrips/loadTrips rimosse.

// ==========================================================================
// == STATO APPLICAZIONE (Modificato) ==
// ==========================================================================
// trips array rimosso
// currentTripId, currentTripDataCache definiti globalmente
let currentSort = { transport: 'departureDateTime', itinerary: 'dateTime', budget: 'category', packing: 'name', reminder: 'dueDate' };
let currentSearchTerm = { trip: '', itinerary: '', packing: '' };

// ==========================================================================
// == LOGICA VIAGGI (Firestore) ==
// ==========================================================================

// Carica lista viaggi utente (con onSnapshot)
function loadUserTrips() {
    if (!currentUserId || !tripListUl) { if(tripListUl) tripListUl.innerHTML = ''; if(noTripsMessage) noTripsMessage.style.display = 'block'; return; }
    console.log(`Caricamento viaggi per utente: ${currentUserId}`);
    tripListUl.innerHTML = '<li><i class="fas fa-spinner fa-spin"></i> Caricamento...</li>';
    noTripsMessage.style.display = 'none';
    if (unsubscribeTripListListener) { unsubscribeTripListListener(); unsubscribeTripListListener = null; }

    try {
        const tripsRef = collection(db, 'trips');
        const q = query(tripsRef, where("ownerUid", "==", currentUserId), orderBy("name", "asc"));
        unsubscribeTripListListener = onSnapshot(q, (querySnapshot) => {
            console.log("Snapshot lista viaggi ricevuto.");
            tripListUl.innerHTML = '';
            let tripCount = 0;
            let templates = [];
            querySnapshot.forEach((docSnap) => {
                tripCount++;
                const tripData = docSnap.data();
                const tripId = docSnap.id;
                const li = createTripListItem(tripId, tripData); // Usa helper per creare <li>
                if(li) tripListUl.appendChild(li);
                if (tripData.isTemplate) templates.push({ id: tripId, name: tripData.name });
            });
            noTripsMessage.style.display = tripCount === 0 ? 'block' : 'none';
            populateTemplateModal(templates);
            if (currentTripId && !querySnapshot.docs.some(doc => doc.id === currentTripId)) { deselectTrip(); }
            else if (currentTripId) { const currentLi = tripListUl.querySelector(`li[data-trip-id="${currentTripId}"]`); if (currentLi) currentLi.classList.add('active'); }
        }, (error) => {
            console.error("Errore listener lista viaggi:", error);
            tripListUl.innerHTML = '<li>Errore nel caricamento dei viaggi.</li>';
            showToast('Errore nel caricare i tuoi viaggi.', 'error');
            noTripsMessage.style.display = 'none';
        });
        console.log("Listener lista viaggi collegato.");
    } catch (error) {
        console.error("Errore query/listener viaggi:", error);
        tripListUl.innerHTML = '<li>Errore grave nel setup caricamento.</li>';
        showToast('Errore grave nel caricamento dei viaggi.', 'error');
    }
}

// Popola modal template
function populateTemplateModal(templates = []) {
     if (!templateSelectInput) return;
     const currentVal = templateSelectInput.value;
     templateSelectInput.innerHTML = '<option value="">-- Seleziona Template --</option>';
     templates.sort((a, b) => (a?.name || '').localeCompare(b?.name || '')).forEach(t => { const option = document.createElement('option'); option.value = t.id; option.textContent = t.name; templateSelectInput.appendChild(option); });
     if (templates.some(t => t.id === currentVal)) { templateSelectInput.value = currentVal; }
     const hasTemplates = templates.length > 0;
     if (createFromTemplateBtn) createFromTemplateBtn.disabled = !hasTemplates;
     if (createFromTemplateConfirmBtn) createFromTemplateConfirmBtn.disabled = !hasTemplates;
}

// Crea elemento LI per lista viaggi
const createTripListItem = (tripId, tripData) => {
    if (!tripId || !tripData) return null;
    const li = document.createElement('li');
    li.dataset.tripId = tripId;
    if (tripData.isTemplate) li.classList.add('is-template');
    let titleText = tripData.name || 'Senza Nome';
    if (!tripData.isTemplate) { const startDateFormatted = formatDate(tripData.startDate); const endDateFormatted = formatDate(tripData.endDate); if (startDateFormatted || endDateFormatted) { titleText += ` (${startDateFormatted || '?'} - ${endDateFormatted || '?'})`; } }
    li.innerHTML = `<span>${titleText}</span><button class="btn-delete-trip" data-trip-id="${tripId}" title="Elimina"><i class="fas fa-trash-alt"></i></button>`;
    if (tripId === currentTripId) { li.classList.add('active'); }
    li.addEventListener('click', (e) => { if (!e.target.closest('.btn-delete-trip')) { if (tripData.isTemplate) { showToast("Questo è un template. Selezionalo da 'Da Template'.", "info"); } else { selectTrip(tripId); } } });
    const deleteBtnLi = li.querySelector('.btn-delete-trip');
    if (deleteBtnLi) { deleteBtnLi.addEventListener('click', (e) => { e.stopPropagation(); handleDeleteTrip(tripId, tripData.name, tripData.isTemplate); }); }
    return li;
};

// Seleziona viaggio
const selectTrip = (id) => {
    if (currentTripId === id && tripDetailsAreaDiv?.style.display !== 'none') return;
    console.log(`Selezione viaggio: ${id}`);
    currentTripId = id;
    currentTripDataCache = null;
    currentSearchTerm.itinerary = ''; if(searchItineraryInput) searchItineraryInput.value = '';
    currentSearchTerm.packing = ''; if(searchPackingInput) searchPackingInput.value = '';
    if (tripListUl) { tripListUl.querySelectorAll('li.active').forEach(el => el.classList.remove('active')); const li = tripListUl.querySelector(`li[data-trip-id="${id}"]`); if (li) li.classList.add('active'); }
    loadSelectedTripDetails(id); // Carica dettagli da Firestore
    if(tripDetailsAreaDiv) tripDetailsAreaDiv.style.display = 'block';
    if(welcomeMessageDiv) welcomeMessageDiv.style.display = 'none';
    resetAllEditStates();
    switchTab('info-tab');
};

// Deseleziona viaggio
const deselectTrip = () => {
    console.log("Deselezione viaggio.");
    currentTripId = null;
    currentTripDataCache = null;
    if (tripDetailsAreaDiv) tripDetailsAreaDiv.style.display = 'none';
    if (welcomeMessageDiv) welcomeMessageDiv.style.display = 'block';
    if (downloadTextBtn) downloadTextBtn.disabled = true;
    if (downloadExcelBtn) downloadExcelBtn.disabled = true;
    // deleteTripBtn non c'è più nell'header
    if (shareTripBtn) shareTripBtn.disabled = true;
    if (emailSummaryBtn) emailSummaryBtn.disabled = true;
    if (copySummaryBtn) copySummaryBtn.disabled = true;
    if (calculateBalanceBtn) calculateBalanceBtn.disabled = true;
    if (tripListUl) { tripListUl.querySelectorAll('li.active').forEach(el => el.classList.remove('active')); }
    clearSubcollectionListeners(); // Scollega listeners del viaggio precedente
};

// Carica dettagli viaggio e imposta listener sottocollezioni
async function loadSelectedTripDetails(tripId) {
    if (!currentUserId || !tripId) { deselectTrip(); return; }
    console.log(`Caricamento dettagli per viaggio ${tripId}`);
    if(tripTitleH2) tripTitleH2.textContent = 'Caricamento...';
    resetAllDetailFormsAndLists();
    enableTripActionButtons(false);
    clearSubcollectionListeners();

    try {
        const tripDocRef = doc(db, 'trips', tripId);
        const tripSnap = await getDoc(tripDocRef);
        if (tripSnap.exists() && tripSnap.data().ownerUid === currentUserId) {
            currentTripDataCache = tripSnap.data();
            console.log("Dati principali viaggio caricati:", currentTripDataCache);
            populateTripInfoForm(tripId, currentTripDataCache);
            // Imposta listener per sottocollezioni
            setupSubcollectionListener(tripId, 'participant', renderParticipants, orderBy('name', 'asc'));
            setupSubcollectionListener(tripId, 'reminder', renderReminders, orderBy('dueDate', 'asc'));//, orderBy('createdAt', 'desc')); // aggiunto createdAt per tie-break
            setupSubcollectionListener(tripId, 'transport', renderTransportations, orderBy('departureDateTime', 'asc'));
            setupSubcollectionListener(tripId, 'accommodation', renderAccommodations, orderBy('checkinDateTime', 'asc'));
            setupSubcollectionListener(tripId, 'itinerary', renderItinerary, orderBy('day', 'asc'), orderBy('time', 'asc'));
            setupSubcollectionListener(tripId, 'budgetItems', renderBudget, orderBy('category', 'asc'), orderBy('createdAt', 'desc')); // budgetItems!
            setupSubcollectionListener(tripId, 'packingList', renderPackingList, orderBy('category', 'asc'), orderBy('name', 'asc'));
            populateDatalistsFromCache(); // Popola inizialmente dalla cache
            enableTripActionButtons(true, currentTripDataCache.isTemplate || false);
            if (editTripIdInput) editTripIdInput.value = tripId;
            if (calculateBalanceBtn) calculateBalanceBtn.disabled = false;
        } else {
             console.error(`Viaggio ${tripId} non trovato o accesso negato.`);
             showToast("Impossibile caricare i dettagli del viaggio selezionato.", "error");
             deselectTrip();
        }
    } catch (error) {
        console.error(`Errore nel caricare i dettagli del viaggio ${tripId}:`, error);
        showToast("Errore grave nel caricamento dei dettagli.", "error");
        deselectTrip();
    }
}

// Popola form Info Generali
function populateTripInfoForm(tripId, data) {
    if (!data || !tripInfoForm) return;
    if(tripTitleH2) tripTitleH2.textContent = data.name || 'Dettagli Viaggio';
    if(tripNameInput) tripNameInput.value = data.name || '';
    if(tripOriginCityInput) tripOriginCityInput.value = data.originCity || '';
    if(tripDestinationInput) tripDestinationInput.value = data.destination || '';
    if(tripStartDateInput) tripStartDateInput.value = data.startDate instanceof Timestamp ? data.startDate.toDate().toISOString().split('T')[0] : (data.startDate || '');
    if(tripEndDateInput) tripEndDateInput.value = data.endDate instanceof Timestamp ? data.endDate.toDate().toISOString().split('T')[0] : (data.endDate || '');
    if(tripIsTemplateCheckbox) tripIsTemplateCheckbox.checked = data.isTemplate || false;
    if(tripNotesTextarea) tripNotesTextarea.value = data.notes || '';
    if(tripExtraInfoTextarea) tripExtraInfoTextarea.value = data.extraInfo || '';
}

// Abilita/Disabilita bottoni azioni
function enableTripActionButtons(enable, isTemplate = false) {
    const buttons = tripDetailsAreaDiv?.querySelectorAll('.trip-actions button');
    if (!buttons) return;
    buttons.forEach(button => {
        let shouldBeDisabled = !enable;
        if (button.id === 'share-trip-btn' && isTemplate) shouldBeDisabled = true;
        button.disabled = shouldBeDisabled;
    });
}

// Pulisce tutti i form e liste dettagli
function resetAllDetailFormsAndLists() {
    console.log("Resetting all detail forms and lists");
    if (tripInfoForm) tripInfoForm.reset();
    resetEditState('participant'); resetEditState('reminder'); resetEditState('transport');
    resetEditState('accommodation'); resetEditState('itinerary'); resetEditState('budget'); resetEditState('packing');
    if (participantListUl) participantListUl.innerHTML = ''; if (reminderListUl) reminderListUl.innerHTML = '';
    if (transportListUl) transportListUl.innerHTML = ''; if (accommodationListUl) accommodationListUl.innerHTML = '';
    if (itineraryListUl) itineraryListUl.innerHTML = ''; if (budgetListUl) budgetListUl.innerHTML = '';
    if (packingListUl) packingListUl.innerHTML = '';
    if (budgetTotalEstimatedStrong) budgetTotalEstimatedStrong.textContent = formatCurrency(0);
    if (budgetTotalActualStrong) budgetTotalActualStrong.textContent = formatCurrency(0);
    if (budgetDifferenceStrong) { budgetDifferenceStrong.textContent = formatCurrency(0); budgetDifferenceStrong.className = ''; }
    if (balanceResultsUl) balanceResultsUl.innerHTML = ''; if (balanceSummaryDiv) balanceSummaryDiv.innerHTML = '';
    if (balanceErrorMessageP) balanceErrorMessageP.style.display = 'none'; if (balanceResultsContainer) balanceResultsContainer.style.display = 'none';
    document.querySelectorAll('.tab-content .center-text.muted').forEach(p => p.style.display = 'none');
}

// Resetta tutti gli stati di modifica
function resetAllEditStates() { Object.keys(currentSort).forEach(type => { resetEditState(type); }); } // currentSort ha le chiavi giuste

// Gestisce creazione nuovo viaggio
const handleNewTrip = () => { openNewTripModal(); };
const handleCreateTripConfirm = async () => {
    if (!currentUserId) { showToast("Devi essere loggato.", "error"); return; }
    const tripName = newTripNameInput.value.trim();
    if (!tripName) { if (newTripErrorP) { newTripErrorP.textContent = 'Il nome non può essere vuoto.'; newTripErrorP.style.display = 'block'; } newTripNameInput.focus(); return; }
     if (newTripErrorP) newTripErrorP.style.display = 'none';
     if(createTripConfirmBtn) { createTripConfirmBtn.disabled = true; createTripConfirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creazione...'; }
    const newTripData = { name: tripName, ownerUid: currentUserId, originCity: '', destination: '', startDate: null, endDate: null, notes: '', isTemplate: false, extraInfo: '', createdAt: serverTimestamp(), updatedAt: serverTimestamp() };
    try {
        const docRef = await addDoc(collection(db, "trips"), newTripData);
        console.log("Nuovo viaggio creato con ID:", docRef.id);
        closeNewTripModal();
        showToast(`Viaggio "${tripName}" creato!`, 'success');
    } catch (error) { console.error("Errore creazione nuovo viaggio:", error); showToast("Errore creazione viaggio.", "error"); if (newTripErrorP) { newTripErrorP.textContent = 'Errore server. Riprova.'; newTripErrorP.style.display = 'block'; }
    } finally { if(createTripConfirmBtn) { createTripConfirmBtn.disabled = false; createTripConfirmBtn.innerHTML = 'Crea Viaggio'; } }
};

// Gestisce salvataggio Info Generali
const handleSaveTripInfo = async (e) => {
    e.preventDefault();
    if (!currentUserId || !currentTripId) { showToast("Nessun viaggio selezionato.", "error"); return; }
    const tripDocRef = doc(db, 'trips', currentTripId);
    const startValue = tripStartDateInput.value; const endValue = tripEndDateInput.value;
    if (startValue && endValue && startValue > endValue) { showToast('Data fine non valida.', 'error'); return; }
    const dataToUpdate = { name: tripNameInput.value.trim() || 'Viaggio Senza Nome', originCity: tripOriginCityInput.value.trim(), destination: tripDestinationInput.value.trim(), startDate: toTimestampOrNull(startValue), endDate: toTimestampOrNull(endValue), isTemplate: tripIsTemplateCheckbox.checked, notes: tripNotesTextarea.value.trim(), extraInfo: tripExtraInfoTextarea.value.trim(), updatedAt: serverTimestamp() };
    const saveButton = tripInfoForm?.querySelector('button[type="submit"]');
    if(saveButton) { saveButton.disabled = true; saveButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvo...'; }
    try {
        const docSnap = await getDoc(tripDocRef);
        if (!docSnap.exists() || docSnap.data().ownerUid !== currentUserId) throw new Error("Viaggio non trovato o permesso negato.");
        await updateDoc(tripDocRef, dataToUpdate);
        currentTripDataCache = { ...currentTripDataCache, ...dataToUpdate }; // Aggiorna cache
        if(tripTitleH2) tripTitleH2.textContent = dataToUpdate.name;
        if(shareTripBtn) shareTripBtn.disabled = dataToUpdate.isTemplate;
        showToast('Informazioni salvate!', 'success');
    } catch (error) { console.error("Errore salvataggio info viaggio:", error); showToast(`Errore salvataggio: ${error.message}`, "error");
    } finally { if(saveButton) { saveButton.disabled = false; saveButton.innerHTML = '<i class="fas fa-save"></i> Salva Info'; } }
};

// Gestisce eliminazione viaggio (con sottocollezioni)
const handleDeleteTrip = async (id, name, isTemplate) => {
    if (!currentUserId || !id) return;
    const type = isTemplate ? 'Template' : 'Viaggio';
    showConfirmationModal(`Conferma Eliminazione ${type}`, `Eliminare "${name || 'S.N.'}"? L'azione è irreversibile e cancellerà tutti i dati associati.`, async () => {
        console.log(`Tentativo eliminazione ${type}: ${id}`);
        try {
            const tripDocRef = doc(db, 'trips', id);
            const docSnap = await getDoc(tripDocRef);
            if (!docSnap.exists() || docSnap.data().ownerUid !== currentUserId) throw new Error("Viaggio non trovato o permesso negato.");
            console.log("Eliminazione sottocollezioni...");
            const subcollections = ['participants', 'reminders', 'transportations', 'accommodations', 'itinerary', 'budgetItems', 'packingList'];
            const deletePromises = subcollections.map(sub => deleteSubcollection(db, `trips/${id}/${sub}`));
            await Promise.all(deletePromises);
            console.log("Sottocollezioni eliminate.");
            await deleteDoc(tripDocRef);
            console.log(`${type} ${id} eliminato con successo.`);
            showToast(`${type} eliminato.`, 'info');
            if (currentTripId === id) { deselectTrip(); }
        } catch (error) { console.error(`Errore eliminazione ${type} ${id}:`, error); showToast(`Errore eliminazione: ${error.message}`, "error"); }
    });
};

// Helper per eliminare sottocollezioni Firestore (CORRETTO)
async function deleteSubcollection(firestoreDb, collectionPath) {
    console.log(`Avvio eliminazione subcollection: ${collectionPath}`);
    // Controllo errato rimosso!
    try {
        const collectionRef = collection(firestoreDb, collectionPath);
        // Aggiungi un controllo per vedere se il path è valido per una collezione (dispari segmenti)
        // Questo è più un sanity check opzionale, collection() fallirebbe comunque.
        if (collectionPath.split('/').length % 2 === 0) {
             console.warn(`Il path fornito "${collectionPath}" sembra puntare a un documento, non a una collezione. Procedo comunque con cautela.`);
             // Potresti decidere di lanciare un errore qui se vuoi essere più stringente
             // throw new Error(`Path non valido per una collezione: ${collectionPath}`);
        }

        const q = query(collectionRef, limit(500)); // Aumenta limite batch se necessario/possibile (max 500 per commit)

        return new Promise((resolve, reject) => {
            deleteQueryBatch(firestoreDb, q, collectionPath, resolve, reject); // Passa collectionPath per logging migliore
        });
    } catch (error) {
         // Cattura errori nella creazione della collectionRef (es. path totalmente sballato)
         console.error(`Errore nella preparazione dell'eliminazione per ${collectionPath}:`, error);
         // Rifiuta la promise principale se c'è un errore qui
         return Promise.reject(error);
    }
}
// Helper ricorsivo per eliminare batch (con logging migliorato)
async function deleteQueryBatch(firestoreDb, queryInstance, originalPath, resolve, reject) {
    try {
        const snapshot = await getDocs(queryInstance);

        if (snapshot.size === 0) {
            // Nessun documento rimasto, abbiamo finito per questo path
             console.log(`Subcollection ${originalPath} vuota o eliminata completamente.`);
            resolve();
            return;
        }

        // Elimina documenti in un batch
        const batch = writeBatch(firestoreDb);
        snapshot.docs.forEach(docSnap => {
            batch.delete(docSnap.ref);
        });
        await batch.commit();
        console.log(`Eliminato batch di ${snapshot.size} documenti da ${originalPath}.`);

        // Richiama ricorsivamente per il batch successivo, senza bloccare event loop
        setTimeout(() => {
            deleteQueryBatch(firestoreDb, queryInstance, originalPath, resolve, reject);
        }, 0);

    } catch (error) {
        console.error(`Errore durante eliminazione batch per ${originalPath}:`, error);
        reject(error); // Rifiuta la promise se il batch fallisce
    }
}

// Gestisce creazione da template
const openSelectTemplateModal = () => { if (!templateSelectInput || templateSelectInput.options.length <= 1) { showToast("Nessun template.", "info"); return; } if (selectTemplateErrorP) selectTemplateErrorP.style.display = 'none'; openModal(selectTemplateModal); };
const closeSelectTemplateModal = () => closeModal(selectTemplateModal);
const handleCreateFromTemplateConfirm = async () => {
    const templateId = templateSelectInput.value;
    if (!templateId || !currentUserId) { if(!templateId && selectTemplateErrorP) { selectTemplateErrorP.textContent = 'Seleziona template.'; selectTemplateErrorP.style.display = 'block';} return; }
     if(createFromTemplateConfirmBtn) { createFromTemplateConfirmBtn.disabled = true; createFromTemplateConfirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creazione...'; }
    try {
         const templateDocRef = doc(db, 'trips', templateId);
         const templateSnap = await getDoc(templateDocRef);
         if (!templateSnap.exists() || !templateSnap.data().isTemplate || templateSnap.data().ownerUid !== currentUserId) throw new Error("Template non valido.");
         const templateData = templateSnap.data(); const templateName = templateData.name || 'Template';
         const newTripDataBase = { ...templateData, ownerUid: currentUserId, isTemplate: false, name: `Copia di ${templateName}`, createdAt: serverTimestamp(), updatedAt: serverTimestamp() };
         delete newTripDataBase.id; // Rimuove vecchio ID se presente nella copia
         const newTripDocRef = await addDoc(collection(db, "trips"), newTripDataBase);
         const newTripId = newTripDocRef.id;
         console.log(`Nuovo viaggio ${newTripId} da template ${templateId}. Copio subcollections...`);
         const subcollectionsToCopy = ['participants', 'reminders', 'transportations', 'accommodations', 'itinerary', 'budgetItems', 'packingList'];
         const copyPromises = subcollectionsToCopy.map(async (subName) => {
             const sourceColRef = collection(db, 'trips', templateId, subName);
             const targetColRef = collection(db, 'trips', newTripId, subName);
             const sourceSnapshot = await getDocs(sourceColRef);
             if(sourceSnapshot.empty) return; // Salta se vuota
             const batch = writeBatch(db); let count = 0;
             sourceSnapshot.forEach((docSnap) => {
                  const data = docSnap.data();
                  // Aggiungi/Aggiorna timestamps
                  data.createdAt = serverTimestamp();
                  data.updatedAt = serverTimestamp();
                  batch.set(doc(targetColRef), data); // Genera nuovo ID
                  count++;
             });
             await batch.commit(); console.log(`Copiati ${count} doc in ${subName} per ${newTripId}`);
         });
         await Promise.all(copyPromises);
         console.log(`Copia da template ${templateId} a ${newTripId} completata.`);
         closeSelectTemplateModal();
         showToast(`Viaggio creato dal template "${templateName}"!`, 'success');
    } catch (error) { console.error("Errore creazione da template:", error); showToast(`Errore creazione: ${error.message}`, "error"); if (selectTemplateErrorP) { selectTemplateErrorP.textContent = 'Errore server. Riprova.'; selectTemplateErrorP.style.display = 'block'; }
    } finally { if(createFromTemplateConfirmBtn) { createFromTemplateConfirmBtn.disabled = false; createFromTemplateConfirmBtn.innerHTML = 'Crea Viaggio da Template'; } }
};

// Handle search (disabilitato lato client)
const handleSearchTrip = (e) => { currentSearchTerm.trip = e.target.value; showToast("Filtro lista viaggi non attivo.", "info"); };

// ==========================================================================
// == FUNZIONI MODIFICA ITEM (Firestore) ==
// ==========================================================================

const startEditItem = async (listType, itemId) => {
    if (!currentUserId || !currentTripId) return;
    console.log(`Avvio modifica ${listType} item: ${itemId} per viaggio ${currentTripId}`);
    const subcollectionName = listType === 'budget' ? 'budgetItems' : listType;
    const itemDocRef = doc(db, 'trips', currentTripId, subcollectionName, itemId);
    try {
        const itemSnap = await getDoc(itemDocRef);
        if (!itemSnap.exists()) throw new Error(`Elemento ${itemId} non trovato.`);
        const itemToEdit = itemSnap.data();
        resetAllEditStates(); // Resetta altri form prima
        const form = document.getElementById(`add-${listType}-item-form`);
        const submitBtn = document.getElementById(`${listType}-submit-btn`);
        const cancelBtn = document.getElementById(`${listType}-cancel-edit-btn`);
        const hiddenInput = document.getElementById(`edit-${listType}-item-id`);
        if (!form || !submitBtn || !cancelBtn || !hiddenInput) { console.error(`Elementi UI mancanti per ${listType}`); return; }
        hiddenInput.value = itemId; // Imposta ID
        // Popola form con dati letti
        switch (listType) { /* ... (popolamento form come prima, usando toDate().toISOString().split/slice per date/datetime) ... */
             case 'participant': participantNameInput.value = itemToEdit.name || ''; participantNotesInput.value = itemToEdit.notes || ''; participantExtraInfoTextarea.value = itemToEdit.extraInfo || ''; break;
             case 'reminder': reminderDescriptionInput.value = itemToEdit.description || ''; reminderDueDateInput.value = itemToEdit.dueDate instanceof Timestamp ? itemToEdit.dueDate.toDate().toISOString().split('T')[0] : ''; reminderStatusSelect.value = itemToEdit.status || 'todo'; break;
             case 'transport': transportTypeSelect.value = itemToEdit.type || 'Altro'; transportDescriptionInput.value = itemToEdit.description || ''; transportDepartureLocInput.value = itemToEdit.departureLoc || ''; transportDepartureDatetimeInput.value = itemToEdit.departureDateTime instanceof Timestamp ? itemToEdit.departureDateTime.toDate().toISOString().slice(0, 16) : ''; transportArrivalLocInput.value = itemToEdit.arrivalLoc || ''; transportArrivalDatetimeInput.value = itemToEdit.arrivalDateTime instanceof Timestamp ? itemToEdit.arrivalDateTime.toDate().toISOString().slice(0, 16) : ''; transportBookingRefInput.value = itemToEdit.bookingRef || ''; transportCostInput.value = itemToEdit.cost ?? ''; transportNotesInput.value = itemToEdit.notes || ''; transportLinkInput.value = itemToEdit.link || ''; break;
             case 'accommodation': accommodationNameInput.value = itemToEdit.name || ''; accommodationTypeSelect.value = itemToEdit.type || 'Hotel'; accommodationAddressInput.value = itemToEdit.address || ''; accommodationCheckinInput.value = itemToEdit.checkinDateTime instanceof Timestamp ? itemToEdit.checkinDateTime.toDate().toISOString().slice(0, 16) : ''; accommodationCheckoutInput.value = itemToEdit.checkoutDateTime instanceof Timestamp ? itemToEdit.checkoutDateTime.toDate().toISOString().slice(0, 16) : ''; accommodationBookingRefInput.value = itemToEdit.bookingRef || ''; accommodationCostInput.value = itemToEdit.cost ?? ''; accommodationNotesInput.value = itemToEdit.notes || ''; accommodationLinkInput.value = itemToEdit.link || ''; break;
             case 'itinerary': itineraryDayInput.value = itemToEdit.day instanceof Timestamp ? itemToEdit.day.toDate().toISOString().split('T')[0] : (itemToEdit.day || ''); itineraryTimeInput.value = itemToEdit.time || ''; itineraryActivityInput.value = itemToEdit.activity || ''; itineraryLocationInput.value = itemToEdit.location || ''; itineraryBookingRefInput.value = itemToEdit.bookingRef || ''; itineraryCostInput.value = itemToEdit.cost ?? ''; itineraryNotesInput.value = itemToEdit.notes || ''; itineraryLinkInput.value = itemToEdit.link || ''; break;
             case 'budget': budgetCategorySelect.value = itemToEdit.category || 'Altro'; budgetDescriptionInput.value = itemToEdit.description || ''; budgetEstimatedInput.value = itemToEdit.estimated ?? ''; budgetActualInput.value = itemToEdit.actual ?? ''; budgetPaidByInput.value = itemToEdit.paidBy || ''; budgetSplitBetweenInput.value = itemToEdit.splitBetween || ''; break;
             case 'packing': packingItemNameInput.value = itemToEdit.name || ''; packingItemCategoryInput.value = itemToEdit.category || 'Altro'; packingItemQuantityInput.value = itemToEdit.quantity || 1; break;
        }
        if (submitBtn) { submitBtn.innerHTML = '<i class="fas fa-save"></i> Salva Modifiche'; submitBtn.classList.remove('btn-secondary'); submitBtn.classList.add('btn-warning'); }
        if (cancelBtn) cancelBtn.style.display = 'inline-flex';
        if (listType === 'transport') toggleSearchButtonsVisibility();
        if (form) form.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } catch (error) { console.error(`Errore caricamento dati modifica ${listType} ${itemId}:`, error); showToast(`Errore caricamento elemento: ${error.message}`, 'error'); resetEditState(listType); }
};

const handleItemFormSubmit = async (e, listType) => {
    e.preventDefault();
    if (!currentUserId || !currentTripId) { showToast("Seleziona un viaggio.", "error"); return; }
    const form = e.target;
    const hiddenInput = form.querySelector(`#edit-${listType}-item-id`);
    const currentEditId = hiddenInput ? hiddenInput.value : null;
    const subcollectionName = listType === 'budget' ? 'budgetItems' : listType;
    let itemData = {}; let dataIsValid = true; let errorMessage = "Errore validazione.";
    try { // --- Preparazione e validazione dati ---
        switch (listType) { /* ... (logica validazione come prima, usando toTimestampOrNull per le date) ... */
             case 'participant': const pName = participantNameInput.value.trim(); if (!pName) throw new Error("Nome partecipante richiesto."); itemData = { name: pName, notes: participantNotesInput.value.trim() || null, extraInfo: participantExtraInfoTextarea.value.trim() || null }; break;
             case 'reminder': const rDesc = reminderDescriptionInput.value.trim(); if (!rDesc) throw new Error("Descrizione promemoria richiesta."); itemData = { description: rDesc, dueDate: toTimestampOrNull(reminderDueDateInput.value), status: reminderStatusSelect.value }; break;
             case 'transport': const tDesc = transportDescriptionInput.value.trim(); if (!tDesc) throw new Error("Descrizione trasporto richiesta."); const depDateTime = toTimestampOrNull(transportDepartureDatetimeInput.value); const arrDateTime = toTimestampOrNull(transportArrivalDatetimeInput.value); if (depDateTime && arrDateTime && depDateTime.toMillis() >= arrDateTime.toMillis()) throw new Error("Arrivo dopo partenza."); const transportCost = safeToNumberOrNull(transportCostInput.value); if(transportCost !== null && transportCost < 0) throw new Error("Costo trasporto non valido."); itemData = { type: transportTypeSelect.value, description: tDesc, departureLoc: transportDepartureLocInput.value.trim() || null, departureDateTime: depDateTime, arrivalLoc: transportArrivalLocInput.value.trim() || null, arrivalDateTime: arrDateTime, bookingRef: transportBookingRefInput.value.trim() || null, cost: transportCost, notes: transportNotesInput.value.trim() || null, link: transportLinkInput.value.trim() || null }; break;
             case 'accommodation': const aName = accommodationNameInput.value.trim(); if (!aName) throw new Error("Nome alloggio richiesto."); const checkin = toTimestampOrNull(accommodationCheckinInput.value); const checkout = toTimestampOrNull(accommodationCheckoutInput.value); if(checkin && checkout && checkin.toMillis() >= checkout.toMillis()) throw new Error("Check-out dopo check-in."); const accomCost = safeToNumberOrNull(accommodationCostInput.value); if(accomCost !== null && accomCost < 0) throw new Error("Costo alloggio non valido."); itemData = { name: aName, type: accommodationTypeSelect.value, address: accommodationAddressInput.value.trim() || null, checkinDateTime: checkin, checkoutDateTime: checkout, bookingRef: accommodationBookingRefInput.value.trim() || null, cost: accomCost, notes: accommodationNotesInput.value.trim() || null, link: accommodationLinkInput.value.trim() || null }; break;
             case 'itinerary': const itinDayRaw = itineraryDayInput.value; const itinDay = toTimestampOrNull(itinDayRaw); const itinAct = itineraryActivityInput.value.trim(); if (!itinDay || !itinAct) throw new Error("Giorno e attività richiesti."); const itinCost = safeToNumberOrNull(itineraryCostInput.value); if(itinCost !== null && itinCost < 0) throw new Error("Costo attività non valido."); itemData = { day: itinDay, time: itineraryTimeInput.value || null, activity: itinAct, location: itineraryLocationInput.value.trim() || null, bookingRef: itineraryBookingRefInput.value.trim() || null, cost: itinCost, notes: itineraryNotesInput.value.trim() || null, link: itineraryLinkInput.value.trim() || null }; break;
             case 'budget': const descBudget = budgetDescriptionInput.value.trim(); const est = safeToNumberOrNull(budgetEstimatedInput.value); const act = safeToNumberOrNull(budgetActualInput.value); if (!descBudget || est === null || est < 0) throw new Error("Descrizione e costo stimato (>=0) richiesti."); if (act !== null && act < 0) throw new Error("Costo effettivo non valido (>=0)."); itemData = { category: budgetCategorySelect.value, description: descBudget, estimated: est, actual: act, paidBy: budgetPaidByInput.value.trim() || null, splitBetween: budgetSplitBetweenInput.value.trim() || null }; break;
             case 'packing': const pkName = packingItemNameInput.value.trim(); if (!pkName) throw new Error("Nome oggetto richiesto."); const quantity = safeToPositiveIntegerOrDefault(packingItemQuantityInput.value); itemData = { name: pkName, category: packingItemCategoryInput.value.trim() || 'Altro', quantity: quantity }; break; // Stato packed gestito da checkbox
             default: throw new Error("Tipo elemento non riconosciuto.");
        }
        itemData.updatedAt = serverTimestamp();
    } catch (error) { dataIsValid = false; errorMessage = error.message; showToast(`Errore: ${errorMessage}`, 'error'); }
    if (!dataIsValid) return;
    const submitBtn = form.querySelector('button[type="submit"]');
    if(submitBtn) { submitBtn.disabled = true; submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvo...'; }
    try { // --- Scrittura su Firestore ---
        const collectionRef = collection(db, 'trips', currentTripId, subcollectionName);
        if (currentEditId) {
            const itemDocRef = doc(collectionRef, currentEditId);
            await updateDoc(itemDocRef, itemData);
            console.log(`${listType} ${currentEditId} aggiornato.`); showToast('Elemento aggiornato!', 'success');
        } else {
            if (listType === 'packing') itemData.packed = false; if (listType === 'reminder') itemData.status = 'todo'; itemData.createdAt = serverTimestamp();
            const docRef = await addDoc(collectionRef, itemData);
            console.log(`Nuovo ${listType} aggiunto: ${docRef.id}`); showToast('Elemento aggiunto!', 'success');
        }
        resetEditState(listType); // Resetta form dopo successo
    } catch (error) { console.error(`Errore salvataggio ${listType}:`, error); showToast(`Errore salvataggio: ${error.message}`, "error");
    } finally { if(submitBtn) { submitBtn.disabled = false; resetEditState(listType); } } // Assicura reset bottone
};

const handleDeleteItem = (listType, itemId, itemDesc = '') => {
    if (!currentUserId || !currentTripId || !itemId) return;
    const subcollectionName = listType === 'budget' ? 'budgetItems' : listType;
    let itemNameCapitalized = listType.charAt(0).toUpperCase() + listType.slice(1);
    if (listType === 'budget') itemNameCapitalized = 'Spesa';
    const displayDesc = itemDesc || `ID: ${itemId}`;
    showConfirmationModal(`Conferma Eliminazione ${itemNameCapitalized}`, `Eliminare "${displayDesc}"?`, async () => {
        console.log(`Tentativo eliminazione ${listType} item: ${itemId} da viaggio ${currentTripId}`);
        const itemDocRef = doc(db, 'trips', currentTripId, subcollectionName, itemId);
        try {
            await deleteDoc(itemDocRef);
            console.log(`${listType} item ${itemId} eliminato.`); showToast(`${itemNameCapitalized} eliminato/a.`, 'info');
            const hiddenInput = document.getElementById(`edit-${listType}-item-id`);
            if (hiddenInput && hiddenInput.value === itemId) { resetEditState(listType); }
        } catch (error) { console.error(`Errore eliminazione ${listType} item ${itemId}:`, error); showToast(`Errore eliminazione: ${error.message}`, "error"); }
    });
};

const handleTogglePacked = async (itemId, isPacked) => {
     if (!currentUserId || !currentTripId || !itemId) return;
     const itemDocRef = doc(db, 'trips', currentTripId, 'packingList', itemId);
     try { await updateDoc(itemDocRef, { packed: isPacked, updatedAt: serverTimestamp() }); console.log(`Stato packed ${itemId} aggiornato a ${isPacked}`); }
     catch (error) { console.error(`Errore aggiornamento packed ${itemId}:`, error); showToast("Errore aggiornamento stato.", "error"); }
};

// ==========================================================================
// == FUNZIONI PER LISTENER FIRESTORE ==
// ==========================================================================

function setupSubcollectionListener(tripId, subcollectionName, renderFunction, ...queryConstraints) {
    if (!currentUserId || !tripId) return;
    const fullPath = `trips/${tripId}/${subcollectionName}`;
    console.log(`*** Setting up listener for EXACT PATH: [${fullPath}] ***`);
    const collectionRef = collection(db, 'trips', tripId, subcollectionName);
    console.log(`SETUP LISTENER per: trips/${tripId}/${subcollectionName}`);
    const q = query(collectionRef, ...queryConstraints);
    console.log(`Imposto listener per: trips/${tripId}/${subcollectionName}`);
    const unsubscribe = onSnapshot(q, (snapshot) => {
        console.log(`Snapshot ${subcollectionName} (${tripId}), ${snapshot.size} doc.`);
        const items = []; snapshot.forEach(docSnap => items.push({ ...docSnap.data(), id: docSnap.id }));
        if (subcollectionName !== 'budgetItems' && currentTripDataCache) { currentTripDataCache[subcollectionName] = items; }
        else if (subcollectionName === 'budgetItems' && currentTripDataCache) { if (!currentTripDataCache.budget) currentTripDataCache.budget = {}; currentTripDataCache.budget.items = items; }
        if (subcollectionName === 'budgetItems') { renderBudget(currentTripDataCache?.budget); } else { renderFunction(items); }
        if (subcollectionName === 'participants' || subcollectionName === 'packingList') { populateDatalistsFromCache(); }
    }, (error) => { console.error(`Errore listener ${subcollectionName} (${tripId}):`, error); showToast(`Errore caricamento ${subcollectionName}.`, "error"); renderFunction([]); });
    unsubscribeSubcollectionListeners.push(unsubscribe);
}

function clearSubcollectionListeners() {
    console.warn(`>>> CLEARING ${unsubscribeSubcollectionListeners.length} LISTENERS <<<`);
  console.log(
    `Scollego ${unsubscribeSubcollectionListeners.length} listeners.`
  );
  unsubscribeSubcollectionListeners.forEach((unsub) => unsub());
  unsubscribeSubcollectionListeners = [];
}

// ==========================================================================
// == FUNZIONI RENDER LISTE (Aggiornate per dati Firestore/Cache) ==
// ==========================================================================

const populateDatalistsFromCache = () => {
    if (!currentTripDataCache || !participantDatalist || !packingCategoryDatalist) return;
    participantDatalist.innerHTML = ''; (currentTripDataCache.participants || []).forEach(p => { if (p && p.name) { const option = document.createElement('option'); option.value = p.name; participantDatalist.appendChild(option); } });
    packingCategoryDatalist.innerHTML = ''; const categories = new Set(DEFAULT_PACKING_CATEGORIES); (currentTripDataCache.packingList || []).forEach(p => { if (p && p.category) categories.add(p.category); }); Array.from(categories).sort().forEach(cat => { const option = document.createElement('option'); option.value = cat; packingCategoryDatalist.appendChild(option); }); console.log("Datalists popolate dalla cache.");
};
const renderParticipants = (participantsItems = []) => { /* ... (Usa helper createParticipantListItem, simile a prima) ... */
     if (!participantListUl) return; participantListUl.innerHTML = ''; if (noParticipantsItemsP) noParticipantsItemsP.style.display = participantsItems.length === 0 ? 'block' : 'none';
     participantsItems.forEach(item => { const li = createParticipantListItem(item); if(li) participantListUl.appendChild(li); });
};
const createParticipantListItem = (item) => { if (!item || !item.id) return null; const li = document.createElement('li'); li.dataset.itemId = item.id; li.innerHTML = `<div class="item-details"><strong><i class="fas fa-user fa-fw"></i> ${item.name || 'N/D'}</strong>${item.notes ? `<span class="meta"><i class="fas fa-info-circle fa-fw"></i> ${item.notes}</span>`:''}${item.extraInfo ? `<span class="meta"><i class="fas fa-sticky-note fa-fw"></i> ${item.extraInfo}</span>`:''}</div><div class="item-actions"><button class="btn-icon edit participant-edit-btn" data-item-id="${item.id}" title="Modifica"><i class="fas fa-edit"></i></button><button class="btn-icon delete participant-delete-btn" data-item-id="${item.id}" data-item-desc="${item.name || '?'}" title="Elimina"><i class="fas fa-trash-alt"></i></button></div>`; return li;};
const renderReminders = (remindersItems = []) => { /* ... (Usa helper createReminderListItem) ... */
    if (!reminderListUl) return; reminderListUl.innerHTML = ''; if(noReminderItemsP) noReminderItemsP.style.display = remindersItems.length === 0 ? 'block' : 'none';
    // Ordinamento client-side opzionale se query non basta
    const sortKey = currentSort.reminder; remindersItems.sort((a, b) => { if (sortKey === 'dueDate') { return (a?.dueDate || Timestamp.fromDate(new Date(9999,11,31))).toMillis() - (b?.dueDate || Timestamp.fromDate(new Date(9999,11,31))).toMillis(); } if (sortKey === 'status') { const statusOrder = { 'todo': 0, 'done': 1 }; return (statusOrder[a?.status] ?? 9) - (statusOrder[b?.status] ?? 9) || (a?.createdAt || Timestamp.fromDate(new Date(0))).toMillis() - (b?.createdAt || Timestamp.fromDate(new Date(0))).toMillis(); } return (a?.description || '').localeCompare(b?.description || ''); });
    remindersItems.forEach(item => { const li = createReminderListItem(item); if(li) reminderListUl.appendChild(li); });
};
const createReminderListItem = (item) => { if (!item || !item.id) return null; const li = document.createElement('li'); li.dataset.itemId = item.id; li.classList.toggle('done', item.status === 'done'); const statusClass = item.status === 'done' ? 'done' : 'todo'; const statusText = item.status === 'done' ? 'FATTO' : 'DA FARE'; const dueDateFormatted = formatDate(item.dueDate); li.innerHTML = `<div class="item-details"><strong> <span class="status-indicator ${statusClass}">${statusText}</span> ${item.description || 'N/D'} </strong> ${dueDateFormatted ? `<span class="meta due-date"><i class="fas fa-calendar-alt fa-fw"></i> Scadenza: ${dueDateFormatted}</span>` : ''} </div> <div class="item-actions"> <button class="btn-icon edit reminder-edit-btn" data-item-id="${item.id}" title="Modifica"><i class="fas fa-edit"></i></button> <button class="btn-icon delete reminder-delete-btn" data-item-id="${item.id}" data-item-desc="${item.description || '?'}" title="Elimina"><i class="fas fa-trash-alt"></i></button> </div>`; return li; };
const renderTransportations = (transportItems = []) => { /* ... (Usa helper createTransportationListItem) ... */
    if (!transportListUl) return; transportListUl.innerHTML = ''; if(noTransportItemsP) noTransportItemsP.style.display = transportItems.length === 0 ? 'block' : 'none';
    const sortKey = currentSort.transport; transportItems.sort((a, b) => { if (sortKey === 'type') { return (a?.type || '').localeCompare(b?.type || '') || (a?.departureDateTime || Timestamp.fromDate(new Date(0))).toMillis() - (b?.departureDateTime || Timestamp.fromDate(new Date(0))).toMillis(); } if (sortKey === 'cost') { return (safeToNumberOrNull(b?.cost) ?? -Infinity) - (safeToNumberOrNull(a?.cost) ?? -Infinity); } return (a?.departureDateTime || Timestamp.fromDate(new Date(0))).toMillis() - (b?.departureDateTime || Timestamp.fromDate(new Date(0))).toMillis(); });
    transportItems.forEach(item => { const li = createTransportationListItem(item); if(li) transportListUl.appendChild(li); });
};
const createTransportationListItem = (item) => { if (!item || !item.id) return null; const li = document.createElement('li'); li.dataset.itemId = item.id; const iconClass = getTransportIcon(item.type); const depDateTimeFormatted = formatDateTime(item.departureDateTime); const arrDateTimeFormatted = formatDateTime(item.arrivalDateTime); li.innerHTML = `<div class="item-details"><strong><i class="fas ${iconClass} fa-fw"></i> ${item.type}: ${item.description || 'N/D'}</strong><span class="meta"><i class="fas fa-plane-departure fa-fw"></i> Da: ${item.departureLoc || '?'} (${depDateTimeFormatted || '?'})</span><span class="meta"><i class="fas fa-plane-arrival fa-fw"></i> A: ${item.arrivalLoc || '?'} (${arrDateTimeFormatted || '?'})</span>${item.bookingRef ? `<span class="meta"><i class="fas fa-ticket-alt fa-fw"></i> Rif: ${item.bookingRef}</span>`:''}${item.cost!==null ? `<span class="meta"><i class="fas fa-euro-sign fa-fw"></i> Costo: ${formatCurrency(item.cost)}</span>`:''}${item.notes ? `<span class="meta"><i class="fas fa-info-circle fa-fw"></i> Note: ${item.notes}</span>`:''}${item.link ? `<span class="meta"><i class="fas fa-link fa-fw"></i> Link: ${formatDisplayLink(item.link)}</span>`:''}</div><div class="item-actions"><button class="btn-icon edit transport-edit-btn" data-item-id="${item.id}" title="Modifica"><i class="fas fa-edit"></i></button><button class="btn-icon delete transport-delete-btn" data-item-id="${item.id}" data-item-desc="${item.description || '?'}" title="Elimina"><i class="fas fa-trash-alt"></i></button></div>`; return li; };
const getTransportIcon = (type) => { switch(type) { case 'Volo': return 'fa-plane-departure'; case 'Treno': return 'fa-train'; case 'Auto': return 'fa-car'; case 'Bus': return 'fa-bus-alt'; case 'Traghetto': return 'fa-ship'; case 'Metro/Mezzi Pubblici': return 'fa-subway'; case 'Taxi/Ride Sharing': return 'fa-taxi'; default: return 'fa-road'; } };
const renderAccommodations = (accommodationsItems = []) => { /* ... (Usa helper createAccommodationListItem) ... */
    if (!accommodationListUl) return; accommodationListUl.innerHTML = ''; if(noAccommodationItemsP) noAccommodationItemsP.style.display = accommodationsItems.length === 0 ? 'block' : 'none';
    accommodationsItems.forEach(item => { const li = createAccommodationListItem(item); if(li) accommodationListUl.appendChild(li); });
};
const createAccommodationListItem = (item) => { if (!item || !item.id) return null; const li = document.createElement('li'); li.dataset.itemId = item.id; const mapLink = createMapLink(item.address); const checkinFormatted = formatDateTime(item.checkinDateTime); const checkoutFormatted = formatDateTime(item.checkoutDateTime); li.innerHTML = `<div class="item-details"><strong><i class="fas fa-hotel fa-fw"></i> ${item.name || 'N/D'} (${item.type || 'N/D'})</strong>${item.address ? `<span class="meta"><i class="fas fa-map-marker-alt fa-fw"></i> ${item.address} ${mapLink ? `<a href="${mapLink}" target="_blank" rel="noopener noreferrer" class="btn-map-link" title="Mostra Mappa"><i class="fas fa-map-marked-alt"></i></a>` : ''}</span>`:''}<span class="meta"><i class="fas fa-calendar-check fa-fw"></i> Check-in: ${checkinFormatted || '?'}</span><span class="meta"><i class="fas fa-calendar-times fa-fw"></i> Check-out: ${checkoutFormatted || '?'}</span>${item.bookingRef ? `<span class="meta"><i class="fas fa-key fa-fw"></i> Rif: ${item.bookingRef}</span>`:''}${item.cost!==null ? `<span class="meta"><i class="fas fa-euro-sign fa-fw"></i> Costo: ${formatCurrency(item.cost)}</span>`:''}${item.notes ? `<span class="meta"><i class="fas fa-info-circle fa-fw"></i> Note: ${item.notes}</span>`:''}${item.link ? `<span class="meta"><i class="fas fa-link fa-fw"></i> Link: ${formatDisplayLink(item.link)}</span>`:''}</div><div class="item-actions"><button class="btn-icon edit accommodation-edit-btn" data-item-id="${item.id}" title="Modifica"><i class="fas fa-edit"></i></button><button class="btn-icon delete accommodation-delete-btn" data-item-id="${item.id}" data-item-desc="${item.name || '?'}" title="Elimina"><i class="fas fa-trash-alt"></i></button></div>`; return li; };
const renderItinerary = (itineraryItems = []) => { /* ... (Filtra e usa helper createItineraryListItem) ... */
    if (!itineraryListUl) return; itineraryListUl.innerHTML = ''; if (noItineraryItemsP) noItineraryItemsP.style.display = itineraryItems.length === 0 ? 'block' : 'none';
    const searchTerm = currentSearchTerm.itinerary.toLowerCase();
    let filteredItems = itineraryItems;
    if (searchTerm) filteredItems = itineraryItems.filter(item => (item.activity?.toLowerCase() || '').includes(searchTerm) || (item.location?.toLowerCase() || '').includes(searchTerm) || (item.notes?.toLowerCase() || '').includes(searchTerm));
    // Ordinamento client-side opzionale
    const sortKey = currentSort.itinerary; filteredItems.sort((a, b) => { if (sortKey === 'activity') { return (a?.activity || '').localeCompare(b?.activity || ''); } const dayA = a?.day instanceof Timestamp ? a.day.toMillis() : 0; const dayB = b?.day instanceof Timestamp ? b.day.toMillis() : 0; const d = dayA - dayB; return d !== 0 ? d : (a?.time || '').localeCompare(b?.time || ''); });
    filteredItems.forEach(item => { const li = createItineraryListItem(item); if(li) itineraryListUl.appendChild(li); });
};
const createItineraryListItem = (item) => { if (!item || !item.id) return null; const li = document.createElement('li'); li.dataset.itemId = item.id; const mapLink = createMapLink(item.location); const dayFormatted = formatDate(item.day); li.innerHTML = `<div class="item-details"><strong>${dayFormatted || '?'} ${item.time?'('+item.time+')':''} - ${item.activity||'N/D'}</strong>${item.location ? `<span class="meta"><i class="fas fa-map-marker-alt fa-fw"></i> ${item.location} ${mapLink ? `<a href="${mapLink}" target="_blank" rel="noopener noreferrer" class="btn-map-link" title="Mostra Mappa"><i class="fas fa-map-marked-alt"></i></a>` : ''}</span>`:''}${item.bookingRef ? `<span class="meta"><i class="fas fa-ticket-alt fa-fw"></i> Rif: ${item.bookingRef}</span>`:''}${item.cost!==null ? `<span class="meta"><i class="fas fa-euro-sign fa-fw"></i> Costo: ${formatCurrency(item.cost)}</span>`:''}${item.notes ? `<span class="meta"><i class="fas fa-info-circle fa-fw"></i> Note: ${item.notes}</span>`:''}${item.link ? `<span class="meta"><i class="fas fa-link fa-fw"></i> Link: ${formatDisplayLink(item.link)}</span>`:''}</div><div class="item-actions"><button class="btn-icon edit itinerary-edit-btn" data-item-id="${item.id}" title="Modifica"><i class="fas fa-edit"></i></button><button class="btn-icon delete itinerary-delete-btn" data-item-id="${item.id}" data-item-desc="${item.activity || '?'}" title="Elimina"><i class="fas fa-trash-alt"></i></button></div>`; return li; };
const renderBudget = (budgetObject = { items: [] }) => { /* ... (Calcola totali, ordina lato client, usa helper createBudgetListItem) ... */
    const budgetItems = Array.isArray(budgetObject.items) ? budgetObject.items : [];
    if (!budgetListUl) return; budgetListUl.innerHTML = ''; if (noBudgetItemsP) noBudgetItemsP.style.display = budgetItems.length === 0 ? 'block' : 'none';
    let calcEst = 0; let calcAct = 0; budgetItems.forEach(item => { const est = safeToNumberOrNull(item.estimated); const act = safeToNumberOrNull(item.actual); if (est !== null) calcEst += est; if (act !== null) calcAct += act; });
    const sortKey = currentSort.budget; budgetItems.sort((a, b) => { if (sortKey === 'estimatedDesc') { return (safeToNumberOrNull(b?.estimated) ?? -Infinity) - (safeToNumberOrNull(a?.estimated) ?? -Infinity); } if (sortKey === 'actualDesc') { return (safeToNumberOrNull(b?.actual) ?? -Infinity) - (safeToNumberOrNull(a?.actual) ?? -Infinity); } if (sortKey === 'description') { return (a?.description || '').localeCompare(b?.description || ''); } return (a?.category || '').localeCompare(b?.category || ''); });
    budgetItems.forEach(item => { const li = createBudgetListItem(item); if(li) budgetListUl.appendChild(li); });
    if (budgetTotalEstimatedStrong) budgetTotalEstimatedStrong.textContent = formatCurrency(calcEst); if (budgetTotalActualStrong) budgetTotalActualStrong.textContent = formatCurrency(calcAct); const diff = calcAct - calcEst; if (budgetDifferenceStrong) { budgetDifferenceStrong.textContent = formatCurrency(diff); budgetDifferenceStrong.className = ''; if (diff < 0) budgetDifferenceStrong.classList.add('positive'); else if (diff > 0) budgetDifferenceStrong.classList.add('negative'); }
    // Aggiorna cache totali
    if (currentTripDataCache && currentTripDataCache.budget) { currentTripDataCache.budget.estimatedTotal = calcEst; currentTripDataCache.budget.actualTotal = calcAct; }
};
const createBudgetListItem = (item) => { if (!item || !item.id) return null; const li = document.createElement('li'); li.dataset.itemId = item.id; const est = safeToNumberOrNull(item.estimated); const act = safeToNumberOrNull(item.actual); let cls = ''; if (act !== null && est !== null && est > 0) { if (act > est) cls = 'negative'; else if (act < est) cls = 'positive'; } li.innerHTML = `<div class="item-details"><strong>${item.category||'N/D'}: ${item.description||'N/D'}</strong><span class="meta">Stimato: ${formatCurrency(est)} | Effettivo: <span class="${cls}">${act === null ? 'N/A' : formatCurrency(act)}</span></span>${ (item.paidBy || item.splitBetween) ? `<span class="meta split-info"><i class="fas fa-user-friends fa-fw"></i> Pagato da: ${item.paidBy || '?'} / Diviso tra: ${item.splitBetween || '?'}</span>` : '' }</div><div class="item-actions"><button class="btn-icon edit budget-edit-btn" data-item-id="${item.id}" title="Modifica"><i class="fas fa-edit"></i></button><button class="btn-icon delete budget-delete-btn" data-item-id="${item.id}" data-item-desc="${item.description || '?'}" title="Elimina"><i class="fas fa-trash-alt"></i></button></div>`; return li; };
const renderPackingList = (packingItems = []) => { /* ... (Filtra, ordina, raggruppa, usa helper createPackingListItem) ... */
    if (!packingListUl) return; packingListUl.innerHTML = ''; if (noPackingItemsP) noPackingItemsP.style.display = packingItems.length === 0 ? 'block' : 'none';
    const searchTerm = currentSearchTerm.packing.toLowerCase(); let filteredItems = packingItems; if (searchTerm) filteredItems = packingItems.filter(item => (item.name?.toLowerCase() || '').includes(searchTerm) || (item.category?.toLowerCase() || '').includes(searchTerm));
    const sortKey = currentSort.packing; filteredItems.sort((a, b) => { if (sortKey === 'category') { return (a?.category || 'zzz').localeCompare(b?.category || 'zzz') || (a?.name || '').localeCompare(b?.name || ''); } if (sortKey === 'status') { const packedA = a.packed ? 1 : 0; const packedB = b.packed ? 1 : 0; return packedA - packedB || (a?.name || '').localeCompare(b?.name || ''); } return (a?.name||'').localeCompare(b?.name||''); });
    if (sortKey === 'category') { const grouped = filteredItems.reduce((acc, item) => { const cat = item.category || 'Altro'; if (!acc[cat]) acc[cat] = []; acc[cat].push(item); return acc; }, {}); const sortedCategories = Object.keys(grouped).sort((a, b) => (a === 'Altro' ? 1 : b === 'Altro' ? -1 : a.localeCompare(b))); packingListUl.innerHTML = ''; sortedCategories.forEach(category => { const groupDiv = document.createElement('div'); groupDiv.classList.add('packing-list-category-group'); const title = document.createElement('h5'); title.textContent = category; groupDiv.appendChild(title); const groupUl = document.createElement('ul'); groupUl.classList.add('item-list', 'packing-list', 'nested'); grouped[category].forEach(item => { const listItem = createPackingListItem(item); if(listItem) groupUl.appendChild(listItem); }); groupDiv.appendChild(groupUl); packingListUl.appendChild(groupDiv); }); }
    else { filteredItems.forEach(item => { const listItem = createPackingListItem(item); if(listItem) packingListUl.appendChild(listItem); }); }
};
const createPackingListItem = (item) => { /* ... (invariato, ma usa data-item-desc) ... */ if (!item || !item.id) return null; const li = document.createElement('li'); li.dataset.itemId = item.id; li.classList.toggle('packed', item.packed); li.innerHTML = `<div class="form-check"><input class="form-check-input packing-checkbox" type="checkbox" id="pack-${item.id}" data-item-id="${item.id}" ${item.packed?'checked':''}> <label class="form-check-label" for="pack-${item.id}"> ${item.name||'N/D'} ${item.quantity > 1 ? `<span class="packing-quantity">(x${item.quantity})</span>` : ''} </label> </div> <div class="item-details"> ${item.category && item.category !== 'Altro' ? `<span class="packing-category">${item.category}</span>` : ''} </div> <div class="item-actions"> <button class="btn-icon edit packing-edit-btn" data-item-id="${item.id}" title="Modifica"><i class="fas fa-edit"></i></button> <button class="btn-icon delete packing-delete-btn" data-item-id="${item.id}" data-item-desc="${item.name || '?'}" title="Elimina"><i class="fas fa-trash-alt"></i></button> </div>`; return li; };

// ==========================================================================
// == FUNZIONE AGGIUNGI COSTO AL BUDGET (Firestore) ==
// ==========================================================================
const addCostToBudget = async (category, description, cost) => { /* ... (invariato, chiama addDoc) ... */ if (!currentUserId || !currentTripId || cost === null || cost <= 0) { showToast("Seleziona un viaggio e specifica un costo valido.", "warning"); return; } const budgetItem = { category: category, description: description, estimated: cost, actual: null, paidBy: null, splitBetween: null, createdAt: serverTimestamp(), updatedAt: serverTimestamp() }; try { const budgetItemsColRef = collection(db, 'trips', currentTripId, 'budgetItems'); const docRef = await addDoc(budgetItemsColRef, budgetItem); console.log(`Voce budget ${docRef.id} aggiunta da ${category}.`); showToast(`Costo ${category} (${formatCurrency(cost)}) aggiunto al budget!`, 'success'); } catch (error) { console.error("Errore aggiunta voce budget:", error); showToast("Errore durante l'aggiunta al budget.", "error"); } };
const handleCalculateAndAddTransportCost = () => { /* ... (invariato, legge da cache, chiama addCostToBudget) ... */ if (!currentTripId) { showToast("Seleziona un viaggio.", "error"); return; } if (!currentTripDataCache || !Array.isArray(currentTripDataCache.transportations)) { showToast("Dati trasporti non caricati.", "warning"); return; } let totalCost = 0; currentTripDataCache.transportations.forEach(item => { const cost = safeToNumberOrNull(item?.cost); if (cost !== null && cost > 0) { totalCost += cost; } }); if (totalCost <= 0) { showToast("Nessun costo trasporto trovato.", "info"); return; } addCostToBudget("Trasporti", `Totale Costi Trasporti (del ${formatDate(Timestamp.now())})`, totalCost); };

// ==========================================================================
// == FUNZIONI UI (Aggiornate o invariate) ==
// ==========================================================================
const switchTab = (tabId) => { /* ... (invariato) ... */ if (!tabId || !tabsContainer) return; document.querySelectorAll(".tab-content").forEach(t => { t.classList.remove("active"); t.style.display = "none"; }); document.querySelectorAll(".tab-link").forEach(l => l.classList.remove("active")); const c = document.getElementById(tabId); const l = tabsContainer.querySelector(`.tab-link[data-tab="${tabId}"]`); if (c) { c.style.display = "block"; requestAnimationFrame(() => c.classList.add("active")); } else { console.error(`Contenuto tab ${tabId} non trovato`); } if (l) l.classList.add("active"); else { console.error(`Link tab ${tabId} non trovato`); } };
const toggleSearchButtonsVisibility = () => { /* ... (invariato) ... */ if (!transportTypeSelect) return; const type = transportTypeSelect.value; if(searchSkyscannerBtn) searchSkyscannerBtn.style.display = (type === 'Volo') ? 'inline-flex' : 'none'; if(searchTrainlineBtn) searchTrainlineBtn.style.display = (type === 'Treno') ? 'inline-flex' : 'none'; };
const handleSortChange = (listType, selectElement) => { /* ... (invariato, riordina client-side) ... */ if (!currentTripId || !currentTripDataCache) return; currentSort[listType] = selectElement.value; switch(listType) { case 'reminder': renderReminders(currentTripDataCache.reminders); break; case 'transport': renderTransportations(currentTripDataCache.transportations); break; case 'itinerary': renderItinerary(currentTripDataCache.itinerary); break; case 'budget': renderBudget(currentTripDataCache.budget); break; case 'packing': renderPackingList(currentTripDataCache.packingList); break; } console.log(`Riordinamento ${listType} con chiave: ${currentSort[listType]}`); };
const applyCurrentSortToControls = () => { /* ... (invariato) ... */ if(reminderSortControl) reminderSortControl.value = currentSort.reminder; if(transportSortControl) transportSortControl.value = currentSort.transport; if(itinerarySortControl) itinerarySortControl.value = currentSort.itinerary; if(budgetSortControl) budgetSortControl.value = currentSort.budget; if(packingSortControl) packingSortControl.value = currentSort.packing; };
const handleInternalSearch = (listType, inputElement) => { /* ... (invariato, filtra client-side) ... */ if (!currentTripId || !currentTripDataCache) return; currentSearchTerm[listType] = inputElement.value.toLowerCase(); if (listType === 'itinerary') renderItinerary(currentTripDataCache.itinerary); else if (listType === 'packing') renderPackingList(currentTripDataCache.packingList); };

// ==========================================================================
// == FUNZIONI RICERCA ESTERNA (Invariate) ==
// ==========================================================================
const handleSearchFlights = () => { /* ... (invariato) ... */ const origin = transportDepartureLocInput.value.trim(); const dest = transportArrivalLocInput.value.trim(); const startRaw = transportDepartureDatetimeInput.value ? transportDepartureDatetimeInput.value.split('T')[0] : ''; const endRaw = transportArrivalDatetimeInput.value ? transportArrivalDatetimeInput.value.split('T')[0] : ''; const startSky = formatSkyscannerDate(startRaw); const endSky = formatSkyscannerDate(endRaw); if (!origin || !dest) { showToast("Inserisci Origine e Destinazione.", "warning"); return; } if (!startSky || !endSky) { showToast("Inserisci date valide.", "warning"); return; } if (startRaw > endRaw) { showToast("Data arrivo non valida.", "warning"); return; } const base = "https://www.skyscanner.it/trasporti/voli/"; const origCode = origin.toLowerCase().replace(/\s+/g, '-') || 'anywhere'; const destCode = dest.toLowerCase().replace(/\s+/g, '-') || 'anywhere'; const url = `${base}${origCode}/${destCode}/${startSky}/${endSky}/?rtn=1&adults=1&children=0&infants=0&cabinclass=economy&preferdirects=false`; window.open(url, '_blank', 'noopener,noreferrer'); };
const handleSearchTrains = () => { /* ... (invariato) ... */ const origin = transportDepartureLocInput.value.trim(); const dest = transportArrivalLocInput.value.trim(); const startRaw = transportDepartureDatetimeInput.value ? transportDepartureDatetimeInput.value.split('T')[0] : ''; const endRaw = transportArrivalDatetimeInput.value ? transportArrivalDatetimeInput.value.split('T')[0] : ''; if (!origin || !dest) { showToast("Inserisci Origine e Destinazione.", "warning"); return; } if (!startRaw.match(/^\d{4}-\d{2}-\d{2}$/) || !endRaw.match(/^\d{4}-\d{2}-\d{2}$/)) { showToast("Inserisci Date valide.", "warning"); return; } if (startRaw > endRaw) { showToast("Data arrivo non valida.", "warning"); return; } const base = "https://www.thetrainline.com/it/orari-treni/"; const origFmt = origin.toUpperCase().replace(/\s+/g, '-'); const destFmt = dest.toUpperCase().replace(/\s+/g, '-'); const url = `${base}${origFmt}-a-${destFmt}?departureDate=${startRaw}&returnDate=${endRaw}&adults=1`; window.open(url, '_blank', 'noopener,noreferrer'); };

// ==========================================================================
// == FUNZIONI DOWNLOAD / EMAIL / COPIA (Usano Cache) ==
// ==========================================================================
const handleEmailSummary = () => { /* ... (Usa currentTripDataCache) ... */ try { if (!currentUserId || !currentTripId || !currentTripDataCache) { showToast("Seleziona un viaggio caricato.", "warning"); return; } const trip = currentTripDataCache; let emailBody = `Riepilogo Viaggio: ${trip.name || 'S.N.'}\n========================\n\n`; emailBody += `Destinazione: ${trip.destination || 'N/D'}\nDate: ${formatDate(trip.startDate)} - ${formatDate(trip.endDate)}\nPartecipanti: ${(trip.participants || []).map(p => p.name).join(', ') || 'Nessuno'}\n\nNote: ${trip.notes || '-'}\n\n(Dettagli completi su app)\n`; const emailSubject = `Riepilogo Viaggio: ${trip.name || 'S.N.'}`; const mailtoLink = `mailto:?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`; try { const mailWindow = window.open(mailtoLink, '_blank'); if (!mailWindow || mailWindow.closed || typeof mailWindow.closed=='undefined') { window.location.href = mailtoLink; } } catch (e) { showToast("Impossibile aprire client email.", "error"); } } catch (error) { showToast("Errore preparazione email.", "error"); } };
const handleCopySummary = () => { /* ... (Usa currentTripDataCache) ... */ try { if (!currentUserId || !currentTripId || !currentTripDataCache) { showToast("Seleziona un viaggio caricato.", "warning"); return; } const trip = currentTripDataCache; let textToCopy = `✈️ *Riepilogo Viaggio: ${trip.name || 'S.N.'}*\n📍 Destinazione: ${trip.destination || 'N/D'}\n📅 Date: ${formatDate(trip.startDate)} - ${formatDate(trip.endDate)}\n👥 Partecipanti: ${(trip.participants || []).map(p => p.name).join(', ') || 'Nessuno'}\n📝 Note: ${trip.notes || '-'}\n(Dettagli su app)`; if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(textToCopy).then(() => showToast("Riepilogo copiato!", "success")).catch(err => fallbackCopyTextToClipboard(textToCopy)); } else { fallbackCopyTextToClipboard(textToCopy); } } catch (error) { showToast("Errore copia testo.", "error"); } };
const handleDownloadText = () => { /* ... (Usa currentTripDataCache e formatters aggiornati) ... */ try { if (!currentUserId || !currentTripId || !currentTripDataCache) { showToast("Seleziona un viaggio caricato.", "error"); return; } const trip = currentTripDataCache; if (!trip) return; let content = ''; try { content = `Riepilogo Viaggio: ${trip.name || 'S.N.'} ${trip.isTemplate ? '(TEMPLATE)' : ''}\n========================\n\n**INFO**\nOrigine: ${trip.originCity || 'N/D'}\nDest.: ${trip.destination || 'N/D'}\nDate: ${formatDate(trip.startDate)} - ${formatDate(trip.endDate)}\nNote: ${trip.notes || '-'}\nExtra Info: ${trip.extraInfo || '-'}\n\n`; content += `**PARTECIPANTI** (${(trip.participants || []).length})\n`; (trip.participants || []).forEach(p => { content += `- ${p.name}${p.notes ? ' ('+p.notes+')':''}${p.extraInfo ? ' [Extra: '+p.extraInfo+']':''}\n`}); if((trip.participants || []).length === 0) content += "Nessuno\n"; content += "\n"; content += `**PROMEMORIA** (${(trip.reminders || []).length})\n`; (trip.reminders || []).forEach(r => { content += `- [${r.status==='done'?'X':' '}] ${r.description}${r.dueDate ? ' (Scad: '+formatDate(r.dueDate)+')':''}\n`}); if((trip.reminders || []).length === 0) content += "Nessuno\n"; content += "\n"; content += `**TRASPORTI** (${(trip.transportations || []).length})\n`; (trip.transportations || []).forEach(i => { content += `- ${i.type} (${i.description}): Da ${i.departureLoc||'?'} (${formatDateTime(i.departureDateTime)}) a ${i.arrivalLoc||'?'} (${formatDateTime(i.arrivalDateTime)})${i.cost!==null ? ' Costo: '+formatCurrency(i.cost):''}${i.bookingRef ? ' Rif: '+i.bookingRef:''}${i.notes ? ' Note: '+i.notes:''}${i.link ? ' Link: '+i.link:''}\n` }); if((trip.transportations || []).length === 0) content += "Nessuno\n"; content += "\n"; content += `**ALLOGGI** (${(trip.accommodations || []).length})\n`; (trip.accommodations || []).forEach(i => { content += `- ${i.name} (${i.type}): ${i.address||'?'}. CheckIn: ${formatDateTime(i.checkinDateTime)}, CheckOut: ${formatDateTime(i.checkoutDateTime)}${i.cost!==null ? ' Costo: '+formatCurrency(i.cost):''}${i.bookingRef ? ' Rif: '+i.bookingRef:''}${i.notes ? ' Note: '+i.notes:''}${i.link ? ' Link: '+i.link:''}\n` }); if((trip.accommodations || []).length === 0) content += "Nessuno\n"; content += "\n"; content += `**ITINERARIO** (${(trip.itinerary || []).length})\n`; (trip.itinerary || []).forEach(i => { content += `- ${formatDate(i.day)}${i.time?' ('+i.time+')':''} ${i.activity}${i.location?' @'+i.location:''}${i.bookingRef?' [Rif:'+i.bookingRef+']':''}${i.cost!==null?' Costo:'+formatCurrency(i.cost):''}${i.notes?' ('+i.notes+')':''}${i.link?' Link:'+i.link:''}\n` }); if((trip.itinerary || []).length === 0) content += "Nessuno\n"; content += "\n"; content += `**BUDGET** (${(trip.budget?.items || []).length} voci)\n`; (trip.budget?.items || []).forEach(i => { content += `- ${i.category}: ${i.description} (Est: ${formatCurrency(i.estimated)}, Act: ${i.actual===null?'N/A':formatCurrency(i.actual)})${i.paidBy ? ' Pagato da: '+i.paidBy:''}${i.splitBetween ? ' Diviso: '+i.splitBetween:''}\n` }); const budgetItemsExist = (trip.budget?.items || []).length > 0; if(budgetItemsExist) content += `> Tot Est: ${formatCurrency(trip.budget?.estimatedTotal||0)}, Tot Act: ${formatCurrency(trip.budget?.actualTotal||0)}, Diff: ${formatCurrency((trip.budget?.actualTotal||0) - (trip.budget?.estimatedTotal||0))}\n`; else content += "Nessuna spesa\n"; content += "\n"; content += `**PACKING LIST** (${(trip.packingList || []).length})\n`; (trip.packingList || []).forEach(i => { content += `- [${i.packed?'X':' '}] ${i.name}${i.quantity>1?' (x'+i.quantity+')':''} [${i.category||'Altro'}]\n` }); if((trip.packingList || []).length === 0) content += "Lista vuota\n"; if (content.length === 0) throw new Error("Contenuto TXT vuoto."); } catch (genError) { showToast("Errore preparazione testo.", "error"); return; } try { const blob = new Blob([content],{type:'text/plain;charset=utf-8'}); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `Viaggio-${(trip.name||'SN').replace(/[^a-z0-9]/gi,'_')}.txt`; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url); } catch (downloadError) { showToast("Errore download file.", "error"); } } catch (error) { showToast("Errore generazione testo.", "error"); } };
const handleDownloadExcel = () => { /* ... (Usa currentTripDataCache e formatters aggiornati per date/numeri) ... */ try { if (!currentUserId || !currentTripId || !currentTripDataCache) { showToast("Seleziona un viaggio caricato.", "error"); return; } const trip = currentTripDataCache; if (!trip) return; if (typeof XLSX === 'undefined') { showToast("Errore libreria Excel.", "error"); return; } let wb; try { wb = XLSX.utils.book_new(); const cf = '#,##0.00 €'; const nf = '#,##0'; const createDateCell = (ts) => formatDate(ts); const createDateTimeCell = (ts) => formatDateTime(ts); const budgetEstTotal = safeToNumberOrNull(trip.budget?.estimatedTotal) ?? 0; const budgetActTotal = safeToNumberOrNull(trip.budget?.actualTotal) ?? 0; const summary = [ ["Voce","Dettaglio"], ["Viaggio", trip.name||'S.N.'], ["Template", trip.isTemplate ? 'Sì' : 'No'], ["Origine", trip.originCity||'N/D'], ["Dest.", trip.destination||'N/D'], ["Periodo", `${createDateCell(trip.startDate)} - ${createDateCell(trip.endDate)}`], ["Note", trip.notes||'-'], ["Extra Info", trip.extraInfo||'-'], [], ["Budget Est.",{t:'n',v:budgetEstTotal,z:cf}], ["Budget Act.",{t:'n',v:budgetActTotal,z:cf}], ["Diff.",{t:'n',v:budgetActTotal-budgetEstTotal,z:cf}], [], ["# Partecipanti", (trip.participants||[]).length], ["# Promemoria", (trip.reminders||[]).length], ["# Trasporti", (trip.transportations||[]).length], ["# Alloggi", (trip.accommodations||[]).length], ["# Itin.", (trip.itinerary||[]).length], ["# Budget", (trip.budget?.items||[]).length], ["# Packing", (trip.packingList||[]).length]]; const wsSum = XLSX.utils.aoa_to_sheet(summary); wsSum['!cols']=[{wch:15},{wch:50}]; XLSX.utils.book_append_sheet(wb, wsSum, "Riepilogo"); const partH = ["Nome", "Note", "Extra Info"]; const partD = (trip.participants||[]).map(p=>[p.name, p.notes, p.extraInfo]); const wsPart = XLSX.utils.aoa_to_sheet([partH, ...partD]); wsPart['!cols']=[{wch:30},{wch:40},{wch:40}]; XLSX.utils.book_append_sheet(wb, wsPart, "Partecipanti"); const remH = ["Stato", "Descrizione", "Scadenza"]; const remD = (trip.reminders||[]).map(r => [r.status === 'done' ? 'Fatto' : 'Da Fare', r.description, createDateCell(r.dueDate)]); const wsRem = XLSX.utils.aoa_to_sheet([remH, ...remD]); wsRem['!cols'] = [{wch:10}, {wch:50}, {wch:12}]; XLSX.utils.book_append_sheet(wb, wsRem, "Promemoria"); const th = ["Tipo","Desc.","Da Luogo","Da Data/Ora","A Luogo","A Data/Ora","Rif.","Costo","Note","Link/File"]; const td = (trip.transportations||[]).map(i=>[i.type, i.description, i.departureLoc, createDateTimeCell(i.departureDateTime), i.arrivalLoc, createDateTimeCell(i.arrivalDateTime), i.bookingRef, i.cost===null?null:{t:'n',v:i.cost,z:cf}, i.notes, i.link]); const wsT = XLSX.utils.aoa_to_sheet([th, ...td]); wsT['!cols']=[{wch:12},{wch:25},{wch:18},{wch:16},{wch:18},{wch:16},{wch:15},{wch:12},{wch:25},{wch:30}]; XLSX.utils.book_append_sheet(wb, wsT, "Trasporti"); const ah = ["Nome","Tipo","Indirizzo","CheckIn","CheckOut","Rif.","Costo","Note","Link/File"]; const ad = (trip.accommodations||[]).map(i=>[i.name,i.type,i.address,createDateTimeCell(i.checkinDateTime),createDateTimeCell(i.checkoutDateTime),i.bookingRef,i.cost===null?null:{t:'n',v:i.cost,z:cf},i.notes, i.link]); const wsA = XLSX.utils.aoa_to_sheet([ah,...ad]); wsA['!cols']=[{wch:25},{wch:10},{wch:35},{wch:16},{wch:16},{wch:20},{wch:12},{wch:30},{wch:30}]; XLSX.utils.book_append_sheet(wb, wsA, "Alloggi"); const ih = ["Giorno","Ora","Attività","Luogo","Rif. Pren.","Costo","Note","Link/File"]; const idata = (trip.itinerary||[]).map(i=>[createDateCell(i.day),i.time,i.activity,i.location,i.bookingRef,i.cost===null?null:{t:'n',v:i.cost,z:cf},i.notes, i.link]); const wsI = XLSX.utils.aoa_to_sheet([ih, ...idata]); wsI['!cols']=[{wch:10},{wch:8},{wch:30},{wch:25},{wch:20},{wch:12},{wch:30},{wch:30}]; XLSX.utils.book_append_sheet(wb, wsI, "Itinerario"); const bh = ["Cat.","Desc.","Est. (€)","Act. (€)", "Pagato Da", "Diviso Tra"]; const bd = (trip.budget?.items||[]).map(i=>[i.category,i.description,{t:'n',v:safeToNumberOrNull(i.estimated)??0,z:cf},i.actual===null?null:{t:'n',v:safeToNumberOrNull(i.actual)??0,z:cf}, i.paidBy, i.splitBetween]); bd.push([],["TOTALI","", {t:'n',v:budgetEstTotal,z:cf}, {t:'n',v:budgetActTotal,z:cf}, "", ""]); const wsB = XLSX.utils.aoa_to_sheet([bh, ...bd]); wsB['!cols']=[{wch:15},{wch:35},{wch:15},{wch:15},{wch:20},{wch:20}]; XLSX.utils.book_append_sheet(wb, wsB, "Budget"); const ph = ["Categoria", "Oggetto", "Qtà", "Fatto?"]; const pd = (trip.packingList||[]).map(i=>[i.category, i.name, {t:'n', v:safeToPositiveIntegerOrDefault(i.quantity), z:nf}, i.packed?'Sì':'No']); const wsP = XLSX.utils.aoa_to_sheet([ph, ...pd]); wsP['!cols']=[{wch:20}, {wch:40},{wch:5},{wch:8}]; XLSX.utils.book_append_sheet(wb, wsP, "Packing List"); if (!wb || !wb.SheetNames || wb.SheetNames.length === 0) throw new Error("Workbook vuoto."); } catch (buildError) { showToast("Errore preparazione Excel.", "error"); return; } try { const fn = `Viaggio-${(trip.name||'SN').replace(/[^a-z0-9]/gi,'_')}.xlsx`; XLSX.writeFile(wb, fn); } catch (writeError) { showToast("Errore download Excel.", "error"); } } catch (error) { showToast("Errore generazione Excel.", "error"); } };

// ==========================================================================
// == FUNZIONI CONDIVISIONE VIA FIREBASE (Usa Cache) ==
// ==========================================================================
const handleShareViaLink = async () => { /* ... (Usa currentTripDataCache, aggiunge sharedAt, chiama addDoc su 'sharedTrips') ... */ if (!db || !currentUserId || !currentTripId || !currentTripDataCache) { showToast("Seleziona un viaggio caricato.", "warning"); return; } const originalTrip = currentTripDataCache; if (originalTrip.isTemplate) { showToast("Non puoi condividere template.", "warning"); return; } const shareButton = shareTripBtn; if (shareButton) { shareButton.disabled = true; shareButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Preparo...'; } let dataToSend = null; let shareLink = null; try { dataToSend = JSON.parse(JSON.stringify(originalTrip)); dataToSend.sharedAt = Timestamp.now(); if (shareButton) shareButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvo...'; const docRef = await addDoc(collection(db, "sharedTrips"), dataToSend); shareLink = `${window.location.origin}${window.location.pathname}?shareId=${docRef.id}`; console.log("Viaggio condiviso: ", docRef.id); if (navigator.share) { const shareData = { title: `Viaggio: ${originalTrip.name || 'S.N.'}`, text: `Dettagli viaggio "${originalTrip.name || 'S.N.'}":\nDest: ${originalTrip.destination || 'N/D'}\nDate: ${formatDate(originalTrip.startDate)} - ${formatDate(originalTrip.endDate)}\n(Apri link per importare)`, url: shareLink, }; if (shareButton) shareButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Apro...'; await navigator.share(shareData); showToast("Pannello condivisione aperto.", "success"); } else { prompt("Copia questo link:", shareLink); showToast("Link condivisione generato!", "success"); } } catch (error) { if (error.name === 'AbortError') { showToast("Condivisione annullata.", "info"); } else { showToast("Errore condivisione.", "error"); if (shareLink) { prompt("Errore condivisione. Copia link:", shareLink); } } } finally { if (shareButton) { shareButton.disabled = false; shareButton.innerHTML = '<i class="fas fa-share-alt"></i> Condividi'; } } };
const cloneAndPrepareForImport = (sharedTripData) => { /* ... (Clona, assegna nuovo ownerUid, converte date, prepara subcollections senza ID) ... */ const newTripBase = JSON.parse(JSON.stringify(sharedTripData)); const newTrip = { name: newTripBase.name || 'Viaggio Importato', ownerUid: currentUserId, originCity: newTripBase.originCity || '', destination: newTripBase.destination || '', startDate: toTimestampOrNull(newTripBase.startDate), endDate: toTimestampOrNull(newTripBase.endDate), notes: newTripBase.notes || '', isTemplate: false, extraInfo: newTripBase.extraInfo || '', createdAt: serverTimestamp(), updatedAt: serverTimestamp(), }; const subCollectionsData = {}; const subNames = ['participants', 'reminders', 'transportations', 'accommodations', 'itinerary', 'budgetItems', 'packingList']; subNames.forEach(name => { let source = []; if (name === 'budgetItems' && newTripBase.budget?.items) source = newTripBase.budget.items; else if (newTripBase[name]) source = newTripBase[name]; subCollectionsData[name] = source.map(item => { const newItem = { ...item }; delete newItem.id; if (newItem.dueDate) newItem.dueDate = toTimestampOrNull(newItem.dueDate); if (newItem.departureDateTime) newItem.departureDateTime = toTimestampOrNull(newItem.departureDateTime); if (newItem.arrivalDateTime) newItem.arrivalDateTime = toTimestampOrNull(newItem.arrivalDateTime); if (newItem.checkinDateTime) newItem.checkinDateTime = toTimestampOrNull(newItem.checkinDateTime); if (newItem.checkoutDateTime) newItem.checkoutDateTime = toTimestampOrNull(newItem.checkoutDateTime); if (newItem.day) newItem.day = toTimestampOrNull(newItem.day); if (newItem.cost !== undefined) newItem.cost = safeToNumberOrNull(newItem.cost); if (newItem.estimated !== undefined) newItem.estimated = safeToNumberOrNull(newItem.estimated); if (newItem.actual !== undefined) newItem.actual = safeToNumberOrNull(newItem.actual); if (newItem.quantity !== undefined) newItem.quantity = safeToPositiveIntegerOrDefault(newItem.quantity); if(name === 'reminders' && !newItem.status) newItem.status = 'todo'; if(name === 'packingList' && newItem.packed === undefined) newItem.packed = false; if(name === 'packingList' && !newItem.category) newItem.category = 'Altro'; newItem.createdAt = serverTimestamp(); newItem.updatedAt = serverTimestamp(); return newItem; }); }); return { newTripData: newTrip, subCollectionsData: subCollectionsData }; }
const handleImportSharedTrip = async (sharedTripData) => { /* ... (Chiama cloneAndPrepare, usa addDoc e batch write per salvare nuovo viaggio e subcollections) ... */ if (!sharedTripData || !currentUserId) return; console.log("Avvio importazione..."); try { const { newTripData, subCollectionsData } = cloneAndPrepareForImport(sharedTripData); const newTripDocRef = await addDoc(collection(db, "trips"), newTripData); const newTripId = newTripDocRef.id; console.log(`Viaggio importato: ${newTripId}`); const subNames = Object.keys(subCollectionsData); const importPromises = subNames.map(async (subName) => { const items = subCollectionsData[subName]; if (items.length > 0) { const targetColRef = collection(db, 'trips', newTripId, subName); const batch = writeBatch(db); items.forEach(itemData => batch.set(doc(targetColRef), itemData)); await batch.commit(); console.log(`Importati ${items.length} in ${subName}`); } }); await Promise.all(importPromises); console.log("Importazione completata."); showToast(`Viaggio "${newTripData.name || 'S.N.'}" importato!`, "success"); } catch (error) { console.error("Errore importazione:", error); showToast("Errore importazione viaggio.", "error"); } };
const checkForSharedTrip = async () => { /* ... (Invariato, ma chiama handleImportSharedTrip aggiornato) ... */ if (!db) return; const urlParams = new URLSearchParams(window.location.search); const shareId = urlParams.get('shareId'); if (shareId) { console.log("Trovato shareId:", shareId); const currentUrl = new URL(window.location.href); currentUrl.searchParams.delete('shareId'); history.replaceState(null, '', currentUrl.toString()); showToast("Recupero viaggio...", "info"); try { const docRef = doc(db, "sharedTrips", shareId); const docSnap = await getDoc(docRef); if (docSnap.exists()) { const data = docSnap.data(); showConfirmationModal('Importa Viaggio Condiviso', `Importare "${data.name || 'S.N.'}"?`, () => handleImportSharedTrip(data)); } else { showToast("Viaggio condiviso non trovato.", "error"); } } catch (error) { showToast("Errore recupero viaggio.", "error"); } } };

// ==========================================================================
// == FUNZIONI CALCOLO BILANCIO SPESE (Usa Cache) ==
// ==========================================================================
const calculateExpenseBalance = () => { /* ... (Usa currentTripDataCache) ... */ if (!currentUserId || !currentTripId || !currentTripDataCache) return { error: "Nessun viaggio caricato." }; const trip = currentTripDataCache; if (!Array.isArray(trip.participants) || trip.participants.length === 0) return { error: "Aggiungi partecipanti." }; const budgetItems = trip.budget?.items || []; if (budgetItems.length === 0) return { balances: {}, totalSharedExpense: 0, errors: [] }; const participantNames = trip.participants.map(p => p.name?.trim()).filter(Boolean); if (participantNames.length === 0) return { error: "Nomi partecipanti non validi." }; const balances = {}; participantNames.forEach(name => balances[name] = 0); let totalSharedExpense = 0; const calculationErrors = []; budgetItems.forEach((item, index) => { const actualCost = safeToNumberOrNull(item.actual); const paidByRaw = item.paidBy?.trim(); const splitBetweenRaw = item.splitBetween?.trim(); if (actualCost === null || actualCost <= 0 || !paidByRaw || !splitBetweenRaw) return; if (!participantNames.includes(paidByRaw)) { calculationErrors.push(`Riga ${index+1}: Pagante "${paidByRaw}" non valido.`); return; } let sharers = []; if (splitBetweenRaw.toLowerCase() === 'tutti') { sharers = [...participantNames]; } else { const potentialSharers = splitBetweenRaw.split(',').map(name => name.trim()).filter(Boolean); const invalidSharers = potentialSharers.filter(name => !participantNames.includes(name)); if (invalidSharers.length > 0) calculationErrors.push(`Riga ${index+1}: Diviso tra non validi: ${invalidSharers.join(', ')}.`); sharers = potentialSharers.filter(name => participantNames.includes(name)); } if (sharers.length === 0) { if (!calculationErrors.some(err => err.includes(`Riga ${index+1}`))) calculationErrors.push(`Riga ${index+1}: Nessun partecipante valido per divisione.`); return; } const costPerSharer = actualCost / sharers.length; totalSharedExpense += actualCost; balances[paidByRaw] += actualCost; sharers.forEach(sharerName => { balances[sharerName] -= costPerSharer; }); }); for (const name in balances) { balances[name] = Math.round(balances[name] * 100) / 100; } return { balances, totalSharedExpense, errors: calculationErrors }; };
const renderBalanceResults = (result) => { /* ... (invariato) ... */ if (!balanceResultsContainer || !balanceResultsUl || !balanceSummaryDiv || !balanceErrorMessageP) return; balanceResultsUl.innerHTML = ''; balanceSummaryDiv.innerHTML = ''; balanceErrorMessageP.textContent = ''; balanceErrorMessageP.style.display = 'none'; balanceResultsContainer.style.display = 'block'; if (result.error) { balanceErrorMessageP.textContent = `Errore: ${result.error}`; balanceErrorMessageP.style.display = 'block'; balanceResultsContainer.style.display = 'none'; return; } const { balances, totalSharedExpense, errors } = result; let hasBalancesToShow = false; Object.entries(balances).forEach(([name, balance]) => { if(Math.abs(balance) > 0.005) { hasBalancesToShow = true; const li = document.createElement('li'); const nameSpan = document.createElement('span'); const balanceSpan = document.createElement('span'); nameSpan.textContent = name; balanceSpan.textContent = formatCurrency(Math.abs(balance)); if (balance > 0) { li.classList.add('positive-balance'); nameSpan.textContent += " (Riceve)"; } else { li.classList.add('negative-balance'); nameSpan.textContent += " (Deve Dare)"; } li.appendChild(nameSpan); li.appendChild(balanceSpan); balanceResultsUl.appendChild(li); } }); if (!hasBalancesToShow && errors.length === 0) { const li = document.createElement('li'); li.textContent = "Saldi a zero o nessuna spesa divisa."; balanceResultsUl.appendChild(li); } else if (!hasBalancesToShow && errors.length > 0) { const li = document.createElement('li'); li.textContent = "Nessun saldo (errori nel calcolo)."; balanceResultsUl.appendChild(li); } balanceSummaryDiv.textContent = `Spesa Totale Divisa: ${formatCurrency(totalSharedExpense)}`; if (errors.length > 0) { balanceErrorMessageP.innerHTML = `<strong>Attenzione, errori nel calcolo:</strong><br>` + errors.join('<br>'); balanceErrorMessageP.style.display = 'block'; } };

// ==========================================================================
// == LOGICA AUTENTICAZIONE ==
// ==========================================================================
function clearAppDataUI() { console.log("Pulizia UI..."); currentTripId = null; currentTripDataCache = null; if(tripListUl) tripListUl.innerHTML = ''; if(noTripsMessage) noTripsMessage.style.display = 'block'; deselectTrip(); if (unsubscribeTripListListener) unsubscribeTripListListener(); unsubscribeTripListListener = null; clearSubcollectionListeners(); closeModal(newTripModal); closeModal(selectTemplateModal); closeModal(confirmationModal); }
onAuthStateChanged(auth, (user) => { if (user) { console.log("Utente loggato:", user.uid, user.email); currentUserId = user.uid; if(authContainer) authContainer.style.display = 'none'; if(appContainer) appContainer.style.display = 'block'; if(userStatusDiv) userStatusDiv.style.display = 'flex'; if(userEmailDisplay) userEmailDisplay.textContent = user.email; if(loginError) loginError.style.display = 'none'; if(signupError) signupError.style.display = 'none'; if(loginForm) loginForm.reset(); if(signupForm) signupForm.reset(); loadUserTrips(); checkForSharedTrip(); } else { console.log("Nessun utente loggato."); currentUserId = null; if(authContainer) authContainer.style.display = 'block'; if(appContainer) appContainer.style.display = 'none'; if(userStatusDiv) userStatusDiv.style.display = 'none'; clearAppDataUI(); } });
if (showSignupLink) showSignupLink.addEventListener('click', (e) => { e.preventDefault(); if(loginForm) loginForm.style.display = 'none'; if(loginError) loginError.style.display = 'none'; if(signupForm) signupForm.style.display = 'block'; if(signupError) signupError.style.display = 'none'; });
if (showLoginLink) showLoginLink.addEventListener('click', (e) => { e.preventDefault(); if(signupForm) signupForm.style.display = 'none'; if(signupError) signupError.style.display = 'none'; if(loginForm) loginForm.style.display = 'block'; if(loginError) loginError.style.display = 'none'; });
if (loginForm) loginForm.addEventListener('submit', async (e) => { e.preventDefault(); const email = loginEmailInput.value; const password = loginPasswordInput.value; if(loginError) loginError.style.display = 'none'; const btn = loginForm.querySelector('button[type="submit"]'); if(btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Accesso...'; } try { await signInWithEmailAndPassword(auth, email, password); } catch (error) { if(loginError) { loginError.textContent = getFirebaseErrorMessage(error); loginError.style.display = 'block'; } if(btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Login'; } } });
if (signupForm) signupForm.addEventListener('submit', async (e) => { e.preventDefault(); const email = signupEmailInput.value; const password = signupPasswordInput.value; const confirm = signupPasswordConfirmInput.value; if(signupError) signupError.style.display = 'none'; if (password.length < 6) { if(signupError) {signupError.textContent = 'Password min 6 caratteri.'; signupError.style.display = 'block';} return; } if (password !== confirm) { if(signupError) { signupError.textContent = 'Password non coincidono.'; signupError.style.display = 'block';} return; } const btn = signupForm.querySelector('button[type="submit"]'); if(btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Registro...'; } try { await createUserWithEmailAndPassword(auth, email, password); } catch (error) { if(signupError) { signupError.textContent = getFirebaseErrorMessage(error); signupError.style.display = 'block'; } if(btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-user-plus"></i> Registrati'; } } });
if (logoutBtn) logoutBtn.addEventListener('click', async () => { try { await signOut(auth); } catch (error) { showToast('Errore logout.', 'error'); } });
function getFirebaseErrorMessage(error) { switch (error.code) { case 'auth/invalid-email': return 'Email non valida.'; case 'auth/user-disabled': return 'Account disabilitato.'; case 'auth/user-not-found': return 'Utente non trovato.'; case 'auth/wrong-password': return 'Password errata.'; case 'auth/email-already-in-use': return 'Email già registrata.'; case 'auth/weak-password': return 'Password debole (min 6 caratteri).'; case 'auth/operation-not-allowed': return 'Operazione non permessa.'; case 'auth/too-many-requests': return 'Troppi tentativi. Riprova più tardi.'; default: return 'Errore autenticazione.'; } }

// ==========================================================================
// == INIZIALIZZAZIONE DOMContentLoaded ==
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM caricato.");
    // Ottieni riferimenti DOM
    tripListUl=document.getElementById('trip-list'); newTripBtn=document.getElementById('new-trip-btn'); createFromTemplateBtn=document.getElementById('create-from-template-btn'); searchTripInput=document.getElementById('search-trip-input'); noTripsMessage=document.getElementById('no-trips-message'); welcomeMessageDiv=document.getElementById('welcome-message'); tripDetailsAreaDiv=document.getElementById('trip-details-area'); tripTitleH2=document.getElementById('trip-title'); downloadTextBtn=document.getElementById('download-text-btn'); downloadExcelBtn=document.getElementById('download-excel-btn'); deleteTripBtn=document.getElementById('delete-trip-btn'); shareTripBtn=document.getElementById('share-trip-btn'); emailSummaryBtn=document.getElementById('email-summary-btn'); copySummaryBtn=document.getElementById('copy-summary-btn'); tabsContainer=document.querySelector('.tabs'); tripInfoForm=document.getElementById('trip-info-form'); editTripIdInput=document.getElementById('edit-trip-id'); tripNameInput=document.getElementById('trip-name'); tripOriginCityInput=document.getElementById('trip-origin-city'); tripDestinationInput=document.getElementById('trip-destination'); tripStartDateInput=document.getElementById('trip-start-date'); tripEndDateInput=document.getElementById('trip-end-date'); tripIsTemplateCheckbox=document.getElementById('trip-is-template'); tripNotesTextarea=document.getElementById('trip-notes'); tripExtraInfoTextarea=document.getElementById('trip-extra-info'); addParticipantForm=document.getElementById('add-participant-form'); editParticipantIdInput=document.getElementById('edit-participant-item-id'); participantNameInput=document.getElementById('participant-name'); participantNotesInput=document.getElementById('participant-notes'); participantExtraInfoTextarea=document.getElementById('participant-extra-info'); participantListUl=document.getElementById('participant-list'); noParticipantsItemsP=document.getElementById('no-participants-items'); participantSubmitBtn=document.getElementById('participant-submit-btn'); participantCancelEditBtn=document.getElementById('participant-cancel-edit-btn'); participantDatalist=document.getElementById('participant-datalist'); addReminderItemForm=document.getElementById('add-reminder-item-form'); editReminderItemIdInput=document.getElementById('edit-reminder-item-id'); reminderDescriptionInput=document.getElementById('reminder-description'); reminderDueDateInput=document.getElementById('reminder-due-date'); reminderStatusSelect=document.getElementById('reminder-status'); reminderListUl=document.getElementById('reminder-list'); noReminderItemsP=document.getElementById('no-reminder-items'); reminderSubmitBtn=document.getElementById('reminder-submit-btn'); reminderCancelEditBtn=document.getElementById('reminder-cancel-edit-btn'); reminderSortControl=document.getElementById('reminder-sort-control'); addTransportItemForm=document.getElementById('add-transport-item-form'); editTransportItemIdInput=document.getElementById('edit-transport-item-id'); transportTypeSelect=document.getElementById('transport-type'); transportDescriptionInput=document.getElementById('transport-description'); transportDepartureLocInput=document.getElementById('transport-departure-loc'); transportDepartureDatetimeInput=document.getElementById('transport-departure-datetime'); transportArrivalLocInput=document.getElementById('transport-arrival-loc'); transportArrivalDatetimeInput=document.getElementById('transport-arrival-datetime'); transportBookingRefInput=document.getElementById('transport-booking-ref'); transportCostInput=document.getElementById('transport-cost'); transportNotesInput=document.getElementById('transport-notes'); transportLinkInput=document.getElementById('transport-link'); transportListUl=document.getElementById('transport-list'); noTransportItemsP=document.getElementById('no-transport-items'); transportSubmitBtn=document.getElementById('transport-submit-btn'); transportCancelEditBtn=document.getElementById('transport-cancel-edit-btn'); searchSkyscannerBtn=document.getElementById('search-skyscanner-btn'); searchTrainlineBtn=document.getElementById('search-trainline-btn'); addTransportTotalToBudgetBtn=document.getElementById('add-transport-total-to-budget-btn'); transportSortControl=document.getElementById('transport-sort-control'); addAccommodationItemForm=document.getElementById('add-accommodation-item-form'); editAccommodationItemIdInput=document.getElementById('edit-accommodation-item-id'); accommodationNameInput=document.getElementById('accommodation-name'); accommodationTypeSelect=document.getElementById('accommodation-type'); accommodationAddressInput=document.getElementById('accommodation-address'); accommodationCheckinInput=document.getElementById('accommodation-checkin'); accommodationCheckoutInput=document.getElementById('accommodation-checkout'); accommodationBookingRefInput=document.getElementById('accommodation-booking-ref'); accommodationCostInput=document.getElementById('accommodation-cost'); accommodationNotesInput=document.getElementById('accommodation-notes'); accommodationLinkInput=document.getElementById('accommodation-link'); accommodationListUl=document.getElementById('accommodation-list'); noAccommodationItemsP=document.getElementById('no-accommodation-items'); accommodationSubmitBtn=document.getElementById('accommodation-submit-btn'); accommodationCancelEditBtn=document.getElementById('accommodation-cancel-edit-btn'); addItineraryItemForm=document.getElementById('add-itinerary-item-form'); editItineraryItemIdInput=document.getElementById('edit-itinerary-item-id'); itineraryDayInput=document.getElementById('itinerary-day'); itineraryTimeInput=document.getElementById('itinerary-time'); itineraryActivityInput=document.getElementById('itinerary-activity'); itineraryLocationInput=document.getElementById('itinerary-location'); itineraryBookingRefInput=document.getElementById('itinerary-booking-ref'); itineraryCostInput=document.getElementById('itinerary-cost'); itineraryNotesInput=document.getElementById('itinerary-notes'); itineraryLinkInput=document.getElementById('itinerary-link'); itineraryListUl=document.getElementById('itinerary-list'); noItineraryItemsP=document.getElementById('no-itinerary-items'); itinerarySubmitBtn=document.getElementById('itinerary-submit-btn'); itineraryCancelEditBtn=document.getElementById('itinerary-cancel-edit-btn'); searchItineraryInput=document.getElementById('search-itinerary-input'); itinerarySortControl=document.getElementById('itinerary-sort-control'); addBudgetItemForm=document.getElementById('add-budget-item-form'); editBudgetItemIdInput=document.getElementById('edit-budget-item-id'); budgetCategorySelect=document.getElementById('budget-category'); budgetDescriptionInput=document.getElementById('budget-description'); budgetEstimatedInput=document.getElementById('budget-estimated'); budgetActualInput=document.getElementById('budget-actual'); budgetPaidByInput=document.getElementById('budget-paid-by'); budgetSplitBetweenInput=document.getElementById('budget-split-between'); budgetListUl=document.getElementById('budget-list'); budgetTotalEstimatedStrong=document.getElementById('budget-total-estimated'); budgetTotalActualStrong=document.getElementById('budget-total-actual'); budgetDifferenceStrong=document.getElementById('budget-difference'); noBudgetItemsP=document.getElementById('no-budget-items'); budgetSubmitBtn=document.getElementById('budget-submit-btn'); budgetCancelEditBtn=document.getElementById('budget-cancel-edit-btn'); budgetSortControl=document.getElementById('budget-sort-control'); predefinedChecklistsContainer=document.querySelector('.predefined-checklists'); addPackingItemForm=document.getElementById('add-packing-item-form'); editPackingItemIdInput=document.getElementById('edit-packing-item-id'); packingItemNameInput=document.getElementById('packing-item-name'); packingItemCategoryInput=document.getElementById('packing-item-category'); packingItemQuantityInput=document.getElementById('packing-item-quantity'); packingListUl=document.getElementById('packing-list'); noPackingItemsP=document.getElementById('no-packing-items'); packingSubmitBtn=document.getElementById('packing-submit-btn'); packingCancelEditBtn=document.getElementById('packing-cancel-edit-btn'); searchPackingInput=document.getElementById('search-packing-input'); packingSortControl=document.getElementById('packing-sort-control'); packingCategoryDatalist=document.getElementById('packing-category-list'); calculateBalanceBtn=document.getElementById('calculate-balance-btn'); balanceResultsContainer=document.getElementById('balance-results-container'); balanceResultsUl=document.getElementById('balance-results'); balanceSummaryDiv=document.getElementById('balance-summary'); balanceErrorMessageP=document.getElementById('balance-error-message'); newTripModal=document.getElementById('new-trip-modal'); newTripNameInput=document.getElementById('new-trip-name-input'); newTripErrorP=document.getElementById('new-trip-modal-error'); createTripConfirmBtn=document.getElementById('create-trip-confirm-btn'); selectTemplateModal=document.getElementById('select-template-modal'); templateSelectInput=document.getElementById('template-select-input'); selectTemplateErrorP=document.getElementById('select-template-modal-error'); createFromTemplateConfirmBtn=document.getElementById('create-from-template-confirm-btn'); confirmationModal=document.getElementById('confirmation-modal'); confirmationModalTitle=document.getElementById('confirmation-modal-title'); confirmationModalMessage=document.getElementById('confirmation-modal-message'); confirmationModalConfirmBtn=document.getElementById('confirmation-modal-confirm-btn'); toastContainer=document.getElementById('toast-container');
    console.log("Riferimenti DOM ottenuti.");

    if (!app || !db || !auth) { console.error("Firebase non inizializzato."); return; }

    // Aggiunta event listeners
    console.log("Aggiunta listeners...");
    if (newTripBtn) newTripBtn.addEventListener('click', handleNewTrip);
    if (createFromTemplateBtn) createFromTemplateBtn.addEventListener('click', openSelectTemplateModal);
    if (searchTripInput) searchTripInput.addEventListener('input', handleSearchTrip); // Nota: ora solo info
    if (tripInfoForm) tripInfoForm.addEventListener('submit', handleSaveTripInfo);
    if (tabsContainer) tabsContainer.addEventListener('click', (e) => { const tl = e.target.closest('.tab-link'); if (tl?.dataset.tab) switchTab(tl.dataset.tab); });
    if (downloadTextBtn) downloadTextBtn.addEventListener('click', handleDownloadText);
    if (downloadExcelBtn) downloadExcelBtn.addEventListener('click', handleDownloadExcel);
    if (emailSummaryBtn) emailSummaryBtn.addEventListener('click', handleEmailSummary);
    if (copySummaryBtn) copySummaryBtn.addEventListener('click', handleCopySummary);
    if (shareTripBtn) shareTripBtn.addEventListener('click', handleShareViaLink);
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
    if (tripDetailsAreaDiv) tripDetailsAreaDiv.addEventListener('click', (e) => { const editBtn=e.target.closest('.btn-icon.edit'); const deleteBtn=e.target.closest('.btn-icon.delete'); const packingCheckbox=e.target.closest('.packing-checkbox'); if(editBtn){ const itemId=editBtn.dataset.itemId; if(!itemId) return; let listType=null; if(editBtn.classList.contains('participant-edit-btn')) listType='participant'; else if(editBtn.classList.contains('reminder-edit-btn')) listType='reminder'; else if(editBtn.classList.contains('transport-edit-btn')) listType='transport'; else if(editBtn.classList.contains('accommodation-edit-btn')) listType='accommodation'; else if(editBtn.classList.contains('itinerary-edit-btn')) listType='itinerary'; else if(editBtn.classList.contains('budget-edit-btn')) listType='budget'; else if(editBtn.classList.contains('packing-edit-btn')) listType='packing'; if(listType) startEditItem(listType, itemId);} else if(deleteBtn){ const itemId=deleteBtn.dataset.itemId; const itemDesc=deleteBtn.dataset.itemDesc || ''; if(!itemId) return; let listType=null; if(deleteBtn.classList.contains('participant-delete-btn')) listType='participant'; else if(deleteBtn.classList.contains('reminder-delete-btn')) listType='reminder'; else if(deleteBtn.classList.contains('transport-delete-btn')) listType='transport'; else if(deleteBtn.classList.contains('accommodation-delete-btn')) listType='accommodation'; else if(deleteBtn.classList.contains('itinerary-delete-btn')) listType='itinerary'; else if(deleteBtn.classList.contains('budget-delete-btn')) listType='budget'; else if(deleteBtn.classList.contains('packing-delete-btn')) listType='packing'; if(listType) handleDeleteItem(listType, itemId, itemDesc);} else if(packingCheckbox){ const itemId=packingCheckbox.dataset.itemId; if(itemId) handleTogglePacked(itemId, packingCheckbox.checked);} });
    if (predefinedChecklistsContainer) predefinedChecklistsContainer.addEventListener('click', (e) => { const btn = e.target.closest('button[data-checklist]'); if (btn?.dataset.checklist) handleImportPackingList(btn.dataset.checklist); });
    if (newTripModal) { createTripConfirmBtn?.addEventListener('click', handleCreateTripConfirm); newTripModal.querySelectorAll('.modal-close').forEach(btn => btn.addEventListener('click', closeNewTripModal)); newTripNameInput?.addEventListener('keypress', (e) => { if(e.key === 'Enter') handleCreateTripConfirm(); }); newTripModal.addEventListener('click', (e) => { if (e.target === newTripModal) closeNewTripModal(); }); }
    if (selectTemplateModal) { createFromTemplateConfirmBtn?.addEventListener('click', handleCreateFromTemplateConfirm); selectTemplateModal.querySelectorAll('.modal-close').forEach(btn => btn.addEventListener('click', closeSelectTemplateModal)); selectTemplateModal.addEventListener('click', (e) => { if (e.target === selectTemplateModal) closeSelectTemplateModal(); }); }
    if (confirmationModal) { /* Listener bottone conferma aggiunto in showConfirmationModal */ confirmationModal.querySelectorAll('.modal-close').forEach(btn => btn.addEventListener('click', closeConfirmationModal)); confirmationModal.addEventListener('click', (e) => { if (e.target === confirmationModal) closeConfirmationModal(); }); }
    if (addTransportTotalToBudgetBtn) addTransportTotalToBudgetBtn.addEventListener('click', handleCalculateAndAddTransportCost);
    if (searchSkyscannerBtn) searchSkyscannerBtn.addEventListener('click', handleSearchFlights);
    if (searchTrainlineBtn) searchTrainlineBtn.addEventListener('click', handleSearchTrains);
    if (transportTypeSelect) transportTypeSelect.addEventListener('change', toggleSearchButtonsVisibility);
    if (reminderSortControl) reminderSortControl.addEventListener('change', (e) => handleSortChange('reminder', e.target));
    if (transportSortControl) transportSortControl.addEventListener('change', (e) => handleSortChange('transport', e.target));
    if (itinerarySortControl) itinerarySortControl.addEventListener('change', (e) => handleSortChange('itinerary', e.target));
    if (budgetSortControl) budgetSortControl.addEventListener('change', (e) => handleSortChange('budget', e.target));
    if (packingSortControl) packingSortControl.addEventListener('change', (e) => handleSortChange('packing', e.target));
    if (searchItineraryInput) searchItineraryInput.addEventListener('input', (e) => handleInternalSearch('itinerary', e.target));
    if (searchPackingInput) searchPackingInput.addEventListener('input', (e) => handleInternalSearch('packing', e.target));
    if (calculateBalanceBtn) calculateBalanceBtn.addEventListener('click', () => { const balanceResult = calculateExpenseBalance(); renderBalanceResults(balanceResult); });

    console.log("Listeners aggiunti.");
    // L'app attende onAuthStateChanged per mostrare login o dati utente
    console.log("Inizializzazione UI completata. In attesa stato autenticazione...");

}); // Fine DOMContentLoaded

// Import Packing List da template (ora async per Firestore)
const handleImportPackingList = async (type) => {
    if (!currentUserId || !currentTripId || !PREDEFINED_PACKING_LISTS[type]) return;
    const predefined = PREDEFINED_PACKING_LISTS[type];
    const currentPackingList = currentTripDataCache?.packingList || [];
    const currentLower = currentPackingList.map(i => (i?.name || '').toLowerCase());
    const itemsToAdd = [];
    predefined.forEach(predefItem => { if (!currentLower.includes(predefItem.name.toLowerCase())) { itemsToAdd.push({ name: predefItem.name, packed: false, category: predefItem.category || 'Altro', quantity: predefItem.quantity || 1, createdAt: serverTimestamp(), updatedAt: serverTimestamp() }); }});
    if (itemsToAdd.length > 0) { console.log(`Aggiungo ${itemsToAdd.length} oggetti packing da ${type}`); try { const packingColRef = collection(db, 'trips', currentTripId, 'packingList'); const batch = writeBatch(db); itemsToAdd.forEach(itemData => batch.set(doc(packingColRef), itemData)); await batch.commit(); showToast(`${itemsToAdd.length} oggetti aggiunti!`, 'success'); } catch (error) { console.error("Errore import packing:", error); showToast("Errore import packing list.", "error"); } }
    else { showToast(`Nessun nuovo oggetto da aggiungere da ${type}.`, 'info'); }
};
