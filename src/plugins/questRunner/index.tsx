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

import { Flex } from "@components/Flex";
import { Devs } from "@utils/constants";
import { Margins } from "@utils/margins";
import { ModalContent, ModalHeader, ModalProps, ModalRoot, openModal } from "@utils/modal";
import definePlugin from "@utils/types";
import { Button, Forms } from "@webpack/common";
import { useState } from "@webpack/common";

const EMOJI_URL = "https://cdn.discordapp.com/emojis/1227687255536042055.webp?size=128";

let logs: string[] = [];
let listeners: (() => void)[] = [];
let isRunning = false;
let shouldStop = false;
let currentCleanup: (() => void) | null = null;

function addLog(msg: string) {
    const line = `[${new Date().toLocaleTimeString()}] ${msg}`;
    logs.push(line);
    console.log(`[QuestRunner] ${msg}`);
    listeners.forEach(cb => cb());
}

function clearLogs() {
    logs = [];
    listeners.forEach(cb => cb());
}

function subscribeLogs(cb: () => void) {
    listeners.push(cb);
    return () => { listeners = listeners.filter(x => x !== cb); };
}

function getLogs() { return [...logs]; }

// --- Quest logic adapted from provided snippet ---
async function runQuests() {
    if (isRunning) {
        addLog("Уже выполняется!");
        return;
    }
    isRunning = true;
    shouldStop = false;
    addLog("Запуск...");

    // @ts-ignore
    delete (window as any).$;

    let wpRequire: any;
    try {
        // @ts-ignore
        wpRequire = (window as any).webpackChunkdiscord_app.push([[Symbol()], {}, (r: any) => r]);
        // @ts-ignore
        (window as any).webpackChunkdiscord_app.pop();
    } catch (e) {
        addLog(`Ошибка получения wpRequire: ${e}`);
        isRunning = false;
        return;
    }

    let ApplicationStreamingStore: any, RunningGameStore: any, QuestsStore: any, ChannelStore: any, GuildChannelStore: any, FluxDispatcher: any, api: any;
    try {
        ApplicationStreamingStore = Object.values(wpRequire.c).find((x: any) => x?.exports?.A?.__proto__?.getStreamerActiveStreamMetadata)?.exports.A;
        RunningGameStore = Object.values(wpRequire.c).find((x: any) => x?.exports?.Ay?.getRunningGames)?.exports.Ay;
        QuestsStore = Object.values(wpRequire.c).find((x: any) => x?.exports?.A?.__proto__?.getQuest)?.exports.A;
        ChannelStore = Object.values(wpRequire.c).find((x: any) => x?.exports?.A?.__proto__?.getAllThreadsForParent)?.exports.A;
        GuildChannelStore = Object.values(wpRequire.c).find((x: any) => x?.exports?.Ay?.getSFWDefaultChannel)?.exports.Ay;
        FluxDispatcher = Object.values(wpRequire.c).find((x: any) => x?.exports?.h?.__proto__?.flushWaitQueue)?.exports.h;
        api = Object.values(wpRequire.c).find((x: any) => x?.exports?.Bo?.get)?.exports.Bo;

        if (!QuestsStore || !api) throw new Error("Не найдены QuestsStore/api");
    } catch (e) {
        addLog(`Ошибка поиска модулей: ${e}`);
        isRunning = false;
        return;
    }

    const supportedTasks = ["WATCH_VIDEO", "PLAY_ON_DESKTOP", "STREAM_ON_DESKTOP", "PLAY_ACTIVITY", "WATCH_VIDEO_ON_MOBILE"];

    let quests: any[] = [...QuestsStore.quests.values()].filter((x: any) =>
        x.userStatus?.enrolledAt &&
        !x.userStatus?.completedAt &&
        new Date(x.config.expiresAt).getTime() > Date.now() &&
        supportedTasks.find(y => Object.keys((x.config.taskConfig ?? x.config.taskConfigV2).tasks).includes(y))
    );

    // @ts-ignore
    let isApp = typeof DiscordNative !== "undefined";

    if (quests.length === 0) {
        addLog("У вас нет незавершённых квестов!");
        isRunning = false;
        return;
    }

    addLog(`Найдено квестов: ${quests.length}`);

    const doJob = async () => {
        if (shouldStop) {
            addLog("Остановлено пользователем");
            isRunning = false;
            return;
        }
        const quest = quests.pop();
        if (!quest) {
            addLog("Все квесты выполнены!");
            isRunning = false;
            return;
        }

        const pid = Math.floor(Math.random() * 30000) + 1000;
        const questName = quest.config.messages.questName;
        const taskConfig = quest.config.taskConfig ?? quest.config.taskConfigV2;
        const taskName = supportedTasks.find(x => taskConfig.tasks[x] != null);
        const taskData = taskConfig.tasks[taskName!];
        const applicationId = quest.config.application?.id ?? taskData.applications?.[0]?.id;
        const secondsNeeded = taskData.target;
        let secondsDone = quest.userStatus?.progress?.[taskName!]?.value ?? 0;

        addLog(`Начинаем: ${questName} (тип: ${taskName})`);

        const handleError = (err: any) => {
            addLog(`Ошибка "${questName}": ${err?.message ?? err}`);
            doJob();
        };

        try {
            if (taskName === "WATCH_VIDEO" || taskName === "WATCH_VIDEO_ON_MOBILE") {
                const speed = 7;
                let completed = false;

                let fn = async () => {
                    try {
                        while (true) {
                            if (shouldStop) { addLog("Остановлено"); isRunning = false; return; }
                            const remaining = Math.min(speed, secondsNeeded - secondsDone);
                            await new Promise<void>(resolve => setTimeout(resolve, remaining * 1000));
                            if (shouldStop) return;
                            const timestamp = secondsDone + speed;
                            const res = await api.post({
                                url: `/quests/${quest.id}/video-progress`,
                                body: { timestamp: Math.min(secondsNeeded, timestamp + Math.random()) }
                            });
                            completed = res.body.completed_at != null;
                            secondsDone = Math.min(secondsNeeded, timestamp);
                            addLog(`Видео прогресс: ${secondsDone}/${secondsNeeded}`);
                            if (timestamp >= secondsNeeded) break;
                        }
                        if (!completed) {
                            await api.post({
                                url: `/quests/${quest.id}/video-progress`,
                                body: { timestamp: secondsNeeded }
                            });
                        }
                        addLog("Квест выполнен! (видео)");
                        doJob();
                    } catch (err) { handleError(err); }
                };
                fn();
                addLog(`Симулируем просмотр видео "${questName}".`);

            } else if (taskName === "PLAY_ON_DESKTOP") {
                if (!isApp) {
                    addLog(`Не работает в браузере для "${questName}". Нужен десктоп!`);
                    doJob();
                } else {
                    api.get({ url: `/applications/public?application_ids=${applicationId}` }).then((res: any) => {
                        try {
                            const appData = res.body[0];
                            const exeName = appData.executables?.find((x: any) => x.os === "win32")?.name?.replace(">", "") ?? appData.name.replace(/[\/\\:*?"<>|]/g, "");
                            const fakeGame = {
                                cmdLine: `C:\\Program Files\\${appData.name}\\${exeName}`,
                                exeName,
                                exePath: `c:/program files/${appData.name.toLowerCase()}/${exeName}`,
                                hidden: false,
                                isLauncher: false,
                                id: applicationId,
                                name: appData.name,
                                pid: pid,
                                pidPath: [pid],
                                processName: appData.name,
                                start: Date.now(),
                            };
                            const realGames = RunningGameStore.getRunningGames();
                            const fakeGames = [fakeGame];
                            const realGetRunningGames = RunningGameStore.getRunningGames;
                            const realGetGameForPID = RunningGameStore.getGameForPID;
                            RunningGameStore.getRunningGames = () => fakeGames;
                            RunningGameStore.getGameForPID = (pid: any) => fakeGames.find((x: any) => x.pid === pid);
                            FluxDispatcher.dispatch({
                                type: "RUNNING_GAMES_CHANGE",
                                removed: realGames,
                                added: [fakeGame],
                                games: fakeGames
                            });
                            currentCleanup = () => {
                                RunningGameStore.getRunningGames = realGetRunningGames;
                                RunningGameStore.getGameForPID = realGetGameForPID;
                                FluxDispatcher.dispatch({
                                    type: "RUNNING_GAMES_CHANGE",
                                    removed: [fakeGame],
                                    added: [],
                                    games: []
                                });
                            };
                            let fn = (data: any) => {
                                let progress = quest.config.configVersion === 1
                                    ? data.userStatus.streamProgressSeconds
                                    : Math.floor(data.userStatus.progress.PLAY_ON_DESKTOP.value);
                                addLog(`Прогресс: ${progress}/${secondsNeeded}`);
                                if (progress >= secondsNeeded) {
                                    addLog("Квест выполнен! (игра)");
                                    currentCleanup?.();
                                    currentCleanup = null;
                                    FluxDispatcher.unsubscribe("QUESTS_SEND_HEARTBEAT_SUCCESS", fn);
                                    doJob();
                                }
                            };
                            FluxDispatcher.subscribe("QUESTS_SEND_HEARTBEAT_SUCCESS", fn);
                            addLog(`Симулируем игру "${appData.name}". Жди ${Math.ceil((secondsNeeded - secondsDone) / 60)} мин.`);
                        } catch (err) { handleError(err); }
                    }).catch(handleError);
                }

            } else if (taskName === "STREAM_ON_DESKTOP") {
                if (!isApp) {
                    addLog(`Не работает в браузере для "${questName}". Нужен десктоп!`);
                    doJob();
                } else {
                    let realFunc = ApplicationStreamingStore.getStreamerActiveStreamMetadata;
                    ApplicationStreamingStore.getStreamerActiveStreamMetadata = () => ({
                        id: applicationId,
                        pid,
                        sourceName: null
                    });
                    currentCleanup = () => { ApplicationStreamingStore.getStreamerActiveStreamMetadata = realFunc; };
                    let fn = (data: any) => {
                        try {
                            let progress = quest.config.configVersion === 1
                                ? data.userStatus.streamProgressSeconds
                                : Math.floor(data.userStatus.progress.STREAM_ON_DESKTOP.value);
                            addLog(`Прогресс стрим: ${progress}/${secondsNeeded}`);
                            if (progress >= secondsNeeded) {
                                addLog("Квест выполнен! (стрим)");
                                currentCleanup?.();
                                currentCleanup = null;
                                FluxDispatcher.unsubscribe("QUESTS_SEND_HEARTBEAT_SUCCESS", fn);
                                doJob();
                            }
                        } catch (err) { handleError(err); }
                    };
                    FluxDispatcher.subscribe("QUESTS_SEND_HEARTBEAT_SUCCESS", fn);
                    addLog(`Симулируем стрим. Стримь окно в войсе ${Math.ceil((secondsNeeded - secondsDone) / 60)} мин. Нужен 1 чел в войсе!`);
                }

            } else if (taskName === "PLAY_ACTIVITY") {
                const channelId = ChannelStore.getSortedPrivateChannels()[0]?.id ??
                    Object.values(GuildChannelStore.getAllGuilds()).find((x: any) => x != null && x.VOCAL.length > 0)?.VOCAL[0].channel.id;
                const streamKey = `call:${channelId}:1`;
                let fn = async () => {
                    try {
                        addLog(`Выполняем "${questName}" (activity)`);
                        while (true) {
                            if (shouldStop) return;
                            const res = await api.post({
                                url: `/quests/${quest.id}/heartbeat`,
                                body: { stream_key: streamKey, terminal: false }
                            });
                            const progress = res.body.progress.PLAY_ACTIVITY.value;
                            addLog(`Прогресс activity: ${progress}/${secondsNeeded}`);
                            await new Promise<void>(resolve => setTimeout(resolve, 20 * 1000));
                            if (shouldStop) return;
                            if (progress >= secondsNeeded) {
                                await api.post({
                                    url: `/quests/${quest.id}/heartbeat`,
                                    body: { stream_key: streamKey, terminal: true }
                                });
                                break;
                            }
                        }
                        addLog("Квест выполнен! (activity)");
                        doJob();
                    } catch (err) { handleError(err); }
                };
                fn();
            } else {
                addLog(`Неизвестный тип: ${taskName}`);
                doJob();
            }
        } catch (err) { handleError(err); }
    };

    doJob();
}

function stopQuests() {
    shouldStop = true;
    currentCleanup?.();
    currentCleanup = null;
    addLog("Запрошена остановка...");
    // force stop after a bit
    setTimeout(() => { isRunning = false; addLog("Остановлено"); }, 1000);
}

function QuestModal(props: ModalProps) {
    const [tick, setTick] = useState(0);
    const [logState, setLogState] = useState(getLogs());

    // subscribe to logs
    (useState as any)(() => {
        const cb = () => { setLogState(getLogs()); setTick(x => x + 1); };
        const unsub = subscribeLogs(cb);
        return unsub;
    });

    // simple effect
    const React = (window as any).React;
    React.useEffect(() => {
        const cb = () => setLogState(getLogs());
        const unsub = subscribeLogs(cb);
        return unsub;
    }, []);

    return (
        <ModalRoot {...props} size="large">
            <ModalHeader>
                <Flex style={{ alignItems: "center", gap: 8 }}>
                    <img src={EMOJI_URL} width={24} height={24} style={{ borderRadius: "50%" }} />
                    <Forms.FormTitle tag="h2" style={{ margin: 0 }}>Выполнить задачи - Логи</Forms.FormTitle>
                </Flex>
            </ModalHeader>
            <ModalContent>
                <Flex style={{ gap: 8, marginBottom: 12 }}>
                    <Button color={Button.Colors.GREEN} onClick={() => runQuests()} disabled={isRunning}>Запустить</Button>
                    <Button color={Button.Colors.RED} onClick={() => stopQuests()} disabled={!isRunning}>Остановить</Button>
                    <Button color={Button.Colors.PRIMARY} onClick={() => clearLogs()}>Очистить</Button>
                </Flex>
                <div style={{
                    background: "var(--background-secondary-alt, #2b2d31)",
                    color: "var(--text-normal, #f2f3f5)",
                    borderRadius: 8,
                    padding: 8,
                    height: 300,
                    overflowY: "auto",
                    fontFamily: "monospace",
                    fontSize: 12,
                    whiteSpace: "pre-wrap",
                    border: "1px solid var(--background-tertiary)",
                    lineHeight: "1.4"
                }}>
                    {logState.length === 0 ? <span style={{ opacity: 0.6, color: "var(--text-muted)" }}>Логов пока нет. Нажми Запустить.</span> : logState.join("\n")}
                </div>
                <Forms.FormText style={{ marginTop: 8 }} className={Margins.top8}>
                    Плагин локальный, логи видны только тебе. Для видео-квестов работает в браузере, для PLAY/STREAM нужен десктоп.
                </Forms.FormText>
            </ModalContent>
        </ModalRoot>
    );
}

let floatingBtn: HTMLButtonElement | null = null;

function createFloatingButton() {
    if (floatingBtn) return;
    floatingBtn = document.createElement("button");
    floatingBtn.id = "vc-quest-runner-btn";
    floatingBtn.innerHTML = `<img src="${EMOJI_URL}" style="width:20px;height:20px;vertical-align:middle;border-radius:50%;margin-right:6px;">Выполнить задачи`;
    floatingBtn.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 9999;
        background: var(--brand-500);
        color: white;
        border: none;
        border-radius: 9999px;
        padding: 8px 14px;
        font-weight: 600;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        font-family: var(--font-primary);
    `;
    floatingBtn.onclick = () => openModal(props => <QuestModal {...props} />);
    document.body.appendChild(floatingBtn);
}

function removeFloatingButton() {
    floatingBtn?.remove();
    floatingBtn = null;
}

export default definePlugin({
    name: "QuestRunner",
    description: "Adds a 'Complete Tasks' button with logs for auto quests",
    authors: [Devs.noloverme],
    tags: ["Utility"],
    // Add toolbox button as alternative
    toolboxActions: {
        "Открыть логи квестов": () => openModal(props => <QuestModal {...props} />)
    },

    start() {
        createFloatingButton();
        addLog("Плагин QuestRunner загружен. Нажми кнопку чтобы открыть логи.");
    },

    stop() {
        removeFloatingButton();
        stopQuests();
    },
});
