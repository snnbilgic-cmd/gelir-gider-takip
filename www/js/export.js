/* Dışa/içe aktarma: JSON yedek, Excel ve PDF rapor */
const Exporter = {
  init() {
    document.getElementById('btn-export-json').addEventListener('click', () => this.exportJSON());
    document.getElementById('btn-import-json').addEventListener('click', () => {
      document.getElementById('import-file').click();
    });
    document.getElementById('import-file').addEventListener('change', (e) => this.importJSON(e));
    document.getElementById('btn-export-excel').addEventListener('click', () => this.exportExcel());
    document.getElementById('btn-export-pdf').addEventListener('click', () => this.exportPDF());
  },

  async saveFile(filename, content, mimeType) {
    // Native (Capacitor Filesystem) varsa oraya, yoksa indir
    if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Filesystem) {
      const { Filesystem, Directory, Encoding } = window.Capacitor.Plugins;
      try {
        const isBase64 = mimeType && !mimeType.includes('text') && !mimeType.includes('json');
        const result = await Filesystem.writeFile({
          path: filename,
          data: content,
          directory: Directory.Documents,
          encoding: isBase64 ? undefined : Encoding.UTF8
        });
        toast('Kaydedildi: ' + result.uri);
        return;
      } catch (e) {
        console.warn('Filesystem hatası, indirme deneniyor', e);
      }
    }
    // Web fallback: blob indir
    const blob = content instanceof Blob
      ? content
      : new Blob([content], { type: mimeType || 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    toast('Dosya indirildi: ' + filename);
  },

  async exportJSON() {
    const d = DB.get();
    const filtered = {
      exportedAt: new Date().toISOString(),
      user: Auth.currentUser,
      users: d.users,
      records: d.records.filter(r => r.username === Auth.currentUser),
      periodNotes: Object.fromEntries(
        Object.entries(d.periodNotes).filter(([k]) => k.startsWith(Auth.currentUser + '|'))
      ),
      categories: d.categories
    };
    const json = JSON.stringify(filtered, null, 2);
    const fname = `ggt_yedek_${Auth.currentUser}_${Date.now()}.json`;
    await this.saveFile(fname, json, 'application/json');
  },

  async importJSON(e) {
    const file = e.target.files[0];
    if (!file) return;
    const text = await file.text();
    try {
      const imported = JSON.parse(text);
      if (!confirm('Mevcut verilerin üzerine yazılacak. Devam edilsin mi?')) return;
      const d = DB.get();
      // Kullanıcıları birleştir (aynı isim varsa atla)
      (imported.users || []).forEach(u => {
        if (!d.users.find(x => x.username === u.username)) d.users.push(u);
      });
      // Kayıtları ekle
      (imported.records || []).forEach(r => {
        if (!d.records.find(x => x.id === r.id)) d.records.push(r);
      });
      // Dönem notlarını birleştir
      Object.assign(d.periodNotes, imported.periodNotes || {});
      // Kategoriler
      if (imported.categories) {
        Object.keys(imported.categories).forEach(t => {
          d.categories[t] = Array.from(new Set([
            ...(d.categories[t] || []),
            ...(imported.categories[t] || [])
          ]));
        });
      }
      DB.set(d);
      toast('İçe aktarma tamamlandı');
      Transactions.render();
    } catch (err) {
      toast('Geçersiz JSON dosyası');
      console.error(err);
    }
    e.target.value = '';
  },

  getPeriodRows(period) {
    return DB.get().records
      .filter(r => r.username === Auth.currentUser && r.period === period)
      .sort((a,b) => a.due.localeCompare(b.due));
  },

  getPeriods() {
    const set = new Set();
    DB.get().records
      .filter(r => r.username === Auth.currentUser)
      .forEach(r => set.add(r.period));
    return Array.from(set).sort();
  },

  async exportExcel() {
    const period = Transactions.periodStr();
    const rows = this.getPeriodRows(period);
    if (rows.length === 0) { toast('Bu dönemde kayıt yok'); return; }

    if (!window.XLSX) { toast('Excel kütüphanesi yüklenmedi'); return; }

    const data = [
      ['Tür','Kategori','Miktar (TL)','Son Ödeme','Durum','Not']
    ];
    rows.forEach(r => {
      data.push([
        r.type === 'income' ? 'Gelir' : 'Gider',
        r.category,
        r.amount,
        r.due,
        r.status === 'paid' ? 'Ödendi' : 'Ödenmedi',
        r.note || ''
      ]);
    });
    const income = rows.filter(r => r.type === 'income').reduce((s,r) => s + r.amount, 0);
    const expense = rows.filter(r => r.type === 'expense').reduce((s,r) => s + r.amount, 0);
    data.push([]);
    data.push(['Toplam Gelir', '', income]);
    data.push(['Toplam Gider', '', expense]);
    data.push(['Bakiye', '', income - expense]);

    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, period);
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    await this.saveFile(`ggt_rapor_${period}.xlsx`, blob);
  },

  async exportPDF() {
    const period = Transactions.periodStr();
    const rows = this.getPeriodRows(period);
    if (rows.length === 0) { toast('Bu dönemde kayıt yok'); return; }

    if (!window.jspdf) { toast('PDF kütüphanesi yüklenmedi'); return; }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(`Gelir/Gider Raporu - ${period}`, 14, 20);
    doc.setFontSize(10);
    doc.text(`Kullanıcı: ${Auth.currentUser}`, 14, 28);
    doc.text(`Tarih: ${new Date().toLocaleString('tr-TR')}`, 14, 34);

    const body = rows.map(r => [
      r.type === 'income' ? 'Gelir' : 'Gider',
      r.category,
      r.amount.toFixed(2),
      r.due,
      r.status === 'paid' ? 'Ödendi' : 'Ödenmedi',
      r.note || ''
    ]);
    doc.autoTable({
      startY: 40,
      head: [['Tür','Kategori','Miktar','Tarih','Durum','Not']],
      body,
      styles: { fontSize: 8 }
    });

    const income = rows.filter(r => r.type === 'income').reduce((s,r) => s + r.amount, 0);
    const expense = rows.filter(r => r.type === 'expense').reduce((s,r) => s + r.amount, 0);
    const y = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(11);
    doc.text(`Toplam Gelir: ${income.toFixed(2)} TL`, 14, y);
    doc.text(`Toplam Gider: ${expense.toFixed(2)} TL`, 14, y + 6);
    doc.text(`Bakiye: ${(income - expense).toFixed(2)} TL`, 14, y + 12);

    const pdfBlob = doc.output('blob');
    await this.saveFile(`ggt_rapor_${period}.pdf`, pdfBlob, 'application/pdf');
  }
};