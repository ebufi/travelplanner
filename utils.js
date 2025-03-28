// js/utils.js
import { DEFAULT_LOCALE, DEFAULT_CURRENCY } from './config.js';

export const generateId = (prefix = 'item') => `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;

export const formatCurrency = (amount) => {
    const num = amount === null || typeof amount === 'undefined' ? 0 : Number(amount);
    if (isNaN(num)) { console.warn(`Valore non numerico per formatCurrency: ${amount}`); return new Intl.NumberFormat(DEFAULT_LOCALE, { style: 'currency', currency: DEFAULT_CURRENCY }).format(0); }
    return new Intl.NumberFormat(DEFAULT_LOCALE, { style: 'currency', currency: DEFAULT_CURRENCY }).format(num);
};

export const formatDate = (dateString) => {
    if (!dateString || typeof dateString !== 'string') return '';
    try { const parts = dateString.split('-'); if (parts.length !== 3) return ''; const year = parseInt(parts[0]), month = parseInt(parts[1]), day = parseInt(parts[2]); if (isNaN(year) || isNaN(month) || isNaN(day) || month < 1 || month > 12 || day < 1 || day > 31) return ''; const date = new Date(Date.UTC(year, month - 1, day)); if (isNaN(date.getTime()) || date.getUTCFullYear() !== year || date.getUTCMonth() + 1 !== month || date.getUTCDate() !== day) return ''; return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`; } catch (e) { return ''; }
};

export const formatDateTime = (dateTimeString) => {
    if (!dateTimeString || typeof dateTimeString !== 'string') return '';
    try { const date = new Date(dateTimeString); if (isNaN(date.getTime())) return ''; const day = String(date.getDate()).padStart(2, '0'); const month = String(date.getMonth() + 1).padStart(2, '0'); const year = date.getFullYear(); const hours = String(date.getHours()).padStart(2, '0'); const minutes = String(date.getMinutes()).padStart(2, '0'); return `${day}/${month}/${year} ${hours}:${minutes}`; } catch (e) { return ''; }
};

export const formatSkyscannerDate = (isoDateString) => {
    if (!isoDateString || typeof isoDateString !== 'string' || !isoDateString.match(/^\d{4}-\d{2}-\d{2}$/)) return null;
    try { const year = isoDateString.substring(2, 4); const month = isoDateString.substring(5, 7); const day = isoDateString.substring(8, 10); return `${year}${month}${day}`; } catch (e) { console.error("Errore formattazione data Skyscanner:", e); return null; }
};

// Funzioni Modals & Toast spostate in ui.js o mantenute qui se generiche
// Per ora le lasciamo qui assumendo che gli elementi DOM siano trovati globalmente o passati
// (Idealmente, ui.js dovrebbe gestire l'interazione diretta con gli elementi modal/toast)

export const showToast = (message, type = 'info') => {
    const toastContainer = document.getElementById('toast-container'); // Query diretta qui
    if (!toastContainer) return;
    const toast = document.createElement('div'); toast.className = `toast ${type}`;
    let iconClass = 'fas fa-info-circle'; if (type === 'success') iconClass = 'fas fa-check-circle'; if (type === 'error') iconClass = 'fas fa-exclamation-circle';
    toast.innerHTML = `<i class="${iconClass}"></i> ${message}`; toastContainer.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => { toast.classList.remove('show'); toast.addEventListener('transitionend', () => toast.remove(), { once: true }); }, 3000);
};

// Le funzioni modal richiedono gestione callback, le definiamo in main.js
// dove il callback può essere gestito più facilmente.
// Esportiamo solo le funzioni base di apertura/chiusura se necessario
export const openModal = (modalElement) => { if (modalElement) modalElement.style.display = 'block'; };
export const closeModal = (modalElement) => { if (modalElement) modalElement.style.display = 'none'; };

export const getTransportIcon = (type) => {
    switch(type) { case 'Volo': return 'fa-plane-departure'; case 'Treno': return 'fa-train'; case 'Auto': return 'fa-car'; case 'Bus': return 'fa-bus-alt'; case 'Traghetto': return 'fa-ship'; case 'Metro/Mezzi Pubblici': return 'fa-subway'; case 'Taxi/Ride Sharing': return 'fa-taxi'; default: return 'fa-road'; }
};
