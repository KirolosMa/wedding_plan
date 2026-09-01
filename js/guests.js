import { supabase } from './supabaseClient.js';
import { renderNav } from './nav.js';
import { escapeHtml, showBanner, readFields } from './utils.js';

const bodyEl = document.getElementById('items-body');
const addForm = document.getElementById('add-item-form');
const filterSelect = document.getElementById('filter-select');
const banner = document.getElementById('banner');
const statInvited = document.getElementById('stat-invited');
const statYes = document.getElementById('stat-yes');
const statNo = document.getElementById('stat-no');
const statPending = document.getElementById('stat-pending');

let guests = [];

async function loadGuests() {
  const { data, error } = await supabase.from('guests').select('*');
  if (error) {
    showBanner(banner, `Could not load guests: ${error.message}`);
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
  let list = [...guests];
  if (filterSelect.value !== 'all') list = list.filter((g) => g.rsvp_status === filterSelect.value);
  list.sort((a, b) => a.name.localeCompare(b.name));

  bodyEl.innerHTML = '';
  if (list.length === 0) {
    bodyEl.innerHTML = '<tr><td colspan="8" class="muted">No guests yet — add your first one above.</td></tr>';
    return;
  }
  for (const guest of list) bodyEl.appendChild(buildRow(guest));
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
  row.querySelector('[data-action="save"]').addEventListener('click', () => saveGuest(guest.id, row));
  row.querySelector('[data-action="delete"]').addEventListener('click', () => deleteGuest(guest.id));
  return row;
}

async function saveGuest(id, row) {
  const fields = readFields(row);
  const { error } = await supabase.from('guests').update(fields).eq('id', id);
  if (error) {
    showBanner(banner, `Could not save guest: ${error.message}`);
    return;
  }
  await loadGuests();
  showBanner(banner, 'Saved.', 'success');
}

async function deleteGuest(id) {
  if (!confirm('Delete this guest?')) return;
  const { error } = await supabase.from('guests').delete().eq('id', id);
  if (error) {
    showBanner(banner, `Could not delete guest: ${error.message}`);
    return;
  }
  await loadGuests();
}

addForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const payload = readFields(addForm);
  if (!payload.name) return;
  const { error } = await supabase.from('guests').insert(payload);
  if (error) {
    showBanner(banner, `Could not add guest: ${error.message}`);
    return;
  }
  addForm.reset();
  await loadGuests();
});

filterSelect.addEventListener('change', renderGuests);

async function init() {
  renderNav('guests');
  await loadGuests();
}

init();
