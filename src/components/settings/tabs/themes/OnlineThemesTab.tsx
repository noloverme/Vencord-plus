/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { useSettings } from "@api/Settings";
import { Card } from "@components/Card";
import { Flex } from "@components/Flex";
import { Heading } from "@components/Heading";
import { Paragraph } from "@components/Paragraph";
import { t } from "@utils/locale";
import { TextArea, useState } from "@webpack/common";

export function OnlineThemesTab() {
    const settings = useSettings(["themeLinks"]);

    const [themeText, setThemeText] = useState(settings.themeLinks.join("\n"));

    // When the user leaves the online theme textbox, update the settings
    function onBlur() {
        settings.themeLinks = [...new Set(
            themeText
                .trim()
                .split(/\n+/)
                .map(s => s.trim())
                .filter(Boolean)
        )];
    }

    return (
        <Flex flexDirection="column" gap="1em">
            <Card variant="warning" defaultPadding>
                <Paragraph>
                    {t("This section is for advanced users. If you are having difficulties using it, use the Local Themes tab instead.", "Этот раздел для опытных. Если сложно — используйте вкладку локальных тем.")}
                </Paragraph>
            </Card>
            <Card>
                <Heading>{t("Paste links to css files here", "Вставьте сюда ссылки на css-файлы")}</Heading>
                <Paragraph>{t("One link per line", "По одной ссылке на строку")}</Paragraph>
                <Paragraph>{t("You can prefix lines with @light or @dark to toggle them based on your Discord theme", "Строки можно начинать с @light или @dark, чтобы переключать по теме Discord")}</Paragraph>
                <Paragraph>{t("Make sure to use direct links to files (raw or github.io)!", "Используйте прямые ссылки на файлы (raw или github.io)!")}</Paragraph>
            </Card>

            <section>
                <Heading>{t("Online Themes", "Онлайн-темы")}</Heading>
                <TextArea
                    value={themeText}
                    onChange={setThemeText}
                    className={"vc-settings-theme-links"}
                    placeholder={t("Enter Theme Links...", "Введите ссылки на темы...")}
                    spellCheck={false}
                    onBlur={onBlur}
                    rows={10}
                />
            </section>
        </Flex>
    );
}
