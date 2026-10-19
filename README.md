# Throw — lobby i pokoje

PixiJS 8 + Rapier 2D. Serwer rozstrzyga fizykę i gole: 60 Hz symulacji, bazowo 20 Hz
snapshotów oraz pilne aktualizacje po strzałach i zmianach sterowania.

## Uruchomienie

```sh
npm install
npm start
```

Otwórz http://localhost:3000. Jeśli port jest zajęty, w PowerShell:

```powershell
$env:PORT = '3012'
npm start
```

Build: `npm run build`. Build i uruchomienie: `npm run build-run`.

## Flow

1. W lobby wpisz nick (2–20 znaków), utwórz pokój albo dołącz do istniejącego.
2. W pokoju wybierz niebieskich, pomarańczowych lub obserwatora. Pierwsze wolne
   miejsce jest przypisywane automatycznie; maksymalnie 5 osób na drużynę, 10 graczy.
3. Gospodarz ustawia nazwę, czas (10–3600 sekund lub 0) i limit goli (0–50).
   Domyślnie 5 minut lub 5 goli; 0 wyłącza limit, przynajmniej jeden musi zostać aktywny.
   Rozpoczyna mecz, gdy obie drużyny mają połączonego gracza.
   Zegar mierzy czas symulacji, włącznie z oknem po golu; bez połączonych graczy jest wstrzymany.
   Limit kończy mecz wynikiem lub remisem. Decydujący gol zachowuje 1,3 s dobicia piłki.
   Rewanż zeruje wynik i zegar, zachowując pokój, składy i chat.
4. Udostępnij link z panelu pokoju. Osoba z zapisanym nickiem dołączy automatycznie,
   nowa osoba wpisuje nick i klika Dołącz w lobby.
5. Wyjście do lobby zwalnia miejsce. Ostatnia osoba opuszczająca pokój usuwa go
   razem z symulacją i historią. Po wyjściu gospodarza jego rolę przejmuje kolejna osoba.

Pokoje mają niezależną fizykę, wynik, roster i chat. Dołączenie, zmiana drużyny i wyjście
w trakcie meczu nie resetują akcji ani wyniku. Nowy gracz pojawia się przy swojej stronie
boiska. Puste miejsca nie są rysowane i nie uczestniczą w kolizjach.

Nick i pokoje nie są kontami użytkowników. Pokoje i ostatnie 80 wiadomości żyją w pamięci
serwera i znikają po jego restarcie. Po odświeżeniu lub utracie połączenia masz 15 sekund na powrót do tej samej sesji.
Pokój, miejsce, gospodarz i chat zostają zachowane. Rozłączony gracz znika z fizyki;
po przekroczeniu limitu jego miejsce zostaje zwolnione. Wyjście do lobby działa od razu.

## Chat i system

Chat działa przed meczem i podczas niego. Pisanie w polach, wybieranie drużyny oraz
zaznaczanie tekstu nie sterują graczem. Wiadomości są zwykłym tekstem (do 320 znaków).
System informuje o dołączeniu, wyjściu, zmianie drużyny, gospodarzu, starcie, zatrzymaniu i golach.

## Sterowanie i zachowane mechaniki

- WASD / strzałki: ruch własnego gracza.
- X / spacja: strzał od gracza przez piłkę. Przytrzymanie spowalnia ruch.
- Shift + ruch: boost, jeśli masz energię.
- R: reset akcji (gospodarz, gdy gra w drużynie).
- Reset wyniku na boisku: dostępny w treningu i trybie quick. W pokojach wynik zeruje rewanż.
- Obramówka czarna przy puszczonym strzale, biała przy przytrzymanym, również po golu.

Gracze A, C, E, G, I są niebiescy; B, D, F, H, J są pomarańczowi. Limit pochodzi
ze wspólnego `RULES.maxPlayers`. Wynik jest zawsze rozstrzygany przez serwer.
Po golu fizyka i sterowanie działają przez 1,3 sekundy; można dobijać piłkę bez naliczania
kolejnych goli. Kickoff zeruje prędkości, siły, cooldowny i stare komendy.

