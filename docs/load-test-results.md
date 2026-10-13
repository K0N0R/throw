# Testy obciążenia Throw — 13 października 2026

Testy odbyły się lokalnie: osobny proces serwera i osobny proces klientów Node.js na
tej samej maszynie z Windows. Boty używały WebSocketów lobby i gry, ruchu, strzałów,
energii, boostu i chatu. Nie renderowały Pixi. To nie jest pomiar wydajności VPS.

| Scenariusz | Pokoje × gracze | Czas pomiaru | CPU jednego rdzenia | RSS serwera | Kroki/s pokoju | Transfer snapshotów | Zerwania |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Kontrolny | 1 × 10 | 5 s | 5.9% | 84.4 MiB | 60.1–60.1 | 0.76 MiB/s | 0 |
| 50 graczy | 5 × 10 | 20 s | 12.2% | 97.8 MiB | 60.0–60.0 | 3.84 MiB/s | 0 |
| Opóźnienia + reconnect | 3 × 10 | 25 s | 12.0% | 87.7 MiB | 60.0–60.0 | 3.20 MiB/s | 0 |
| Minutowy + reconnect | 3 × 10 | 60 s | 10.3% | 98.0 MiB | 60.0–60.0 | 2.31 MiB/s | 0 |

W każdym przebiegu: zero niepoprawnych stanów fizyki/energii i zero odrzuconego czasu
symulacji w oknie pomiarowym. Test opóźnień dodawał 100 ms w jedną stronę i jitter
±35 ms, zachowując kolejność wiadomości: średni RTT około 231 ms, p95 około 264 ms.
Przeszło 5 wznowień połączenia. Przebieg minutowy wykonał 12 wznowień i zweryfikował,
że testowe pokoje zostały posprzątane. W teście minutowym heap wzrósł o około 0,6 MiB,
RSS o około 13,8 MiB; te liczby same nie rozstrzygają o wycieku pamięci.

Największy widoczny koszt przy 50 graczach to transfer snapshotów: około 3,84 MiB/s,
czyli 32,2 Mb/s. Dane nie obejmują lobby, HTTP ani narzutu WebSocket/TLS/TCP.
CPU i częstotliwość fizyki nie wskazały przeciążenia w przetestowanych scenariuszach.
Następny krok techniczny: ograniczenie rozmiaru i liczby aktualizacji wysyłanych do
klientów, z zachowaniem dotychczasowej predykcji i wygładzania.

## Ograniczenia

- Czasy 5–60 sekund służą jako wstępne pomiary. Test 10-minutowy jest dostępny,
  ale nie był jeszcze wykonany w tym zestawie.
- Boty i serwer dzielą sprzęt; brak GPU/renderingu i rzeczywistych strat pakietów.
- Procenty CPU dotyczą jednego rdzenia, a nie całego wielordzeniowego komputera.
- Historia opóźnień pętli zdarzeń obejmuje cały czas serwera, a średnia i maksimum
  fizyki cały czas pokoju, włącznie z rozgrzewką.
- Percentyle są estymowane z ograniczonej próbki opóźnień. Średnie, maksima i liczniki
  transferu oraz kroków obejmują wszystkie obserwacje w oknie pomiarowym.

## Powtórzenie testu

```sh
npm run load-test -- --rooms 5 --duration 30 --output dist/reports/load.json
npm run load-test -- --rooms 3 --duration 60 --latency 100 --jitter 35 --churn --output dist/reports/delayed.json
npm run load-test -- --rooms 5 --duration 600 --churn --output dist/reports/long-run.json
```

Dla własnego wdrożenia, w kontrolowanym terminie:

```sh
npm run load-test -- --url https://adres-twojego-serwera --rooms 3 --duration 60 --output dist/reports/vps.json
```

Wymagany aktualny backend z `/metrics` w schemacie 2. Wariant z URL tworzy prawdziwy
ruch i pokoje na wskazanym serwerze; metryki procesu obejmą też innych użytkowników.
Pełne lokalne raporty JSON są w `dist/reports/`; katalog jest ignorowany przez Git.
