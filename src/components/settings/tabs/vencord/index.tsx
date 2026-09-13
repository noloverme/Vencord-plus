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

import { openNotificationLogModal } from "@api/Notifications/notificationLog";
import { useSettings } from "@api/Settings";
import { Divider } from "@components/Divider";
import { FormSwitch } from "@components/FormSwitch";
import { FolderIcon, GithubIcon, LogIcon, PaintbrushIcon, RestartIcon } from "@components/Icons";
import { QuickAction, QuickActionCard } from "@components/settings/QuickAction";
import { SpecialCard } from "@components/settings/SpecialCard";
import { SettingsTab, wrapTab } from "@components/settings/tabs/BaseTab";
import { openContributorModal } from "@components/settings/tabs/plugins/ContributorModal";
import { openPluginModal } from "@components/settings/tabs/plugins/PluginModal";
import SettingsPlugin from "@plugins/_core/settings";
import { gitRemote } from "@shared/vencordUserAgent";
import { IS_WINDOWS } from "@utils/constants";
import { getLocale, setLocale, t, useT } from "@utils/locale";
import { Margins } from "@utils/margins";
import { identity, isPluginDev } from "@utils/misc";
import { relaunch } from "@utils/native";
import { ConfirmModal, Forms, openModal, React, Select, useMemo, UserStore } from "@webpack/common";

import { DonateButtonComponent, isDonor } from "./DonateButton";
import { MacOSVibrancySettings } from "./MacVibrancySettings";
import { NotificationSection } from "./NotificationSettings";
import { WindowsMaterialSettings } from "./WindowsMaterialSettings";

const DEFAULT_DONATE_IMAGE = "https://cdn.discordapp.com/emojis/1026533090627174460.png";
const SHIGGY_DONATE_IMAGE = "https://media.discordapp.net/stickers/1039992459209490513.png";
const VENNIE_DONATOR_IMAGE = "https://cdn.discordapp.com/emojis/1238120638020063377.png";
const COZY_CONTRIB_IMAGE = "https://cdn.discordapp.com/emojis/1026533070955872337.png";
const DONOR_BACKGROUND_IMAGE = "https://media.discordapp.net/stickers/1311070116305436712.png?size=2048";
const CONTRIB_BACKGROUND_IMAGE = "https://media.discordapp.net/stickers/1311070166481895484.png?size=2048";

type KeysOfType<Object, Type> = {
    [K in keyof Object]: Object[K] extends Type ? K : never;
}[keyof Object];

function Switches() {
    // "locale" subscription so all titles re-render on language switch
    const settings = useSettings(["useQuickCss", "enableReactDevtools", "frameless", "winNativeTitleBar", "transparent", "winCtrlQ", "disableMinSize", "locale"]);

    const Switches = [
        {
            key: "useQuickCss",
            title: t("Enable Custom CSS", "Включить Custom CSS"),
            description: t("Apply your configured QuickCSS", "Применять ваш QuickCSS")
        },
        !IS_WEB && (!IS_DISCORD_DESKTOP || !IS_WINDOWS ? {
            key: "frameless",
            title: t("Disable the window frame", "Убрать рамку окна"),
            restartRequired: true
        } : {
            key: "winNativeTitleBar",
            title: t("Use Windows' native title bar instead of Discord's custom one", "Использовать родной заголовок Windows вместо кастомного Discord"),
            restartRequired: true
        }),
        !IS_WEB && {
            key: "transparent",
            title: t("Enable window transparency", "Включить прозрачность окна"),
            description: t("A theme that supports transparency is required or this will do nothing. Stops the window from being resizable as a side effect", "Нужна тема с поддержкой прозрачности, иначе не сработает. Побочный эффект: окно перестанет менять размер"),
            restartRequired: true
        },
        IS_DISCORD_DESKTOP && {
            key: "disableMinSize",
            title: t("Disable minimum window size", "Убрать минимальный размер окна"),
            description: t("Allows you to resize the window to any size, even smaller than Discord's minimum size", "Позволяет сжимать окно до любого размера, даже меньше минимума Discord"),
            restartRequired: true
        },
        !IS_WEB && IS_WINDOWS && {
            key: "winCtrlQ",
            title: t("Register Ctrl+Q as shortcut to close Discord (Alternative to Alt+F4)", "Закрывать Discord по Ctrl+Q (альтернатива Alt+F4)"),
            restartRequired: true
        },
        !IS_WEB && {
            key: "enableReactDevtools",
            title: t("Enable React Developer Tools", "Включить React Developer Tools"),
            description: t("Mainly useful for plugin developers. Ignore this if you don't know what it is", "В основном для разработчиков плагинов. Если не знаете что это — игнорируйте"),
            restartRequired: true
        },
    ] satisfies Array<false | {
        key: KeysOfType<typeof settings, boolean>;
        title: string;
        description?: string;
        restartRequired?: boolean;
    }>;

    return Switches.map(setting => {
        if (!setting) {
            return null;
        }

        const { key, title, description, restartRequired } = setting;

        return (
            <FormSwitch
                key={key}
                title={title}
                description={description}
                value={settings[key]}
                hideBorder
                onChange={v => {
                    settings[key] = v;

                    if (restartRequired) {
                        openModal(props => (
                            <ConfirmModal
                                {...props}
                                title={t("Restart Required", "Нужен перезапуск")}
                                subtitle={t("A restart is required to apply this change", "Чтобы применить изменение, нужен перезапуск")}
                                confirmText={t("Restart now", "Перезапустить")}
                                cancelText={t("Later!", "Позже!")}
                                variant="primary"
                                onConfirm={relaunch}
                            />
                        ));
                    }
                }}
            />
        );
    });
}

