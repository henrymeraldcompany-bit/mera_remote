"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WindowsServiceManager = exports.TASK_NAME = void 0;
const child_process_1 = require("child_process");
const path_1 = __importDefault(require("path"));
exports.TASK_NAME = 'MeraRemoteAgent';
const SCRIPT_PATH = path_1.default.resolve(__dirname, 'index.js');
const NODE_EXE = process.execPath;
class WindowsServiceManager {
    static install() {
        console.log(`\n[ServiceManager] Registering legitimate Windows background task: "${exports.TASK_NAME}"`);
        console.log(`Target executable: "${NODE_EXE}" "${SCRIPT_PATH}" --background`);
        try {
            // Use schtasks to register an explicit, transparent task
            const cmd = `schtasks /create /tn "${exports.TASK_NAME}" /tr "\"${NODE_EXE}\" \"${SCRIPT_PATH}\" --background" /sc onlogon /rl limited /f`;
            (0, child_process_1.execSync)(cmd, { stdio: 'inherit' });
            console.log(`\x1b[32m✓ Windows Task "${exports.TASK_NAME}" successfully registered.\x1b[0m`);
            console.log(`Description: MERA Remote Management - Authorized client agent for enrolled Windows devices.`);
            console.log(`Task can be inspected at any time in Windows Task Scheduler (taskschd.msc).\n`);
            return true;
        }
        catch (err) {
            console.error(`\x1b[31mFailed to register task: ${err.message}\x1b[0m`);
            return false;
        }
    }
    static uninstall() {
        console.log(`\n[ServiceManager] Removing Windows background task: "${exports.TASK_NAME}"`);
        try {
            const cmd = `schtasks /delete /tn "${exports.TASK_NAME}" /f`;
            (0, child_process_1.execSync)(cmd, { stdio: 'inherit' });
            console.log(`\x1b[32m✓ Windows Task "${exports.TASK_NAME}" successfully removed.\x1b[0m\n`);
            return true;
        }
        catch (err) {
            console.warn(`Task removal notice: ${err.message}`);
            return false;
        }
    }
    static status() {
        try {
            const out = (0, child_process_1.execSync)(`schtasks /query /tn "${exports.TASK_NAME}" /fo list`, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
            return { installed: true, details: out.trim() };
        }
        catch {
            return { installed: false };
        }
    }
    static start() {
        try {
            (0, child_process_1.execSync)(`schtasks /run /tn "${exports.TASK_NAME}"`, { stdio: 'inherit' });
            console.log(`\x1b[32m✓ Triggered start of task "${exports.TASK_NAME}".\x1b[0m`);
            return true;
        }
        catch (err) {
            console.error(`Failed to start task: ${err.message}`);
            return false;
        }
    }
    static stop() {
        try {
            (0, child_process_1.execSync)(`schtasks /end /tn "${exports.TASK_NAME}"`, { stdio: 'inherit' });
            console.log(`\x1b[32m✓ Stopped task "${exports.TASK_NAME}".\x1b[0m`);
            return true;
        }
        catch (err) {
            console.warn(`Failed to stop task: ${err.message}`);
            return false;
        }
    }
}
exports.WindowsServiceManager = WindowsServiceManager;
if (require.main === module) {
    const action = process.argv[2];
    if (action === 'install') {
        WindowsServiceManager.install();
    }
    else if (action === 'uninstall') {
        WindowsServiceManager.uninstall();
    }
    else if (action === 'status') {
        const res = WindowsServiceManager.status();
        console.log(`Task installed: ${res.installed}`);
        if (res.details)
            console.log(res.details);
    }
    else {
        console.log('Usage: node service-installer.js [install|uninstall|status]');
    }
}
