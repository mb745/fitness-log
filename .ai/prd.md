# Dokument wymagań produktu (PRD) - Fitness Log

## 1. Przegląd produktu

Aplikacja Fitness Log w wersji MVP umożliwia samodzielne planowanie treningów siłowych, rejestrowanie ich przebiegu oraz otrzymywanie sugestii dotyczących progresji. Docelowi użytkownicy to osoby z podstawowym doświadczeniem treningowym, które potrzebują prostego narzędzia do organizacji i monitorowania swoich postępów. MVP obejmuje: bibliotekę ćwiczeń z metadanymi, kreator planów treningowych połączony z kalendarzem, ekran aktywnego treningu z rejestracją wyników i stoperem, historię treningów oraz mechanizmy sugerowania progresji i alertu stagnacji. Wymagana jest podstawowa autoryzacja (rejestracja, logowanie) i profil użytkownika.

## 2. Problem użytkownika

Użytkownicy chcą konsekwentnie wykonywać treningi, ale tracą motywację z powodu źle dobranego planu treningowego. Aktualne rozwiązania dostarczają plany ćwiczeń, ale bez jasnych wskazówek, kiedy zwiększyć obciążenie lub zmienić ćwiczenie.

## 3. Wymagania funkcjonalne

1. Biblioteka ćwiczeń:
   1.1. Przechowywanie ćwiczeń z kategoryzacją po grupach i podgrupach mięśniowych.
   1.2. Wskazanie typu ćwiczenia (złożone, izolowane) oraz rekomendowanego zakresu powtórzeń.
   1.3. Wyszukiwanie i filtrowanie po nazwie, grupie mięśniowej i typie.
   1.4. Prezentacja podstawowych instrukcji wykonania.
2. Kreator planów treningowych:
   2.1. Dodawanie ćwiczeń z biblioteki do planu z określeniem liczby serii, zakresu powtórzeń i czasu przerwy między seriami.
   2.2. Manualne ustawianie kolejności ćwiczeń w ramach planu.
   2.3. Zapisywanie planu wraz z przypisaniem do konkretnych dni w kalendarzu. Plan można przypisać do konkretnych dni tygodnia, lub co konkretną ilość dni.
   2.4 Plan treningowy można edytować.
3. Kalendarz treningów:
   3.1. Widok miesięczny/tygodniowy z zaplanowanymi sesjami.
   3.2. Dostęp do szczegółów treningu po kliknięciu w pozycję kalendarza.
   3.3. Szybki podgląd najbliższego treningu na pulpicie użytkownika.
4. Ekran aktywnego treningu:
   4.1. Rozpoczynanie treningu z poziomu kalendarza i pulpitu.
   4.2. Rejestrowanie dla każdej serii liczby powtórzeń, ciężaru, statusu wykonania.
   4.3. Stoper odmierzający czas przerw z możliwością dodawania i odejmowania czasu przerwy, z interwałem po 30 sekund.
   4.4. Pasek postępu treningu w oparciu o liczbę zaplanowanych serii.
   4.5. Opcja oznaczenia treningu jako zakończony lub przerwany (anulowany).
5. Mechanizmy progresji:
   5.1. Sugestie zwiększenia powtórzeń przy pełnej realizacji planu.
   5.2. Sugestie zwiększenia ciężaru po osiągnięciu górnego zakresu powtórzeń.
   5.3. Alert stagnacji po czterech treningach bez zmiany wyników w danym ćwiczeniu.
   5.4. Modal z rekomendacjami progresji wyświetlany po zakończeniu treningu, z możliwością akceptacji lub odrzucenia.
6. Historia treningów:
   6.1. Lista lub kalendarz ukończonych sesji wraz z wynikami każdej serii.
7. Uwierzytelnianie i profil:
   7.1. Rejestracja konta z użyciem e-maila i hasła.
   7.2. Logowanie i wylogowanie.
   7.3. Reset hasła drogą e-mailową (jeśli okaże się konieczny w kolejnej iteracji; MVP może obejść reset poprzez kontakt manualny).
   7.4. Profil użytkownika z danymi: waga, wzrost, kontuzje/ograniczenia oraz edycja tych informacji.
8. Zarządzanie statusami treningów:
   8.1. Statusy Zaplanowany, W trakcie, Wykonany, Porzucony.
   8.2. Automatyczna zmiana statusu na W trakcie przy starcie, na Wykonany po zakończeniu, na Porzucony przy anulowaniu lub po przekroczeniu czasu (mechanizm do doprecyzowania).
