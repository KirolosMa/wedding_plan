import { supabase } from './supabaseClient.js';
import { requireSession, renderNav } from './auth.js';
import { escapeHtml, showBanner, readFields } from './utils.js';

const STATUSES = ['considering', 'contacted', 'booked', 'paid'];

const listEl = document.getElementById('vendors-list');
const addForm = document.getElementById('add-item-form');
const filterSelect = document.getElementById('filter-select');
const banner = document.getElementById('banner');

let vendors = [];

async function loadVendors() {
  const { data, error } = await supabase.from('vendors').select('*');
  if (error) {
    showBanner(banner, `Could not load vendors: ${error.message}`);
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
  let list = [...vendors];
  if (filterSelect.value !== 'all') list = list.filter((v) => v.category === filterSelect.value);
  list.sort((a, b) => (a.category ?? '').localeCompare(b.category ?? '') || a.name.localeCompare(b.name));

  listEl.innerHTML = '';
  if (list.length === 0) {
    listEl.innerHTML = '<p class="muted">No vendors yet — add your first one above.</p>';
    return;
  }
  for (const vendor of list) listEl.appendChild(buildCard(vendor));
}

function buildCard(vendor) {
  const card = document.createElement('div');
  card.className = 'card';
  card.innerHTML = `
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
    <label>Notes<textarea rows="2" data-field="notes">${escapeHtml(vendor.notes ?? '')}</textarea></label>
    <div><span class="badge badge-${vendor.status}">${vendor.status}</span></div>
    <div class="card-actions">
      <button type="button" class="btn btn-primary" data-action="save">Save</button>
      <button type="button" class="btn btn-danger" data-action="delete">Delete</button>
    </div>
  `;

  card.querySelector('[data-action="save"]').addEventListener('click', () => saveVendor(vendor.id, card));
  card.querySelector('[data-action="delete"]').addEventListener('click', () => deleteVendor(vendor.id));
  const statusSelect = card.querySelector('[data-field="status"]');
  const badge = card.querySelector('.badge');
  statusSelect.addEventListener('change', () => {
    badge.className = `badge badge-${statusSelect.value}`;
    badge.textContent = statusSelect.value;
  });
  return card;
}

async function saveVendor(id, card) {
  const fields = readFields(card);
  const { error } = await supabase.from('vendors').update(fields).eq('id', id);
  if (error) {
    showBanner(banner, `Could not save vendor: ${error.message}`);
    return;
  }
  await loadVendors();
  showBanner(banner, 'Vendor saved.', 'success');
}

async function deleteVendor(id) {
  if (!confirm('Delete this vendor?')) return;
  const { error } = await supabase.from('vendors').delete().eq('id', id);
  if (error) {
    showBanner(banner, `Could not delete vendor: ${error.message}`);
    return;
  }
  await loadVendors();
}

addForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const payload = readFields(addForm);
  if (!payload.name) return;
  const { error } = await supabase.from('vendors').insert(payload);
  if (error) {
    showBanner(banner, `Could not add vendor: ${error.message}`);
    return;
  }
  addForm.reset();
  await loadVendors();
});

filterSelect.addEventListener('change', renderVendors);

async function init() {
  await requireSession();
  renderNav('vendors');
  await loadVendors();
}

init();
