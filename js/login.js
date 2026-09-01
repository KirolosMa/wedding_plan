import { supabase } from './supabaseClient.js';

const form = document.getElementById('login-form');
const errorEl = document.getElementById('login-error');

const { data: { session } } = await supabase.auth.getSession();
if (session) {
  window.location.href = 'index.html';
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  errorEl.hidden = true;

  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const submitBtn = form.querySelector('button[type="submit"]');

  submitBtn.disabled = true;
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  submitBtn.disabled = false;

  if (error) {
    errorEl.textContent = `Could not log in: ${error.message}`;
    errorEl.hidden = false;
    return;
  }
  window.location.href = 'index.html';
});
