/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { ConfirmModalProps } from "@vencord/discord-types";
import { ConfirmModal, openModal } from "@webpack/common";

import { t } from "./locale";
import { relaunch } from "./native";

/**
 * @param type - "relaunch" to restart the entire application, "reload" to only reload Discord (CTRL + R)
 * @param props - Properties for the confirmation modal, uses sensible defaults
 */
export function promptToRestart(
    type: "relaunch" | "reload",
    {
        title = t("Restart Required", "Нужен перезапуск"),
        subtitle = t("A restart is required to apply this change", "Чтобы применить изменение, нужен перезапуск"),
        confirmText = t("Restart now", "Перезапустить"),
        cancelText = t("Later!", "Позже!"),
        ...props
    }: Partial<ConfirmModalProps> = {}
) {
    const onConfirm = type === "relaunch"
        ? relaunch
        : () => location.reload();

    openModal(modalProps => (
        <ConfirmModal
            variant="primary"
            {...modalProps}
            {...props}

            title={title}
            subtitle={subtitle}
            confirmText={confirmText}
            cancelText={cancelText}
            onConfirm={onConfirm}
        />
    ));
}
