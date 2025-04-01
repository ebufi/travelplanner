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
    getFirestore, collection, addDoc, doc, getDoc, Timestamp, // Timestamp è ok
    query, where, orderBy, getDocs, writeBatch, deleteDoc, updateDoc, serverTimestamp // Aggiunte funzioni Firestore
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
let unsubscribeTripListListener = null; // Per scollegare listener Firestore
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
// == FUNZIONI UTILITY (Invariate per ora, ma convertTimestampsToStrings e toTimestampOrNull saranno importanti) ==
// ==========================================================================
const generateId = (prefix = 'item') => `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`; // Ok
const formatCurrency = (amount) => { const num = amount === null || typeof amount === 'undefined' ? 0 : Number(amount); if (isNaN(num)) { console.warn(`Valore non numerico per formatCurrency: ${amount}`); return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(0); } return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(num); }; // Ok
const formatDate = (dateStringOrTimestamp) => { // ***** MODIFICATO: Accetta Timestamp o Stringa ISO *****
    if (!dateStringOrTimestamp) return '';
    let date;
    try {
        if (dateStringOrTimestamp instanceof Timestamp) {
            date = dateStringOrTimestamp.toDate();
        } else if (typeof dateStringOrTimestamp === 'string') {
            // Prova a parsare come ISO 8601 o YYYY-MM-DD
             if (dateStringOrTimestamp.includes('T')) { // Formato ISO con ora
                 date = new Date(dateStringOrTimestamp);
             } else if (dateStringOrTimestamp.match(/^\d{4}-\d{2}-\d{2}$/)) { // Formato YYYY-MM-DD
                 const parts = dateStringOrTimestamp.split('-');
                 // Usa UTC per evitare problemi timezone nel parsing solo data
                 date = new Date(Date.UTC(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2])));
             } else {
                 console.warn("Formato data non riconosciuto per formatDate:", dateStringOrTimestamp);
                 return dateStringOrTimestamp; // Restituisce originale se non riconosciuto
             }
        } else {
             console.warn("Tipo non valido per formatDate:", dateStringOrTimestamp);
             return ''; // Restituisce vuoto se tipo non valido
        }

        if (isNaN(date.getTime())) {
             console.warn("Data non valida ottenuta da:", dateStringOrTimestamp);
             return ''; // Data invalida
        }

        // Formatta sempre usando UTC per consistenza con le date salvate
        const day = String(date.getUTCDate()).padStart(2, '0');
        const month = String(date.getUTCMonth() + 1).padStart(2, '0'); // Mese è 0-based
        const year = date.getUTCFullYear();
        return `${day}/${month}/${year}`;
    } catch (e) {
        console.error("Errore formatDate:", e, "Input:", dateStringOrTimestamp);
        return String(dateStringOrTimestamp); // Fallback
    }
};
const formatDateTime = (dateTimeStringOrTimestamp) => { // ***** MODIFICATO: Accetta Timestamp o Stringa ISO *****
    if (!dateTimeStringOrTimestamp) return '';
    let date;
     try {
         if (dateTimeStringOrTimestamp instanceof Timestamp) {
             date = dateTimeStringOrTimestamp.toDate();
         } else if (typeof dateTimeStringOrTimestamp === 'string') {
             date = new Date(dateTimeStringOrTimestamp); // Stringa ISO dovrebbe funzionare
         } else {
              console.warn("Tipo non valido per formatDateTime:", dateTimeStringOrTimestamp);
              return '';
         }

         if (isNaN(date.getTime())) {
             console.warn("Data/ora non valida ottenuta da:", dateTimeStringOrTimestamp);
             return '';
         }

         // Usa le funzioni locali per visualizzare l'ora corretta nella timezone dell'utente
         const day = String(date.getDate()).padStart(2, '0');
         const month = String(date.getMonth() + 1).padStart(2, '0');
         const year = date.getFullYear();
         const hours = String(date.getHours()).padStart(2, '0');
         const minutes = String(date.getMinutes()).padStart(2, '0');
         return `${day}/${month}/${year} ${hours}:${minutes}`;
     } catch (e) {
          console.error("Errore formatDateTime:", e, "Input:", dateTimeStringOrTimestamp);
          return String(dateTimeStringOrTimestamp); // Fallback
     }
};
const formatSkyscannerDate = (isoDateString) => { if (!isoDateString || typeof isoDateString !== 'string' || !isoDateString.match(/^\d{4}-\d{2}-\d{2}$/)) return null; try { const year = isoDateString.substring(2, 4); const month = isoDateString.substring(5, 7); const day = isoDateString.substring(8, 10); return `${year}${month}${day}`; } catch (e) { console.error("Errore formattazione data Skyscanner:", e); return null; } }; // Ok
const showToast = (message, type = 'info') => { if (!toastContainer) return; const toast = document.createElement('div'); toast.className = `toast toast-${type}`; let iconClass = 'fas fa-info-circle'; if (type === 'success') iconClass = 'fas fa-check-circle'; if (type === 'error') iconClass = 'fas fa-exclamation-circle'; if (type === 'warning') iconClass = 'fas fa-exclamation-triangle'; toast.innerHTML = `<i class="${iconClass}"></i> ${message}`; toastContainer.appendChild(toast); setTimeout(() => toast.classList.add('show'), 10); setTimeout(() => { toast.classList.remove('show'); toast.addEventListener('transitionend', () => toast.remove(), { once: true }); }, 3000); }; // Ok, ma assicurati CSS esista
const openModal = (modalElement) => { if(modalElement) modalElement.style.display = 'block'; }; // Ok
const closeModal = (modalElement) => { if(modalElement) modalElement.style.display = 'none'; }; // Ok
const openNewTripModal = () => { if (!newTripModal) return; newTripNameInput.value = ''; if (newTripErrorP) newTripErrorP.style.display = 'none'; openModal(newTripModal); newTripNameInput.focus(); }; // Ok
const closeNewTripModal = () => closeModal(newTripModal); // Ok
const showConfirmationModal = (title, message, onConfirm) => { if (!confirmationModal) return; confirmationModalTitle.textContent = title; confirmationModalMessage.textContent = message; // ***** MODIFICATO: Rimuovi vecchia callback *****
    const confirmBtn = document.getElementById('confirmation-modal-confirm-btn');
    if (!confirmBtn) {
        console.error("Bottone conferma modale non trovato!"); return;
    }
    // Clona e sostituisci per rimuovere vecchi listeners
    const newConfirmBtn = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
    // Aggiungi NUOVO listener
    newConfirmBtn.onclick = () => { // Usa onclick semplice qui per evitare accumulo
         if (typeof onConfirm === 'function') {
              try { onConfirm(); } catch(err) { console.error("Errore durante esecuzione callback conferma:", err); showToast("Si è verificato un errore.", "error"); }
         }
         closeConfirmationModal();
    };
    openModal(confirmationModal);
};
const closeConfirmationModal = () => { closeModal(confirmationModal); };
const resetEditState = (formType) => { // Ok logica interna, ma verifica ID elementi
    // editingItemId[formType] = null; // Questa variabile non è più usata globalmente così
    const form = document.getElementById(`add-${formType}-item-form`);
    const submitBtn = document.getElementById(`${formType}-submit-btn`);
    const cancelBtn = document.getElementById(`${formType}-cancel-edit-btn`);
    const hiddenInput = document.getElementById(`edit-${formType}-item-id`); // Questo ID è ancora usato per capire se si sta editando
    if (form) form.reset();
    if(hiddenInput) hiddenInput.value = ''; // Resetta ID nascosto!
    if (submitBtn) { let addText = 'Aggiungi'; switch(formType) { case 'participant': addText = 'Partecipante'; break; case 'reminder': addText = 'Promemoria'; break; case 'transport': addText = 'Trasporto'; break; case 'accommodation': addText = 'Alloggio'; break; case 'itinerary': addText = 'Attività'; break; case 'budget': addText = 'Spesa'; break; case 'packing': addText = 'Oggetto'; break; } submitBtn.innerHTML = `<i class="fas fa-plus"></i> ${addText}`; submitBtn.classList.remove('btn-warning'); submitBtn.classList.add('btn-secondary'); }
    if (cancelBtn) cancelBtn.style.display = 'none';
    if(formType === 'transport' && typeof toggleSearchButtonsVisibility === 'function') toggleSearchButtonsVisibility();
};
const createMapLink = (query) => query ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}` : null; // Ok
const formatDisplayLink = (link) => { if (!link) return ''; try { new URL(link); const displayLink = link.length > 40 ? link.substring(0, 37) + '...' : link; return `<a href="${link}" target="_blank" rel="noopener noreferrer" class="external-link" title="${link}">${displayLink} <i class="fas fa-external-link-alt"></i></a>`; } catch (_) { return link; } }; // Ok
const toTimestampOrNull = (dateString) => { // ***** MODIFICATO: Gestisce input vuoto o non stringa, e date invalide *****
    if (!dateString || typeof dateString !== 'string') return null;
    try {
        // Tenta di creare una data. Se la stringa è solo 'YYYY-MM-DD',
        // Date() può interpretarla male a seconda della timezone.
        // È più sicuro usare UTC per consistenza se l'ora non è specificata.
        let date;
        if (dateString.includes('T')) { // Contiene ora (formato datetime-local)
             date = new Date(dateString);
        } else if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) { // Solo data
             const parts = dateString.split('-');
             // Crea data UTC a mezzanotte per evitare shift dovuti a timezone
             date = new Date(Date.UTC(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2])));
        } else {
            console.warn(`Formato data non standard per toTimestampOrNull: "${dateString}". Tento comunque.`);
            date = new Date(dateString); // Prova comunque
        }

        // Verifica se la data creata è valida
        if (isNaN(date.getTime())) {
             console.warn(`Data invalida creata da "${dateString}". Restituisco null.`);
             return null;
        }
        return Timestamp.fromDate(date);
    } catch (e) {
        console.warn(`Impossibile convertire "${dateString}" in Timestamp:`, e);
        return null;
    }
};
const safeToNumberOrNull = (value) => { if (value === null || value === undefined || value === '') return null; const num = Number(value); if (isNaN(num) || !isFinite(num)) { console.warn(`Valore non numerico o infinito rilevato: "${value}". Convertito a null.`); return null; } return num; }; // Ok
const safeToPositiveIntegerOrDefault = (value, defaultValue = 1) => { if (value === null || value === undefined || value === '') return defaultValue; const num = parseInt(value, 10); if (isNaN(num) || !isFinite(num) || num < 1) { console.warn(`Quantità non valida rilevata: "${value}". Impostata a ${defaultValue}.`); return defaultValue; } return num; }; // Ok
// Funzione non più necessaria se leggiamo/scriviamo direttamente Timestamp
// const convertTimestampsToStrings = (data) => { ... };
function fallbackCopyTextToClipboard(text) { const textArea = document.createElement("textarea"); textArea.value = text; textArea.style.position = "fixed"; textArea.style.top = "0"; textArea.style.left = "0"; textArea.style.opacity = "0"; document.body.appendChild(textArea); textArea.focus(); textArea.select(); try { const successful = document.execCommand('copy'); if (successful) { showToast("Riepilogo copiato (fallback)!", "success"); } else { throw new Error('Copia fallback fallita'); } } catch (err) { console.error('Fallback: Impossibile copiare testo: ', err); showToast("Errore durante la copia (fallback).", "error"); } document.body.removeChild(textArea); } // Ok

// ==========================================================================
// == GESTIONE STORAGE (Rimosso LocalStorage, Gestito da Firestore) ==
// ==========================================================================
// !!! RIMOSSO: const STORAGE_KEY = 'travelPlannerPro_Trips_v2.1_Firebase';
// !!! RIMOSSO: const saveTrips = () => { ... };
// !!! RIMOSSO: const loadTrips = () => { ... };

// ==========================================================================
// == STATO APPLICAZIONE (Modificato) ==
// ==========================================================================
// let trips = []; // !!! RIMOSSO: Non carichiamo più tutto in memoria all'inizio
let currentTripDataCache = null; // Cache per i dati del viaggio selezionato
let editingItemId = { participant: null, reminder: null, transport: null, accommodation: null, itinerary: null, budget: null, packing: null }; // Ok
// let confirmActionCallback = null; // Gestito diversamente nel modal ora
let currentSort = { // Ok
    transport: 'departureDateTime',
    itinerary: 'dateTime',
    budget: 'category',
    packing: 'name',
    reminder: 'dueDate'
};
let currentSearchTerm = { // Ok
    trip: '',
    itinerary: '',
    packing: ''
};

// ==========================================================================
// == LOGICA VIAGGI (Fortemente Modificata per Firestore) ==
// ==========================================================================

// Funzione per trovare dati viaggio (usa cache o fetch se necessario - non usata molto ora)
// async function findTripDataById(id) { ... } // Rimossa per semplicità, usiamo currentTripDataCache

// ***** NUOVO: Carica la lista viaggi dell'utente dalla Sidebar *****
function loadUserTrips() {
    if (!currentUserId) {
        console.error("Impossibile caricare i viaggi: utente non loggato.");
        tripListUl.innerHTML = ''; // Pulisci lista
        noTripsMessage.style.display = 'block';
        return;
    }
    if (!tripListUl) return; // Check esistenza DOM

    console.log(`Caricamento viaggi per utente: ${currentUserId}`);
    tripListUl.innerHTML = '<li><i class="fas fa-spinner fa-spin"></i> Caricamento...</li>';
    noTripsMessage.style.display = 'none';

    // Scollega il listener precedente se esiste
    if (unsubscribeTripListListener) {
        unsubscribeTripListListener();
        unsubscribeTripListListener = null;
         console.log("Scollegato listener lista viaggi precedente.");
    }

    try {
        const tripsRef = collection(db, 'trips');
        // Query per i viaggi dell'utente, ordinati per nome (o timestamp se preferisci)
        const q = query(tripsRef, where("ownerUid", "==", currentUserId), orderBy("name", "asc"));

        // Usa onSnapshot per aggiornamenti in tempo reale
        unsubscribeTripListListener = onSnapshot(q, (querySnapshot) => {
            console.log("Ricevuto snapshot lista viaggi.");
             tripListUl.innerHTML = ''; // Pulisci prima di ri-renderizzare
            let tripCount = 0;
            let templates = [];

             querySnapshot.forEach((docSnap) => {
                tripCount++;
                const tripData = docSnap.data();
                const tripId = docSnap.id;
                displayTripInList(tripId, tripData); // La funzione per creare <li>

                if (tripData.isTemplate) {
                    templates.push({ id: tripId, name: tripData.name });
                }
             });

            // Aggiorna UI in base ai risultati
            noTripsMessage.style.display = tripCount === 0 ? 'block' : 'none';
            populateTemplateModal(templates); // Aggiorna il modal dei template

             // Se il viaggio attualmente selezionato non esiste più nella lista, deselezionalo
             if (currentTripId && !querySnapshot.docs.some(doc => doc.id === currentTripId)) {
                 console.log(`Viaggio selezionato ${currentTripId} non più presente, deseleziono.`);
                 deselectTrip();
             } else if (currentTripId) {
                  // Mantieni la selezione visiva sul viaggio corrente se esiste ancora
                  const currentLi = tripListUl.querySelector(`li[data-trip-id="${currentTripId}"]`);
                  if (currentLi) currentLi.classList.add('active');
             }


        }, (error) => {
            console.error("Errore listener lista viaggi:", error);
            tripListUl.innerHTML = '<li>Errore nel caricamento dei viaggi.</li>';
            showToast('Errore nel caricare i tuoi viaggi.', 'error');
            noTripsMessage.style.display = 'none';
        });
        console.log("Listener lista viaggi collegato.");

    } catch (error) {
        console.error("Errore nell'impostare query/listener viaggi:", error);
        tripListUl.innerHTML = '<li>Errore grave nel setup caricamento.</li>';
        showToast('Errore grave nel caricamento dei viaggi.', 'error');
    }
}

// Funzione per popolare il modal dei template (prende array {id, name})
function populateTemplateModal(templates = []) {
     if (!templateSelectInput) return;
     const currentVal = templateSelectInput.value; // Salva selezione corrente se presente
     templateSelectInput.innerHTML = '<option value="">-- Seleziona Template --</option>';
     templates.sort((a, b) => (a?.name || '').localeCompare(b?.name || '')).forEach(t => {
        const option = document.createElement('option');
        option.value = t.id;
        option.textContent = t.name;
        templateSelectInput.appendChild(option);
     });
      // Ripristina selezione se ancora valida
      if (templates.some(t => t.id === currentVal)) {
           templateSelectInput.value = currentVal;
      }
      // Abilita/disabilita bottone se ci sono template
      const hasTemplates = templates.length > 0;
      if (createFromTemplateBtn) createFromTemplateBtn.disabled = !hasTemplates;
      if (createFromTemplateConfirmBtn) createFromTemplateConfirmBtn.disabled = !hasTemplates;
}


// Crea l'elemento LI per la lista viaggi (Sidebar)
const createTripListItem = (tripId, tripData) => { // ***** MODIFICATO: Prende ID e Data *****
    if (!tripId || !tripData) return null;
    const li = document.createElement('li');
    li.dataset.tripId = tripId;
    if (tripData.isTemplate) li.classList.add('is-template');

    let titleText = tripData.name || 'Senza Nome';
     // Non mostrare date per i template
    if (!tripData.isTemplate) {
        const startDateFormatted = formatDate(tripData.startDate); // Usa la funzione che gestisce Timestamp
        const endDateFormatted = formatDate(tripData.endDate);
        if (startDateFormatted || endDateFormatted) {
            titleText += ` (${startDateFormatted || '?'} - ${endDateFormatted || '?'})`;
        }
    }

    li.innerHTML = `
        <span>${titleText}</span>
        <button class="btn-delete-trip" data-trip-id="${tripId}" title="Elimina"><i class="fas fa-trash-alt"></i></button>
    `;

    // Aggiunge classe 'active' se è il viaggio correntemente selezionato
    if (tripId === currentTripId) {
        li.classList.add('active');
    }

    // Event Listener Click per selezionare (NON i template)
    li.addEventListener('click', (e) => {
        if (!e.target.closest('.btn-delete-trip')) { // Non triggerare se si clicca elimina
            if (tripData.isTemplate) {
                showToast("Questo è un template. Selezionalo da 'Da Template' per creare un viaggio.", "info");
            } else {
                selectTrip(tripId); // Seleziona il viaggio
            }
        }
    });

    // Event Listener per il Bottone Elimina specifico di questo LI
    const deleteBtnLi = li.querySelector('.btn-delete-trip');
    if (deleteBtnLi) {
        deleteBtnLi.addEventListener('click', (e) => {
            e.stopPropagation(); // Impedisce al click di propagarsi al LI (che selezionerebbe il viaggio)
            handleDeleteTrip(tripId, tripData.name, tripData.isTemplate); // Passa ID, nome e tipo
        });
    }

    return li;
};

// Seleziona un viaggio (mostra dettagli)
const selectTrip = (id) => {
    if (currentTripId === id && tripDetailsAreaDiv.style.display !== 'none') {
        console.log(`Viaggio ${id} già selezionato e visibile.`);
        return; // Non fare nulla se già selezionato e visibile
    }
    console.log(`Selezione viaggio: ${id}`);
    currentTripId = id;
    currentTripDataCache = null; // Invalida cache precedente
    currentSearchTerm.itinerary = '';
    if(searchItineraryInput) searchItineraryInput.value = '';
    currentSearchTerm.packing = '';
    if(searchPackingInput) searchPackingInput.value = '';
    // Non resettare currentSort qui, l'utente potrebbe voler mantenere l'ordine
    // applyCurrentSortToControls(); // Applica comunque per sicurezza

     // Aggiorna la classe 'active' nella lista viaggi
     if (tripListUl) {
         tripListUl.querySelectorAll('li.active').forEach(el => el.classList.remove('active'));
         const li = tripListUl.querySelector(`li[data-trip-id="${id}"]`);
         if (li) li.classList.add('active');
     }

    // Carica e mostra i dettagli
    loadSelectedTripDetails(id);

    tripDetailsAreaDiv.style.display = 'block';
    welcomeMessageDiv.style.display = 'none';
    // Resetta gli stati di modifica di tutti i form
    resetAllEditStates();
    switchTab('info-tab'); // Vai sempre alla prima tab quando selezioni un nuovo viaggio
};

// Deseleziona viaggio (nascondi dettagli)
const deselectTrip = () => {
    console.log("Deselezione viaggio.");
    currentTripId = null;
    currentTripDataCache = null; // Pulisci cache
    if (tripDetailsAreaDiv) tripDetailsAreaDiv.style.display = 'none';
    if (welcomeMessageDiv) welcomeMessageDiv.style.display = 'block';
    if (downloadTextBtn) downloadTextBtn.disabled = true;
    if (downloadExcelBtn) downloadExcelBtn.disabled = true;
    if (deleteTripBtn) deleteTripBtn.disabled = true;
    if (shareTripBtn) shareTripBtn.disabled = true;
    if (emailSummaryBtn) emailSummaryBtn.disabled = true;
    if (copySummaryBtn) copySummaryBtn.disabled = true;
     if (calculateBalanceBtn) calculateBalanceBtn.disabled = true; // Disabilita anche bilancio
     // Rimuovi classe 'active' da tutti gli elementi lista
     if (tripListUl) {
        tripListUl.querySelectorAll('li.active').forEach(el => el.classList.remove('active'));
     }
      // Scollega tutti i listener delle sottocollezioni
      clearSubcollectionListeners();
};

// ***** NUOVO: Carica dettagli viaggio e sottocollezioni da Firestore *****
async function loadSelectedTripDetails(tripId) {
    if (!currentUserId || !tripId) { deselectTrip(); return; }

    console.log(`Caricamento dettagli per viaggio ${tripId}`);
    // Mostra subito un caricamento nell'area dettagli? (Opzionale)
    tripTitleH2.textContent = 'Caricamento...';
    resetAllDetailFormsAndLists(); // Pulisci tutto prima di caricare
    enableTripActionButtons(false); // Disabilita azioni finché non carica

    // Scollega i listener delle sottocollezioni precedenti
    clearSubcollectionListeners();

    try {
        const tripDocRef = doc(db, 'trips', tripId);
        const tripSnap = await getDoc(tripDocRef);

        if (tripSnap.exists() && tripSnap.data().ownerUid === currentUserId) {
            currentTripDataCache = tripSnap.data(); // Salva dati principali in cache
            console.log("Dati principali viaggio caricati:", currentTripDataCache);

            // 1. Popola il form delle Info Generali
            populateTripInfoForm(tripId, currentTripDataCache);

            // 2. Imposta listener per le sottocollezioni (ASINCRONAMENTE)
            //    Questi listener aggiorneranno le liste UI in tempo reale
            setupSubcollectionListener(tripId, 'participants', renderParticipants);
            setupSubcollectionListener(tripId, 'reminders', renderReminders, orderBy('dueDate', 'asc')); // Ordine default
            setupSubcollectionListener(tripId, 'transportations', renderTransportations, orderBy('departureDateTime', 'asc'));
            setupSubcollectionListener(tripId, 'accommodations', renderAccommodations, orderBy('checkinDateTime', 'asc'));
            setupSubcollectionListener(tripId, 'itinerary', renderItinerary, orderBy('day', 'asc'), orderBy('time', 'asc'));
            setupSubcollectionListener(tripId, 'budgetItems', renderBudget, orderBy('category', 'asc')); // Usa budgetItems!
            setupSubcollectionListener(tripId, 'packingList', renderPackingList, orderBy('category', 'asc'), orderBy('name', 'asc'));

            // 3. Popola datalists basati sui dati iniziali (verranno aggiornati dai listener)
             //    Potrebbe essere meglio popolarli dentro i listener stessi dopo il primo caricamento
             //    Per ora, popoliamo basandoci sulla cache iniziale (se i dati ci sono già)
             populateDatalistsFromCache();


            // 4. Abilita i pulsanti di azione
            enableTripActionButtons(true, currentTripDataCache.isTemplate || false);

            // 5. Imposta l'ID del viaggio corrente nel campo nascosto per le modifiche
             if (editTripIdInput) editTripIdInput.value = tripId;

             // 6. Abilita bottone bilancio
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

// Popola il form Info Generali
function populateTripInfoForm(tripId, data) {
    if (!data || !tripInfoForm) return;
    // editTripIdInput.value = tripId; // Già fatto in selectTrip/loadSelected...
    if(tripTitleH2) tripTitleH2.textContent = data.name || 'Dettagli Viaggio';
    if(tripNameInput) tripNameInput.value = data.name || '';
    if(tripOriginCityInput) tripOriginCityInput.value = data.originCity || '';
    if(tripDestinationInput) tripDestinationInput.value = data.destination || '';
    // Converte Timestamp in stringa formato YYYY-MM-DD per input type="date"
    if(tripStartDateInput) tripStartDateInput.value = data.startDate instanceof Timestamp ? data.startDate.toDate().toISOString().split('T')[0] : (data.startDate || '');
    if(tripEndDateInput) tripEndDateInput.value = data.endDate instanceof Timestamp ? data.endDate.toDate().toISOString().split('T')[0] : (data.endDate || '');
    if(tripIsTemplateCheckbox) tripIsTemplateCheckbox.checked = data.isTemplate || false;
    if(tripNotesTextarea) tripNotesTextarea.value = data.notes || '';
    if(tripExtraInfoTextarea) tripExtraInfoTextarea.value = data.extraInfo || '';
}

// Abilita/Disabilita pulsanti azioni viaggio
function enableTripActionButtons(enable, isTemplate = false) {
    const buttons = tripDetailsAreaDiv?.querySelectorAll('.trip-actions button');
    if (!buttons) return;
    buttons.forEach(button => {
        // Caso generale: disabilita se enable è false
        let shouldBeDisabled = !enable;
        // Casi specifici: Condividi disabilitato per template, Elimina ha logica a parte
        if (button.id === 'share-trip-btn' && isTemplate) {
             shouldBeDisabled = true;
        }
        // Il pulsante Elimina è gestito dal suo listener che controlla currentTripId
        // Non è necessario disabilitarlo/abilitarlo qui se la logica è nel listener
        button.disabled = shouldBeDisabled;
    });
}

// Pulisce tutti i form e le liste nell'area dettagli
function resetAllDetailFormsAndLists() {
    console.log("Resetting all detail forms and lists");
    // Resetta tutti i form specifici
    if (tripInfoForm) tripInfoForm.reset();
    if (addParticipantForm) resetEditState('participant'); // resetEditState fa anche form.reset()
    if (addReminderItemForm) resetEditState('reminder');
    if (addTransportItemForm) resetEditState('transport');
    if (addAccommodationItemForm) resetEditState('accommodation');
    if (addItineraryItemForm) resetEditState('itinerary');
    if (addBudgetItemForm) resetEditState('budget');
    if (addPackingItemForm) resetEditState('packing');
    // Pulisce tutte le liste UI
    if (participantListUl) participantListUl.innerHTML = '';
    if (reminderListUl) reminderListUl.innerHTML = '';
    if (transportListUl) transportListUl.innerHTML = '';
    if (accommodationListUl) accommodationListUl.innerHTML = '';
    if (itineraryListUl) itineraryListUl.innerHTML = '';
    if (budgetListUl) budgetListUl.innerHTML = '';
    if (packingListUl) packingListUl.innerHTML = '';
    // Pulisce totali budget e differenze
    if (budgetTotalEstimatedStrong) budgetTotalEstimatedStrong.textContent = formatCurrency(0);
    if (budgetTotalActualStrong) budgetTotalActualStrong.textContent = formatCurrency(0);
    if (budgetDifferenceStrong) { budgetDifferenceStrong.textContent = formatCurrency(0); budgetDifferenceStrong.className = ''; }
    // Pulisci area bilancio
    if (balanceResultsUl) balanceResultsUl.innerHTML = '';
    if (balanceSummaryDiv) balanceSummaryDiv.innerHTML = '';
    if (balanceErrorMessageP) balanceErrorMessageP.style.display = 'none';
    if (balanceResultsContainer) balanceResultsContainer.style.display = 'none';
    // Nascondi messaggi "nessun elemento"
    document.querySelectorAll('.tab-content .center-text.muted').forEach(p => p.style.display = 'none');
}

// Resetta tutti gli stati di modifica (quando si cambia viaggio)
function resetAllEditStates() {
    Object.keys(editingItemId).forEach(type => {
        // Resetta lo stato interno
        editingItemId[type] = null;
        // Chiama resetEditState per resettare UI del form specifico
        resetEditState(type);
    });
}

// Gestisce creazione nuovo viaggio (dal modal)
const handleNewTrip = () => { openNewTripModal(); };
const handleCreateTripConfirm = async () => { // ***** MODIFICATO: Usa Firestore *****
    if (!currentUserId) { showToast("Devi essere loggato per creare un viaggio.", "error"); return; }
    const tripName = newTripNameInput.value.trim();
    if (!tripName) {
        if (newTripErrorP) { newTripErrorP.textContent = 'Il nome non può essere vuoto.'; newTripErrorP.style.display = 'block'; }
        newTripNameInput.focus();
        return;
    }
     if (newTripErrorP) newTripErrorP.style.display = 'none';

    // Mostra feedback
     createTripConfirmBtn.disabled = true; createTripConfirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creazione...';

    const newTripData = {
        name: tripName,
        ownerUid: currentUserId, // Associa all'utente!
        originCity: '',
        destination: '',
        startDate: null, // Usa null per date non impostate
        endDate: null,
        notes: '',
        isTemplate: false,
        extraInfo: '',
        createdAt: serverTimestamp(), // Timestamp creazione
        updatedAt: serverTimestamp() // Timestamp aggiornamento
        // Le sottocollezioni verranno create quando si aggiungono elementi
    };

    try {
        const docRef = await addDoc(collection(db, "trips"), newTripData);
        console.log("Nuovo viaggio creato con ID:", docRef.id);
        closeNewTripModal();
        // Non serve selezionare qui, onSnapshot aggiornerà la lista e l'utente potrà cliccare
        // selectTrip(docRef.id); // Potrebbe causare caricamenti multipli se fatto subito
        showToast(`Viaggio "${tripName}" creato!`, 'success');
    } catch (error) {
        console.error("Errore creazione nuovo viaggio:", error);
        showToast("Errore durante la creazione del viaggio.", "error");
        if (newTripErrorP) { newTripErrorP.textContent = 'Errore server. Riprova.'; newTripErrorP.style.display = 'block'; }
    } finally {
         createTripConfirmBtn.disabled = false; createTripConfirmBtn.innerHTML = 'Crea Viaggio';
    }
};

// Gestisce salvataggio Info Generali viaggio
const handleSaveTripInfo = async (e) => { // ***** MODIFICATO: Usa Firestore *****
    e.preventDefault();
    if (!currentUserId || !currentTripId) { showToast("Nessun viaggio selezionato o utente non loggato.", "error"); return; }

    const tripDocRef = doc(db, 'trips', currentTripId);

    const startValue = tripStartDateInput.value;
    const endValue = tripEndDateInput.value;

    // Validazione date
    if (startValue && endValue && startValue > endValue) {
        showToast('Data fine non può essere precedente alla data inizio.', 'error');
        return;
    }

    const dataToUpdate = {
        name: tripNameInput.value.trim() || 'Viaggio Senza Nome',
        originCity: tripOriginCityInput.value.trim(),
        destination: tripDestinationInput.value.trim(),
        startDate: toTimestampOrNull(startValue), // Converti in Timestamp
        endDate: toTimestampOrNull(endValue),     // Converti in Timestamp
        isTemplate: tripIsTemplateCheckbox.checked,
        notes: tripNotesTextarea.value.trim(),
        extraInfo: tripExtraInfoTextarea.value.trim(),
        updatedAt: serverTimestamp()
    };

    // Mostra feedback salvataggio
    const saveButton = tripInfoForm?.querySelector('button[type="submit"]');
    if(saveButton) { saveButton.disabled = true; saveButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvo...'; }

    try {
        // Verifica proprietà prima di aggiornare (buona pratica anche con regole)
        const docSnap = await getDoc(tripDocRef);
        if (!docSnap.exists() || docSnap.data().ownerUid !== currentUserId) {
            throw new Error("Viaggio non trovato o permesso negato.");
        }

        await updateDoc(tripDocRef, dataToUpdate);
        currentTripDataCache = { ...currentTripDataCache, ...dataToUpdate }; // Aggiorna cache locale
        tripTitleH2.textContent = dataToUpdate.name; // Aggiorna titolo UI
        if(shareTripBtn) shareTripBtn.disabled = dataToUpdate.isTemplate; // Aggiorna stato bottone condividi
        // Non serve chiamare renderTripList, onSnapshot aggiornerà automaticamente
        showToast('Informazioni salvate!', 'success');

    } catch (error) {
        console.error("Errore salvataggio info viaggio:", error);
        showToast(`Errore durante il salvataggio: ${error.message}`, "error");
    } finally {
        if(saveButton) { saveButton.disabled = false; saveButton.innerHTML = '<i class="fas fa-save"></i> Salva Info'; }
    }
};

// Gestisce eliminazione viaggio
const handleDeleteTrip = async (id, name, isTemplate) => { // ***** MODIFICATO: Usa Firestore e elimina subcollections *****
    if (!currentUserId || !id) return;

    const type = isTemplate ? 'Template' : 'Viaggio';
    showConfirmationModal(
        `Conferma Eliminazione ${type}`,
        `Sei sicuro di voler eliminare "${name || 'Senza Nome'}"? L'azione è irreversibile e cancellerà tutti i dati associati (itinerario, spese, ecc.).`,
        async () => { // La funzione da eseguire alla conferma
             console.log(`Tentativo eliminazione ${type}: ${id}`);
            try {
                const tripDocRef = doc(db, 'trips', id);

                 // Verifica proprietà prima di eliminare (doppio controllo oltre alle regole)
                 const docSnap = await getDoc(tripDocRef);
                 if (!docSnap.exists() || docSnap.data().ownerUid !== currentUserId) {
                    throw new Error("Viaggio non trovato o permesso negato.");
                 }

                // --- Elimina Sottocollezioni (NECESSARIO!) ---
                 console.log("Eliminazione sottocollezioni...");
                 const subcollections = ['participants', 'reminders', 'transportations', 'accommodations', 'itinerary', 'budgetItems', 'packingList'];
                 const deletePromises = subcollections.map(sub => deleteSubcollection(db, `trips/${id}/${sub}`));
                 await Promise.all(deletePromises);
                 console.log("Sottocollezioni eliminate.");

                // --- Elimina Documento Principale ---
                await deleteDoc(tripDocRef);
                console.log(`${type} ${id} eliminato con successo.`);

                showToast(`${type} eliminato.`, 'info');
                 // Non serve chiamare renderTripList, onSnapshot aggiorna la lista
                 // Se il viaggio eliminato era quello selezionato, deseleziona
                 if (currentTripId === id) {
                     deselectTrip();
                 }

            } catch (error) {
                console.error(`Errore durante l'eliminazione del ${type} ${id}:`, error);
                showToast(`Errore durante l'eliminazione: ${error.message}`, "error");
            }
        }
    );
};

