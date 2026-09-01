import { supabase } from './supabaseClient.js';
import { renderNav } from './nav.js';
import {
  escapeHtml,
  showToast,
  readFields,
  flashSaved,
  trackDirty,
  matchesSearch,
  normalizePhone,
  isValidPhone,
  telHref,
  whatsappHref,
  toCsv,
  downloadFile,
} from './utils.js';

const COLUMNS = 9;

const bodyEl = document.getElementById('items-body');
const addForm = document.getElementById('add-item-form');
const filterSelect = document.getElementById('filter-select');
const sideSelect = document.getElementById('side-select');
const searchInput = document.getElementById('search-input');
const resultCount = document.getElementById('result-count');
const copyButton = document.getElementById('copy-numbers');
const exportButton = document.getElementById('export-csv');
const statInvited = document.getElementById('stat-invited');
const statYes = document.getElementById('stat-yes');
const statNo = document.getElementById('stat-no');
const statPending = document.getElementById('stat-pending');
const statNoPhone = document.getElementById('stat-no-phone');
const statHeads = document.getElementById('stat-heads');

let guests = [];
let visible = [];

function setLoading(message) {
  bodyEl.innerHTML = `<tr><td colspan="${COLUMNS}"><div class="state-message">${message}</div></td></tr>`;
}

async function loadGuests() {
  setLoading('Loading guests…');
  const { data, error } = await supabase.from('guests').select('*');
  if (error) {
    showToast(`Could not load guests: ${error.message}`);
    setLoading('Could not load guests.');
    return;
  }
  guests = data;
  renderAll();
}

function renderAll() {
  renderSummary();
  renderGuests();
}

function renderSummary() {
  const invited = guests.filter((g) => g.invited);
  const confirmed = guests.filter((g) => g.rsvp_status === 'yes');
  statInvited.textContent = invited.length;
  statYes.textContent = confirmed.length;
  statNo.textContent = guests.filter((g) => g.rsvp_status === 'no').length;
  statPending.textContent = guests.filter((g) => g.rsvp_status === 'pending').length;
  statHeads.textContent = `${confirmed.reduce((sum, g) => sum + (g.plus_one ? 2 : 1), 0)} seats incl. +1`;
  statNoPhone.textContent = invited.filter((g) => !isValidPhone(g.phone)).length;
}

function renderGuests() {
  const term = searchInput.value;
  let list = [...guests];
  if (filterSelect.value === 'no-phone') list = list.filter((g) => !isValidPhone(g.phone));
  else if (filterSelect.value !== 'all') list = list.filter((g) => g.rsvp_status === filterSelect.value);
  if (sideSelect.value !== 'all') list = list.filter((g) => g.side === sideSelect.value);
  list = list.filter((g) => matchesSearch(term, g.name, g.phone, g.meal_choice, g.notes, g.side));
  list.sort((a, b) => a.name.localeCompare(b.name));
  visible = list;

  resultCount.textContent = guests.length
    ? `Showing ${list.length} of ${guests.length} guests`
    : '';

  bodyEl.innerHTML = '';
  if (list.length === 0) {
    const isFiltered = term.trim() || filterSelect.value !== 'all' || sideSelect.value !== 'all';
    bodyEl.innerHTML = `<tr><td colspan="${COLUMNS}"><div class="state-message">${
      isFiltered
        ? '<strong>No matching guests</strong>Try a different search or filter.'
        : '<strong>No guests yet</strong>Use “Add a guest” above to start your list.'
    }</div></td></tr>`;
    return;
  }

  const fragment = document.createDocumentFragment();
  for (const guest of list) fragment.appendChild(buildRow(guest));
  bodyEl.appendChild(fragment);
}

function phoneActions(guest) {
  if (!isValidPhone(guest.phone)) {
    return `<span class="phone-warning">${guest.phone ? '⚠︎ check' : 'No mobile'}</span>`;
  }
  return `
    <a class="icon-link" href="${escapeHtml(telHref(guest.phone))}" title="Call ${escapeHtml(guest.name)}" aria-label="Call ${escapeHtml(guest.name)}">📞</a>
    <a class="icon-link" href="${escapeHtml(whatsappHref(guest.phone))}" target="_blank" rel="noopener noreferrer" title="WhatsApp ${escapeHtml(guest.name)}" aria-label="WhatsApp ${escapeHtml(guest.name)}">💬</a>
  `;
}

