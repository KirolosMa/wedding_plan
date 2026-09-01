import { supabase } from './supabaseClient.js';
import { renderNav } from './nav.js';
import { escapeHtml, showToast, readFields, flashSaved, trackDirty, matchesSearch, formatCurrency } from './utils.js';

const STATUSES = ['considering', 'visited', 'booked', 'rejected'];

const listEl = document.getElementById('venues-list');
const addForm = document.getElementById('add-venue-form');
const sortSelect = document.getElementById('sort-select');
const searchInput = document.getElementById('search-input');
const resultCount = document.getElementById('result-count');

let venues = [];

function setMessage(html) {
  listEl.innerHTML = `<div class="state-message">${html}</div>`;
}

async function loadVenues() {
  setMessage('Loading venues…');
  const { data, error } = await supabase.from('venues').select('*');
  if (error) {
    showToast(`Could not load venues: ${error.message}`);
    setMessage('Could not load venues.');
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
  // Always float a booked venue to the top - it's the decision that matters most.
  return copy.sort((a, b) => (b.status === 'booked') - (a.status === 'booked'));
}

function renderVenues() {
  const term = searchInput.value;
  const list = sortVenues(
    venues.filter((v) => matchesSearch(term, v.name, v.location, v.notes, v.pros, v.cons, v.status))
  );

  resultCount.textContent = venues.length ? `Showing ${list.length} of ${venues.length} venues` : '';

  if (list.length === 0) {
    setMessage(
      term.trim()
        ? '<strong>No matching venues</strong>Try a different search term.'
        : '<strong>No venues yet</strong>Use “Add a venue” above to start comparing.'
    );
    return;
  }

  listEl.innerHTML = '';
  const fragment = document.createDocumentFragment();
  for (const venue of list) fragment.appendChild(buildCard(venue));
  listEl.appendChild(fragment);
}

function stars(rating) {
  if (!rating) return '<span class="muted">Not rated</span>';
  return `<span class="stars" title="${rating} out of 5">${'★'.repeat(rating)}${'☆'.repeat(5 - rating)}</span>`;
}

function detailBlock(label, value) {
  if (!value) return '';
  const clampable = value.length > 220 ? ' clampable' : '';
  return `<div class="detail"><span class="detail-label">${label}</span><p class="${clampable.trim()}"${
    clampable ? ' title="Click to expand"' : ''
  }>${escapeHtml(value)}</p></div>`;
}

function buildCard(venue) {
  const card = document.createElement('div');
  card.className = 'card';
  card.innerHTML = `
    <div class="card-heading">
      <h3>${escapeHtml(venue.name)}</h3>
      <span class="badge badge-${venue.status}">${venue.status}</span>
    </div>
    <p class="card-summary muted">${escapeHtml(venue.location ?? 'Location not set')} · ${formatCurrency(venue.price)}${
      venue.capacity ? ` · up to ${venue.capacity} guests` : ''
    }</p>
    <div class="card-rating">${stars(venue.rating)}</div>
    ${detailBlock('Pros', venue.pros)}
    ${detailBlock('Cons', venue.cons)}
    ${detailBlock('Notes', venue.notes)}
    ${venue.photo_url ? `<a class="detail-link" href="${escapeHtml(venue.photo_url)}" target="_blank" rel="noopener noreferrer">View photo ↗</a>` : ''}

    <details class="edit-details">
      <summary>Edit</summary>
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
      <label>Notes<textarea rows="4" data-field="notes">${escapeHtml(venue.notes ?? '')}</textarea></label>
      <div class="card-actions">
        <button type="button" class="btn btn-primary" data-action="save">Save</button>
        <button type="button" class="btn btn-danger" data-action="delete">Delete</button>
      </div>
    </details>
  `;

  card.querySelector('[data-action="save"]').addEventListener('click', (e) => saveVenue(venue, card, e.currentTarget));
  card.querySelector('[data-action="delete"]').addEventListener('click', () => deleteVenue(venue));
  card.querySelectorAll('.clampable').forEach((p) =>
    p.addEventListener('click', () => p.classList.toggle('expanded'))
  );
  trackDirty(card);
  return card;
}

// Re-renders the whole list so the read-only summary and sort order reflect the new values.
async function saveVenue(venue, card, button) {
  const fields = readFields(card);
  const { error } = await supabase.from('venues').update(fields).eq('id', venue.id);
  if (error) {
    showToast(`Could not save venue: ${error.message}`);
    return;
  }
  Object.assign(venue, fields);
  card.classList.remove('is-dirty');
  flashSaved(button);
  showToast(`${venue.name} saved.`, 'success');
  setTimeout(renderVenues, 1200);
}

async function deleteVenue(venue) {
  if (!confirm(`Delete ${venue.name} from your venue list?`)) return;
  const { error } = await supabase.from('venues').delete().eq('id', venue.id);
  if (error) {
    showToast(`Could not delete venue: ${error.message}`);
    return;
  }
  venues = venues.filter((v) => v.id !== venue.id);
  renderVenues();
  showToast(`${venue.name} removed.`, 'success');
}

addForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const payload = readFields(addForm);
  if (!payload.name) return;
  const { error } = await supabase.from('venues').insert(payload);
  if (error) {
    showToast(`Could not add venue: ${error.message}`);
    return;
  }
  addForm.reset();
  await loadVenues();
  showToast(`${payload.name} added.`, 'success');
});

sortSelect.addEventListener('change', renderVenues);
searchInput.addEventListener('input', renderVenues);

async function init() {
  renderNav('venues');
  await loadVenues();
}

init();
