"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WindowsCommandHandler = void 0;
const os_1 = __importDefault(require("os"));
const child_process_1 = require("child_process");
const shared_1 = require("@mera/shared");
const telemetry_1 = require("./telemetry");
class WindowsCommandHandler {
    static async execute(deviceId, commandType, payload) {
        console.log(`[CommandHandler] Executing authorized command: ${commandType}`);
        switch (commandType) {
            case shared_1.CommandType.PING:
                return {
                    success: true,
                    result: {
                        message: 'PONG from MERA Windows Agent',
                        deviceId,
                        hostname: os_1.default.hostname(),
                        timestamp: new Date().toISOString()
                    }
                };
            case shared_1.CommandType.REQUEST_TELEMETRY: {
                const telemetry = telemetry_1.WindowsTelemetryCollector.collect(deviceId);
                return {
                    success: true,
                    result: telemetry
                };
            }
            case shared_1.CommandType.GET_SYSTEM_INFO:
                return {
                    success: true,
                    result: telemetry_1.WindowsTelemetryCollector.getStaticSystemInfo()
                };
            case 'RING_ALARM':
            case 'AUDIBLE_ALERT': {
                // Play legitimate system alert sound sequence to locate misplaced hardware
                return new Promise((resolve) => {
                    if (process.platform === 'win32') {
                        const psCmd = `powershell -NoProfile -Command "1..3 | ForEach-Object { [System.Media.SystemSounds]::Exclamation.Play(); Start-Sleep -Milliseconds 600 }"`;
                        (0, child_process_1.exec)(psCmd, (err) => {
                            if (err) {
                                resolve({ success: false, error: `Failed to trigger alert: ${err.message}` });
                            }
                            else {
                                resolve({
                                    success: true,
                                    result: { message: 'Audible alarm sound played on Windows device.' }
                                });
                            }
                        });
                    }
                    else {
                        resolve({ success: true, result: { message: 'Audible alarm simulated.' } });
                    }
                });
            }
            case shared_1.CommandType.LOCK_DEVICE: {
                // Legitimate standard Windows LockWorkStation API
                return new Promise((resolve) => {
                    if (process.platform === 'win32') {
                        (0, child_process_1.exec)('rundll32.exe user32.dll,LockWorkStation', (err) => {
                            if (err) {
                                resolve({
                                    success: false,
                                    error: `Failed to lock workstation: ${err.message}`
                                });
                            }
                            else {
                                console.log('[CommandHandler] Workstation locked by authorized remote management command.');
                                resolve({
                                    success: true,
                                    result: { message: 'Workstation successfully locked.' }
                                });
                            }
                        });
                    }
                    else {
                        resolve({ success: true, result: { message: 'Lock workstation simulated.' } });
                    }
                });
            }
            case shared_1.CommandType.DISCONNECT:
                return {
                    success: true,
                    result: { message: 'Session disconnected by request.' }
                };
            default:
                return {
                    success: false,
                    error: `Unsupported command: ${commandType}`
                };
        }
    }
}
exports.WindowsCommandHandler = WindowsCommandHandler;
