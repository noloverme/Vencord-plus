/*
 * Vencord, a modification for Discord's desktop app
 * Copyright (c) 2023 Vendicated and contributors
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
import { authorizeCloud, deauthorizeCloud } from "@api/SettingsSync/cloudSetup";
import { deleteCloudSettings, eraseAllCloudData, getCloudSettings, getCloudSyncDirection, putCloudSettings, setCloudSyncDirection } from "@api/SettingsSync/cloudSync";
import { BaseText } from "@components/BaseText";
import { Button, ButtonProps } from "@components/Button";
import { CheckedTextInput } from "@components/CheckedTextInput";
import { Divider } from "@components/Divider";
import { Flex } from "@components/Flex";
import { FormSwitch } from "@components/FormSwitch";
import { Grid } from "@components/Grid";
import { Heading } from "@components/Heading";
import { CloudDownloadIcon, CloudUploadIcon, DeleteIcon, RestartIcon } from "@components/Icons";
import { Link } from "@components/Link";
import { Paragraph } from "@components/Paragraph";
import { SettingsTab, wrapTab } from "@components/settings/tabs/BaseTab";
import { t } from "@utils/locale";
import { Margins } from "@utils/margins";
import { classes } from "@utils/misc";
import { IconComponent } from "@utils/types";
import { ConfirmModal,openModal, Select, Tooltip, useState } from "@webpack/common";

function validateUrl(url: string) {
    try {
        new URL(url);
        return true;
    } catch {
        return t("Invalid URL", "Неверный URL");
    }
}

const SectionHeading = ({ text }: { text: string; }) => (
    <BaseText
        tag="h5"
        size="lg"
        weight="semibold"
        className={Margins.bottom16}
    >
        {text}
    </BaseText>
);

function ButtonWithIcon({ children, Icon, className, ...buttonProps }: ButtonProps & { Icon: IconComponent; }) {
    return (
        <Button {...buttonProps} className={classes("vc-cloud-icon-with-button", className)}>
            <Icon className={"vc-cloud-button-icon"} />
            {children}
        </Button>
    );
}

function CloudSetupSection() {
    const { cloud } = useSettings(["cloud.authenticated", "cloud.url", "locale"]);

    return (
        <section>
            <SectionHeading text={t("Cloud Integrations", "Облачная интеграция")} />

            <Paragraph size="md" className={Margins.bottom20}>
                {t("Vencord comes with a cloud integration that adds goodies like settings sync across devices. It ", "В Vencord есть облачная интеграция: например, синхронизация настроек между устройствами. Она ")}<Link href="https://vencord.dev/cloud/privacy">{t("respects your privacy", "уважает приватность")}</Link>{t(", and the ", ", а ") }<Link href="https://github.com/Vencord/Backend">{t("source code", "исходный код")}</Link>{t(" is AGPL 3.0 licensed so you can host it yourself.", " под лицензией AGPL 3.0 — можно хостить самому.")}
            </Paragraph>
            <FormSwitch
                key="backend"
                title={t("Enable Cloud Integrations", "Включить облачную интеграцию")}
                description={t("This will request authorization if you have not yet set up cloud integrations.", "Если интеграция ещё не настроена, будет запрошена авторизация.")}
                value={cloud.authenticated}
                onChange={v => {
                    if (v)
                        authorizeCloud();
                    else
                        cloud.authenticated = v;
                }}
            />
            <Heading tag="h5" className={Margins.top16}>{t("Backend URL", "URL бэкенда")}</Heading>
            <Paragraph className={Margins.bottom8}>
                {t("Which backend to use when using cloud integrations.", "Какой бэкенд использовать для облачной интеграции.")}
            </Paragraph>
            <CheckedTextInput
                key="backendUrl"
                initialValue={cloud.url}
                onChange={async v => {
                    cloud.url = v;
                    cloud.authenticated = false;
                    deauthorizeCloud();
                }}
                validate={validateUrl}
            />

            <Grid columns={1} gap="1em" className={Margins.top8}>
                <ButtonWithIcon
                    variant="primary"
                    disabled={!cloud.authenticated}
                    onClick={async () => {
                        await deauthorizeCloud();
                        cloud.authenticated = false;
                        await authorizeCloud();
                    }}
                    Icon={RestartIcon}
                >
                    {t("Reauthorise", "Авторизоваться заново")}
                </ButtonWithIcon>
            </Grid>
        </section>
    );
}

function SettingsSyncSection() {
    const { cloud } = useSettings(["cloud.authenticated", "cloud.settingsSync", "locale"]);
    const [syncDirection, setSyncDirection] = useState(getCloudSyncDirection);
    const sectionEnabled = cloud.authenticated && cloud.settingsSync;

    return (
        <section>
            <SectionHeading text={t("Settings Sync", "Синхронизация настроек")} />
            <Flex flexDirection="column" gap="1em">
                <FormSwitch
                    key="cloud-sync"
                    title={t("Enable Settings Sync", "Включить синхронизацию настроек")}
                    description={t("Save your Vencord settings to the cloud so you can easily keep them the same on all your devices", "Сохранять настройки Vencord в облако, чтобы держать их одинаковыми на всех устройствах")}
                    value={cloud.settingsSync}
                    onChange={v => { cloud.settingsSync = v; }}
                    disabled={!cloud.authenticated}
                    hideBorder
                />

                <div>
                    <Heading tag="h5">
                        {t("Sync Rules for This Device", "Правила синхронизации для этого устройства")}
                    </Heading>
                    <Paragraph className={Margins.bottom8}>
                        {t("This setting controls how settings move between ", "Настройка управляет движением настроек между ")}<strong>{t("this device", "этим устройством")}</strong>{t(" and the cloud. You can let changes flow both ways, or choose one place to be the main source of truth.", " и облаком. Можно синхронизировать в обе стороны или выбрать один главный источник.")}
                    </Paragraph>
                    <Select
                        options={[
                            {
                                label: t("Two-way sync (changes go both directions)", "Двусторонняя (изменения в обе стороны)"),
                                value: "both",
                                default: true,
                            },
                            {
                                label: t("This device is the source (upload only)", "Это устройство — источник (только загрузка)"),
                                value: "push",
                            },
                            {
                                label: t("The cloud is the source (download only)", "Облако — источник (только скачивание)"),
                                value: "pull",
                            },
                            {
                                label: t("Do not sync automatically (manual sync via buttons below only)", "Не синхронизировать автоматически (только кнопками ниже)"),
                                value: "manual",
                            }
                        ]}
                        isSelected={v => v === syncDirection}
                        serialize={v => String(v)}
                        select={v => {
                            setCloudSyncDirection(v);
                            setSyncDirection(v);
                        }}
                        closeOnSelect={true}
                    />
                </div>

                <Grid columns={2} gap="1em" className={Margins.top20}>
                    <ButtonWithIcon
                        variant="positive"
                        disabled={!sectionEnabled}
                        onClick={() => putCloudSettings(true)}
                        Icon={CloudUploadIcon}
                    >
                        {t("Upload Settings", "Загрузить настройки")}
                    </ButtonWithIcon>
                    <Tooltip text={t("This will replace your current settings with the ones saved in the cloud. Be careful!", "Текущие настройки будут заменены сохранёнными в облаке. Осторожно!")}>
                        {({ onMouseLeave, onMouseEnter }) => (
                            <ButtonWithIcon
                                variant="dangerPrimary"
                                onMouseLeave={onMouseLeave}
                                onMouseEnter={onMouseEnter}
                                disabled={!sectionEnabled}
                                onClick={() => getCloudSettings(true, true)}
                                Icon={CloudDownloadIcon}
                            >
                                {t("Download Settings", "Скачать настройки")}
                            </ButtonWithIcon>
                        )}
                    </Tooltip>
                </Grid>
            </Flex>
        </section>
    );
}

function ResetSection() {
    const { authenticated, settingsSync } = useSettings(["cloud.authenticated", "cloud.settingsSync", "locale"]).cloud;

    return (
        <section>
            <SectionHeading text={t("Reset Cloud Data", "Сброс облачных данных")} />

            <Grid columns={2} gap="1em">
                <ButtonWithIcon
                    variant="dangerPrimary"
                    disabled={!authenticated || !settingsSync}
                    onClick={() => deleteCloudSettings()}
                    Icon={DeleteIcon}
                >
                    {t("Delete Settings from Cloud", "Удалить настройки из облака")}
                </ButtonWithIcon>
                <ButtonWithIcon
                    variant="dangerPrimary"
                    disabled={!authenticated}
                    onClick={() => openModal(props => (
                        <ConfirmModal
                            {...props}
                            title={t("Are you sure?", "Точно?")}
                            subtitle={t("Once your data is erased, we cannot recover it. There's no going back!", "После удаления данные не восстановить. Пути назад нет!")}
                            onConfirm={eraseAllCloudData}
                            confirmText={t("Erase it!", "Стереть!")}
                            cancelText={t("Nevermind", "Отмена")}
                        />
                    ))}
                    Icon={DeleteIcon}
                >
                    {t("Delete your Cloud Account", "Удалить облачный аккаунт")}
                </ButtonWithIcon>
            </Grid>
        </section>
    );
}

function CloudTab() {
    return (
        <SettingsTab>
            <Flex flexDirection="column" gap="1em">
                <CloudSetupSection />
                <Divider />
                <SettingsSyncSection />
                <Divider />
                <ResetSection />
            </Flex>
        </SettingsTab>
    );
}

export default wrapTab(CloudTab, "Cloud");
