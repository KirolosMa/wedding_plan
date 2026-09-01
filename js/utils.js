// Shared formatting/DOM helpers used by every feature page.

const HTML_ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

// Escape user-entered text before interpolating it into innerHTML template strings.
export function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => HTML_ESCAPES[char]);
}

export function formatNumber(value) {
  const number = Number(value ?? 0);
  return number.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

export function formatCurrency(value) {
  if (value === null || value === undefined || value === '') return '—';
  return `EGP ${formatNumber(value)}`;
}

export function formatDate(value) {
  if (!value) return '—';
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

let toastHost;

// Floating, auto-dismissing feedback so a save at the bottom of a long list is still visible.
export function showToast(message, kind = 'error') {
  if (!toastHost) {
    toastHost = document.createElement('div');
    toastHost.className = 'toast-host';
    toastHost.setAttribute('role', 'status');
    toastHost.setAttribute('aria-live', 'polite');
    document.body.appendChild(toastHost);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${kind}`;
  toast.textContent = message;
  toastHost.appendChild(toast);

  const linger = kind === 'error' ? 6000 : 2500;
  setTimeout(() => {
    toast.classList.add('toast-leaving');
    toast.addEventListener('transitionend', () => toast.remove(), { once: true });
  }, linger);
}

// Briefly confirms a save on the button itself, so feedback appears where the user clicked.
export function flashSaved(button, label = 'Saved ✓') {
  const original = button.textContent;
  button.textContent = label;
  button.classList.add('btn-saved');
  button.disabled = true;
  setTimeout(() => {
    button.textContent = original;
    button.classList.remove('btn-saved');
    button.disabled = false;
  }, 1200);
}

// Flags a row/card as having unsaved edits until it is saved or re-rendered.
export function trackDirty(container) {
  const mark = () => container.classList.add('is-dirty');
  container.querySelectorAll('[data-field]').forEach((input) => {
    input.addEventListener('input', mark);
    input.addEventListener('change', mark);
  });
}

export function matchesSearch(term, ...values) {
  if (!term) return true;
  const needle = term.trim().toLowerCase();
  if (!needle) return true;
  return values.some((value) => String(value ?? '').toLowerCase().includes(needle));
}

// Reads every [data-field] input/select/textarea inside a container into a plain object,
// coercing numbers and checkboxes. Used by every feature page's inline edit rows/cards.
export function readFields(container) {
  const fields = {};
  container.querySelectorAll('[data-field]').forEach((input) => {
    const key = input.dataset.field;
    if (input.type === 'checkbox') {
      fields[key] = input.checked;
    } else if (input.type === 'number' || input.dataset.type === 'number') {
      fields[key] = input.value === '' ? null : Number(input.value);
    } else {
      fields[key] = input.value.trim ? input.value.trim() : input.value;
      if (fields[key] === '') fields[key] = null;
    }
  });
  return fields;
}

