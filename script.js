// ==========================================================================
// == FIREBASE MODULE IMPORTS & INITIALIZATION ==
// ==========================================================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-app.js";
import {
    getFirestore, collection, addDoc, doc, getDoc, getDocs, setDoc, deleteDoc, Timestamp, query, where, updateDoc, arrayUnion, arrayRemove, onSnapshot, writeBatch, orderBy
} from "https://www.gstatic.com/firebasejs/11.5.0/firebase-firestore.js";
import {
    getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, sendEmailVerification, sendPasswordResetEmail, signInAnonymously,
    linkWithCredential, EmailAuthProvider
} from "https://www.gstatic.com/firebasejs/11.5.0/firebase-auth.js";

// Configurazione Firebase
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
    // == CONFIGURAZIONE E COSTANTI ==
    // ==========================================================================
    const DEFAULT_CURRENCY = 'EUR';
    const DEFAULT_LOCALE = 'it-IT';
    const GOOGLE_MAPS_BASE_URL = 'https://www.google.com/maps/search/?api=1&query=';
    const PREDEFINED_PACKING_LISTS = {
        beach: [ { name: "Costume da bagno", category: "Vestiti", quantity: 2 }, { name: "Asciugamano da spiaggia", category: "Accessori", quantity: 1 }, { name: "Crema solare", category: "Igiene", quantity: 1 }, { name: "Occhiali da sole", category: "Accessori", quantity: 1 }, { name: "Cappello", category: "Accessori", quantity: 1 } ],
        city: [ { name: "Scarpe comode", category: "Vestiti", quantity: 1 }, { name: "Mappa/App navigazione", category: "Documenti/Tech", quantity: 1 }, { name: "Power bank", category: "Documenti/Tech", quantity: 1 }, { name: "Borraccia", category: "Accessori", quantity: 1 }, { name: "Giacca leggera/Impermeabile", category: "Vestiti", quantity: 1 } ],
        mountain: [ { name: "Scarponcini da trekking", category: "Vestiti", quantity: 1 }, { name: "Zaino", category: "Accessori", quantity: 1 }, { name: "Borraccia/Thermos", category: "Accessori", quantity: 1 }, { name: "Giacca a vento/pioggia", category: "Vestiti", quantity: 1 }, { name: "Kit primo soccorso", category: "Salute", quantity: 1 } ],
        camping: [ { name: "Tenda", category: "Attrezzatura", quantity: 1 }, { name: "Sacco a pelo", category: "Attrezzatura", quantity: 1 }, { name: "Torcia frontale/Lanterna", category: "Attrezzatura", quantity: 1 }, { name: "Repellente insetti", category: "Salute", quantity: 1 } ]
    };
    const DEFAULT_PACKING_CATEGORIES = ["Vestiti", "Accessori", "Igiene", "Salute", "Documenti/Tech", "Attrezzatura", "Intrattenimento", "Cibo", "Altro"];

    // ==========================================================================
    // == ELEMENTI DOM ==
    // ==========================================================================
    let domSelectionError = false;
    const checkElement = (id, isQuerySelector = false) => { const element = isQuerySelector ? document.querySelector(id) : document.getElementById(id); if (!element) { console.error(`ERRORE SELEZIONE DOM: Elemento "${id}" non trovato!`); domSelectionError = true; } return element; };

    // Auth
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
    const linkAccountPrompt = checkElement('link-account-prompt');

    // App
    const loadingTripsDiv = checkElement('loading-trips');
    const tripListUl = checkElement('trip-list');
    const newTripBtn = checkElement('new-trip-btn');
    const searchTripInput = checkElement('search-trip-input');
    const noTripsMessage = checkElement('no-trips-message');
    const tripDetailsAreaDiv = checkElement('trip-details-area');
    const tripTitleH2 = checkElement('trip-title');
    const downloadTextBtn = checkElement('download-text-btn');
    const downloadExcelBtn = checkElement('download-excel-btn');
    const deleteTripBtn = checkElement('delete-trip-btn');
    const emailSummaryBtn = checkElement('email-summary-btn');
    const copySummaryBtn = checkElement('copy-summary-btn');
    const tabsContainer = checkElement('.tabs', true);

    // Dashboard
    const dashboardArea = checkElement('dashboard-area');
    const dashboardUpcomingTripsUl = checkElement('dashboard-upcoming-trips');
    const dashboardRemindersUl = checkElement('dashboard-reminders');
    const dashboardExpensesUl = checkElement('dashboard-expenses');
    const anonymousUserDashboardPrompt = checkElement('anonymous-user-prompt');
    const navDashboardLink = checkElement('nav-dashboard-link');

    // Collaborazione
    const collaborationTab = checkElement('collaboration-tab');
    const inviteCollaboratorForm = checkElement('invite-collaborator-form');
    const collaboratorEmailInput = checkElement('collaborator-email');
    const collaboratorRoleSelect = checkElement('collaborator-role');
    const collaboratorListUl = checkElement('collaborator-list');
    const noCollaboratorsMessage = checkElement('no-collaborators-message');
    
    // Datalists e Modals
    const participantDatalist = checkElement('participant-datalist');
    const packingCategoryDatalist = checkElement('packing-category-list');
    const confirmationModal = checkElement('confirmation-modal');

    if (domSelectionError) { alert("Errore critico: alcuni elementi dell'interfaccia non sono stati trovati."); return; }

    // ==========================================================================
    // == STATO APPLICAZIONE ==
    // ==========================================================================
    let currentUser = null;
    let currentUserId = null;
    let trips = [];
    let currentTripId = null;
    let currentTripUnsubscribe = null;
    let editingItemId = { participant: null, transport: null, accommodation: null, itinerary: null, budget: null, packing: null, reminder: null };
    let confirmActionCallback = null;
    let currentSort = { transport: 'departureDateTime', itinerary: 'dateTime', budget: 'category', packing: 'name', reminder: 'dueDate' };
    let currentSearchTerm = { trip: '', itinerary: '', packing: '' };

    // ==========================================================================
    // == FUNZIONI UTILITY ==
    // ==========================================================================
    const generateId = (prefix = 'item') => `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    const formatCurrency = (amount) => { const num = amount === null || typeof amount === 'undefined' ? 0 : Number(amount); if (isNaN(num)) { return new Intl.NumberFormat(DEFAULT_LOCALE, { style: 'currency', currency: DEFAULT_CURRENCY }).format(0); } return new Intl.NumberFormat(DEFAULT_LOCALE, { style: 'currency', currency: DEFAULT_CURRENCY }).format(num); };
    const formatDate = (dateString) => { if (!dateString || typeof dateString !== 'string') return ''; try { const date = new Date(dateString); if(isNaN(date.getTime())) return dateString; const options = { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'UTC' }; return date.toLocaleDateString(DEFAULT_LOCALE, options); } catch(e) { return dateString; } };
    const formatDateTime = (dateTimeString) => { if (!dateTimeString || typeof dateTimeString !== 'string') return ''; try { const date = new Date(dateTimeString); if (isNaN(date.getTime())) return ''; const options = { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }; return date.toLocaleString(DEFAULT_LOCALE, options); } catch (e) { return ''; } };
    const showToast = (message, type = 'info') => { const toastContainer = document.getElementById('toast-container'); if (!toastContainer) return; const toast = document.createElement('div'); toast.className = `toast ${type}`; let iconClass = 'fas fa-info-circle'; if (type === 'success') iconClass = 'fas fa-check-circle'; if (type === 'error') iconClass = 'fas fa-exclamation-circle'; toast.innerHTML = `<i class="${iconClass}"></i> ${message}`; toastContainer.appendChild(toast); setTimeout(() => toast.classList.add('show'), 10); setTimeout(() => { toast.classList.remove('show'); toast.addEventListener('transitionend', () => toast.remove(), { once: true }); }, 3000); };
    const openModal = (modalElement) => { if(modalElement) modalElement.style.display = 'block'; };
    const closeModal = (modalElement) => { if(modalElement) modalElement.style.display = 'none'; };
    const showConfirmationModal = (title, message, onConfirm) => { if (!confirmationModal) return; confirmationModal.querySelector('#confirmation-modal-title').textContent = title; confirmationModal.querySelector('#confirmation-modal-message').textContent = message; confirmActionCallback = onConfirm; openModal(confirmationModal); };
    const closeConfirmationModal = () => { confirmActionCallback = null; closeModal(confirmationModal); };
    
    const resetEditState = (formType) => {
        const form = document.getElementById(`add-${formType}-item-form`) || document.getElementById(`add-${formType}-form`);
        if(form) form.reset();
        editingItemId[formType] = null;
        const submitBtn = document.getElementById(`${formType}-submit-btn`);
        const cancelBtn = document.getElementById(`${formType}-cancel-edit-btn`);
        const hiddenInput = document.getElementById(`edit-${formType}-item-id`);
        if(hiddenInput) hiddenInput.value = '';
        if (submitBtn) {
            let addText;
            switch(formType) {
                case 'participant': addText = 'Partecipante'; break; case 'reminder': addText = 'Promemoria'; break; case 'transport': addText = 'Trasporto'; break; case 'accommodation': addText = 'Alloggio'; break; case 'itinerary': addText = 'Attività'; break; case 'budget': addText = 'Spesa'; break; case 'packing': addText = 'Oggetto'; break; default: addText = 'Aggiungi'; break;
            }
            submitBtn.innerHTML = `<i class="fas fa-plus"></i> ${addText}`;
            submitBtn.classList.remove('btn-warning'); submitBtn.classList.add('btn-secondary');
        }
        if (cancelBtn) cancelBtn.style.display = 'none';
        if(formType === 'transport') toggleSearchButtonsVisibility();
    };
    
    const createMapLink = (query) => query ? `${GOOGLE_MAPS_BASE_URL}${encodeURIComponent(query)}` : null;
    const safeToNumberOrNull = (value) => { if (value === null || value === undefined || value === '') return null; const num = Number(value); return isNaN(num) || !isFinite(num) ? null : num; };
    const safeToPositiveIntegerOrDefault = (value, defaultValue = 1) => { const num = parseInt(value, 10); return isNaN(num) || num < 1 ? defaultValue : num; };
    const toTimestampOrNull = (dateString) => { if (!dateString) return null; try { const date = new Date(dateString); return isNaN(date.getTime()) ? null : Timestamp.fromDate(date); } catch (e) { return null; } };
    const fromTimestampToString = (timestamp) => { if (timestamp?.toDate) { try { const d = timestamp.toDate(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}T${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; } catch (e) { return ''; } } return ''; };
    const fromTimestampToDateString = (timestamp) => { if (timestamp?.toDate) { try { const d = timestamp.toDate(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; } catch (e) { return ''; } } return ''; };
    const toggleSearchButtonsVisibility = () => { const transportTypeSelect = checkElement('transport-type'); if (!transportTypeSelect) return; const type = transportTypeSelect.value; const searchSkyscannerBtn = checkElement('search-skyscanner-btn'); const searchTrainlineBtn = checkElement('search-trainline-btn'); if(searchSkyscannerBtn) searchSkyscannerBtn.style.display = (type === 'Volo') ? 'inline-flex' : 'none'; if(searchTrainlineBtn) searchTrainlineBtn.style.display = (type === 'Treno') ? 'inline-flex' : 'none'; };

    const prepareTripDataForFirestore = (tripObject) => { const dataToSave = JSON.parse(JSON.stringify(tripObject)); delete dataToSave.id; dataToSave.startDate = toTimestampOrNull(dataToSave.startDate); dataToSave.endDate = toTimestampOrNull(dataToSave.endDate); dataToSave.createdAt = dataToSave.createdAt instanceof Timestamp ? dataToSave.createdAt : (dataToSave.createdAt ? toTimestampOrNull(dataToSave.createdAt) : Timestamp.now()); dataToSave.updatedAt = Timestamp.now(); if (dataToSave.reminders) dataToSave.reminders.forEach(r => r.dueDate = toTimestampOrNull(r.dueDate)); if (dataToSave.transportations) dataToSave.transportations.forEach(t => { t.departureDateTime = toTimestampOrNull(t.departureDateTime); t.arrivalDateTime = toTimestampOrNull(t.arrivalDateTime); t.cost = safeToNumberOrNull(t.cost); }); if (dataToSave.accommodations) dataToSave.accommodations.forEach(a => { a.checkinDateTime = toTimestampOrNull(a.checkinDateTime); a.checkoutDateTime = toTimestampOrNull(a.checkoutDateTime); a.cost = safeToNumberOrNull(a.cost); }); if (dataToSave.itinerary) dataToSave.itinerary.forEach(i => { i.cost = safeToNumberOrNull(i.cost); i.dateTime = toTimestampOrNull(`${i.day}T${i.time || '00:00'}`); }); if (dataToSave.budget?.items) dataToSave.budget.items.forEach(b => { b.estimated = safeToNumberOrNull(b.estimated); b.actual = safeToNumberOrNull(b.actual); }); if (dataToSave.packingList) dataToSave.packingList.forEach(p => { p.quantity = safeToPositiveIntegerOrDefault(p.quantity); }); dataToSave.members = dataToSave.members || { [currentUserId]: 'owner' }; Object.keys(dataToSave).forEach(key => { if (dataToSave[key] === undefined) delete dataToSave[key]; }); return dataToSave; };
    const processTripDataFromFirestore = (docId, firestoreData) => { const trip = { ...firestoreData, id: docId }; trip.startDate = fromTimestampToDateString(trip.startDate); trip.endDate = fromTimestampToDateString(trip.endDate); if (trip.reminders) trip.reminders.forEach(r => r.dueDate = fromTimestampToDateString(r.dueDate)); if (trip.transportations) trip.transportations.forEach(t => { t.departureDateTime = fromTimestampToString(t.departureDateTime); t.arrivalDateTime = fromTimestampToString(t.arrivalDateTime); }); if (trip.accommodations) trip.accommodations.forEach(a => { a.checkinDateTime = fromTimestampToString(a.checkinDateTime); a.checkoutDateTime = fromTimestampToString(a.checkoutDateTime); }); let calcEst = 0, calcAct = 0; trip.budget?.items?.forEach(item => { const est = safeToNumberOrNull(item.estimated); const act = safeToNumberOrNull(item.actual); if (est !== null) calcEst += est; if (act !== null) calcAct += act; }); if(trip.budget) { trip.budget.estimatedTotal = calcEst; trip.budget.actualTotal = calcAct; } return trip; };

    // ==========================================================================
    // == GESTIONE STORAGE (Firestore) ==
    // ==========================================================================
    const loadUserTrips = async (uid) => { if (!uid || !db) { trips = []; renderTripList(); showDashboard(); return; } loadingTripsDiv.style.display = 'block'; noTripsMessage.style.display = 'none'; tripListUl.innerHTML = ''; try { const userDocRef = doc(db, 'users', uid); const userDocSnap = await getDoc(userDocRef); if (!userDocSnap.exists() || !userDocSnap.data().tripIds || userDocSnap.data().tripIds.length === 0) { trips = []; renderTripList(); showDashboard(); return; } const tripIds = userDocSnap.data().tripIds; if(tripIds.length === 0) { trips = []; renderTripList(); showDashboard(); return; } const q = query(collection(db, 'trips'), where('__name__', 'in', tripIds), orderBy('createdAt', 'desc')); const querySnapshot = await getDocs(q); const userTrips = []; querySnapshot.forEach(tripDoc => userTrips.push(processTripDataFromFirestore(tripDoc.id, tripDoc.data()))); trips = userTrips; renderTripList(); renderDashboard(); } catch (error) { console.error("Errore caricamento viaggi:", error); showToast("Errore nel caricamento dei tuoi viaggi.", "error"); trips = []; renderTripList(); showDashboard(); } finally { loadingTripsDiv.style.display = 'none'; } };
    const saveTripToFirestore = async (tripData) => { if (!currentUserId) { showToast("Errore: Utente non loggato.", "error"); return null; } const isNewTrip = !tripData.id; const dataToSave = prepareTripDataForFirestore(tripData); try { if (isNewTrip) { const docRef = await addDoc(collection(db, 'trips'), dataToSave); const userDocRef = doc(db, 'users', currentUserId); await setDoc(userDocRef, { tripIds: arrayUnion(docRef.id) }, { merge: true }); showToast(`Viaggio "${dataToSave.name}" creato!`, "success"); return docRef.id; } else { await setDoc(doc(db, 'trips', tripData.id), dataToSave, { merge: true }); showToast(`Viaggio "${dataToSave.name}" aggiornato!`, "success"); return tripData.id; } } catch (error) { console.error("Errore salvataggio viaggio:", error); showToast("Errore durante il salvataggio.", "error"); return null; } };
    const deleteTripFromFirestore = async (tripId) => { if (!currentUserId || !tripId) return false; try { const tripDocRef = doc(db, 'trips', tripId); const tripDoc = await getDoc(tripDocRef); if (!tripDoc.exists()) return true; const batch = writeBatch(db); const members = Object.keys(tripDoc.data().members || {}); members.forEach(uid => { batch.update(doc(db, 'users', uid), { tripIds: arrayRemove(tripId) }); }); batch.delete(tripDocRef); await batch.commit(); return true; } catch (error) { console.error(`Errore eliminazione viaggio ${tripId}:`, error); showToast("Errore durante l'eliminazione.", "error"); return false; } };

    // ==========================================================================
    // == LOGICA UI PRINCIPALE (Dashboard & Dettagli) ==
    // ==========================================================================
    const showDashboard = () => { dashboardArea.style.display = 'flex'; tripDetailsAreaDiv.style.display = 'none'; navDashboardLink.classList.add('active'); if(currentUserId) renderDashboard(); };
    const showTripDetails = () => { dashboardArea.style.display = 'none'; tripDetailsAreaDiv.style.display = 'flex'; navDashboardLink.classList.remove('active'); };
    const renderDashboard = () => { if (!dashboardArea || !currentUserId) return; const now = new Date(); const upcomingTrips = trips.filter(t => t.startDate && new Date(t.startDate) >= now).sort((a, b) => new Date(a.startDate) - new Date(b.startDate)).slice(0, 5); const allReminders = trips.flatMap(t => (t.reminders || []).map(r => ({ ...r, tripName: t.name, tripId: t.id }))).filter(r => r.status !== 'done' && r.dueDate && new Date(r.dueDate) >= now).sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate)).slice(0, 5); const allExpenses = trips.flatMap(t => (t.budget?.items || []).map(i => ({ ...i, tripName: t.name, tripId: t.id, addedAt: parseInt(i.id.split('_')[1] || 0) }))).sort((a, b) => b.addedAt - a.addedAt).slice(0, 5); if (dashboardUpcomingTripsUl) dashboardUpcomingTripsUl.innerHTML = upcomingTrips.length > 0 ? upcomingTrips.map(t => `<li data-trip-id="${t.id}"><span class="item-title">${t.name}</span><span class="item-meta">${formatDate(t.startDate)} - ${t.destination || 'N/D'}</span></li>`).join('') : '<li class="no-items">Nessun viaggio in programma.</li>'; if (dashboardRemindersUl) dashboardRemindersUl.innerHTML = allReminders.length > 0 ? allReminders.map(r => `<li data-trip-id="${r.tripId}"><span class="item-title">${r.description}</span><span class="item-meta">Scade: ${formatDate(r.dueDate)} (Viaggio: ${r.tripName})</span></li>`).join('') : '<li class="no-items">Nessun promemoria imminente.</li>'; if (dashboardExpensesUl) dashboardExpensesUl.innerHTML = allExpenses.length > 0 ? allExpenses.map(i => `<li data-trip-id="${i.tripId}"><span class="item-title">${i.description} - <span class="item-amount">${formatCurrency(i.estimated)}</span></span><span class="item-meta">${i.category} (Viaggio: ${i.tripName})</span></li>`).join('') : '<li class="no-items">Nessuna spesa recente.</li>'; anonymousUserDashboardPrompt.style.display = (currentUser && currentUser.isAnonymous) ? 'block' : 'none'; };

    // ==========================================================================
    // == LOGICA VIAGGI ==
    // ==========================================================================
    const findTripById = (id) => trips.find(trip => trip && trip.id === id);
    const renderTripList = () => { const searchTerm = searchTripInput.value.toLowerCase(); tripListUl.innerHTML = ''; const filteredTrips = trips.filter(trip => !searchTerm || (trip.name || '').toLowerCase().includes(searchTerm) || (trip.destination || '').toLowerCase().includes(searchTerm)); filteredTrips.forEach(trip => tripListUl.appendChild(createTripListItem(trip))); noTripsMessage.style.display = trips.length === 0 ? 'block' : 'none'; };
    const createTripListItem = (trip) => { const li = document.createElement('li'); li.dataset.tripId = trip.id; li.innerHTML = `<span><i class="fas ${trip.members && trip.members[currentUserId] === 'owner' ? 'fa-user-crown' : 'fa-user-friends'}"></i> ${trip.name || 'Senza Nome'}</span>`; if (trip.id === currentTripId) li.classList.add('active'); li.addEventListener('click', () => selectTrip(trip.id)); return li; };
    
    const selectTrip = (id) => {
        if (!id) { deselectTrip(); return; }
        if (currentTripId === id && tripDetailsAreaDiv.style.display === 'flex') return;
        if (currentTripUnsubscribe) currentTripUnsubscribe();
        const trip = findTripById(id);
        if (trip) {
            currentTripId = id;
            saveLocalStorageAppState();
            showTripDetails();
            renderTripList();
            
            const isOwner = trip.members && trip.members[currentUserId] === 'owner';
            downloadTextBtn.disabled = false;
            downloadExcelBtn.disabled = false;
            copySummaryBtn.disabled = false;
            emailSummaryBtn.disabled = false;
            deleteTripBtn.disabled = !isOwner;

            const tripDocRef = doc(db, 'trips', id);
            currentTripUnsubscribe = onSnapshot(tripDocRef, (docSnap) => {
                if (docSnap.exists()) {
                    const updatedTripData = processTripDataFromFirestore(docSnap.id, docSnap.data());
                    const tripIndex = trips.findIndex(t => t.id === docSnap.id);
                    if (tripIndex !== -1) trips[tripIndex] = updatedTripData;
                    if (currentTripId === docSnap.id) renderTripDetails(updatedTripData);
                } else {
                    showToast("Questo viaggio è stato eliminato.", "warning");
                    trips = trips.filter(t => t.id !== id);
                    deselectTrip();
                }
            }, (error) => {
                console.error("Errore listener:", error); showToast("Errore di connessione real-time.", "error");
            });
            renderTripDetails(trip);
        } else {
            deselectTrip();
        }
    };
    
    const deselectTrip = () => {
        if (currentTripUnsubscribe) { currentTripUnsubscribe(); currentTripUnsubscribe = null; }
        currentTripId = null;
        saveLocalStorageAppState();
        renderTripList();
        showDashboard();
        
        downloadTextBtn.disabled = true;
        downloadExcelBtn.disabled = true;
        copySummaryBtn.disabled = true;
        emailSummaryBtn.disabled = true;
        deleteTripBtn.disabled = true;
    };
    
    const handleNewTrip = () => { if (!currentUserId) { showToast("Devi essere loggato per creare un viaggio.", "warning"); return; } openModal(checkElement('new-trip-modal')); };
    const handleCreateTripConfirm = async () => { const nameInput = checkElement('new-trip-name-input'); const tripName = nameInput.value.trim(); if (!tripName) { nameInput.focus(); return; } const newTripData = { name: tripName, createdAt: Timestamp.now(), members: {[currentUserId]: 'owner'}, participants:[], reminders:[], transportations:[], accommodations:[], itinerary:[], budget: { items: [], estimatedTotal: 0, actualTotal: 0 }, packingList: [] }; const newTripId = await saveTripToFirestore(newTripData); if (newTripId) { newTripData.id = newTripId; const savedTrip = processTripDataFromFirestore(newTripId, prepareTripDataForFirestore(newTripData)); trips.unshift(savedTrip); closeModal(checkElement('new-trip-modal')); renderTripList(); selectTrip(newTripId); } };
    const handleSaveTripInfo = async (e) => { e.preventDefault(); if (!currentTripId) return; const trip = findTripById(currentTripId); if (!trip) return; const form = e.target; const updatedData = { name: form.querySelector('#trip-name').value.trim() || "Viaggio Senza Nome", originCity: form.querySelector('#trip-origin-city').value.trim(), destination: form.querySelector('#trip-destination').value.trim(), startDate: toTimestampOrNull(form.querySelector('#trip-start-date').value), endDate: toTimestampOrNull(form.querySelector('#trip-end-date').value), notes: form.querySelector('#trip-notes').value.trim(), updatedAt: Timestamp.now() }; await updateDoc(doc(db, 'trips', currentTripId), updatedData); showToast("Informazioni viaggio aggiornate!", "success"); };
    const handleDeleteTrip = (id) => { const trip = findTripById(id); if (!trip) return; showConfirmationModal(`Conferma Eliminazione`, `Eliminare "${trip.name || 'S.N.'}"? L'azione è irreversibile per tutti i collaboratori.`, async () => { const success = await deleteTripFromFirestore(id); if (success) { trips = trips.filter(t => t.id !== id); if (currentTripId === id) deselectTrip(); else renderTripList(); showToast(`Viaggio eliminato.`, 'info'); } }); };
    
    // ==========================================================================
    // == FUNZIONI DI COLLABORAZIONE ==
    // ==========================================================================
    const renderCollaborators = (trip) => { if (!collaboratorListUl) return; const members = trip.members || {}; const isOwner = members[currentUserId] === 'owner'; collaboratorListUl.innerHTML = ''; noCollaboratorsMessage.style.display = Object.keys(members).length <= 1 ? 'block' : 'none'; Object.entries(members).forEach(([uid, role]) => { const isCurrentUser = uid === currentUserId; const li = document.createElement('li'); li.innerHTML = `<div class="item-details"> <strong>${isCurrentUser ? (currentUser.email + ' (Tu)') : `Utente ${uid.substring(0, 8)}...`} <span class="role-tag ${role}">${role}</span></strong> </div> <div class="item-actions"> ${isOwner && !isCurrentUser ? `<button class="btn-icon delete collaborator-delete-btn" data-uid="${uid}" title="Rimuovi"><i class="fas fa-user-times"></i></button>` : ''} </div>`; collaboratorListUl.appendChild(li); }); };
    const handleInviteCollaborator = async (e) => { e.preventDefault(); const email = collaboratorEmailInput.value.trim().toLowerCase(); if (!email || !currentTripId) return; const trip = findTripById(currentTripId); if (!trip || trip.members[currentUserId] !== 'owner') { showToast("Solo il proprietario può invitare.", "error"); return; } showToast("Ricerca utente...", "info"); const q = query(collection(db, "user_emails"), where("email", "==", email)); const querySnapshot = await getDocs(q); if (querySnapshot.empty) { showToast("Utente non trovato. Assicurati che l'email sia corretta e che l'utente si sia registrato.", "error"); return; } const invitedUserDoc = querySnapshot.docs[0]; const invitedUserId = invitedUserDoc.data().uid; if (trip.members[invitedUserId]) { showToast("Questo utente è già un membro.", "warning"); return; } const batch = writeBatch(db); batch.update(doc(db, 'trips', currentTripId), { [`members.${invitedUserId}`]: collaboratorRoleSelect.value }); batch.update(doc(db, 'users', invitedUserId), { tripIds: arrayUnion(currentTripId) }); await batch.commit(); showToast("Collaboratore invitato!", "success"); collaboratorEmailInput.value = ''; };
    const handleRemoveCollaborator = async (uidToRemove) => { if (!currentTripId || !uidToRemove) return; const trip = findTripById(currentTripId); if (!trip || trip.members[currentUserId] !== 'owner') return; showConfirmationModal("Rimuovi Collaboratore", `Sei sicuro di voler rimuovere questo utente dal viaggio?`, async () => { const batch = writeBatch(db); batch.update(doc(db, 'trips', currentTripId), { [`members.${uidToRemove}`]: deleteDoc() }); batch.update(doc(db, 'users', uidToRemove), { tripIds: arrayRemove(currentTripId) }); await batch.commit(); showToast("Collaboratore rimosso.", "success"); }); };
    
    // ==========================================================================
    // == FUNZIONI MODIFICA ITEM (Generica) ==
    // ==========================================================================
    const startEditItem = (listType, itemId) => { if (!currentTripId) return; const trip = findTripById(currentTripId); if (!trip) return; let itemToEdit = null; let list; switch (listType) { case 'participant': list = trip.participants || []; break; case 'reminder': list = trip.reminders || []; break; case 'transport': list = trip.transportations || []; break; case 'accommodation': list = trip.accommodations || []; break; case 'itinerary': list = trip.itinerary || []; break; case 'budget': list = trip.budget?.items || []; break; case 'packing': list = trip.packingList || []; break; default: return; } itemToEdit = list.find(item => item && item.id === itemId); if (!itemToEdit) { console.error(`Item ${itemId} non trovato in lista ${listType}`); return; } Object.keys(editingItemId).forEach(type => { if (type !== listType) resetEditState(type); }); editingItemId[listType] = itemId; const form = checkElement(`add-${listType}-item-form`) || checkElement(`add-${listType}-form`); const submitBtn = document.getElementById(`${listType}-submit-btn`); const cancelBtn = document.getElementById(`${listType}-cancel-edit-btn`); const hiddenInput = document.getElementById(`edit-${listType}-item-id`); if (hiddenInput) hiddenInput.value = itemId; try { switch (listType) { case 'participant': form.querySelector('#participant-name').value = itemToEdit.name || ''; form.querySelector('#participant-notes').value = itemToEdit.notes || ''; break; case 'reminder': form.querySelector('#reminder-description').value = itemToEdit.description || ''; form.querySelector('#reminder-due-date').value = itemToEdit.dueDate || ''; form.querySelector('#reminder-status').value = itemToEdit.status || 'todo'; break; case 'transport': form.querySelector('#transport-type').value = itemToEdit.type || 'Altro'; form.querySelector('#transport-description').value = itemToEdit.description || ''; form.querySelector('#transport-departure-loc').value = itemToEdit.departureLoc || ''; form.querySelector('#transport-departure-datetime').value = itemToEdit.departureDateTime || ''; form.querySelector('#transport-arrival-loc').value = itemToEdit.arrivalLoc || ''; form.querySelector('#transport-arrival-datetime').value = itemToEdit.arrivalDateTime || ''; form.querySelector('#transport-booking-ref').value = itemToEdit.bookingRef || ''; form.querySelector('#transport-cost').value = itemToEdit.cost ?? ''; form.querySelector('#transport-notes').value = itemToEdit.notes || ''; break; case 'accommodation': form.querySelector('#accommodation-name').value = itemToEdit.name || ''; form.querySelector('#accommodation-type').value = itemToEdit.type || 'Hotel'; form.querySelector('#accommodation-address').value = itemToEdit.address || ''; form.querySelector('#accommodation-checkin').value = itemToEdit.checkinDateTime || ''; form.querySelector('#accommodation-checkout').value = itemToEdit.checkoutDateTime || ''; form.querySelector('#accommodation-booking-ref').value = itemToEdit.bookingRef || ''; form.querySelector('#accommodation-cost').value = itemToEdit.cost ?? ''; form.querySelector('#accommodation-notes').value = itemToEdit.notes || ''; break; case 'itinerary': form.querySelector('#itinerary-day').value = itemToEdit.day || ''; form.querySelector('#itinerary-time').value = itemToEdit.time || ''; form.querySelector('#itinerary-activity').value = itemToEdit.activity || ''; form.querySelector('#itinerary-location').value = itemToEdit.location || ''; form.querySelector('#itinerary-booking-ref').value = itemToEdit.bookingRef || ''; form.querySelector('#itinerary-cost').value = itemToEdit.cost ?? ''; form.querySelector('#itinerary-notes').value = itemToEdit.notes || ''; break; case 'budget': form.querySelector('#budget-category').value = itemToEdit.category || 'Altro'; form.querySelector('#budget-description').value = itemToEdit.description || ''; form.querySelector('#budget-estimated').value = itemToEdit.estimated ?? ''; form.querySelector('#budget-actual').value = itemToEdit.actual ?? ''; form.querySelector('#budget-paid-by').value = itemToEdit.paidById || ''; form.querySelector('#budget-split-between').value = itemToEdit.splitBetween || ''; break; case 'packing': form.querySelector('#packing-item-name').value = itemToEdit.name || ''; form.querySelector('#packing-item-category').value = itemToEdit.category || 'Altro'; form.querySelector('#packing-item-quantity').value = itemToEdit.quantity || 1; break; } } catch (error) { console.error(`Errore popola form ${listType}:`, error); showToast(`Errore caricamento dati.`, 'error'); resetEditState(listType); return; } if (submitBtn) { submitBtn.innerHTML = '<i class="fas fa-save"></i> Salva Modifiche'; submitBtn.classList.remove('btn-secondary'); submitBtn.classList.add('btn-warning'); } if (cancelBtn) cancelBtn.style.display = 'inline-flex'; if (listType === 'transport') toggleSearchButtonsVisibility(); if (form) form.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); };
    
    const handleItemFormSubmit = async (e, listType) => {
        e.preventDefault();
        if (!currentTripId) return;
        const trip = findTripById(currentTripId);
        if (!trip) return;

        const form = e.target;
        const currentEditId = editingItemId[listType];
        let itemData = {};

        try {
            switch (listType) {
                case 'participant':
                    itemData = { name: form.querySelector('#participant-name').value.trim(), notes: form.querySelector('#participant-notes').value.trim() };
                    if (!itemData.name) throw new Error("Il nome del partecipante è obbligatorio.");
                    break;
                case 'reminder':
                    itemData = { description: form.querySelector('#reminder-description').value.trim(), dueDate: form.querySelector('#reminder-due-date').value, status: form.querySelector('#reminder-status').value };
                    if(!itemData.description) throw new Error("La descrizione del promemoria è obbligatoria.");
                    break;
                case 'transport':
                    itemData = { type: form.querySelector('#transport-type').value, description: form.querySelector('#transport-description').value.trim(), departureLoc: form.querySelector('#transport-departure-loc').value.trim(), departureDateTime: form.querySelector('#transport-departure-datetime').value, arrivalLoc: form.querySelector('#transport-arrival-loc').value.trim(), arrivalDateTime: form.querySelector('#transport-arrival-datetime').value, bookingRef: form.querySelector('#transport-booking-ref').value.trim(), cost: safeToNumberOrNull(form.querySelector('#transport-cost').value), notes: form.querySelector('#transport-notes').value.trim() };
                    if(!itemData.description) throw new Error("La descrizione del trasporto è obbligatoria.");
                    break;
                case 'accommodation':
                    itemData = { name: form.querySelector('#accommodation-name').value.trim(), type: form.querySelector('#accommodation-type').value, address: form.querySelector('#accommodation-address').value.trim(), checkinDateTime: form.querySelector('#accommodation-checkin').value, checkoutDateTime: form.querySelector('#accommodation-checkout').value, bookingRef: form.querySelector('#accommodation-booking-ref').value.trim(), cost: safeToNumberOrNull(form.querySelector('#accommodation-cost').value), notes: form.querySelector('#accommodation-notes').value.trim() };
                    if(!itemData.name) throw new Error("Il nome dell'alloggio è obbligatorio.");
                    break;
                case 'itinerary':
                    itemData = { day: form.querySelector('#itinerary-day').value, time: form.querySelector('#itinerary-time').value, activity: form.querySelector('#itinerary-activity').value.trim(), location: form.querySelector('#itinerary-location').value.trim(), bookingRef: form.querySelector('#itinerary-booking-ref').value.trim(), cost: safeToNumberOrNull(form.querySelector('#itinerary-cost').value), notes: form.querySelector('#itinerary-notes').value.trim() };
                    if(!itemData.activity || !itemData.day) throw new Error("Giorno e attività sono obbligatori.");
                    break;
                case 'budget':
                    const paidBySelect = form.querySelector('#budget-paid-by');
                    itemData = {
                        category: form.querySelector('#budget-category').value,
                        description: form.querySelector('#budget-description').value.trim(),
                        estimated: safeToNumberOrNull(form.querySelector('#budget-estimated').value),
                        actual: safeToNumberOrNull(form.querySelector('#budget-actual').value),
                        paidById: paidBySelect.value,
                        paidBy: paidBySelect.options[paidBySelect.selectedIndex]?.text || '',
                        splitBetween: form.querySelector('#budget-split-between').value.trim()
                    };
                    if (!itemData.description || itemData.estimated === null) throw new Error("Descrizione e costo stimato sono obbligatori.");
                    break;
                case 'packing':
                    itemData = { name: form.querySelector('#packing-item-name').value.trim(), category: form.querySelector('#packing-item-category').value.trim() || 'Altro', quantity: safeToPositiveIntegerOrDefault(form.querySelector('#packing-item-quantity').value) };
                    if(!itemData.name) throw new Error("Il nome dell'oggetto è obbligatorio.");
                    break;
                default:
                    throw new Error("Tipo lista non valido");
            }
        } catch (error) {
            showToast(`Errore: ${error.message}`, "error");
            return;
        }

        const tripDocRef = doc(db, 'trips', currentTripId);
        const listNameMap = { participant: 'participants', reminder: 'reminders', transport: 'transportations', accommodation: 'accommodations', itinerary: 'itinerary', budget: 'budget.items', packing: 'packingList' };
        const listName = listNameMap[listType];

        try {
            if (currentEditId) {
                const list = listType === 'budget' ? trip.budget.items : (trip[listName] || []);
                const itemIndex = list.findIndex(i => i.id === currentEditId);
                if (itemIndex > -1) {
                    const updatedList = [...list];
                    updatedList[itemIndex] = { ...updatedList[itemIndex], ...itemData };
                    await updateDoc(tripDocRef, { [listName]: updatedList });
                    showToast("Elemento aggiornato!", "success");
                }
            } else {
                itemData.id = generateId(listType);
                if (listType === 'packing') itemData.packed = false;
                await updateDoc(tripDocRef, { [listName]: arrayUnion(itemData) });
                showToast("Elemento aggiunto!", "success");
            }
        } catch (error) {
            console.error("Errore aggiornamento viaggio:", error);
            showToast("Errore durante il salvataggio.", "error");
        }

        resetEditState(listType);
    };

    const handleDeleteItem = async (listType, itemId) => {
        if (!currentTripId) return;
        const trip = findTripById(currentTripId);
        if (!trip) return;
    
        const listNameMap = { participant: 'participants', reminder: 'reminders', transport: 'transportations', accommodation: 'accommodations', itinerary: 'itinerary', budget: 'budget.items', packing: 'packingList' };
        const itemNameMap = { participant: 'partecipante', reminder: 'promemoria', transport: 'trasporto', accommodation: 'alloggio', itinerary: 'attività', budget: 'spesa', packing: 'oggetto' };
        
        const listName = listNameMap[listType];
        const itemName = itemNameMap[listType] || 'voce';
        const list = listType === 'budget' ? trip.budget?.items : trip[listName];

        if (!list) return;
    
        const itemToRemove = list.find(i => i.id === itemId);
        if (itemToRemove) {
            const itemDesc = itemToRemove.name || itemToRemove.description || itemToRemove.activity || `ID ${itemId}`;
            showConfirmationModal(`Elimina ${itemName}`, `Eliminare "${itemDesc}"?`, async () => {
                try {
                    const tripDocRef = doc(db, 'trips', currentTripId);
                    await updateDoc(tripDocRef, { [listName]: arrayRemove(itemToRemove) });
                    showToast(`${itemName.charAt(0).toUpperCase() + itemName.slice(1)} eliminato/a.`, 'info');
                } catch (error) {
                    console.error(`Errore eliminazione item ${itemId}:`, error);
                    showToast("Errore durante l'eliminazione.", "error");
                }
            });
        }
    };
    
    const handleTogglePacked = async (itemId, isPacked) => {
        if (!currentTripId) return;
        const trip = findTripById(currentTripId);
        if (!trip || !trip.packingList) return;
    
        const itemIndex = trip.packingList.findIndex(i => i.id === itemId);
        if (itemIndex > -1) {
            const updatedList = [...trip.packingList];
            updatedList[itemIndex] = { ...updatedList[itemIndex], packed: isPacked };
            try {
                const tripDocRef = doc(db, 'trips', currentTripId);
                await updateDoc(tripDocRef, { packingList: updatedList });
            } catch (error) {
                console.error("Errore aggiornamento packing list:", error);
                showToast("Errore durante l'aggiornamento.", "error");
                const checkbox = document.querySelector(`.packing-checkbox[data-item-id="${itemId}"]`);
                if(checkbox) checkbox.checked = !isPacked;
            }
        }
    };

    const handleImportPackingList = async (type) => { if (!currentTripId || !PREDEFINED_PACKING_LISTS[type]) return; const trip = findTripById(currentTripId); if (!trip) return; const predefined = PREDEFINED_PACKING_LISTS[type]; let itemsToAdd = []; const currentLower = (trip.packingList || []).map(i => (i?.name || '').toLowerCase()); predefined.forEach(predefItem => { if (!currentLower.includes(predefItem.name.toLowerCase())) { itemsToAdd.push({ id: generateId('pack'), name: predefItem.name, packed: false, category: predefItem.category || 'Altro', quantity: predefItem.quantity || 1 }); } }); if (itemsToAdd.length > 0) { await updateDoc(doc(db, 'trips', currentTripId), { packingList: arrayUnion(...itemsToAdd) }); showToast(`${itemsToAdd.length} oggetti aggiunti alla lista!`, 'success'); } else { showToast(`Nessun nuovo oggetto da aggiungere.`, 'info'); } };
    const handleCalculateAndAddTransportCost = async () => { if (!currentTripId) return; const trip = findTripById(currentTripId); if (!trip || !Array.isArray(trip.transportations)) { showToast("Errore dati trasporti.", "error"); return; } let totalCost = 0; trip.transportations.forEach(item => { const cost = Number(item?.cost || 0); if (!isNaN(cost) && cost > 0) { totalCost += cost; } }); if (totalCost <= 0) { showToast("Nessun costo trasporto valido da aggiungere.", "info"); return; } const budgetItem = { id: generateId('budget'), category: "Trasporti", description: `Totale Costi Trasporti (del ${new Date().toLocaleDateString()})`, estimated: totalCost, actual: null, paidById: '', paidBy: '', splitBetween: '' }; await updateDoc(doc(db, 'trips', currentTripId), { 'budget.items': arrayUnion(budgetItem) }); showToast(`Costo trasporti (${formatCurrency(totalCost)}) aggiunto al budget!`, 'success'); tabsContainer.querySelector('[data-tab="budget-tab"]').click(); };
    
    const calculateExpenseBalance = () => {
        if (!currentTripId) return { error: "Nessun viaggio selezionato." };
        const trip = findTripById(currentTripId);
        if (!trip) return { error: "Viaggio non trovato." };
        if (!Array.isArray(trip.participants) || trip.participants.length === 0) {
            return { error: "Aggiungi partecipanti per calcolare il bilancio." };
        }
        if (!trip.budget || !Array.isArray(trip.budget.items) || trip.budget.items.length === 0) {
            return { balances: {}, totalSharedExpense: 0, errors: [] };
        }
        
        const participants = trip.participants;
        const participantMap = new Map(participants.map(p => [p.id, p.name]));
        const nameToIdMap = new Map(participants.map(p => [p.name.trim().toLowerCase(), p.id]));
        
        const balances = {};
        participants.forEach(p => balances[p.id] = 0);
    
        let totalSharedExpense = 0;
        const calculationErrors = [];
    
        trip.budget.items.forEach((item, index) => {
            const actualCost = safeToNumberOrNull(item.actual);
            if (actualCost === null || actualCost <= 0 || !item.splitBetween || !item.paidById) {
                return;
            }
    
            const payerId = item.paidById;
            if (!participantMap.has(payerId)) {
                calculationErrors.push(`Riga ${index + 1}: Pagante non valido.`);
                return;
            }
    
            const splitRule = item.splitBetween.trim().toLowerCase();
            let sharerIds = [];
    
            if (splitRule === 'tutti') {
                sharerIds = [...participantMap.keys()];
            } else {
                const names = splitRule.split(',').map(name => name.trim().toLowerCase()).filter(Boolean);
                const invalidNames = names.filter(name => !nameToIdMap.has(name));
    
                if (invalidNames.length > 0) {
                    calculationErrors.push(`Riga ${index + 1}: Partecipanti non trovati: ${invalidNames.join(', ')}.`);
                }
                sharerIds = names.map(name => nameToIdMap.get(name)).filter(Boolean);
            }
    
            if (sharerIds.length === 0) {
                return;
            }
    
            const costPerSharer = actualCost / sharerIds.length;
            totalSharedExpense += actualCost;
    
            balances[payerId] += actualCost;
            sharerIds.forEach(sharerId => {
                balances[sharerId] -= costPerSharer;
            });
        });
    
        const finalBalances = {};
        for (const id in balances) {
            const name = participantMap.get(id);
            if (name) {
                finalBalances[name] = Math.round(balances[id] * 100) / 100;
            }
        }
        
        return { balances: finalBalances, totalSharedExpense, errors: calculationErrors };
    };
    
    const renderBalanceResults = (result) => { const container = checkElement('balance-results-container'); const ul = checkElement('balance-results'); const summary = checkElement('balance-summary'); const errorP = checkElement('balance-error-message'); ul.innerHTML = ''; summary.innerHTML = ''; errorP.textContent = ''; errorP.style.display = 'none'; container.style.display = 'block'; if (result.error) { errorP.textContent = `Errore: ${result.error}`; errorP.style.display = 'block'; container.style.display = 'none'; return; } const { balances, totalSharedExpense, errors } = result; let hasBalancesToShow = false; Object.entries(balances).forEach(([name, balance]) => { if(Math.abs(balance) > 0.01) { hasBalancesToShow = true; const li = document.createElement('li'); li.innerHTML = `<span>${name} (${balance > 0 ? 'Deve Ricevere' : 'Deve Dare'})</span> <span>${formatCurrency(Math.abs(balance))}</span>`; li.className = balance > 0 ? 'positive-balance' : 'negative-balance'; ul.appendChild(li); } }); if (!hasBalancesToShow) { ul.innerHTML = `<li>Nessun saldo da regolare.</li>`; } summary.textContent = `Spesa Totale Divisa: ${formatCurrency(totalSharedExpense)}`; if (errors.length > 0) { errorP.innerHTML = `<strong>Attenzione, errori calcolo:</strong><br>` + errors.join('<br>'); errorP.style.display = 'block'; } };

    // ==========================================================================
    // == FUNZIONI RENDER (COMPLETE) ==
    // ==========================================================================
    const renderTripDetails = (trip) => { 
        if (!tripDetailsAreaDiv || !trip) return;
        tripTitleH2.textContent = trip.name || 'Dettagli Viaggio';
        const infoForm = checkElement('trip-info-form');
        infoForm.querySelector('#trip-name').value = trip.name || '';
        infoForm.querySelector('#trip-origin-city').value = trip.originCity || '';
        infoForm.querySelector('#trip-destination').value = trip.destination || '';
        infoForm.querySelector('#trip-start-date').value = trip.startDate || '';
        infoForm.querySelector('#trip-end-date').value = trip.endDate || '';
        infoForm.querySelector('#trip-notes').value = trip.notes || '';
        populateDatalists(trip);
        renderCollaborators(trip);
        renderParticipants(trip.participants);
        renderReminders(trip.reminders);
        renderTransportations(trip.transportations);
        renderAccommodations(trip.accommodations);
        renderItinerary(trip.itinerary);
        renderBudget(trip.budget);
        renderPackingList(trip.packingList);
        checkElement('balance-results-container').style.display = 'none';
        checkElement('balance-results').innerHTML = '';
        checkElement('balance-summary').innerHTML = '';
    };
    
    const populateDatalists = (trip) => {
        if (participantDatalist && trip.participants) {
            participantDatalist.innerHTML = trip.participants.map(p => `<option value="${p.name}"></option>`).join('');
        }
        if (packingCategoryDatalist) {
            const categories = [...DEFAULT_PACKING_CATEGORIES];
            if (trip.packingList) {
                trip.packingList.forEach(item => { if(item.category && !categories.includes(item.category)) categories.push(item.category) });
            }
            packingCategoryDatalist.innerHTML = categories.map(c => `<option value="${c}"></option>`).join('');
        }
        const paidBySelect = checkElement('budget-paid-by');
        if (paidBySelect && trip.participants) {
            const currentVal = paidBySelect.value;
            paidBySelect.innerHTML = '<option value="">-- Seleziona --</option>';
            trip.participants.forEach(p => {
                const option = document.createElement('option');
                option.value = p.id;
                option.textContent = p.name;
                paidBySelect.appendChild(option);
            });
            paidBySelect.value = currentVal;
        }
    };

    const renderParticipants = (participants = []) => { const ul = checkElement('participant-list'); ul.innerHTML = participants.length > 0 ? participants.map(p => `<li><div class="item-details"><strong>${p.name}</strong><span class="meta">${p.notes || ''}</span></div><div class="item-actions"><button class="btn-icon edit participant-edit-btn" data-item-id="${p.id}" title="Modifica"><i class="fas fa-pencil-alt"></i></button><button class="btn-icon delete participant-delete-btn" data-item-id="${p.id}" title="Elimina"><i class="fas fa-trash-alt"></i></button></div></li>`).join('') : ''; checkElement('no-participants-items').style.display = participants.length === 0 ? 'block' : 'none'; };
    const renderReminders = (reminders = []) => { const ul = checkElement('reminder-list'); const sorted = [...reminders].sort((a,b) => new Date(a.dueDate) - new Date(b.dueDate)); ul.innerHTML = sorted.length > 0 ? sorted.map(r => `<li class="${r.status}"><div class="item-details"><strong>${r.description}</strong><span class="meta">${r.dueDate ? `Scadenza: ${formatDate(r.dueDate)}` : 'Senza scadenza'}</span></div><div class="item-actions"><button class="btn-icon edit reminder-edit-btn" data-item-id="${r.id}" title="Modifica"><i class="fas fa-pencil-alt"></i></button><button class="btn-icon delete reminder-delete-btn" data-item-id="${r.id}" title="Elimina"><i class="fas fa-trash-alt"></i></button></div></li>`).join('') : ''; checkElement('no-reminder-items').style.display = reminders.length === 0 ? 'block' : 'none'; };
    const renderTransportations = (transportations = []) => { const ul = checkElement('transport-list'); const sorted = [...transportations].sort((a,b) => new Date(a.departureDateTime) - new Date(b.departureDateTime)); ul.innerHTML = sorted.length > 0 ? sorted.map(t => `<li><div class="item-details"><strong>${t.description} (${t.type})</strong><span class="meta"><i class="fas fa-plane-departure"></i> ${t.departureLoc || 'N/D'} (${formatDateTime(t.departureDateTime) || 'N/D'})</span><span class="meta"><i class="fas fa-plane-arrival"></i> ${t.arrivalLoc || 'N/D'} (${formatDateTime(t.arrivalDateTime) || 'N/D'})</span><span class="meta"><i class="fas fa-money-bill-wave"></i> Costo: ${t.cost ? formatCurrency(t.cost) : 'N/D'}</span><span class="meta"><i class="fas fa-ticket-alt"></i> Rif: ${t.bookingRef || 'N/D'}</span></div><div class="item-actions"><button class="btn-icon edit transport-edit-btn" data-item-id="${t.id}" title="Modifica"><i class="fas fa-pencil-alt"></i></button><button class="btn-icon delete transport-delete-btn" data-item-id="${t.id}" title="Elimina"><i class="fas fa-trash-alt"></i></button></div></li>`).join('') : ''; checkElement('no-transport-items').style.display = transportations.length === 0 ? 'block' : 'none'; };
    const renderAccommodations = (accommodations = []) => { const ul = checkElement('accommodation-list'); ul.innerHTML = accommodations.length > 0 ? accommodations.map(a => `<li><div class="item-details"><strong>${a.name} (${a.type})</strong><span class="meta"><i class="fas fa-map-marker-alt"></i> <a href="${createMapLink(a.address)}" target="_blank" rel="noopener noreferrer">${a.address || 'Indirizzo non specificato'}</a></span><span class="meta"><i class="fas fa-sign-in-alt"></i> Check-in: ${formatDateTime(a.checkinDateTime) || 'N/D'}</span><span class="meta"><i class="fas fa-sign-out-alt"></i> Check-out: ${formatDateTime(a.checkoutDateTime) || 'N/D'}</span><span class="meta"><i class="fas fa-money-bill-wave"></i> Costo: ${a.cost ? formatCurrency(a.cost) : 'N/D'}</span><span class="meta"><i class="fas fa-ticket-alt"></i> Rif: ${a.bookingRef || 'N/D'}</span></div><div class="item-actions"><button class="btn-icon edit accommodation-edit-btn" data-item-id="${a.id}" title="Modifica"><i class="fas fa-pencil-alt"></i></button><button class="btn-icon delete accommodation-delete-btn" data-item-id="${a.id}" title="Elimina"><i class="fas fa-trash-alt"></i></button></div></li>`).join('') : ''; checkElement('no-accommodation-items').style.display = accommodations.length === 0 ? 'block' : 'none'; };
    
    const renderItinerary = (itinerary = []) => {
        const ul = checkElement('itinerary-list');
        let processed = [...itinerary];
        const searchTerm = currentSearchTerm.itinerary;
        if (searchTerm) { processed = processed.filter(i => (i.activity || '').toLowerCase().includes(searchTerm) || (i.location || '').toLowerCase().includes(searchTerm)); }
        const sortValue = currentSort.itinerary;
        processed.sort((a,b) => { if (sortValue === 'dateTime') { const dateA = new Date(`${a.day}T${a.time || '00:00'}`); const dateB = new Date(`${b.day}T${b.time || '00:00'}`); return dateA - dateB; } if (sortValue === 'activity') { return (a.activity || '').localeCompare(b.activity || ''); } return 0; });
        ul.innerHTML = processed.length > 0 ? processed.map(i => `<li><div class="item-details"><strong>${formatDate(i.day)} ${i.time || ''}: ${i.activity}</strong><span class="meta"><i class="fas fa-map-marker-alt"></i> <a href="${createMapLink(i.location)}" target="_blank" rel="noopener noreferrer">${i.location || 'N/D'}</a></span><span class="meta"><i class="fas fa-money-bill-wave"></i> Costo: ${i.cost ? formatCurrency(i.cost) : 'N/D'}</span><span class="meta"><i class="fas fa-sticky-note"></i> ${i.notes || ''}</span></div><div class="item-actions"><button class="btn-icon edit itinerary-edit-btn" data-item-id="${i.id}" title="Modifica"><i class="fas fa-pencil-alt"></i></button><button class="btn-icon delete itinerary-delete-btn" data-item-id="${i.id}" title="Elimina"><i class="fas fa-trash-alt"></i></button></div></li>`).join('') : '';
        checkElement('no-itinerary-items').style.display = itinerary.length === 0 ? 'block' : 'none';
    };
    
    const renderBudget = (budget = { items: [] }) => { const ul = checkElement('budget-list'); const items = budget.items || []; checkElement('budget-total-estimated').textContent = formatCurrency(budget.estimatedTotal); checkElement('budget-total-actual').textContent = formatCurrency(budget.actualTotal); checkElement('budget-difference').textContent = formatCurrency((budget.actualTotal || 0) - (budget.estimatedTotal || 0)); ul.innerHTML = items.length > 0 ? items.map(i => `<li class="budget-item"><div class="item-details"><strong>${i.description}</strong><span class="meta"><i class="fas fa-tag"></i> ${i.category}</span><span class="meta">Stimato: ${formatCurrency(i.estimated)} | Effettivo: ${formatCurrency(i.actual)}</span><span class="meta"><i class="fas fa-user-check"></i> Pagato da: ${i.paidBy || 'N/D'} | Diviso tra: ${i.splitBetween || 'Non diviso'}</span></div><div class="item-actions"><button class="btn-icon edit budget-edit-btn" data-item-id="${i.id}" title="Modifica"><i class="fas fa-pencil-alt"></i></button><button class="btn-icon delete budget-delete-btn" data-item-id="${i.id}" title="Elimina"><i class="fas fa-trash-alt"></i></button></div></li>`).join('') : ''; checkElement('no-budget-items').style.display = items.length === 0 ? 'block' : 'none'; };
    
    const renderPackingList = (packingList = []) => {
        const ul = checkElement('packing-list');
        let processed = [...packingList];
        const searchTerm = currentSearchTerm.packing;
        if (searchTerm) { processed = processed.filter(i => (i.name || '').toLowerCase().includes(searchTerm)); }
        const sortValue = currentSort.packing;
        processed.sort((a, b) => { switch(sortValue) { case 'category': return (a.category || 'zzz').localeCompare(b.category || 'zzz'); case 'status': return (a.packed ? 1 : 0) - (b.packed ? 1 : 0); case 'name': default: return (a.name || '').localeCompare(b.name || ''); } });
        ul.innerHTML = processed.length > 0 ? processed.map(createPackingListItem).join('') : '';
        checkElement('no-packing-items').style.display = packingList.length === 0 ? 'block' : 'none';
    };

    const createPackingListItem = (item) => { return `<li class="${item.packed ? 'packed' : ''}"><div class="item-details packing-item-details"><input type="checkbox" class="packing-checkbox" data-item-id="${item.id}" ${item.packed ? 'checked' : ''}><label for="pack-${item.id}">${item.name} (x${item.quantity})</label><span class="packing-category">${item.category}</span></div><div class="item-actions"><button class="btn-icon edit packing-edit-btn" data-item-id="${item.id}" title="Modifica"><i class="fas fa-pencil-alt"></i></button><button class="btn-icon delete packing-delete-btn" data-item-id="${item.id}" title="Elimina"><i class="fas fa-trash-alt"></i></button></div></li>`; };
    
    // ==========================================================================
    // == AUTENTICAZIONE ==
    // ==========================================================================
    const getFirebaseErrorMessage = (error) => { switch (error.code) { case 'auth/invalid-email': return 'Formato email non valido.'; case 'auth/user-disabled': return 'Account disabilitato.'; case 'auth/user-not-found': return 'Utente non trovato.'; case 'auth/wrong-password': return 'Password errata.'; case 'auth/email-already-in-use': return 'Email già registrata.'; case 'auth/weak-password': return 'Password troppo debole (min. 6 caratteri).'; default: console.error("Errore Firebase:", error); return 'Errore imprevisto. Riprova.'; } };
    const showAuthError = (msg) => { authErrorDiv.textContent = msg; authErrorDiv.style.display = msg ? 'block' : 'none'; if(msg) authSuccessDiv.style.display = 'none'; };
    const showAuthSuccess = (msg) => { authSuccessDiv.textContent = msg; authSuccessDiv.style.display = msg ? 'block' : 'none'; if(msg) authErrorDiv.style.display = 'none'; };
    
    const handleSignUp = async (e) => {
        e.preventDefault();
        const email = signupForm.querySelector('#signup-email').value.trim();
        const password = signupForm.querySelector('#signup-password').value.trim();
        if(password !== signupForm.querySelector('#signup-password-confirm').value.trim()) {
            showAuthError("Le password non coincidono.");
            return;
        }

        if (auth.currentUser && auth.currentUser.isAnonymous) {
            try {
                const credential = EmailAuthProvider.credential(email, password);
                await linkWithCredential(auth.currentUser, credential);
                
                const user = auth.currentUser;
                const batch = writeBatch(db);
                batch.update(doc(db, "users", user.uid), { email: user.email });
                batch.set(doc(db, "user_emails", user.email.toLowerCase()), { uid: user.uid });
                await batch.commit();

                await sendEmailVerification(user);
                showAuthSuccess("Account collegato con successo! Controlla la tua email per la verifica.");
            } catch (error) {
                showAuthError(getFirebaseErrorMessage(error));
            }
        } else {
            try {
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;
                const batch = writeBatch(db);
                batch.set(doc(db, "users", user.uid), { email: user.email, createdAt: Timestamp.now(), tripIds: [] });
                batch.set(doc(db, "user_emails", user.email.toLowerCase()), { uid: user.uid });
                await batch.commit();
                await sendEmailVerification(user);
                showAuthSuccess("Registrazione completata! Controlla la tua email per il link di verifica.");
            } catch (error) {
                showAuthError(getFirebaseErrorMessage(error));
            }
        }
    };
    
    const handleSignIn = async (e) => { e.preventDefault(); const email = loginForm.querySelector('#login-email').value.trim(); const password = loginForm.querySelector('#login-password').value.trim(); try { await signInWithEmailAndPassword(auth, email, password); } catch(error) { showAuthError(getFirebaseErrorMessage(error)); } };
    const handleSignOut = async () => { if (currentTripUnsubscribe) currentTripUnsubscribe(); try { await signOut(auth); showToast("Logout effettuato.", 'info'); } catch (error) { showToast("Errore logout.", "error"); } };
    const handlePasswordResetRequest = async (e) => { e.preventDefault(); const email = passwordResetForm.querySelector('#reset-email').value.trim(); if (!email) { showAuthError("Inserisci l'indirizzo email."); return; } try { await sendPasswordResetEmail(auth, email); showAuthSuccess(`Email di reimpostazione inviata a ${email}, se l'account esiste.`); } catch(e) { showAuthSuccess(`Email di reimpostazione inviata a ${email}, se l'account esiste.`); } finally { passwordResetForm.style.display = 'none'; loginForm.style.display = 'block'; } };
    const handleAnonymousSignIn = async () => { try { await signInAnonymously(auth); } catch(e) { showAuthError(getFirebaseErrorMessage(e)); } };
    const updateUIBasedOnAuthState = async (user) => { currentUser = user; if (user) { currentUserId = user.uid; authContainer.style.display = 'none'; appMainContainer.style.display = 'flex'; if (!user.isAnonymous) { userEmailDisplay.textContent = user.email; logoutBtn.style.display = 'inline-flex';} else { userEmailDisplay.textContent = 'Ospite'; logoutBtn.style.display = 'none'; } await loadUserTrips(user.uid); const savedState = JSON.parse(localStorage.getItem('travelPlannerPro_UIState_v1')); if (savedState?.userId === currentUserId && savedState.selectedTripId && findTripById(savedState.selectedTripId)) { selectTrip(savedState.selectedTripId); } else { deselectTrip(); } } else { currentUser = null; currentUserId = null; trips = []; authContainer.style.display = 'flex'; appMainContainer.style.display = 'none'; } };
    const saveLocalStorageAppState = () => { try { localStorage.setItem('travelPlannerPro_UIState_v1', JSON.stringify({ userId: currentUserId, selectedTripId: currentTripId })); } catch(e) { console.warn("Errore salvataggio stato UI:", e); } };

    // ==========================================================================
    // == INIZIALIZZAZIONE E EVENT LISTENER ==
    // ==========================================================================
    const initAppEventListeners = () => {
        navDashboardLink.onclick = (e) => { e.preventDefault(); deselectTrip(); };
        dashboardArea.addEventListener('click', (e) => { const li = e.target.closest('li[data-trip-id]'); if(li) selectTrip(li.dataset.tripId); });
        newTripBtn.onclick = handleNewTrip;
        checkElement('create-trip-confirm-btn').onclick = handleCreateTripConfirm;
        searchTripInput.oninput = renderTripList;
        checkElement('trip-info-form').onsubmit = handleSaveTripInfo;
        deleteTripBtn.onclick = () => { if(currentTripId) handleDeleteTrip(currentTripId); };
        inviteCollaboratorForm.onsubmit = handleInviteCollaborator;
        collaboratorListUl.addEventListener('click', (e) => { const removeBtn = e.target.closest('.collaborator-delete-btn'); if(removeBtn) handleRemoveCollaborator(removeBtn.dataset.uid); });
        
        // ================================================================
        // == MODIFICA DEFINITIVA PER IL BUG DELLE SCHEDE CHE SCOMPAIONO ==
        // ================================================================
        tabsContainer.onclick = (e) => {
            const tl = e.target.closest('.tab-link');
            if (tl?.dataset.tab) {
                // Il selettore ">" garantisce che selezioniamo solo le schede di contenuto
                // dirette, non altri elementi che potrebbero avere la classe per errore.
                document.querySelectorAll("#trip-details-area > .tab-content").forEach(t => t.style.display = "none");
                
                document.querySelectorAll(".tab-link").forEach(l => l.classList.remove("active"));
                checkElement(tl.dataset.tab).style.display = "block";
                tl.classList.add("active");
            }
        };

        tripDetailsAreaDiv.addEventListener('click', (e) => {
            const editBtn = e.target.closest('.btn-icon.edit');
            const deleteBtn = e.target.closest('.btn-icon.delete');
            const packingCheckbox = e.target.closest('.packing-checkbox');
            if (editBtn) {
                const type = editBtn.className.match(/(participant|reminder|transport|accommodation|itinerary|budget|packing)-edit-btn/)?.[1];
                if(type) startEditItem(type, editBtn.dataset.itemId);
            } else if (deleteBtn) {
                const type = deleteBtn.className.match(/(participant|reminder|transport|accommodation|itinerary|budget|packing)-delete-btn/)?.[1];
                if(type) handleDeleteItem(type, deleteBtn.dataset.itemId);
            } else if (packingCheckbox) {
                handleTogglePacked(packingCheckbox.dataset.itemId, packingCheckbox.checked);
            }
        });

        checkElement('add-participant-form').onsubmit = (e) => handleItemFormSubmit(e, 'participant');
        checkElement('add-reminder-item-form').onsubmit = (e) => handleItemFormSubmit(e, 'reminder');
        checkElement('add-transport-item-form').onsubmit = (e) => handleItemFormSubmit(e, 'transport');
        checkElement('add-accommodation-item-form').onsubmit = (e) => handleItemFormSubmit(e, 'accommodation');
        checkElement('add-itinerary-item-form').onsubmit = (e) => handleItemFormSubmit(e, 'itinerary');
        checkElement('add-budget-item-form').onsubmit = (e) => handleItemFormSubmit(e, 'budget');
        checkElement('add-packing-item-form').onsubmit = (e) => handleItemFormSubmit(e, 'packing');

        ['participant', 'reminder', 'transport', 'accommodation', 'itinerary', 'budget', 'packing'].forEach(type => {
            const cancelBtn = checkElement(`${type}-cancel-edit-btn`);
            if (cancelBtn) cancelBtn.onclick = () => resetEditState(type);
        });

        checkElement('.predefined-checklists', true).onclick = (e) => { const btn = e.target.closest('button[data-checklist]'); if(btn) { handleImportPackingList(btn.dataset.checklist) } };
        checkElement('calculate-balance-btn').onclick = () => { renderBalanceResults(calculateExpenseBalance()) };
        checkElement('add-transport-total-to-budget-btn').onclick = () => { handleCalculateAndAddTransportCost() };

        const setupListControls = (type, renderFunction, listKey) => {
            const sortControl = document.getElementById(`${type}-sort-control`);
            const searchInput = document.getElementById(`search-${type}-input`);

            if (sortControl) {
                sortControl.onchange = (e) => {
                    currentSort[type] = e.target.value;
                    const trip = findTripById(currentTripId);
                    if (trip) renderFunction(trip[listKey] || (listKey.includes('.') ? trip.budget.items : []));
                };
            }
            if (searchInput) {
                searchInput.oninput = (e) => {
                    currentSearchTerm[type] = e.target.value.toLowerCase();
                    const trip = findTripById(currentTripId);
                    if (trip) renderFunction(trip[listKey] || (listKey.includes('.') ? trip.budget.items : []));
                };
            }
        };

        setupListControls('itinerary', renderItinerary, 'itinerary');
        setupListControls('packing', renderPackingList, 'packingList');
        setupListControls('reminder', renderReminders, 'reminders');
        setupListControls('transport', renderTransportations, 'transportations');
        setupListControls('budget', (d) => renderBudget({items: d}), 'budget.items');
    };

    // Listener Autenticazione
    loginForm.addEventListener('submit', handleSignIn);
    signupForm.addEventListener('submit', handleSignUp);
    logoutBtn.addEventListener('click', handleSignOut);
    anonymousSigninBtn.addEventListener('click', handleAnonymousSignIn);
    passwordResetForm.addEventListener('submit', handlePasswordResetRequest);
    forgotPasswordLink.addEventListener('click', (e) => { e.preventDefault(); passwordResetForm.style.display = 'block'; loginForm.style.display = 'none'; showAuthError(''); showAuthSuccess(''); });
    cancelResetBtn.addEventListener('click', () => { passwordResetForm.style.display = 'none'; loginForm.style.display = 'block'; showAuthError(''); showAuthSuccess(''); });
    showSignupLink.addEventListener('click', (e) => { e.preventDefault(); signupForm.style.display = 'block'; loginForm.style.display = 'none'; signupPromptP.style.display = 'none'; showAuthError(''); showAuthSuccess(''); });
    checkElement('new-trip-modal').querySelector('.modal-close').onclick = () => closeModal(checkElement('new-trip-modal'));
    checkElement('confirmation-modal').querySelector('.modal-close').onclick = closeConfirmationModal;
    checkElement('confirmation-modal-confirm-btn').onclick = () => { if(confirmActionCallback) confirmActionCallback(); closeConfirmationModal(); };

    // Entry Point dell'App
    if (auth) {
        let listenersInitialized = false;
        onAuthStateChanged(auth, async (user) => {
            await updateUIBasedOnAuthState(user);
            if (user && !listenersInitialized) {
                 initAppEventListeners(); listenersInitialized = true;
            } else if (!user) {
                if (currentTripUnsubscribe) currentTripUnsubscribe();
                listenersInitialized = false; 
            }
        });
    }
});