// Funzione helper per eliminare sottocollezioni Firestore
async function deleteSubcollection(firestoreDb, collectionPath) {
    console.log(`Avvio eliminazione subcollection: ${collectionPath}`);
    const collectionRef = collection(firestoreDb, collectionPath);
    const q = query(collectionRef, limit(50)); // Elimina in batch (max 500 per batch Firestore)

    return new Promise((resolve, reject) => {
        deleteQueryBatch(firestoreDb, q, resolve, reject);
    });
}

async function deleteQueryBatch(firestoreDb, queryInstance, resolve, reject) {
    try {
        const snapshot = await getDocs(queryInstance);
        if (snapshot.size === 0) {
            // Nessun documento rimasto, abbiamo finito
             console.log(`Subcollection ${queryInstance._query.path.join('/')} vuota o eliminata.`);
            resolve();
            return;
        }

        // Elimina documenti in un batch
        const batch = writeBatch(firestoreDb);
        snapshot.docs.forEach(docSnap => {
            batch.delete(docSnap.ref);
        });
        await batch.commit();
        console.log(`Eliminato batch di ${snapshot.size} documenti da ${queryInstance._query.path.join('/')}.`);

        // Richiama ricorsivamente fino a che la query non restituisce più documenti
        // Processa il batch successivo nello stack di eventi per non bloccare il thread
        setTimeout(() => {
            deleteQueryBatch(firestoreDb, queryInstance, resolve, reject);
        }, 0);

    } catch (error) {
        console.error(`Errore durante eliminazione batch per ${queryInstance._query.path.join('/')}:`, error);
        reject(error);
    }
}


// Gestisce creazione da template
const openSelectTemplateModal = () => { // Logica quasi invariata, ma i template vengono da loadUserTrips
    // La popolazione avviene in loadUserTrips
     if (!templateSelectInput || templateSelectInput.options.length <= 1) { // <=1 perché c'è "-- Seleziona --"
         showToast("Nessun template trovato. Crea un viaggio e spunta 'È un template'.", "info");
         return;
     }
     if (selectTemplateErrorP) selectTemplateErrorP.style.display = 'none';
     openModal(selectTemplateModal);
 };
