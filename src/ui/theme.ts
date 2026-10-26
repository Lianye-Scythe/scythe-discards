import type { Theme } from '../core/model.ts';

function applyTheme(value: unknown): void {
  const theme: Theme = value === 'dark' || value === 'light' ? value : 'system';
  document.documentElement.dataset.theme = theme;
  try { localStorage.setItem('discards:theme', theme); } catch { /* Storage is only a first-paint cache. */ }
}

function storedTheme(value: unknown): unknown {
  return value && typeof value === 'object' ? (value as { theme?: unknown }).theme : undefined;
}

try { applyTheme(localStorage.getItem('discards:theme')); } catch { applyTheme('system'); }
if (globalThis.chrome?.storage) {
  void chrome.storage.local.get('settings').then(data => applyTheme(storedTheme(data.settings)));
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes.settings) applyTheme(storedTheme(changes.settings.newValue));
  });
}
