import { supabase } from './supabaseClient.js';
import { renderNav } from './nav.js';
import { escapeHtml, formatNumber, showBanner, readFields } from './utils.js';

const bodyEl = document.getElementById('items-body');
const addForm = document.getElementById('add-item-form');
const banner = document.getElementById('banner');
const statTotalBudget = document.getElementById('stat-total-budget');
const statEstimated = document.getElementById('stat-estimated');
const statActual = document.getElementById('stat-actual');
const statRemaining = document.getElementById('stat-remaining');
const progressBar = document.getElementById('progress-bar');

let items = [];
let totalBudget = 0;

async function loadAll() {
  const [itemsRes, infoRes] = await Promise.all([
    supabase.from('budget_items').select('*'),
    supabase.from('wedding_info').select('total_budget').eq('id', 1).single(),
  ]);
  if (itemsRes.error) {
    showBanner(banner, `Could not load budget: ${itemsRes.error.message}`);
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

  statTotalBudget.textContent = formatNumber(totalBudget);
  statEstimated.textContent = formatNumber(estimated);
  statActual.textContent = formatNumber(actual);
  statRemaining.textContent = formatNumber(remaining);

  const pct = totalBudget > 0 ? Math.min(100, Math.round((actual / totalBudget) * 100)) : 0;
  progressBar.style.width = `${pct}%`;
  progressBar.classList.toggle('over-budget', totalBudget > 0 && actual > totalBudget);
}

function renderItems() {
  bodyEl.innerHTML = '';
  if (items.length === 0) {
    bodyEl.innerHTML = '<tr><td colspan="5" class="muted">No budget lines yet — add your first one above.</td></tr>';
    return;
  }
  const sorted = [...items].sort((a, b) => a.category.localeCompare(b.category));
  for (const item of sorted) bodyEl.appendChild(buildRow(item));
}

function buildRow(item) {
  const row = document.createElement('tr');
  row.innerHTML = `
    <td><input type="text" data-field="category" value="${escapeHtml(item.category)}" /></td>
    <td><input type="number" step="0.01" min="0" data-field="estimated_cost" value="${item.estimated_cost ?? 0}" /></td>
    <td><input type="number" step="0.01" min="0" data-field="actual_cost" value="${item.actual_cost ?? 0}" /></td>
    <td><input type="text" data-field="notes" value="${escapeHtml(item.notes ?? '')}" /></td>
    <td class="row-actions">
      <button type="button" class="btn btn-primary" data-action="save">Save</button>
      <button type="button" class="btn btn-danger" data-action="delete">Delete</button>
    </td>
  `;
  row.querySelector('[data-action="save"]').addEventListener('click', () => saveItem(item.id, row));
  row.querySelector('[data-action="delete"]').addEventListener('click', () => deleteItem(item.id));
  return row;
}

async function saveItem(id, row) {
  const fields = readFields(row);
  const { error } = await supabase.from('budget_items').update(fields).eq('id', id);
  if (error) {
    showBanner(banner, `Could not save budget line: ${error.message}`);
    return;
  }
  await loadAll();
  showBanner(banner, 'Saved.', 'success');
}

async function deleteItem(id) {
  if (!confirm('Delete this budget line?')) return;
  const { error } = await supabase.from('budget_items').delete().eq('id', id);
  if (error) {
    showBanner(banner, `Could not delete budget line: ${error.message}`);
    return;
  }
  await loadAll();
}

addForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const payload = readFields(addForm);
  if (!payload.category) return;
  const { error } = await supabase.from('budget_items').insert(payload);
  if (error) {
    showBanner(banner, `Could not add budget line: ${error.message}`);
    return;
  }
  addForm.reset();
  await loadAll();
});

async function init() {
  renderNav('budget');
  await loadAll();
}

init();
