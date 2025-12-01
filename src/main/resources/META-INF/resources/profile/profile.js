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
