export const themeInitScript = `
  (function() {
    try {
      var localTheme = localStorage.getItem('quanta-theme');
      var theme = localTheme || (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
      if (theme === 'light') {
        document.documentElement.classList.add('light');
        document.documentElement.classList.remove('dark');
      } else {
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('light');
      }
    } catch (e) {}
  })();
`;
