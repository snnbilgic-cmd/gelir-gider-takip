const Transactions = {
  period: null, // { year, month }

  init() {
    const now = new Date();
    this.period = { year: now.getFullYear(), month: now.getMonth() + 1 };
    this.bind();
    this.render();
  },

  bind() {
    document.getElementById('btn-prev-month').addEventListener('click', () => this.shiftMonth(-1));
    document.getElementById('btn-next-month').addEventListener('click', () => this.shiftMonth(1));
    document.getElementById('form-record').addEventListener('submit', (e) => this.saveNew(e));
    document.getElementById('btn-reset-form').addEventListener('click', () => this.resetForm());
    document.getElementById('f-type').addEventListener('change', () => this.populateCategorySelect());
    document.getElementById('btn-save-period-note').addEventListener('click', () => this.savePeriodNote());
  },

  periodKey() {
    return `${Auth.currentUser}|${this.period.year}-${String(this.period.month).padStart(2,'0')}`;
  },

  periodStr() {
    return `${this.period.year}-${String(this.period.month).padStart(2,'0')}`;
  },

  shiftMonth(delta) {
    let m = this.period.month + delta;
    let y = this.period.year;
    if (m < 1) { m = 12; y--; }
    if (m > 12) { m = 1; y++; }
    this.period = { year: y, month: m };
    this.render();
  },

  populateCategorySelect(selected) {
    const type = document.getElementById('f-type').value;
    Categories.renderSelect(document.getElementById('f-category'), type, selected);
  },

  resetForm() {
    document.getElementById('form-record').reset();
    this.populateCategorySelect();
  },

  async saveNew(e) {
    e.preventDefault();
    const type = document.getElementById('f-type').value;
    const category = document.getElementById('f-category').value;
    const amount = parseFloat(document.getElementById('f-amount').value);
    const due = document.getElementById('f-due').value;
    const note = document.getElementById('f-note').value.trim();

    if (!category || isNaN(amount) || amount <= 0 || !due) {
      toast('Lütfen tüm alanları doldurun');
      return;
    }

    const d = DB.get();
    const period = this.periodStr();

    // Yinelenen kayıt kontrolü (aynı dönem + kategori + tür + miktar)
    const dup = d.records.find(r =>
      r.username === Auth.currentUser &&
      r.period === period &&
      r.type === type &&
      r.category === category &&
      Math.abs(r.amount - amount) < 0.01
    );
    if (dup) {
      if (!confirm(`Bu ay "${category}" için ${amount} ₺ tutarında zaten bir kayıt var.\nYine de eklensin mi?`)) {
        return;
      }
    }

    const record = {
      id: uid(),
      username: Auth.currentUser,
      period,
      type,
      category,
      amount,
      due,
      note,
      status: 'unpaid',
      createdAt: Date.now()
    };
    d.records.push(record);
    DB.set(d);

    await Alarm.schedule(record);
    toast('Kayıt eklendi');
    this.resetForm();
    this.render();

    // Ekle sekmesinden listeye dön
    document.querySelector('.tab[data-tab="list"]').click();
  },

  savePeriodNote() {
    const d = DB.get();
    const key = this.periodKey();
    d.periodNotes[key] = document.getElementById('period-note').value;
    DB.set(d);
    toast('Dönem notu kaydedildi');
  },

  getPeriodRecords() {
    const period = this.periodStr();
    return DB.get().records.filter(r =>
      r.username === Auth.currentUser && r.period === period
    );
  },

  render() {
    // Dönem başlığı
    const monthNames = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran',
                        'Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
    document.getElementById('period-label').textContent =
      `${monthNames[this.period.month - 1]} ${this.period.year}`;

    // Dönem notu
    const key = this.periodKey();
    document.getElementById('period-note').value = DB.get().periodNotes[key] || '';

    // Liste
    const records = this.getPeriodRecords().sort((a,b) => a.due.localeCompare(b.due));
    const listEl = document.getElementById('records-list');
    listEl.innerHTML = '';
    if (records.length === 0) {
      listEl.innerHTML = '<p style="text-align:center;color:var(--text-muted);padding:20px">Bu dönemde kayıt yok</p>';
    }
    records.forEach(r => listEl.appendChild(this.renderRecord(r)));

    // Özet
    this.updateSummary(records);
  },

  renderRecord(r) {
    const div = document.createElement('div');
    div.className = `record-item ${r.type}`;
    const sign = r.type === 'income' ? '+' : '-';
    const statusLabel = r.status === 'paid'
      ? '<span style="color:var(--income)">✅ Ödendi</span>'
      : '<span style="color:var(--expense)">⏳ Ödenmedi</span>';
    div.innerHTML = `
      <div class="record-head">
        <span class="record-category">${r.category}</span>
        <span class="record-amount">${sign}${r.amount.toFixed(2)} ₺</span>
      </div>
      <div class="record-meta">
        <span>📅 ${r.due}</span>
        <span>${statusLabel}</span>
      </div>
      ${r.note ? `<div class="record-note">📝 ${r.note}</div>` : ''}
      <div class="record-actions">
        <button class="btn-small" data-edit="${r.id}">✏️ Düzenle</button>
        <button class="btn-small" data-del="${r.id}">🗑️ Sil</button>
        ${r.status !== 'paid' ? `<button class="btn-small" data-paid="${r.id}">✅ Ödendi</button>` : ''}
      </div>
    `;
    div.querySelector('[data-edit]').addEventListener('click', () => this.editRecord(r.id));
    div.querySelector('[data-del]').addEventListener('click', () => this.deleteRecord(r.id));
    const paidBtn = div.querySelector('[data-paid]');
    if (paidBtn) paidBtn.addEventListener('click', () => this.markPaid(r.id));
    return div;
  },

  updateSummary(records) {
    const income = records.filter(r => r.type === 'income').reduce((s,r) => s + r.amount, 0);
    const expense = records.filter(r => r.type === 'expense').reduce((s,r) => s + r.amount, 0);
    const balance = income - expense;
    document.getElementById('sum-income').textContent = income.toFixed(2) + ' ₺';
    document.getElementById('sum-expense').textContent = expense.toFixed(2) + ' ₺';
    document.getElementById('sum-balance').textContent = balance.toFixed(2) + ' ₺';
    document.getElementById('sum-balance').style.color =
      balance >= 0 ? 'var(--income)' : 'var(--expense)';
  },

  editRecord(id) {
    const d = DB.get();
    const r = d.records.find(x => x.id === id);
    if (!r) return;

    const newAmount = prompt('Yeni miktar:', r.amount);
    if (newAmount === null) return;
    const newNote = prompt('Yeni not:', r.note || '');
    if (newNote === null) return;
    const newDue = prompt('Yeni son ödeme tarihi (YYYY-AA-GG):', r.due);
    if (newDue === null) return;

    const amt = parseFloat(newAmount);
    if (isNaN(amt) || amt <= 0) { toast('Geçersiz miktar'); return; }

    r.amount = amt;
    r.note = newNote;
    r.due = newDue;
    DB.set(d);

    Alarm.cancel(r).then(() => Alarm.schedule(r));
    toast('Güncellendi');
    this.render();
  },

  deleteRecord(id) {
    if (!confirm('Bu kayıt silinsin mi?')) return;
    const d = DB.get();
    const r = d.records.find(x => x.id === id);
    if (r) Alarm.cancel(r);
    d.records = d.records.filter(x => x.id !== id);
    DB.set(d);
    toast('Silindi');
    this.render();
  },

  markPaid(id) {
    const d = DB.get();
    const r = d.records.find(x => x.id === id);
    if (!r) return;
    r.status = 'paid';
    DB.set(d);
    Alarm.cancel(r);
    toast('Ödendi olarak işaretlendi');
    this.render();
  }
};