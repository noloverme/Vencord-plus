/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { classNameFactory } from "@utils/css";
import { t } from "@utils/locale";
import { txDesc, txName } from "@utils/localePlugins";
import { classes } from "@utils/misc";
import { wordsFromCamel, wordsToTitle } from "@utils/text";
import { DefinedSettings, PluginSettingDefCommon } from "@utils/types";
import { Text } from "@webpack/common";
import { PropsWithChildren } from "react";

export const cl = classNameFactory("vc-plugins-setting-");

interface SettingBaseProps<T> {
    setting: T;
    onChange(newValue: any): void;
    pluginSettings: {
        [setting: string]: any;
        enabled: boolean;
    };
    id: string;
    definedSettings: DefinedSettings;
    closePluginSettings(): void;
}

export type SettingProps<T extends PluginSettingDefCommon> = SettingBaseProps<T>;
export type ComponentSettingProps<T extends Omit<PluginSettingDefCommon, "description" | "placeholder">> = SettingBaseProps<T>;

export function resolveError(isValidResult: boolean | string) {
    if (typeof isValidResult === "string") return isValidResult;

    return isValidResult ? null : t("Invalid input provided", "Некорректный ввод");
}

interface SettingsSectionProps extends PropsWithChildren {
    name?: string;
    id: string;
    description: string;
    error?: string | null;
    inlineSetting?: boolean;
    tag?: "label" | "div";
    /** plugin name for RU dictionary lookup (see utils/localeRu) */
    pluginName?: string;
}

export function SettingsSection({ tag: Tag = "div", name, id, description, error, inlineSetting, children, pluginName }: SettingsSectionProps) {
    const tName = name != null && pluginName ? txName(pluginName, id, name) ?? name : name;
    const tDesc = pluginName ? txDesc(pluginName, id, description) ?? description : description;
    return (
        <Tag className={cl("section")}>
            <div className={classes(cl("content"), inlineSetting && cl("inline"))}>
                <div className={cl("label")}>
                    <Text className={cl("title")} variant="text-md/medium">{tName ?? wordsToTitle(wordsFromCamel(id))}</Text>
                    {tDesc && <Text className={cl("description")} variant="text-sm/normal">{tDesc}</Text>}
                </div>
                {children}
            </div>
            {error && <Text className={cl("error")} variant="text-sm/normal">{error}</Text>}
        </Tag>
    );
}
