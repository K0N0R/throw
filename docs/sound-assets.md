# Lista dźwięków do przygotowania

Lista bazuje na obecnych mechanikach gry: strzałach, kolizjach, golach, energii, boostach, meczach online i lobby. Poniższe tabele priorytetów zachowują pierwotny plan; aktualne pliki MP3 znajdują się w `frontend/assets/sounds/` i są podpięte do gry według mapowania poniżej.

## Podpięte pliki

| Plik MP3                            | Zastosowanie                                                                                   |
| ----------------------------------- | ---------------------------------------------------------------------------------------------- |
| `soccer-kick`, `soccer-strong-kick` | Strzał; wariant zależy od prędkości piłki po kopnięciu, nie od osobnego trybu strzału.         |
| `ball-bounce-1` do `ball-bounce-10` | Naprzemienne warianty odbić wykrywanych po zmianie prędkości piłki, maksymalnie raz na 100 ms. |
| `goal-celebration`                  | Zwiększenie wyniku, bez powtórzeń dla kolejnych snapshotów.                                    |
| `start`                             | Start meczu, wznowienie po golu lub reset akcji.                                               |
| `end`                               | Zakończenie meczu w pokoju.                                                                    |
| `ping`                              | Ostatnie 5 sekund meczu w pokoju.                                                              |
| `booster`                           | Jednorazowy dźwięk podniesienia energii przez własnego gracza.                                 |
| `speeding`                          | Pętla podczas aktywnego przyspieszenia własnego gracza.                                        |
| `match-ambient`                     | Zapętlone tło meczu, wyłączane po jego zakończeniu lub wyjściu do lobby.                       |
| `message-notification-1`            | Nowa wiadomość innego nicku, bez odtwarzania historii przy wejściu.                            |
| `ui-confirm`                        | Kliknięcia przycisków i dołączenie uczestnika do pokoju.                                       |
| `ui-open`, `ui-close`               | Wejście/wyjście z pokoju i otwieranie/zamykanie paneli.                                        |
| `ui-hide`                           | Zatrzymanie meczu lub opuszczenie pokoju przez uczestnika.                                     |

Ikona dźwięku w lewym górnym rogu otwiera osobne suwaki efektów i ambientu w panelu rozwijanym poniżej przycisku. Wartość 0 wycisza daną kategorię; ustawienia są zapisywane lokalnie. Nowe instalacje zaczynają z efektami na 65% i ambientem na 20%; wcześniejsze zapisane ustawienia pozostają zachowane. Przeglądarka może wymagać pierwszego kliknięcia przed odtworzeniem audio. Ukrycie karty wstrzymuje dźwięki.

## Priorytet 1: podstawowa rozgrywka

| Nazwa pliku         | Zdarzenie                                   | Wskazówki                                                                                                                       |
| ------------------- | ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `kick-soft.ogg`     | Lekki strzał piłki przez gracza             | Krótki, sprężysty impuls; przygotować warianty wysokości tonu lub 2–3 wersje, żeby powtarzane strzały nie brzmiały identycznie. |
| `kick-hard.ogg`     | Mocny strzał piłki                          | Wyraźniejszy, cięższy atak niż przy lekkim strzale; bez długiego ogona.                                                         |
| `ball-impact.ogg`   | Odbicie piłki od ściany, bandy lub gracza   | Krótki, neutralny kontakt. Dobrze przygotować kilka wariantów do losowego wyboru.                                               |
| `goal.ogg`          | Gol                                         | Czytelny sygnał celebracyjny, który nie zagłuszy krótkiego okna gry po golu.                                                    |
| `kickoff.ogg`       | Rozpoczęcie nowej akcji po golu lub resecie | Krótki sygnał startu, odróżnialny od dźwięku gola.                                                                              |
| `energy-pickup.ogg` | Zebranie punktu energii                     | Jasny, krótki sygnał potwierdzający zebranie.                                                                                   |
| `boost-loop.ogg`    | Aktywny boost                               | Zapętlony, dyskretny dźwięk; powinien kończyć się natychmiast po wyłączeniu boostu.                                             |

## Priorytet 2: przebieg meczu

| Nazwa pliku          | Zdarzenie                                    | Wskazówki                                                                                                                                                |
| -------------------- | -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `match-start.ogg`    | Start meczu                                  | Krótki sygnał rozpoczęcia, najlepiej z narastającym odliczaniem przygotowanym jako osobne krótkie dźwięki tylko wtedy, gdy będzie potrzebne w projekcie. |
| `match-end.ogg`      | Koniec meczu                                 | Sygnał neutralny; wynik i zwycięzcę można rozróżnić osobno dla wygranej, porażki i remisu, jeśli testy wykażą taką potrzebę.                             |
| `countdown-tick.ogg` | Ostatnie sekundy meczu lub odliczanie startu | Krótkie, dobrze słyszalne tyknięcie; wymaga decyzji, czy gra ma takie odliczanie.                                                                        |

## Priorytet 3: lobby i interfejs

| Nazwa pliku        | Zdarzenie                                            | Wskazówki                                                            |
| ------------------ | ---------------------------------------------------- | -------------------------------------------------------------------- |
| `ui-confirm.ogg`   | Potwierdzenie, np. dołączenie do pokoju lub gotowość | Krótki i subtelny.                                                   |
| `ui-back.ogg`      | Powrót lub anulowanie                                | Cichszy i niższy niż potwierdzenie.                                  |
| `player-join.ogg`  | Gracz dołącza do pokoju                              | Dyskretny sygnał; nie odtwarzać go dla każdej aktualizacji listy.    |
| `player-leave.ogg` | Gracz opuszcza pokój                                 | Krótki, neutralny sygnał.                                            |
| `chat-message.ogg` | Nowa wiadomość na czacie                             | Cichy; nie odtwarzać dla wiadomości wysłanej przez lokalnego gracza. |

## Muzyka

| Nazwa pliku             | Zastosowanie         | Wskazówki                                                                                 |
| ----------------------- | -------------------- | ----------------------------------------------------------------------------------------- |
| `music-lobby.ogg`       | Pętla lobby i pokoju | Spokojna, niekolidująca z czytaniem czatu; przygotować płynne zapętlenie.                 |
| `music-gameplay-01.ogg` | Tło meczu            | Energetyczna, ale nieprzeszkadzająca w usłyszeniu efektów; przygotować płynne zapętlenie. |

Dodatkowe utwory meczu można dodać później jako `music-gameplay-02.ogg` itd. Obecny menedżer muzyki przewiduje osobne listy dla lobby i rozgrywki.

## Przygotowanie plików

- Aktualne pliki znajdują się w `frontend/assets/sounds/`; pierwotne nazwy `.ogg` w tabelach powyżej są propozycjami, nie wymaganymi nazwami istniejących assetów.
- `SoundManager` obsługuje jawne rozszerzenia `.mp3`, `.ogg`, `.m4a` i `.wav`; dostępność dekodera zależy od przeglądarki.
- Eksportować efekty krótkimi, bez zbędnej ciszy na początku i końcu. Dźwięki pętli powinny mieć czyste przejście między końcem a początkiem.
- Zachować zapas głośności: ważne sygnały meczu powinny być czytelne bez nieoczekiwanych skoków względem muzyki.
- Build generuje `frontend/preload-config.json` z zawartości folderu assets, również jego podfolderów.
- Przy wdrożeniu efektów ograniczyć częste zdarzenia, zwłaszcza kolizje, aby wiele jednoczesnych odtworzeń nie tworzyło hałasu.
