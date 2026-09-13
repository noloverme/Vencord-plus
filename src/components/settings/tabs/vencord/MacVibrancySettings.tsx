/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { useSettings } from "@api/Settings";
import ErrorBoundary from "@components/ErrorBoundary";
import { IS_MAC } from "@utils/constants";
import { t } from "@utils/locale";
import { Margins } from "@utils/margins";
import { identity } from "@utils/misc";
import { Forms, Select } from "@webpack/common";

export function MacOSVibrancySettings() {
    const settings = useSettings(["macosVibrancyStyle", "locale"]);

    if (!IS_MAC || IS_WEB) return null;

    return (
        <ErrorBoundary noop>
            <Forms.FormTitle tag="h5">{t("MacOS Window vibrancy style (requires restart)", "Стиль вибрации окна MacOS (нужен перезапуск)")}</Forms.FormTitle>
            <Select
                className={Margins.bottom20}
                placeholder={t("Window vibrancy style", "Стиль вибрации окна")}
                options={[
                    // Sorted from most opaque to most transparent
                    {
                        label: t("No vibrancy", "Без вибрации"), value: undefined
                    },
                    {
                        label: t("Under Page (window tinting)", "Под страницей (тонирование окна)"),
                        value: "under-page"
                    },
                    {
                        label: t("Content", "Контент"),
                        value: "content"
                    },
                    {
                        label: t("Window", "Окно"),
                        value: "window"
                    },
                    {
                        label: t("Selection", "Выделение"),
                        value: "selection"
                    },
                    {
                        label: t("Titlebar", "Заголовок"),
                        value: "titlebar"
                    },
                    {
                        label: t("Header", "Шапка"),
                        value: "header"
                    },
                    {
                        label: t("Sidebar", "Боковая панель"),
                        value: "sidebar"
                    },
                    {
                        label: t("Tooltip", "Подсказка"),
                        value: "tooltip"
                    },
                    {
                        label: t("Menu", "Меню"),
                        value: "menu"
                    },
                    {
                        label: t("Popover", "Поповер"),
                        value: "popover"
                    },
                    {
                        label: t("Fullscreen UI (transparent but slightly muted)", "Полноэкранный UI (прозрачный, слегка приглушён)"),
                        value: "fullscreen-ui"
                    },
                    {
                        label: t("HUD (Most transparent)", "HUD (максимально прозрачный)"),
                        value: "hud"
                    },
                ]}
                select={v => settings.macosVibrancyStyle = v}
                isSelected={v => settings.macosVibrancyStyle === v}
                serialize={identity}
            />
        </ErrorBoundary>
    );
}
