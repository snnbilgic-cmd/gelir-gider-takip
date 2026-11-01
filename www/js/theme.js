const Theme = {
  KEY: 'ggt_theme',
  current: 'light',

  init() {
    this.current = localStorage.getItem(this.KEY) || 'light';
    this.apply(this.current);

    document.getElementById('btn-theme-toggle').addEventListener('click', () => this.toggleDarkLight());
    document.getElementById('btn-theme-pastel').addEventListener('click', () => this.cyclePastel());
  },

  apply(theme) {
    document.body.setAttribute('data-theme', theme);
    this.current = theme;
    localStorage.setItem(this.KEY, theme);
  },

  toggleDarkLight() {
    const next = (this.current === 'dark') ? 'light' : 'dark';
    this.apply(next);
  },

  cyclePastel() {
    const pastels = ['pastel-1','pastel-2','pastel-3','pastel-4','pastel-5'];
    const idx = pastels.indexOf(this.current);
    const next = pastels[(idx + 1) % pastels.length];
    this.apply(next);
    toast('Tema: ' + next);
  }
};