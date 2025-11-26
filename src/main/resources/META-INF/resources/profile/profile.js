
// Tab-Switching für Beiträge/Favoriten
document.addEventListener('DOMContentLoaded', function() {
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

	tabPartys.addEventListener('click', function() {
		setActiveTab(tabPartys, contentPartys);
	});
	tabPosts.addEventListener('click', function() {
		setActiveTab(tabPosts, contentPosts);
	});
	tabFavorites.addEventListener('click', function() {
		setActiveTab(tabFavorites, contentFavorites);
	});
});