Po golu wznawia drużyna, która straciła bramkę. Do pierwszego dotknięcia piłki przez
jej aktywnego gracza przeciwnicy pozostają na własnej połowie poza kołem.
Wznawiający mogą poruszać się po własnej połowie oraz po całym kole środkowym,
również za linią środkową wewnątrz koła, ale nie poza kołem na połowie przeciwnika.
Granica uwzględnia cały promień gracza i jest oznaczona na boisku.
Dotknięcie ciałem lub skuteczne kopnięcie zwalnia blokadę; samo przytrzymanie
strzału jej nie zwalnia. Ograniczenie obowiązuje na serwerze i w predykcji klienta.
Nowy mecz i trening bez wcześniejszego gola zaczynają się bez tej blokady.

## Architektura

- `frontend/core/core.ts`: właściciel aplikacji Pixi, renderer, resize i zegary UI.
  Opcja `minimal` pozwala użyć go bez obowiązkowego ekranu powitalnego starego boilera.
- `frontend/core/prepreload.ts`, `preload.ts`: dotychczasowy loader zasobów Pixi.
- `frontend/app/appController.ts`: przełączanie lobby/pokoju, lifecycle Core i sesji gry.
- `frontend/lobby/client.ts`: transport lobby; `lobbyView.ts` i `roomView.ts`: osobne
  ekrany HTML/CSS. Natywne inputy, zaznaczanie tekstu i scroll chatu.
- `frontend/game/gameView.ts`: wyłącznie boisko, HUD i sterowanie.
- `frontend/game/session.ts`: sesja lokalna/sieciowa, wejścia i potwierdzenia.
- `shared/game/prediction.ts`: spójna predykcja świata, wygładzanie korekt i ograniczenia widoku.
- `shared/game/matchRules.ts`: ustawienia, zegar, zakończenie i wynik meczu.
- `frontend/lobby/matchPanel.ts`: ustawienia i podsumowanie, poza GameView.
- `shared/game/simulation.ts`: fizyka oraz reguły, niezależne od DOM i Pixi.
- `backend/lobby/directory.ts`: pokoje, członkostwo, drużyny, chat, komunikaty i lifecycle meczów.
- `backend/game/match.ts`: jedna izolowana symulacja i synchronizacja uczestników.

Lobby używa `/lobby`, a gra `/game?room=...&member=...`. Serwer sprawdza członkostwo
z aktywnej sesji lobby; sam link pokoju nie pozwala podszyć się pod gracza.
Przy proxy trzeba przekazywać upgrade obu tras WebSocket; HTTPS używa WSS automatycznie.

## Tryby pomocnicze i pomiary

- `/?local=1`: trening offline.
- `/?quick=1`: poprzedni prototyp z jednym automatycznym meczem, do testów regresji.
- `&latency=150&debug=1` przy linku pokoju: dodatkowy RTT 150 ms oraz HUD diagnostyczny.
- `/metrics`: statystyki meczów i lista aktywnych pokoi.

```sh
npm test
npm run typecheck
npm run lint
npm run build
npm run benchmark
```

Testy obejmują fizykę, predykcję, kolizje, 10 klientów, izolację dwóch pokoi i chatów,
uprawnienia gospodarza, role, dołączenie bez resetu, sukcesję gospodarza i usuwanie pustego pokoju.
Benchmark dotyczy samej fizyki na lokalnym CPU i nie jest prognozą pojemności VPS.

## Zarządzanie pokojem

Gospodarz ma zwijany panel po prawej: przenoszenie osób do drużyn i obserwatorów,
przekazanie roli połączonej osobie oraz wyrzucanie. Przeniesienie nie resetuje meczu;
po wyprowadzeniu ostatniego gracza na widownię mecz jest zatrzymywany.
Wyrzucona sesja ma 30 sekund przerwy przed ponownym dołączeniem (to nie ban konta).

