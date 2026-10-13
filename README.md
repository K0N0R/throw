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
3. Gospodarz rozpoczyna mecz, gdy obie drużyny mają gracza. Może go zatrzymać i zacząć kolejny.
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
- R: reset akcji (gospodarz, gdy gra w drużynie).
- Reset wyniku na boisku: nowy wynik (gospodarz, gdy gra w drużynie).
- Obramówka czarna przy puszczonym strzale, biała przy przytrzymanym, również po golu.

Gracze A, C, E, G, I są niebiescy; B, D, F, H, J są pomarańczowi. Limit pochodzi
ze wspólnego `RULES.maxPlayers`. Wynik jest zawsze rozstrzygany przez serwer.
Po golu fizyka i sterowanie działają przez 1,3 sekundy; można dobijać piłkę bez naliczania
kolejnych goli. Kickoff zeruje prędkości, siły, cooldowny i stare komendy.

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
