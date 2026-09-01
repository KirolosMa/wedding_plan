import { supabase } from './supabaseClient.js';
import { renderNav } from './nav.js';
import {
  escapeHtml,
  showToast,
  readFields,
  flashSaved,
  trackDirty,
  matchesSearch,
  formatCurrency,
  linkify,
  extractLinks,
  anchorHtml,
  telHref,
  whatsappHref,
} from './utils.js';

const STATUSES = ['considering', 'contacted', 'booked', 'paid'];

const listEl = document.getElementById('vendors-list');
const addForm = document.getElementById('add-item-form');
const filterSelect = document.getElementById('filter-select');
const searchInput = document.getElementById('search-input');
const resultCount = document.getElementById('result-count');

let vendors = [];

function setMessage(html) {
  listEl.innerHTML = `<div class="state-message">${html}</div>`;
}

async function loadVendors() {
  setMessage('Loading vendors…');
  const { data, error } = await supabase.from('vendors').select('*');
  if (error) {
    showToast(`Could not load vendors: ${error.message}`);
    setMessage('Could not load vendors.');
    return;
  }
  vendors = data;
  renderFilterOptions();
  renderVendors();
}

function renderFilterOptions() {
  const categories = [...new Set(vendors.map((v) => v.category).filter(Boolean))].sort();
  const current = filterSelect.value;
  filterSelect.innerHTML = '<option value="all">All</option>' +
    categories.map((c) => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('');
  if (categories.includes(current)) filterSelect.value = current;
}

function renderVendors() {
  const term = searchInput.value;
  let list = [...vendors];
  if (filterSelect.value !== 'all') list = list.filter((v) => v.category === filterSelect.value);
  list = list.filter((v) => matchesSearch(term, v.name, v.category, v.contact_name, v.contact_email, v.contact_phone, v.notes, v.status));
  list.sort((a, b) => (a.category ?? '').localeCompare(b.category ?? '') || a.name.localeCompare(b.name));

  resultCount.textContent = vendors.length ? `Showing ${list.length} of ${vendors.length} vendors` : '';

  if (list.length === 0) {
    const isFiltered = term.trim() || filterSelect.value !== 'all';
    setMessage(
      isFiltered
        ? '<strong>No matching vendors</strong>Try a different search or category.'
        : '<strong>No vendors yet</strong>Use “Add a vendor” above to start tracking.'
    );
    return;
  }

  listEl.innerHTML = '';
  const fragment = document.createDocumentFragment();
  for (const vendor of list) fragment.appendChild(buildCard(vendor));
  listEl.appendChild(fragment);
}

const SITE_ICONS = [
  [/instagram\.com/i, '📷', (link) => `@${link.label.split('/')[1] ?? 'Instagram'}`],
  [/facebook\.com|fb\.(me|com)/i, '📘', () => 'Facebook'],
  [/tiktok\.com/i, '🎵', () => 'TikTok'],
  [/youtube\.com|youtu\.be/i, '▶️', () => 'YouTube'],
  [/wa\.me|whatsapp\.com/i, '💬', () => 'WhatsApp'],
  [/maps\.(google|app\.goo)|goo\.gl\/maps/i, '📍', () => 'Map'],
];

function chip(link, icon, text) {
  return anchorHtml({ ...link, label: `${icon} ${text}` }, 'chip');
}

function siteChip(link) {
  const match = SITE_ICONS.find(([pattern]) => pattern.test(link.href));
  if (!match) return chip(link, '🔗', link.label.split('/')[0]);
  const [, icon, label] = match;
  return chip(link, icon, label(link));
}

// A phone field often holds several numbers ("+20100… / +20122…"), each of which needs its own link.
function splitPhones(value) {
  return String(value ?? '')
    .split(/\s*(?:\/|,|;|&|\bor\b)\s*/i)
    .map((part) => part.trim())
    .filter((part) => part.replace(/\D/g, '').length >= 8);
}

function contactBlock(vendor) {
  const lines = [];
  const detail = [vendor.contact_name, vendor.contact_phone].filter(Boolean).map(escapeHtml).join(' · ');
  if (detail) lines.push(`<p class="detail-contact">${detail}</p>`);

  const chips = [];
  const phones = splitPhones(vendor.contact_phone);
  for (const phone of phones) {
    const suffix = phones.length > 1 ? ` …${phone.replace(/\D/g, '').slice(-4)}` : '';
    const tel = telHref(phone);
    const whatsapp = whatsappHref(phone);
    if (tel) chips.push(chip({ href: tel, label: 'Call' }, '📞', `Call${suffix}`));
    if (whatsapp) chips.push(chip({ href: whatsapp, label: 'WhatsApp', external: true }, '💬', `WhatsApp${suffix}`));
  }
  if (vendor.contact_email) {
    chips.push(chip({ href: `mailto:${vendor.contact_email}`, label: 'Email' }, '✉️', 'Email'));
  }
  for (const link of extractLinks(vendor.notes)) chips.push(siteChip(link));

  if (chips.length) lines.push(`<div class="chip-row">${chips.join('')}</div>`);
  return lines.join('');
}

function buildCard(vendor) {
  const card = document.createElement('div');
  card.className = 'card';
  card.innerHTML = `
    <div class="card-heading">
      <h3>${escapeHtml(vendor.name)}</h3>
      <span class="badge badge-${vendor.status}">${vendor.status}</span>
    </div>
    <p class="card-summary muted">${escapeHtml(vendor.category ?? 'Uncategorised')}${
      vendor.price ? ` · ${formatCurrency(vendor.price)}` : ''
    }</p>
    ${contactBlock(vendor)}
    ${
      vendor.notes
        ? `<div class="detail"><span class="detail-label">Notes</span><p class="${
            vendor.notes.length > 220 ? 'clampable' : ''
          }">${linkify(vendor.notes)}</p></div>`
        : ''
    }

    <details class="edit-details">
      <summary>Edit</summary>
      <div class="form-grid">
        <label>Category<input type="text" data-field="category" value="${escapeHtml(vendor.category ?? '')}" /></label>
        <label>Name<input type="text" data-field="name" value="${escapeHtml(vendor.name)}" /></label>
        <label>Contact name<input type="text" data-field="contact_name" value="${escapeHtml(vendor.contact_name ?? '')}" /></label>
        <label>Email<input type="email" data-field="contact_email" value="${escapeHtml(vendor.contact_email ?? '')}" /></label>
        <label>Phone<input type="tel" data-field="contact_phone" value="${escapeHtml(vendor.contact_phone ?? '')}" /></label>
        <label>Price<input type="number" step="0.01" min="0" data-field="price" value="${vendor.price ?? ''}" /></label>
        <label>Status
          <select data-field="status">
            ${STATUSES.map((s) => `<option value="${s}" ${vendor.status === s ? 'selected' : ''}>${s[0].toUpperCase() + s.slice(1)}</option>`).join('')}
          </select>
        </label>
      </div>
      <label>Notes<textarea rows="4" data-field="notes">${escapeHtml(vendor.notes ?? '')}</textarea></label>
      <div class="card-actions">
        <button type="button" class="btn btn-primary" data-action="save">Save</button>
        <button type="button" class="btn btn-danger" data-action="delete">Delete</button>
      </div>
    </details>
  `;

  card.querySelector('[data-action="save"]').addEventListener('click', (e) => saveVendor(vendor, card, e.currentTarget));
  card.querySelector('[data-action="delete"]').addEventListener('click', () => deleteVendor(vendor));
  card.querySelectorAll('.clampable').forEach((p) =>
    p.addEventListener('click', (e) => {
      if (e.target.closest('a')) return;
      p.classList.toggle('expanded');
    })
  );
  trackDirty(card);
  return card;
}

// Re-renders the whole list so the read-only summary and grouping reflect the new values.
async function saveVendor(vendor, card, button) {
  const fields = readFields(card);
  const { error } = await supabase.from('vendors').update(fields).eq('id', vendor.id);
  if (error) {
    showToast(`Could not save vendor: ${error.message}`);
    return;
  }
  Object.assign(vendor, fields);
  card.classList.remove('is-dirty');
  flashSaved(button);
  showToast(`${vendor.name} saved.`, 'success');
  setTimeout(() => {
    renderFilterOptions();
    renderVendors();
  }, 1200);
}

async function deleteVendor(vendor) {
  if (!confirm(`Delete ${vendor.name} from your vendor list?`)) return;
  const { error } = await supabase.from('vendors').delete().eq('id', vendor.id);
  if (error) {
    showToast(`Could not delete vendor: ${error.message}`);
    return;
  }
  vendors = vendors.filter((v) => v.id !== vendor.id);
  renderFilterOptions();
  renderVendors();
  showToast(`${vendor.name} removed.`, 'success');
}

addForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const payload = readFields(addForm);
  if (!payload.name) return;
  const { error } = await supabase.from('vendors').insert(payload);
  if (error) {
    showToast(`Could not add vendor: ${error.message}`);
    return;
  }
  addForm.reset();
  await loadVendors();
  showToast(`${payload.name} added.`, 'success');
});

filterSelect.addEventListener('change', renderVendors);
searchInput.addEventListener('input', renderVendors);

async function init() {
  renderNav('vendors');
  await loadVendors();
}

init();
