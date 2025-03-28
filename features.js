// js/features.js
import { PREDEFINED_PACKING_LISTS } from './config.js';
import * as state from './state.js';
import * as ui from './ui.js';
import { showToast, formatCurrency, formatSkyscannerDate } from './utils.js';

export const handleImportPackingList = (type) => {
    const currentTripId = state.getCurrentTripId();
    if (!currentTripId || !PREDEFINED_PACKING_LISTS[type]) return;
    const trip = state.getCurrentTrip(); if (!trip) return;
    const predefined = PREDEFINED_PACKING_LISTS[type]; let added = 0;
    trip.packingList = Array.isArray(trip.packingList) ? trip.packingList : [];
    const currentLower = trip.packingList.map(i => (i?.name || '').toLowerCase());
    predefined.forEach(name => { if (!currentLower.includes(name.toLowerCase())) { const addedItem = state.addTripItem(currentTripId, 'packing', { name: name }); if(addedItem) added++; }}); // Usa addTripItem
    if (added > 0) { ui.renderPackingList(state.getCurrentTrip().packingList); showToast(`${added} oggetti aggiunti!`, 'success'); }
    else { showToast(`Nessun nuovo oggetto da aggiungere.`, 'info'); }
};

export const handleCalculateAndAddTransportCost = () => {
    const currentTripId = state.getCurrentTripId();
    if (!currentTripId) { showToast("Seleziona un viaggio.", "error"); return; }
    const trip = state.getCurrentTrip(); if (!trip || !Array.isArray(trip.transportations)) { showToast("Errore dati trasporti.", "error"); return; }
    let totalCost = 0; trip.transportations.forEach(item => { const cost = Number(item?.cost || 0); if (!isNaN(cost) && cost > 0) { totalCost += cost; } });
    if (totalCost <= 0) { showToast("Nessun costo trasporto trovato.", "info"); return; }
    const item = { category: "Trasporti", description: `Totale Costi Trasporti (del ${formatDate(new Date().toISOString().slice(0,10))})`, estimated: totalCost, actual: null };
    const success = state.addTripItem(currentTripId, 'budget', item); // Usa addTripItem
    if(success) {
        ui.renderBudget(state.getCurrentTrip().budget); showToast(`Costo trasporti (${formatCurrency(totalCost)}) aggiunto al budget!`, 'success'); ui.switchTab('budget-tab');
    } else {
         showToast("Errore aggiunta costo al budget.", "error");
    }
};

export const handleSearchFlights = () => {
    const originValue = document.getElementById('transport-departure-loc').value.trim(); // Leggi direttamente dal form
    const destinationValue = document.getElementById('transport-arrival-loc').value.trim();
    const startDateRaw = document.getElementById('transport-departure-datetime').value ? document.getElementById('transport-departure-datetime').value.split('T')[0] : '';
    const endDateRaw = document.getElementById('transport-arrival-datetime').value ? document.getElementById('transport-arrival-datetime').value.split('T')[0] : '';
    const startDateSkyscanner = formatSkyscannerDate(startDateRaw); const endDateSkyscanner = formatSkyscannerDate(endDateRaw);
    if (!originValue || !destinationValue) { showToast("Inserisci Origine e Destinazione nel form trasporti.", "warning"); return; }
    if (!startDateSkyscanner || !endDateSkyscanner) { showToast("Inserisci date valide nel form trasporti.", "warning"); return; }
    if (startDateRaw && endDateRaw && startDateRaw > endDateRaw) { showToast("Data arrivo non valida.", "warning"); return; }
    const baseUrl = "https://www.skyscanner.it/trasporti/voli/"; const originCode = originValue.toLowerCase().replace(/\s+/g, '-') || 'anywhere'; const destinationCode = destinationValue.toLowerCase().replace(/\s+/g, '-') || 'anywhere';
    const searchUrl = `${baseUrl}${originCode}/${destinationCode}/${startDateSkyscanner}/${endDateSkyscanner}/?rtn=1&adults=1&children=0&infants=0&cabinclass=economy&preferdirects=false`;
    console.log("Apertura URL Skyscanner:", searchUrl); window.open(searchUrl, '_blank', 'noopener,noreferrer');
};

export const handleSearchTrains = () => {
    const originValue = document.getElementById('transport-departure-loc').value.trim(); const destinationValue = document.getElementById('transport-arrival-loc').value.trim();
    const startDateRaw = document.getElementById('transport-departure-datetime').value ? document.getElementById('transport-departure-datetime').value.split('T')[0] : '';
    const endDateRaw = document.getElementById('transport-arrival-datetime').value ? document.getElementById('transport-arrival-datetime').value.split('T')[0] : '';
    if (!originValue || !destinationValue) { showToast("Inserisci Origine e Destinazione nel form.", "warning"); return; }
    if (!startDateRaw.match(/^\d{4}-\d{2}-\d{2}$/) || !endDateRaw.match(/^\d{4}-\d{2}-\d{2}$/)) { showToast("Inserisci Date valide (AAAA-MM-GG) nel form.", "warning"); return; }
    if (startDateRaw > endDateRaw) { showToast("Data arrivo non valida.", "warning"); return; }
    const baseUrl = "https://www.thetrainline.com/it/orari-treni/"; const originFormatted = originValue.toUpperCase().replace(/\s+/g, '-'); const destinationFormatted = destinationValue.toUpperCase().replace(/\s+/g, '-');
    const searchUrl = `${baseUrl}${originFormatted}-a-${destinationFormatted}?departureDate=${startDateRaw}&returnDate=${endDateRaw}&adults=1`;
    console.log("Apertura URL Trainline:", searchUrl); window.open(searchUrl, '_blank', 'noopener,noreferrer');
};
