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
import definePlugin from "@utils/types";
import type { RenderModalProps } from "@vencord/discord-types";
import { find, findByProps, findStore } from "@webpack";
import {
    ApplicationStreamingStore,
    Button,
    ChannelStore,
    FluxDispatcher,
    Forms,
    GuildChannelStore,
    Modal,
    openModal,
    RestAPI,
    RunningGameStore,
    useEffect,
    useRef,
    useState
} from "@webpack/common";

const EMOJI_URL = "https://cdn.discordapp.com/emojis/1227687255536042055.webp?size=128";

let logs: string[] = [];
let listeners: (() => void)[] = [];
let isRunning = false;
let shouldStop = false;
let currentCleanup: (() => void) | null = null;

function notify() {
    for (const cb of listeners) {
        try { cb(); } catch {}
    }
}

function addLog(msg: string) {
    const line = `[${new Date().toLocaleTimeString()}] ${msg}`;
    logs.push(line);
    console.log(`[QuestRunner] ${msg}`);
    notify();
}

function clearLogs() {
    logs = [];
    notify();
}

function subscribeLogs(cb: () => void) {
    listeners.push(cb);
    return () => {
        listeners = listeners.filter(x => x !== cb);
    };
}

function getLogs() {
    return [...logs];
}

function getModules() {
    let api: any = RestAPI;
    if (!api?.get || !api?.post) {
        api = findByProps("get", "post", "put") ?? find((m: any) => typeof m?.get === "function" && typeof m?.post === "function");
    }

    let questsStore: any = findStore("QuestsStore");
    if (!questsStore?.quests && !questsStore?.getQuest) {
        questsStore = find((m: any) => m && (m.getQuest || m.__proto__?.getQuest) && (m.quests || m.claimedQuests));
    }

    let appStreamingStore: any = ApplicationStreamingStore ?? findStore("ApplicationStreamingStore") ?? findByProps("getStreamerActiveStreamMetadata");
    let runningGameStore: any = RunningGameStore ?? findStore("RunningGameStore") ?? findByProps("getRunningGames");
    let channelStore: any = ChannelStore ?? findStore("ChannelStore") ?? findByProps("getSortedPrivateChannels");
    let guildChannelStore: any = GuildChannelStore ?? findStore("GuildChannelStore") ?? findByProps("getAllGuilds");
    let fluxDispatcher: any = FluxDispatcher ?? findByProps("dispatch", "subscribe");

    // Fallback: search webpack chunk cache directly if needed
    if (!questsStore || !api) {
        try {
            const wpChunk = (window as any).webpackChunkdiscord_app;
            if (wpChunk) {
                const wpRequire = wpChunk.push([[Symbol()], {}, (r: any) => r]);
                wpChunk.pop?.();
                if (wpRequire?.c) {
                    const modules = Object.values(wpRequire.c) as any[];
                    if (!api) {
                        for (const mod of modules) {
                            const exp = mod?.exports;
                            if (!exp) continue;
                            if (typeof exp.get === "function" && typeof exp.post === "function") {
                                api = exp;
                                break;
                            }
                            for (const k of Object.keys(exp)) {
                                if (exp[k] && typeof exp[k].get === "function" && typeof exp[k].post === "function") {
                                    api = exp[k];
                                    break;
                                }
                            }
                            if (api) break;
                        }
                    }
                    if (!questsStore) {
                        for (const mod of modules) {
                            const exp = mod?.exports;
                            if (!exp) continue;
                            if (exp.quests || exp.__proto__?.getQuest || typeof exp.getQuest === "function") {
                                questsStore = exp;
                                break;
                            }
                            for (const k of Object.keys(exp)) {
                                const item = exp[k];
                                if (item && (item.quests || item.__proto__?.getQuest || typeof item.getQuest === "function")) {
                                    questsStore = item;
                                    break;
                                }
                            }
                            if (questsStore) break;
                        }
                    }
                    if (!appStreamingStore) {
                        appStreamingStore = modules.find((x: any) => x?.exports?.A?.__proto__?.getStreamerActiveStreamMetadata)?.exports.A;
                    }
                    if (!runningGameStore) {
                        runningGameStore = modules.find((x: any) => x?.exports?.Ay?.getRunningGames)?.exports.Ay;
                    }
                    if (!channelStore) {
                        channelStore = modules.find((x: any) => x?.exports?.A?.__proto__?.getAllThreadsForParent)?.exports.A;
                    }
                    if (!guildChannelStore) {
                        guildChannelStore = modules.find((x: any) => x?.exports?.Ay?.getSFWDefaultChannel)?.exports.Ay;
                    }
                    if (!fluxDispatcher) {
                        fluxDispatcher = modules.find((x: any) => x?.exports?.h?.__proto__?.flushWaitQueue)?.exports.h;
                    }
                }
            }
        } catch {}
    }

    return {
        api,
        QuestsStore: questsStore,
        ApplicationStreamingStore: appStreamingStore,
        RunningGameStore: runningGameStore,
        ChannelStore: channelStore,
        GuildChannelStore: guildChannelStore,
        FluxDispatcher: fluxDispatcher
    };
}