9. Telemetria i analityka:
   9.1. Logowanie liczby użytkowników wykonujących więcej niż jeden trening.
   9.2. Logowanie statusów treningów w celu liczenia odsetka ukończonych sesji.
10. Użyteczność:
    10.1. Interfejs responsywny na urządzenia mobilne i desktopowe.
    10.2. Lokalizacja językowa (polski jako domyślna).
    10.3. Dostępność stoperów i przycisków z zachowaniem zasad dostępności (ARIA).

## 4. Granice produktu

1. Zakres MVP nie obejmuje:
   1.1. Automatycznego kreatora planów treningowych na podstawie ankiety.
   1.2. Statystyk wizualnych (wykresów) postępu w czasie.
   1.3. Automatycznej oceny potreningowej poza prostym modalem z sugestiami.
   1.4. Powiadomień push, e-mailowych ani SMS-owych o treningach.
   1.5. Multimedialnych materiałów instruktażowych (animacje, wideo).
2. Zależności i pytania otwarte:
   2.1. Mechanizm oznaczania sesji jako Porzucony wymaga decyzji o zadaniach CRON/workerach.
   2.2. Workflow utrzymania bazy ćwiczeń musi zostać ustalony (manualna aktualizacja przez zespół produktowy lub panel admina poza MVP).
   2.3. Kolejność ćwiczeń ustalana manualnie; brak auto-sortowania w MVP.
   2.4. Brak potwierdzenia ograniczeń technicznych (np. limitów Supabase); wymagany warsztat discovery.
3. Wymogi niefunkcjonalne:
   3.1. Przechowywanie danych użytkowników zgodne z RODO.
   3.2. Dostępność offline nie jest wspierana.
   3.3. Wydajność: ładowanie kluczowych widoków <2 sekundy przy typowym połączeniu mobilnym.

## 5. Historyjki użytkowników

US-001 Rejestracja konta  
Opis: Jako nowy użytkownik chcę założyć konto przez e-mail i hasło, aby zapisywać swoje treningi.  
Kryteria akceptacji:

1. Formularz wymaga unikalnego e-maila i hasła spełniającego zasady bezpieczeństwa.
2. Po poprawnym wypełnieniu tworzony jest profil użytkownika i następuje automatyczne logowanie.
3. System waliduje błędne dane i wyświetla komunikaty o błędach.

US-002 Logowanie  
Opis: Jako zarejestrowany użytkownik chcę logować się do aplikacji, aby mieć dostęp do swoich planów.  
Kryteria akceptacji:

1. Formularz akceptuje e-mail i hasło.
2. Niepoprawne dane zwracają komunikat o błędzie bez ujawniania, które pole jest błędne.
3. Po zalogowaniu użytkownik trafia na pulpit z najbliższym treningiem i kalendarzem.
4. Sesja wygasa po zdefiniowanym czasie bezczynności.

US-003 Wylogowanie  
Opis: Jako użytkownik chcę móc się wylogować, aby zabezpieczyć swoje dane na wspólnym urządzeniu.  
Kryteria akceptacji:

1. Wylogowanie jest dostępne z menu profilu.
2. Po wylogowaniu sesja jest unieważniana, a użytkownik trafia na ekran logowania.

US-004 Podgląd biblioteki ćwiczeń  
Opis: Jako użytkownik chcę przeglądać i wyszukiwać ćwiczenia, aby dobrać je do planu.  
Kryteria akceptacji:

1. Widok biblioteki wyświetla grupy mięśniowe i podgrupy.
2. Dostępne są filtry po grupie, podgrupie, typie ćwiczenia i wyszukiwarka po nazwie.
3. Każde ćwiczenie zawiera typ, zakres powtórzeń i instrukcję.
4. Wyniki aktualizują się bez przeładowania strony.

US-005 Tworzenie planu treningowego  
Opis: Jako zalogowany użytkownik chcę stworzyć plan treningowy wybierając ćwiczenia i parametry, aby przygotować trening.  
Kryteria akceptacji:

1. Użytkownik może dodać wiele ćwiczeń z biblioteki do planu.
2. Każdemu ćwiczeniu można przypisać liczbę serii, zakres powtórzeń i czas przerwy.
3. Kolejność ćwiczeń jest edytowalna metodą przeciągnij i upuść lub przy użyciu strzałek.
4. Plan można zapisać pod nazwą i przypisać do konkretnych dni tygodnia w kalendarzu lub co określoną liczbę dni.
5. System waliduje brak wymaganych danych.

