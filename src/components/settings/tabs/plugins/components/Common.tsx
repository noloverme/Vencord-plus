/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Paragraph } from "@components/Paragraph";
import { classNameFactory } from "@utils/css";
import { t } from "@utils/locale";
import { txDesc, txName } from "@utils/localePlugins";
import { classes } from "@utils/misc";
import { wordsFromCamel, wordsToTitle } from "@utils/text";
import { DefinedSettings, PluginSettingDefCommon } from "@utils/types";
import { useEffect, useState } from "@webpack/common";
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

// Local state that resets whenever the stored value changes, e.g. when a setting is changed from outside the settings modal
export function useSettingState<T>(value: T) {
    const [state, setState] = useState(value);
    useEffect(() => setState(value), [value]);

    return [state, setState] as const;
}

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
                    <Paragraph size="md" weight="medium" className={cl("title")}>{tName ?? wordsToTitle(wordsFromCamel(id))}</Paragraph>
                    {tDesc && <Paragraph className={cl("description")}>{tDesc}</Paragraph>}
                </div>
                {children}
            </div>
            {error && <Paragraph className={cl("error")}>{error}</Paragraph>}
        </Tag>
    );
}
