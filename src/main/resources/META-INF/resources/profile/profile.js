// Tab-Switching für Beiträge/Favoriten
document.addEventListener('DOMContentLoaded', function () {
    const tabPartys = document.getElementById('tabPartys');
    const tabPosts = document.getElementById('tabPosts');
    const tabFavorites = document.getElementById('tabFavorites');
    const contentPartys = document.getElementById('tabContentPartys');
    const contentPosts = document.getElementById('tabContentPosts');
    const contentFavorites = document.getElementById('tabContentFavorites');

    function setActiveTab(activeBtn, activeContent) {
        [tabPartys, tabPosts, tabFavorites].forEach(btn => btn.classList.remove('active'));
        [contentPartys, contentPosts, contentFavorites].forEach(section => section.style.display = 'none');
        activeBtn.classList.add('active');
        activeContent.style.display = '';
    }

    tabPartys.addEventListener('click', function () {
        setActiveTab(tabPartys, contentPartys);
    });
    tabPosts.addEventListener('click', function () {
        setActiveTab(tabPosts, contentPosts);
    });
    tabFavorites.addEventListener('click', function () {
        setActiveTab(tabFavorites, contentFavorites);
    });
});

document.addEventListener('DOMContentLoaded', () => {
  const samplePartys = [
    { id: 1, name: 'Summer Beats', date: '01.06.2025', time: '22:00', place: 'Linz' },
    { id: 2, name: 'AfterShow', date: '12.07.2025', time: '23:00', place: 'Wels' }
  ];

  const grid = document.querySelector('.party-grid');
  const tpl = document.getElementById('party-template');
  const noParties = document.querySelector('.no-parties');

  function render(partys) {
    grid.innerHTML = '';
    if (!partys || partys.length === 0) {
      noParties.style.display = '';
      return;
    }
    noParties.style.display = 'none';
    partys.forEach(p => {
      const clone = tpl.content.cloneNode(true);
      const article = clone.querySelector('.party-card');
      article.dataset.id = p.id;
      article.querySelector('.party-name').textContent = p.name;
      const infoBoxes = article.querySelectorAll('.info-box .info-value');
      // set values in order (Datum, Uhrzeit, Ort)
      const vals = [p.date, p.time, p.place];
      article.querySelectorAll('.info-box').forEach((box, i) => {
        box.querySelector('.info-value').textContent = vals[i] || '';
      });

      // attach handlers
      const editBtn = article.querySelector('.edit-btn');
      const delBtn = article.querySelector('.delete-btn');

      editBtn.addEventListener('click', () => {
        // placeholder: öffne edit-form oder navigiere
        // z.B. window.location.href = `./editParty.html?id=${p.id}`;
        console.log('Edit', p.id);
        alert('Edit: ' + p.name);
      });

      delBtn.addEventListener('click', () => {
        if (!confirm(`Party "${p.name}" löschen?`)) return;
        // Entferne aus DOM
        article.remove();
        // entferne aus samplePartys (nur in-memory)
        const idx = samplePartys.findIndex(x => x.id === p.id);
        if (idx > -1) samplePartys.splice(idx, 1);
        // falls leer: message zeigen
        if (samplePartys.length === 0) noParties.style.display = '';
      });

      grid.appendChild(clone);
    });
  }

  render(samplePartys);
});

// --- dynamic profile image loader ---
(function() {
  function getQueryParam(name) {
    const params = new URLSearchParams(window.location.search);
    return params.get(name);
  }

  const userId = getQueryParam('id');
  const img = document.getElementById('profileImg');
  if (!img) return;

  if (userId) {
    // Start loading the generic profile-picture endpoint immediately to avoid alt text showing
    img.src = '/api/users/' + encodeURIComponent(userId) + '/profile-picture';

    // Then try to fetch the user to get stored profileImage filename and refine the request
    fetch('/api/users/' + encodeURIComponent(userId))
      .then(r => {
        if (!r.ok) throw new Error('user not found');
        return r.json();
      })
      .then(user => {
        const name = user.profileImage || '';
        if (name) {
          const nameParam = '?name=' + encodeURIComponent(name);
          // only change src if different to avoid reload
          const newSrc = '/api/users/' + encodeURIComponent(userId) + '/profile-picture' + nameParam;
          if (img.src !== newSrc) img.src = newSrc;
        }
      })
      .catch(err => {
        // ignore; we already set generic src
      });

    img.onerror = function() {
      if (!this._triedFallback) {
        this._triedFallback = 1;
        this.src = '/api/users/' + encodeURIComponent(userId) + '/profile-picture?name=profile_picture3.jpg';
      } else if (this._triedFallback === 1) {
        this._triedFallback = 2;
        this.src = '/api/users/' + encodeURIComponent(userId) + '/profile-picture?name=profile_picture1.jpg';
      }
    };
  } else {
    // no user id provided: try to load first user so page still shows a profile image
    fetch('/api/users/')
      .then(r => r.ok ? r.json() : Promise.reject('no users'))
      .then(list => {
        if (Array.isArray(list) && list.length > 0) {
          const u = list[0];
          const uid = u.id;
          const name = u.profileImage || '';
          const nameParam = name ? '?name=' + encodeURIComponent(name) : '';
          img.src = '/api/users/' + encodeURIComponent(uid) + '/profile-picture' + nameParam;
        }
      })
      .catch(() => {
        // keep default img
      });
  }
})();