US-006 Edycja planu treningowego  
Opis: Jako użytkownik chcę edytować istniejący plan, aby dostosować go do postępów.  
Kryteria akceptacji:

1. Użytkownik może modyfikować parametry ćwiczeń i kolejność.
2. Zmiany zapisują się w planie i aktualizują widoki kalendarza.
3. Użytkownik może usunąć ćwiczenie z planu.
4. Użytkownik może edytować tylko swoje plany treningowe

US-007 Przegląd kalendarza treningów  
Opis: Jako zalogowany użytkownik chcę widzieć swoje zaplanowane treningi na kalendarzu, aby planować czas.  
Kryteria akceptacji:

1. Widok kalendarza pokazuje treningi w układzie tygodniowym lub miesięcznym.
2. Kliknięcie w trening otwiera szczegóły z listą ćwiczeń.
3. Kalendarz aktualizuje status treningu (Zaplanowany, W trakcie, Wykonany, Porzucony).
4. Kalendarz pokazuje informacje o anulowanych sesjach dla przejrzystości historii.
5. Użytkownik widzi tylko swoje treningi

US-008 Pulpit z najbliższym treningiem  
Opis: Jako zalogowany użytkownik chcę na pulpicie widzieć najbliższy trening, aby szybko rozpocząć.  
Kryteria akceptacji:

1. Pulpit pokazuje datę, godzinę i skrócone informacje o planie.
2. Dostępne są akcje Rozpocznij trening oraz Otwórz plan.
3. Po ukończeniu lub anulowaniu treningu pulpit aktualizuje się automatycznie.
4. Użytkownik widzi tylko swoje treningi

US-009 Rozpoczęcie treningu  
Opis: Jako użytkownik chcę rozpocząć zaplanowany trening z kalendarza lub pulpitu, aby przejść do widoku aktywnego treningu.  
Kryteria akceptacji:

1. Rozpoczęcie ustawia status treningu na W trakcie.
2. Użytkownik trafia na ekran aktywnego treningu z listą ćwiczeń i serii.
3. System zapisuje czas startu treningu.

US-010 Rejestrowanie serii  
Opis: Jako użytkownik chcę zaznaczać wykonanie serii, wprowadzać powtórzenia i ciężary, aby mieć dokładny dziennik.  
Kryteria akceptacji:

1. Każda seria ma pola liczby powtórzeń i ciężaru z walidacją, które można edytowć podczas treningu.
2. Użytkownik może oznaczyć serię jako pominiętą lub zakończoną.
3. Zmiana wartości automatycznie zapisuje się w dzienniku.

US-011 Timer przerw  
Opis: Jako użytkownik chcę korzystać ze stopera odliczającego przerwy, aby kontrolować czas odpoczynku.  
Kryteria akceptacji:

1. Po oznaczeniu serii jako zakończonej stoper rozpoczyna odliczanie rekomendowanej przerwy.
2. Użytkownik może pomijać lub zmienić długość przerwy.
3. Upłynięcie czasu sygnalizowane jest wizualnie i dźwiękowo (opcjonalnie).
4. Stoper działa niezależnie dla każdej serii.
5. Stoper nie wyświetla się po ostatniej serii w planie.

US-012 Pasek postępu treningu  
Opis: Jako użytkownik chcę widzieć pasek postępu, aby monitorować ile serii zostało.  
Kryteria akceptacji:

1. Pasek postępu aktualizuje się po oznaczeniu każdej serii.
2. Ukończenie wszystkich serii ustawia pasek na 100%.
3. Pasek wizualnie różnicuje ukończone, bieżące i nadchodzące ćwiczenia.

US-013 Zakończenie treningu  
Opis: Jako użytkownik chcę zakończyć trening i zobaczyć podsumowanie, aby zatwierdzić wykonanie.  
Kryteria akceptacji:

1. Zakończenie treningu wymaga potwierdzenia.
2. Status sesji zmienia się na Wykonany, a czas zakończenia jest rejestrowany.
3. Użytkownik widzi modal z podsumowaniem wyników i rekomendacjami progresji.
4. W przypadku niedokończenia wszystkich serii użytkownik może zdecydować o oznaczeniu jako Porzucony.

US-014 Anulowanie treningu  
Opis: Jako użytkownik chcę móc anulować trening w trakcie, jeśli nie mogę go ukończyć.  
Kryteria akceptacji:

