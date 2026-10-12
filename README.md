# Throw — mecz online do 10 graczy

PixiJS 8 + Rapier 2D, fizyka 60 Hz na serwerze Node, aktualizacje świata 20 Hz przez WebSocket.
Parametry ruchu, strzałów, odbić i wymiary boiska pozostały takie jak w prototypie lokalnym.

## Uruchomienie

```sh
npm install
npm start
```

Otwórz http://localhost:3000 w maksymalnie dziesięciu przeglądarkach/kartach graczy.
Socket zajmuje pierwsze wolne miejsce od A do J. Niebiescy: A, C, E, G, I.
Pomarańczowi: B, D, F, H, J. Litery są widoczne na postaciach.
Jedenaste i kolejne połączenia oglądają mecz. Widz zostaje widzem; żeby zająć
zwolnione miejsce, odśwież stronę. Pozycje pozostałych graczy zachowują swoje litery.

Mecz rusza, gdy obie drużyny mają co najmniej jednego gracza: od 1 na 1 do 5 na 5, również przy nierównych składach.
Na boisku są widoczne i biorą udział w kolizjach wyłącznie miejsca z podłączonym socketem.
Rozłączenie usuwa postać z widoku i wyłącza jej ciało fizyczne.
Zmiana składu resetuje akcję, zachowując wynik. Reset wyniku i R są dostępne
najniższemu zajętemu miejscu (zwykle A; po jego wyjściu kolejnemu graczowi).

Jeśli port 3000 jest zajęty, w PowerShell:

```powershell
$env:PORT = '3012'
npm start
```

Wtedy otwórz http://localhost:3012. Drugi komputer w tej samej sieci może użyć adresu
IP komputera uruchamiającego serwer zamiast localhost (port musi być dostępny).
Build produkcyjny: `npm run build`; build i uruchomienie: `npm run build-run`.
Przy hostowaniu przez proxy przekazuj również upgrade WebSocket na `/game`.
Na stronie HTTPS klient automatycznie używa WSS.

## Sterowanie

- WASD / strzałki: ruch własnego gracza.
- X / spacja: strzał od gracza przez piłkę. Można przytrzymać; ruch jest wtedy wolniejszy.
- R: reset akcji, bez kasowania wyniku (gospodarz — najniższe zajęte miejsce).
- „Reset wyniku”: nowy mecz (gospodarz — najniższe zajęte miejsce).

Cała piłka musi przekroczyć linię bramkową. Gol naliczany jest raz;
po 1,3 sekundy serwer resetuje pozycje. W tym czasie gracze i piłka nadal się poruszają,
można strzelać, a następne trafienia nie dodają punktów ani nie przedłużają czasu do resetu.
Reset zeruje prędkości, siły, cooldowny i kolejki komend sprzed nowej akcji. Niebiescy atakują prawą bramkę.
Zmiana fokusu zwalnia klawisze; po braku wejścia serwer zatrzymuje sterowanie po 250 ms.
Odłączenie od serwera pokazuje komunikat i uruchamia ponowne połączenie.
Po reconnect miejsce jest przydzielane ponownie; nie ma jeszcze kont ani zachowywania tożsamości.

## Porównanie lokalne i opóźnienie

- `/?local=1`: zachowany trening lokalny z jednym graczem.
- `/?latency=50&debug=1`, `100` lub `150`: dodaje odpowiednio tyle milisekund **RTT**.
  Połowa opóźnienia jest na wysyłaniu, połowa na odbieraniu; rzeczywisty RTT dochodzi do tej wartości.
- `/?debug=1`: RTT, tick serwera, liczba niepotwierdzonych wejść i rozmiar ostatniej korekty.

Oba komputery muszą otworzyć ten sam serwer. localhost oznacza zawsze bieżący komputer.
Symulator opóźnienia nie dodaje utraty pakietów ani zmiennego jittera.

## Architektura

- `shared/game/simulation.ts`: wspólna fizyka, do dziesięciu aktywnych ciał graczy, zasady, snapshoty i przywracanie stanu.
  Bez DOM, Pixi i transportu. Konfiguracja `RULES` zachowuje wartości z etapu 1.
