const NAV_LINKS = [
  { href: 'index.html', label: 'Dashboard', key: 'dashboard' },
  { href: 'venues.html', label: 'Venues', key: 'venues' },
  { href: 'checklist.html', label: 'Checklist', key: 'checklist' },
  { href: 'budget.html', label: 'Budget', key: 'budget' },
  { href: 'guests.html', label: 'Guests', key: 'guests' },
  { href: 'vendors.html', label: 'Vendors', key: 'vendors' },
];

// Injects the shared nav bar into <div id="nav"> and highlights the current page.
export function renderNav(activeKey) {
  const nav = document.getElementById('nav');
  if (!nav) return;

  const links = NAV_LINKS.map(
    (link) => `<a href="${link.href}" class="${link.key === activeKey ? 'active' : ''}">${link.label}</a>`
  ).join('');

  nav.innerHTML = `
    <div class="nav-inner">
      <span class="brand">💍 Wedding Planner</span>
      <div class="nav-links">${links}</div>
    </div>
  `;
}