Opcjonalne hasło można podać przy tworzeniu pokoju lub zmienić w panelu zarządzania.
Puste hasło otwiera pokój. Pokoje z hasłem są oznaczone na liście i nadal mają link;
wejście z linku wymaga hasła, a wznowienie istniejącej sesji w ciągu 15 sekund nie.
Zmiana hasła nie wyrzuca obecnych uczestników. Hasło nie jest wysyłane w stanach pokoju,
listach ani linkach; serwer przechowuje tylko skrót z osobną losową solą dla pokoju.

`frontend/lobby/roomManagement.ts` obsługuje panel, a uprawnienia i limity są egzekwowane
w `backend/lobby/directory.ts`. Testy sieciowe sprawdzają role, hasła, limit drużyn,
przeniesienie bez resetu, przekazanie gospodarza i odcięcie wyrzuconego gracza.

## Avatary emoji

W lobby wybierz avatar z listy popularnych emoji, oryginalnej listy 20 legendarnych
avatarów z throw_old albo wklej własne pojedyncze emoji. Obsługiwane są m.in. rodziny,
modyfikatory koloru skóry i flagi. Wybór zapisuje się lokalnie razem z nickiem.
Na boisku avatar zastępuje literkę, nick jest nad graczem, a kolor drużyny i wskaźnik
strzału pozostają na obramowaniu. Emoji są również widoczne w składach i chacie.

`frontend/game/avatarImage.ts` generuje przez Canvas przezroczysty PNG 128×128 jako
base64 i buforuje obrazy. GameView używa Sprite; tekstury są zwalniane po opuszczeniu
sesji. Serwer przesyła i sprawdza pojedynczy symbol emoji, bez obrazów w snapshotach
fizyki. Wygląd glyphów może zależeć od fontów emoji dostępnych na urządzeniu.

## Energia i boost

Sześć symetrycznych punktów energii na boisku daje po 35 energii (maksymalnie 100).
Zebrany punkt odradza się po 8 sekundach; przy pełnej energii nie jest zużywany.
Shift podczas ruchu zwiększa prędkość z 6 do 9 i przyspieszenie z 32 do 48,
zużywając 25 energii na sekundę. Samo przytrzymanie Shifta w miejscu nic nie zużywa.
Strzelanie wyłącza boost i zachowuje poprzednią prędkość podczas strzału.

Pasek własnej energii jest na boisku; aktywny boost ma złotą poświatę.
Serwer rozstrzyga podniesienia i energię, a klient przewiduje własne podniesienia
oraz boost i uzgadnia je z autorytatywnym stanem. Punkty nie blokują fizyki piłki.
Po golu energia działa w oknie swobodnej gry, a kickoff zeruje energię i odradza punkty.
Dołączający gracz zaczyna bez energii. Zegar i punkty są wstrzymane poza rozgrywką.
Parametry: `shared/game/energy.ts`; rysowanie: `frontend/game/energyView.ts`.

## Test obciążeniowy wielu pokojów

```sh
npm run load-test -- --rooms 5 --players 10 --duration 30 --output dist/reports/load.json
npm run load-test -- --rooms 3 --duration 60 --latency 100 --jitter 35 --churn --output dist/reports/delayed.json
npm run load-test -- --rooms 5 --duration 600 --churn --output dist/reports/long-run.json
```

Bez `--url` test uruchamia osobny proces serwera na losowym porcie localhost;
nie korzysta z otwartego podglądu gry. Boty mają prawdziwe połączenia lobby i gry,
sterują z 60 komendami/s, strzelają, zbierają energię, używają boostu i piszą na chacie.
`--churn` co 5 sekund rozłącza jednego uczestnika i wznawia jego sesję.
Na końcu test opuszcza tylko utworzone przez siebie pokoje i sprawdza ich usunięcie.

