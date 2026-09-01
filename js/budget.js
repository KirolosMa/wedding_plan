import { supabase } from './supabaseClient.js';
import { renderNav } from './nav.js';
import { escapeHtml, formatCurrency, formatNumber, showToast, readFields, flashSaved, trackDirty, matchesSearch } from './utils.js';

const bodyEl = document.getElementById('items-body');
const addForm = document.getElementById('add-item-form');
const searchInput = document.getElementById('search-input');
const resultCount = document.getElementById('result-count');
const statTotalBudget = document.getElementById('stat-total-budget');
const statEstimated = document.getElementById('stat-estimated');
const statActual = document.getElementById('stat-actual');
const statRemaining = document.getElementById('stat-remaining');
const progressBar = document.getElementById('progress-bar');

let items = [];
let totalBudget = 0;

function setLoading(message) {
  bodyEl.innerHTML = `<tr><td colspan="5"><div class="state-message">${message}</div></td></tr>`;
}

async function loadAll() {
  setLoading('Loading budget…');
  const [itemsRes, infoRes] = await Promise.all([
    supabase.from('budget_items').select('*'),
    supabase.from('wedding_info').select('total_budget').eq('id', 1).single(),
  ]);
  if (itemsRes.error) {
    showToast(`Could not load budget: ${itemsRes.error.message}`);
    setLoading('Could not load budget.');
    return;
  }
  items = itemsRes.data;
  totalBudget = Number(infoRes.data?.total_budget ?? 0);
  renderAll();
}

function renderAll() {
  renderSummary();
  renderItems();
}

function renderSummary() {
  const estimated = items.reduce((sum, i) => sum + Number(i.estimated_cost ?? 0), 0);
  const actual = items.reduce((sum, i) => sum + Number(i.actual_cost ?? 0), 0);
  const remaining = totalBudget - actual;

  statTotalBudget.textContent = formatCurrency(totalBudget);
  statEstimated.textContent = formatCurrency(estimated);
  statActual.textContent = formatCurrency(actual);
  statRemaining.textContent = formatCurrency(remaining);
  statRemaining.classList.toggle('is-negative', remaining < 0);

  const pct = totalBudget > 0 ? Math.min(100, Math.round((actual / totalBudget) * 100)) : 0;
  progressBar.style.width = `${pct}%`;
  progressBar.classList.toggle('over-budget', totalBudget > 0 && actual > totalBudget);
}

function renderItems() {
  const term = searchInput.value;
  const list = items
    .filter((i) => matchesSearch(term, i.category, i.notes))
    .sort((a, b) => a.category.localeCompare(b.category));

  resultCount.textContent = items.length ? `Showing ${list.length} of ${items.length} lines` : '';

  bodyEl.innerHTML = '';
  if (list.length === 0) {
    bodyEl.innerHTML = `<tr><td colspan="5"><div class="state-message">${
      term.trim()
        ? '<strong>No matching budget lines</strong>Try a different search term.'
        : '<strong>No budget lines yet</strong>Use “Add a budget line” above to start tracking costs.'
    }</div></td></tr>`;
    return;
  }

  const fragment = document.createDocumentFragment();
  for (const item of list) fragment.appendChild(buildRow(item));
  bodyEl.appendChild(fragment);
}

function buildRow(item) {
  const row = document.createElement('tr');
  row.innerHTML = `
    <td data-label="Category" class="col-title"><input type="text" data-field="category" value="${escapeHtml(item.category)}" /></td>
    <td class="col-num" data-label="Estimated"><input type="text" inputmode="decimal" data-type="number" data-field="estimated_cost" value="${formatNumber(item.estimated_cost ?? 0)}" /></td>
    <td class="col-num" data-label="Actual"><input type="text" inputmode="decimal" data-type="number" data-field="actual_cost" value="${formatNumber(item.actual_cost ?? 0)}" /></td>
    <td class="col-notes" data-label="Notes"><input type="text" data-field="notes" value="${escapeHtml(item.notes ?? '')}" /></td>
    <td class="row-actions">
      <button type="button" class="btn btn-primary btn-sm" data-action="save">Save</button>
      <button type="button" class="btn btn-danger btn-sm" data-action="delete">Delete</button>
    </td>
  `;
  row.querySelector('[data-action="save"]').addEventListener('click', (e) => saveItem(item, row, e.currentTarget));
  row.querySelector('[data-action="delete"]').addEventListener('click', () => deleteItem(item));
  trackDirty(row);
  return row;
}

// Updates local state instead of refetching so the list doesn't jump back to the top mid-edit.
async function saveItem(item, row, button) {
  const fields = readFields(row);
  fields.estimated_cost ??= 0;
  fields.actual_cost ??= 0;
  const { error } = await supabase.from('budget_items').update(fields).eq('id', item.id);
  if (error) {
    showToast(`Could not save budget line: ${error.message}`);
    return;
  }
  Object.assign(item, fields);
  row.classList.remove('is-dirty');
  row.querySelector('[data-field="estimated_cost"]').value = formatNumber(item.estimated_cost ?? 0);
  row.querySelector('[data-field="actual_cost"]').value = formatNumber(item.actual_cost ?? 0);
  flashSaved(button);
  renderSummary();
}

async function deleteItem(item) {
  if (!confirm(`Delete the “${item.category}” budget line?`)) return;
  const { error } = await supabase.from('budget_items').delete().eq('id', item.id);
  if (error) {
    showToast(`Could not delete budget line: ${error.message}`);
    return;
  }
  items = items.filter((i) => i.id !== item.id);
  renderAll();
  showToast('Budget line removed.', 'success');
}

addForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const payload = readFields(addForm);
  if (!payload.category) return;
  payload.estimated_cost ??= 0;
  payload.actual_cost ??= 0;
  const { error } = await supabase.from('budget_items').insert(payload);
  if (error) {
    showToast(`Could not add budget line: ${error.message}`);
    return;
  }
  addForm.reset();
  await loadAll();
  showToast(`${payload.category} added.`, 'success');
});

searchInput.addEventListener('input', renderItems);

async function init() {
  renderNav('budget');
  await loadAll();
}

init();
