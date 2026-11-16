"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WindowsAgentDashboard = void 0;
const readline_1 = __importDefault(require("readline"));
const telemetry_1 = require("./telemetry");
const commands_1 = require("./commands");
const config_1 = require("./config");
class WindowsAgentDashboard {
    agent;
    refreshTimer = null;
    statusMessage = 'Agent running in active monitoring mode.';
    constructor(agent) {
        this.agent = agent;
    }
    start() {
        // Enable raw mode for single-keystroke interactivity if supported
        if (process.stdin.isTTY) {
            readline_1.default.emitKeypressEvents(process.stdin);
            process.stdin.setRawMode(true);
            process.stdin.on('keypress', (str, key) => {
                if (key.ctrl && key.name === 'c') {
                    this.exit();
                }
                else {
                    this.handleKey(key.name);
                }
            });
        }
        this.agent.onStateChanged = () => this.render();
        this.agent.onSessionStarted = (s) => {
            this.statusMessage = `Session active with Admin: ${s.adminName}`;
            this.render();
        };
        this.agent.onSessionEnded = (r) => {
            this.statusMessage = `Session ended: ${r}`;
            this.render();
        };
        this.render();
        // Auto-refresh telemetry meters every 4 seconds
        this.refreshTimer = setInterval(() => {
            this.render();
        }, 4000);
    }
    render() {
        console.clear();
        const config = this.agent.getConfig();
        const state = this.agent.getState();
        const session = this.agent.getCurrentSession();
        const telemetry = telemetry_1.WindowsTelemetryCollector.collect(config.deviceId);
        // 1. Branding Header
        console.log('\x1b[36m================================================================================\x1b[0m');
        console.log('   \x1b[1;36mMERA REMOTE MANAGEMENT\x1b[0m \x1b[90m— Windows Agent Interactive Console\x1b[0m');
        console.log('\x1b[36m================================================================================\x1b[0m');
        // 2. State & Presence Badge
        let badge = '\x1b[42m\x1b[97m ONLINE \x1b[0m';
        if (state === 'ACTIVE_SESSION') {
            badge = '\x1b[41m\x1b[97m ⚠️ ACTIVE SESSION \x1b[0m';
        }
        else if (state === 'CONNECTING') {
            badge = '\x1b[43m\x1b[30m CONNECTING... \x1b[0m';
        }
        else if (state === 'DISCONNECTED') {
            badge = '\x1b[100m\x1b[97m OFFLINE \x1b[0m';
        }
        console.log(` Connection Status : ${badge}    Control Plane: \x1b[34m${config.backendHttpUrl}\x1b[0m`);
        console.log(` Device ID         : \x1b[36m${config.deviceId}\x1b[0m`);
        console.log(` Computer Name     : \x1b[1m${config.deviceName}\x1b[0m`);
        console.log(` Paired Admin      : \x1b[32m${config.adminName || 'Administrator'}\x1b[0m`);
        console.log(` Enrolled At       : \x1b[90m${config.enrolledAt}\x1b[0m`);
        // 3. Active Session Banner
        if (session || state === 'ACTIVE_SESSION') {
            console.log('\n\x1b[41m\x1b[97m========================= ACTIVE REMOTE MANAGEMENT SESSION =========================\x1b[0m');
            console.log(` Administrator : \x1b[1m${session?.adminName || config.adminName || 'Admin'}\x1b[0m`);
            console.log(` Purpose       : ${session?.reason || 'Diagnostics'}`);
            console.log(` Streaming     : Telemetry dispatched every 5 seconds`);
            console.log(` Action        : \x1b[1;97mPress [k] to STOP SESSION immediately (Kill Switch)\x1b[0m`);
            console.log('\x1b[41m\x1b[97m====================================================================================\x1b[0m');
        }
        // 4. Live Telemetry Gauges
        console.log('\n\x1b[1mSystem Telemetry Snapshot:\x1b[0m');
        const cpuPct = telemetry.cpu?.usagePercent || 0;
        const cpuBar = this.createProgressBar(cpuPct, 20);
        console.log(` • CPU Usage   : [${cpuBar}] ${cpuPct}% (${telemetry.cpu?.coreCount || 1} Cores)`);
        const memTotal = telemetry.memory?.totalMb || 1;
        const memUsed = telemetry.memory?.usedMb || 0;
        const memPct = Math.round((memUsed / memTotal) * 100);
        const memBar = this.createProgressBar(memPct, 20);
        console.log(` • Memory      : [${memBar}] ${memPct}% (${memUsed} MB / ${memTotal} MB)`);
        if (telemetry.storage) {
            const stTotal = telemetry.storage.totalGb;
            const stUsed = telemetry.storage.usedGb;
            const stPct = stTotal > 0 ? Math.round((stUsed / stTotal) * 100) : 0;
            const stBar = this.createProgressBar(stPct, 20);
            console.log(` • Storage (C:): [${stBar}] ${stPct}% (${stUsed} GB / ${stTotal} GB)`);
        }
        if (telemetry.battery) {
            const bPct = telemetry.battery.level;
            const chg = telemetry.battery.isCharging ? '⚡ Charging' : 'Discharging';
            console.log(` • Battery     : \x1b[32m${bPct}%\x1b[0m (${chg})`);
        }
        else {
            console.log(` • Power       : AC Desktop / Direct Power`);
        }
        console.log(` • Network     : ${telemetry.network?.type || 'UNKNOWN'} (${telemetry.network?.ipAddress || '127.0.0.1'})`);
        console.log(` • Uptime      : ${Math.round(telemetry.uptimeSeconds || 0)} seconds`);
        // 5. Status Notice & Key Controls
        console.log('\n\x1b[90m--------------------------------------------------------------------------------\x1b[0m');
        console.log(` Status Notice : \x1b[33m${this.statusMessage}\x1b[0m`);
        console.log('\x1b[90m--------------------------------------------------------------------------------\x1b[0m');
        console.log('\x1b[1mControls:\x1b[0m');
        console.log(' [\x1b[36mt\x1b[0m] Refresh Telemetry   [\x1b[36ma\x1b[0m] Test Audible Alarm   [\x1b[36mr\x1b[0m] Reconnect');
        console.log(' [\x1b[31mk\x1b[0m] Stop Active Session [\x1b[31mu\x1b[0m] Unpair Device        [\x1b[33mq\x1b[0m] Exit Console');
    }
    createProgressBar(percentage, length) {
        const filled = Math.min(length, Math.max(0, Math.round((percentage / 100) * length)));
        const empty = length - filled;
        return '\x1b[32m' + '█'.repeat(filled) + '\x1b[90m' + '░'.repeat(empty) + '\x1b[0m';
    }
    async handleKey(keyName) {
        switch (keyName) {
            case 't':
                this.statusMessage = 'Telemetry manually refreshed.';
                this.render();
                break;
            case 'a':
                this.statusMessage = 'Audible alert triggered locally.';
                this.render();
                await commands_1.WindowsCommandHandler.execute(this.agent.getConfig().deviceId, 'RING_ALARM');
                break;
            case 'k':
                if (this.agent.getCurrentSession()) {
                    this.agent.stopActiveSession('Terminated via console kill switch');
                    this.statusMessage = 'Active session immediately terminated by owner.';
                }
                else {
                    this.statusMessage = 'No session currently active to stop.';
                }
                this.render();
                break;
            case 'r':
                this.statusMessage = 'Forcing immediate WebSocket reconnect...';
                this.render();
                this.agent.reconnect();
                break;
            case 'u':
                this.statusMessage = 'Unpairing device and destroying credentials...';
                this.render();
                config_1.ConfigManager.clear();
                this.agent.stop();
                console.log('\n\x1b[31m✓ Device un-enrolled and local credentials erased.\x1b[0m');
                this.exit();
                break;
            case 'q':
                this.exit();
                break;
        }
    }
    exit() {
        if (this.refreshTimer)
            clearInterval(this.refreshTimer);
        if (process.stdin.isTTY) {
            process.stdin.setRawMode(false);
        }
        console.log('\nExiting MERA Agent console. Background service remains active if registered.');
        process.exit(0);
    }
}
exports.WindowsAgentDashboard = WindowsAgentDashboard;
