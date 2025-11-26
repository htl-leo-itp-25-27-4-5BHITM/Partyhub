
// Tab-Switching für Beiträge/Favoriten
document.addEventListener('DOMContentLoaded', function() {
	const tabPosts = document.getElementById('tabPosts');
	const tabFavorites = document.getElementById('tabFavorites');
	const contentPosts = document.getElementById('tabContentPosts');
	const contentFavorites = document.getElementById('tabContentFavorites');

	tabPosts.addEventListener('click', function() {
		tabPosts.classList.add('active');
		tabFavorites.classList.remove('active');
		contentPosts.style.display = '';
		contentFavorites.style.display = 'none';
	});

	tabFavorites.addEventListener('click', function() {
		tabFavorites.classList.add('active');
		tabPosts.classList.remove('active');
		contentFavorites.style.display = '';
		contentPosts.style.display = 'none';
	});
});
