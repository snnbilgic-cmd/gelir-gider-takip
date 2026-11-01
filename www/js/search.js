const Search = {
  init() {
    document.getElementById('search-input').addEventListener('input', (e) => {
      this.run(e.target.value.trim());
    });
  },

  run(q) {
    const container = document.getElementById('search-results');
    if (!q) { container.innerHTML = ''; return; }

    const lower = q.toLowerCase();
    const results = DB.get().records.filter(r =>
      r.username === Auth.currentUser &&
      (
        r.category.toLowerCase().includes(lower) ||
        (r.note || '').toLowerCase().includes(lower) ||
        String(r.amount).includes(q) ||
        r.period.includes(q) ||
        r.due.includes(q)
      )
    ).sort((a,b) => b.due.localeCompare(a.due));

    container.innerHTML = '';
    if (results.length === 0) {
      container.innerHTML = '<p style="text-align:center;color:var(--text-muted);padding:20px">Sonuç bulunamadı</p>';
      return;
    }
    results.forEach(r => {
      const div = document.createElement('div');
      div.className = `record-item ${r.type}`;
      const sign = r.type === 'income' ? '+' : '-';
      div.innerHTML = `
        <div class="record-head">
          <span class="record-category">${r.category}</span>
          <span class="record-amount">${sign}${r.amount.toFixed(2)} ₺</span>
        </div>
        <div class="record-meta">
          <span>📅 ${r.due}</span>
          <span>📆 ${r.period}</span>
        </div>
        ${r.note ? `<div class="record-note">📝 ${r.note}</div>` : ''}
      `;
      container.appendChild(div);
    });
  }
};