const Auth = {
  currentUser: null,
  _pendingPhoto: null,

  init() {
    const session = localStorage.getItem('ggt_session');
    if (session) {
      this.currentUser = session;
      this.showApp();
    } else {
      this.showAuth();
    }
    this.bindEvents();
  },

  bindEvents() {
    document.getElementById('auth-photo-btn').addEventListener('click', () => {
      document.getElementById('auth-photo-input').click();
    });
    document.getElementById('auth-photo-input').addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        document.getElementById('auth-photo').src = reader.result;
        this._pendingPhoto = reader.result;
      };
      reader.readAsDataURL(file);
    });

    document.getElementById('btn-register').addEventListener('click', () => this.register());
    document.getElementById('btn-login').addEventListener('click', () => this.login());
    document.getElementById('btn-logout').addEventListener('click', () => this.logout());
  },

  msg(text, ok = false) {
    const el = document.getElementById('auth-msg');
    el.textContent = text;
    el.style.color = ok ? 'var(--income)' : 'var(--expense)';
  },

  register() {
    const username = document.getElementById('auth-username').value.trim();
    const password = document.getElementById('auth-password').value;
    if (!username || !password) return this.msg('Kullanıcı adı ve parola zorunlu');
    const d = DB.get();
    if (d.users.find(u => u.username === username)) return this.msg('Bu kullanıcı zaten var');
    d.users.push({
      username,
      passwordHash: hashCode(password),
      photo: this._pendingPhoto || null
    });
    DB.set(d);
    this.msg('Kayıt başarılı! Giriş yapabilirsiniz.', true);
  },

  login() {
    const username = document.getElementById('auth-username').value.trim();
    const password = document.getElementById('auth-password').value;
    const d = DB.get();
    const user = d.users.find(u => u.username === username);
    if (!user) return this.msg('Kullanıcı bulunamadı');
    if (user.passwordHash !== hashCode(password)) return this.msg('Parola hatalı');
    this.currentUser = username;
    localStorage.setItem('ggt_session', username);
    this.showApp();
  },

  logout() {
    if (!confirm('Çıkış yapılsın mı?')) return;
    this.currentUser = null;
    localStorage.removeItem('ggt_session');
    this.showAuth();
  },

  showAuth() {
    document.getElementById('auth-screen').classList.remove('hidden');
    document.getElementById('app-screen').classList.add('hidden');
  },

  showApp() {
    document.getElementById('auth-screen').classList.add('hidden');
    document.getElementById('app-screen').classList.remove('hidden');

    // Kullanıcı bilgilerini doldur
    const d = DB.get();
    const user = d.users.find(u => u.username === this.currentUser);
    if (user) {
      document.getElementById('topbar-username').textContent = user.username;
      if (user.photo) {
        document.getElementById('topbar-photo').src = user.photo;
      }
    }

    // App başlat
    if (window.App) window.App.start();
  }
};