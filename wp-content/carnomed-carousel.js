/* ==========================================================================
   Carnomed — karuzela sekcji "Aktualności"

   Zamienia siatkę wpisów Divi w płynącą taśmę. Wpisy są klonowane, więc
   pętla nie ma szwu ani skoku na końcu — taśma wraca do początku dokładnie
   w chwili, gdy pierwszy klon staje na miejscu oryginału.

   Ruch zatrzymuje się pod kursorem i przy fokusie z klawiatury, żeby dało
   się przeczytać zajawkę i kliknąć wpis. Przy włączonym ograniczeniu
   animacji taśma nie rusza w ogóle i zostaje zwykłą listą do przewijania.

   Skrypt nie modyfikuje treści strony — tylko przestawia gotowe elementy.
   ========================================================================== */
(function () {
  "use strict";

  var PREDKOSC = 42; // px na sekundę

  function inicjuj() {
    // Montujemy w .et_pb_blog_grid, nie w .et_pb_salvattore_content:
    // salvattore rozdziela dzieci tego drugiego do własnych kolumn i przy
    // montażu niżej wciągał całą karuzelę do jednej z nich.
    var siatka = document.querySelector(".et_pb_blog_grid");
    if (!siatka || siatka.dataset.cmKaruzela) return;

    var wpisy = Array.prototype.slice.call(siatka.querySelectorAll("article"));
    if (wpisy.length < 2) return;

    siatka.dataset.cmKaruzela = "1";

    var okno = document.createElement("div");
    okno.className = "cm-karuzela";
    var tasma = document.createElement("div");
    tasma.className = "cm-karuzela-tasma";
    okno.appendChild(tasma);

    wpisy.forEach(function (w) {
      var slajd = document.createElement("div");
      slajd.className = "cm-karuzela-slajd";
      slajd.appendChild(w);
      tasma.appendChild(slajd);
    });

    siatka.innerHTML = "";
    siatka.appendChild(okno);

    var oryginalne = wpisy.length;

    // Długość jednego zestawu mierzona na żywo: od lewej krawędzi pierwszego
    // wpisu do lewej krawędzi jego pierwszego klonu. Wlicza odstęp między
    // ostatnim wpisem a klonem, którego nie łapało dzielenie scrollWidth
    // przez liczbę zestawów — stąd był skok o szerokość jednego odstępu
    // przy każdym zamknięciu pętli.
    function dlugoscZestawu() {
      var slajdy = tasma.children;
      if (slajdy.length <= oryginalne) return 0;
      return slajdy[oryginalne].offsetLeft - slajdy[0].offsetLeft;
    }

    function dodajZestaw() {
      for (var i = 0; i < oryginalne; i++) {
        var klon = tasma.children[i].cloneNode(true);
        klon.setAttribute("aria-hidden", "true");
        // klon nie może przechwytywać fokusu — to ta sama treść
        Array.prototype.forEach.call(klon.querySelectorAll("a"), function (a) {
          a.setAttribute("tabindex", "-1");
        });
        tasma.appendChild(klon);
      }
    }

    // W chwili zamknięcia pętli taśma stoi przesunięta o jeden zestaw,
    // więc za oknem musi zostać jeszcze co najmniej okno treści. Warunek
    // sprawdzany przy każdej zmianie szerokości: taśma zbudowana na wąskim
    // oknie po rozciągnięciu przeglądarki odsłaniała pusty koniec.
    function przelicz() {
      if (tasma.children.length <= oryginalne) dodajZestaw();
      var zestaw = dlugoscZestawu();
      if (!zestaw) return;
      var potrzeba = okno.clientWidth + zestaw;
      var bezpiecznik = 0;
      while (tasma.scrollWidth < potrzeba && bezpiecznik < 12) {
        dodajZestaw();
        bezpiecznik++;
      }
      tasma.style.setProperty("--cm-dystans", zestaw + "px");
      tasma.style.setProperty("--cm-czas", zestaw / PREDKOSC + "s");
    }

    przelicz();
    var czekaj;
    function przeliczPozniej() {
      clearTimeout(czekaj);
      czekaj = setTimeout(przelicz, 120);
    }
    // ResizeObserver patrzy na samo okno karuzeli, więc łapie każdą zmianę
    // jego szerokości — także taką, przy której window nie dostaje "resize"
    // (zmiana layoutu, pasek przewijania, osadzenie w ramce).
    if (window.ResizeObserver) {
      new ResizeObserver(przeliczPozniej).observe(okno);
    } else {
      window.addEventListener("resize", przeliczPozniej);
    }
    // obrazy i font dochodzą po starcie i zmieniają szerokość taśmy
    Array.prototype.forEach.call(okno.querySelectorAll("img"), function (img) {
      if (!img.complete) img.addEventListener("load", przelicz);
    });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(przelicz);

    okno.classList.add("cm-karuzela-gotowa");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", inicjuj);
  } else {
    inicjuj();
  }
  // Divi dokłada wpisy asynchronicznie przy paginacji ajax
  window.addEventListener("load", inicjuj);
})();
