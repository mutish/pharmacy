// Dark/Light mode toggle using CSS variables and class on <html>
const KEY = 'theme';

function apply(theme){
  const root = document.documentElement;
  if(theme === 'dark') root.classList.add('dark-mode');
  else root.classList.remove('dark-mode');
}

export function initThemeToggle(){
  const saved = localStorage.getItem(KEY) || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  apply(saved);
  document.addEventListener('click', (e)=>{
    const btn = e.target.closest('[data-theme-toggle]');
    if(!btn) return;
    const current = document.documentElement.classList.contains('dark-mode') ? 'dark' : 'light';
    const next = current === 'dark' ? 'light' : 'dark';
    localStorage.setItem(KEY, next);
    apply(next);
  });
}

// auto-init if included directly
initThemeToggle();
