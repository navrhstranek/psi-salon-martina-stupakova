/**
 * Lišta se souhlasem s cookies.
 *
 * Jeden soubor pro celý web: sám si přinese styl i obsah, takže stačí ho
 * na stránku připojit. Volba se pamatuje v localStorage, ne v cookie,
 * takže se návštěvníkovi bez jeho svolení nic neukládá.
 *
 * Web dnes žádné měřicí ani reklamní cookies nemá. Kdyby někdy přibyly
 * (návštěvnost, pixel), spouštějte je až po souhlasu:
 *
 *     document.addEventListener('cookies-souhlas', function (e) {
 *       if (e.detail === 'vse') { ...tady teprve načíst měření... }
 *     });
 *
 * Aktuální stav je kdykoli v window.souhlasCookies ('vse' | 'nezbytne' | null).
 */
(function () {
  'use strict';

  var KLIC = 'salon-martina-souhlas';
  var PLATNOST = 365 * 24 * 3600 * 1000;   // po roce se zeptáme znovu

  function nactiVolbu() {
    try {
      var ulozeno = JSON.parse(localStorage.getItem(KLIC) || 'null');
      if (!ulozeno || !ulozeno.volba) return null;
      if (Date.now() - (ulozeno.kdy || 0) > PLATNOST) return null;
      return ulozeno.volba;
    } catch (e) {
      return null;    // soukromé okno nebo zakázané úložiště
    }
  }

  function ulozVolbu(volba) {
    try {
      localStorage.setItem(KLIC, JSON.stringify({ volba: volba, kdy: Date.now() }));
    } catch (e) { /* nevadí, jen se zeptáme příště znovu */ }
  }

  window.souhlasCookies = nactiVolbu();

  var STYL = [
    '.cookies{position:fixed;left:16px;right:16px;bottom:16px;z-index:900;',
    '  display:flex;justify-content:center;pointer-events:none;}',
    '.cookies-karta{pointer-events:auto;width:100%;max-width:760px;',
    '  background:var(--surface,#fff);border-radius:24px;padding:26px 28px;',
    '  box-shadow:0 1px 2px rgba(20,20,20,.06),0 24px 60px -24px rgba(20,20,20,.45);',
    '  transform:translateY(18px);opacity:0;transition:transform .45s cubic-bezier(.22,1,.36,1),opacity .45s ease;}',
    '.cookies.je-videt .cookies-karta{transform:none;opacity:1;}',
    '.cookies h2{margin:0;font-size:19px;font-weight:900;letter-spacing:-0.02em;color:var(--ink,#141414);}',
    '.cookies p{margin:10px 0 0;font-size:15px;line-height:1.55;color:var(--ink-soft,#5a5a5a);}',
    '.cookies a{color:var(--accent,#c54822);font-weight:500;text-decoration:underline;}',
    '.cookies-tlacitka{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-top:20px;}',
    '.cookies button{font-family:inherit;font-size:15.5px;font-weight:500;border:none;',
    '  border-radius:999px;padding:12px 24px;cursor:pointer;transition:background .18s ease,color .18s ease;}',
    '.cookies .prijmout{background:var(--accent,#c54822);color:#fff;}',
    '.cookies .prijmout:hover{background:var(--accent-dark,#a6391b);}',
    '.cookies .nezbytne{background:var(--bg,#f4f4f4);color:var(--ink-soft,#5a5a5a);}',
    '.cookies .nezbytne:hover{color:var(--ink,#141414);}',
    '.cookies button:focus-visible{outline:2px solid var(--accent-dark,#a6391b);outline-offset:3px;}',
    '@media (max-width:560px){',
    '  .cookies{left:10px;right:10px;bottom:10px;}',
    '  .cookies-karta{padding:22px 20px;border-radius:20px;}',
    '  .cookies-tlacitka{margin-top:16px;}',
    '  .cookies-tlacitka button{flex:1;padding:12px 16px;}}',
    '@media (prefers-reduced-motion: reduce){',
    '  .cookies-karta{transition:none;transform:none;opacity:1;}}'
  ].join('');

  var lista = null;

  function odkazNaZasady() {
    // podstránky i blog leží o úroveň níž, odkaz podle toho upravíme
    var cesta = location.pathname;
    if (cesta === '/' || cesta.lastIndexOf('/') === 0) return 'zasady-ochrany-osobnich-udaju/';
    return '/zasady-ochrany-osobnich-udaju/';
  }

  function postav() {
    var styl = document.createElement('style');
    styl.textContent = STYL;
    document.head.appendChild(styl);

    lista = document.createElement('div');
    lista.className = 'cookies';
    lista.setAttribute('role', 'dialog');
    lista.setAttribute('aria-labelledby', 'cookies-nadpis');
    lista.innerHTML =
      '<div class="cookies-karta">' +
        '<h2 id="cookies-nadpis">Cookies na tomhle webu</h2>' +
        '<p>Web používá jen nezbytné cookies. Více v ' +
        '<a href="' + odkazNaZasady() + '">zásadách ochrany osobních údajů</a>.</p>' +
        '<div class="cookies-tlacitka">' +
          '<button type="button" class="prijmout">Přijmout vše</button>' +
          '<button type="button" class="nezbytne">Jen nezbytné</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(lista);

    lista.querySelector('.prijmout').addEventListener('click', function () { rozhodni('vse'); });
    lista.querySelector('.nezbytne').addEventListener('click', function () { rozhodni('nezbytne'); });
  }

  function ukaz() {
    if (!lista) postav();
    lista.hidden = false;
    requestAnimationFrame(function () { lista.classList.add('je-videt'); });
  }

  function schovej() {
    if (!lista) return;
    lista.classList.remove('je-videt');
    setTimeout(function () { if (lista) lista.hidden = true; }, 450);
  }

  function rozhodni(volba) {
    ulozVolbu(volba);
    window.souhlasCookies = volba;
    schovej();
    document.dispatchEvent(new CustomEvent('cookies-souhlas', { detail: volba }));
  }

  // odkaz v patičce, kterým se dá volba kdykoli změnit
  Array.prototype.forEach.call(document.querySelectorAll('[data-cookies]'), function (el) {
    el.addEventListener('click', function (e) { e.preventDefault(); ukaz(); });
  });

  if (!window.souhlasCookies) ukaz();
})();
