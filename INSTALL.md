# Vencord Plus — Установка

Форк: https://github.com/noloverme/Vencord-plus

Включает:
- **DevToolsHotkey** (`src/plugins/devtoolsHotkey/index.ts:19`) — `Ctrl+Shift+C` (всегда), опционально `Ctrl+Shift+I` и `F12` (настройки)
- **FakeBadges** (`src/plugins/fakeBadges/index.tsx:19`) — кастом `Великий долбаеб` для `1251559235360133140` + все бейджи локально
- **QuestRunner** (`src/plugins/questRunner/index.tsx:19`) — плавающая кнопка `Выполнить задачи` + модалка логов

## Быстрая установка (из исходников, без установщика)

1. Установи Node.js >=22 и pnpm 11.9.0: `corepack enable; corepack prepare pnpm@11.9.0 --activate`
2. Клонируй:
   ```powershell
   git clone https://github.com/noloverme/Vencord-plus.git
   cd Vencord-plus
   ```
3. Собери (важно: `buildStandalone`, иначе проверка обновлений будет искать `.git` и падать с `fatal: not a git repository`):
   ```powershell
   pnpm install
   pnpm buildStandalone
   ```
4. Внедри в Discord (закрый Discord полностью перед этим, запускай от Админа):
   ```powershell
   pnpm inject
   # выбери Stable / PTB / Canary
   ```
   `pnpm inject` = `node scripts/runInstaller.mjs -- --install` с `VENCORD_DEV_INSTALL=1` — качает только `VencordInstallerCli.exe` (~6MB) в `dist/Installer/`, а ставит файлы из твоего `dist/` (`renderer.js`, `patcher.js`, `vencordDesktopMain.js`), не с релиза Vendicated.

   Если `VencordInstallerCli.exe` блокируется SmartScreen:
   ```powershell
   Copy-Item -Path ".\dist\*" -Destination "$env:APPDATA\Vencord\dist\" -Recurse -Force
   # Discord уже пропатчен в %LOCALAPPDATA%\Discord\app-*\resources\app.asar -> C:\Users\...\AppData\Roaming\Vencord\dist\patcher.js
   ```

5. Запусти Discord: `Update.exe --processStart Discord.exe`
6. Включи плагины: `Настройки -> Vencord -> Plugins -> DevToolsHotkey / FakeBadges / QuestRunner`

Удалить: `pnpm uninject`

## Обновление после изменения плагина

```powershell
pnpm buildStandalone
Copy-Item -Path ".\dist\*" -Destination "$env:APPDATA\Vencord\dist\" -Recurse -Force
# перезапусти Discord (или Ctrl+R)
```

## Можно ли сделать установщик?

Да. Варианты:

**1. Портативный установщик из форка (рекомендуется для друзей):**
- Собери релиз в GitHub: `git push` уже сделан в `noloverme/Vencord-plus:main` (commit 9872001b). Создай Release с тегом `v1.15.4-plus` и приложи `dist/` как артефакт.
- Собери `VencordInstaller` из https://github.com/Vendicated/VencordInstaller, поменяв `VENCORD_REPO = "noloverme/Vencord-plus"` в `installer/src/main.rs` (или `config.rs`), затем `cargo build --release` даст `VencordInstaller.exe` который будет качать твой релиз.

**2. Оффлайн установщик (без GitHub):**
- Раздай друзьям папку `dist/` + батник:
  ```bat
  @echo off
  xcopy /E /Y dist "%APPDATA%\Vencord\dist\"
  echo Перезапусти Discord
  pause
  ```

**3. Использовать официальный установщик с DEV-режимом:**
- Официальный `VencordInstaller.exe` всегда качает `Vendicated/Vencord` — для кастомного форка не подходит. Используй `pnpm inject` как выше.
