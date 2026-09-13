/*
 * Vencord, a modification for Discord's desktop app
 * Copyright (c) 2022 Vendicated and contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

/**
 * Russian strings for plugins, keyed by plugin name, then option id.
 * Missing entries fall back to English automatically, so this file can
 * grow incrementally without breaking anything.
 */
export interface RuOptionStrings {
    /** translated displayName */
    n?: string;
    /** translated description */
    d?: string;
    /** translated placeholder */
    p?: string;
    /** translated select option labels, keyed by option value */
    o?: Record<string, string>;
}

export interface RuPluginStrings {
    /** translated plugin description */
    d?: string;
    /** translated options, keyed by option id */
    o?: Record<string, RuOptionStrings>;
}

export const ruPlugins: Record<string, RuPluginStrings> = {
    // ---- fork plugins (noloverme) ----
    FakeBadges: {
        d: "Добавляет кастомный бейдж пользователю 1251559235360133140 и может локально показывать все бейджи Discord",
        o: {
            enableCustomBadge: { d: "Включить кастомный бейдж для пользователя 1251559235360133140" },
            enableAllBadges: { d: "Включить ВСЕ бейджи Discord локально (Hypesquad, Staff, Partner, BugHunter, EarlySupporter, VerifiedDev, ActiveDev и др.) — видно только вам" },
        },
    },
    DevToolsHotkey: {
        d: "Открывает DevTools по Ctrl+Shift+C (настраиваемые Ctrl+Shift+I и F12)",
        o: {
            ctrlShiftI: { d: "Включить хоткей Ctrl+Shift+I" },
            f12: { d: "Включить хоткей F12" },
        },
    },
    QuestRunner: {
        d: "Добавляет кнопку «Выполнить задания» с логами для авторана квестов",
    },

    // ---- popular upstream plugins, descriptions ----
    AlwaysAnimate: { d: "Анимирует всё, что можно анимировать" },
    AlwaysExpandRoles: { d: "Всегда разворачивает список ролей в попапах профиля" },
    AlwaysTrust: { d: "Убирает надоедливый попап о недоверенных доменах и подозрительных файлах" },
    AnonymiseFileNames: { d: "Анонимизирует имена загружаемых файлов" },
    BetterFolders: { d: "Показывает папки серверов на отдельной панели и улучшает работу с папками" },
    BetterGifPicker: { d: "Открывает GIF-пикер сразу на категории избранного" },
    BetterRoleDot: { d: "Копирование цвета роли по клику на точку роли. Можно использовать точку и цветные ники одновременно" },
    BetterSessions: { d: "Улучшает меню сессий (устройств): точные метки времени, свои имена, уведомления о входах" },
    BetterSettings: { d: "Улучшает опыт открытия меню настроек" },
    BetterUploadButton: { d: "Загрузка в один клик, меню — по правому клику" },
    BiggerStreamPreview: { d: "Позволяет увеличивать превью стримов" },
    BlurNSFW: { d: "Блюрит вложения в NSFW-каналах до наведения" },
    CallTimer: { d: "Добавляет таймер в голосовые" },
    CharacterCounter: { d: "Добавляет счётчик символов в поле ввода" },
    ClearURLs: { d: "Автоматически вырезает трекинг из отправляемых ссылок" },
    ClientTheme: { d: "Возвращает старый эксперимент с темой клиента. Добавьте цвет в тему клиента Discord" },
    ColorSighted: { d: "Убирает дальтонико-дружелюбные иконки у статусов, как в Discord 2015–2017" },
    ConsoleJanitor: { d: "Отключает надоедливые сообщения/ошибки в консоли" },
    ConsoleShortcuts: { d: "Короткие алиасы для многого в window. Список: `shortcutList`" },
    CopyEmojiMarkdown: { d: "Позволяет копировать эмодзи форматированной строкой" },
    CopyFileContents: { d: "Добавляет кнопку копирования содержимого к текстовым вложениям" },
    CrashHandler: { d: "Служебный плагин: обработка и возможное восстановление после крашей без перезапуска" },
    CustomRPC: { d: "Полностью настраиваемый Rich Presence (статус игры) в профиле" },
    Decor: { d: "Создавайте и используйте свои декорации аватара или выбирайте из пресетов" },
    DisableCallIdle: { d: "Отключает выкидывание из ЛС-звонка через 3 минуты и перенос в AFK-канал" },
    DontRoundMyTimestamps: { d: "Всегда округляет относительные метки вниз: 7.6г станет 7г, а не 8г" },
    Experiments: { d: "Доступ к экспериментам и другим dev-функциям Discord!" },
    ExpressionCloner: { d: "Клонирует эмодзи и стикеры на свой сервер (правый клик)" },
    FakeNitro: { d: "Фейковые эмодзи/стикеры, nitro-темы и nitro-качество стрима" },
    FixImagesQuality: { d: "Улучшает качество картинок, загружая их в исходном разрешении" },
    FixSpotifyEmbeds: { d: "Чинит оглушительные Spotify-эмбеды: настраиваемая громкость" },
    FixYoutubeEmbeds: { d: "Обходит блокировку YouTube-видео в Discord" },
    ForceOwnerCrown: { d: "Показывать корону владельца рядом с никами даже на больших серверах" },
    FriendInvites: { d: "Создание и управление ссылками-приглашениями друзей через слэш-команды" },
    GameActivityToggle: { d: "Кнопка переключения игровой активности рядом с микрофоном. Правый клик — Spotify" },
    GifPaste: { d: "Выбор GIF вставляет ссылку в чат вместо мгновенной отправки" },
    HideMedia: { d: "Скрывает вложения и эмбеды отдельных сообщений по кнопке при наведении" },
    IgnoreActivities: { d: "Скрывает активности только из вашего статуса. Можно настроить какие именно" },
    ImageFilename: { d: "Показывает имя файла картинок и GIF в подсказке при наведении" },
    ImageZoom: { d: "Зум картинок и GIF: колесо — зум, shift + колесо — размер лупы" },
    IrcColors: { d: "Уникальные цвета ников в чате, как в IRC-клиентах" },
    KeepCurrentChannel: { d: "Возвращает в канал, где вы были до смены аккаунта или загрузки Discord" },
    LoadingQuotes: { d: "Заменяет загрузочные цитаты Discord" },
    MemberCount: { d: "Показывает онлайн/всего участников и голосовые в списке участников" },
    MentionAvatars: { d: "Показывает аватары и иконки ролей внутри упоминаний" },
    MessageClickActions: { d: "Backspace + клик — удалить, двойной клик — редактировать/ответить" },
    MessageLinkEmbeds: { d: "Превью сообщений, на которые ссылаются" },
    MessageLogger: { d: "Временно логирует удалённые и отредактированные сообщения" },
    MoreQuickReactions: { d: "Больше реакций в быстром меню при наведении" },
    MutualGroupDMs: { d: "Показывает общие групповые ЛС в профилях" },
    NewGuildSettings: { d: "Автомут новых серверов и другие настройки при входе" },
    NoBlockedMessages: { d: "Полностью скрывает сообщения заблокированных из чата" },
    NoDevtoolsWarning: { d: "Отключает предупреждение DevTools" },
    NoF1: { d: "Отключает бинд помощи F1" },
    NoReplyMention: { d: "Отключает пинги в ответах по умолчанию" },
    NoTypingAnimation: { d: "Отключает ресурсоёмкую анимацию «печатает...»" },
    NoUnblockToJump: { d: "Переход к сообщениям заблокированных без разблокировки" },
    OnePingPerDM: { d: "Один пинг на пользователя в ЛС при нескольких непрочитанных" },
    OpenInApp: { d: "Открывает ссылки в их приложениях вместо браузера" },
    PermissionFreeWill: { d: "Отключает клиентские ограничения управления правами каналов" },
    PermissionsViewer: { d: "Просмотр прав пользователя/канала и ролей сервера" },
    PetPet: { d: "Слэш-команда /petpet: headpet-гифки из любой картинки" },
    PictureInPicture: { d: "Картинка-в-картинке для видео (рядом с кнопкой скачивания)" },
    PinDMs: { d: "Закрепляет ЛС вверху списка. Закреп/порядок — правым кликом" },
    PlatformIndicators: { d: "Индикаторы платформы (десктоп, мобильный, веб...) у пользователей" },
    PreviewMessage: { d: "Предпросмотр сообщения перед отправкой" },
    QuickMention: { d: "Кнопка быстрого упоминания в панели действий сообщения" },
    QuickReply: { d: "Ответ (ctrl+вверх/вниз) и редактирование (ctrl+shift+вверх/вниз) хоткеями" },
    ReadAllNotificationsButton: { d: "Прочитать все уведомления серверов одной кнопкой!" },
    RelationshipNotifier: { d: "Уведомляет, когда друг, чат или сервер вас удаляет" },
    ReplaceGoogleSearch: { d: "Заменяет Google-поиск другим движком" },
    ReplyTimestamp: { d: "Показывает время в превью ответов" },
    RevealAllSpoilers: { d: "Раскрыть все спойлеры: Ctrl+клик по спойлеру или Ctrl+Shift+клик в чате" },
    ReverseImageSearch: { d: "Поиск по картинке в контекстных меню изображений" },
    ReviewDB: { d: "Отзывы о пользователях (добавляет настройки в профили)" },
    RoleColorEverywhere: { d: "Цвет топ-роли везде, где возможно" },
    SendTimestamps: { d: "Лёгкая отправка таймстампов: кнопка и сокращения. Читайте расширенное описание!" },
    ServerInfo: { d: "Просмотр информации о сервере" },
    ServerListIndicators: { d: "Счётчик друзей онлайн / серверов в списке серверов" },
    ShikiCodeblocks: { d: "Кодблоки в стиле VSCode на движке Shiki" },
    ShowConnections: { d: "Подключённые аккаунты в попапах пользователей" },
    ShowHiddenChannels: { d: "Показывает каналы, к которым нет доступа" },
    ShowMeYourName: { d: "Юзернеймы рядом с никами или вообще без ников" },
    ShowTimeoutDuration: { d: "Показывает, сколько осталось мута пользователя" },
    SilentMessageToggle: { d: "Кнопка тихой отправки в панели чата" },
    SilentTyping: { d: "Скрывает индикатор «печатает»" },
    SpotifyControls: { d: "Плеер Spotify над панелью аккаунта" },
    SpotifyCrack: { d: "Бесплатный listen along, без автопаузы в войсе, активность при idle" },
    SpotifyShareCommands: { d: "Делитесь треком/альбомом/артистом Spotify слэш-командами" },
    StickerPaste: { d: "Выбор стикера вставляет его в чат вместо мгновенной отправки" },
    StreamerModeOnStream: { d: "Автовключение режима стримера при начале стрима в Discord" },
    TextReplace: { d: "Замена текста в сообщениях. Готовые правила — в канале #textreplace-rules в Vencord" },
    Translate: { d: "Перевод сообщений: Google Translate, DeepL или Kagi" },
    TypingIndicator: { d: "Индикатор печатающих на канале" },
    TypingTweaks: { d: "Аватары и цвета ролей в индикаторе печати" },
    Unindent: { d: "Убирает leading-отступы в кодблоках" },
    UnsuppressEmbeds: { d: "Разрешает разворачивать свёрнутые эмбеды" },
    UserVoiceShow: { d: "Индикатор, когда пользователь в голосовом" },
    USRBG: { d: "Баннеры USRBG: баннер без Nitro для всех" },
    VoiceChatDoubleClick: { d: "Вход в войс по двойному клику вместо одинарного" },
    VcNarrator: { d: "Озвучивает вход/выход/перемещение по войсам" },
    VencordToolbox: { d: "Кнопка быстрых действий Vencord в заголовке окна" },
    ViewIcons: { d: "Кликабельные аватары/баннеры в профилях, пункты просмотра в меню" },
    ViewRaw: { d: "Копирование и просмотр сырого содержимого сообщений/каналов/серверов" },
    VoiceDownload: { d: "Скачивание голосовых сообщений (открывает вкладку)" },
    VoiceMessages: { d: "Голосовые сообщения как на мобиле: правый клик по загрузке" },
    VolumeBooster: { d: "Громкость пользователей и стримов выше максимума" },
    WhoReacted: { d: "Аватары отреагировавших на сообщение" },
    XSOverlay: { d: "Пересылает уведомления Discord в XSOverlay для VR" },
    YoutubeAdblock: { d: "Блокирует рекламу в YouTube-эмбедах и WatchTogether через AdGuard" },
    ValidReply: { d: "Чинит отображение ответов на удалённые сообщения" },
    ValidUser: { d: "Чинит упоминания неизвестных пользователей" },

    // ---- batch 2: remaining plugins ----
    AccountPanelServerProfile: { d: "Правый клик по панели аккаунта слева внизу — профиль на текущем сервере" },
    AppleMusicRichPresence: { d: "Rich Presence для вашего Apple Music!" },
    "WebRichPresence (arRPC)": { d: "Клиентский плагин arRPC для RPC в веб-Discord (экспериментально)" },
    AutoDNDWhilePlaying: { d: "Автоменяет статус (online/idle/dnd) при запуске игр" },
    BetterGifAltText: { d: "Меняет alt-текст GIF с просто «GIF» на теги/имя файла" },
    BetterRoleContext: { d: "Копирование цвета роли, редактирование, иконка роли по правому клику в профиле" },
    CopyStickerLinks: { d: "Копирование и открытие ссылок на стикеры" },
    CopyUserURLs: { d: "Пункт «Копировать ссылку на пользователя» в контекстном меню" },
    CustomCommands: { d: "Создание своих слэш-команд / тегов" },
    CustomIdle: { d: "Время до idle-статуса Discord (или отключение авто-idle)" },
    Dearrow: { d: "Менее кликбейтные заголовки и превью YouTube-эмбедов, на движке Dearrow" },
    DevCompanion: { d: "Плагин-помощник разработчика" },
    F8Break: { d: "Пауза клиента по F8 при открытых DevTools (+ breakpoints)" },
    FakeProfileThemes: { d: "Темы профиля через скрытые цвета в био (невидимая 3y3-кодировка)" },
    FavoriteEmojiFirst: { d: "Любимые эмодзи первыми в автодополнении" },
    FixCodeblockGap: { d: "Убирает отступ между кодблоками и текстом под ними" },
    FullSearchContext: { d: "Полное контекстное меню сообщений в результатах поиска" },
    FullUserInChatbox: { d: "Больше действий с упоминанием в чате: левый/правый клик" },
    GreetStickerPicker: { d: "Любой приветственный стикер вместо случайного (правый клик по «Wave to say hi!»)" },
    MessageLatency: { d: "Индикатор сообщений, отправлявшихся ≥n секунд" },
    MusicRichPresence: { d: "Rich Presence для Last.FM/Listenbrainz" },
    DisableDeepLinks: { d: "Отключает диплинки Discord" },
    NoMaskedUrlPaste: { d: "Вставка ссылки при выделенном тексте не станет masked-URL" },
    NoMiddleClickPaste: { d: "Отключает вставку средней кнопкой в Linux — только Linux" },
    NoMosaic: { d: "Убирает мозаику изображений Discord" },
    NoOnboardingDelay: { d: "Пропускает медленную задержку онбординга" },
    NoPendingCount: { d: "Убирает счётчик входящих заявок, запросов и nitro-предложений" },
    NoProfileThemes: { d: "Полностью убирает nitro-темы профилей у всех, кроме себя" },
    NoServerEmojis: { d: "Не показывать серверные эмодзи в автодополнении" },
    NoSystemBadge: { d: "Отключает бейдж непрочитанных на панели задач и в трее" },
    NotificationVolume: { d: "Отдельная громкость уведомлений и звуков: берегите уши" },
    oneko: { d: "Котик следует за курсором (настоящий)" },
    OverrideForumDefaults: { d: "Переопределение раскладки/сортировки форума по умолчанию (можно менять на канал)" },
    PauseInvitesForever: { d: "Возвращает паузу инвайтов навсегда, которую убрал Discord" },
    PlainFolderIcon: { d: "Не показывать маленькие иконки серверов в папках" },
    SecretRingToneEnabler: { d: "Всегда секретная версия рингтона Discord (кроме особых событий)" },
    Summaries: { d: "Включает саммари Discord" },
    ShowAllMessageButtons: { d: "Всегда показывать все кнопки сообщений без Shift" },
    ShowHiddenThings: { d: "Показывает скрытое и модераторское вне зависимости от прав" },
    SortFriendRequests: { d: "Сортирует заявки в друзья по дате получения" },
    StartupTimings: { d: "Тайминги запуска в меню настроек" },
    SuperReactionTweaks: { d: "Лимит одновременно играющих супер-реакций и супер-реакт по умолчанию" },
    TenorGifSearch: { d: "Возвращает поиск Tenor GIF" },
    ThemeAttributes: { d: "Data-атрибуты элементов для темизации" },
    UnlockedAvatarZoom: { d: "Больший зум в кропе при смене аватара" },
    UserMessagesPronouns: { d: "Местоимения в сообщениях чата" },
    WebContextMenus: { d: "Возвращает контекстные меню в веб-версии: ссылки, картинки, текстовые поля" },
    WebKeybinds: { d: "Возвращает хоткеи веб-версии. Полностью — только в Vesktop/Legcord" },
    WebPWA: { d: "Делает Discord устанавливаемым приложением (PWA): бейджи, хоткеи" },
    WebScreenShare: { d: "Меню шаринга экрана: разрешение, FPS, кодек, системный звук" },
    WebScreenShareFixes: { d: "Убирает лимит 2500kbps в Chromium/Vesktop и рост CPU при шаринге" },
};