const closeSelectTemplateModal = () => closeModal(selectTemplateModal);
const handleCreateFromTemplateConfirm = async () => { // ***** MODIFICATO: Legge template da Firestore *****
    const templateId = templateSelectInput.value;
    if (!templateId) {
        if(selectTemplateErrorP) { selectTemplateErrorP.textContent = 'Seleziona un template.'; selectTemplateErrorP.style.display = 'block';}
        return;
    }
     if (!currentUserId) { showToast("Devi essere loggato.", "error"); return; }

     // Mostra feedback
     createFromTemplateConfirmBtn.disabled = true; createFromTemplateConfirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creazione...';

    try {
         const templateDocRef = doc(db, 'trips', templateId);
         const templateSnap = await getDoc(templateDocRef);

         if (!templateSnap.exists() || !templateSnap.data().isTemplate || templateSnap.data().ownerUid !== currentUserId) {
             throw new Error("Template non trovato o non valido.");
         }

         const templateData = templateSnap.data();
         const templateName = templateData.name || 'Template';

         // Clona i dati PRINCIPALI del template
         const newTripData = {
            ...templateData, // Copia tutti i campi base
            id: null, // L'ID verrà generato da Firestore
            ownerUid: currentUserId, // Assegna al NUOVO utente
            isTemplate: false, // NON è più un template
            name: `Copia di ${templateName}`, // Nuovo nome
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
         };
         // Rimuovi campi specifici del template originale che non vanno copiati direttamente
         delete newTripData.createdAt; // Verrà impostato da Firestore
         delete newTripData.updatedAt; // Idem

         // 1. Crea il nuovo documento di viaggio principale
         const newTripDocRef = await addDoc(collection(db, "trips"), newTripData);
         const newTripId = newTripDocRef.id;
         console.log(`Nuovo viaggio ${newTripId} creato da template ${templateId}. Ora copio sottocollezioni...`);

         // 2. Copia le sottocollezioni (ASINCRONAMENTE)
         const subcollectionsToCopy = ['participants', 'reminders', 'transportations', 'accommodations', 'itinerary', 'budgetItems', 'packingList'];
         const copyPromises = subcollectionsToCopy.map(async (subName) => {
             const sourceColRef = collection(db, 'trips', templateId, subName);
             const targetColRef = collection(db, 'trips', newTripId, subName);
             const sourceSnapshot = await getDocs(sourceColRef);
             const writeBatch = writeBatch(db); // Usa batch per efficienza
             let count = 0;
             sourceSnapshot.forEach((docSnap) => {
                 const data = docSnap.data();
                 // Qui NON serve rigenerare ID, Firestore ne crea di nuovi per la sottocollezione target
                 writeBatch.set(doc(targetColRef), data); // Usa set senza ID per generare nuovo ID
                 count++;
             });
             if (count > 0) {
                 await writeBatch.commit();
                 console.log(`Copiati ${count} documenti in ${subName} per ${newTripId}`);
             }
         });

         await Promise.all(copyPromises);
         console.log(`Copia da template ${templateId} a ${newTripId} completata.`);

         closeSelectTemplateModal();
         // Non selezionare subito, lascia che onSnapshot aggiorni la lista
         // selectTrip(newTripId);
         showToast(`Viaggio creato dal template "${templateName}"!`, 'success');

    } catch (error) {
        console.error("Errore creazione da template:", error);
        showToast(`Errore durante la creazione da template: ${error.message}`, "error");
         if (selectTemplateErrorP) { selectTemplateErrorP.textContent = 'Errore server. Riprova.'; selectTemplateErrorP.style.display = 'block'; }
    } finally {
         createFromTemplateConfirmBtn.disabled = false; createFromTemplateConfirmBtn.innerHTML = 'Crea Viaggio da Template';
    }
};

// Gestisce ricerca nella sidebar
const handleSearchTrip = (e) => {
    // Non possiamo filtrare lato client perché i dati non sono tutti in memoria.
    // La ricerca lato server richiederebbe implementazioni più complesse (es. Algolia/Elasticsearch o query multiple).
    // Per ora, rimuoviamo la funzionalità di filtro live della lista viaggi.
    // Si potrebbe implementare un pulsante "Cerca" che esegue una query specifica.
    currentSearchTerm.trip = e.target.value;
    // renderTripList(); // !!! RIMOSSO: Non filtrare lato client
    showToast("Filtro lista viaggi disabilitato (dati su server).", "info"); // Informa utente
};

// ==========================================================================
// == FUNZIONI MODIFICA ITEM (Fortemente Modificate per Firestore) ==
// ==========================================================================

// Funzione chiamata quando si clicca Modifica su un item
const startEditItem = async (listType, itemId) => { // Ora è async
    if (!currentUserId || !currentTripId) return;

    console.log(`Avvio modifica ${listType} item: ${itemId} per viaggio ${currentTripId}`);
    const subcollectionName = listType === 'budget' ? 'budgetItems' : listType; // Usa 'budgetItems' per Firestore
    const itemDocRef = doc(db, 'trips', currentTripId, subcollectionName, itemId);

    try {
        const itemSnap = await getDoc(itemDocRef);
        if (!itemSnap.exists()) {
            throw new Error(`Elemento ${itemId} non trovato.`);
        }
        const itemToEdit = itemSnap.data();

        // Resetta altri form in modifica
        Object.keys(editingItemId).forEach(type => { if (type !== listType) resetEditState(type); });
        // editingItemId[listType] = itemId; // Non più usato globalmente

        const form = document.getElementById(`add-${listType}-item-form`);
        const submitBtn = document.getElementById(`${listType}-submit-btn`);
        const cancelBtn = document.getElementById(`${listType}-cancel-edit-btn`);
        const hiddenInput = document.getElementById(`edit-${listType}-item-id`); // Usiamo ancora questo per sapere se stiamo modificando

        if (!form || !submitBtn || !cancelBtn || !hiddenInput) {
             console.error(`Elementi form UI mancanti per ${listType}`);
             return;
        }

        hiddenInput.value = itemId; // Imposta ID per il submit

        // Popola il form con i dati letti
        switch (listType) {
             case 'participant':
                 participantNameInput.value = itemToEdit.name || '';
                 participantNotesInput.value = itemToEdit.notes || '';
                 participantExtraInfoTextarea.value = itemToEdit.extraInfo || '';
                 break;
             case 'reminder':
                 reminderDescriptionInput.value = itemToEdit.description || '';
                 // Converti Timestamp in YYYY-MM-DD
                 reminderDueDateInput.value = itemToEdit.dueDate instanceof Timestamp ? itemToEdit.dueDate.toDate().toISOString().split('T')[0] : '';
                 reminderStatusSelect.value = itemToEdit.status || 'todo';
                 break;
             case 'transport':
                 transportTypeSelect.value = itemToEdit.type || 'Altro';
                 transportDescriptionInput.value = itemToEdit.description || '';
                 transportDepartureLocInput.value = itemToEdit.departureLoc || '';
                 // Converti Timestamp in YYYY-MM-DDTHH:mm
                 transportDepartureDatetimeInput.value = itemToEdit.departureDateTime instanceof Timestamp ? itemToEdit.departureDateTime.toDate().toISOString().slice(0, 16) : '';
                 transportArrivalLocInput.value = itemToEdit.arrivalLoc || '';
                 transportArrivalDatetimeInput.value = itemToEdit.arrivalDateTime instanceof Timestamp ? itemToEdit.arrivalDateTime.toDate().toISOString().slice(0, 16) : '';
                 transportBookingRefInput.value = itemToEdit.bookingRef || '';
                 transportCostInput.value = itemToEdit.cost ?? '';
                 transportNotesInput.value = itemToEdit.notes || '';
                 transportLinkInput.value = itemToEdit.link || '';
                 break;
             case 'accommodation':
                 accommodationNameInput.value = itemToEdit.name || '';
                 accommodationTypeSelect.value = itemToEdit.type || 'Hotel';
                 accommodationAddressInput.value = itemToEdit.address || '';
                 accommodationCheckinInput.value = itemToEdit.checkinDateTime instanceof Timestamp ? itemToEdit.checkinDateTime.toDate().toISOString().slice(0, 16) : '';
                 accommodationCheckoutInput.value = itemToEdit.checkoutDateTime instanceof Timestamp ? itemToEdit.checkoutDateTime.toDate().toISOString().slice(0, 16) : '';
                 accommodationBookingRefInput.value = itemToEdit.bookingRef || '';
                 accommodationCostInput.value = itemToEdit.cost ?? '';
                 accommodationNotesInput.value = itemToEdit.notes || '';
                 accommodationLinkInput.value = itemToEdit.link || '';
                 break;
             case 'itinerary':
                 // Converti Timestamp in YYYY-MM-DD
                 itineraryDayInput.value = itemToEdit.day instanceof Timestamp ? itemToEdit.day.toDate().toISOString().split('T')[0] : (itemToEdit.day || ''); // Gestisce anche vecchie stringhe per retrocompatibilità
                 itineraryTimeInput.value = itemToEdit.time || ''; // Time è già stringa HH:mm
                 itineraryActivityInput.value = itemToEdit.activity || '';
                 itineraryLocationInput.value = itemToEdit.location || '';
                 itineraryBookingRefInput.value = itemToEdit.bookingRef || '';
                 itineraryCostInput.value = itemToEdit.cost ?? '';
                 itineraryNotesInput.value = itemToEdit.notes || '';
                 itineraryLinkInput.value = itemToEdit.link || '';
                 break;
             case 'budget': // Ricorda che listType è 'budget', ma subcollection è 'budgetItems'
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

        // Aggiorna UI del form per indicare modifica
        if (submitBtn) { submitBtn.innerHTML = '<i class="fas fa-save"></i> Salva Modifiche'; submitBtn.classList.remove('btn-secondary'); submitBtn.classList.add('btn-warning'); }
        if (cancelBtn) cancelBtn.style.display = 'inline-flex';
        if (listType === 'transport') toggleSearchButtonsVisibility();
        if (form) form.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    } catch (error) {
        console.error(`Errore caricamento dati per modifica ${listType} ${itemId}:`, error);
        showToast(`Errore nel caricamento dell'elemento: ${error.message}`, 'error');
        resetEditState(listType); // Resetta il form se il caricamento fallisce
    }
};

// Gestisce il submit dei form per aggiungere/modificare items
const handleItemFormSubmit = async (e, listType) => { // Ora è async
    e.preventDefault();
    if (!currentUserId || !currentTripId) { showToast("Seleziona un viaggio.", "error"); return; }

    const form = e.target;
    const hiddenInput = form.querySelector(`#edit-${listType}-item-id`);
    const currentEditId = hiddenInput ? hiddenInput.value : null;
    const subcollectionName = listType === 'budget' ? 'budgetItems' : listType; // Usa 'budgetItems' per Firestore

    let itemData = {};
    let dataIsValid = true;
    let errorMessage = "Errore di validazione.";

    // Prepara i dati e valida l'input
    try {
        switch (listType) {
            case 'participant':
                const pName = participantNameInput.value.trim();
                if (!pName) throw new Error("Nome partecipante richiesto.");
                itemData = { name: pName, notes: participantNotesInput.value.trim() || null, extraInfo: participantExtraInfoTextarea.value.trim() || null };
                break;
            case 'reminder':
                 const rDesc = reminderDescriptionInput.value.trim();
                 if (!rDesc) throw new Error("Descrizione promemoria richiesta.");
                 itemData = { description: rDesc, dueDate: toTimestampOrNull(reminderDueDateInput.value), status: reminderStatusSelect.value };
                 break;
             case 'transport':
                 const tDesc = transportDescriptionInput.value.trim();
                 if (!tDesc) throw new Error("Descrizione trasporto richiesta.");
                 const depDateTime = transportDepartureDatetimeInput.value ? toTimestampOrNull(transportDepartureDatetimeInput.value) : null;
                 const arrDateTime = transportArrivalDatetimeInput.value ? toTimestampOrNull(transportArrivalDatetimeInput.value) : null;
                 if (depDateTime && arrDateTime && depDateTime.toMillis() >= arrDateTime.toMillis()) throw new Error("Data/ora arrivo deve essere dopo la partenza.");
                 const transportCost = safeToNumberOrNull(transportCostInput.value);
                 if(transportCost !== null && transportCost < 0) throw new Error("Costo trasporto non valido.");
                 itemData = { type: transportTypeSelect.value, description: tDesc, departureLoc: transportDepartureLocInput.value.trim() || null, departureDateTime: depDateTime, arrivalLoc: transportArrivalLocInput.value.trim() || null, arrivalDateTime: arrDateTime, bookingRef: transportBookingRefInput.value.trim() || null, cost: transportCost, notes: transportNotesInput.value.trim() || null, link: transportLinkInput.value.trim() || null };
                 break;
            case 'accommodation':
                const aName = accommodationNameInput.value.trim();
                if (!aName) throw new Error("Nome alloggio richiesto.");
                const checkin = accommodationCheckinInput.value ? toTimestampOrNull(accommodationCheckinInput.value) : null;
                const checkout = accommodationCheckoutInput.value ? toTimestampOrNull(accommodationCheckoutInput.value) : null;
                if(checkin && checkout && checkin.toMillis() >= checkout.toMillis()) throw new Error("Check-out deve essere dopo check-in.");
                const accomCost = safeToNumberOrNull(accommodationCostInput.value);
                if(accomCost !== null && accomCost < 0) throw new Error("Costo alloggio non valido.");
                itemData = { name: aName, type: accommodationTypeSelect.value, address: accommodationAddressInput.value.trim() || null, checkinDateTime: checkin, checkoutDateTime: checkout, bookingRef: accommodationBookingRefInput.value.trim() || null, cost: accomCost, notes: accommodationNotesInput.value.trim() || null, link: accommodationLinkInput.value.trim() || null };
                break;
             case 'itinerary':
                 // Salva il giorno come Timestamp per query/ordinamento corretto
                 const itinDayRaw = itineraryDayInput.value;
                 const itinDay = itinDayRaw ? toTimestampOrNull(itinDayRaw) : null;
                 const itinAct = itineraryActivityInput.value.trim();
                 if (!itinDay || !itinAct) throw new Error("Giorno e attività richiesti.");

                 // Confronta date usando toDate() o toMillis()
                  if (currentTripDataCache?.startDate && currentTripDataCache?.endDate && itinDay) {
                      const tripStartMillis = currentTripDataCache.startDate.toMillis();
                      const tripEndMillis = currentTripDataCache.endDate.toMillis();
                      const itinDayMillis = itinDay.toMillis();
                      // Aggiusta confronto per includere inizio e fine
                      if (itinDayMillis < tripStartMillis || itinDayMillis > tripEndMillis) {
                         showToast(`Attenzione: data ${formatDate(itinDay)} fuori dal periodo del viaggio (${formatDate(currentTripDataCache.startDate)} - ${formatDate(currentTripDataCache.endDate)}).`, 'warning');
                      }
                 }
                 const itinCost = safeToNumberOrNull(itineraryCostInput.value);
                 if(itinCost !== null && itinCost < 0) throw new Error("Costo attività non valido.");
                 itemData = { day: itinDay, time: itineraryTimeInput.value || null, activity: itinAct, location: itineraryLocationInput.value.trim() || null, bookingRef: itineraryBookingRefInput.value.trim() || null, cost: itinCost, notes: itineraryNotesInput.value.trim() || null, link: itineraryLinkInput.value.trim() || null };
                 break;
            case 'budget':
                const descBudget = budgetDescriptionInput.value.trim();
                const est = safeToNumberOrNull(budgetEstimatedInput.value);
                const act = safeToNumberOrNull(budgetActualInput.value);
                if (!descBudget || est === null || est < 0) throw new Error("Descrizione e costo stimato (>=0) richiesti.");
                if (act !== null && act < 0) throw new Error("Costo effettivo non valido (>=0).");
                 itemData = { category: budgetCategorySelect.value, description: descBudget, estimated: est, actual: act, paidBy: budgetPaidByInput.value.trim() || null, splitBetween: budgetSplitBetweenInput.value.trim() || null };
                 break;
             case 'packing':
                 const pkName = packingItemNameInput.value.trim();
                 if (!pkName) throw new Error("Nome oggetto richiesto.");
                 const quantity = safeToPositiveIntegerOrDefault(packingItemQuantityInput.value);
                 itemData = { name: pkName, category: packingItemCategoryInput.value.trim() || 'Altro', quantity: quantity };
                 // Lo stato 'packed' non viene gestito qui, ma con la checkbox
                 break;
            default:
                throw new Error("Tipo di elemento non riconosciuto.");
        }
        itemData.updatedAt = serverTimestamp(); // Aggiungi timestamp aggiornamento

    } catch (error) {
        dataIsValid = false;
        errorMessage = error.message;
        showToast(`Errore: ${errorMessage}`, 'error');
    }

    if (!dataIsValid) return; // Interrompi se validazione fallita

    // Mostra feedback
    const submitBtn = form.querySelector('button[type="submit"]');
    if(submitBtn) { submitBtn.disabled = true; submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvo...'; }

    try {
        const collectionRef = collection(db, 'trips', currentTripId, subcollectionName);
        if (currentEditId) {
            // --- Modifica Item Esistente ---
            const itemDocRef = doc(collectionRef, currentEditId);
            // Non includere lo stato 'packed' o 'status' se non vengono dal form
            if (listType === 'packing') {
                // Recupera lo stato packed attuale se non è nel form
                // Questo non è necessario se il form non ha la checkbox
            } else if (listType === 'reminder') {
                // Lo stato 'status' viene dal form (reminderStatusSelect)
            }
            await updateDoc(itemDocRef, itemData);
            console.log(`${listType} ${currentEditId} aggiornato.`);
            showToast('Elemento aggiornato!', 'success');
        } else {
            // --- Aggiungi Nuovo Item ---
             if (listType === 'packing') itemData.packed = false; // Default per nuovi item packing
             if (listType === 'reminder') itemData.status = itemData.status || 'todo'; // Default per nuovi reminder
             itemData.createdAt = serverTimestamp(); // Aggiungi timestamp creazione

            const docRef = await addDoc(collectionRef, itemData);
            console.log(`Nuovo ${listType} aggiunto con ID: ${docRef.id}`);
            showToast('Elemento aggiunto!', 'success');
        }

        // Resetta il form dopo successo
        resetEditState(listType);
         // Non serve refresh manuale UI, onSnapshot aggiornerà

         // Aggiorna datalist se necessario
         if(listType === 'participant') {
            // Potremmo dover ricaricare i partecipanti per aggiornare datalist
            // Per ora, lasciamo che onSnapshot gestisca l'aggiornamento della lista UI
            // Se datalist non si aggiorna, serve logica specifica qui
         }
         if(listType === 'packing') {
            // Idem per categorie packing
         }

    } catch (error) {
        console.error(`Errore salvataggio ${listType}:`, error);
        showToast(`Errore durante il salvataggio: ${error.message}`, "error");
    } finally {
        if(submitBtn) {
            submitBtn.disabled = false;
            // Riporta testo originale (cambia se stai modificando o aggiungendo)
             const originalAddText = 'Aggiungi ' + (listType.charAt(0).toUpperCase() + listType.slice(1)); // Ricostruisci testo base
             submitBtn.innerHTML = `<i class="fas fa-plus"></i> ${originalAddText}`; // Assumi sempre aggiungi dopo reset? No, resetEditState lo fa
             resetEditState(listType); // Assicura che il bottone sia resettato
        }
    }
};

// Gestisce eliminazione di un item specifico
const handleDeleteItem = (listType, itemId, itemDesc = '') => { // itemDesc opzionale per conferma
    if (!currentUserId || !currentTripId || !itemId) return;

    const subcollectionName = listType === 'budget' ? 'budgetItems' : listType;
    let itemNameCapitalized = listType.charAt(0).toUpperCase() + listType.slice(1);
    if (listType === 'budget') itemNameCapitalized = 'Spesa'; // Nome più user friendly

    const displayDesc = itemDesc || `ID: ${itemId}`; // Usa descrizione passata o ID

    showConfirmationModal(
        `Conferma Eliminazione ${itemNameCapitalized}`,
        `Eliminare "${displayDesc}"?`,
        async () => { // Callback di conferma
             console.log(`Tentativo eliminazione ${listType} item: ${itemId} da viaggio ${currentTripId}`);
             const itemDocRef = doc(db, 'trips', currentTripId, subcollectionName, itemId);
             try {
                 await deleteDoc(itemDocRef);
                 console.log(`${listType} item ${itemId} eliminato.`);
                 showToast(`${itemNameCapitalized} eliminato/a.`, 'info');
                 // Non serve refresh UI, onSnapshot aggiornerà
                 // Se stavi modificando l'elemento eliminato, resetta il form
                  const hiddenInput = document.getElementById(`edit-${listType}-item-id`);
                  if (hiddenInput && hiddenInput.value === itemId) {
                      resetEditState(listType);
                  }
                 // Aggiorna datalist se necessario (potrebbe richiedere refetch)
                 // if(listType === 'participant' || listType === 'packing') { ... }

             } catch (error) {
                 console.error(`Errore eliminazione ${listType} item ${itemId}:`, error);
                 showToast(`Errore durante l'eliminazione: ${error.message}`, "error");
             }
        }
    );
};

// Gestisce cambio stato packed per packing list
const handleTogglePacked = async (itemId, isPacked) => {
     if (!currentUserId || !currentTripId || !itemId) return;
     const itemDocRef = doc(db, 'trips', currentTripId, 'packingList', itemId);
     try {
         await updateDoc(itemDocRef, {
             packed: isPacked,
             updatedAt: serverTimestamp()
         });
         console.log(`Stato packed per ${itemId} aggiornato a ${isPacked}`);
         // UI si aggiorna automaticamente tramite onSnapshot
     } catch (error) {
          console.error(`Errore aggiornamento stato packed per ${itemId}:`, error);
          showToast("Errore durante l'aggiornamento dello stato.", "error");
          // Ripristina lo stato della checkbox? (Potrebbe essere complicato con onSnapshot)
     }
};

// ==========================================================================
// == NUOVE FUNZIONI PER LISTENER FIRESTORE ==
// ==========================================================================

// Imposta un listener onSnapshot per una sottocollezione
function setupSubcollectionListener(tripId, subcollectionName, renderFunction, ...queryConstraints) {
    if (!currentUserId || !tripId) return;

    const collectionRef = collection(db, 'trips', tripId, subcollectionName);
    const q = query(collectionRef, ...queryConstraints); // Applica ordinamenti ecc. passati

    console.log(`Imposto listener per: trips/${tripId}/${subcollectionName}`);

    const unsubscribe = onSnapshot(q, (snapshot) => {
        console.log(`Snapshot ricevuto per ${subcollectionName} (viaggio ${tripId}), ${snapshot.size} documenti.`);
        const items = [];
        snapshot.forEach(docSnap => {
            items.push({ ...docSnap.data(), id: docSnap.id }); // Aggiungi ID ai dati
        });

        // Aggiorna la cache del viaggio corrente (se necessario e se non è il budget)
         if (subcollectionName !== 'budgetItems' && currentTripDataCache) {
             currentTripDataCache[subcollectionName] = items;
         } else if (subcollectionName === 'budgetItems' && currentTripDataCache) {
             // Aggiorna specificamente budget.items nella cache
             if (!currentTripDataCache.budget) currentTripDataCache.budget = {};
             currentTripDataCache.budget.items = items;
         }

        // Chiama la funzione di rendering appropriata
        if (subcollectionName === 'budgetItems') {
            // RenderBudget potrebbe aver bisogno dell'intero oggetto budget con i totali calcolati
            renderBudget(currentTripDataCache?.budget); // Passa l'oggetto budget dalla cache
        } else {
             renderFunction(items);
        }

        // Aggiorna datalists se sono participants o packingList
        if (subcollectionName === 'participants' || subcollectionName === 'packingList') {
            populateDatalistsFromCache(); // Rileggi dalla cache aggiornata
        }

    }, (error) => {
        console.error(`Errore listener per ${subcollectionName} (viaggio ${tripId}):`, error);
        showToast(`Errore nel caricare ${subcollectionName}.`, "error");
        // Potrebbe essere utile pulire la lista UI qui
        renderFunction([]); // Chiama render con array vuoto in caso di errore
    });

    // Memorizza la funzione di unsubscribe per poterla chiamare dopo
    unsubscribeSubcollectionListeners.push(unsubscribe);
}

// Scollega tutti i listener delle sottocollezioni attivi
function clearSubcollectionListeners() {
    console.log(`Scollego ${unsubscribeSubcollectionListeners.length} listeners sottocollezioni.`);
    unsubscribeSubcollectionListeners.forEach(unsubscribe => unsubscribe());
    unsubscribeSubcollectionListeners = []; // Resetta l'array
}


// ==========================================================================
// == FUNZIONI RENDER LISTE (Modificate per funzionare con dati da Firestore/Listener) ==
// ==========================================================================

// Popola Datalists (ora legge dalla cache aggiornata dai listener)
const populateDatalistsFromCache = () => {
    if (!currentTripDataCache || !participantDatalist || !packingCategoryDatalist) return;

    // Partecipanti
    participantDatalist.innerHTML = '';
    (currentTripDataCache.participants || []).forEach(p => {
        if (p && p.name) {
            const option = document.createElement('option');
            option.value = p.name;
            participantDatalist.appendChild(option);
        }
    });

    // Categorie Packing
    packingCategoryDatalist.innerHTML = '';
    const categories = new Set(DEFAULT_PACKING_CATEGORIES); // Inizia con default
     (currentTripDataCache.packingList || []).forEach(p => {
         if (p && p.category) categories.add(p.category);
     });
    Array.from(categories).sort().forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        packingCategoryDatalist.appendChild(option);
    });
     console.log("Datalists popolate dalla cache.");
};

