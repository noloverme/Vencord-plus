/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { openNotificationLogModal } from "@api/Notifications/notificationLog";
import { useSettings } from "@api/Settings";
import { ErrorCard } from "@components/ErrorCard";
import { Flex } from "@components/Flex";
import { t, useT } from "@utils/locale";
import { Margins } from "@utils/margins";
import { identity } from "@utils/misc";
import { Button, Forms, Modal,openModal, Select, Slider } from "@webpack/common";

export function NotificationSection() {
    useT();
    return (
        <section className={Margins.top16}>
            <Forms.FormTitle tag="h5">{t("Notifications", "Уведомления")}</Forms.FormTitle>
            <Forms.FormText className={Margins.bottom8}>
                {t("Settings for Notifications sent by Vencord. This does NOT include Discord notifications (messages, etc)", "Настройки уведомлений от Vencord. Уведомления самого Discord (сообщения и т.д.) сюда не входят.")}
            </Forms.FormText>
            <Flex>
                <Button onClick={openNotificationSettingsModal}>
                    {t("Notification Settings", "Настройки уведомлений")}
                </Button>
                <Button onClick={openNotificationLogModal}>
                    {t("View Notification Log", "Журнал уведомлений")}
                </Button>
            </Flex>
        </section>
    );
}

export function openNotificationSettingsModal() {
    openModal(props => (
        <Modal
            {...props}
            size="lg"
            title={t("Notification Settings", "Настройки уведомлений")}
        >
            <NotificationSettings />
        </Modal>
    ));
}

function NotificationSettings() {
    useT();
    const settings = useSettings(["notifications.*", "locale"]).notifications;

    return (
        <>
            <Forms.FormTitle tag="h5">{t("Notification Style", "Стиль уведомлений")}</Forms.FormTitle>
            {settings.useNative !== "never" && Notification?.permission === "denied" && (
                <ErrorCard style={{ padding: "1em" }} className={Margins.bottom8}>
                    <Forms.FormTitle tag="h5">{t("Desktop Notification Permission denied", "Нет разрешения на десктоп-уведомления")}</Forms.FormTitle>
                    <Forms.FormText>{t("You have denied Notification Permissions. Thus, Desktop notifications will not work!", "Вы запретили уведомления. Десктоп-уведомления работать не будут!")}</Forms.FormText>
                </ErrorCard>
            )}
            <Forms.FormText className={Margins.bottom8}>
                {t("Some plugins may show you notifications. These come in two styles:", "Некоторые плагины показывают уведомления. Есть два стиля:")}
                <ul>
                    <li><strong>{t("Vencord Notifications", "Уведомления Vencord")}</strong>: {t("These are in-app notifications", "Встроенные уведомления внутри приложения")}</li>
                    <li><strong>{t("Desktop Notifications", "Десктоп-уведомления")}</strong>: {t("Native Desktop notifications (like when you get a ping)", "Системные уведомления (как при пинге)")}</li>
                </ul>
            </Forms.FormText>
            <Select
                placeholder={t("Notification Style", "Стиль уведомлений")}
                options={[
                    { label: t("Only use Desktop notifications when Discord is not focused", "Десктоп-уведомления только когда Discord не в фокусе"), value: "not-focused", default: true },
                    { label: t("Always use Desktop notifications", "Всегда десктоп-уведомления"), value: "always" },
                    { label: t("Always use Vencord notifications", "Всегда уведомления Vencord"), value: "never" },
                ] satisfies Array<{ value: typeof settings["useNative"]; } & Record<string, any>>}
                closeOnSelect={true}
                select={v => settings.useNative = v}
                isSelected={v => v === settings.useNative}
                serialize={identity}
            />

            <Forms.FormTitle tag="h5" className={Margins.top16 + " " + Margins.bottom8}>{t("Notification Position", "Позиция уведомлений")}</Forms.FormTitle>
            <Select
                isDisabled={settings.useNative === "always"}
                placeholder={t("Notification Position", "Позиция уведомлений")}
                options={[
                    { label: t("Bottom Right", "Снизу справа"), value: "bottom-right", default: true },
                    { label: t("Top Right", "Сверху справа"), value: "top-right" },
                ] satisfies Array<{ value: typeof settings["position"]; } & Record<string, any>>}
                select={v => settings.position = v}
                isSelected={v => v === settings.position}
                serialize={identity}
            />

            <Forms.FormTitle tag="h5" className={Margins.top16 + " " + Margins.bottom8}>{t("Notification Timeout", "Время показа")}</Forms.FormTitle>
            <Forms.FormText className={Margins.bottom16}>{t("Set to 0s to never automatically time out", "0 — не скрывать автоматически")}</Forms.FormText>
            <Slider
                disabled={settings.useNative === "always"}
                markers={[0, 1000, 2500, 5000, 10_000, 20_000]}
                minValue={0}
                maxValue={20_000}
                initialValue={settings.timeout}
                onValueChange={v => settings.timeout = v}
                onValueRender={v => (v / 1000).toFixed(2) + "s"}
                onMarkerRender={v => (v / 1000) + "s"}
                stickToMarkers={false}
            />

            <Forms.FormTitle tag="h5" className={Margins.top16 + " " + Margins.bottom8}>{t("Notification Log Limit", "Лимит журнала")}</Forms.FormTitle>
            <Forms.FormText className={Margins.bottom16}>
                {t("The amount of notifications to save in the log until old ones are removed.", "Сколько уведомлений хранить в журнале до удаления старых.")}
                {t("Set to ", "Значение ")}<code>0</code>{t(" to disable Notification log and ", " отключает журнал, а ")}<code>∞</code>{t(" to never automatically remove old Notifications", " — старые уведомления не удаляются")}
            </Forms.FormText>
            <Slider
                markers={[0, 25, 50, 75, 100, 200]}
                minValue={0}
                maxValue={200}
                stickToMarkers={true}
                initialValue={settings.logLimit}
                onValueChange={v => settings.logLimit = v}
                onValueRender={v => v === 200 ? "∞" : v}
                onMarkerRender={v => v === 200 ? "∞" : v}
            />
        </>
    );
}
