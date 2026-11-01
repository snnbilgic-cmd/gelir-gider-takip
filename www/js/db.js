/* Basit localStorage tabanlı DB. Capacitor SQLite eklentisiyle değiştirilebilir. */
const DB = {
  KEY: 'ggt_data_v1',
  load() {
    try {
      return JSON.parse(localStorage.getItem(this.KEY)) || this.empty();
    } catch { return this.empty(); }
  },
  empty() {
    return {
      users: [],       // { username, passwordHash, photo }
      records: [],     // { id, username, period, type, category, amount, due, note, status, createdAt }
      periodNotes: {}, // { "username|2026-11": "not" }
      categories: {
        income: ["Maaş","Ek Gelir","Kira Geliri","Türkiye Finanstan Çekilen"],
        expense: [
          "Ziraat Bankası Troy","Ziraat Bankası M.Card","Halk Bankası Troy",
          "Halk Bankası M.Card","Türkiye Finans","Elektrik Faturası",
          "Su Faturası","Doğal gaz Faturası","Sıcak Su Doğal gaz Faturası",
          "İnternet Faturası","Site Aidatı","Sabiha Telefon Faturası",
          "Sinan Telefon Faturası","Hüda Nur Telefon Faturası","Hüda Nur Aylık",
          "Sabihaya","Sinana","Traş İçin","İş Yeri Yemek","İş Yeri Çay",
          "İş Yeri Su","Araç Sigortası","Araç Muayenesi","Araç Bakımı",
          "Araç Lastiği","Kira / Konut","Mutfak & Market","Eğitim & Kurs",
          "Sağlık & Bakım","Diğer"
        ]
      }
    };
  },
  save(data) { localStorage.setItem(this.KEY, JSON.stringify(data)); },
  get() { return this.load(); },
  set(d) { this.save(d); }
};

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function hashCode(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return String(h);
}

function toast(msg) {
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2600);
}