import { supabase } from './supabaseClient.js';
import { renderNav } from './nav.js';
import { renderViewToggle } from './viewToggle.js';
import { parseVCards, preferredPhone } from './vcard.js';
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

const COLUMNS = 11;

const bodyEl = document.getElementById('items-body');
const addForm = document.getElementById('add-item-form');
const filterSelect = document.getElementById('filter-select');
const sideSelect = document.getElementById('side-select');
const searchInput = document.getElementById('search-input');
const resultCount = document.getElementById('result-count');
const copyButton = document.getElementById('copy-numbers');
const exportButton = document.getElementById('export-csv');
const importInput = document.getElementById('import-vcf');
const importStatus = document.getElementById('import-status');
const importActions = document.getElementById('import-actions');
const importApply = document.getElementById('import-apply');
const importCancel = document.getElementById('import-cancel');
const statInvited = document.getElementById('stat-invited');
const statYes = document.getElementById('stat-yes');
const statNo = document.getElementById('stat-no');
const statPending = document.getElementById('stat-pending');
const statNoPhone = document.getElementById('stat-no-phone');
const statChurch = document.getElementById('stat-church');
const statVenue = document.getElementById('stat-venue');
const statHeads = document.getElementById('stat-heads');

let guests = [];
let visible = [];
let pendingImport = [];

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
  statHeads.textContent = `${confirmed.reduce((sum, g) => sum + (g.plus_one ? 2 : 1), 0)} incl. +1`;
  statNoPhone.textContent = invited.filter((g) => !isValidPhone(g.phone)).length;
  statChurch.textContent = invited.filter((g) => g.invited_church).length;
  statVenue.textContent = invited.filter((g) => g.invited_venue).length;
}

