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

    // Pętla przesuwa taśmę o długość jednego pełnego zestawu wpisów.
    // Żeby w tej chwili nie odsłonić pustego miejsca, taśma musi być
    // dłuższa od okna o co najmniej ten zestaw — przy trzech wpisach na
    // szerokim ekranie jedno powielenie nie wystarcza, więc dokładamy
    // kolejne zestawy aż warunek będzie spełniony.
    function uzupelnijKlony() {
      var szerokoscOkna = okno.clientWidth || 1;
      var bezpiecznik = 0;
      while (tasma.scrollWidth < szerokoscOkna * 2 && bezpiecznik < 12) {
        var slajdy = tasma.querySelectorAll(".cm-karuzela-slajd");
        for (var i = 0; i < oryginalne; i++) {
          var klon = slajdy[i].cloneNode(true);
          klon.setAttribute("aria-hidden", "true");
          // klon nie może przechwytywać fokusu — to ta sama treść
          Array.prototype.forEach.call(klon.querySelectorAll("a"), function (a) {
            a.setAttribute("tabindex", "-1");
          });
          tasma.appendChild(klon);
        }
        bezpiecznik++;
      }
      return bezpiecznik + 1; // liczba zestawów na taśmie
    }

    var zestawy = uzupelnijKlony();

    function ustawTempo() {
      var dystans = tasma.scrollWidth / zestawy; // długość jednego zestawu
      if (!dystans) return;
      tasma.style.setProperty("--cm-dystans", dystans + "px");
      tasma.style.setProperty("--cm-czas", dystans / PREDKOSC + "s");
    }

    ustawTempo();
    window.addEventListener("resize", ustawTempo);
    // obrazy dochodzą po starcie i zmieniają szerokość taśmy
    Array.prototype.forEach.call(okno.querySelectorAll("img"), function (img) {
      if (!img.complete) img.addEventListener("load", ustawTempo);
    });

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
