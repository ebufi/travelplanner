// ==========================================================================
// == FIREBASE MODULE IMPORTS & INITIALIZATION ==
// ==========================================================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-app.js";
import { getFirestore, collection, addDoc, doc, getDoc, Timestamp } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-firestore.js";
// ... (resto inizializzazione Firebase come prima) ...
const firebaseConfig = {
  apiKey: "AIzaSyBV7k95kgUnMhIzTQR1Xae-O_ksNYzzvmw",
  authDomain: "travel-planner-pro-5dd4f.firebaseapp.com",
  projectId: "travel-planner-pro-5dd4f",
  storageBucket: "travel-planner-pro-5dd4f.appspot.com",
  messagingSenderId: "95235228754",
  appId: "1:95235228754:web:5c8ce68dc8362e90260b8b",
  measurementId: "G-8H6FV393ZW"
};
let app;
let db;
try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    console.log("Firebase inizializzato correttamente.");
} catch (error) {
    console.error("Errore inizializzazione Firebase:", error);
    alert("Impossibile inizializzare le funzionalità di condivisione.");
}
// ==========================================================================
// == INIZIO LOGICA APPLICAZIONE ==
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {

    // ... (Costanti e Selettori DOM come prima, fino a Packing List) ...

    // NUOVO: Selettori DOM per Tab Bilancio
    const calculateBalanceBtn = document.getElementById('calculate-balance-btn');
    const balanceResultsContainer = document.getElementById('balance-results-container');
    const balanceResultsUl = document.getElementById('balance-results');
    const balanceSummaryDiv = document.getElementById('balance-summary');
    const balanceErrorMessageP = document.getElementById('balance-error-message');

    // ... (Stato Applicazione come prima) ...
    // ... (Funzioni Utility come prima, incluse toTimestampOrNull, safeToNumberOrNull, safeToPositiveIntegerOrDefault, convertTimestampsToStrings) ...
    // ... (Gestione Storage come prima) ...
    // ... (Logica Viaggi come prima) ...
    // ... (Funzioni Modifica Item come prima - assicurati che usi safeToNumber/safeToPositiveInt) ...
    // ... (Funzioni Render Liste come prima) ...
    // ... (Funzioni Aggiungi/Calcola Budget come prima) ...
    // ... (Funzioni UI Tabs, Visibilità bottoni Cerca, Sort, Search Interna come prima) ...
    // ... (Funzioni Ricerca Esterna come prima) ...
    // ... (Funzioni Download come prima) ...
    // ... (Funzioni Condivisione Firestore come prima) ...

    // ==========================================================================
    // == FUNZIONI CALCOLO BILANCIO SPESE ==
    // ==========================================================================

    const calculateExpenseBalance = () => {
        if (!currentTripId) return { error: "Nessun viaggio selezionato." };
        const trip = findTripById(currentTripId);
        if (!trip) return { error: "Viaggio non trovato." };
        if (!Array.isArray(trip.participants) || trip.participants.length === 0) {
            return { error: "Aggiungi almeno un partecipante per calcolare il bilancio." };
        }
        if (!trip.budget || !Array.isArray(trip.budget.items) || trip.budget.items.length === 0) {
             return { balances: {}, totalSharedExpense: 0, errors: [] }; // Nessuna spesa, nessun errore
        }

        const participantNames = trip.participants.map(p => p.name.trim()); // Lista nomi validi
        const balances = {};
        participantNames.forEach(name => balances[name] = 0); // Inizializza saldi a 0

        let totalSharedExpense = 0;
        const calculationErrors = [];

        trip.budget.items.forEach((item, index) => {
            const actualCost = safeToNumberOrNull(item.actual);

            // Considera solo spese con costo effettivo > 0 e con info di divisione
            if (actualCost === null || actualCost <= 0 || !item.paidBy || !item.splitBetween) {
                return; // Salta questa spesa per il bilancio
            }

            const payerName = item.paidBy.trim();
            const splitRule = item.splitBetween.trim();

            // Validazione Payer
            if (!participantNames.includes(payerName)) {
                calculationErrors.push(`Riga ${index + 1} ("${item.description}"): Payer "${payerName}" non trovato tra i partecipanti.`);
                return; // Salta questa spesa
            }

            let sharers = [];
            if (splitRule.toLowerCase() === 'tutti') {
                sharers = [...participantNames]; // Tutti i partecipanti del viaggio
            } else {
                // Nomi separati da virgola
                sharers = splitRule.split(',')
                                 .map(name => name.trim())
                                 .filter(name => name); // Rimuovi stringhe vuote
                // Validazione Sharers
                sharers.forEach(sharerName => {
                    if (!participantNames.includes(sharerName)) {
                         calculationErrors.push(`Riga ${index + 1} ("${item.description}"): Membro divisione "${sharerName}" non trovato tra i partecipanti.`);
                         // Potremmo decidere di fermare il calcolo per questa riga o continuare senza di lui
                    }
                });
                 // Filtra via i nomi non validi trovati
                 sharers = sharers.filter(name => participantNames.includes(name));
            }

            if (sharers.length === 0) {
                 calculationErrors.push(`Riga ${index + 1} ("${item.description}"): Nessun partecipante valido trovato per la divisione (splitBetween: "${splitRule}").`);
                return; // Salta questa spesa se non ci sono partecipanti validi
            }

            const costPerSharer = actualCost / sharers.length;
            totalSharedExpense += actualCost;

            // Aggiorna saldi: Aggiungi al pagatore, Sottrai a chi condivide
            balances[payerName] += actualCost;
            sharers.forEach(sharerName => {
                 if (balances[sharerName] !== undefined) { // Controllo aggiuntivo
                    balances[sharerName] -= costPerSharer;
                 }
            });
        });

        // Arrotonda i saldi a 2 decimali per evitare errori di floating point
        for (const name in balances) {
            balances[name] = Math.round(balances[name] * 100) / 100;
        }

        return { balances, totalSharedExpense, errors: calculationErrors };
    };

    const renderBalanceResults = (result) => {
        if (!balanceResultsContainer || !balanceResultsUl || !balanceSummaryDiv || !balanceErrorMessageP) return;

        balanceResultsUl.innerHTML = '';
        balanceSummaryDiv.innerHTML = '';
        balanceErrorMessageP.textContent = '';
        balanceErrorMessageP.style.display = 'none';
        balanceResultsContainer.style.display = 'block';

        if (result.error) {
            balanceErrorMessageP.textContent = `Errore: ${result.error}`;
            balanceErrorMessageP.style.display = 'block';
            return;
        }

        const { balances, totalSharedExpense, errors } = result;

        let hasBalances = false;
        Object.entries(balances).forEach(([name, balance]) => {
            hasBalances = true;
            const li = document.createElement('li');
            const nameSpan = document.createElement('span');
            const balanceSpan = document.createElement('span');

            nameSpan.textContent = name;
            balanceSpan.textContent = formatCurrency(balance);

            if (balance > 0.005) { // Usa una piccola tolleranza per lo zero
                li.classList.add('positive-balance');
                 nameSpan.textContent += " (Deve Ricevere)";
            } else if (balance < -0.005) {
                li.classList.add('negative-balance');
                 nameSpan.textContent += " (Deve Dare)";
                 balanceSpan.textContent = formatCurrency(Math.abs(balance)); // Mostra importo positivo da dare
            } else {
                 nameSpan.textContent += " (Saldo 0)";
                 balanceSpan.textContent = formatCurrency(0); // Forza zero
            }

            li.appendChild(nameSpan);
            li.appendChild(balanceSpan);
            balanceResultsUl.appendChild(li);
        });

        if (!hasBalances && errors.length === 0) {
             balanceResultsUl.innerHTML = '<li>Nessun calcolo da effettuare (forse mancano partecipanti o spese divise).</li>';
        }

        balanceSummaryDiv.textContent = `Spesa Totale Divisa: ${formatCurrency(totalSharedExpense)}`;

        // Mostra errori di calcolo se presenti
        if (errors.length > 0) {
            balanceErrorMessageP.innerHTML = `<strong>Attenzione, si sono verificati errori durante il calcolo:</strong><br>` + errors.join('<br>');
            balanceErrorMessageP.style.display = 'block';
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

        // NUOVO: Listener per Calcolo Bilancio Spese
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