// Render Participants (ora prende array di oggetti {id, name, notes, ...})
const renderParticipants = (participantsItems = []) => {
    if (!participantListUl) return;
    participantListUl.innerHTML = '';
    if (noParticipantsItemsP) noParticipantsItemsP.style.display = participantsItems.length === 0 ? 'block' : 'none';
    participantsItems.sort((a, b) => (a?.name || '').localeCompare(b?.name || ''));
    participantsItems.forEach(item => {
        if (!item || !item.id) return;
        const li = document.createElement('li');
        li.dataset.itemId = item.id;
        // Aggiungi data-item-desc per usarlo nell'eliminazione
        li.innerHTML = `
            <div class="item-details">
                <strong><i class="fas fa-user fa-fw"></i> ${item.name || 'N/D'}</strong>
                ${item.notes ? `<span class="meta"><i class="fas fa-info-circle fa-fw"></i> ${item.notes}</span>`:''}
                ${item.extraInfo ? `<span class="meta"><i class="fas fa-sticky-note fa-fw"></i> ${item.extraInfo}</span>`:''}
            </div>
            <div class="item-actions">
                <button class="btn-icon edit participant-edit-btn" data-item-id="${item.id}" title="Modifica"><i class="fas fa-edit"></i></button>
                <button class="btn-icon delete participant-delete-btn" data-item-id="${item.id}" data-item-desc="${item.name || '?'}" title="Elimina"><i class="fas fa-trash-alt"></i></button>
            </div>`;
        participantListUl.appendChild(li);
    });
     // Non resettare il form qui, lo fa solo resetEditState o handleItemFormSubmit
};

// Render Reminders
const renderReminders = (remindersItems = []) => {
    if (!reminderListUl) return;
    reminderListUl.innerHTML = '';
     if (noReminderItemsP) noReminderItemsP.style.display = remindersItems.length === 0 ? 'block' : 'none';
    // L'ordinamento viene fatto nella query Firestore, ma possiamo riordinare se necessario
    // const sortKey = currentSort.reminder; items.sort(...);
     remindersItems.forEach(item => {
         if (!item || !item.id) return;
         const li = document.createElement('li');
         li.dataset.itemId = item.id;
         li.classList.toggle('done', item.status === 'done');
         const statusClass = item.status === 'done' ? 'done' : 'todo';
         const statusText = item.status === 'done' ? 'FATTO' : 'DA FARE';
         const dueDateFormatted = formatDate(item.dueDate); // Usa formatDate aggiornato
         li.innerHTML = `
             <div class="item-details">
                 <strong> <span class="status-indicator ${statusClass}">${statusText}</span> ${item.description || 'N/D'} </strong>
                 ${dueDateFormatted ? `<span class="meta due-date"><i class="fas fa-calendar-alt fa-fw"></i> Scadenza: ${dueDateFormatted}</span>` : ''}
             </div>
             <div class="item-actions">
                 <button class="btn-icon edit reminder-edit-btn" data-item-id="${item.id}" title="Modifica"><i class="fas fa-edit"></i></button>
                 <button class="btn-icon delete reminder-delete-btn" data-item-id="${item.id}" data-item-desc="${item.description || '?'}" title="Elimina"><i class="fas fa-trash-alt"></i></button>
             </div>`;
         reminderListUl.appendChild(li);
     });
};

// Render Transportations
const renderTransportations = (transportItems = []) => {
    if (!transportListUl) return;
    transportListUl.innerHTML = '';
    if (noTransportItemsP) noTransportItemsP.style.display = transportItems.length === 0 ? 'block' : 'none';
    // L'ordinamento principale è nella query, ma potremmo riordinare qui per altri criteri
    // const sortKey = currentSort.transport; items.sort(...);
     transportItems.forEach(item => {
         if (!item || !item.id) return;
         const li = document.createElement('li');
         li.dataset.itemId = item.id;
         const iconClass = getTransportIcon(item.type);
         const depDateTimeFormatted = formatDateTime(item.departureDateTime);
         const arrDateTimeFormatted = formatDateTime(item.arrivalDateTime);
         li.innerHTML = `
             <div class="item-details">
                 <strong><i class="fas ${iconClass} fa-fw"></i> ${item.type}: ${item.description || 'N/D'}</strong>
                 <span class="meta"><i class="fas fa-plane-departure fa-fw"></i> Da: ${item.departureLoc || '?'} (${depDateTimeFormatted || '?'})</span>
                 <span class="meta"><i class="fas fa-plane-arrival fa-fw"></i> A: ${item.arrivalLoc || '?'} (${arrDateTimeFormatted || '?'})</span>
                 ${item.bookingRef ? `<span class="meta"><i class="fas fa-ticket-alt fa-fw"></i> Rif: ${item.bookingRef}</span>`:''}
                 ${item.cost!==null ? `<span class="meta"><i class="fas fa-euro-sign fa-fw"></i> Costo: ${formatCurrency(item.cost)}</span>`:''}
                 ${item.notes ? `<span class="meta"><i class="fas fa-info-circle fa-fw"></i> Note: ${item.notes}</span>`:''}
                 ${item.link ? `<span class="meta"><i class="fas fa-link fa-fw"></i> Link: ${formatDisplayLink(item.link)}</span>`:''}
             </div>
             <div class="item-actions">
                 <button class="btn-icon edit transport-edit-btn" data-item-id="${item.id}" title="Modifica"><i class="fas fa-edit"></i></button>
                 <button class="btn-icon delete transport-delete-btn" data-item-id="${item.id}" data-item-desc="${item.description || '?'}" title="Elimina"><i class="fas fa-trash-alt"></i></button>
             </div>`;
         transportListUl.appendChild(li);
     });
};
const getTransportIcon = (type) => { /* ... (invariato) ... */ switch(type) { case 'Volo': return 'fa-plane-departure'; case 'Treno': return 'fa-train'; case 'Auto': return 'fa-car'; case 'Bus': return 'fa-bus-alt'; case 'Traghetto': return 'fa-ship'; case 'Metro/Mezzi Pubblici': return 'fa-subway'; case 'Taxi/Ride Sharing': return 'fa-taxi'; default: return 'fa-road'; } };

// Render Accommodations
const renderAccommodations = (accommodationsItems = []) => {
    if (!accommodationListUl) return;
    accommodationListUl.innerHTML = '';
    if (noAccommodationItemsP) noAccommodationItemsP.style.display = accommodationsItems.length === 0 ? 'block' : 'none';
    // Ordinamento da query Firestore
     accommodationsItems.forEach(item => {
         if (!item || !item.id) return;
         const li = document.createElement('li');
         li.dataset.itemId = item.id;
         const mapLink = createMapLink(item.address);
         const checkinFormatted = formatDateTime(item.checkinDateTime);
         const checkoutFormatted = formatDateTime(item.checkoutDateTime);
         li.innerHTML = `
             <div class="item-details">
                 <strong><i class="fas fa-hotel fa-fw"></i> ${item.name || 'N/D'} (${item.type || 'N/D'})</strong>
                 ${item.address ? `<span class="meta"><i class="fas fa-map-marker-alt fa-fw"></i> ${item.address} ${mapLink ? `<a href="${mapLink}" target="_blank" rel="noopener noreferrer" class="btn-map-link" title="Mostra Mappa"><i class="fas fa-map-marked-alt"></i></a>` : ''}</span>`:''}
                 <span class="meta"><i class="fas fa-calendar-check fa-fw"></i> Check-in: ${checkinFormatted || '?'}</span>
                 <span class="meta"><i class="fas fa-calendar-times fa-fw"></i> Check-out: ${checkoutFormatted || '?'}</span>
                 ${item.bookingRef ? `<span class="meta"><i class="fas fa-key fa-fw"></i> Rif: ${item.bookingRef}</span>`:''}
                 ${item.cost!==null ? `<span class="meta"><i class="fas fa-euro-sign fa-fw"></i> Costo: ${formatCurrency(item.cost)}</span>`:''}
                 ${item.notes ? `<span class="meta"><i class="fas fa-info-circle fa-fw"></i> Note: ${item.notes}</span>`:''}
                 ${item.link ? `<span class="meta"><i class="fas fa-link fa-fw"></i> Link: ${formatDisplayLink(item.link)}</span>`:''}
             </div>
             <div class="item-actions">
                 <button class="btn-icon edit accommodation-edit-btn" data-item-id="${item.id}" title="Modifica"><i class="fas fa-edit"></i></button>
                 <button class="btn-icon delete accommodation-delete-btn" data-item-id="${item.id}" data-item-desc="${item.name || '?'}" title="Elimina"><i class="fas fa-trash-alt"></i></button>
             </div>`;
         accommodationListUl.appendChild(li);
     });
};

// Render Itinerary
const renderItinerary = (itineraryItems = []) => {
    if (!itineraryListUl) return;
    itineraryListUl.innerHTML = '';
    if (noItineraryItemsP) noItineraryItemsP.style.display = itineraryItems.length === 0 ? 'block' : 'none';

    // Filtro ricerca interna (lato client, sui dati ricevuti da Firestore)
    const searchTerm = currentSearchTerm.itinerary.toLowerCase();
     let filteredItems = itineraryItems;
     if (searchTerm) {
         filteredItems = itineraryItems.filter(item =>
             (item.activity?.toLowerCase() || '').includes(searchTerm) ||
             (item.location?.toLowerCase() || '').includes(searchTerm) ||
             (item.notes?.toLowerCase() || '').includes(searchTerm)
         );
     }

    // Ordinamento (già fatto da Firestore, ma potremmo voler riordinare per altri criteri qui)
    // const sortKey = currentSort.itinerary; items.sort(...);

    filteredItems.forEach(item => {
        if (!item || !item.id) return;
        const li = document.createElement('li');
        li.dataset.itemId = item.id;
        const mapLink = createMapLink(item.location);
        const dayFormatted = formatDate(item.day); // Usa formatDate aggiornato
        li.innerHTML = `
            <div class="item-details">
                <strong>${dayFormatted || '?'} ${item.time?'('+item.time+')':''} - ${item.activity||'N/D'}</strong>
                ${item.location ? `<span class="meta"><i class="fas fa-map-marker-alt fa-fw"></i> ${item.location} ${mapLink ? `<a href="${mapLink}" target="_blank" rel="noopener noreferrer" class="btn-map-link" title="Mostra Mappa"><i class="fas fa-map-marked-alt"></i></a>` : ''}</span>`:''}
                ${item.bookingRef ? `<span class="meta"><i class="fas fa-ticket-alt fa-fw"></i> Rif: ${item.bookingRef}</span>`:''}
                ${item.cost!==null ? `<span class="meta"><i class="fas fa-euro-sign fa-fw"></i> Costo: ${formatCurrency(item.cost)}</span>`:''}
                ${item.notes ? `<span class="meta"><i class="fas fa-info-circle fa-fw"></i> Note: ${item.notes}</span>`:''}
                ${item.link ? `<span class="meta"><i class="fas fa-link fa-fw"></i> Link: ${formatDisplayLink(item.link)}</span>`:''}
            </div>
            <div class="item-actions">
                <button class="btn-icon edit itinerary-edit-btn" data-item-id="${item.id}" title="Modifica"><i class="fas fa-edit"></i></button>
                <button class="btn-icon delete itinerary-delete-btn" data-item-id="${item.id}" data-item-desc="${item.activity || '?'}" title="Elimina"><i class="fas fa-trash-alt"></i></button>
            </div>`;
        itineraryListUl.appendChild(li);
    });
};

// Render Budget (Prende l'oggetto budget completo dalla cache {items, estimatedTotal, actualTotal})
const renderBudget = (budgetObject = { items: [] }) => {
    const budgetItems = Array.isArray(budgetObject.items) ? budgetObject.items : [];
    if (!budgetListUl) return;
    budgetListUl.innerHTML = '';
     if (noBudgetItemsP) noBudgetItemsP.style.display = budgetItems.length === 0 ? 'block' : 'none';

    // Calcola totali qui, basati sugli items ricevuti (non fidarsi dei totali nella cache per il render)
    let calcEst = 0;
    let calcAct = 0;
    budgetItems.forEach(item => {
        const est = safeToNumberOrNull(item.estimated);
        const act = safeToNumberOrNull(item.actual);
        if (est !== null) calcEst += est;
        if (act !== null) calcAct += act;
    });

    // Ordinamento lato client basato su currentSort.budget
    const sortKey = currentSort.budget;
     budgetItems.sort((a, b) => {
         if (sortKey === 'estimatedDesc') { return (safeToNumberOrNull(b?.estimated) ?? -Infinity) - (safeToNumberOrNull(a?.estimated) ?? -Infinity); }
         if (sortKey === 'actualDesc') { return (safeToNumberOrNull(b?.actual) ?? -Infinity) - (safeToNumberOrNull(a?.actual) ?? -Infinity); }
         if (sortKey === 'description') { return (a?.description || '').localeCompare(b?.description || ''); }
         return (a?.category || '').localeCompare(b?.category || ''); // Default: per categoria
     });

    budgetItems.forEach(item => {
        if (!item || !item.id) return;
        const est = safeToNumberOrNull(item.estimated);
        const act = safeToNumberOrNull(item.actual);
        let cls = '';
        if (act !== null && est !== null && est > 0) {
            if (act > est) cls = 'negative';
            else if (act < est) cls = 'positive';
        }
        const li = document.createElement('li');
        li.dataset.itemId = item.id;
        li.innerHTML = `
            <div class="item-details">
                <strong>${item.category||'N/D'}: ${item.description||'N/D'}</strong>
                <span class="meta">Stimato: ${formatCurrency(est)} | Effettivo: <span class="${cls}">${act === null ? 'N/A' : formatCurrency(act)}</span></span>
                ${ (item.paidBy || item.splitBetween) ? `<span class="meta split-info"><i class="fas fa-user-friends fa-fw"></i> Pagato da: ${item.paidBy || '?'} / Diviso tra: ${item.splitBetween || '?'}</span>` : '' }
            </div>
            <div class="item-actions">
                 <button class="btn-icon edit budget-edit-btn" data-item-id="${item.id}" title="Modifica"><i class="fas fa-edit"></i></button>
                 <button class="btn-icon delete budget-delete-btn" data-item-id="${item.id}" data-item-desc="${item.description || '?'}" title="Elimina"><i class="fas fa-trash-alt"></i></button>
            </div>`;
        budgetListUl.appendChild(li);
    });

    // Aggiorna totali UI
    if (budgetTotalEstimatedStrong) budgetTotalEstimatedStrong.textContent = formatCurrency(calcEst);
    if (budgetTotalActualStrong) budgetTotalActualStrong.textContent = formatCurrency(calcAct);
    const diff = calcAct - calcEst;
    if (budgetDifferenceStrong) {
        budgetDifferenceStrong.textContent = formatCurrency(diff);
        budgetDifferenceStrong.className = '';
        if (diff < 0) budgetDifferenceStrong.classList.add('positive');
        else if (diff > 0) budgetDifferenceStrong.classList.add('negative');
    }

    // ***** NUOVO: Aggiorna totali nella cache del viaggio (NON salva su DB qui) *****
     if (currentTripDataCache && currentTripDataCache.budget) {
        currentTripDataCache.budget.estimatedTotal = calcEst;
        currentTripDataCache.budget.actualTotal = calcAct;
     }
};


