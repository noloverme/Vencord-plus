/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Button } from "@components/Button";
import { Card } from "@components/Card";
import { ErrorCard } from "@components/ErrorCard";
import { Flex } from "@components/Flex";
import { Link } from "@components/Link";
import { Paragraph } from "@components/Paragraph";
import { t } from "@utils/locale";
import { Margins } from "@utils/margins";
import { classes } from "@utils/misc";
import { promptToRestart } from "@utils/promptToRestart";
import { changes, checkForUpdates, update, updateError } from "@utils/updater";
import { React, showToast, useState } from "@webpack/common";

import { runWithDispatch } from "./runWithDispatch";

export interface CommonProps {
    repo: string;
    repoPending: boolean;
}

export function HashLink({ repo, hash, disabled = false }: { repo: string, hash: string, disabled?: boolean; }) {
    return (
        <Link href={`${repo}/commit/${hash}`} disabled={disabled}>
            {hash}
        </Link>
    );
}

export function Changes({ updates, repo, repoPending }: CommonProps & { updates: typeof changes; }) {
    return (
        <Card style={{ padding: "0 0.5em" }} defaultPadding={false}>
            {updates.map(({ hash, author, message }) => (
                <div
                    key={hash}
                    style={{
                        marginTop: "0.5em",
                        marginBottom: "0.5em"
                    }}
                >
                    <code>
                        <HashLink {...{ repo, hash }} disabled={repoPending} />
                    </code>

                    <span style={{
                        marginLeft: "0.5em",
                        color: "var(--text-default)"
                    }}>
                        {message} - {author}
                    </span>
                </div>
            ))}
        </Card>
    );
}

export function Newer(props: CommonProps) {
    return (
        <>
            <Paragraph className={Margins.bottom8}>
                {t("Your local copy has more recent commits. Please stash or reset them.", "Ваша локальная копия новее. Сделайте stash или reset.")}
            </Paragraph>
            <Changes {...props} updates={changes} />
        </>
    );
}

export function Updatable(props: CommonProps) {
    const [updates, setUpdates] = useState(changes);
    const [isChecking, setIsChecking] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);

    const isOutdated = (updates?.length ?? 0) > 0;

    return (
        <>
            {!updates && updateError ? (
                <>
                    <Paragraph>{t("Failed to check updates. Check the console for more info", "Не удалось проверить обновления. Смотрите консоль")}</Paragraph>
                    <ErrorCard style={{ padding: "1em" }}>
                        <p>{updateError.stderr || updateError.stdout || t("An unknown error occurred", "Неизвестная ошибка")}</p>
                    </ErrorCard>
                </>
            ) : (
                <Paragraph className={Margins.bottom8}>
                    {isOutdated ? (updates.length === 1 ? t("There is 1 Update", "Есть 1 обновление") : t(`There are ${updates.length} Updates`, `Обновлений: ${updates.length}`)) : t("Up to Date!", "Всё актуально!")}
                </Paragraph>
            )}

            {isOutdated && <Changes updates={updates} {...props} />}

            <Flex className={classes(Margins.bottom8, Margins.top8)}>
                {isOutdated && (
                    <Button
                        disabled={isUpdating || isChecking}
                        onClick={runWithDispatch(setIsUpdating, async () => {
                            if (await update()) {
                                setUpdates([]);

                                promptToRestart("relaunch", {
                                    title: t("Update Success!", "Обновлено!"),
                                    subtitle: t("Successfully updated. Restart now to apply the changes?", "Успешно обновлено. Перезапустить для применения?"),
                                    confirmText: t("Restart", "Перезапустить"),
                                    cancelText: t("Not now!", "Не сейчас!")
                                });
                            }
                        })}
                    >
                        {t("Update Now", "Обновить")}
                    </Button>
                )}
                <Button
                    disabled={isUpdating || isChecking}
                    onClick={runWithDispatch(setIsChecking, async () => {
                        const outdated = await checkForUpdates();

                        if (outdated) {
                            setUpdates(changes);
                        } else {
                            setUpdates([]);

                            showToast({ text: t("No updates found!", "Обновлений нет!"), position: "bottom" });
                        }
                    })}
                >
                    {t("Check for Updates", "Проверить обновления")}
                </Button>
            </Flex>
        </>
    );
}
