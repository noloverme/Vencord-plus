/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { useSettings } from "@api/Settings";
import ErrorBoundary from "@components/ErrorBoundary";
import { Heading } from "@components/Heading";
import { Margins } from "@components/margins";
import { Paragraph } from "@components/Paragraph";
import { IS_WINDOWS } from "@utils/constants";
import { t } from "@utils/locale";
import { Select } from "@webpack/common";

export function WindowsMaterialSettings() {
    const settings = useSettings(["windowsMaterial", "locale"]);

    if (!IS_WINDOWS || IS_WEB || !VencordNative.native.supportsWindowsMaterial()) return null;

    return (
        <ErrorBoundary noop>
            <Heading tag="h5">{t("Background Material", "Материал фона")}</Heading>
            <Paragraph className={Margins.bottom8}>
                {t("Windows transparent background effects. You need a theme that supports transparency or this will do nothing. A restart is required after changing this setting.", "Прозрачные эффекты фона Windows. Нужна тема с поддержкой прозрачности, иначе не сработает. После смены настройки нужен перезапуск.")}
            </Paragraph>

            <Select
                placeholder={t("None", "Нет")}
                options={[
                    {
                        label: t("None", "Нет"),
                        value: "none",
                        default: true
                    },
                    {
                        label: t("Mica (incorporates system theme + desktop wallpaper to paint the background)", "Mica (фон из темы системы и обоев)"),
                        value: "mica"
                    },
                    {
                        label: t("Tabbed (variant of Mica with stronger background tinting)", "Tabbed (вариант Mica с сильным тонированием)"),
                        value: "tabbed"
                    },
                    {
                        label: t("Acrylic (blurs the window behind Vesktop for a translucent background)", "Acrylic (размытие окна позади Vesktop)"),
                        value: "acrylic"
                    }
                ]}
                closeOnSelect={true}
                select={v => (settings.windowsMaterial = v)}
                isSelected={v => v === settings.windowsMaterial}
                serialize={s => s}
            />
        </ErrorBoundary>
    );
}
