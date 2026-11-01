const Compare = {
  init() {
    this.populatePeriodSelects();
    document.getElementById('btn-compare').addEventListener('click', () => this.run());
  },

  populatePeriodSelects() {
    const periods = this.getAllPeriods();
    ['cmp-a','cmp-b'].forEach(id => {
      const el = document.getElementById(id);
      el.innerHTML = '';
      periods.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p;
        opt.textContent = p;
        el.appendChild(opt);
      });
    });
    // Varsayılan: son iki dönem
    const a = document.getElementById('cmp-a');
    const b = document.getElementById('cmp-b');
    if (periods.length >= 1) a.value = periods[periods.length - 1];
    if (periods.length >= 2) b.value = periods[periods.length - 2];
  },

  getAllPeriods() {
    const set = new Set();
    DB.get().records
      .filter(r => r.username === Auth.currentUser)
      .forEach(r => set.add(r.period));
    return Array.from(set).sort();
  },

  run() {
    const pA = document.getElementById('cmp-a').value;
    const pB = document.getElementById('cmp-b').value;
    const all = DB.get().records.filter(r => r.username === Auth.currentUser);

    const stats = (period) => {
      const rs = all.filter(r => r.period === period);
      const income = rs.filter(r => r.type === 'income').reduce((s,r) => s + r.amount, 0);
      const expense = rs.filter(r => r.type === 'expense').reduce((s,r) => s + r.amount, 0);
      return { income, expense, balance: income - expense, count: rs.length };
    };

    const A = stats(pA), B = stats(pB);
    const result = document.getElementById('compare-result');
    result.innerHTML = `
      <div class="compare-row">
        <span>${pA}</span>
        <span>Gelir: ${A.income.toFixed(2)} ₺ | Gider: ${A.expense.toFixed(2)} ₺ | Bakiye: <b class="${A.balance >= 0 ? 'positive' : 'negative'}">${A.balance.toFixed(2)} ₺</b></span>
      </div>
      <div class="compare-row">
        <span>${pB}</span>
        <span>Gelir: ${B.income.toFixed(2)} ₺ | Gider: ${B.expense.toFixed(2)} ₺ | Bakiye: <b class="${B.balance >= 0 ? 'positive' : 'negative'}">${B.balance.toFixed(2)} ₺</b></span>
      </div>
      <div class="compare-row">
        <span>Fark (A − B)</span>
        <span>
          Gelir: <b class="${A.income - B.income >= 0 ? 'positive' : 'negative'}">${(A.income - B.income).toFixed(2)} ₺</b> |
          Gider: <b class="${A.expense - B.expense >= 0 ? 'negative' : 'positive'}">${(A.expense - B.expense).toFixed(2)} ₺</b> |
          Bakiye: <b class="${A.balance - B.balance >= 0 ? 'positive' : 'negative'}">${(A.balance - B.balance).toFixed(2)} ₺</b>
        </span>
      </div>
    `;
  }
};