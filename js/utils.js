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

// Matches, in order: emails, explicit http(s)/www links, then bare domains like
// "instagram.com/handle" that people paste into notes without a scheme.
const LINK_PATTERN =
  /([\w.+-]+@[\w-]+(?:\.[\w-]+)+)|((?:https?:\/\/|www\.)[^\s<>"']+)|((?:[a-z0-9-]+\.)+(?:com|net|org|io|me|co|eg|uk|app|link|shop|store|info|biz)(?:\/[^\s<>"']*)?)/gi;

const TRAILING_PUNCTUATION = /[.,;:!?)\]}>'"]+$/;

// Only ever produces mailto:/https: hrefs, so linkified user text can't inject javascript: URLs.
function toLink(token) {
  if (token.includes('@') && !/^https?:\/\//i.test(token)) {
    return { href: `mailto:${token}`, label: token, external: false };
  }
  const href = /^https?:\/\//i.test(token) ? token : `https://${token}`;
  return { href, label: token.replace(/^https?:\/\//i, '').replace(/^www\./i, ''), external: true };
}

function* scanLinks(text) {
  LINK_PATTERN.lastIndex = 0;
  let match;
  while ((match = LINK_PATTERN.exec(String(text ?? ''))) !== null) {
    const token = match[0].replace(TRAILING_PUNCTUATION, '');
    if (token) yield { token, index: match.index };
  }
}

export function anchorHtml({ href, label, external }, className = '') {
  const attrs = external ? ' target="_blank" rel="noopener noreferrer"' : '';
  const cls = className ? ` class="${className}"` : '';
  return `<a href="${escapeHtml(href)}"${cls}${attrs}>${escapeHtml(label)}</a>`;
}

// Escapes text and turns any URLs/emails inside it into real links.
export function linkify(text) {
  const raw = String(text ?? '');
  if (!raw) return '';
  let html = '';
  let cursor = 0;
  for (const { token, index } of scanLinks(raw)) {
    html += escapeHtml(raw.slice(cursor, index)) + anchorHtml(toLink(token));
    cursor = index + token.length;
  }
  return html + escapeHtml(raw.slice(cursor));
}

// Unique web links found in free text, used to build the quick-action chips on a card.
export function extractLinks(text) {
  const seen = new Set();
  const links = [];
  for (const { token } of scanLinks(text)) {
    const link = toLink(token);
    if (!link.external) continue;
    const key = link.href.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    links.push(link);
  }
  return links;
}

export function telHref(phone) {
  const normalized = normalizePhone(phone);
  return normalized ? `tel:${normalized}` : null;
}

// Stores numbers in E.164 so a future messaging integration can dial them without guessing.
// Bare local numbers are assumed Egyptian (+20), which is where this wedding is.
export function normalizePhone(value, defaultCountry = '20') {
  const raw = String(value ?? '').trim();
  if (!raw) return null;
  let digits = raw.replace(/\D/g, '');
  if (!digits) return null;
  if (!raw.startsWith('+')) {
    if (digits.startsWith('00')) digits = digits.slice(2);
    else if (digits.startsWith('0')) digits = defaultCountry + digits.slice(1);
    else if (digits.length <= 10) digits = defaultCountry + digits;
  }
  return `+${digits}`;
}

export function isValidPhone(value) {
  const digits = (normalizePhone(value) ?? '').replace(/\D/g, '');
  return digits.length >= 10 && digits.length <= 15;
}

// Egyptian-local numbers ("0100…") are normalised to the +20 country code for wa.me.
export function whatsappHref(phone) {
  const normalized = normalizePhone(phone);
  if (!normalized) return null;
  const digits = normalized.slice(1);
  return digits.length >= 8 ? `https://wa.me/${digits}` : null;
}

// Spreadsheets execute cells starting with = + - @, so those values are quoted defensively.
export function toCsv(rows) {
  return rows
    .map((row) =>
      row
        .map((cell) => {
          const value = cell === null || cell === undefined ? '' : String(cell);
          const safe = /^[=+\-@]/.test(value) ? `'${value}` : value;
          return `"${safe.replace(/"/g, '""')}"`;
        })
        .join(',')
    )
    .join('\r\n');
}

export function downloadFile(filename, contents, type = 'text/csv;charset=utf-8') {
  const url = URL.createObjectURL(new Blob([contents], { type }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000); // revoking straight away cancels the download
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
      const raw = input.value.replace(/[,\s]/g, '');
      const number = Number(raw);
      fields[key] = raw === '' || Number.isNaN(number) ? null : number;
    } else {
      fields[key] = input.value.trim ? input.value.trim() : input.value;
      if (fields[key] === '') fields[key] = null;
    }
  });
  return fields;
}