1. Dostępna jest akcja Anuluj z potwierdzeniem.
2. Status treningu zmienia się na Porzucony.
3. Kalendarz i historia pokazują anulowaną sesję z odpowiednim statusem.

US-015 Sugestie progresji  
Opis: Jako użytkownik chcę otrzymywać sugestie zwiększenia obciążenia lub powtórzeń, aby skutecznie progresować.  
Kryteria akceptacji:

1. Jeżeli wszystkie serie w planie osiągnęły minimum powtórzeń, sugerowane jest zwiększenie powtórzeń w kolejnym treningu.
2. Jeżeli osiągnięto maksimum powtórzeń, sugerowane jest zwiększenie ciężaru.
3. Modal pozwala zaakceptować proponowaną zmianę lub ją odrzucić.
4. Modal pozwala wyłączyć sugestie progresji czasowo lub bezterminowo.
5. Akceptacja aktualizuje plan lub kolejny trening zgodnie z sugestią.

US-016 Alert stagnacji  
Opis: Jako użytkownik chcę otrzymać informację o stagnacji w ćwiczeniu, aby wprowadzić zmiany.  
Kryteria akceptacji:

1. System analizuje pięć ostatnich treningów dla ćwiczenia.
2. Brak poprawy wyników generuje alert na pulpicie i w historii ćwiczenia.
3. Alert proponuje alternatywne działania (zmiana ciężaru, powtórzeń lub ćwiczenia).
4. Modal pozwala zaakceptować proponowaną zmianę lub ją odrzucić.
5. Modal pozwala wyłączyć alert stagnacji czasowo lub bezterminowo.

US-017 Historia treningów  
Opis: Jako użytkownik chcę przeglądać historię treningów wraz ze szczegółami, aby śledzić postępy.  
Kryteria akceptacji:

1. Widok historii pokazuje listę zakończonych i porzuconych treningów.
2. Każdy wpis zawiera datę, plan, status, czas trwania oraz zarejestrowane serie.
3. Dostępne są filtry po planie, grupie mięśniowej i statusie.
4. Dane można eksportować do CSV w kolejnej iteracji (poza zakresem MVP).

US-018 Edycja profilu  
Opis: Jako użytkownik chcę edytować dane profilu, aby aplikacja uwzględniała moje ograniczenia.  
Kryteria akceptacji:

1. Profil przechowuje wagę, wzrost, płeć, kontuzje/ograniczenia.
2. Formularz waliduje zakresy (np. wzrost 100-250 cm).
3. Zapis zmian wymaga potwierdzenia i pokazuje toast sukcesu.

US-019 Bezpieczne przechowywanie sesji  
Opis: Jako użytkownik chcę mieć pewność, że moje dane treningowe są dostępne tylko po zalogowaniu.  
Kryteria akceptacji:

1. Widoki planów, kalendarza, treningu aktywnego i historii są dostępne wyłącznie dla zalogowanych użytkowników.
2. Próba wejścia bez autoryzacji przekierowuje na ekran logowania.
3. Dane są przechowywane w sposób zgodny z najlepszymi praktykami bezpieczeństwa (hasła hashowane, tokeny sesyjne).
4. Sesja wygasa po określonym czasie, co wymusza ponowne logowanie.

US-020 Monitorowanie metryk  
Opis: Jako menedżer produktu chcę monitorować liczbę użytkowników wykonujących więcej niż jeden trening i odsetek ukończonych sesji, aby ocenić sukces MVP.  
Kryteria akceptacji:

1. System rejestruje w analityce zdarzenia startu i zakończenia treningu wraz z identyfikatorem użytkownika.
2. Dostępny jest dashboard lub eksport surowych danych do analizy.
3. Metryki umożliwiają wyliczenie wartości 50% i 60% zdefiniowanych w kryteriach sukcesu.
4. Dane aktualizują się przynajmniej raz dziennie.

## 6. Metryki sukcesu

1. Retencja treningowa: co najmniej 50% zarejestrowanych użytkowników ma więcej niż jeden trening o statusie Wykonany w pierwszych czterech tygodniach od rejestracji. Dane zliczane poprzez identyfikację unikalnych użytkowników w logach sesji.
2. Skuteczność sesji: 60% treningów zmienia status z W trakcie na Wykonany. Analiza prowadzona cyklicznie (dziennie/tygodniowo).
3. Czas ukończenia sesji: średni czas rejestrowanego treningu mieszczący się w przedziale 30-90 minut, potwierdzający prawidłowe korzystanie z timera i flow.
