/** Page-world script: applies the preferred quality and speed via the player API (unreachable from isolated world). */
(function () {
  const ORDER = ['highres', 'hd2160', 'hd1440', 'hd1080', 'hd720', 'large', 'medium', 'small', 'tiny'];
  let appliedFor = '';

  let speedFor = '';
  const preferredSpeed = () => document.documentElement?.getAttribute('data-ytc-speed') || 'default';

  function applySpeed(force) {
    const speed = preferredSpeed();
    if (speed === 'default') return;
    const player = document.getElementById('movie_player');
    if (!player || typeof player.setPlaybackRate !== 'function') return;
    const videoId = player.getVideoData?.()?.video_id || '';
    const key = `${videoId}:${speed}`;
    if (!force && key === speedFor) return;
    player.setPlaybackRate(Number(speed));
    speedFor = key;
  }

  const preferred = () => document.documentElement?.getAttribute('data-ytc-quality') || 'auto';

  function pick(wanted, available) {
    if (wanted === 'highres') return available.find((q) => q !== 'auto') || null;
    if (available.includes(wanted)) return wanted;
    const start = ORDER.indexOf(wanted);
    return ORDER.slice(start + 1).find((q) => available.includes(q)) || null;
  }

  function apply(force) {
    const wanted = preferred();
    if (wanted === 'auto') return;
    const player = document.getElementById('movie_player');
    if (!player || typeof player.getAvailableQualityLevels !== 'function') return;
    const videoId = player.getVideoData?.()?.video_id || '';
    const key = `${videoId}:${wanted}`;
    if (!force && key === appliedFor) return;
    const available = player.getAvailableQualityLevels() || [];
    if (!available.length) return;
    const quality = pick(wanted, available);
    if (!quality) return;
    player.setPlaybackQualityRange?.(quality, quality);
    player.setPlaybackQuality?.(quality);
    appliedFor = key;
  }

  const onPlay = (e) => { if (e.target?.localName === 'video') setTimeout(() => { apply(false); applySpeed(false); }, 0); };

  document.addEventListener('playing', onPlay, true);
  document.addEventListener('loadedmetadata', onPlay, true);
  document.addEventListener('yt-navigate-finish', () => { appliedFor = ''; speedFor = ''; setTimeout(() => { apply(false); applySpeed(false); }, 500); });

  new MutationObserver(() => { apply(true); applySpeed(true); }).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-ytc-quality', 'data-ytc-speed'],
  });
})();
