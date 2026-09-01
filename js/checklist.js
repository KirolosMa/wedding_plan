import { supabase } from './supabaseClient.js';
import { requireSession, renderNav } from './auth.js';
import { escapeHtml, showBanner, readFields } from './utils.js';

const bodyEl = document.getElementById('items-body');
const addForm = document.getElementById('add-item-form');
const filterSelect = document.getElementById('filter-select');
const banner = document.getElementById('banner');
const progressLabel = document.getElementById('progress-label');
const progressBar = document.getElementById('progress-bar');

let items = [];

async function loadItems() {
  const { data, error } = await supabase.from('checklist_items').select('*');
  if (error) {
    showBanner(banner, `Could not load checklist: ${error.message}`);
    return;
  }
  items = data;
  renderItems();
}

function sortedFiltered() {
  let list = [...items];
  if (filterSelect.value === 'todo') list = list.filter((i) => !i.done);
  if (filterSelect.value === 'done') list = list.filter((i) => i.done);
  list.sort((a, b) => {
    const aDate = a.due_date ? new Date(a.due_date).getTime() : Infinity;
    const bDate = b.due_date ? new Date(b.due_date).getTime() : Infinity;
    return aDate - bDate;
  });
  return list;
}

function renderProgress() {
  const total = items.length;
  const done = items.filter((i) => i.done).length;
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  progressLabel.textContent = `${done} of ${total} done`;
  progressBar.style.width = `${pct}%`;
}

function renderItems() {
  renderProgress();
  const list = sortedFiltered();
  bodyEl.innerHTML = '';
  if (list.length === 0) {
    bodyEl.innerHTML = '<tr><td colspan="6" class="muted">No tasks yet — add your first one above.</td></tr>';
    return;
  }
  for (const item of list) bodyEl.appendChild(buildRow(item));
}

function buildRow(item) {
  const row = document.createElement('tr');
  row.innerHTML = `
    <td><input type="checkbox" data-field="done" ${item.done ? 'checked' : ''} /></td>
    <td><input type="text" data-field="title" value="${escapeHtml(item.title)}" /></td>
    <td><input type="text" data-field="category" value="${escapeHtml(item.category ?? '')}" /></td>
    <td><input type="date" data-field="due_date" value="${item.due_date ?? ''}" /></td>
    <td><input type="text" data-field="notes" value="${escapeHtml(item.notes ?? '')}" /></td>
    <td class="row-actions">
      <button type="button" class="btn btn-primary" data-action="save">Save</button>
      <button type="button" class="btn btn-danger" data-action="delete">Delete</button>
    </td>
  `;
  row.querySelector('[data-action="save"]').addEventListener('click', () => saveItem(item.id, row));
  row.querySelector('[data-action="delete"]').addEventListener('click', () => deleteItem(item.id));
  row.querySelector('[data-field="done"]').addEventListener('change', () => saveItem(item.id, row));
  return row;
}

async function saveItem(id, row) {
  const fields = readFields(row);
  const { error } = await supabase.from('checklist_items').update(fields).eq('id', id);
  if (error) {
    showBanner(banner, `Could not save task: ${error.message}`);
    return;
  }
  await loadItems();
}

async function deleteItem(id) {
  if (!confirm('Delete this task?')) return;
  const { error } = await supabase.from('checklist_items').delete().eq('id', id);
  if (error) {
    showBanner(banner, `Could not delete task: ${error.message}`);
    return;
  }
  await loadItems();
}

addForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const payload = readFields(addForm);
  if (!payload.title) return;
  const { error } = await supabase.from('checklist_items').insert(payload);
  if (error) {
    showBanner(banner, `Could not add task: ${error.message}`);
    return;
  }
  addForm.reset();
  await loadItems();
});

filterSelect.addEventListener('change', renderItems);

async function init() {
  await requireSession();
  renderNav('checklist');
  await loadItems();
}

init();