function LanguageSection() {
    useT();
    return (
        <section className={Margins.top16}>
            <Forms.FormTitle tag="h5">{t("Language / Язык", "Язык / Language")}</Forms.FormTitle>
            <Select
                placeholder={t("Interface language", "Язык интерфейса")}
                options={[
                    { label: "English", value: "en" },
                    { label: "Русский", value: "ru" },
                ]}
                closeOnSelect={true}
                select={v => setLocale(v as "en" | "ru")}
                isSelected={v => v === getLocale()}
                serialize={identity}
            />
        </section>
    );
}

function VencordSettings() {
    useT();
    const donateImage = useMemo(() =>
        Math.random() > 0.5 ? DEFAULT_DONATE_IMAGE : SHIGGY_DONATE_IMAGE,
        []
    );

    const user = UserStore?.getCurrentUser();

    return (
        <SettingsTab>
            {isDonor(user?.id)
                ? (
                    <SpecialCard
                        title={t("Donations", "Донаты")}
                        subtitle={t("Thank you for donating!", "Спасибо за донат!")}
                        description={t("You can manage your perks at any time by messaging @vending.machine.", "Управлять привилегиями можно в любое время, написав @vending.machine.")}
                        cardImage={VENNIE_DONATOR_IMAGE}
                        backgroundImage={DONOR_BACKGROUND_IMAGE}
                        backgroundColor="#ED87A9"
                    >
                        <DonateButtonComponent />
                    </SpecialCard>
                )
                : (
                    <SpecialCard
                        title={t("Support the Project", "Поддержите проект")}
                        description={t("Please consider supporting the development of Vencord by donating!", "Пожалуйста, поддержите разработку Vencord донатом!")}
                        cardImage={donateImage}
                        backgroundImage={DONOR_BACKGROUND_IMAGE}
                        backgroundColor="#c3a3ce"
                    >
                        <DonateButtonComponent />
                    </SpecialCard>
                )
            }

            {isPluginDev(user?.id) && (
                <SpecialCard
                    title={t("Contributions", "Вклад в проект")}
                    subtitle={t("Thank you for contributing!", "Спасибо за вклад!")}
                    description={t("Since you've contributed to Vencord you now have a cool new badge!", "За вклад в Vencord у вас теперь крутой новый бейдж!")}
                    cardImage={COZY_CONTRIB_IMAGE}
                    backgroundImage={CONTRIB_BACKGROUND_IMAGE}
                    backgroundColor="#EDCC87"
                    buttonTitle={t("See what you've contributed to", "Посмотреть мой вклад")}
                    buttonOnClick={() => openContributorModal(user)}
                />
            )}

            <section>
                <Forms.FormTitle tag="h5">{t("Quick Actions", "Быстрые действия")}</Forms.FormTitle>

                <QuickActionCard>
                    <QuickAction
                        Icon={LogIcon}
                        text={t("Notification Log", "Журнал уведомлений")}
                        action={openNotificationLogModal}
                    />
                    <QuickAction
                        Icon={PaintbrushIcon}
                        text={t("Edit QuickCSS", "Редактировать QuickCSS")}
                        action={() => VencordNative.quickCss.openEditor()}
                    />
                    {!IS_WEB && (
                        <>
                            <QuickAction
                                Icon={RestartIcon}
                                text={t("Relaunch Discord", "Перезапустить Discord")}
                                action={relaunch}
                            />
                            <QuickAction
                                Icon={FolderIcon}
                                text={t("Open Settings Folder", "Открыть папку настроек")}
                                action={() => VencordNative.settings.openFolder()}
                            />
                        </>
                    )}
                    <QuickAction
                        Icon={GithubIcon}
                        text={t("View Source Code", "Исходный код")}
                        action={() => VencordNative.native.openExternal("https://github.com/" + gitRemote)}
                    />
                </QuickActionCard>
            </section>

            <Divider />

            <LanguageSection />

            <Divider />

            <section className={Margins.top16}>
                <Forms.FormTitle tag="h5">{t("Settings", "Настройки")}</Forms.FormTitle>
                <Forms.FormText className={Margins.bottom20} style={{ color: "var(--text-muted)" }}>
                    {t("Hint: You can change the position of this settings section in the ", "Подсказка: положение этого раздела можно изменить в ")}{" "}
                    <a onClick={() => openPluginModal(SettingsPlugin)}>
                        {t("settings of the Settings plugin", "настройках плагина Settings")}
                    </a>!
                </Forms.FormText>

                <div className="vc-settings-switches">
                    <Switches />
                </div>
            </section>


            <MacOSVibrancySettings />
            <WindowsMaterialSettings />

            <NotificationSection />
        </SettingsTab>
    );
}

export default wrapTab(VencordSettings, "Vencord Settings");
