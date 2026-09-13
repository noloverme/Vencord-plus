/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { ErrorCard } from "@components/ErrorCard";
import { t } from "@utils/locale";
import { UpdateLogger } from "@utils/updater";
import { ConfirmModal,openModal, Parser } from "@webpack/common";

function getErrorMessage(e: any) {
    if (!e?.code || !e.cmd)
        return t("An unknown error occurred.\nPlease try again or see the console for more info.", "Неизвестная ошибка.\nПопробуйте ещё раз или смотрите консоль.");

    const { code, path, cmd, stderr } = e;

    if (code === "ENOENT")
        return t(`Command \`${path}\` not found.\nPlease install it and try again.`, `Команда \`${path}\` не найдена.\nУстановите её и попробуйте снова.`);

    const extra = stderr || t(`Code \`${code}\`. See the console for more info.`, `Код \`${code}\`. Подробности в консоли.`);

    return t(`An error occurred while running \`${cmd}\`:\n${extra}`, `Ошибка при выполнении \`${cmd}\`:\n${extra}`);
}

export function runWithDispatch(dispatch: React.Dispatch<React.SetStateAction<boolean>>, action: () => any) {
    return async () => {
        dispatch(true);

        try {
            await action();
        } catch (e: any) {
            UpdateLogger.error(e);

            const err = getErrorMessage(e);

            openModal(props => (
                <ConfirmModal
                    {...props}
                    title={t("Oops!", "Упс!")}
                    confirmText="OK"
                    variant="primary"
                >
                    <ErrorCard>
                        {err.split("\n").map((line, idx) =>
                            <div key={idx}>{Parser.parse(line)}</div>
                        )}
                    </ErrorCard>
                </ConfirmModal>
            ));
        } finally {
            dispatch(false);
        }
    };
}