// Render Packing List
const renderPackingList = (packingItems = []) => {
    if (!packingListUl) return;
    packingListUl.innerHTML = '';
    if (noPackingItemsP) noPackingItemsP.style.display = packingItems.length === 0 ? 'block' : 'none';

    // Filtro
    const searchTerm = currentSearchTerm.packing.toLowerCase();
     let filteredItems = packingItems;
     if (searchTerm) {
         filteredItems = packingItems.filter(item =>
             (item.name?.toLowerCase() || '').includes(searchTerm) ||
             (item.category?.toLowerCase() || '').includes(searchTerm)
         );
     }

    // Ordinamento
    const sortKey = currentSort.packing;
    filteredItems.sort((a, b) => {
        if (sortKey === 'category') { return (a?.category || 'zzz').localeCompare(b?.category || 'zzz') || (a?.name || '').localeCompare(b?.name || ''); }
        if (sortKey === 'status') { const packedA = a.packed ? 1 : 0; const packedB = b.packed ? 1 : 0; return packedA - packedB || (a?.name || '').localeCompare(b?.name || ''); }
        return (a?.name || '').localeCompare(b?.name || ''); // Default: per nome
    });

    // Raggruppamento per categoria se necessario
    if (sortKey === 'category') {
        const grouped = filteredItems.reduce((acc, item) => { /* ... (logica raggruppamento invariata) ... */ const cat = item.category || 'Altro'; if (!acc[cat]) acc[cat] = []; acc[cat].push(item); return acc; }, {});
        const sortedCategories = Object.keys(grouped).sort((a, b) => (a === 'Altro' ? 1 : b === 'Altro' ? -1 : a.localeCompare(b)));
        packingListUl.innerHTML = ''; // Pulisci di nuovo per gruppi
        sortedCategories.forEach(category => {
            const groupDiv = document.createElement('div');
            groupDiv.classList.add('packing-list-category-group');
            const title = document.createElement('h5');
            title.textContent = category;
            groupDiv.appendChild(title);
            const groupUl = document.createElement('ul');
            groupUl.classList.add('item-list', 'packing-list', 'nested');
             grouped[category].forEach(item => {
                 const listItem = createPackingListItem(item); // Usa helper
                 if(listItem) groupUl.appendChild(listItem);
             });
            groupDiv.appendChild(groupUl);
            packingListUl.appendChild(groupDiv);
        });
    } else {
        filteredItems.forEach(item => {
             const listItem = createPackingListItem(item); // Usa helper
             if(listItem) packingListUl.appendChild(listItem);
         });
    }
};
// Helper per creare LI packing list (invariato ma ora chiamato da renderPackingList)
const createPackingListItem = (item) => {
     if (!item || !item.id) return null;
     const li = document.createElement('li');
     li.dataset.itemId = item.id;
     li.classList.toggle('packed', item.packed);
     li.innerHTML = `
         <div class="form-check">
             <input class="form-check-input packing-checkbox" type="checkbox" id="pack-${item.id}" data-item-id="${item.id}" ${item.packed ? 'checked' : ''}>
             <label class="form-check-label" for="pack-${item.id}">
                 ${item.name || 'N/D'} ${item.quantity > 1 ? `<span class="packing-quantity">(x${item.quantity})</span>` : ''}
             </label>
         </div>
         <div class="item-details">
             ${item.category && item.category !== 'Altro' ? `<span class="packing-category">${item.category}</span>` : ''}
         </div>
         <div class="item-actions">
             <button class="btn-icon edit packing-edit-btn" data-item-id="${item.id}" title="Modifica"><i class="fas fa-edit"></i></button>
             <button class="btn-icon delete packing-delete-btn" data-item-id="${item.id}" data-item-desc="${item.name || '?'}" title="Elimina"><i class="fas fa-trash-alt"></i></button>
         </div>`;
     return li;
 };


// ==========================================================================
// == FUNZIONE AGGIUNGI COSTO AL BUDGET (Modificato per Firestore) ==
// ==========================================================================
const addCostToBudget = async (category, description, cost) => {
    if (!currentUserId || !currentTripId || cost === null || cost <= 0) {
        showToast("Seleziona un viaggio e specifica un costo valido.", "warning");
        return;
    }

    const budgetItem = {
        category: category,
        description: description,
        estimated: cost,
        actual: null, // Lascia effettivo a null inizialmente
        paidBy: null,
        splitBetween: null,
         createdAt: serverTimestamp(),
         updatedAt: serverTimestamp()
    };

    try {
        const budgetItemsColRef = collection(db, 'trips', currentTripId, 'budgetItems');
        const docRef = await addDoc(budgetItemsColRef, budgetItem);
        console.log(`Voce budget ${docRef.id} aggiunta da ${category}.`);
        showToast(`Costo ${category} (${formatCurrency(cost)}) aggiunto al budget!`, 'success');
        // UI si aggiorna da onSnapshot, ma potremmo voler forzare il focus sulla tab budget
        // switchTab('budget-tab');
    } catch (error) {
        console.error("Errore aggiunta voce budget:", error);
        showToast("Errore durante l'aggiunta al budget.", "error");
    }
};
// Funzione wrapper (invariata, chiama addCostToBudget)
const handleCalculateAndAddTransportCost = () => {
    if (!currentTripId) { showToast("Seleziona un viaggio.", "error"); return; }
    // Legge dalla cache locale aggiornata dai listener
    if (!currentTripDataCache || !Array.isArray(currentTripDataCache.transportations)) {
        showToast("Dati trasporti non ancora caricati o errati.", "warning"); return;
    }
    let totalCost = 0;
    currentTripDataCache.transportations.forEach(item => {
        const cost = safeToNumberOrNull(item?.cost);
        if (cost !== null && cost > 0) { totalCost += cost; }
    });
    if (totalCost <= 0) { showToast("Nessun costo trasporto trovato da aggiungere.", "info"); return; }
    addCostToBudget("Trasporti", `Totale Costi Trasporti (del ${formatDate(Timestamp.now())})`, totalCost);
};


// ==========================================================================
// == FUNZIONI UI (Alcune modificate, altre invariate) ==
// ==========================================================================
const switchTab = (tabId) => { /* ... (invariato) ... */ if (!tabId) return; document.querySelectorAll(".tab-content").forEach(t => { t.style.display="none"; t.classList.remove("active"); }); document.querySelectorAll(".tab-link").forEach(l => l.classList.remove("active")); const c = document.getElementById(tabId); const l = tabsContainer?.querySelector(`.tab-link[data-tab="${tabId}"]`); if(c){ c.style.display="block"; setTimeout(()=>c.classList.add("active"),10); } else { console.error(`Contenuto tab ${tabId} non trovato`); } if(l) l.classList.add("active"); else { console.error(`Link tab ${tabId} non trovato`); }};
const toggleSearchButtonsVisibility = () => { /* ... (invariato) ... */ if (!transportTypeSelect) return; const type = transportTypeSelect.value; if(searchSkyscannerBtn) searchSkyscannerBtn.style.display = (type === 'Volo') ? 'inline-flex' : 'none'; if(searchTrainlineBtn) searchTrainlineBtn.style.display = (type === 'Treno') ? 'inline-flex' : 'none'; };
// Gestisce cambio ordinamento (Ora riordina solo lato client, ma query Firestore gestisce l'ordine iniziale)
const handleSortChange = (listType, selectElement) => {
     if (!currentTripId || !currentTripDataCache) return;
     currentSort[listType] = selectElement.value;
     // Richiama la funzione di rendering appropriata, che ora userà currentSort
     // per riordinare i dati (già presenti in currentTripDataCache) lato client.
     switch(listType) {
         case 'reminder': renderReminders(currentTripDataCache.reminders); break;
         case 'transport': renderTransportations(currentTripDataCache.transportations); break;
         case 'itinerary': renderItinerary(currentTripDataCache.itinerary); break;
         case 'budget': renderBudget(currentTripDataCache.budget); break; // Passa l'oggetto budget
         case 'packing': renderPackingList(currentTripDataCache.packingList); break;
     }
      console.log(`Riordinamento lato client per ${listType} applicato con chiave: ${currentSort[listType]}`);
};
// Applica ordinamento ai controlli select (invariato)
const applyCurrentSortToControls = () => { if(reminderSortControl) reminderSortControl.value = currentSort.reminder; if(transportSortControl) transportSortControl.value = currentSort.transport; if(itinerarySortControl) itinerarySortControl.value = currentSort.itinerary; if(budgetSortControl) budgetSortControl.value = currentSort.budget; if(packingSortControl) packingSortControl.value = currentSort.packing; };
// Gestisce ricerca interna (Ora filtra solo lato client i dati correnti)
const handleInternalSearch = (listType, inputElement) => {
    if (!currentTripId || !currentTripDataCache) return;
    currentSearchTerm[listType] = inputElement.value.toLowerCase();
     // Richiama la funzione di rendering che applicherà il filtro
    if (listType === 'itinerary') renderItinerary(currentTripDataCache.itinerary);
    else if (listType === 'packing') renderPackingList(currentTripDataCache.packingList);
};

// ==========================================================================
// == FUNZIONI RICERCA ESTERNA (Invariate) ==
// ==========================================================================
const handleSearchFlights = () => { /* ... (invariato) ... */ const origin = transportDepartureLocInput.value.trim(); const dest = transportArrivalLocInput.value.trim(); const startRaw = transportDepartureDatetimeInput.value ? transportDepartureDatetimeInput.value.split('T')[0] : ''; const endRaw = transportArrivalDatetimeInput.value ? transportArrivalDatetimeInput.value.split('T')[0] : ''; const startSky = formatSkyscannerDate(startRaw); const endSky = formatSkyscannerDate(endRaw); if (!origin || !dest) { showToast("Inserisci Origine e Destinazione nel form.", "warning"); return; } if (!startSky || !endSky) { showToast("Inserisci date valide nel form.", "warning"); return; } if (startRaw > endRaw) { showToast("Data arrivo non valida.", "warning"); return; } const base = "https://www.skyscanner.it/trasporti/voli/"; const origCode = origin.toLowerCase().replace(/\s+/g, '-') || 'anywhere'; const destCode = dest.toLowerCase().replace(/\s+/g, '-') || 'anywhere'; const url = `${base}${origCode}/${destCode}/${startSky}/${endSky}/?rtn=1&adults=1&children=0&infants=0&cabinclass=economy&preferdirects=false`; console.log("URL Skyscanner:", url); window.open(url, '_blank', 'noopener,noreferrer'); };
const handleSearchTrains = () => { /* ... (invariato) ... */ const origin = transportDepartureLocInput.value.trim(); const dest = transportArrivalLocInput.value.trim(); const startRaw = transportDepartureDatetimeInput.value ? transportDepartureDatetimeInput.value.split('T')[0] : ''; const endRaw = transportArrivalDatetimeInput.value ? transportArrivalDatetimeInput.value.split('T')[0] : ''; if (!origin || !dest) { showToast("Inserisci Origine e Destinazione.", "warning"); return; } if (!startRaw.match(/^\d{4}-\d{2}-\d{2}$/) || !endRaw.match(/^\d{4}-\d{2}-\d{2}$/)) { showToast("Inserisci Date valide.", "warning"); return; } if (startRaw > endRaw) { showToast("Data arrivo non valida.", "warning"); return; } const base = "https://www.thetrainline.com/it/orari-treni/"; const origFmt = origin.toUpperCase().replace(/\s+/g, '-'); const destFmt = dest.toUpperCase().replace(/\s+/g, '-'); const url = `${base}${origFmt}-a-${destFmt}?departureDate=${startRaw}&returnDate=${endRaw}&adults=1`; console.log("URL Trainline:", url); window.open(url, '_blank', 'noopener,noreferrer'); };


