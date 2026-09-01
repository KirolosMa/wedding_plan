import { supabase } from './supabaseClient.js';
import { renderNav } from './nav.js';
import { escapeHtml, showToast, readFields, flashSaved, trackDirty, matchesSearch } from './utils.js';

const bodyEl = document.getElementById('items-body');
const addForm = document.getElementById('add-item-form');
const filterSelect = document.getElementById('filter-select');
const searchInput = document.getElementById('search-input');
const resultCount = document.getElementById('result-count');
const statInvited = document.getElementById('stat-invited');
const statYes = document.getElementById('stat-yes');
const statNo = document.getElementById('stat-no');
const statPending = document.getElementById('stat-pending');

let guests = [];

function setLoading(message) {
  bodyEl.innerHTML = `<tr><td colspan="8"><div class="state-message">${message}</div></td></tr>`;
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
  statInvited.textContent = guests.filter((g) => g.invited).length;
  statYes.textContent = guests.filter((g) => g.rsvp_status === 'yes').length;
  statNo.textContent = guests.filter((g) => g.rsvp_status === 'no').length;
  statPending.textContent = guests.filter((g) => g.rsvp_status === 'pending').length;
}

function renderGuests() {
  const term = searchInput.value;
  let list = [...guests];
  if (filterSelect.value !== 'all') list = list.filter((g) => g.rsvp_status === filterSelect.value);
  list = list.filter((g) => matchesSearch(term, g.name, g.meal_choice, g.notes, g.side));
  list.sort((a, b) => a.name.localeCompare(b.name));

  resultCount.textContent = guests.length
    ? `Showing ${list.length} of ${guests.length} guests`
    : '';

  bodyEl.innerHTML = '';
  if (list.length === 0) {
    const isFiltered = term.trim() || filterSelect.value !== 'all';
    bodyEl.innerHTML = `<tr><td colspan="8"><div class="state-message">${
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

function buildRow(guest) {
  const row = document.createElement('tr');
  row.innerHTML = `
    <td><input type="text" data-field="name" value="${escapeHtml(guest.name)}" /></td>
    <td>
      <select data-field="side">
        <option value="bride" ${guest.side === 'bride' ? 'selected' : ''}>Bride</option>
        <option value="groom" ${guest.side === 'groom' ? 'selected' : ''}>Groom</option>
        <option value="both" ${guest.side === 'both' ? 'selected' : ''}>Both</option>
      </select>
    </td>
    <td><input type="checkbox" data-field="invited" ${guest.invited ? 'checked' : ''} /></td>
    <td>
      <select data-field="rsvp_status">
        <option value="pending" ${guest.rsvp_status === 'pending' ? 'selected' : ''}>Pending</option>
        <option value="yes" ${guest.rsvp_status === 'yes' ? 'selected' : ''}>Yes</option>
        <option value="no" ${guest.rsvp_status === 'no' ? 'selected' : ''}>No</option>
      </select>
    </td>
    <td><input type="text" data-field="meal_choice" value="${escapeHtml(guest.meal_choice ?? '')}" /></td>
    <td><input type="checkbox" data-field="plus_one" ${guest.plus_one ? 'checked' : ''} /></td>
    <td><input type="text" data-field="notes" value="${escapeHtml(guest.notes ?? '')}" /></td>
    <td class="row-actions">
      <button type="button" class="btn btn-primary" data-action="save">Save</button>
      <button type="button" class="btn btn-danger" data-action="delete">Delete</button>
    </td>
  `;
  row.querySelector('[data-action="save"]').addEventListener('click', (e) => saveGuest(guest, row, e.currentTarget));
  row.querySelector('[data-action="delete"]').addEventListener('click', () => deleteGuest(guest));
  trackDirty(row);
  return row;
}

// Updates local state instead of refetching so the list doesn't jump back to the top mid-edit.
async function saveGuest(guest, row, button) {
  const fields = readFields(row);
  const { error } = await supabase.from('guests').update(fields).eq('id', guest.id);
  if (error) {
    showToast(`Could not save guest: ${error.message}`);
    return;
  }
  Object.assign(guest, fields);
  row.classList.remove('is-dirty');
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

addForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const payload = readFields(addForm);
  if (!payload.name) return;
  const { error } = await supabase.from('guests').insert(payload);
  if (error) {
    showToast(`Could not add guest: ${error.message}`);
    return;
  }
  addForm.reset();
  await loadGuests();
  showToast(`${payload.name} added.`, 'success');
});

filterSelect.addEventListener('change', renderGuests);
searchInput.addEventListener('input', renderGuests);

async function init() {
  renderNav('guests');
  await loadGuests();
}

init();
