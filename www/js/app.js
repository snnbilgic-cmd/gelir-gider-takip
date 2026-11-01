const App = {
  started: false,

  async init() {
    Theme.init();
    Auth.init();
  },

  async start() {
    if (this.started) {
      Transactions.render();
      return;
    }
    this.started = true;

    await Alarm.init();
    Transactions.init();
    Search.init();
    Compare.init();
    Exporter.init();
    this.bindTabs();

    Categories.renderManager(document.getElementById('categories-manager'));

    // Mevcut kayıtlar için alarmları yeniden kur
    DB.get().records
      .filter(r => r.username === Auth.currentUser && r.status !== 'paid')
      .forEach(r => Alarm.schedule(r));
  },

  bindTabs() {
    document.querySelectorAll('.tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        tab.classList.add('active');
        const id = 'tab-' + tab.dataset.tab;
        document.getElementById(id).classList.add('active');

        // Sekmeye özel yeniden render
        if (tab.dataset.tab === 'compare') Compare.populatePeriodSelects();
        if (tab.dataset.tab === 'add') Transactions.populateCategorySelect();
        if (tab.dataset.tab === 'search') Search.run(document.getElementById('search-input').value.trim());
      });
    });
  }
};

document.addEventListener('DOMContentLoaded', () => App.init());