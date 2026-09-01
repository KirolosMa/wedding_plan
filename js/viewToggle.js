// Phones default to the stacked card layout, but the real table stays one tap away.
const STORAGE_KEY = 'wp-table-view';
const VIEWS = [
  ['cards', 'Cards'],
  ['table', 'Table'],
];

function apply(view) {
  document.body.dataset.tableView = view;
  try {
    localStorage.setItem(STORAGE_KEY, view);
  } catch {
    // Private browsing can block storage; the choice just won't persist.
  }
}

export function renderViewToggle(toolbar = document.querySelector('.toolbar')) {
  let saved = 'cards';
  try {
    if (localStorage.getItem(STORAGE_KEY) === 'table') saved = 'table';
  } catch {
    // Ignore unreadable storage and fall back to cards.
  }
  apply(saved);
  if (!toolbar) return;

  const group = document.createElement('div');
  group.className = 'view-toggle';
  group.setAttribute('role', 'group');
  group.setAttribute('aria-label', 'Row layout');
  group.innerHTML = VIEWS.map(
    ([value, label]) =>
      `<button type="button" data-view="${value}" aria-pressed="${saved === value}">${label}</button>`
  ).join('');

  group.addEventListener('click', (event) => {
    const button = event.target.closest('[data-view]');
    if (!button) return;
    apply(button.dataset.view);
    group.querySelectorAll('[data-view]').forEach((b) =>
      b.setAttribute('aria-pressed', String(b === button))
    );
  });

  toolbar.appendChild(group);
}