- `shared/game/protocol.ts`: typy komunikatów i walidacja wejścia.
- `backend/game/match.ts`: jeden mecz, miejsca i widzowie, kolejki wejść,
  potwierdzenia sekwencji, stały krok i kontrolowana częstotliwość publikacji.
- `frontend/game/session.ts`: transport, wejścia, potwierdzenia i ponowne łączenie.
- `shared/game/prediction.ts`: predykcja obu graczy i piłki na jednej osi czasu.
  Po snapshotach odtwarza niepotwierdzone wejścia własnego gracza. Predykcja strzałów
  obejmuje tylko własnego gracza; strzały przeciwnika potwierdza serwer.
  Korekty zachowują ciągłość widoku również po dużym błędzie: 60 ms dla własnego gracza,
  120 ms dla przeciwnika i 90 ms dla piłki, z ograniczeniem szybkości doganiania.
  Kontakty są korygowane w widoku bez kasowania całego wygładzania.
  Nowa akcja natychmiast ustawia właściwy stan gry; samo naliczenie gola zachowuje interpolację.
- `frontend/game/gameView.ts`: wspólny widok Pixi i sterowanie.

Klient wysyła paczki dwóch wejść 30 razy/s (wejścia symulacji 60 Hz).
Serwer wysyła pełne snapshoty małego świata bazowo 20 razy/s; serializuje raz dla wszystkich odbiorców.
Po strzale, zmianie wejścia lub fazy wysyła dodatkową aktualizację w tym samym ticku,
żeby przeciwnik nie czekał na następną okresową publikację.
Wynik, faza meczu i gole zawsze pochodzą z serwera; lokalna predykcja nie przyznaje punktów.
Snapshot zawiera numer akcji, więc stare komendy nie przemieszczają graczy po resecie.
Niepoprawne dane, wejścia od widzów i nadmierny backlog są odrzucane.
Nieznane jeszcze wejścia przeciwnika są przewidywane z jego ostatniego sterowania. Przy zmianie
kierunku lub strzale pod dużym opóźnieniem nadal możliwe są korekty; nie ma lag compensation.

To pierwszy prototyp online: jeden wspólny mecz do 10 graczy, bez lobby, matchmakingu, rankingu i power-upów.
Dotychczasowe komponenty boilera w `frontend/core` pozostają dostępne.

## Weryfikacja i pomiary

```sh
npm test
npm run typecheck
npm run lint
npm run build
npm run benchmark
```

Testy używają rzeczywistej fizyki Rapiera i prawdziwych połączeń WebSocket:
sterowanie dwóch klientów, gol, zgodny wynik u widza, reset, odłączenie,
ponowne zajęcie miejsca, błędne wejścia i komendy sprzed resetu.

`/metrics` zwraca liczbę kroków, średni/maksymalny koszt fizyki, liczby graczy i widzów,
łączny transfer oraz średni transfer wyjściowy od startu procesu.
`npm run benchmark` mierzy 1, 10 i 50 symulacji po 10 graczy na lokalnym CPU (300 kroków po rozgrzewce),
średni koszt i p95. Nie obejmuje sieci, serializacji ani renderowania i nie jest prognozą pojemności VPS.

## Kontakty i regresje synchronizacji

Ruch w wolnej przestrzeni i siła strzału zachowują wcześniejsze wartości. Nieruchomy gracz
w kontakcie z drugim graczem hamuje słabiej, aby mógł być przepychany. Aktywnie
przeciwdziałający gracze nadal mogą blokować siebie nawzajem. Solver używa 8 iteracji
i wyprzedzającego wykrywania kontaktu na odległość 0,1 jednostki.
Testy obejmują przepychanie, przeciwny ruch, ciągłość lotu piłki oraz brak widocznego
przenikania w predykcji przy RTT 0, 50, 100 i 150 ms.

Obramówka gracza jest czarna przy puszczonym klawiszu strzału i biała podczas jego
przytrzymania. U własnego gracza reaguje natychmiast na klawiaturę; u przeciwnika
stan jest synchronizowany przez serwer. Wskaźnik działa również po golu i poza zasięgiem piłki.

Limit miejsc jest wspólny dla klienta i serwera: `RULES.maxPlayers` w `shared/game/simulation.ts`.
