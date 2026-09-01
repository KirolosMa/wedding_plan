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

export function formatDate(value) {
  if (!value) return '—';
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export function showBanner(el, message, kind = 'error') {
  el.textContent = message;
  el.className = `banner banner-${kind}`;
  el.hidden = false;
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

