# EasySkriptFree

Darmowy edytor blokowy do Skript (.sk) na serwery Minecraft. Bez konta i licencji.

## Jak zrobić plik EasySkriptFree.exe przez GitHub

1. Załóż konto na github.com i kliknij **New repository** (nazwa np. `EasySkriptFree`, może być Public).
2. Rozpakuj ZIP-a na komputerze. W repozytorium kliknij **Add file → Upload files** i przeciągnij **zawartość** rozpakowanego folderu
   (pliki `package.json`, `main.js`, `preload.js`, foldery `src`, `build` i `.github`). Kliknij **Commit changes**.
   Jeśli folder `.github` się nie wgrał: **Add file → Create new file**, w nazwie wpisz `.github/workflows/build.yml` i wklej zawartość pliku.
3. Wejdź w zakładkę **Actions**. Budowanie startuje samo (trwa ok. 3-5 minut). Jeśli nie, wybierz **Build EXE → Run workflow**.
4. Gdy zrobi się zielony ptaszek, otwórz ten przebieg i na dole w **Artifacts** pobierz `EasySkriptFree` (ZIP z plikiem `EasySkriptFree.exe`).

Plik .exe jest "portable": uruchamiasz go dwuklikiem, bez instalacji.

## Uruchomienie lokalnie (opcjonalnie)

    npm install
    npm start        # podgląd aplikacji
    npm run dist     # buduje dist/EasySkriptFree.exe (na Windowsie)
