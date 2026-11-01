/* Yerel bildirim tabanlı alarm. Capacitor LocalNotifications varsa kullan,
   yoksa fallback olarak tarayıcı Notification / setTimeout. */
const Alarm = {
  isNative: false,

  async init() {
    if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.LocalNotifications) {
      this.isNative = true;
      const LN = window.Capacitor.Plugins.LocalNotifications;
      try {
        await LN.requestPermissions();
      } catch (e) { console.warn('Bildirim izni alınamadı', e); }
      // Alarm tıklama dinleyicisi
      LN.addListener('localNotificationActionPerformed', (action) => {
        const id = action.notification.id;
        const record = DB.get().records.find(r => this._alarmIdFor(r) === id);
        if (record) this.showAlarmModal(record);
      });
    }
  },

  _alarmIdFor(record) {
    // Record id'sinden deterministik bir sayı üret
    let h = 0;
    const s = record.id || '';
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    return (h % 2000000000) + 1;
  },

  /* Belirli bir kayıt için ödeme tarihine alarm kur */
  async schedule(record) {
    if (!record.due) return;
    const dueTime = new Date(record.due + 'T09:00:00').getTime();
    if (isNaN(dueTime)) return;
    const now = Date.now();
    if (dueTime <= now) return; // geçmiş tarih

    const id = this._alarmIdFor(record);
    const title = record.type === 'income' ? '💰 Gelir Hatırlatma' : '💸 Ödeme Hatırlatma';
    const body = `${record.category} - ${record.amount.toFixed(2)} ₺ (${record.due})`;

    if (this.isNative) {
      const LN = window.Capacitor.Plugins.LocalNotifications;
      try {
        await LN.cancel({ notifications: [{ id }] }).catch(() => {});
        await LN.schedule({
          notifications: [{
            id,
            title,
            body,
            schedule: { at: new Date(dueTime) },
            sound: null,
            smallIcon: 'ic_stat_icon_config_sample',
            actionTypeId: 'PAYMENT_ACTIONS'
          }]
        });
      } catch (e) { console.warn('Alarm kurulamadı', e); }
    } else {
      // Web fallback
      const delay = dueTime - now;
      if (delay < 2147483647) {
        setTimeout(() => this.showAlarmModal(record), delay);
      }
    }
  },

  async snooze(record) {
    // 1 saat sonra tekrar
    const now = Date.now();
    const when = new Date(now + 60 * 60 * 1000);
    if (this.isNative) {
      const LN = window.Capacitor.Plugins.LocalNotifications;
      const id = this._alarmIdFor(record);
      try {
        await LN.cancel({ notifications: [{ id }] }).catch(() => {});
        await LN.schedule({
          notifications: [{
            id,
            title: '⏰ Tekrar Hatırlatma',
            body: `${record.category} - ${record.amount.toFixed(2)} ₺`,
            schedule: { at: when }
          }]
        });
      } catch (e) { console.warn(e); }
    } else {
      setTimeout(() => this.showAlarmModal(record), 60 * 60 * 1000);
    }
    toast('1 saat sonra tekrar hatırlatılacak');
  },

  async cancel(record) {
    if (!this.isNative) return;
    const LN = window.Capacitor.Plugins.LocalNotifications;
    const id = this._alarmIdFor(record);
    try { await LN.cancel({ notifications: [{ id }] }); } catch (e) {}
  },

  showAlarmModal(record) {
    const modal = document.getElementById('alarm-modal');
    document.getElementById('alarm-text').textContent =
      `${record.category} - ${record.amount.toFixed(2)} ₺\nSon ödeme: ${record.due}${record.note ? '\nNot: ' + record.note : ''}`;
    modal.classList.remove('hidden');

    document.getElementById('alarm-paid').onclick = () => {
      record.status = 'paid';
      DB.set(DB.get().records.map(r => r.id === record.id ? record : r));
      this.cancel(record);
      modal.classList.add('hidden');
      toast('Ödendi olarak işaretlendi');
      if (window.Transactions) Transactions.render();
    };
    document.getElementById('alarm-snooze').onclick = () => {
      this.snooze(record);
      modal.classList.add('hidden');
    };
  }
};