function buildRow(guest) {
  const row = document.createElement('tr');
  row.innerHTML = `
    <td data-label="Name" class="col-title"><input type="text" data-field="name" value="${escapeHtml(guest.name)}" /></td>
    <td data-label="Mobile">
      <div class="phone-cell">
        <input type="tel" data-field="phone" autocomplete="tel" placeholder="+20 100 123 4567" value="${escapeHtml(guest.phone ?? '')}" />
        <span class="phone-actions">${phoneActions(guest)}</span>
      </div>
    </td>
    <td data-label="Side">
      <select data-field="side">
        <option value="bride" ${guest.side === 'bride' ? 'selected' : ''}>Bride</option>
        <option value="groom" ${guest.side === 'groom' ? 'selected' : ''}>Groom</option>
        <option value="both" ${guest.side === 'both' ? 'selected' : ''}>Both</option>
      </select>
    </td>
    <td data-label="Invited" class="col-check"><input type="checkbox" data-field="invited" ${guest.invited ? 'checked' : ''} /></td>
    <td data-label="RSVP">
      <select data-field="rsvp_status">
        <option value="pending" ${guest.rsvp_status === 'pending' ? 'selected' : ''}>Pending</option>
        <option value="yes" ${guest.rsvp_status === 'yes' ? 'selected' : ''}>Yes</option>
        <option value="no" ${guest.rsvp_status === 'no' ? 'selected' : ''}>No</option>
      </select>
    </td>
    <td data-label="Meal"><input type="text" data-field="meal_choice" value="${escapeHtml(guest.meal_choice ?? '')}" /></td>
    <td data-label="+1" class="col-check"><input type="checkbox" data-field="plus_one" ${guest.plus_one ? 'checked' : ''} /></td>
    <td data-label="Notes" class="col-notes"><input type="text" data-field="notes" value="${escapeHtml(guest.notes ?? '')}" /></td>
    <td class="row-actions">
      <button type="button" class="btn btn-primary" data-action="save">Save</button>
      <button type="button" class="btn btn-danger" data-action="delete">Delete</button>
    </td>
  `;
  const saveButton = row.querySelector('[data-action="save"]');
  saveButton.addEventListener('click', () => saveGuest(guest, row, saveButton));
  row.querySelector('[data-action="delete"]').addEventListener('click', () => deleteGuest(guest));
  row.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && event.target.matches('input:not([type=checkbox])')) {
      event.preventDefault();
      saveGuest(guest, row, saveButton);
    }
  });
  trackDirty(row);
  return row;
}

// Updates local state instead of refetching so the list doesn't jump back to the top mid-edit.
async function saveGuest(guest, row, button) {
  const fields = readFields(row);
  fields.phone = normalizePhone(fields.phone);
  const { error } = await supabase.from('guests').update(fields).eq('id', guest.id);
  if (error) {
    showToast(missingPhoneColumn(error) ?? `Could not save guest: ${error.message}`);
    return;
  }
  Object.assign(guest, fields);
  row.classList.remove('is-dirty');
  row.querySelector('[data-field="phone"]').value = guest.phone ?? '';
  row.querySelector('.phone-actions').innerHTML = phoneActions(guest);
  flashSaved(button);
  renderSummary();
}

async function deleteGuest(guest) {
  if (!confirm(`Delete ${guest.name} from the guest list?`)) return;
  const { error } = await supabase.from('guests').delete().eq('id', guest.id);
  if (error) {
    showToast(`Could not delete guest: ${error.message}`);
    return;
  }
  guests = guests.filter((g) => g.id !== guest.id);
  renderAll();
  showToast(`${guest.name} removed.`, 'success');
}

// The phone column ships as a migration, so point at it instead of leaking a raw Postgres error.
function missingPhoneColumn(error) {
  const message = error.message ?? '';
  return /phone/i.test(message) && /(does not exist|schema cache)/i.test(message)
    ? 'Mobile numbers need one setup step: run supabase/migration_add_guest_phone.sql in the Supabase SQL editor.'
    : null;
}

addForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const payload = readFields(addForm);
  if (!payload.name) return;
  payload.phone = normalizePhone(payload.phone);
  const { error } = await supabase.from('guests').insert(payload);
  if (error) {
    showToast(missingPhoneColumn(error) ?? `Could not add guest: ${error.message}`);
    return;
  }
  addForm.reset();
  await loadGuests();
  showToast(`${payload.name} added.`, 'success');
});

// Both exports follow the current filters, so "invited, no RSVP yet" lists are one click away.
copyButton.addEventListener('click', async () => {
  const numbers = [...new Set(visible.map((g) => normalizePhone(g.phone)).filter(isValidPhone))];
  if (!numbers.length) {
    showToast('No usable mobile numbers in the current view.');
    return;
  }
  try {
    await navigator.clipboard.writeText(numbers.join('\n'));
    showToast(`Copied ${numbers.length} mobile numbers.`, 'success');
  } catch {
    showToast('Clipboard blocked by the browser — use Export CSV instead.');
  }
});

exportButton.addEventListener('click', () => {
  if (!visible.length) {
    showToast('Nothing to export in the current view.');
    return;
  }
  const rows = [
    ['Name', 'Mobile', 'Side', 'Invited', 'RSVP', 'Meal', 'Plus one', 'Notes'],
    ...visible.map((g) => [
      g.name,
      normalizePhone(g.phone) ?? '',
      g.side ?? '',
      g.invited ? 'yes' : 'no',
      g.rsvp_status,
      g.meal_choice ?? '',
      g.plus_one ? 'yes' : 'no',
      g.notes ?? '',
    ]),
  ];
  downloadFile(`guest-list-${new Date().toISOString().slice(0, 10)}.csv`, toCsv(rows));
});

window.addEventListener('beforeunload', (event) => {
  if (!bodyEl.querySelector('tr.is-dirty')) return;
  event.preventDefault();
  event.returnValue = '';
});

filterSelect.addEventListener('change', renderGuests);
sideSelect.addEventListener('change', renderGuests);
searchInput.addEventListener('input', renderGuests);

async function init() {
  renderNav('guests');
  await loadGuests();
}

init();