// ==========================================================================
// == FUNZIONI DOWNLOAD / EMAIL / COPIA (Modificate per usare Cache) ==
// ==========================================================================
const handleEmailSummary = () => { // ***** MODIFICATO: Usa currentTripDataCache *****
    console.log("DEBUG: handleEmailSummary chiamata.");
    try {
        if (!currentUserId || !currentTripId || !currentTripDataCache) { showToast("Seleziona un viaggio e attendi il caricamento.", "warning"); return; }
        const trip = currentTripDataCache; // Usa la cache
        console.log("DEBUG: Dati viaggio (da cache) per email:", trip);

        let emailBody = `Riepilogo Viaggio: ${trip.name || 'S.N.'}\n========================\n\n`;
        emailBody += `Destinazione: ${trip.destination || 'N/D'}\n`;
        emailBody += `Date: ${formatDate(trip.startDate)} - ${formatDate(trip.endDate)}\n`; // formatDate gestisce Timestamp
        emailBody += `Partecipanti: ${(trip.participants || []).map(p => p.name).join(', ') || 'Nessuno'}\n\n`;
        emailBody += `Note: ${trip.notes || '-'}\n\n`;
        emailBody += `(Per i dettagli completi, chiedi il link di condivisione dell'app)\n`;

        const emailSubject = `Riepilogo Viaggio: ${trip.name || 'S.N.'}`;
        const mailtoLink = `mailto:?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
        console.log("DEBUG: Mailto link generato:", mailtoLink);

        try {
             console.log("DEBUG: Tento apertura mailto...");
             const mailWindow = window.open(mailtoLink, '_blank');
             if (!mailWindow || mailWindow.closed || typeof mailWindow.closed=='undefined') {
                  console.warn("DEBUG: Apertura finestra email bloccata o fallita, tento con reindirizzamento...");
                  window.location.href = mailtoLink;
             }
             console.log("DEBUG: Apertura mailto tentata.");
        } catch (e) {
             console.error("Errore apertura link mailto specifico:", e);
             showToast("Impossibile aprire il client email.", "error");
        }
    } catch (error) {
        console.error("Errore generale in handleEmailSummary:", error);
        showToast("Errore nella preparazione dell'email.", "error");
    }
};

const handleCopySummary = () => { // ***** MODIFICATO: Usa currentTripDataCache *****
    console.log("DEBUG: handleCopySummary chiamata.");
    try {
         if (!currentUserId || !currentTripId || !currentTripDataCache) { showToast("Seleziona un viaggio e attendi il caricamento.", "warning"); return; }
         const trip = currentTripDataCache;
         console.log("DEBUG: Dati viaggio (da cache) per copia:", trip);

        let textToCopy = `✈️ *Riepilogo Viaggio: ${trip.name || 'S.N.'}*\n`;
        textToCopy += `📍 Destinazione: ${trip.destination || 'N/D'}\n`;
        textToCopy += `📅 Date: ${formatDate(trip.startDate)} - ${formatDate(trip.endDate)}\n`;
        textToCopy += `👥 Partecipanti: ${(trip.participants || []).map(p => p.name).join(', ') || 'Nessuno'}\n`;
        textToCopy += `📝 Note: ${trip.notes || '-'}\n`;
        textToCopy += `(Per i dettagli completi, chiedi il link di condivisione dell'app)`;

        console.log("DEBUG: Testo da copiare:", textToCopy);

        if (navigator.clipboard && navigator.clipboard.writeText) {
             console.log("DEBUG: Uso navigator.clipboard.writeText");
             navigator.clipboard.writeText(textToCopy)
                 .then(() => { console.log("DEBUG: Copia riuscita (navigator)."); showToast("Riepilogo copiato negli appunti!", "success"); })
                 .catch(err => { console.error('Errore copia (navigator):', err); showToast("Errore durante la copia.", "error"); fallbackCopyTextToClipboard(textToCopy); });
        } else {
             console.log("DEBUG: Uso fallbackCopyTextToClipboard");
             fallbackCopyTextToClipboard(textToCopy);
        }
    } catch (error) {
         console.error("Errore generale in handleCopySummary:", error);
         showToast("Errore nella preparazione del testo da copiare.", "error");
    }
};

const handleDownloadText = () => { // ***** MODIFICATO: Usa currentTripDataCache *****
    console.log("DEBUG: handleDownloadText chiamata.");
    try {
        if (!currentUserId || !currentTripId || !currentTripDataCache) { showToast("Seleziona un viaggio e attendi il caricamento.", "error"); return; }
        const trip = currentTripDataCache; // Usa la cache!
        if (!trip) { showToast("Dati viaggio non disponibili.", "error"); return; }
        console.log("DEBUG: Dati viaggio (da cache) per TXT:", trip);

        let content = '';
        try {
             // Usa formatDate e formatDateTime aggiornati per gestire Timestamp
             content = `Riepilogo Viaggio: ${trip.name || 'S.N.'} ${trip.isTemplate ? '(TEMPLATE)' : ''}\n========================\n\n`;
             content += `**INFO**\nOrigine: ${trip.originCity || 'N/D'}\nDest.: ${trip.destination || 'N/D'}\nDate: ${formatDate(trip.startDate)} - ${formatDate(trip.endDate)}\nNote: ${trip.notes || '-'}\nExtra Info: ${trip.extraInfo || '-'}\n\n`;
             content += `**PARTECIPANTI** (${(trip.participants || []).length})\n`; (trip.participants || []).slice().sort((a,b)=>(a?.name||'').localeCompare(b?.name||'')).forEach(p => { content += `- ${p.name}${p.notes ? ' ('+p.notes+')':''}${p.extraInfo ? ' [Extra: '+p.extraInfo+']':''}\n`}); if((trip.participants || []).length === 0) content += "Nessuno\n"; content += "\n";
             content += `**PROMEMORIA** (${(trip.reminders || []).length})\n`; (trip.reminders || []).slice().sort((a,b)=>(a?.dueDate || Timestamp.fromDate(new Date(9999,11,31))).toMillis() - (b?.dueDate || Timestamp.fromDate(new Date(9999,11,31))).toMillis()).forEach(r => { content += `- [${r.status==='done'?'X':' '}] ${r.description}${r.dueDate ? ' (Scad: '+formatDate(r.dueDate)+')':''}\n`}); if((trip.reminders || []).length === 0) content += "Nessuno\n"; content += "\n";
             content += `**TRASPORTI** (${(trip.transportations || []).length})\n`; (trip.transportations || []).slice().sort((a,b)=>(a?.departureDateTime||Timestamp.fromDate(new Date(0))).toMillis() - (b?.departureDateTime||Timestamp.fromDate(new Date(0))).toMillis()).forEach(i => { content += `- ${i.type} (${i.description}): Da ${i.departureLoc||'?'} (${formatDateTime(i.departureDateTime)}) a ${i.arrivalLoc||'?'} (${formatDateTime(i.arrivalDateTime)})${i.cost!==null ? ' Costo: '+formatCurrency(i.cost):''}${i.bookingRef ? ' Rif: '+i.bookingRef:''}${i.notes ? ' Note: '+i.notes:''}${i.link ? ' Link: '+i.link:''}\n` }); if((trip.transportations || []).length === 0) content += "Nessuno\n"; content += "\n";
             content += `**ALLOGGI** (${(trip.accommodations || []).length})\n`; (trip.accommodations || []).slice().sort((a,b)=>(a?.checkinDateTime||Timestamp.fromDate(new Date(0))).toMillis() - (b?.checkinDateTime||Timestamp.fromDate(new Date(0))).toMillis()).forEach(i => { content += `- ${i.name} (${i.type}): ${i.address||'?'}. CheckIn: ${formatDateTime(i.checkinDateTime)}, CheckOut: ${formatDateTime(i.checkoutDateTime)}${i.cost!==null ? ' Costo: '+formatCurrency(i.cost):''}${i.bookingRef ? ' Rif: '+i.bookingRef:''}${i.notes ? ' Note: '+i.notes:''}${i.link ? ' Link: '+i.link:''}\n` }); if((trip.accommodations || []).length === 0) content += "Nessuno\n"; content += "\n";
             content += `**ITINERARIO** (${(trip.itinerary || []).length})\n`; (trip.itinerary || []).slice().sort((a,b)=>{const dayA = a?.day instanceof Timestamp ? a.day.toMillis() : 0; const dayB = b?.day instanceof Timestamp ? b.day.toMillis() : 0; const d=dayA-dayB; return d!==0?d:(a?.time||'').localeCompare(b?.time||'');}).forEach(i => { content += `- ${formatDate(i.day)}${i.time?' ('+i.time+')':''} ${i.activity}${i.location?' @'+i.location:''}${i.bookingRef?' [Rif:'+i.bookingRef+']':''}${i.cost!==null?' Costo:'+formatCurrency(i.cost):''}${i.notes?' ('+i.notes+')':''}${i.link?' Link:'+i.link:''}\n` }); if((trip.itinerary || []).length === 0) content += "Nessuno\n"; content += "\n";
             content += `**BUDGET** (${(trip.budget?.items || []).length} voci)\n`; (trip.budget?.items || []).slice().sort((a,b)=>(a?.category||'').localeCompare(b?.category||'')).forEach(i => { content += `- ${i.category}: ${i.description} (Est: ${formatCurrency(i.estimated)}, Act: ${i.actual===null?'N/A':formatCurrency(i.actual)})${i.paidBy ? ' Pagato da: '+i.paidBy:''}${i.splitBetween ? ' Diviso: '+i.splitBetween:''}\n` }); const budgetItemsExist = (trip.budget?.items || []).length > 0; if(budgetItemsExist) content += `> Tot Est: ${formatCurrency(trip.budget?.estimatedTotal||0)}, Tot Act: ${formatCurrency(trip.budget?.actualTotal||0)}, Diff: ${formatCurrency((trip.budget?.actualTotal||0) - (trip.budget?.estimatedTotal||0))}\n`; else content += "Nessuna spesa\n"; content += "\n";
             content += `**PACKING LIST** (${(trip.packingList || []).length})\n`; (trip.packingList || []).slice().sort((a,b)=>(a?.category||'zzz').localeCompare(b?.category||'zzz') || (a?.name||'').localeCompare(b?.name||'')).forEach(i => { content += `- [${i.packed?'X':' '}] ${i.name}${i.quantity>1?' (x'+i.quantity+')':''} [${i.category||'Altro'}]\n` }); if((trip.packingList || []).length === 0) content += "Lista vuota\n";

            console.log("DEBUG: Contenuto TXT generato (da cache), lunghezza:", content.length);
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
            console.log("DEBUG: Eseguo click simulato per download TXT...");
            a.click();
            console.log("DEBUG: Click simulato TXT eseguito.");
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            console.log("DEBUG: Download TXT completato (o iniziato).");
        } catch (downloadError) {
             console.error("Errore durante il download effettivo del TXT:", downloadError);
             showToast("Errore durante il download del file.", "error");
        }

    } catch (error) {
        console.error("Errore generale in handleDownloadText:", error);
        showToast("Errore imprevisto nella generazione del file di testo.", "error");
    }
};

const handleDownloadExcel = () => { // ***** MODIFICATO: Usa currentTripDataCache *****
    console.log("DEBUG: handleDownloadExcel chiamata.");
    try {
        if (!currentUserId || !currentTripId || !currentTripDataCache) { showToast("Seleziona un viaggio e attendi il caricamento.", "error"); return; }
        const trip = currentTripDataCache; // Usa la cache!
        if (!trip) { showToast("Dati viaggio non disponibili.", "error"); return; }
        console.log("DEBUG: Dati viaggio (da cache) per Excel:", trip);

        if (typeof XLSX === 'undefined') { console.error("Libreria XLSX (SheetJS) non trovata!"); showToast("Errore: libreria per Excel non caricata.", "error"); return; }
        console.log("DEBUG: Libreria XLSX trovata.");

        let wb;
        try {
             wb = XLSX.utils.book_new();
             const cf = '#,##0.00 €'; // Formato valuta
             const nf = '#,##0';     // Formato numero intero
             const df = 'dd/mm/yyyy'; // Formato data
             const dtf = 'dd/mm/yyyy hh:mm'; // Formato data/ora

             // Helper per creare cella data/ora formattata per Excel
             const createDateCell = (timestamp) => {
                 if (timestamp instanceof Timestamp) {
                     // XLSX usa numeri seriali di Excel (giorni dal 1900 o 1904)
                     // La conversione diretta può essere complessa, usiamo stringa formattata
                     // return { t: 'd', v: timestamp.toDate(), z: df }; // Prova tipo 'd' se funziona
                      return formatDate(timestamp); // Usa stringa formattata se 'd' non va bene
                 }
                 return formatDate(timestamp); // Prova con stringa ISO se non è Timestamp
             };
              const createDateTimeCell = (timestamp) => {
                 if (timestamp instanceof Timestamp) {
                     // return { t: 'd', v: timestamp.toDate(), z: dtf };
                     return formatDateTime(timestamp);
                 }
                  return formatDateTime(timestamp);
             };

             // Riepilogo
             const budgetEstTotal = safeToNumberOrNull(trip.budget?.estimatedTotal) ?? 0;
             const budgetActTotal = safeToNumberOrNull(trip.budget?.actualTotal) ?? 0;
             const summary = [ ["Voce","Dettaglio"], ["Viaggio", trip.name||'S.N.'], ["Template", trip.isTemplate ? 'Sì' : 'No'], ["Origine", trip.originCity||'N/D'], ["Dest.", trip.destination||'N/D'], ["Periodo", `${createDateCell(trip.startDate)} - ${createDateCell(trip.endDate)}`], ["Note", trip.notes||'-'], ["Extra Info", trip.extraInfo||'-'], [], ["Budget Est.",{t:'n',v:budgetEstTotal,z:cf}], ["Budget Act.",{t:'n',v:budgetActTotal,z:cf}], ["Diff.",{t:'n',v:budgetActTotal-budgetEstTotal,z:cf}], [], ["# Partecipanti", (trip.participants||[]).length], ["# Promemoria", (trip.reminders||[]).length], ["# Trasporti", (trip.transportations||[]).length], ["# Alloggi", (trip.accommodations||[]).length], ["# Itin.", (trip.itinerary||[]).length], ["# Budget", (trip.budget?.items||[]).length], ["# Packing", (trip.packingList||[]).length]];
             const wsSum = XLSX.utils.aoa_to_sheet(summary);
             wsSum['!cols']=[{wch:15},{wch:50}];
             XLSX.utils.book_append_sheet(wb, wsSum, "Riepilogo");

            // Partecipanti
            const partH = ["Nome", "Note", "Extra Info"]; const partD = (trip.participants||[]).slice().sort((a,b)=>(a?.name||'').localeCompare(b?.name||'')).map(p=>[p.name, p.notes, p.extraInfo]); const wsPart = XLSX.utils.aoa_to_sheet([partH, ...partD]); wsPart['!cols']=[{wch:30},{wch:40},{wch:40}]; XLSX.utils.book_append_sheet(wb, wsPart, "Partecipanti");
            // Promemoria
            const remH = ["Stato", "Descrizione", "Scadenza"]; const remD = (trip.reminders||[]).slice().sort((a,b)=>(a?.dueDate || Timestamp.fromDate(new Date(9999,11,31))).toMillis() - (b?.dueDate || Timestamp.fromDate(new Date(9999,11,31))).toMillis()).map(r => [r.status === 'done' ? 'Fatto' : 'Da Fare', r.description, createDateCell(r.dueDate)]); const wsRem = XLSX.utils.aoa_to_sheet([remH, ...remD]); wsRem['!cols'] = [{wch:10}, {wch:50}, {wch:12}]; XLSX.utils.book_append_sheet(wb, wsRem, "Promemoria");
            // Trasporti
            const th = ["Tipo","Desc.","Da Luogo","Da Data/Ora","A Luogo","A Data/Ora","Rif.","Costo","Note","Link/File"]; const td = (trip.transportations||[]).slice().sort((a,b)=>(a?.departureDateTime||Timestamp.fromDate(new Date(0))).toMillis() - (b?.departureDateTime||Timestamp.fromDate(new Date(0))).toMillis()).map(i=>[i.type, i.description, i.departureLoc, createDateTimeCell(i.departureDateTime), i.arrivalLoc, createDateTimeCell(i.arrivalDateTime), i.bookingRef, i.cost===null?null:{t:'n',v:i.cost,z:cf}, i.notes, i.link]); const wsT = XLSX.utils.aoa_to_sheet([th, ...td]); wsT['!cols']=[{wch:12},{wch:25},{wch:18},{wch:16},{wch:18},{wch:16},{wch:15},{wch:12},{wch:25},{wch:30}]; XLSX.utils.book_append_sheet(wb, wsT, "Trasporti");
            // Alloggi
            const ah = ["Nome","Tipo","Indirizzo","CheckIn","CheckOut","Rif.","Costo","Note","Link/File"]; const ad = (trip.accommodations||[]).slice().sort((a,b)=>(a?.checkinDateTime||Timestamp.fromDate(new Date(0))).toMillis() - (b?.checkinDateTime||Timestamp.fromDate(new Date(0))).toMillis()).map(i=>[i.name,i.type,i.address,createDateTimeCell(i.checkinDateTime),createDateTimeCell(i.checkoutDateTime),i.bookingRef,i.cost===null?null:{t:'n',v:i.cost,z:cf},i.notes, i.link]); const wsA = XLSX.utils.aoa_to_sheet([ah,...ad]); wsA['!cols']=[{wch:25},{wch:10},{wch:35},{wch:16},{wch:16},{wch:20},{wch:12},{wch:30},{wch:30}]; XLSX.utils.book_append_sheet(wb, wsA, "Alloggi");
            // Itinerario
            const ih = ["Giorno","Ora","Attività","Luogo","Rif. Pren.","Costo","Note","Link/File"]; const idata = (trip.itinerary||[]).slice().sort((a,b)=>{const dayA = a?.day instanceof Timestamp ? a.day.toMillis() : 0; const dayB = b?.day instanceof Timestamp ? b.day.toMillis() : 0; const d=dayA-dayB; return d!==0?d:(a?.time||'').localeCompare(b?.time||'');}).map(i=>[createDateCell(i.day),i.time,i.activity,i.location,i.bookingRef,i.cost===null?null:{t:'n',v:i.cost,z:cf},i.notes, i.link]); const wsI = XLSX.utils.aoa_to_sheet([ih, ...idata]); wsI['!cols']=[{wch:10},{wch:8},{wch:30},{wch:25},{wch:20},{wch:12},{wch:30},{wch:30}]; XLSX.utils.book_append_sheet(wb, wsI, "Itinerario");
            // Budget
            const bh = ["Cat.","Desc.","Est. (€)","Act. (€)", "Pagato Da", "Diviso Tra"]; const bd = (trip.budget?.items||[]).slice().sort((a,b)=>(a?.category||'').localeCompare(b?.category||'')).map(i=>[i.category,i.description,{t:'n',v:safeToNumberOrNull(i.estimated)??0,z:cf},i.actual===null?null:{t:'n',v:safeToNumberOrNull(i.actual)??0,z:cf}, i.paidBy, i.splitBetween]); bd.push([],["TOTALI","", {t:'n',v:budgetEstTotal,z:cf}, {t:'n',v:budgetActTotal,z:cf}, "", ""]); const wsB = XLSX.utils.aoa_to_sheet([bh, ...bd]); wsB['!cols']=[{wch:15},{wch:35},{wch:15},{wch:15},{wch:20},{wch:20}]; XLSX.utils.book_append_sheet(wb, wsB, "Budget");
            // Packing List
            const ph = ["Categoria", "Oggetto", "Qtà", "Fatto?"]; const pd = (trip.packingList||[]).slice().sort((a,b)=>(a?.category||'zzz').localeCompare(b?.category||'zzz') || (a?.name||'').localeCompare(b?.name||'')).map(i=>[i.category, i.name, {t:'n', v:safeToPositiveIntegerOrDefault(i.quantity), z:nf}, i.packed?'Sì':'No']); const wsP = XLSX.utils.aoa_to_sheet([ph, ...pd]); wsP['!cols']=[{wch:20}, {wch:40},{wch:5},{wch:8}]; XLSX.utils.book_append_sheet(wb, wsP, "Packing List");

            console.log("DEBUG: Workbook Excel creato (da cache) con tutti i fogli.");
             if (!wb || !wb.SheetNames || wb.SheetNames.length === 0) throw new Error("Workbook vuoto o non creato correttamente.");
        } catch (buildError) {
             console.error("Errore durante la costruzione del Workbook Excel:", buildError);
             showToast("Errore nella preparazione del file Excel.", "error");
             return;
        }

        try {
            const fn = `Viaggio-${(trip.name||'SN').replace(/[^a-z0-9]/gi,'_')}.xlsx`;
            console.log("DEBUG: Tento scrittura file Excel:", fn);
            XLSX.writeFile(wb, fn);
            console.log("DEBUG: Download Excel completato (o iniziato).");
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
// == FUNZIONI CONDIVISIONE VIA FIREBASE (Modificato per usare Cache) ==
// ==========================================================================

// Condivisione via Link Firebase / Web Share API
const handleShareViaLink = async () => {
    if (!db) { showToast("Funzionalità di condivisione non disponibile (Errore Init Firebase).", "error"); return; }
     if (!currentUserId || !currentTripId || !currentTripDataCache) { showToast("Seleziona un viaggio e attendi il caricamento.", "warning"); return; }
     const originalTrip = currentTripDataCache; // Usa la cache!
     if (!originalTrip) { showToast("Errore: dati viaggio non disponibili.", "error"); return; } // Dovrebbe essere impossibile se cache c'è
     if (originalTrip.isTemplate) { showToast("Non puoi condividere un template.", "warning"); return; }

    const shareButton = shareTripBtn;
    if (shareButton) { shareButton.disabled = true; shareButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Preparando...'; }

    let dataToSend = null;
    let shareLink = null;

    try {
        // Usa i dati dalla cache (che dovrebbero già essere pronti/convertiti dai listener)
        // Ricloniamo per sicurezza e per aggiungere sharedAt
        dataToSend = JSON.parse(JSON.stringify(originalTrip));
        dataToSend.sharedAt = Timestamp.now(); // Aggiungi timestamp condivisione
        // Rimuovi campi non necessari per la condivisione? (es. ownerUid, createdAt, updatedAt del viaggio originale?)
        // Per ora li lasciamo, verranno ignorati all'importazione se necessario

        console.log("Invio a Firestore (da cache):", JSON.stringify(dataToSend, null, 2));
        if (shareButton) shareButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando...';

        // *** LA CHIAMATA A FIRESTORE ***
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
            prompt("Web Share non supportato. Copia questo link:", shareLink);
            showToast("Link di condivisione generato!", "success");
        }

    } catch (error) {
         if (error.name === 'AbortError') { console.log('Condivisione annullata dall\'utente.'); showToast("Condivisione annullata.", "info"); }
         else { /* ... (gestione errori invariata) ... */ console.error('Errore durante la condivisione:', error); console.error("Dati inviati (potrebbero essere parziali o problematici):", dataToSend); showToast("Errore durante la condivisione. Controlla console.", "error"); if (shareLink && !navigator.share) { prompt("Errore nell'aprire la condivisione. Copia manualmente il link:", shareLink); } else if (shareLink && navigator.share) { showConfirmationModal("Errore Condivisione", "Impossibile aprire il pannello di condivisione, ma il link è stato generato. Vuoi copiarlo manualmente?", ()=>{ if(navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(shareLink).then(() => showToast("Link copiato!", "success")).catch(()=> prompt("Copia manualmente:", shareLink)); } else { prompt("Copia manualmente:", shareLink); } }) } }
    } finally {
        if (shareButton) { shareButton.disabled = false; shareButton.innerHTML = '<i class="fas fa-share-alt"></i> Condividi'; }
    }
};

// Clona dati e rigenera ID per importazione (Funzione HELPER)
const cloneAndPrepareForImport = (sharedTripData) => {
    // La conversione timestamp dovrebbe essere gestita altrove (es. in handleImport)
    // Qui cloniamo e assegniamo nuovo owner e ID
    const newTripBase = JSON.parse(JSON.stringify(sharedTripData)); // Clonazione profonda

    const newTrip = {
        name: newTripBase.name || 'Viaggio Importato',
        ownerUid: currentUserId, // Assegna all'utente CORRENTE!
        originCity: newTripBase.originCity || '',
        destination: newTripBase.destination || '',
        startDate: toTimestampOrNull(newTripBase.startDate), // Assicura sia Timestamp o null
        endDate: toTimestampOrNull(newTripBase.endDate),
        notes: newTripBase.notes || '',
        isTemplate: false, // Mai template quando importato
        extraInfo: newTripBase.extraInfo || '',
        createdAt: serverTimestamp(), // Nuovo timestamp creazione
        updatedAt: serverTimestamp(),
        // Sottocollezioni verranno copiate separatamente
    };

     // Prepara dati sottocollezioni (senza ID, verranno generati)
     const subCollectionsData = {};
     const subCollectionNames = ['participants', 'reminders', 'transportations', 'accommodations', 'itinerary', 'budgetItems', 'packingList'];
     subCollectionNames.forEach(name => {
         let sourceArray = [];
         if (name === 'budgetItems' && newTripBase.budget && Array.isArray(newTripBase.budget.items)) {
             sourceArray = newTripBase.budget.items;
         } else if (Array.isArray(newTripBase[name])) {
             sourceArray = newTripBase[name];
         }
         // Pulisci e prepara i dati per la nuova sottocollezione
         subCollectionsData[name] = sourceArray.map(item => {
             const newItem = { ...item };
             delete newItem.id; // Rimuovi vecchio ID se presente
             // Assicura che le date siano Timestamp o null
             if (newItem.dueDate) newItem.dueDate = toTimestampOrNull(newItem.dueDate);
             if (newItem.departureDateTime) newItem.departureDateTime = toTimestampOrNull(newItem.departureDateTime);
             if (newItem.arrivalDateTime) newItem.arrivalDateTime = toTimestampOrNull(newItem.arrivalDateTime);
             if (newItem.checkinDateTime) newItem.checkinDateTime = toTimestampOrNull(newItem.checkinDateTime);
             if (newItem.checkoutDateTime) newItem.checkoutDateTime = toTimestampOrNull(newItem.checkoutDateTime);
             if (newItem.day) newItem.day = toTimestampOrNull(newItem.day);
             // Assicura numeri siano numeri o null
             if (newItem.cost !== undefined) newItem.cost = safeToNumberOrNull(newItem.cost);
             if (newItem.estimated !== undefined) newItem.estimated = safeToNumberOrNull(newItem.estimated);
             if (newItem.actual !== undefined) newItem.actual = safeToNumberOrNull(newItem.actual);
             if (newItem.quantity !== undefined) newItem.quantity = safeToPositiveIntegerOrDefault(newItem.quantity);
             // Imposta campi di default se mancanti
             if(name === 'reminders' && !newItem.status) newItem.status = 'todo';
             if(name === 'packingList' && newItem.packed === undefined) newItem.packed = false;
              if(name === 'packingList' && !newItem.category) newItem.category = 'Altro';

              newItem.createdAt = serverTimestamp(); // Aggiungi timestamp creazione per item
              newItem.updatedAt = serverTimestamp();
             return newItem;
         });
     });

    return { newTripData: newTrip, subCollectionsData: subCollectionsData };
}

// Gestisce importazione da link (chiamata da checkForSharedTrip dopo conferma)
const handleImportSharedTrip = async (sharedTripData) => {
    if (!sharedTripData || !currentUserId) return;
    console.log("Avvio importazione viaggio condiviso...");

    try {
        const { newTripData, subCollectionsData } = cloneAndPrepareForImport(sharedTripData);

        // 1. Crea il nuovo documento viaggio principale
        const newTripDocRef = await addDoc(collection(db, "trips"), newTripData);
        const newTripId = newTripDocRef.id;
        console.log(`Documento viaggio principale importato con ID: ${newTripId}`);

        // 2. Aggiungi documenti alle sottocollezioni in batch
        const subCollectionNames = Object.keys(subCollectionsData);
        const importPromises = subCollectionNames.map(async (subName) => {
            const itemsToImport = subCollectionsData[subName];
            if (itemsToImport.length > 0) {
                 const targetColRef = collection(db, 'trips', newTripId, subName);
                 const batch = writeBatch(db);
                 itemsToImport.forEach(itemData => {
                     batch.set(doc(targetColRef), itemData); // Lascia che Firestore generi ID per i sotto-documenti
                 });
                 await batch.commit();
                 console.log(`Importati ${itemsToImport.length} documenti in ${subName} per ${newTripId}`);
            }
        });

        await Promise.all(importPromises);
        console.log("Importazione viaggio condiviso completata.");

        // Non serve salvare o selezionare, onSnapshot aggiornerà la lista
        showToast(`Viaggio "${newTripData.name || 'Senza Nome'}" importato con successo!`, "success");

    } catch (error) {
        console.error("Errore durante l'importazione del viaggio condiviso:", error);
        showToast("Errore durante l'importazione del viaggio.", "error");
    }
};

// Controlla URL per viaggi condivisi all'avvio
const checkForSharedTrip = async () => { /* ... (logica invariata, ma chiama handleImportSharedTrip aggiornato) ... */  if (!db) { console.warn("Firestore non inizializzato, impossibile controllare viaggi condivisi."); return; } const urlParams = new URLSearchParams(window.location.search); const shareId = urlParams.get('shareId'); if (shareId) { console.log("Trovato shareId:", shareId); const currentUrl = new URL(window.location.href); currentUrl.searchParams.delete('shareId'); history.replaceState(null, '', currentUrl.toString()); showToast("Recupero viaggio condiviso...", "info"); try { const docRef = doc(db, "sharedTrips", shareId); const docSnap = await getDoc(docRef); if (docSnap.exists()) { const sharedTripData = docSnap.data(); console.log("Dati viaggio recuperati:", sharedTripData); showConfirmationModal( 'Importa Viaggio Condiviso', `È stato condiviso con te il viaggio "${sharedTripData.name || 'Senza Nome'}". Vuoi importarlo?`, () => handleImportSharedTrip(sharedTripData) // CHIAMA LA NUOVA FUNZIONE ); } else { console.warn("Nessun viaggio trovato con questo shareId:", shareId); showToast("Viaggio condiviso non trovato o scaduto.", "error"); } } catch (error) { console.error("Errore nel recuperare il viaggio condiviso:", error); showToast("Errore nel recuperare il viaggio condiviso.", "error"); } } };

// ==========================================================================
// == FUNZIONI CALCOLO BILANCIO SPESE (Modificato per usare Cache) ==
// ==========================================================================
const calculateExpenseBalance = () => { // ***** MODIFICATO: Usa currentTripDataCache *****
    if (!currentUserId || !currentTripId || !currentTripDataCache) return { error: "Nessun viaggio selezionato o caricato." };
    const trip = currentTripDataCache; // Usa cache
    if (!trip) return { error: "Dati viaggio non disponibili." }; // Should not happen if cache exists
    if (!Array.isArray(trip.participants) || trip.participants.length === 0) return { error: "Aggiungi almeno un partecipante." };

    const budgetItems = trip.budget?.items || [];
    if (budgetItems.length === 0) return { balances: {}, totalSharedExpense: 0, errors: [] }; // No spese

    const participantNames = trip.participants.map(p => p.name?.trim()).filter(Boolean); // Filtra nomi vuoti/null
    if (participantNames.length === 0) return { error: "Nomi partecipanti non validi." };
    const balances = {};
    participantNames.forEach(name => balances[name] = 0);

    let totalSharedExpense = 0;
    const calculationErrors = [];

     budgetItems.forEach((item, index) => {
         const actualCost = safeToNumberOrNull(item.actual);
         const paidByRaw = item.paidBy?.trim();
         const splitBetweenRaw = item.splitBetween?.trim();

         if (actualCost === null || actualCost <= 0 || !paidByRaw || !splitBetweenRaw) return; // Salta se info mancano

         if (!participantNames.includes(paidByRaw)) {
             calculationErrors.push(`Riga ${index+1} ("${item.description||'?'}"): Pagante "${paidByRaw}" non è un partecipante valido.`);
             return;
         }

         let sharers = [];
         if (splitBetweenRaw.toLowerCase() === 'tutti') {
             sharers = [...participantNames];
         } else {
             const potentialSharers = splitBetweenRaw.split(',').map(name => name.trim()).filter(Boolean);
             const invalidSharers = potentialSharers.filter(name => !participantNames.includes(name));
             if (invalidSharers.length > 0) {
                 calculationErrors.push(`Riga ${index+1} ("${item.description||'?'}"): Diviso tra non validi: ${invalidSharers.join(', ')}.`);
             }
             sharers = potentialSharers.filter(name => participantNames.includes(name)); // Usa solo i validi
         }

         if (sharers.length === 0) {
              if (!calculationErrors.some(err => err.includes(`Riga ${index+1}`))) { // Evita duplicati se già segnalato invalidSharers
                   calculationErrors.push(`Riga ${index+1} ("${item.description||'?'}"): Nessun partecipante valido per divisione.`);
              }
              return;
         }

         const costPerSharer = actualCost / sharers.length;
         totalSharedExpense += actualCost;

         balances[paidByRaw] += actualCost;
         sharers.forEach(sharerName => { balances[sharerName] -= costPerSharer; });
     });

    for (const name in balances) { balances[name] = Math.round(balances[name] * 100) / 100; }
    return { balances, totalSharedExpense, errors: calculationErrors };
};
// Render Bilancio (invariato, usa risultato di calculateExpenseBalance)
const renderBalanceResults = (result) => { /* ... (invariato) ... */ if (!balanceResultsContainer || !balanceResultsUl || !balanceSummaryDiv || !balanceErrorMessageP) return; balanceResultsUl.innerHTML = ''; balanceSummaryDiv.innerHTML = ''; balanceErrorMessageP.textContent = ''; balanceErrorMessageP.style.display = 'none'; balanceResultsContainer.style.display = 'block'; if (result.error) { balanceErrorMessageP.textContent = `Errore: ${result.error}`; balanceErrorMessageP.style.display = 'block'; balanceResultsContainer.style.display = 'none'; return; } const { balances, totalSharedExpense, errors } = result; let hasBalancesToShow = false; Object.entries(balances).forEach(([name, balance]) => { if(Math.abs(balance) > 0.005) { hasBalancesToShow = true; const li = document.createElement('li'); const nameSpan = document.createElement('span'); const balanceSpan = document.createElement('span'); nameSpan.textContent = name; balanceSpan.textContent = formatCurrency(Math.abs(balance)); if (balance > 0) { li.classList.add('positive-balance'); nameSpan.textContent += " (Deve Ricevere)"; } else { li.classList.add('negative-balance'); nameSpan.textContent += " (Deve Dare)"; } li.appendChild(nameSpan); li.appendChild(balanceSpan); balanceResultsUl.appendChild(li); } }); if (!hasBalancesToShow && errors.length === 0) { const li = document.createElement('li'); li.textContent = "Tutti i saldi sono a zero o non ci sono spese divise da calcolare."; balanceResultsUl.appendChild(li); } else if (!hasBalancesToShow && errors.length > 0) { const li = document.createElement('li'); li.textContent = "Nessun saldo da regolare (ma ci sono stati errori nel calcolo)."; balanceResultsUl.appendChild(li); } balanceSummaryDiv.textContent = `Spesa Totale Divisa: ${formatCurrency(totalSharedExpense)}`; if (errors.length > 0) { balanceErrorMessageP.innerHTML = `<strong>Attenzione, si sono verificati errori durante il calcolo:</strong><br>` + errors.join('<br>'); balanceErrorMessageP.style.display = 'block'; } };


// ==========================================================================
// == LOGICA AUTENTICAZIONE (Nuova) ==
// ==========================================================================

// Funzione per pulire UI quando utente fa logout o non è loggato
function clearAppDataUI() {
    console.log("Pulizia UI applicazione...");
    currentTripId = null;
    currentTripDataCache = null;
    // Pulisci lista viaggi
    if(tripListUl) tripListUl.innerHTML = '';
    if(noTripsMessage) noTripsMessage.style.display = 'block';
    // Nascondi dettagli e mostra messaggio benvenuto
    deselectTrip(); // Questo fa gran parte del lavoro
    // Scollega listeners Firestore
    if (unsubscribeTripListListener) unsubscribeTripListListener();
    unsubscribeTripListListener = null;
    clearSubcollectionListeners();
    // Pulisci eventuali stati UI residui (es. modali aperti?)
    closeModal(newTripModal);
    closeModal(selectTemplateModal);
    closeModal(confirmationModal);
}

// Listener cambio stato autenticazione (CUORE DELLA NUOVA LOGICA)
onAuthStateChanged(auth, (user) => {
  if (user) {
    // --- Utente Loggato ---
    console.log("Utente loggato:", user.uid, user.email);
    currentUserId = user.uid;

    // Aggiorna UI: Nascondi auth, mostra app
    if(authContainer) authContainer.style.display = 'none';
    if(appContainer) appContainer.style.display = 'block'; // Mostra l'intera app
    if(userStatusDiv) userStatusDiv.style.display = 'flex';
    if(userEmailDisplay) userEmailDisplay.textContent = user.email;

    // Pulisci eventuali errori precedenti dai form auth
    if(loginError) loginError.style.display = 'none';
    if(signupError) signupError.style.display = 'none';
    if(loginForm) loginForm.reset();
    if(signupForm) signupForm.reset();

    // Carica i dati SPECIFICI di questo utente
    loadUserTrips(); // Carica la lista viaggi

    // Controlla se c'è uno shareId nell'URL (viene fatto in init/DOMContentLoaded ora)
    // checkForSharedTrip();

  } else {
    // --- Utente Non Loggato ---
    console.log("Nessun utente loggato.");
    currentUserId = null;

    // Aggiorna UI: Mostra auth, nascondi app
    if(authContainer) authContainer.style.display = 'block';
    if(appContainer) appContainer.style.display = 'none'; // Nascondi l'intera app
    if(userStatusDiv) userStatusDiv.style.display = 'none';

    // Pulisci completamente l'interfaccia dell'app
    clearAppDataUI();
  }
});

// Toggle tra form Login e Signup
if (showSignupLink) showSignupLink.addEventListener('click', (e) => { e.preventDefault(); if(loginForm) loginForm.style.display = 'none'; if(loginError) loginError.style.display = 'none'; if(signupForm) signupForm.style.display = 'block'; if(signupError) signupError.style.display = 'none'; });
if (showLoginLink) showLoginLink.addEventListener('click', (e) => { e.preventDefault(); if(signupForm) signupForm.style.display = 'none'; if(signupError) signupError.style.display = 'none'; if(loginForm) loginForm.style.display = 'block'; if(loginError) loginError.style.display = 'none'; });

// Gestore Login
if (loginForm) loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = loginEmailInput.value;
    const password = loginPasswordInput.value;
    if(loginError) loginError.style.display = 'none';
    const loginButton = loginForm.querySelector('button[type="submit"]');
    if(loginButton) { loginButton.disabled = true; loginButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Accesso...'; }

    try {
        await signInWithEmailAndPassword(auth, email, password);
        // onAuthStateChanged si occuperà del resto
    } catch (error) {
        console.error('Login error:', error);
        if(loginError) { loginError.textContent = getFirebaseErrorMessage(error); loginError.style.display = 'block'; }
        if(loginButton) { loginButton.disabled = false; loginButton.innerHTML = '<i class="fas fa-sign-in-alt"></i> Login'; }
    }
});

// Gestore Signup
if (signupForm) signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = signupEmailInput.value;
    const password = signupPasswordInput.value;
    const confirmPassword = signupPasswordConfirmInput.value;
    if(signupError) signupError.style.display = 'none';

    if (password.length < 6) { if(signupError) {signupError.textContent = 'La password deve essere di almeno 6 caratteri.'; signupError.style.display = 'block';} return; }
    if (password !== confirmPassword) { if(signupError) { signupError.textContent = 'Le password non coincidono.'; signupError.style.display = 'block';} return; }

    const signupButton = signupForm.querySelector('button[type="submit"]');
     if(signupButton) { signupButton.disabled = true; signupButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Registro...'; }

    try {
        await createUserWithEmailAndPassword(auth, email, password);
        // onAuthStateChanged si occuperà del resto
    } catch (error) {
        console.error('Signup error:', error);
        if(signupError) { signupError.textContent = getFirebaseErrorMessage(error); signupError.style.display = 'block'; }
         if(signupButton) { signupButton.disabled = false; signupButton.innerHTML = '<i class="fas fa-user-plus"></i> Registrati'; }
    }
});

// Gestore Logout
if (logoutBtn) logoutBtn.addEventListener('click', async () => {
    try {
        await signOut(auth);
        console.log('Logout successful');
        // onAuthStateChanged si occuperà di aggiornare la UI e pulire i dati
    } catch (error) {
        console.error('Logout error:', error);
        showToast('Errore durante il logout. Riprova.', 'error');
    }
});

// Funzione helper per tradurre errori Firebase
function getFirebaseErrorMessage(error) { /* ... (invariato) ... */ switch (error.code) { case 'auth/invalid-email': return 'Formato email non valido.'; case 'auth/user-disabled': return 'Questo account è stato disabilitato.'; case 'auth/user-not-found': return 'Nessun utente trovato con questa email.'; case 'auth/wrong-password': return 'Password errata.'; case 'auth/email-already-in-use': return 'Questa email è già registrata.'; case 'auth/weak-password': return 'La password è troppo debole (min. 6 caratteri).'; case 'auth/operation-not-allowed': return 'Operazione non permessa. Contatta supporto.'; case 'auth/too-many-requests': return 'Troppi tentativi falliti. Riprova più tardi.'; default: console.error("Errore Auth non gestito:", error); return 'Errore di autenticazione sconosciuto. Riprova.'; } }


// ==========================================================================
// == INIZIALIZZAZIONE DOMContentLoaded (Modificato) ==
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM completamente caricato e parsato.");

    // Ottieni riferimenti a TUTTI gli elementi DOM qui
    console.log("Ottenimento riferimenti DOM...");
    tripListUl = document.getElementById('trip-list');
    newTripBtn = document.getElementById('new-trip-btn');
    createFromTemplateBtn = document.getElementById('create-from-template-btn');
    searchTripInput = document.getElementById('search-trip-input');
    noTripsMessage = document.getElementById('no-trips-message');
    welcomeMessageDiv = document.getElementById('welcome-message');
    tripDetailsAreaDiv = document.getElementById('trip-details-area');
    tripTitleH2 = document.getElementById('trip-title');
    downloadTextBtn = document.getElementById('download-text-btn');
    downloadExcelBtn = document.getElementById('download-excel-btn');
    deleteTripBtn = document.getElementById('delete-trip-btn');
    shareTripBtn = document.getElementById('share-trip-btn');
    emailSummaryBtn = document.getElementById('email-summary-btn');
    copySummaryBtn = document.getElementById('copy-summary-btn');
    tabsContainer = document.querySelector('.tabs');
    tripInfoForm = document.getElementById('trip-info-form');
    editTripIdInput = document.getElementById('edit-trip-id');
    tripNameInput = document.getElementById('trip-name');
    tripOriginCityInput = document.getElementById('trip-origin-city');
    tripDestinationInput = document.getElementById('trip-destination');
    tripStartDateInput = document.getElementById('trip-start-date');
    tripEndDateInput = document.getElementById('trip-end-date');
    tripIsTemplateCheckbox = document.getElementById('trip-is-template');
    tripNotesTextarea = document.getElementById('trip-notes');
    tripExtraInfoTextarea = document.getElementById('trip-extra-info');
    addParticipantForm = document.getElementById('add-participant-form');
    editParticipantIdInput = document.getElementById('edit-participant-id');
    participantNameInput = document.getElementById('participant-name');
    participantNotesInput = document.getElementById('participant-notes');
    participantExtraInfoTextarea = document.getElementById('participant-extra-info');
    participantListUl = document.getElementById('participant-list');
    noParticipantsItemsP = document.getElementById('no-participants-items');
    participantSubmitBtn = document.getElementById('participant-submit-btn');
    participantCancelEditBtn = document.getElementById('participant-cancel-edit-btn');
    participantDatalist = document.getElementById('participant-datalist');
    addReminderItemForm = document.getElementById('add-reminder-item-form');
    editReminderItemIdInput = document.getElementById('edit-reminder-item-id');
    reminderDescriptionInput = document.getElementById('reminder-description');
    reminderDueDateInput = document.getElementById('reminder-due-date');
    reminderStatusSelect = document.getElementById('reminder-status');
    reminderListUl = document.getElementById('reminder-list');
    noReminderItemsP = document.getElementById('no-reminder-items');
    reminderSubmitBtn = document.getElementById('reminder-submit-btn');
    reminderCancelEditBtn = document.getElementById('reminder-cancel-edit-btn');
    reminderSortControl = document.getElementById('reminder-sort-control');
    addTransportItemForm = document.getElementById('add-transport-item-form');
    editTransportItemIdInput = document.getElementById('edit-transport-item-id');
    transportTypeSelect = document.getElementById('transport-type');
    transportDescriptionInput = document.getElementById('transport-description');
    transportDepartureLocInput = document.getElementById('transport-departure-loc');
    transportDepartureDatetimeInput = document.getElementById('transport-departure-datetime');
    transportArrivalLocInput = document.getElementById('transport-arrival-loc');
    transportArrivalDatetimeInput = document.getElementById('transport-arrival-datetime');
    transportBookingRefInput = document.getElementById('transport-booking-ref');
    transportCostInput = document.getElementById('transport-cost');
    transportNotesInput = document.getElementById('transport-notes');
    transportLinkInput = document.getElementById('transport-link');
    transportListUl = document.getElementById('transport-list');
    noTransportItemsP = document.getElementById('no-transport-items');
    transportSubmitBtn = document.getElementById('transport-submit-btn');
    transportCancelEditBtn = document.getElementById('transport-cancel-edit-btn');
    searchSkyscannerBtn = document.getElementById('search-skyscanner-btn');
    searchTrainlineBtn = document.getElementById('search-trainline-btn');
    addTransportTotalToBudgetBtn = document.getElementById('add-transport-total-to-budget-btn');
    transportSortControl = document.getElementById('transport-sort-control');
    addAccommodationItemForm = document.getElementById('add-accommodation-item-form');
    editAccommodationItemIdInput = document.getElementById('edit-accommodation-item-id');
    accommodationNameInput = document.getElementById('accommodation-name');
    accommodationTypeSelect = document.getElementById('accommodation-type');
    accommodationAddressInput = document.getElementById('accommodation-address');
    accommodationCheckinInput = document.getElementById('accommodation-checkin');
    accommodationCheckoutInput = document.getElementById('accommodation-checkout');
    accommodationBookingRefInput = document.getElementById('accommodation-booking-ref');
    accommodationCostInput = document.getElementById('accommodation-cost');
    accommodationNotesInput = document.getElementById('accommodation-notes');
    accommodationLinkInput = document.getElementById('accommodation-link');
    accommodationListUl = document.getElementById('accommodation-list');
    noAccommodationItemsP = document.getElementById('no-accommodation-items');
    accommodationSubmitBtn = document.getElementById('accommodation-submit-btn');
    accommodationCancelEditBtn = document.getElementById('accommodation-cancel-edit-btn');
    addItineraryItemForm = document.getElementById('add-itinerary-item-form');
    editItineraryItemIdInput = document.getElementById('edit-itinerary-item-id');
    itineraryDayInput = document.getElementById('itinerary-day');
    itineraryTimeInput = document.getElementById('itinerary-time');
    itineraryActivityInput = document.getElementById('itinerary-activity');
    itineraryLocationInput = document.getElementById('itinerary-location');
    itineraryBookingRefInput = document.getElementById('itinerary-booking-ref');
    itineraryCostInput = document.getElementById('itinerary-cost');
    itineraryNotesInput = document.getElementById('itinerary-notes');
    itineraryLinkInput = document.getElementById('itinerary-link');
    itineraryListUl = document.getElementById('itinerary-list');
    noItineraryItemsP = document.getElementById('no-itinerary-items');
    itinerarySubmitBtn = document.getElementById('itinerary-submit-btn');
    itineraryCancelEditBtn = document.getElementById('itinerary-cancel-edit-btn');
    searchItineraryInput = document.getElementById('search-itinerary-input');
    itinerarySortControl = document.getElementById('itinerary-sort-control');
    addBudgetItemForm = document.getElementById('add-budget-item-form');
    editBudgetItemIdInput = document.getElementById('edit-budget-item-id');
    budgetCategorySelect = document.getElementById('budget-category');
    budgetDescriptionInput = document.getElementById('budget-description');
    budgetEstimatedInput = document.getElementById('budget-estimated');
    budgetActualInput = document.getElementById('budget-actual');
    budgetPaidByInput = document.getElementById('budget-paid-by');
    budgetSplitBetweenInput = document.getElementById('budget-split-between');
    budgetListUl = document.getElementById('budget-list');
    budgetTotalEstimatedStrong = document.getElementById('budget-total-estimated');
    budgetTotalActualStrong = document.getElementById('budget-total-actual');
    budgetDifferenceStrong = document.getElementById('budget-difference');
    noBudgetItemsP = document.getElementById('no-budget-items');
    budgetSubmitBtn = document.getElementById('budget-submit-btn');
    budgetCancelEditBtn = document.getElementById('budget-cancel-edit-btn');
    budgetSortControl = document.getElementById('budget-sort-control');
    predefinedChecklistsContainer = document.querySelector('.predefined-checklists');
    addPackingItemForm = document.getElementById('add-packing-item-form');
    editPackingItemIdInput = document.getElementById('edit-packing-item-id');
    packingItemNameInput = document.getElementById('packing-item-name');
    packingItemCategoryInput = document.getElementById('packing-item-category');
    packingItemQuantityInput = document.getElementById('packing-item-quantity');
    packingListUl = document.getElementById('packing-list');
    noPackingItemsP = document.getElementById('no-packing-items');
    packingSubmitBtn = document.getElementById('packing-submit-btn');
    packingCancelEditBtn = document.getElementById('packing-cancel-edit-btn');
    searchPackingInput = document.getElementById('search-packing-input');
    packingSortControl = document.getElementById('packing-sort-control');
    packingCategoryDatalist = document.getElementById('packing-category-list');
    calculateBalanceBtn = document.getElementById('calculate-balance-btn');
    balanceResultsContainer = document.getElementById('balance-results-container');
    balanceResultsUl = document.getElementById('balance-results');
    balanceSummaryDiv = document.getElementById('balance-summary');
    balanceErrorMessageP = document.getElementById('balance-error-message');
    newTripModal = document.getElementById('new-trip-modal');
    newTripNameInput = document.getElementById('new-trip-name-input');
    newTripErrorP = document.getElementById('new-trip-modal-error');
    createTripConfirmBtn = document.getElementById('create-trip-confirm-btn');
    selectTemplateModal = document.getElementById('select-template-modal');
    templateSelectInput = document.getElementById('template-select-input');
    selectTemplateErrorP = document.getElementById('select-template-modal-error');
    createFromTemplateConfirmBtn = document.getElementById('create-from-template-confirm-btn');
    confirmationModal = document.getElementById('confirmation-modal');
    confirmationModalTitle = document.getElementById('confirmation-modal-title');
    confirmationModalMessage = document.getElementById('confirmation-modal-message');
    confirmationModalConfirmBtn = document.getElementById('confirmation-modal-confirm-btn'); // Listener aggiunto in showConfirmationModal
    toastContainer = document.getElementById('toast-container');
    console.log("Riferimenti DOM ottenuti.");


    // Controlla se Firebase è stato inizializzato correttamente
    if (!app || !db || !auth) {
        console.error("Firebase non inizializzato correttamente, blocco inizializzazione UI.");
        return; // Non aggiungere listeners se Firebase non va
    }

    // ***** INIZIALIZZAZIONE UI E LISTENER PRINCIPALI *****
    // Questi listener devono essere aggiunti DOPO che il DOM è pronto,
    // ma la logica che attivano dipende dallo stato di login (gestito da onAuthStateChanged)
    console.log("Aggiunta event listeners...");

    // Listener Sidebar
    if (newTripBtn) newTripBtn.addEventListener('click', handleNewTrip);
    if (createFromTemplateBtn) createFromTemplateBtn.addEventListener('click', openSelectTemplateModal);
    // searchTripInput listener rimosso o modificato
    // if (searchTripInput) searchTripInput.addEventListener('input', handleSearchTrip);

    // Listener Dettagli Viaggio Generali
    if (tripInfoForm) tripInfoForm.addEventListener('submit', handleSaveTripInfo);
    // deleteTripBtn listener è ora aggiunto dinamicamente in createTripListItem
    if (tabsContainer) tabsContainer.addEventListener('click', (e) => { const tl = e.target.closest('.tab-link'); if (tl?.dataset.tab) switchTab(tl.dataset.tab); });
    if (downloadTextBtn) downloadTextBtn.addEventListener('click', handleDownloadText);
    if (downloadExcelBtn) downloadExcelBtn.addEventListener('click', handleDownloadExcel);
    if (emailSummaryBtn) emailSummaryBtn.addEventListener('click', handleEmailSummary);
    if (copySummaryBtn) copySummaryBtn.addEventListener('click', handleCopySummary);
    if (shareTripBtn) shareTripBtn.addEventListener('click', handleShareViaLink);

    // Listener Submit Forms per Aggiungere/Modificare Items
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

    // Listener Delegati per Azioni Liste (Modifica/Elimina/Pack)
    if (tripDetailsAreaDiv) tripDetailsAreaDiv.addEventListener('click', (e) => {
        const editBtn = e.target.closest('.btn-icon.edit');
        const deleteBtn = e.target.closest('.btn-icon.delete');
        const packingCheckbox = e.target.closest('.packing-checkbox');

        if (editBtn) {
            const itemId = editBtn.dataset.itemId;
            if(!itemId) return;
             let listType = null;
             if (editBtn.classList.contains('participant-edit-btn')) listType = 'participant';
             else if (editBtn.classList.contains('reminder-edit-btn')) listType = 'reminder';
             else if (editBtn.classList.contains('transport-edit-btn')) listType = 'transport';
             else if (editBtn.classList.contains('accommodation-edit-btn')) listType = 'accommodation';
             else if (editBtn.classList.contains('itinerary-edit-btn')) listType = 'itinerary';
             else if (editBtn.classList.contains('budget-edit-btn')) listType = 'budget';
             else if (editBtn.classList.contains('packing-edit-btn')) listType = 'packing';
             if(listType) startEditItem(listType, itemId);
        } else if (deleteBtn) {
            const itemId = deleteBtn.dataset.itemId;
            const itemDesc = deleteBtn.dataset.itemDesc || ''; // Prendi descrizione da data attribute
            if(!itemId) return;
             let listType = null;
             if (deleteBtn.classList.contains('participant-delete-btn')) listType = 'participant';
             else if (deleteBtn.classList.contains('reminder-delete-btn')) listType = 'reminder';
             else if (deleteBtn.classList.contains('transport-delete-btn')) listType = 'transport';
             else if (deleteBtn.classList.contains('accommodation-delete-btn')) listType = 'accommodation';
             else if (deleteBtn.classList.contains('itinerary-delete-btn')) listType = 'itinerary';
             else if (deleteBtn.classList.contains('budget-delete-btn')) listType = 'budget';
             else if (deleteBtn.classList.contains('packing-delete-btn')) listType = 'packing';
             if(listType) handleDeleteItem(listType, itemId, itemDesc); // Passa descrizione
        } else if (packingCheckbox) {
            const itemId = packingCheckbox.dataset.itemId;
            if(itemId) handleTogglePacked(itemId, packingCheckbox.checked);
        }
    });

    // Listener Import Checklist Predefinite
    if (predefinedChecklistsContainer) predefinedChecklistsContainer.addEventListener('click', (e) => { const btn = e.target.closest('button[data-checklist]'); if (btn?.dataset.checklist) handleImportPackingList(btn.dataset.checklist); });

    // Listener Modals
    if (newTripModal) { createTripConfirmBtn?.addEventListener('click', handleCreateTripConfirm); newTripModal.querySelectorAll('.modal-close').forEach(btn => btn.addEventListener('click', closeNewTripModal)); newTripNameInput?.addEventListener('keypress', (e) => { if(e.key === 'Enter') handleCreateTripConfirm(); }); newTripModal.addEventListener('click', (e) => { if (e.target === newTripModal) closeNewTripModal(); }); }
    if (selectTemplateModal) { createFromTemplateConfirmBtn?.addEventListener('click', handleCreateFromTemplateConfirm); selectTemplateModal.querySelectorAll('.modal-close').forEach(btn => btn.addEventListener('click', closeSelectTemplateModal)); selectTemplateModal.addEventListener('click', (e) => { if (e.target === selectTemplateModal) closeSelectTemplateModal(); }); }
    if (confirmationModal) {
        // Il listener per il bottone conferma viene aggiunto dinamicamente in showConfirmationModal
         confirmationModal.querySelectorAll('.modal-close').forEach(btn => btn.addEventListener('click', closeConfirmationModal));
         confirmationModal.addEventListener('click', (e) => { if (e.target === confirmationModal) closeConfirmationModal(); });
    }

    // Listener Calcolo Budget Trasporti
    if (addTransportTotalToBudgetBtn) addTransportTotalToBudgetBtn.addEventListener('click', handleCalculateAndAddTransportCost);

    // Listener Cerca Voli/Treni
    if (searchSkyscannerBtn) searchSkyscannerBtn.addEventListener('click', handleSearchFlights);
    if (searchTrainlineBtn) searchTrainlineBtn.addEventListener('click', handleSearchTrains);
    if (transportTypeSelect) transportTypeSelect.addEventListener('change', toggleSearchButtonsVisibility);

    // Listener Controlli Ordinamento
    if (reminderSortControl) reminderSortControl.addEventListener('change', (e) => handleSortChange('reminder', e.target));
    if (transportSortControl) transportSortControl.addEventListener('change', (e) => handleSortChange('transport', e.target));
    if (itinerarySortControl) itinerarySortControl.addEventListener('change', (e) => handleSortChange('itinerary', e.target));
    if (budgetSortControl) budgetSortControl.addEventListener('change', (e) => handleSortChange('budget', e.target));
    if (packingSortControl) packingSortControl.addEventListener('change', (e) => handleSortChange('packing', e.target));

    // Listener Ricerca Interna
    if (searchItineraryInput) searchItineraryInput.addEventListener('input', (e) => handleInternalSearch('itinerary', e.target));
    if (searchPackingInput) searchPackingInput.addEventListener('input', (e) => handleInternalSearch('packing', e.target));

    // Listener Calcolo Bilancio Spese
    if (calculateBalanceBtn) calculateBalanceBtn.addEventListener('click', () => { const balanceResult = calculateExpenseBalance(); renderBalanceResults(balanceResult); });

    console.log("Event listeners aggiunti.");

    // Controlla URL per viaggi condivisi all'avvio
    checkForSharedTrip();

    console.log("Inizializzazione UI completata. In attesa dello stato di autenticazione...");
    // Lo stato iniziale (mostrare login o app) viene gestito da onAuthStateChanged

}); // Fine DOMContentLoaded

// Default Packing Lists and Categories (Constants, invariate)
const PREDEFINED_PACKING_LISTS = { beach: [ { name: "Costume da bagno", category: "Vestiti", quantity: 2 }, { name: "Asciugamano da spiaggia", category: "Accessori", quantity: 1 }, { name: "Crema solare", category: "Igiene", quantity: 1 }, { name: "Occhiali da sole", category: "Accessori", quantity: 1 }, { name: "Cappello", category: "Accessori", quantity: 1 }, { name: "Libro/Rivista", category: "Intrattenimento", quantity: 1 }, { name: "Borsa da spiaggia", category: "Accessori", quantity: 1 }, { name: "Infradito/Sandali", category: "Vestiti", quantity: 1 }, { name: "Dopasole", category: "Igiene", quantity: 1 } ], city: [ { name: "Scarpe comode", category: "Vestiti", quantity: 1 }, { name: "Mappa/App navigazione", category: "Documenti/Tech", quantity: 1 }, { name: "Macchina fotografica", category: "Documenti/Tech", quantity: 1 }, { name: "Power bank", category: "Documenti/Tech", quantity: 1 }, { name: "Borraccia", category: "Accessori", quantity: 1 }, { name: "Giacca leggera/Impermeabile", category: "Vestiti", quantity: 1 }, { name: "Zainetto", category: "Accessori", quantity: 1 }, { name: "Documenti", category: "Documenti/Tech", quantity: 1 }, { name: "Adattatore presa (se necessario)", category: "Documenti/Tech", quantity: 1 } ], mountain: [ { name: "Scarponcini da trekking", category: "Vestiti", quantity: 1 }, { name: "Zaino", category: "Accessori", quantity: 1 }, { name: "Borraccia/Thermos", category: "Accessori", quantity: 1 }, { name: "Giacca a vento/pioggia", category: "Vestiti", quantity: 1 }, { name: "Pile/Maglione pesante", category: "Vestiti", quantity: 1 }, { name: "Pantaloni lunghi", category: "Vestiti", quantity: 2 }, { name: "Cappello/Berretto", category: "Accessori", quantity: 1 }, { name: "Guanti", category: "Accessori", quantity: 1 }, { name: "Occhiali da sole", category: "Accessori", quantity: 1 }, { name: "Crema solare", category: "Igiene", quantity: 1 }, { name: "Kit primo soccorso", category: "Salute", quantity: 1 }, { name: "Mappa/Bussola/GPS", category: "Documenti/Tech", quantity: 1 } ], camping: [ { name: "Tenda", category: "Attrezzatura", quantity: 1 }, { name: "Sacco a pelo", category: "Attrezzatura", quantity: 1 }, { name: "Materassino", category: "Attrezzatura", quantity: 1 }, { name: "Fornello da campeggio + Gas", category: "Attrezzatura", quantity: 1 }, { name: "Gavetta/Stoviglie", category: "Attrezzatura", quantity: 1 }, { name: "Coltellino multiuso", category: "Attrezzatura", quantity: 1 }, { name: "Torcia frontale/Lanterna + Batterie", category: "Attrezzatura", quantity: 1 }, { name: "Kit igiene personale", category: "Igiene", quantity: 1 }, { name: "Asciugamano microfibra", category: "Igiene", quantity: 1 }, { name: "Repellente insetti", category: "Salute", quantity: 1 }, { name: "Sedia pieghevole (opzionale)", category: "Attrezzatura", quantity: 1 }, { name: "Cibo a lunga conservazione", category: "Cibo", quantity: 1 } ] };
const DEFAULT_PACKING_CATEGORIES = ["Vestiti", "Accessori", "Igiene", "Salute", "Documenti/Tech", "Attrezzatura", "Intrattenimento", "Cibo", "Altro"];
// Gestione import packing list (usa cache ora)
const handleImportPackingList = async (type) => { // Ora async
    if (!currentUserId || !currentTripId || !PREDEFINED_PACKING_LISTS[type]) return;

    const predefined = PREDEFINED_PACKING_LISTS[type];
    // Legge la packing list corrente dalla cache per evitare duplicati
    const currentPackingList = currentTripDataCache?.packingList || [];
    const currentLower = currentPackingList.map(i => (i?.name || '').toLowerCase());
    const itemsToAdd = [];

    predefined.forEach(predefItem => {
        if (!currentLower.includes(predefItem.name.toLowerCase())) {
             itemsToAdd.push({
                // Non serve ID qui, Firestore lo genera
                name: predefItem.name,
                packed: false,
                category: predefItem.category || 'Altro',
                quantity: predefItem.quantity || 1,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });
        }
    });

    if (itemsToAdd.length > 0) {
         console.log(`Aggiungo ${itemsToAdd.length} oggetti packing da template ${type}`);
         try {
             const packingColRef = collection(db, 'trips', currentTripId, 'packingList');
             const batch = writeBatch(db);
             itemsToAdd.forEach(itemData => {
                 batch.set(doc(packingColRef), itemData); // Lascia generare ID
             });
             await batch.commit();
             showToast(`${itemsToAdd.length} oggetti aggiunti alla packing list!`, 'success');
             // UI si aggiorna da onSnapshot
             // populatePackingCategoriesDatalist viene chiamato da onSnapshot
         } catch (error) {
              console.error("Errore import packing list:", error);
              showToast("Errore durante l'importazione della packing list.", "error");
         }
    } else {
        showToast(`Nessun nuovo oggetto da aggiungere dalla lista ${type}.`, 'info');
    }
};
