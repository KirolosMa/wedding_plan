import { supabase } from './supabaseClient.js';
import { renderNav } from './nav.js';
import { renderViewToggle } from './viewToggle.js';
import { escapeHtml, showToast, readFields, flashSaved, trackDirty, matchesSearch } from './utils.js';

const bodyEl = document.getElementById('items-body');
const addForm = document.getElementById('add-item-form');
const filterSelect = document.getElementById('filter-select');
const searchInput = document.getElementById('search-input');
const resultCount = document.getElementById('result-count');
const progressLabel = document.getElementById('progress-label');
const progressBar = document.getElementById('progress-bar');

let items = [];

function setLoading(message) {
  bodyEl.innerHTML = `<tr><td colspan="6"><div class="state-message">${message}</div></td></tr>`;
}

async function loadItems() {
  setLoading('Loading tasks…');
  const { data, error } = await supabase.from('checklist_items').select('*');
  if (error) {
    showToast(`Could not load checklist: ${error.message}`);
    setLoading('Could not load checklist.');
    return;
  }
  items = data;
  renderItems();
}

function sortedFiltered() {
  const term = searchInput.value;
  let list = [...items];
  if (filterSelect.value === 'todo') list = list.filter((i) => !i.done);
  if (filterSelect.value === 'done') list = list.filter((i) => i.done);
  list = list.filter((i) => matchesSearch(term, i.title, i.category, i.notes));
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
  progressLabel.textContent = `${done} of ${total} done (${pct}%)`;
  progressBar.style.width = `${pct}%`;
}

function renderItems() {
  renderProgress();
  const list = sortedFiltered();

  resultCount.textContent = items.length ? `Showing ${list.length} of ${items.length} tasks` : '';

  bodyEl.innerHTML = '';
  if (list.length === 0) {
    const isFiltered = searchInput.value.trim() || filterSelect.value !== 'all';
    bodyEl.innerHTML = `<tr><td colspan="6"><div class="state-message">${
      isFiltered
        ? '<strong>No matching tasks</strong>Try a different search or filter.'
        : '<strong>No tasks yet</strong>Use “Add a task” above to start your timeline.'
    }</div></td></tr>`;
    return;
  }

  const fragment = document.createDocumentFragment();
  for (const item of list) fragment.appendChild(buildRow(item));
  bodyEl.appendChild(fragment);
}

// Flags outstanding tasks whose due date has passed or is within a week.
function dueClass(item) {
  if (item.done || !item.due_date) return '';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(`${item.due_date}T00:00:00`);
  const days = Math.round((due - today) / 86400000);
  if (days < 0) return 'is-overdue';
  if (days <= 7) return 'is-due-soon';
  return '';
}

function rowClass(item) {
  return [item.done ? 'is-done' : '', dueClass(item)].filter(Boolean).join(' ');
}

function buildRow(item) {
  const row = document.createElement('tr');
  row.className = rowClass(item);
  row.innerHTML = `
    <td class="col-check" data-label="Done"><input type="checkbox" data-field="done" ${item.done ? 'checked' : ''} /></td>
    <td data-label="Title" class="col-title"><input type="text" data-field="title" value="${escapeHtml(item.title)}" /></td>
    <td data-label="Category"><input type="text" data-field="category" value="${escapeHtml(item.category ?? '')}" /></td>
    <td data-label="Due"><input type="date" data-field="due_date" value="${item.due_date ?? ''}" /></td>
    <td class="col-notes" data-label="Notes"><input type="text" data-field="notes" value="${escapeHtml(item.notes ?? '')}" /></td>
    <td class="row-actions">
      <button type="button" class="btn btn-primary btn-sm" data-action="save">Save</button>
      <button type="button" class="btn btn-danger btn-sm" data-action="delete">Delete</button>
    </td>
  `;
  row.querySelector('[data-action="save"]').addEventListener('click', (e) => saveItem(item, row, e.currentTarget));
  row.querySelector('[data-action="delete"]').addEventListener('click', () => deleteItem(item));
  // Ticking a task saves immediately - the common case shouldn't need a second click.
  row.querySelector('[data-field="done"]').addEventListener('change', () => toggleDone(item, row));
  trackDirty(row);
  return row;
}

async function toggleDone(item, row) {
  const done = row.querySelector('[data-field="done"]').checked;
  const { error } = await supabase.from('checklist_items').update({ done }).eq('id', item.id);
  if (error) {
    showToast(`Could not update task: ${error.message}`);
    return;
  }
  item.done = done;
  row.classList.remove('is-dirty');
  row.className = rowClass(item);
  renderProgress();
}

// Updates local state instead of refetching so the list doesn't jump back to the top mid-edit.
async function saveItem(item, row, button) {
  const fields = readFields(row);
  const { error } = await supabase.from('checklist_items').update(fields).eq('id', item.id);
  if (error) {
    showToast(`Could not save task: ${error.message}`);
    return;
  }
  Object.assign(item, fields);
  row.classList.remove('is-dirty');
  row.className = dueClass(item);
  flashSaved(button);
  renderProgress();
}

async function deleteItem(item) {
  if (!confirm(`Delete “${item.title}” from the checklist?`)) return;
  const { error } = await supabase.from('checklist_items').delete().eq('id', item.id);
  if (error) {
    showToast(`Could not delete task: ${error.message}`);
    return;
  }
  items = items.filter((i) => i.id !== item.id);
  renderItems();
  showToast('Task removed.', 'success');
}

addForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const payload = readFields(addForm);
  if (!payload.title) return;
  const { error } = await supabase.from('checklist_items').insert(payload);
  if (error) {
    showToast(`Could not add task: ${error.message}`);
    return;
  }
  addForm.reset();
  await loadItems();
  showToast('Task added.', 'success');
});

filterSelect.addEventListener('change', renderItems);
searchInput.addEventListener('input', renderItems);

async function init() {
  renderNav('checklist');
  renderViewToggle();
  await loadItems();
}

init();
