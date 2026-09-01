import { supabase } from './supabaseClient.js';

const NAV_LINKS = [
  { href: 'index.html', label: 'Dashboard', key: 'dashboard' },
  { href: 'venues.html', label: 'Venues', key: 'venues' },
  { href: 'checklist.html', label: 'Checklist', key: 'checklist' },
  { href: 'budget.html', label: 'Budget', key: 'budget' },
  { href: 'guests.html', label: 'Guests', key: 'guests' },
  { href: 'vendors.html', label: 'Vendors', key: 'vendors' },
];

// Redirects to login.html when nobody is signed in; returns the session otherwise.
export async function requireSession() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    window.location.href = 'login.html';
    return null;
  }
  return session;
}

export async function logout() {
  await supabase.auth.signOut();
  window.location.href = 'login.html';
}

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
      <button type="button" id="logout-btn" class="btn btn-secondary nav-logout">Log out</button>
    </div>
  `;
  nav.querySelector('#logout-btn').addEventListener('click', logout);
}
