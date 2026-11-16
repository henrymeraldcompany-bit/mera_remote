"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigManager = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
class ConfigManager {
    static getDirectory() {
        const localAppData = process.env.LOCALAPPDATA;
        if (localAppData) {
            return path_1.default.join(localAppData, 'MERA');
        }
        return path_1.default.join(os_1.default.homedir(), '.mera');
    }
    static getFilePath() {
        return path_1.default.join(this.getDirectory(), 'agent-config.json');
    }
    static isEnrolled() {
        const config = this.load();
        return !!(config && config.deviceId && config.agentToken);
    }
    static load() {
        try {
            const file = this.getFilePath();
            if (!fs_1.default.existsSync(file)) {
                // Fallback to legacy path
                const legacyFile = path_1.default.join(os_1.default.homedir(), '.mera', 'agent-config.json');
                if (fs_1.default.existsSync(legacyFile)) {
                    const raw = fs_1.default.readFileSync(legacyFile, 'utf8');
                    return JSON.parse(raw);
                }
                return null;
            }
            const raw = fs_1.default.readFileSync(file, 'utf8');
            return JSON.parse(raw);
        }
        catch {
            return null;
        }
    }
    static save(config) {
        const dir = this.getDirectory();
        if (!fs_1.default.existsSync(dir)) {
            fs_1.default.mkdirSync(dir, { recursive: true });
        }
        const file = this.getFilePath();
        fs_1.default.writeFileSync(file, JSON.stringify(config, null, 2), 'utf8');
        // Set file permissions to user-read/write only on Windows
        try {
            if (process.platform === 'win32') {
                // Use icacls to grant full control only to the current user
                const username = process.env.USERNAME || os_1.default.userInfo().username;
                const { execSync } = require('child_process');
                execSync(`icacls "${file}" /inheritance:r /grant:r "${username}:(R,W)"`, { stdio: 'ignore' });
            }
        }
        catch {
            // Non-fatal if icacls is unavailable
        }
    }
    static clear() {
        const file = this.getFilePath();
        if (fs_1.default.existsSync(file)) {
            fs_1.default.unlinkSync(file);
        }
        const legacyFile = path_1.default.join(os_1.default.homedir(), '.mera', 'agent-config.json');
        if (fs_1.default.existsSync(legacyFile)) {
            fs_1.default.unlinkSync(legacyFile);
        }
    }
    static getDefaultServerUrl() {
        return process.env.MERA_SERVER_URL || 'http://localhost:8080';
    }
}
exports.ConfigManager = ConfigManager;
