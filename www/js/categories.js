/* Kategoriler yönetimi */
const Categories = {
  getAll(type) {
    const d = DB.get();
    return d.categories[type] || [];
  },
  add(type, name) {
    const d = DB.get();
    if (!d.categories[type]) d.categories[type] = [];
    if (!d.categories[type].includes(name)) {
      d.categories[type].push(name);
      DB.set(d);
    }
  },
  remove(type, name) {
    const d = DB.get();
    d.categories[type] = (d.categories[type] || []).filter(c => c !== name);
    DB.set(d);
  },
  renderSelect(selectEl, type, selected) {
    selectEl.innerHTML = '';
    this.getAll(type).forEach(cat => {
      const opt = document.createElement('option');
      opt.value = cat;
      opt.textContent = cat;
      if (cat === selected) opt.selected = true;
      selectEl.appendChild(opt);
    });
  },
  renderManager(container) {
    container.innerHTML = '';
    ['income','expense'].forEach(type => {
      const title = document.createElement('h4');
      title.textContent = type === 'income' ? 'Gelir Kategorileri' : 'Gider Kategorileri';
      title.style.margin = '10px 0 6px';
      container.appendChild(title);
      this.getAll(type).forEach(cat => {
        const row = document.createElement('div');
        row.className = 'cat-row';
        row.innerHTML = `<span>${cat}</span><button data-type="${type}" data-cat="${cat}">✕</button>`;
        container.appendChild(row);
      });
      const addRow = document.createElement('div');
      addRow.className = 'cat-row';
      addRow.innerHTML = `<input placeholder="Yeni kategori..." id="new-cat-${type}" />
        <button style="color:var(--primary)" data-add="${type}">+</button>`;
      container.appendChild(addRow);
    });

    container.querySelectorAll('[data-cat]').forEach(b => {
      b.addEventListener('click', () => {
        if (!confirm(`"${b.dataset.cat}" silinsin mi?`)) return;
        this.remove(b.dataset.type, b.dataset.cat);
        this.renderManager(container);
      });
    });
    container.querySelectorAll('[data-add]').forEach(b => {
      b.addEventListener('click', () => {
        const type = b.dataset.add;
        const input = container.querySelector(`#new-cat-${type}`);
        const val = input.value.trim();
        if (!val) return;
        this.add(type, val);
        this.renderManager(container);
      });
    });
  }
};