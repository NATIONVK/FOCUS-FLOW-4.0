const dateKey = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const dailyReflectionTitle = (date = new Date()) => `Daily Reflection · ${dateKey(date)}`;

export function getDailyReflection(notes = [], date = new Date()) {
  const title = dailyReflectionTitle(date);
  return notes.find(note => note?.title === title) || null;
}

const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
})[char]);

export function renderDailyReflection(store) {
  const today = new Date();
  const saved = getDailyReflection(store.data.notes, today);
  const value = saved?.body || '';
  return `
    <section class="daily-reflection panel" aria-labelledby="dailyReflectionTitle">
      <div class="daily-reflection-head">
        <div><span class="eyebrow">CLOSE THE LOOP · ${today.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}</span>
        <h3 id="dailyReflectionTitle">A minute to reflect</h3>
        <p>Capture one lesson from today. Your reflection is saved with your existing Notes and backup.</p></div>
        <span class="daily-reflection-mark" aria-hidden="true">✎</span>
      </div>
      <label for="dailyReflectionInput">What did you learn today, and what is one thing you want to improve tomorrow?</label>
      <textarea id="dailyReflectionInput" maxlength="2000" rows="3" placeholder="A small lesson is still progress…">${escapeHtml(value)}</textarea>
      <div class="daily-reflection-actions"><small>${saved ? 'Your reflection is saved on this device.' : 'Private · Offline · Included in your study-data backup'}</small><button type="button" class="primary" id="saveDailyReflection">Save reflection</button></div>
    </section>`;
}

export function bindDailyReflection(store, render, toast = () => {}) {
  const button = document.querySelector('#saveDailyReflection');
  const input = document.querySelector('#dailyReflectionInput');
  if (!button || !input) return;
  button.addEventListener('click', () => {
    const body = input.value.trim().slice(0, 2000);
    if (!body) {
      toast('Write a short reflection before saving.', 'error');
      input.focus();
      return;
    }
    try {
      const title = dailyReflectionTitle();
      const existing = getDailyReflection(store.data.notes);
      if (existing) store.editNote(existing.id, title, body);
      else store.addNote(title, body);
      render();
      toast('Daily reflection saved', 'success');
    } catch (error) {
      toast(error?.message || 'Could not save reflection', 'error');
    }
  });
}