function renderGuests() {
  const term = searchInput.value;
  let list = [...guests];
  if (filterSelect.value === 'no-phone') list = list.filter((g) => !isValidPhone(g.phone));
  else if (filterSelect.value === 'church') list = list.filter((g) => g.invited_church);
  else if (filterSelect.value === 'venue') list = list.filter((g) => g.invited_venue);
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
    <td data-label="Church" class="col-check"><input type="checkbox" data-field="invited_church" ${guest.invited_church ? 'checked' : ''} /></td>
    <td data-label="Venue" class="col-check"><input type="checkbox" data-field="invited_venue" ${guest.invited_venue ? 'checked' : ''} /></td>
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
    showToast(missingPhoneColumn(error) ?? missingInviteColumns(error) ?? `Could not save guest: ${error.message}`);
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

// Same idea for the church/venue invite columns, which also ship as a migration.
function missingInviteColumns(error) {
  const message = error.message ?? '';
  return /invited_(church|venue)/i.test(message) && /(does not exist|schema cache)/i.test(message)
    ? 'Church/venue invites need one setup step: run supabase/migration_add_guest_church_venue.sql in the Supabase SQL editor.'
    : null;
}

addForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const payload = readFields(addForm);
  if (!payload.name) return;
  payload.phone = normalizePhone(payload.phone);
  const { error } = await supabase.from('guests').insert(payload);
  if (error) {
    showToast(missingPhoneColumn(error) ?? missingInviteColumns(error) ?? `Could not add guest: ${error.message}`);
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
    ['Name', 'Mobile', 'Side', 'Invited', 'Church', 'Venue', 'RSVP', 'Meal', 'Plus one', 'Notes'],
    ...visible.map((g) => [
      g.name,
      normalizePhone(g.phone) ?? '',
      g.side ?? '',
      g.invited ? 'yes' : 'no',
      g.invited_church ? 'yes' : 'no',
      g.invited_venue ? 'yes' : 'no',
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

// Names are compared without accents, punctuation or case so "Marie-Thérèse" matches "marie therese".
function nameKey(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Exact name match first; otherwise a guest matches only if exactly one contact contains all
// of their name words, so "Gihan" never silently picks one of several Gihans.
function matchGuests(cards) {
  const contacts = cards
    .map((card) => ({ name: card.name, key: nameKey(card.name), phone: preferredPhone(card) }))
    .filter((c) => c.key && c.phone && isValidPhone(c.phone));

  const byKey = new Map();
  for (const contact of contacts) {
    const existing = byKey.get(contact.key);
    if (existing && normalizePhone(existing.phone) !== normalizePhone(contact.phone)) {
      existing.ambiguous = true;
    } else if (!existing) {
      byKey.set(contact.key, { ...contact });
    }
  }

  const updates = [];
  const result = { contacts: contacts.length, updates, alreadySet: 0, unmatched: 0, ambiguous: 0 };

  for (const guest of guests) {
    if (isValidPhone(guest.phone)) {
      result.alreadySet += 1;
      continue;
    }
    const key = nameKey(guest.name);
    if (!key) continue;

    let match = byKey.get(key);
    if (match?.ambiguous) {
      result.ambiguous += 1;
      continue;
    }
    if (!match) {
      const words = key.split(' ');
      const partial = contacts.filter((c) => words.every((word) => c.key.split(' ').includes(word)));
      if (partial.length > 1) {
        result.ambiguous += 1;
        continue;
      }
      match = partial[0];
    }
    if (!match) {
      result.unmatched += 1;
      continue;
    }
    updates.push({ guest, phone: normalizePhone(match.phone), contactName: match.name });
  }

  return result;
}

async function applyImport(updates) {
  let saved = 0;
  const failures = [];
  // Chunked so a large address book doesn't fire hundreds of requests at once.
  for (let i = 0; i < updates.length; i += 10) {
    const chunk = updates.slice(i, i + 10);
    const results = await Promise.all(
      chunk.map(({ guest, phone }) => supabase.from('guests').update({ phone }).eq('id', guest.id))
    );
    results.forEach(({ error }, index) => {
      if (error) {
        failures.push(`${chunk[index].guest.name}: ${error.message}`);
        return;
      }
      chunk[index].guest.phone = chunk[index].phone;
      saved += 1;
    });
  }
  return { saved, failures };
}

importInput.addEventListener('change', async () => {
  const file = importInput.files?.[0];
  if (!file) return;
  importStatus.textContent = `Reading ${file.name}…`;
  importActions.hidden = true;

  let cards = [];
  try {
    cards = parseVCards(await file.text());
  } catch (error) {
    importStatus.textContent = `Could not read that file: ${error.message}`;
    return;
  }
  importInput.value = '';

  if (!cards.length) {
    importStatus.textContent = 'No contacts found in that file — make sure it is a .vcf export.';
    return;
  }

  const { contacts, updates, alreadySet, unmatched, ambiguous } = matchGuests(cards);
  pendingImport = updates;
  importStatus.textContent =
    `${cards.length} contacts read (${contacts} with a usable mobile) · ` +
    `${updates.length} guests can be filled in · ${alreadySet} already have a mobile · ` +
    `${unmatched} without a matching contact · ${ambiguous} skipped as ambiguous`;

  if (!updates.length) return;
  importApply.textContent = `Apply ${updates.length} mobile number${updates.length === 1 ? '' : 's'}`;
  importActions.hidden = false;
});

importCancel.addEventListener('click', () => {
  pendingImport = [];
  importActions.hidden = true;
  importStatus.textContent = 'Import cancelled.';
});

importApply.addEventListener('click', async () => {
  if (!pendingImport.length) return;
  const updates = pendingImport;
  pendingImport = [];
  importActions.hidden = true;
  importStatus.textContent = `Saving ${updates.length} numbers…`;

  const { saved, failures } = await applyImport(updates);
  renderAll();
  const plural = saved === 1 ? '' : 's';
  importStatus.textContent = failures.length
    ? `Saved ${saved} number${plural}, ${failures.length} failed. First error — ${failures[0]}`
    : `Saved ${saved} mobile number${plural}.`;
  showToast(
    failures.length
      ? `Imported ${saved} number${plural}, ${failures.length} failed.`
      : `Imported ${saved} mobile number${plural}.`,
    failures.length ? 'error' : 'success'
  );
});

filterSelect.addEventListener('change', renderGuests);
sideSelect.addEventListener('change', renderGuests);
searchInput.addEventListener('input', renderGuests);

async function init() {
  renderNav('guests');
  renderViewToggle();
  await loadGuests();
}

init();
