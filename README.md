# 💰 Gelir Gider Takip (Android)

Capacitor + Vanilla JS (modüler CSS/JS) ile geliştirilmiş, çevrimdışı çalışan aylık gelir/gider takip uygulaması.

## ✨ Özellikler

- 🔐 Yerel hesap (kullanıcı adı + parola hash) + profil fotoğrafı
- 📅 Ay/yıl dönem seçimi (◀ ▶ okları ile)
- 💵 Gelir/Gider kayıtları: tür, rutin kategori, miktar, son ödeme tarihi, not
- 🧮 Otomatik gelir/gider/bakiye özeti
- 🔔 Son ödeme tarihine göre yerel alarm (uygulama kapalıyken de çalışır)
- ⏳ Alarmda "Ödendi" / "1 saat sonra tekrar hatırlat" seçenekleri
- 🗂️ 30+ hazır rutin kategori (Maaş, Elektrik, Su, Doğalgaz, Aidat vb.)
- 🔍 Tüm kayıtlarda arama
- 📊 İki dönem karşılaştırma
- 🎨 Dark/Light + 5 pastel tema
- ⚠️ Yinelenen kayıt uyarısı
- ✏️ Kayıt düzenleme / silme / ödendi işaretleme
- 📝 Dönem notu + kayıt notu
- 📤 JSON yedek/geri yükleme
- 📊 Excel ve PDF rapor çıktısı

## 🛠️ Geliştirme

```bash
npm install
npx cap add android     # ilk seferde
npx cap sync android
npx cap open android    # Android Studio açılır
