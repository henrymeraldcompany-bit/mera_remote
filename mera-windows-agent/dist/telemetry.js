"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WindowsTelemetryCollector = void 0;
const os_1 = __importDefault(require("os"));
const fs_1 = __importDefault(require("fs"));
const child_process_1 = require("child_process");
let cachedBattery = null;
class WindowsTelemetryCollector {
    static getBatteryInfo() {
        if (process.platform !== 'win32')
            return undefined;
        const now = Date.now();
        if (cachedBattery && now - cachedBattery.timestamp < 15000) {
            return { level: cachedBattery.level, isCharging: cachedBattery.isCharging };
        }
        try {
            const out = (0, child_process_1.execSync)('powershell -NoProfile -Command "(Get-CimInstance Win32_Battery -ErrorAction SilentlyContinue | Select-Object -First 1 EstimatedChargeRemaining, BatteryStatus) | ConvertTo-Json -Compress"', { timeout: 2000, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
            if (!out || out === '{}')
                return undefined;
            const parsed = JSON.parse(out);
            if (typeof parsed.EstimatedChargeRemaining === 'number') {
                const level = Math.min(100, Math.max(0, parsed.EstimatedChargeRemaining));
                // BatteryStatus 2 = Charging, 1 = Discharging/Battery, 6 = Charging, etc.
                const isCharging = parsed.BatteryStatus === 2 || parsed.BatteryStatus === 6;
                cachedBattery = { level, isCharging, timestamp: now };
                return { level, isCharging };
            }
        }
        catch {
            // Desktop PC or battery query timed out
        }
        return undefined;
    }
    static getStorageInfo() {
        try {
            const targetDrive = process.env.SystemDrive ? `${process.env.SystemDrive}\\` : 'C:\\';
            if (typeof fs_1.default.statfsSync === 'function') {
                const stats = fs_1.default.statfsSync(targetDrive);
                const totalBytes = stats.blocks * stats.bsize;
                const freeBytes = stats.bfree * stats.bsize;
                const usedBytes = totalBytes - freeBytes;
                return {
                    totalGb: Math.round((totalBytes / (1024 * 1024 * 1024)) * 100) / 100,
                    freeGb: Math.round((freeBytes / (1024 * 1024 * 1024)) * 100) / 100,
                    usedGb: Math.round((usedBytes / (1024 * 1024 * 1024)) * 100) / 100
                };
            }
        }
        catch { }
        return undefined;
    }
    static collect(deviceId) {
        const cpus = os_1.default.cpus();
        const totalMem = os_1.default.totalmem();
        const freeMem = os_1.default.freemem();
        const usedMem = totalMem - freeMem;
        // Calculate approximate CPU usage
        let totalIdle = 0;
        let totalTick = 0;
        cpus.forEach((cpu) => {
            for (const type in cpu.times) {
                totalTick += cpu.times[type];
            }
            totalIdle += cpu.times.idle;
        });
        const cpuUsagePercent = Math.min(100, Math.max(0, Math.round((1 - totalIdle / (totalTick || 1)) * 100)));
        // Discover active non-internal IPv4 address
        let activeIp = '127.0.0.1';
        let netType = 'UNKNOWN';
        const networkInterfaces = os_1.default.networkInterfaces();
        for (const name in networkInterfaces) {
            const ifaceList = networkInterfaces[name];
            if (!ifaceList)
                continue;
            for (const iface of ifaceList) {
                if (!iface.internal && iface.family === 'IPv4') {
                    activeIp = iface.address;
                    const lower = name.toLowerCase();
                    if (lower.includes('wi-fi') || lower.includes('wlan') || lower.includes('wireless')) {
                        netType = 'WIFI';
                    }
                    else if (lower.includes('eth') || lower.includes('ethernet')) {
                        netType = 'ETHERNET';
                    }
                    break;
                }
            }
        }
        const battery = this.getBatteryInfo();
        const storage = this.getStorageInfo();
        return {
            deviceId,
            timestamp: new Date().toISOString(),
            cpu: {
                usagePercent: cpuUsagePercent,
                coreCount: cpus.length
            },
            memory: {
                totalMb: Math.round(totalMem / (1024 * 1024)),
                freeMb: Math.round(freeMem / (1024 * 1024)),
                usedMb: Math.round(usedMem / (1024 * 1024))
            },
            storage,
            battery,
            network: {
                type: netType,
                ipAddress: activeIp
            },
            uptimeSeconds: Math.round(os_1.default.uptime())
        };
    }
    static getStaticSystemInfo() {
        const cpus = os_1.default.cpus();
        return {
            computerName: os_1.default.hostname(),
            platform: 'Windows',
            osVersion: `Windows ${os_1.default.release()} (${os_1.default.arch()})`,
            appVersion: '1.0.0',
            cpuModel: cpus[0]?.model || 'Generic CPU',
            cpuCores: cpus.length,
            totalMemoryMb: Math.round(os_1.default.totalmem() / (1024 * 1024)),
            systemDrive: process.env.SystemDrive || 'C:',
            username: os_1.default.userInfo().username
        };
    }
}
exports.WindowsTelemetryCollector = WindowsTelemetryCollector;
