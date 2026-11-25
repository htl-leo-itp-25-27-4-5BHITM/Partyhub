(() => {
  const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const validId = person => /^\d+$/.test(String(person?.id ?? '')) && Number(person.id) > 0;
  const personName = person => person?.name || person?.displayName || person?.handle || person?.distinctName || 'PartyHub member';
  const avatar = person => `<img class="social-avatar" src="${validId(person) ? `/api/users/${encodeURIComponent(person.id)}/profile-picture` : '/images/default_profile-picture.svg'}" alt="" loading="lazy" data-social-avatar>`;
  const link = person => validId(person) ? `/profile/profile.html?id=${encodeURIComponent(person.id)}` : null;
  const identity = person => link(person) ? `<a class="social-person" href="${link(person)}">${avatar(person)}<span>${escape(personName(person))}</span></a>` : `<span class="social-person">${avatar(person)}<span>${escape(personName(person))}</span></span>`;
  function summary(party) {
    const social = party?.discoverySocial;
    const host = social?.host ?? party?.host_user ?? null;
    const friends = Array.isArray(social?.friends) ? social.friends.filter(validId) : [];
    const count = Math.max(friends.length, Number(social?.friendCount) || 0);
    return {host, friends, count};
  }
  // Natural English instead of "1 friend is going": name the friends, e.g. "Anna is attending",
  // "Anna and Ben are attending", "Anna, Ben and 2 others are attending".
  function attendingCaption(friends, count) {
    const names = friends.slice(0, 2).map(person => escape(personName(person)));
    if (!names.length) return count === 1 ? 'A friend is attending' : `${count} friends are attending`;
    if (count === 1) return `${names[0]} is attending`;
    if (count === 2 && names.length === 2) return `${names[0]} and ${names[1]} are attending`;
    const others = count - names.length;
    const rest = `${others} ${others === 1 ? 'other' : 'others'}`;
    return names.length === 1
      ? `${names[0]} and ${rest} are attending`
      : `${names[0]}, ${names[1]} and ${rest} are attending`;
  }
  function html(party) {
    const {host,friends,count} = summary(party);
    if (!host && !count) return '';
    return `<div class="party-social">
      ${host ? `<div class="social-host"><span class="social-caption">Hosted by</span>${identity(host)}</div>` : ''}
      ${count ? `<div class="social-friends"><span class="social-caption">${attendingCaption(friends, count)}</span><div class="social-friend-list">${friends.map(identity).join('')}${count > friends.length ? `<span class="social-more">+${count-friends.length} more</span>` : ''}</div></div>` : ''}
    </div>`;
  }
  function pinHtml(party) {
    const {friends,count} = summary(party);
    if (!count) return '';
    const shown = friends.slice(0,2);
    return `<span class="pin-friends" aria-hidden="true">${shown.map(avatar).join('')}<span>${count}</span></span>`;
  }
  // Image failures must not erase identity or leave broken image icons.
  document.addEventListener('error', event => {
    const image = event.target;
    if (image?.matches?.('img[data-social-avatar]') && !image.dataset.socialFallback) {
      image.dataset.socialFallback = 'true';
      image.src = '/images/default_profile-picture.svg';
    }
  }, true);
  window.partySocial = {html,pinHtml,summary,attendingCaption};
})();
