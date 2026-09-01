import { supabase } from './supabaseClient.js';
import { requireSession, renderNav } from './auth.js';
import { formatNumber, formatDate, showBanner, readFields } from './utils.js';

const banner = document.getElementById('banner');
const coupleNamesEl = document.getElementById('couple-names');
const countdownDays = document.getElementById('countdown-days');
const countdownLabel = document.getElementById('countdown-label');
const settingsForm = document.getElementById('settings-form');

async function loadDashboard() {
  const [infoRes, venuesRes, checklistRes, budgetRes, guestsRes, vendorsRes] = await Promise.all([
    supabase.from('wedding_info').select('*').eq('id', 1).single(),
    supabase.from('venues').select('status'),
    supabase.from('checklist_items').select('done'),
    supabase.from('budget_items').select('actual_cost'),
    supabase.from('guests').select('invited,rsvp_status'),
    supabase.from('vendors').select('status'),
  ]);

  if (infoRes.error) {
    showBanner(banner, `Could not load wedding info: ${infoRes.error.message}`);
    return;
  }

  renderCountdown(infoRes.data);
  fillSettingsForm(infoRes.data);
  renderVenues(venuesRes.data ?? []);
  renderChecklist(checklistRes.data ?? []);
  renderBudget(budgetRes.data ?? [], infoRes.data);
  renderGuests(guestsRes.data ?? []);
  renderVendors(vendorsRes.data ?? []);
}

function renderCountdown(info) {
  coupleNamesEl.textContent = info.couple_names || 'Your wedding';
  if (!info.wedding_date) {
    countdownDays.textContent = '—';
    countdownLabel.textContent = 'Set your wedding date below';
    return;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const wedding = new Date(`${info.wedding_date}T00:00:00`);
  const diffDays = Math.round((wedding.getTime() - today.getTime()) / 86400000);

  if (diffDays > 0) {
    countdownDays.textContent = diffDays;
    countdownLabel.textContent = `days until ${formatDate(info.wedding_date)}`;
  } else if (diffDays === 0) {
    countdownDays.textContent = '🎉';
    countdownLabel.textContent = "Today's the day!";
  } else {
    countdownDays.textContent = '🎉';
    countdownLabel.textContent = `Married since ${formatDate(info.wedding_date)}`;
  }
}

function fillSettingsForm(info) {
  settingsForm.querySelector('[data-field="couple_names"]').value = info.couple_names ?? '';
  settingsForm.querySelector('[data-field="wedding_date"]').value = info.wedding_date ?? '';
  settingsForm.querySelector('[data-field="total_budget"]').value = info.total_budget ?? 0;
}

function renderVenues(venues) {
  document.getElementById('stat-venues').textContent = venues.length;
  const booked = venues.filter((v) => v.status === 'booked').length;
  document.getElementById('stat-venues-sub').textContent = booked > 0 ? `${booked} booked` : 'None booked yet';
}

function renderChecklist(items) {
  const done = items.filter((i) => i.done).length;
  document.getElementById('stat-checklist').textContent = `${done}/${items.length}`;
  const pct = items.length === 0 ? 0 : Math.round((done / items.length) * 100);
  document.getElementById('checklist-progress').style.width = `${pct}%`;
}

function renderBudget(items, info) {
  const actual = items.reduce((sum, i) => sum + Number(i.actual_cost ?? 0), 0);
  const totalBudget = Number(info?.total_budget ?? 0);
  document.getElementById('stat-budget').textContent = formatNumber(actual);
  document.getElementById('stat-budget-sub').textContent =
    totalBudget > 0 ? `of ${formatNumber(totalBudget)} budgeted` : 'spent so far';
}

function renderGuests(guests) {
  const invited = guests.filter((g) => g.invited).length;
  const confirmed = guests.filter((g) => g.rsvp_status === 'yes').length;
  document.getElementById('stat-guests').textContent = `${confirmed}/${invited}`;
  document.getElementById('stat-guests-sub').textContent = 'confirmed of invited';
}

function renderVendors(vendors) {
  const booked = vendors.filter((v) => v.status === 'booked' || v.status === 'paid').length;
  document.getElementById('stat-vendors').textContent = `${booked}/${vendors.length}`;
  document.getElementById('stat-vendors-sub').textContent = 'booked/paid of total';
}

settingsForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const fields = readFields(settingsForm);
  const { error } = await supabase.from('wedding_info').update(fields).eq('id', 1);
  if (error) {
    showBanner(banner, `Could not save settings: ${error.message}`);
    return;
  }
  showBanner(banner, 'Settings saved.', 'success');
  await loadDashboard();
});

async function init() {
  await requireSession();
  renderNav('dashboard');
  await loadDashboard();
}

init();
