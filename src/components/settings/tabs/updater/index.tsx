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

import { useSettings } from "@api/Settings";
import { Button } from "@components/Button";
import { Card } from "@components/Card";
import { Divider } from "@components/Divider";
import { Flex } from "@components/Flex";
import { FormSwitch } from "@components/FormSwitch";
import { HeadingSecondary } from "@components/Heading";
import { Link } from "@components/Link";
import { Paragraph } from "@components/Paragraph";
import { SettingsTab, wrapTab } from "@components/settings/tabs/BaseTab";
import { t, useT } from "@utils/locale";
import { Margins } from "@utils/margins";
import { classes } from "@utils/misc";
import { useAwaiter } from "@utils/react";
import { getRepo, isNewer, UpdateLogger } from "@utils/updater";
import { Forms, React } from "@webpack/common";

import gitHash from "~git-hash";

import { CommonProps, HashLink, Newer, Updatable } from "./Components";

function VesktopSection() {
    if (!IS_VESKTOP) return null;

    const [isVesktopOutdated] = useAwaiter<boolean>(VesktopNative.app.isOutdated, { fallbackValue: false });

    return (
        <Flex className={Margins.bottom20} flexDirection="column" gap="1em">
            <Card variant="info">
                <HeadingSecondary>Vesktop & Vencord</HeadingSecondary>
                <Paragraph>{t("Vesktop and Vencord are two separate things. This updater is for Vencord.", "Vesktop и Vencord — разные вещи. Этот апдейтер — для Vencord.")}</Paragraph>
                <Paragraph className={Margins.top8}>
                    {t("You receive separate popups for Vesktop updates. You can also manually update by installing the ", "Обновления Vesktop приходят отдельно. Можно обновиться вручную, установив ")}<Link href="https://vesktop.dev/install">{t("latest version", "последнюю версию")}</Link>.
                </Paragraph>
            </Card>

            {isVesktopOutdated && (
                <Card variant="warning">
                    <HeadingSecondary>{t("Vesktop Outdated", "Vesktop устарел")}</HeadingSecondary>
                    <Flex flexDirection="column" gap="0.5em">
                        <Paragraph>{t("Your version of Vesktop is outdated!", "Ваша версия Vesktop устарела!")}</Paragraph>
                        <Button variant="link" onClick={() => VesktopNative.app.openUpdater()}>{t("Open Vesktop Updater", "Открыть апдейтер Vesktop")}</Button>
                    </Flex>
                </Card>
            )}
        </Flex>
    );
}

function Updater() {
    useT();
    const settings = useSettings(["autoUpdate", "autoUpdateNotification", "locale"]);

    const [repo, err, repoPending] = useAwaiter(getRepo, {
        fallbackValue: t("Loading...", "Загрузка..."),
        onError: e => UpdateLogger.error("Failed to retrieve repo", err)
    });

    const commonProps: CommonProps = {
        repo,
        repoPending
    };

    return (
        <SettingsTab>
            <VesktopSection />

            <div className="vc-settings-switches">
                <FormSwitch
                    title={t("Automatically update", "Обновлять автоматически")}
                    description={t("Automatically update Vencord without confirmation prompt", "Обновлять Vencord без запроса подтверждения")}
                    value={settings.autoUpdate}
                    onChange={(v: boolean) => settings.autoUpdate = v}
                    hideBorder
                />
                <FormSwitch
                    title={t("Get notified when an automatic update completes", "Уведомлять о завершении автообновления")}
                    description={t("Show a notification when Vencord automatically updates", "Показывать уведомление, когда Vencord обновился автоматически")}
                    value={settings.autoUpdateNotification}
                    onChange={(v: boolean) => settings.autoUpdateNotification = v}
                    disabled={!settings.autoUpdate}
                    hideBorder
                />
            </div>

            <Forms.FormTitle tag="h5" className={Margins.top20}>{t("Repo", "Репозиторий")}</Forms.FormTitle>

            <Forms.FormText>
                {repoPending
                    ? repo
                    : err
                        ? t("Failed to retrieve - check console", "Не удалось получить — смотрите консоль")
                        : (
                            <Link href={repo}>
                                {repo.split("/").slice(-2).join("/")}
                            </Link>
                        )
                }
                {" "}
                (<HashLink hash={gitHash} repo={repo} disabled={repoPending} />)
            </Forms.FormText>

            <Divider className={classes(Margins.top16, Margins.bottom16)} />

            <Forms.FormTitle tag="h5">{t("Updates", "Обновления")}</Forms.FormTitle>

            {isNewer
                ? <Newer {...commonProps} />
                : <Updatable {...commonProps} />
            }
        </SettingsTab>
    );
}

export default IS_UPDATER_DISABLED
    ? null
    : wrapTab(Updater, "Updater");
