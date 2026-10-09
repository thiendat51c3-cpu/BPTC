/* Biện pháp thi công thủy lợi, thủy điện - web app tĩnh, không cần build. */
(function () {
  'use strict';

  var state = { index: null, standards: [], stdMap: {}, methods: {} };
  var appEl = document.getElementById('app');
  var topTitle = document.getElementById('topTitle');
  var backBtn = document.getElementById('backBtn');
  var printBtn = document.getElementById('printBtn');
  var DEFAULT_TITLE = 'Biện pháp thi công';

  /* ---------- tiện ích ---------- */
  function el(tag, attrs, children) {
    var n = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      if (k === 'class') n.className = attrs[k];
      else if (k === 'text') n.textContent = attrs[k];
      else if (k.indexOf('on') === 0) n.addEventListener(k.slice(2), attrs[k]);
      else n.setAttribute(k, attrs[k]);
    });
    (children || []).forEach(function (c) {
      if (c == null) return;
      n.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    });
    return n;
  }
  function noDiacritics(s) {
    return String(s).toLowerCase().replace(/đ/g, 'd').normalize('NFD').replace(/[̀-ͯ]/g, '');
  }
  function getJSON(url) {
    return fetch(url, { cache: 'no-cache' }).then(function (r) {
      if (!r.ok) throw new Error(url + ' - ' + r.status);
      return r.json();
    });
  }
  function safeStore(key, val) {
    try { if (val === undefined) return JSON.parse(localStorage.getItem(key) || 'null'); localStorage.setItem(key, JSON.stringify(val)); } catch (e) { return null; }
  }
  function list(items) {
    return el('ul', null, (items || []).map(function (t) { return el('li', null, cite(t)); }));
  }
  /* tách thẻ trích dẫn dạng [số hiệu · mục] thành nhãn nhỏ */
  function cite(t) {
    var out = [], re = /\[(\d[^\]]*?|14TCN82[^\]]*?)\]/g, last = 0, m;
    while ((m = re.exec(t))) {
      if (m.index > last) out.push(document.createTextNode(t.slice(last, m.index)));
      out.push(el('span', { class: 'cite', text: m[1] }));
      last = re.lastIndex;
    }
    if (!out.length) return [document.createTextNode(t)];
    if (last < t.length) out.push(document.createTextNode(t.slice(last)));
    return out;
  }
  /* ghi chú riêng của người dùng cho từng bước, lưu trong trình duyệt */
  function noteBox(gid, i) {
    var key = 'bptc-note-' + gid, all = safeStore(key) || {};
    var ta = el('textarea', { class: 'notebox', rows: '2', placeholder: 'Ghi chú riêng của bạn cho bước này (lưu trên máy)...' });
    ta.value = all[i] || '';
    ta.addEventListener('input', function () { all[i] = ta.value; safeStore(key, all); });
    return el('div', { class: 'noterow' }, [el('h4', { text: 'Ghi chú của bạn' }), ta]);
  }
  var READ = { full: 'Đã đọc nội dung chính', partial: 'Chỉ đọc được một phần', none: 'Chưa đọc được nội dung chi tiết' };
  function section(title, items) {
    if (!items || !items.length) return null;
    return el('div', { class: 'card' }, [el('h3', { text: title }), list(items)]);
  }

  /* ---------- tải dữ liệu ---------- */
  function load() {
    return Promise.all([getJSON('data/index.json'), getJSON('data/standards.json')]).then(function (r) {
      state.index = r[0];
      state.standards = r[1];
      r[1].forEach(function (s) { state.stdMap[s.id] = s; });
      return Promise.all(r[0].groups.map(function (g) {
        return getJSON('data/methods/' + g.id + '.json').then(function (m) { state.methods[g.id] = m; })
          .catch(function () { state.methods[g.id] = null; });
      }));
    });
  }

  /* ---------- giao diện chung ---------- */
  function setChrome(title, opts) {
    opts = opts || {};
    topTitle.textContent = title || DEFAULT_TITLE;
    document.title = (title ? title + ' - ' : '') + 'Biện pháp thi công thủy lợi, thủy điện';
    backBtn.hidden = !opts.back;
    printBtn.hidden = !opts.print;
    document.querySelectorAll('.tabbar a').forEach(function (a) {
      a.classList.toggle('active', a.getAttribute('data-tab') === opts.tab);
    });
    window.scrollTo(0, 0);
  }
  backBtn.addEventListener('click', function () {
    if (history.length > 1) history.back(); else location.hash = '#/';
  });
  printBtn.addEventListener('click', function () {
    document.querySelectorAll('details.step').forEach(function (d) { d.open = true; });
    window.print();
  });

  /* ---------- trang chủ ---------- */
  function viewHome() {
    setChrome(DEFAULT_TITLE, { tab: 'home' });
    var cards = state.index.groups.map(function (g) {
      return el('a', { class: 'gcard', href: '#/g/' + g.id }, [
        el('span', { class: 'ic', text: g.icon }),
        el('span', { class: 't', text: g.title }),
        el('span', { class: 's', text: g.summary })
      ]);
    });
    var box = el('input', { class: 'search-box', type: 'search', placeholder: 'Tìm bước thi công, tiêu chuẩn...', 'aria-label': 'Tìm kiếm' });
    box.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && box.value.trim()) location.hash = '#/search/' + encodeURIComponent(box.value.trim());
    });
    appEl.replaceChildren(
      el('div', { class: 'hero' }, [
        el('h2', { text: 'Thủy lợi, thủy điện' }),
        el('p', { text: 'Trình tự các bước thi công, yêu cầu kỹ thuật và tiêu chuẩn viện dẫn.' })
      ]),
      box,
      el('div', { class: 'grid' }, cards),
      el('div', { class: 'note', text: state.index.disclaimer })
    );
  }

  /* ---------- trang một hạng mục ---------- */
  function viewGroup(id) {
    var g = state.index.groups.filter(function (x) { return x.id === id; })[0];
    var m = state.methods[id];
    if (!g || !m) { return viewNotFound(); }
    setChrome(m.title, { back: true, print: true, tab: 'home' });

    var doneKey = 'bptc-done-' + id;
    var done = safeStore(doneKey) || {};

    var stdChips = (m.standards || []).map(function (sid) {
      var s = state.stdMap[sid];
      return s ? el('a', { class: 'chip' + (s.read === 'none' ? ' chip-none' : ''), href: '#/standards/' + sid, text: s.code + (s.read === 'none' ? ' (chưa đọc)' : '') }) : null;
    });

    var stepsEl = el('div', { class: 'steps' }, m.steps.map(function (st, i) {
      var d = el('details', { class: 'step' + (done[i] ? ' done' : '') });
      var btn = el('button', { class: 'donebtn', type: 'button', text: done[i] ? 'Bỏ đánh dấu hoàn thành' : 'Đánh dấu đã làm xong bước này' });
      btn.addEventListener('click', function () {
        done[i] = !done[i];
        safeStore(doneKey, done);
        d.classList.toggle('done', !!done[i]);
        btn.textContent = done[i] ? 'Bỏ đánh dấu hoàn thành' : 'Đánh dấu đã làm xong bước này';
      });
      var body = el('div', { class: 'body' }, [
        st.actions && st.actions.length ? el('h4', { text: 'Trình tự thực hiện' }) : null, st.actions && st.actions.length ? list(st.actions) : null,
        st.requirements && st.requirements.length ? el('h4', { text: 'Yêu cầu kỹ thuật' }) : null, st.requirements && st.requirements.length ? list(st.requirements) : null,
        st.checks && st.checks.length ? el('h4', { text: 'Kiểm tra, nghiệm thu' }) : null, st.checks && st.checks.length ? list(st.checks) : null,
        noteBox(id, i),
        btn
      ]);
      d.appendChild(el('summary', null, [
        el('span', { class: 'num', text: String(i + 1) }),
        el('span', { class: 'st', text: st.title }),
        el('span', { class: 'chev', text: '›' })
      ]));
      d.appendChild(body);
      return d;
    }));

    var resetBtn = el('button', { class: 'donebtn', type: 'button', text: 'Xóa đánh dấu các bước' });
    resetBtn.addEventListener('click', function () { safeStore(doneKey, {}); viewGroup(id); });

    appEl.replaceChildren(
      el('div', { class: 'hero' }, [el('h2', { text: g.icon + ' ' + m.title }), el('p', { text: m.scope })]),
      el('div', { class: 'card' }, [el('h3', { text: 'Tiêu chuẩn viện dẫn' }), el('div', { class: 'chips' }, stdChips)]),
      section('Điều kiện trước khi thi công', m.prerequisites),
      el('h3', { class: 'sec-title', text: 'Trình tự thi công' }),
      stepsEl,
      resetBtn,
      section('An toàn lao động', m.safety),
      section('Nghiệm thu', m.acceptance),
      section('Hồ sơ cần lập', m.records),
      m.note ? el('div', { class: 'note', text: m.note }) : null,
      el('div', { class: 'note', text: state.index.disclaimer })
    );
  }

  /* ---------- danh mục tiêu chuẩn ---------- */
  function viewStandards(focusId) {
    setChrome('Danh mục tiêu chuẩn', { back: !!focusId, tab: 'standards' });
    var usedBy = {};
    state.index.groups.forEach(function (g) {
      var m = state.methods[g.id];
      if (m) (m.standards || []).forEach(function (sid) { (usedBy[sid] = usedBy[sid] || []).push(g); });
    });
    var box = el('input', { class: 'search-box', type: 'search', placeholder: 'Lọc theo số hiệu hoặc tên...', 'aria-label': 'Lọc tiêu chuẩn' });
    var ul = el('ul', { class: 'stdlist' });
    function render() {
      var q = noDiacritics(box.value.trim());
      var rows = state.standards.filter(function (s) {
        return !q || noDiacritics(s.code + ' ' + s.title + ' ' + (s.note || '')).indexOf(q) >= 0;
      }).map(function (s) {
        var users = (usedBy[s.id] || []).map(function (g) {
          return el('a', { class: 'chip', href: '#/g/' + g.id, text: g.title });
        });
        var li = el('li', { class: 'std', id: 'std-' + s.id }, [
          el('span', { class: 'c', text: s.code }),
          el('div', { text: s.title }),
          s.note ? el('span', { class: 'n', text: s.note }) : null,
          s.read ? el('span', { class: 'read read-' + s.read, text: READ[s.read] + (s.readNote ? ': ' + s.readNote : '') }) : null,
          users.length ? el('div', { class: 'chips', style: 'margin-top:8px' }, users) : null
        ]);
        if (focusId === s.id) li.style.outline = '2px solid var(--brand-2)';
        return li;
      });
      ul.replaceChildren.apply(ul, rows.length ? rows : [el('li', { class: 'empty', text: 'Không có tiêu chuẩn phù hợp.' })]);
    }
    box.addEventListener('input', render);
    appEl.replaceChildren(
      el('div', { class: 'hero' }, [el('h2', { text: 'Tiêu chuẩn, quy chuẩn' }), el('p', { text: 'Số hiệu và tên để bạn đối chiếu với bản gốc. Kiểm tra hiệu lực trước khi áp dụng.' })]),
      box, ul
    );
    render();
    if (focusId) {
      var t = document.getElementById('std-' + focusId);
      if (t) t.scrollIntoView({ block: 'center' });
    }
  }

  /* ---------- tìm kiếm ---------- */
  function buildCorpus() {
    var rows = [];
    state.index.groups.forEach(function (g) {
      var m = state.methods[g.id];
      if (!m) return;
      m.steps.forEach(function (st, i) {
        var text = [st.title].concat(st.actions || [], st.requirements || [], st.checks || []).join(' ');
        rows.push({ href: '#/g/' + g.id, title: (i + 1) + '. ' + st.title, sub: g.title, text: text });
      });
      ['safety', 'acceptance', 'records', 'prerequisites'].forEach(function (k) {
        (m[k] || []).forEach(function (t) { rows.push({ href: '#/g/' + g.id, title: t, sub: g.title, text: t }); });
      });
    });
    state.standards.forEach(function (s) {
      rows.push({ href: '#/standards/' + s.id, title: s.code + ' - ' + s.title, sub: 'Tiêu chuẩn', text: s.code + ' ' + s.title + ' ' + (s.note || '') });
    });
    rows.forEach(function (r) { r.n = noDiacritics(r.text + ' ' + r.title); });
    return rows;
  }
  function viewSearch(q) {
    setChrome('Tìm kiếm', { tab: 'search' });
    q = q ? decodeURIComponent(q) : '';
    var box = el('input', { class: 'search-box', type: 'search', placeholder: 'Ví dụ: neo, bê tông phun, mực nước ngầm', 'aria-label': 'Tìm kiếm', value: q });
    var out = el('div');
    var corpus = buildCorpus();
    function run() {
      var terms = noDiacritics(box.value.trim()).split(/\s+/).filter(Boolean);
      if (!terms.length) { out.replaceChildren(el('p', { class: 'empty', text: 'Nhập từ khóa để tìm trong các bước thi công và tiêu chuẩn.' })); return; }
      var hits = corpus.filter(function (r) { return terms.every(function (t) { return r.n.indexOf(t) >= 0; }); }).slice(0, 60);
      if (!hits.length) { out.replaceChildren(el('p', { class: 'empty', text: 'Không tìm thấy kết quả.' })); return; }
      out.replaceChildren.apply(out, hits.map(function (r) {
        return el('a', { class: 'hit', href: r.href }, [el('b', { text: r.title }), el('span', { text: r.sub })]);
      }));
    }
    box.addEventListener('input', run);
    appEl.replaceChildren(box, out);
    run();
  }

  /* ---------- giới thiệu ---------- */
  function viewAbout() {
    setChrome('Giới thiệu', { tab: 'about' });
    appEl.replaceChildren(
      el('div', { class: 'hero' }, [el('h2', { text: state.index.title }), el('p', { text: 'Phiên bản ' + state.index.version + ', cập nhật ' + state.index.updated })]),
      el('div', { class: 'note', text: state.index.disclaimer }),
      section('Cách dùng', [
        'Chọn hạng mục ở trang chính, mở từng bước để xem trình tự, yêu cầu và kiểm tra.',
        'Bấm "Đánh dấu đã làm xong" để theo dõi tiến độ, dữ liệu lưu trong trình duyệt của máy bạn.',
        'Bấm biểu tượng in ở góc trên để in hoặc lưu thành PDF.',
        'Trên iPhone: mở bằng Safari, bấm nút Chia sẻ, chọn "Thêm vào Màn hình chính".'
      ]),
      section('Thêm nội dung mới', [
        'Thêm file JSON mới vào thư mục data/methods theo mẫu các file có sẵn.',
        'Khai báo hạng mục mới trong data/index.json, tiêu chuẩn mới trong data/standards.json.',
        'Commit và push lên GitHub, trang tự cập nhật sau ít phút.'
      ])
    );
  }
  function viewNotFound() {
    setChrome('Không tìm thấy', { back: true });
    appEl.replaceChildren(el('p', { class: 'empty', text: 'Không tìm thấy nội dung này.' }), el('a', { class: 'btn', href: '#/', text: 'Về trang chính' }));
  }

  /* ---------- định tuyến ---------- */
  function route() {
    if (!state.index) return;
    var parts = (location.hash || '#/').replace(/^#\/?/, '').split('/');
    var head = parts[0] || '';
    if (head === '') return viewHome();
    if (head === 'g') return viewGroup(parts[1]);
    if (head === 'standards') return viewStandards(parts[1]);
    if (head === 'search') return viewSearch(parts[1]);
    if (head === 'about') return viewAbout();
    return viewNotFound();
  }
  window.addEventListener('hashchange', route);

  load().then(route).catch(function (e) {
    appEl.replaceChildren(el('p', { class: 'empty', text: 'Không tải được dữ liệu. Nếu mở file trực tiếp từ máy, hãy đưa lên GitHub Pages hoặc chạy qua máy chủ web. (' + e.message + ')' }));
  });

  if ('serviceWorker' in navigator && location.protocol.indexOf('http') === 0) {
    navigator.serviceWorker.register('sw.js').catch(function () {});
  }
})();
