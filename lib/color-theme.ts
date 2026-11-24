export const themePreferenceKey = 'learnwithrich.color-theme';
export const themeChangeEvent = 'learnwithrich:theme-change';

export type ThemePreference = 'system' | 'light' | 'dark';

// Run in the head so the first paint uses the chosen palette.
export const initializeTheme = `(() => {
  const root = document.documentElement;
  const media = window.matchMedia('(prefers-color-scheme: dark)');
  let choice = 'system';

  function apply() {
    root.dataset.themePreference = choice;
    root.dataset.theme = choice === 'system' ? (media.matches ? 'dark' : 'light') : choice;
  }

  function read() {
    try {
      const saved = localStorage.getItem('${themePreferenceKey}');
      choice = saved === 'dark' || saved === 'light' ? saved : 'system';
    } catch {}
    apply();
  }

  read();
  media.addEventListener('change', apply);
  window.addEventListener('storage', event => {
    if (event.key === '${themePreferenceKey}' || event.key === null) read();
  });
  window.addEventListener('${themeChangeEvent}', event => {
    const preference = event.detail;
    if (preference !== 'system' && preference !== 'light' && preference !== 'dark') return;
    choice = preference;
    try {
      if (choice === 'system') localStorage.removeItem('${themePreferenceKey}');
      else localStorage.setItem('${themePreferenceKey}', choice);
    } catch {}
    apply();
  });
})();`;