async function runQuests() {
    if (isRunning) {
        addLog("Уже выполняется!");
        return;
    }
    isRunning = true;
    shouldStop = false;
    notify();
    addLog("Запуск...");

    let modules: ReturnType<typeof getModules>;
    try {
        modules = getModules();
        if (!modules.QuestsStore || !modules.api) {
            throw new Error("Не найдены QuestsStore/api");
        }
    } catch (e) {
        addLog(`Ошибка поиска модулей: ${e}`);
        isRunning = false;
        notify();
        return;
    }

    const {
        QuestsStore,
        RunningGameStore,
        ApplicationStreamingStore,
        ChannelStore,
        GuildChannelStore,
        FluxDispatcher,
        api
    } = modules;

    const supportedTasks = ["WATCH_VIDEO", "PLAY_ON_DESKTOP", "STREAM_ON_DESKTOP", "PLAY_ACTIVITY", "WATCH_VIDEO_ON_MOBILE"];

    const rawQuests: any[] = QuestsStore.quests instanceof Map
        ? Array.from(QuestsStore.quests.values())
        : (QuestsStore.quests ? Object.values(QuestsStore.quests) : []);

    const quests: any[] = rawQuests.filter((x: any) => {
        if (!x?.userStatus?.enrolledAt || x.userStatus?.completedAt) return false;
        if (x.config?.expiresAt && new Date(x.config.expiresAt).getTime() <= Date.now()) return false;
        const taskConfig = x.config?.taskConfig ?? x.config?.taskConfigV2;
        if (!taskConfig?.tasks) return false;
        return supportedTasks.some(y => taskConfig.tasks[y] != null);
    });

    const isApp = typeof DiscordNative !== "undefined";

    if (quests.length === 0) {
        addLog("У вас нет принятых незавершённых квестов (убедитесь, что квесты приняты в Discord)!");
        isRunning = false;
        notify();
        return;
    }

    addLog(`Найдено квестов: ${quests.length}`);

    const doJob = async () => {
        if (shouldStop) {
            addLog("Остановлено пользователем");
            isRunning = false;
            notify();
            return;
        }
        const quest = quests.pop();
        if (!quest) {
            addLog("Все квесты выполнены!");
            isRunning = false;
            notify();
            return;
        }

        const pid = Math.floor(Math.random() * 30000) + 1000;
        const { questName } = quest.config.messages;
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

                const fn = async () => {
                    try {
                        while (true) {
                            if (shouldStop) {
                                addLog("Остановлено");
                                isRunning = false;
                                notify();
                                return;
                            }
                            const remaining = Math.min(speed, secondsNeeded - secondsDone);
                            await new Promise<void>(resolve => setTimeout(resolve, remaining * 1000));
                            if (shouldStop) return;
                            const timestamp = secondsDone + speed;
                            const res = await api.post({
                                url: `/quests/${quest.id}/video-progress`,
                                body: { timestamp: Math.min(secondsNeeded, timestamp + Math.random()) }
                            });
                            completed = res?.body?.completed_at != null;
                            secondsDone = Math.min(secondsNeeded, timestamp);
                            addLog(`Видео прогресс: ${Math.min(secondsDone, secondsNeeded)}/${secondsNeeded}`);
                            if (timestamp >= secondsNeeded) break;
                        }
                        if (!completed && !shouldStop) {
                            await api.post({
                                url: `/quests/${quest.id}/video-progress`,
                                body: { timestamp: secondsNeeded }
                            });
                        }
                        if (!shouldStop) {
                            addLog("Квест выполнен! (видео)");
                            doJob();
                        }
                    } catch (err) { handleError(err); }
                };
                fn();
                addLog(`Симулируем просмотр видео "${questName}".`);

            } else if (taskName === "PLAY_ON_DESKTOP") {
                if (!isApp) {
                    addLog(`Не работает в браузере для "${questName}". Нужен десктоп!`);
                    doJob();
                } else if (!RunningGameStore || !FluxDispatcher) {
                    addLog("Не найден RunningGameStore или FluxDispatcher!");
                    doJob();
                } else {
                    api.get({ url: `/applications/public?application_ids=${applicationId}` }).then((res: any) => {
                        try {
                            const appData = res.body[0];
                            const exeName = appData.executables?.find((x: any) => x.os === "win32")?.name?.replace(">", "") ?? appData.name.replace(/[/\\:*?"<>|]/g, "");
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
                            RunningGameStore.getGameForPID = (pidParam: any) => fakeGames.find((x: any) => x.pid === pidParam);
                            FluxDispatcher.dispatch({
                                type: "RUNNING_GAMES_CHANGE",
                                removed: realGames,
                                added: [fakeGame],
                                games: fakeGames
                            });

                            const fn = (data: any) => {
                                const progress = quest.config.configVersion === 1
                                    ? data.userStatus.streamProgressSeconds
                                    : Math.floor(data.userStatus.progress.PLAY_ON_DESKTOP.value);
                                addLog(`Прогресс: ${progress}/${secondsNeeded}`);
                                if (progress >= secondsNeeded) {
                                    addLog("Квест выполнен! (игра)");
                                    currentCleanup?.();
                                    currentCleanup = null;
                                    doJob();
                                }
                            };

                            currentCleanup = () => {
                                RunningGameStore.getRunningGames = realGetRunningGames;
                                RunningGameStore.getGameForPID = realGetGameForPID;
                                FluxDispatcher.unsubscribe("QUESTS_SEND_HEARTBEAT_SUCCESS", fn);
                                FluxDispatcher.dispatch({
                                    type: "RUNNING_GAMES_CHANGE",
                                    removed: [fakeGame],
                                    added: [],
                                    games: []
                                });
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
                } else if (!ApplicationStreamingStore || !FluxDispatcher) {
                    addLog("Не найден ApplicationStreamingStore или FluxDispatcher!");
                    doJob();
                } else {
                    const realFunc = ApplicationStreamingStore.getStreamerActiveStreamMetadata;
                    ApplicationStreamingStore.getStreamerActiveStreamMetadata = () => ({
                        id: applicationId,
                        pid,
                        sourceName: null
                    });

                    const fn = (data: any) => {
                        try {
                            const progress = quest.config.configVersion === 1
                                ? data.userStatus.streamProgressSeconds
                                : Math.floor(data.userStatus.progress.STREAM_ON_DESKTOP.value);
                            addLog(`Прогресс стрим: ${progress}/${secondsNeeded}`);
                            if (progress >= secondsNeeded) {
                                addLog("Квест выполнен! (стрим)");
                                currentCleanup?.();
                                currentCleanup = null;
                                doJob();
                            }
                        } catch (err) { handleError(err); }
                    };

                    currentCleanup = () => {
                        ApplicationStreamingStore.getStreamerActiveStreamMetadata = realFunc;
                        FluxDispatcher.unsubscribe("QUESTS_SEND_HEARTBEAT_SUCCESS", fn);
                    };

                    FluxDispatcher.subscribe("QUESTS_SEND_HEARTBEAT_SUCCESS", fn);
                    addLog(`Симулируем стрим. Стримь окно в войсе ${Math.ceil((secondsNeeded - secondsDone) / 60)} мин. Нужен 1 чел в войсе!`);
                }

            } else if (taskName === "PLAY_ACTIVITY") {
                const channelId = ChannelStore?.getSortedPrivateChannels?.()?.[0]?.id ??
                    (Object.values(GuildChannelStore?.getAllGuilds?.() ?? {}) as any[]).find((x: any) => x != null && x.VOCAL?.length > 0)?.VOCAL[0]?.channel?.id;
                if (!channelId) {
                    addLog(`Не найден канал для запуска activity "${questName}"!`);
                    doJob();
                    return;
                }
                const streamKey = `call:${channelId}:1`;
                const fn = async () => {
                    try {
                        addLog(`Выполняем "${questName}" (activity)`);
                        while (true) {
                            if (shouldStop) return;
                            const res = await api.post({
                                url: `/quests/${quest.id}/heartbeat`,
                                body: { stream_key: streamKey, terminal: false }
                            });
                            const progress = res?.body?.progress?.PLAY_ACTIVITY?.value ?? 0;
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
                        if (!shouldStop) {
                            addLog("Квест выполнен! (activity)");
                            doJob();
                        }
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
    setTimeout(() => {
        isRunning = false;
        addLog("Остановлено");
        notify();
    }, 1000);
}

function QuestModal(props: RenderModalProps) {
    const [logState, setLogState] = useState(getLogs());
    const [running, setRunning] = useState(isRunning);
    const logBoxRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const cb = () => {
            setLogState(getLogs());
            setRunning(isRunning);
        };
        return subscribeLogs(cb);
    }, []);

    useEffect(() => {
        if (logBoxRef.current) {
            logBoxRef.current.scrollTop = logBoxRef.current.scrollHeight;
        }
    }, [logState]);

    return (
        <Modal
            {...props}
            size="lg"
            title={
                <Flex style={{ alignItems: "center", gap: 8 }}>
                    <img src={EMOJI_URL} width={24} height={24} style={{ borderRadius: "50%" }} alt="" />
                    Выполнить задачи - Логи
                </Flex>
            }
            actions={[
                {
                    text: "Запустить",
                    variant: "primary",
                    disabled: running,
                    onClick: () => runQuests()
                },
                {
                    text: "Остановить",
                    variant: "critical-primary",
                    disabled: !running,
                    onClick: () => stopQuests()
                },
                {
                    text: "Очистить",
                    variant: "secondary",
                    disabled: logState.length === 0,
                    onClick: () => clearLogs()
                },
                {
                    text: "Закрыть",
                    variant: "secondary",
                    onClick: props.onClose
                }
            ]}
        >
            <Flex style={{ gap: 8, marginBottom: 12 }}>
                <Button color={Button.Colors.GREEN} onClick={() => runQuests()} disabled={running}>Запустить</Button>
                <Button color={Button.Colors.RED} onClick={() => stopQuests()} disabled={!running}>Остановить</Button>
                <Button color={Button.Colors.PRIMARY} onClick={() => clearLogs()} disabled={logState.length === 0}>Очистить</Button>
            </Flex>
            <div
                ref={logBoxRef}
                style={{
                    background: "var(--background-secondary-alt, #2b2d31)",
                    color: "var(--text-normal, #f2f3f5)",
                    borderRadius: 8,
                    padding: 10,
                    height: 300,
                    overflowY: "auto",
                    fontFamily: "monospace",
                    fontSize: 12,
                    whiteSpace: "pre-wrap",
                    border: "1px solid var(--background-tertiary)",
                    lineHeight: "1.4"
                }}
            >
                {logState.length === 0
                    ? <span style={{ opacity: 0.6, color: "var(--text-muted)" }}>Логов пока нет. Нажми «Запустить».</span>
                    : logState.join("\n")}
            </div>
            <Forms.FormText style={{ marginTop: 8 }} className={Margins.top8}>
                Плагин локальный, логи видны только тебе. Для видео-квестов работает в браузере, для PLAY/STREAM нужен десктоп.
            </Forms.FormText>
        </Modal>
    );
}

let floatingBtn: HTMLButtonElement | null = null;

function createFloatingButton() {
    if (floatingBtn || document.getElementById("vc-quest-runner-btn")) return;
    floatingBtn = document.createElement("button");
    floatingBtn.id = "vc-quest-runner-btn";
    floatingBtn.innerHTML = `<img src="${EMOJI_URL}" style="width:20px;height:20px;vertical-align:middle;border-radius:50%;margin-right:6px;" alt="" />Выполнить задачи`;
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
    floatingBtn.onclick = e => {
        e.preventDefault();
        e.stopPropagation();
        openModal(props => <QuestModal {...props} />);
    };
    document.body.appendChild(floatingBtn);
}

function removeFloatingButton() {
    floatingBtn?.remove();
    document.getElementById("vc-quest-runner-btn")?.remove();
    floatingBtn = null;
}

export default definePlugin({
    name: "QuestRunner",
    description: "Adds a 'Complete Tasks' button with logs for auto quests",
    authors: [Devs.noloverme],
    tags: ["Utility"],
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
