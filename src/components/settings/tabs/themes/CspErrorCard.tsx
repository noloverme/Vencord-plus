/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Divider } from "@components/Divider";
import { ErrorCard } from "@components/ErrorCard";
import { Link } from "@components/Link";
import { CspBlockedUrls, useCspErrors } from "@utils/cspViolations";
import { t } from "@utils/locale";
import { Margins } from "@utils/margins";
import { classes } from "@utils/misc";
import { relaunch } from "@utils/native";
import { useForceUpdater } from "@utils/react";
import { Button, ConfirmModal, Forms, openModal } from "@webpack/common";

export function CspErrorCard() {
    if (IS_WEB) return null;

    const errors = useCspErrors();
    const forceUpdate = useForceUpdater();

    if (!errors.length) return null;

    const isImgurHtmlDomain = (url: string) => url.startsWith("https://imgur.com/");

    const allowUrl = async (url: string) => {
        const { origin: baseUrl, host } = new URL(url);

        const result = await VencordNative.csp.requestAddOverride(baseUrl, ["connect-src", "img-src", "style-src", "font-src"], "Vencord Themes");
        if (result !== "ok") return;

        CspBlockedUrls.forEach(url => {
            if (new URL(url).host === host) {
                CspBlockedUrls.delete(url);
            }
        });

        forceUpdate();

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
    };

    const hasImgurHtmlDomain = errors.some(isImgurHtmlDomain);

    return (
        <ErrorCard>
            <Forms.FormTitle tag="h5">{t("Blocked Resources", "Заблокированные ресурсы")}</Forms.FormTitle>
            <Forms.FormText>{t("Some images, styles, or fonts were blocked because they come from disallowed domains.", "Некоторые картинки, стили или шрифты заблокированы — они с неразрешённых доменов.")}</Forms.FormText>
            <Forms.FormText>{t("It is highly recommended to move them to GitHub or Imgur. But you may also allow domains if you fully trust them.", "Рекомендуется перенести их на GitHub или Imgur. Но можно и разрешить домены, если полностью им доверяете.")}</Forms.FormText>
            <Forms.FormText>
                {t("After allowing a domain, you have to fully close (from tray / task manager) and restart ", "После разрешения домена полностью закройте (из трея / диспетчера задач) и перезапустите ")}{IS_DISCORD_DESKTOP ? "Discord" : "Vesktop"}{t(" to apply the change.", " для применения.")}
            </Forms.FormText>

            <Forms.FormTitle tag="h5" className={classes(Margins.top16, Margins.bottom8)}>{t("Blocked URLs", "Заблокированные URL")}</Forms.FormTitle>
            <div className="vc-settings-csp-list">
                {errors.map((url, i) => (
                    <div key={url}>
                        {i !== 0 && <Divider className={Margins.bottom8} />}
                        <div className="vc-settings-csp-row">
                            <Link href={url}>{url}</Link>
                            <Button color={Button.Colors.PRIMARY} onClick={() => allowUrl(url)} disabled={isImgurHtmlDomain(url)}>
                                {t("Allow", "Разрешить")}
                            </Button>
                        </div>
                    </div>
                ))}
            </div>

            {hasImgurHtmlDomain && (
                <>
                    <Divider className={classes(Margins.top8, Margins.bottom16)} />
                    <Forms.FormText>
                        {t("Imgur links should be direct links in the form of ", "Ссылки Imgur должны быть прямыми, вида ")}<code>https://i.imgur.com/...</code>
                    </Forms.FormText>
                    <Forms.FormText>{t("To obtain a direct link, right-click the image and select \"Copy image address\".", "Чтобы получить прямую ссылку, кликните по картинке правой кнопкой и выберите «Копировать адрес изображения».")}</Forms.FormText>
                </>
            )}
        </ErrorCard>
    );
}
