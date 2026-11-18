// Token Radar page: renders window.RADAR (written by main.ts from the same board
// the gate checks) with no network. Routes: "" is the board, "#<slug>" is a
// protocol's detail view, "#cat:<category>" is the board filtered to a category.
(function () {
  'use strict';
  var radar = window.RADAR;
  if (!radar) {
    document.getElementById('summary').textContent = 'No data: data.js was not loaded.';
    return;
  }
  var rows = radar.rows;
  var bySlug = {};
  rows.forEach(function (r) { bySlug[r.slug] = r; });

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function money(n) {
    if (n === null || n === undefined) return '—';
    if (n >= 1e9) return '$' + (n / 1e9).toFixed(1) + 'B';
    if (n >= 1e6) return '$' + (n / 1e6).toFixed(1) + 'M';
    if (n >= 1e3) return '$' + (n / 1e3).toFixed(1) + 'K';
    return '$' + Math.round(n);
  }
  function moneyFull(n) {
    return '$' + Math.round(n).toLocaleString('en-US');
  }
  function pct(n) {
    if (n === null || n === undefined) return '—';
    return (n > 0 ? '+' : '') + n.toFixed(1) + '%';
  }
  function pctClass(n) {
    if (n === null || n === undefined) return 'muted';
    return n >= 0 ? 'up' : 'down';
  }
  function ageText(r) {
    if (r.age_days === null || r.age_days === undefined) return 'unknown';
    return r.age_days + ' days';
  }
  function chainsText(chains) {
    if (!chains || chains.length === 0) return '—';
    if (chains.length <= 2) return chains.join(', ');
    return chains.slice(0, 2).join(', ') + ' +' + (chains.length - 2);
  }
  function chainsFull(chains) {
    if (!chains || chains.length === 0) return '—';
    if (chains.length <= 6) return chains.join(', ');
    return chains.slice(0, 6).join(', ') + ' +' + (chains.length - 6) + ' more';
  }

  // Header, footer and filter options.
  document.getElementById('summary').textContent =
    rows.length + ' pre-token protocols ranked · ' + radar.watchlist_size + ' on the watchlist · ' +
    radar.early_size + ' found beyond the watchlist · data as of ' + radar.as_of + ' · model ' + radar.model_version;
  document.getElementById('source').textContent = 'Source: ' + radar.source + '.';
  var categorySel = document.getElementById('category');
  var chainSel = document.getElementById('chain');
  var categories = [];
  var chains = [];
  rows.forEach(function (r) {
    if (r.category && categories.indexOf(r.category) === -1) categories.push(r.category);
    (r.chains || []).forEach(function (c) { if (chains.indexOf(c) === -1) chains.push(c); });
  });
  categories.sort();
  chains.sort();
  categories.forEach(function (c) {
    var o = document.createElement('option');
    o.value = c; o.textContent = c;
    categorySel.appendChild(o);
  });
  chains.forEach(function (c) {
    var o = document.createElement('option');
    o.value = c; o.textContent = c;
    chainSel.appendChild(o);
  });

  var qEl = document.getElementById('q');
  var sortEl = document.getElementById('sort');
  var watchEl = document.getElementById('watchlist-only');
  var boardView = document.getElementById('board-view');
  var detailView = document.getElementById('detail-view');
  var liveView = document.getElementById('live-view');
  var boardBtn = document.getElementById('view-board');
  var liveBtn = document.getElementById('view-live');
  var boardBody = document.querySelector('#board tbody');
  var liveBody = document.querySelector('#live tbody');
  var countEl = document.getElementById('count');

  function filtered() {
    var q = qEl.value.trim().toLowerCase();
    var cat = categorySel.value;
    var chain = chainSel.value;
    var onlyWatch = watchEl.checked;
    var list = rows.filter(function (r) {
      if (onlyWatch && !r.on_watchlist) return false;
      if (cat && r.category !== cat) return false;
      if (chain && (r.chains || []).indexOf(chain) === -1) return false;
      if (q && r.name.toLowerCase().indexOf(q) === -1 && r.slug.toLowerCase().indexOf(q) === -1) return false;
      return true;
    });
    var sort = sortEl.value;
    if (sort === 'tvl') list.sort(function (a, b) { return b.tvl_usd - a.tvl_usd || a.rank - b.rank; });
    else if (sort === 'growth') list.sort(function (a, b) { return (b.change_7d || 0) - (a.change_7d || 0) || a.rank - b.rank; });
    else if (sort === 'age') list.sort(function (a, b) { return (b.age_days || 0) - (a.age_days || 0) || a.rank - b.rank; });
    else list.sort(function (a, b) { return a.rank - b.rank; });
    return list;
  }

  function renderBoard() {
    var list = filtered();
    countEl.textContent = 'Showing ' + list.length + ' of ' + rows.length + ' rows · every watchlist protocol is on the board.';
    var html = '';
    list.forEach(function (r) {
      html += '<tr data-slug="' + esc(r.slug) + '"><td>' + r.rank + '</td>' +
        '<td><strong>' + esc(r.name) + '</strong>' + (r.on_watchlist ? '<span class="badge">Watchlist</span>' : '') + '<br><span class="muted">' + esc(r.slug) + '</span></td>' +
        '<td>' + esc(r.category || '—') + '</td>' +
        '<td>' + esc(chainsText(r.chains)) + '</td>' +
        '<td class="num">' + money(r.tvl_usd) + '</td>' +
        '<td class="num ' + pctClass(r.change_7d) + '">' + pct(r.change_7d) + '</td>' +
        '<td class="num"><strong>' + money(r.implied_value_usd) + '</strong></td>' +
        '<td>' + r.farm_steps.length + ' steps</td></tr>';
    });
    boardBody.innerHTML = html || '<tr><td colspan="8" class="muted">No protocols match these filters.</td></tr>';
  }

  function renderLive() {
    var html = '';
    radar.live.forEach(function (p) {
      html += '<tr><td><strong>' + esc(p.name) + '</strong><br><span class="muted">' + esc(p.slug) + '</span></td>' +
        '<td>' + esc(p.category || '—') + '</td>' +
        '<td>' + esc(chainsText(p.chains)) + '</td>' +
        '<td class="num">' + money(p.tvl_usd) + '</td>' +
        '<td class="num">' + money(p.mcap_usd) + '</td>' +
        '<td class="num ' + pctClass(p.change_7d) + '">' + pct(p.change_7d) + '</td></tr>';
    });
    liveBody.innerHTML = html;
  }

  function show(view) {
    boardView.hidden = view !== 'board';
    detailView.hidden = view !== 'detail';
    liveView.hidden = view !== 'live';
    boardBtn.setAttribute('aria-selected', view === 'board' || view === 'detail' ? 'true' : 'false');
    liveBtn.setAttribute('aria-selected', view === 'live' ? 'true' : 'false');
  }

  function renderDetail(slug) {
    var r = bySlug[slug];
    if (!r) { show('board'); return; }
    var steps = r.farm_steps.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('');
    var peerPhrase = r.peer_basis === 'category'
      ? 'median of ' + r.peer_count + ' trading peers in ' + esc(r.category)
      : 'global median of ' + r.peer_count + ' trading peers (fewer than 3 trade in ' + esc(r.category || 'this category') + ')';
    detailView.innerHTML =
      '<div class="detail"><button class="back" id="back">← Back to the board</button>' +
      '<h2>' + esc(r.name) + (r.on_watchlist ? '<span class="badge">Watchlist</span>' : '') + '</h2>' +
      '<p class="muted">Rank ' + r.rank + ' of ' + rows.length + ' · ' + esc(r.slug) + ' · records no token in the snapshot</p>' +
      '<div class="facts">' +
      '<div class="fact"><b>Implied value</b><span>' + moneyFull(r.implied_value_usd) + '</span></div>' +
      '<div class="fact"><b>TVL</b><span>' + moneyFull(r.tvl_usd) + '</span></div>' +
      '<div class="fact"><b>7-day change</b><span class="' + pctClass(r.change_7d) + '">' + pct(r.change_7d) + '</span></div>' +
      '<div class="fact"><b>Age on record</b><span>' + ageText(r) + '</span></div>' +
      '<div class="fact"><b>Category</b><span>' + esc(r.category || '—') + '</span></div>' +
      '<div class="fact"><b>Chains</b><span>' + esc(chainsFull(r.chains)) + '</span></div>' +
      '</div>' +
      '<h3>How the value is built</h3>' +
      '<p class="model-line">TVL ' + moneyFull(r.tvl_usd) + ' × peer multiple ' + r.peer_multiple + ' (' + peerPhrase + ') × growth ' + r.growth_multiplier + ' × age ' + r.age_multiplier + ' × chains ' + r.chain_multiplier + ' = <strong>' + moneyFull(r.implied_value_usd) + '</strong>.</p>' +
      '<h3>Farm plan</h3><ol class="steps">' + steps + '</ol></div>';
    document.getElementById('back').addEventListener('click', function () {
      history.replaceState(null, '', location.pathname);
      show('board');
      renderBoard();
    });
    show('detail');
  }

  function route() {
    var hash = location.hash.replace(/^#/, '');
    if (!hash) { show('board'); renderBoard(); return; }
    if (hash.indexOf('cat:') === 0) {
      var cat = decodeURIComponent(hash.slice(4));
      categorySel.value = cat;
      show('board');
      renderBoard();
      return;
    }
    renderDetail(decodeURIComponent(hash));
  }

  boardBody.addEventListener('click', function (e) {
    var tr = e.target.closest('tr[data-slug]');
    if (tr) location.hash = tr.getAttribute('data-slug');
  });
  [qEl, categorySel, chainSel, sortEl, watchEl].forEach(function (el) {
    el.addEventListener('input', function () { show('board'); renderBoard(); });
    el.addEventListener('change', function () { show('board'); renderBoard(); });
  });
  boardBtn.addEventListener('click', function () {
    history.replaceState(null, '', location.pathname);
    show('board');
    renderBoard();
  });
  liveBtn.addEventListener('click', function () { show('live'); renderLive(); });
  window.addEventListener('hashchange', route);

  renderLive();
  route();
})();
