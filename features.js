;(function(){function j(){var n=document.querySelector('#dc-root nav')||document.querySelector('nav');if(!n||document.getElementById('fws-calc-link'))return;var a=document.createElement('a');a.id='fws-calc-link';a.href='calculadora.html';a.textContent='\uD83E\uDDEE Calculadora';a.title='Calculadora de viabilidade de leilao';a.style.cssText='display:inline-flex;align-items:center;gap:6px;margin-left:8px;padding:6px 12px;border-radius:20px;background:#7B3B1E;color:#fff;font:600 13px Segoe UI,sans-serif;text-decoration:none';n.appendChild(a);}j();var rt=document.getElementById('dc-root')||document.body;try{new MutationObserver(j).observe(rt,{childList:true,subtree:true});}catch(e){}})();
/* FWS Leilões de Imóveis — recursos extras
   1) Biblioteca de material extra (PDF) — download (oficial) + upload pessoal (IndexedDB)
   2) Mapa mental interativo e modificável — autosave local + exportar/importar arquivo oficial
   Injetado como script externo; roda no documento principal (mesma origem). */
(function () {
  "use strict";
  if (window.__fwsFeatures) return; window.__fwsFeatures = true;

  var ACCENT = "#7B3B1E", LINE = "#E0D9CD", PANEL = "#F4F0E8", INK = "#2E2A24",
      MUT = "#8C8377", SERIF = "Georgia, 'Times New Roman', serif",
      MONO = "'IBM Plex Mono', ui-monospace, monospace";
  var NODE_COLORS = ["#7B3B1E", "#3F5B4C", "#2E4A6B", "#6B4A2E", "#5A4066", "#41403B"];

  function el(tag, style, txt) { var e = document.createElement(tag); if (style) e.setAttribute("style", style); if (txt != null) e.textContent = txt; return e; }
  function sectionShell(id, kicker, title, subtitle) {
    var s = el("section", "margin:64px 0 8px");
    s.id = id;
    var k = el("div", "font-family:" + MONO + ";font-size:10.5px;letter-spacing:.14em;color:" + MUT + ";text-transform:uppercase;margin-bottom:10px", kicker);
    var h = el("h2", "font-family:" + SERIF + ";font-weight:600;font-size:26px;line-height:1.2;color:" + INK + ";margin:0 0 8px", title);
    s.appendChild(k); s.appendChild(h);
    if (subtitle) { s.appendChild(el("p", "margin:0 0 20px;color:" + MUT + ";font-size:14px;line-height:1.6;max-width:640px", subtitle)); }
    return s;
  }
  function btn(label, primary) {
    var b = el("button", "font-family:" + MONO + ";font-size:11px;letter-spacing:.06em;text-transform:uppercase;cursor:pointer;" +
      "padding:9px 14px;border-radius:7px;border:1px solid " + (primary ? ACCENT : LINE) + ";" +
      "background:" + (primary ? ACCENT : "#fff") + ";color:" + (primary ? "#fff" : INK) + ";transition:.15s", label);
    b.onmouseenter = function () { if (!primary) b.style.background = "#FAF7F1"; };
    b.onmouseleave = function () { if (!primary) b.style.background = "#fff"; };
    return b;
  }
  function fmtBytes(n) { if (n == null) return ""; if (n < 1024) return n + " B"; if (n < 1048576) return (n / 1024).toFixed(0) + " KB"; return (n / 1048576).toFixed(1) + " MB"; }

  /* ============================ IndexedDB (PDFs pessoais) ============================ */
  var DB = null;
  function idb() {
    return new Promise(function (res, rej) {
      if (DB) return res(DB);
      var r = indexedDB.open("fws_pdfs", 1);
      r.onupgradeneeded = function () { r.result.createObjectStore("pdfs", { keyPath: "id" }); };
      r.onsuccess = function () { DB = r.result; res(DB); };
      r.onerror = function () { rej(r.error); };
    });
  }
  function idbAll() { return idb().then(function (db) { return new Promise(function (res) { var out = []; var c = db.transaction("pdfs").objectStore("pdfs").openCursor(); c.onsuccess = function (e) { var cur = e.target.result; if (cur) { out.push(cur.value); cur.continue(); } else res(out); }; c.onerror = function () { res(out); }; }); }); }
  function idbPut(v) { return idb().then(function (db) { return new Promise(function (res, rej) { var t = db.transaction("pdfs", "readwrite"); t.objectStore("pdfs").put(v); t.oncomplete = res; t.onerror = function () { rej(t.error); }; }); }); }
  function idbDel(id) { return idb().then(function (db) { return new Promise(function (res) { var t = db.transaction("pdfs", "readwrite"); t.objectStore("pdfs").delete(id); t.oncomplete = res; }); }); }

  /* ============================ Seção: Material extra (PDF) ============================ */
  function buildPdfSection() {
    var sec = sectionShell("fws-material", "Arquivo", "Material extra",
      "Documentos de apoio em PDF. A biblioteca oficial fica disponível para download por qualquer visitante. Você também pode guardar PDFs pessoais — eles ficam salvos apenas neste navegador.");

    // Biblioteca oficial
    var offWrap = el("div", "border:1px solid " + LINE + ";border-radius:10px;background:" + PANEL + ";padding:6px 6px 6px");
    var offList = el("div"); offWrap.appendChild(offList);
    sec.appendChild(offWrap);

    function rowStyle() { return "display:flex;align-items:center;gap:14px;padding:14px 16px;border-bottom:1px solid " + LINE; }
    function pdfIcon() { return el("div", "flex:0 0 auto;width:34px;height:34px;border-radius:6px;background:#fff;border:1px solid " + LINE + ";display:flex;align-items:center;justify-content:center;font:600 10px " + MONO + ";color:" + ACCENT, "PDF"); }

    fetch("materiais.json", { cache: "no-store" }).then(function (r) { return r.ok ? r.json() : []; }).catch(function () { return []; })
      .then(function (items) {
        if (!items || !items.length) {
          offList.appendChild(el("div", "padding:22px 16px;color:" + MUT + ";font-size:13.5px;font-style:italic", "Nenhum material publicado ainda."));
          return;
        }
        items.forEach(function (it, i) {
          var row = el("div", rowStyle() + (i === items.length - 1 ? ";border-bottom:none" : ""));
          row.appendChild(pdfIcon());
          var meta = el("div", "flex:1;min-width:0");
          meta.appendChild(el("div", "font-family:" + SERIF + ";font-size:15px;color:" + INK, it.label || it.file));
          if (it.desc) meta.appendChild(el("div", "font-size:12px;color:" + MUT + ";margin-top:2px", it.desc));
          row.appendChild(meta);
          var a = document.createElement("a");
          a.href = "materiais/" + encodeURIComponent(it.file); a.setAttribute("download", "");
          a.setAttribute("style", "text-decoration:none;font-family:" + MONO + ";font-size:11px;letter-spacing:.06em;text-transform:uppercase;padding:8px 13px;border-radius:7px;border:1px solid " + ACCENT + ";color:" + ACCENT);
          a.textContent = "Baixar";
          row.appendChild(a);
          offList.appendChild(row);
        });
      });

    // Área pessoal (upload no navegador)
    var pWrap = el("div", "margin-top:18px");
    var pHead = el("div", "display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:10px");
    pHead.appendChild(el("div", "font-family:" + MONO + ";font-size:10.5px;letter-spacing:.14em;text-transform:uppercase;color:" + MUT, "Meus PDFs (só neste navegador)"));
    var up = btn("+ Adicionar PDF", true);
    var fileInput = document.createElement("input"); fileInput.type = "file"; fileInput.accept = "application/pdf"; fileInput.multiple = true; fileInput.style.display = "none";
    up.onclick = function () { fileInput.click(); };
    pHead.appendChild(up); pWrap.appendChild(pHead); pWrap.appendChild(fileInput);
    var pList = el("div", "border:1px dashed " + LINE + ";border-radius:10px;padding:6px");
    pWrap.appendChild(pList); sec.appendChild(pWrap);

    function renderPersonal() {
      idbAll().then(function (items) {
        pList.innerHTML = "";
        if (!items.length) { pList.appendChild(el("div", "padding:18px 14px;color:" + MUT + ";font-size:13px;font-style:italic", "Nenhum PDF pessoal. Use “+ Adicionar PDF” para guardar arquivos aqui.")); return; }
        items.sort(function (a, b) { return b.date - a.date; });
        items.forEach(function (it, i) {
          var row = el("div", "display:flex;align-items:center;gap:14px;padding:12px 14px;border-bottom:1px solid " + LINE + (i === items.length - 1 ? ";border-bottom:none" : ""));
          row.appendChild(el("div", "flex:0 0 auto;width:32px;height:32px;border-radius:6px;background:#fff;border:1px solid " + LINE + ";display:flex;align-items:center;justify-content:center;font:600 9px " + MONO + ";color:" + ACCENT, "PDF"));
          var meta = el("div", "flex:1;min-width:0");
          meta.appendChild(el("div", "font-family:" + SERIF + ";font-size:14px;color:" + INK + ";white-space:nowrap;overflow:hidden;text-overflow:ellipsis", it.name));
          meta.appendChild(el("div", "font-size:11.5px;color:" + MUT + ";margin-top:2px", fmtBytes(it.size) + " · " + new Date(it.date).toLocaleDateString("pt-BR")));
          row.appendChild(meta);
          var dl = btn("Baixar"); dl.onclick = function () { var u = URL.createObjectURL(it.blob); var a = document.createElement("a"); a.href = u; a.download = it.name; a.click(); setTimeout(function () { URL.revokeObjectURL(u); }, 4000); };
          var rm = btn("Remover"); rm.style.borderColor = "#C0563E"; rm.style.color = "#C0563E"; rm.onclick = function () { if (confirm("Remover “" + it.name + "” deste navegador?")) idbDel(it.id).then(renderPersonal); };
          row.appendChild(dl); row.appendChild(rm);
          pList.appendChild(row);
        });
      });
    }
    fileInput.onchange = function () {
      var files = Array.prototype.slice.call(fileInput.files || []);
      var chain = Promise.resolve();
      files.forEach(function (f) { chain = chain.then(function () { return idbPut({ id: "p" + Date.now() + "_" + Math.random().toString(36).slice(2, 7), name: f.name, size: f.size, date: Date.now(), blob: f }); }); });
      chain.then(function () { fileInput.value = ""; renderPersonal(); });
    };
    renderPersonal();

    return sec;
  }

  /* ============================ Seção: Mapa mental ============================ */
  var LS_KEY = "fws_mapa_v1";
  function defaultMap() {
    return {
      v: 1, nodes: [
        { id: "n1", text: "Leilão de Imóveis", x: 620, y: 250, color: NODE_COLORS[0] },
        { id: "n2", text: "Modalidades", x: 330, y: 120, color: NODE_COLORS[1] },
        { id: "n3", text: "Documentação", x: 330, y: 380, color: NODE_COLORS[2] },
        { id: "n4", text: "Riscos", x: 940, y: 130, color: NODE_COLORS[3] },
        { id: "n5", text: "Financiamento", x: 940, y: 380, color: NODE_COLORS[4] }
      ],
      edges: [{ a: "n1", b: "n2" }, { a: "n1", b: "n3" }, { a: "n1", b: "n4" }, { a: "n1", b: "n5" }]
    };
  }

  function buildMindMap() {
    var sec = sectionShell("fws-mapa", "Estudo", "Mapa mental",
      "Organize os conceitos livremente: arraste os nós, edite o texto (duplo clique), conecte ideias e escolha cores. Tudo é salvo automaticamente neste navegador. Para manter os seus 3 computadores iguais, use “Baixar mapa” e envie o arquivo para publicar a versão oficial.");

    // Toolbar
    var bar = el("div", "display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:12px");
    var bAdd = btn("+ Nó", true), bConnect = btn("Conectar"), bDelete = btn("Excluir"),
        bDownload = btn("Baixar mapa"), bImport = btn("Importar"), bReset = btn("Restaurar oficial");
    var importInput = document.createElement("input"); importInput.type = "file"; importInput.accept = "application/json,.json"; importInput.style.display = "none";
    [bAdd, bConnect, bDelete].forEach(function (b) { bar.appendChild(b); });
    bar.appendChild(el("div", "flex:1"));
    [bDownload, bImport, bReset].forEach(function (b) { bar.appendChild(b); });
    bar.appendChild(importInput);
    sec.appendChild(bar);

    // Color palette
    var pal = el("div", "display:flex;gap:7px;align-items:center;margin-bottom:12px");
    pal.appendChild(el("span", "font-family:" + MONO + ";font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:" + MUT + ";margin-right:4px", "Cor do nó:"));
    NODE_COLORS.forEach(function (c) {
      var sw = el("button", "width:20px;height:20px;border-radius:50%;border:2px solid #fff;box-shadow:0 0 0 1px " + LINE + ";background:" + c + ";cursor:pointer;padding:0");
      sw.onclick = function () { if (sel) { var n = findNode(sel); if (n) { n.color = c; save(); render(); } } };
      pal.appendChild(sw);
    });
    sec.appendChild(pal);

    // Canvas
    var viewport = el("div", "position:relative;border:1px solid " + LINE + ";border-radius:10px;background:" + PANEL +
      ";height:540px;overflow:auto;touch-action:none;user-select:none");
    var canvas = el("div", "position:relative;width:1400px;height:1000px;" +
      "background-image:radial-gradient(" + LINE + " 1px, transparent 1px);background-size:26px 26px");
    var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("style", "position:absolute;inset:0;width:100%;height:100%;pointer-events:none");
    svg.setAttribute("width", "1400"); svg.setAttribute("height", "1000");
    canvas.appendChild(svg);
    viewport.appendChild(canvas); sec.appendChild(viewport);

    var status = el("div", "font-family:" + MONO + ";font-size:11px;color:" + MUT + ";margin-top:10px;min-height:16px", "");
    sec.appendChild(status);

    // ---- state ----
    var state = defaultMap(), sel = null, connectMode = false, connectFrom = null, saveTimer = null;
    function findNode(id) { for (var i = 0; i < state.nodes.length; i++) if (state.nodes[i].id === id) return state.nodes[i]; return null; }
    function uid() { return "n" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5); }
    function save() { if (saveTimer) clearTimeout(saveTimer); saveTimer = setTimeout(function () { try { localStorage.setItem(LS_KEY, JSON.stringify(state)); } catch (e) {} }, 150); }
    function setStatus(t) { status.textContent = t || ""; }

    // ---- render ----
    function render() {
      // edges
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      state.edges.forEach(function (e) {
        var a = findNode(e.a), b = findNode(e.b); if (!a || !b) return;
        var ln = document.createElementNS("http://www.w3.org/2000/svg", "line");
        ln.setAttribute("x1", a.x); ln.setAttribute("y1", a.y); ln.setAttribute("x2", b.x); ln.setAttribute("y2", b.y);
        ln.setAttribute("stroke", "#C9BEA9"); ln.setAttribute("stroke-width", "2");
        svg.appendChild(ln);
      });
      // nodes
      Array.prototype.slice.call(canvas.querySelectorAll(".fws-node")).forEach(function (n) { n.remove(); });
      state.nodes.forEach(function (n) {
        var isSel = n.id === sel;
        var d = el("div", "position:absolute;transform:translate(-50%,-50%);max-width:190px;padding:10px 14px;border-radius:10px;" +
          "background:" + (n.color || ACCENT) + ";color:#fff;font-family:" + SERIF + ";font-size:14px;line-height:1.3;text-align:center;" +
          "box-shadow:0 2px 8px rgba(0,0,0," + (isSel ? ".28" : ".14") + ");cursor:grab;word-break:break-word;" +
          "outline:" + (isSel ? "2px solid " + INK + ";outline-offset:2px" : "none"));
        d.className = "fws-node"; d.style.left = n.x + "px"; d.style.top = n.y + "px";
        d.textContent = n.text || "…"; d.dataset.id = n.id;
        canvas.appendChild(d);
        attachNode(d, n);
      });
    }

    // ---- interactions ----
    function selectNode(id) { sel = id; render(); }
    function attachNode(d, n) {
      var dragging = false, moved = false, offX = 0, offY = 0;
      d.addEventListener("pointerdown", function (ev) {
        if (d.isContentEditable) return;
        ev.stopPropagation();
        if (connectMode) {
          if (!connectFrom) { connectFrom = n.id; selectNode(n.id); setStatus("Conectar: agora clique no nó de destino."); }
          else if (connectFrom !== n.id) {
            var exists = state.edges.some(function (e) { return (e.a === connectFrom && e.b === n.id) || (e.a === n.id && e.b === connectFrom); });
            if (!exists) state.edges.push({ a: connectFrom, b: n.id });
            connectFrom = null; connectMode = false; bConnect.style.background = "#fff"; bConnect.style.color = INK;
            setStatus("Conectado."); save(); render();
          }
          return;
        }
        selectNode(n.id);
        dragging = true; moved = false;
        var r = canvas.getBoundingClientRect();
        offX = ev.clientX - r.left - n.x; offY = ev.clientY - r.top - n.y;
        d.setPointerCapture(ev.pointerId); d.style.cursor = "grabbing";
      });
      d.addEventListener("pointermove", function (ev) {
        if (!dragging) return;
        var r = canvas.getBoundingClientRect();
        n.x = Math.max(40, Math.min(1360, ev.clientX - r.left - offX));
        n.y = Math.max(30, Math.min(970, ev.clientY - r.top - offY));
        moved = true; d.style.left = n.x + "px"; d.style.top = n.y + "px";
        // update lines cheaply
        Array.prototype.slice.call(svg.querySelectorAll("line")).forEach(function (ln, i) {
          var e = state.edges[i]; if (!e) return;
          if (e.a === n.id) { ln.setAttribute("x1", n.x); ln.setAttribute("y1", n.y); }
          if (e.b === n.id) { ln.setAttribute("x2", n.x); ln.setAttribute("y2", n.y); }
        });
      });
      d.addEventListener("pointerup", function (ev) { if (dragging) { dragging = false; d.style.cursor = "grab"; if (moved) save(); } });
      d.addEventListener("dblclick", function (ev) {
        ev.stopPropagation(); d.contentEditable = "true"; d.style.cursor = "text"; d.focus();
        var rng = document.createRange(); rng.selectNodeContents(d); var s = getSelection(); s.removeAllRanges(); s.addRange(rng);
      });
      d.addEventListener("keydown", function (ev) { if (ev.key === "Enter" && d.isContentEditable) { ev.preventDefault(); d.blur(); } });
      d.addEventListener("blur", function () { if (d.isContentEditable) { d.contentEditable = "false"; d.style.cursor = "grab"; n.text = d.textContent.trim(); save(); render(); } });
    }

    viewport.addEventListener("pointerdown", function (ev) {
      if (ev.target === viewport || ev.target === canvas || ev.target === svg) {
        sel = null;
        if (connectMode) { connectMode = false; connectFrom = null; bConnect.style.background = "#fff"; bConnect.style.color = INK; setStatus("Conexão cancelada."); }
        render();
      }
    });
    document.addEventListener("keydown", function (ev) {
      if ((ev.key === "Delete" || ev.key === "Backspace") && sel && !document.querySelector(".fws-node[contenteditable='true']")) {
        var active = document.activeElement; if (active && active.isContentEditable) return;
        removeNode(sel);
      }
    });

    function addNode() {
      var cx = viewport.scrollLeft + viewport.clientWidth / 2, cy = viewport.scrollTop + viewport.clientHeight / 2;
      var n = { id: uid(), text: "Novo nó", x: Math.round(cx), y: Math.round(cy), color: NODE_COLORS[state.nodes.length % NODE_COLORS.length] };
      state.nodes.push(n); sel = n.id; save(); render(); setStatus("Nó adicionado — duplo clique para editar.");
    }
    function removeNode(id) {
      state.nodes = state.nodes.filter(function (n) { return n.id !== id; });
      state.edges = state.edges.filter(function (e) { return e.a !== id && e.b !== id; });
      sel = null; save(); render(); setStatus("Nó removido.");
    }

    bAdd.onclick = addNode;
    bDelete.onclick = function () { if (sel) removeNode(sel); else setStatus("Selecione um nó para excluir."); };
    bConnect.onclick = function () {
      connectMode = !connectMode; connectFrom = null;
      bConnect.style.background = connectMode ? ACCENT : "#fff"; bConnect.style.color = connectMode ? "#fff" : INK;
      setStatus(connectMode ? "Conectar: clique no nó de origem." : "");
    };
    bDownload.onclick = function () {
      var blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
      var u = URL.createObjectURL(blob); var a = document.createElement("a"); a.href = u; a.download = "mapa.json"; a.click();
      setTimeout(function () { URL.revokeObjectURL(u); }, 4000);
      setStatus("Arquivo mapa.json baixado — envie-o para publicar a versão oficial.");
    };
    bImport.onclick = function () { importInput.click(); };
    importInput.onchange = function () {
      var f = importInput.files && importInput.files[0]; if (!f) return;
      var rd = new FileReader(); rd.onload = function () {
        try { var obj = JSON.parse(rd.result); if (!obj.nodes) throw 0; state = obj; sel = null; save(); render(); setStatus("Mapa importado."); }
        catch (e) { setStatus("Arquivo inválido."); }
        importInput.value = "";
      }; rd.readAsText(f);
    };
    bReset.onclick = function () {
      if (!confirm("Restaurar a versão oficial (mapa.json) e descartar as alterações locais deste navegador?")) return;
      fetch("mapa.json", { cache: "no-store" }).then(function (r) { return r.ok ? r.json() : null; })
        .then(function (obj) { state = (obj && obj.nodes) ? obj : defaultMap(); sel = null; save(); render(); setStatus("Versão oficial restaurada."); })
        .catch(function () { state = defaultMap(); save(); render(); setStatus("Sem arquivo oficial — mapa padrão carregado."); });
    };

    // ---- initial load: localStorage > mapa.json > default ----
    function init() {
      var local = null; try { local = JSON.parse(localStorage.getItem(LS_KEY) || "null"); } catch (e) {}
      if (local && local.nodes && local.nodes.length) { state = local; render(); centerView(); return; }
      fetch("mapa.json", { cache: "no-store" }).then(function (r) { return r.ok ? r.json() : null; })
        .then(function (obj) { state = (obj && obj.nodes) ? obj : defaultMap(); render(); centerView(); })
        .catch(function () { state = defaultMap(); render(); centerView(); });
    }
    function centerView() { try { viewport.scrollLeft = (canvas.offsetWidth - viewport.clientWidth) / 2; viewport.scrollTop = (canvas.offsetHeight - viewport.clientHeight) / 2 - 80; } catch (e) {} }
    init();

    return sec;
  }

  /* ============================ Montagem ============================ */
  function mount(host) {
    if (document.getElementById("fws-material") || document.getElementById("fws-mapa")) return;
    host.appendChild(buildPdfSection());
    host.appendChild(buildMindMap());
  }
  function waitAndMount() {
    var tries = 0;
    var t = setInterval(function () {
      tries++;
      var host = document.querySelector("main > div");
      if (host && host.querySelector("section")) { clearInterval(t); mount(host); }
      else if (tries > 80) { clearInterval(t); if (document.body) mount(document.body); }
    }, 120);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", waitAndMount);
  else waitAndMount();
})();
