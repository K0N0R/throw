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
- R: reset akcji (gospodarz, gdy gra w drużynie).
- Reset wyniku na boisku: dostępny w treningu i trybie quick. W pokojach wynik zeruje rewanż.
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
