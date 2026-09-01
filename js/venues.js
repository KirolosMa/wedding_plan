import { supabase } from './supabaseClient.js';
import { requireSession, renderNav } from './auth.js';
import { escapeHtml, showBanner, readFields } from './utils.js';

const STATUSES = ['considering', 'visited', 'booked', 'rejected'];

const listEl = document.getElementById('venues-list');
const addForm = document.getElementById('add-venue-form');
const sortSelect = document.getElementById('sort-select');
const banner = document.getElementById('banner');

let venues = [];

async function loadVenues() {
  const { data, error } = await supabase.from('venues').select('*');
  if (error) {
    showBanner(banner, `Could not load venues: ${error.message}`);
    return;
  }
  venues = data;
  renderVenues();
}

function sortVenues(list) {
  const copy = [...list];
  if (sortSelect.value === 'rating') copy.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
  else if (sortSelect.value === 'price') copy.sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity));
  else copy.sort((a, b) => a.name.localeCompare(b.name));
  return copy;
}

function renderVenues() {
  const sorted = sortVenues(venues);
  listEl.innerHTML = '';
  if (sorted.length === 0) {
    listEl.innerHTML = '<p class="muted">No venues yet — add your first one above.</p>';
    return;
  }
  for (const venue of sorted) listEl.appendChild(buildCard(venue));
}

function buildCard(venue) {
  const card = document.createElement('div');
  card.className = 'card';
  card.innerHTML = `
    <div class="form-grid">
      <label>Name<input type="text" data-field="name" value="${escapeHtml(venue.name)}" /></label>
      <label>Location<input type="text" data-field="location" value="${escapeHtml(venue.location ?? '')}" /></label>
      <label>Price<input type="number" step="0.01" min="0" data-field="price" value="${venue.price ?? ''}" /></label>
      <label>Capacity<input type="number" min="0" data-field="capacity" value="${venue.capacity ?? ''}" /></label>
      <label>Rating
        <select data-field="rating" data-type="number">
          <option value="">—</option>
          ${[1, 2, 3, 4, 5].map((n) => `<option value="${n}" ${venue.rating === n ? 'selected' : ''}>${n}</option>`).join('')}
        </select>
      </label>
      <label>Status
        <select data-field="status">
          ${STATUSES.map((s) => `<option value="${s}" ${venue.status === s ? 'selected' : ''}>${s[0].toUpperCase() + s.slice(1)}</option>`).join('')}
        </select>
      </label>
    </div>
    <label>Photo URL<input type="url" data-field="photo_url" value="${escapeHtml(venue.photo_url ?? '')}" /></label>
    <label>Pros<textarea rows="2" data-field="pros">${escapeHtml(venue.pros ?? '')}</textarea></label>
    <label>Cons<textarea rows="2" data-field="cons">${escapeHtml(venue.cons ?? '')}</textarea></label>
    <label>Notes<textarea rows="2" data-field="notes">${escapeHtml(venue.notes ?? '')}</textarea></label>
    <div><span class="badge badge-${venue.status}">${venue.status}</span></div>
    <div class="card-actions">
      <button type="button" class="btn btn-primary" data-action="save">Save</button>
      <button type="button" class="btn btn-danger" data-action="delete">Delete</button>
    </div>
  `;

  card.querySelector('[data-action="save"]').addEventListener('click', () => saveVenue(venue.id, card));
  card.querySelector('[data-action="delete"]').addEventListener('click', () => deleteVenue(venue.id));
  const statusSelect = card.querySelector('[data-field="status"]');
  const badge = card.querySelector('.badge');
  statusSelect.addEventListener('change', () => {
    badge.className = `badge badge-${statusSelect.value}`;
    badge.textContent = statusSelect.value;
  });
  return card;
}

async function saveVenue(id, card) {
  const fields = readFields(card);
  const { error } = await supabase.from('venues').update(fields).eq('id', id);
  if (error) {
    showBanner(banner, `Could not save venue: ${error.message}`);
    return;
  }
  await loadVenues();
  showBanner(banner, 'Venue saved.', 'success');
}

async function deleteVenue(id) {
  if (!confirm('Delete this venue?')) return;
  const { error } = await supabase.from('venues').delete().eq('id', id);
  if (error) {
    showBanner(banner, `Could not delete venue: ${error.message}`);
    return;
  }
  await loadVenues();
}

addForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const payload = readFields(addForm);
  if (!payload.name) return;
  const { error } = await supabase.from('venues').insert(payload);
  if (error) {
    showBanner(banner, `Could not add venue: ${error.message}`);
    return;
  }
  addForm.reset();
  await loadVenues();
});

sortSelect.addEventListener('change', renderVenues);

async function init() {
  await requireSession();
  renderNav('venues');
  await loadVenues();
}

init();