`--latency` oznacza opóźnienie W JEDNĄ STRONĘ, a `--jitter` losowe ±ms.
Wiadomości zachowują kolejność WebSocket; strat pakietów nie symulujemy.
Boty nie renderują Pixi. Lokalnie boty i serwer są osobnymi procesami, ale dzielą sprzęt.
Raport obejmuje CPU (procent jednego rdzenia), RSS/heap, p95/p99 RTT i odstępów snapshotów,
częstotliwość symulacji, transfer gry (bez lobby/HTTP), reconnecty i nieoczekiwane rozłączenia.
Sam wzrost pamięci w krótkim teście nie dowodzi wycieku.

Test kończy się kodem 1 przy nieoczekiwanym rozłączeniu, błędzie protokołu,
niepoprawnym stanie, symulacji poniżej 57 kroków/s, utracie ponad 100 ms czasu,
p99 pętli zdarzeń ponad 100 ms lub pozostawieniu testowych pokojów.
Histogram pętli obejmuje czas działania serwera, a średnia i maksimum fizyki czas życia pokoju.
Krótki pomiar lokalny nie określa pojemności VPS.

Na wdrożonym serwerze, w kontrolowanym terminie i z aktualnym backendem:

```sh
npm run load-test -- --url https://adres-twojego-serwera --rooms 3 --duration 60 --output dist/reports/vps.json
```

Ten wariant tworzy prawdziwe pokoje i ruch na wskazanym serwerze. Metryki CPU obejmują
cały proces, także pozostałych użytkowników. `/metrics` ma teraz `schemaVersion: 2`
i sekcję `runtime`; dotychczasowe pola fizyki oraz lista pokojów pozostają dostępne.

Wyniki wykonanych lokalnych przebiegów: [docs/load-test-results.md](docs/load-test-results.md).

## Boiska i kamera

Gospodarz wybiera boisko i kolorystykę w panelu „Boisko i wygląd” przed meczem.
Warianty: klasyczne 24×12, zaokrąglone 24×12, duże 40×22 i duże zaokrąglone 40×22.
Kolorystyki: trawa, noc, lód — są wizualne, bez zmian tarcia i sterowania.
Zaokrąglone rogi mają rzeczywiste segmenty kolizji w Rapierze, zgodne z obrysem boiska.
Bramki, spawny, punkty energii i ograniczenia predykcji korzystają z tej samej geometrii.
Ustawienie jest wspólne dla całego pokoju i nie może być zmienione podczas meczu.

Na małych boiskach kamera obejmuje całe boisko. Na dużych podąża za własnym graczem,
uwzględnia piłkę i płynnie zmienia zbliżenie. Własny gracz ma priorytet, więc bardzo
odległa piłka może zostać poza kadrem — wtedy również ma wskaźnik na krawędzi.
Gracze poza widokiem mają strzałki w kolorach drużyn, emoji i nicki. Znaczniki bliskie
sobie są rozsuwane, a obserwator widzi całą planszę. Kamera nie zmienia fizyki.

W treningu dropdowny w lewym górnym rogu zmieniają boisko i rozpoczynają świeżą sesję.
Przykład: `/?local=1&arena=large-rounded&skin=night`.

- `shared/game/arenas.ts`: warianty, obrys, punkty energii i projekcja do legalnego obszaru.
- `frontend/game/arenaView.ts`: renderowanie boiska; `camera.ts`: śledzenie i łagodzenie.
- `frontend/game/offscreenPlayers.ts`: wskaźniki; `frontend/lobby/arenaPanel.ts`: wybór gospodarza.

Test nowej geometrii z klientami WebSocket:

```sh
npm run load-test -- --rooms 1 --players 10 --duration 10 --arena large-rounded --skin night --output dist/reports/large-rounded.json
```
