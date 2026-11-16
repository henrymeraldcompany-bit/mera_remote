"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WindowsPairingClient = void 0;
const os_1 = __importDefault(require("os"));
const crypto_1 = __importDefault(require("crypto"));
const readline_1 = __importDefault(require("readline"));
const shared_1 = require("@mera/shared");
const config_1 = require("./config");
class WindowsPairingClient {
    static printBranding() {
        console.clear();
        console.log('\x1b[36m');
        console.log(' ███╗   ███╗███████╗██████╗  █████╗ ');
        console.log(' ████╗ ████║██╔════╝██╔══██╗██╔══██╗');
        console.log(' ██╔████╔██║█████╗  ██████╔╝███████║');
        console.log(' ██║╚██╔╝██║██╔══╝  ██╔══██╗██╔══██║');
        console.log(' ██║ ╚═╝ ██║███████╗██║  ██║██║  ██║');
        console.log(' ╚═╝     ╚═╝╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝\x1b[0m');
        console.log('\x1b[1m MERA REMOTE MANAGEMENT — WINDOWS CLIENT AGENT\x1b[0m');
        console.log('\x1b[90m Transparent • Consent-First • Hardware-Secured\x1b[0m\n');
    }
    static async startPairing(serverUrl = config_1.ConfigManager.getDefaultServerUrl()) {
        this.printBranding();
        const tempDeviceId = 'win_tmp_' + crypto_1.default.randomUUID().replace(/-/g, '');
        const hostname = os_1.default.hostname();
        const osVersion = `Windows ${os_1.default.release()} (${os_1.default.arch()})`;
        const hardwareModel = `${os_1.default.cpus()[0]?.model || 'Generic PC'}`;
        console.log('\x1b[33m[!] DEVICE ENROLLMENT WIZARD\x1b[0m');
        console.log('This wizard will enroll this Windows computer into MERA Remote Management.');
        console.log('You will retain full control and visibility over this device.\n');
        console.log('\x1b[1mDevice Hardware Identity:\x1b[0m');
        console.log(` • Computer Name : \x1b[32m${hostname}\x1b[0m`);
        console.log(` • OS Version    : ${osVersion}`);
        console.log(` • Processor     : ${hardwareModel}`);
        console.log(` • MERA Server   : \x1b[34m${serverUrl}\x1b[0m\n`);
        const proceed = await this.promptUser('Do you confirm you are the owner and authorize enrollment? (yes/no): ');
        if (!proceed.toLowerCase().startsWith('y')) {
            console.log('\x1b[31mEnrollment cancelled by user.\x1b[0m');
            throw new Error('Enrollment cancelled by owner.');
        }
        console.log('\nContacting MERA Cloud Control Plane to generate pairing credentials...');
        // Step 1: Request pairing code
        const reqBody = {
            tempDeviceId,
            deviceType: shared_1.DeviceType.WINDOWS,
            deviceInfo: {
                hostname,
                osVersion,
                hardwareModel,
                appVersion: '1.0.0'
            }
        };
        const res = await fetch(`${serverUrl.trimEnd('/')}/api/v1/pairing/request`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(reqBody)
        });
        if (!res.ok) {
            const err = await res.text();
            throw new Error(`Failed to initiate pairing: HTTP ${res.status} - ${err}`);
        }
        const data = await res.json();
        console.log('\n\x1b[36m================================================================');
        console.log(`       YOUR ONE-TIME PAIRING CODE IS:   \x1b[1;97m[ ${data.pairingCode} ]\x1b[0;36m`);
        console.log('================================================================\x1b[0m');
        console.log('Instructions:');
        console.log(' 1. Open the \x1b[1mMERA Admin\x1b[0m application on your phone.');
        console.log(' 2. Navigate to "Add Device" / "Pair New Device".');
        console.log(` 3. Enter the 6-digit code: \x1b[1;36m${data.pairingCode}\x1b[0m`);
        console.log(` 4. This single-use code will expire in ${Math.round(data.expiresInSeconds / 60)} minutes.\n`);
        console.log('\x1b[90mListening for administrator claim...\x1b[0m');
        // Step 2: Poll for claim status with timer
        let claimedByAdminName = 'Administrator';
        const expiresAtTime = new Date(data.expiresAt).getTime();
        while (true) {
            await new Promise((r) => setTimeout(r, 2000));
            const remainingSec = Math.max(0, Math.round((expiresAtTime - Date.now()) / 1000));
            if (remainingSec <= 0) {
                throw new Error('Pairing session expired. Please run pairing again.');
            }
            try {
                const statusRes = await fetch(`${serverUrl.trimEnd('/')}/api/v1/pairing/status/${tempDeviceId}`);
                if (!statusRes.ok)
                    continue;
                const statusData = await statusRes.json();
                if (statusData.status === shared_1.PairingState.EXPIRED) {
                    throw new Error('Pairing session expired on server.');
                }
                if (statusData.status === shared_1.PairingState.PENDING_CONFIRMATION) {
                    if (statusData.claimedByAdminName) {
                        claimedByAdminName = statusData.claimedByAdminName;
                    }
                    break;
                }
            }
            catch (err) {
                if (err.message.includes('expired'))
                    throw err;
            }
        }
        // Step 3: Interactive owner confirmation
        console.log('\n\x1b[32m================================================================');
        console.log(` CLAIM RECEIVED: Administrator "${claimedByAdminName}"`);
        console.log(` has claimed pairing code [${data.pairingCode}]!`);
        console.log('================================================================\x1b[0m');
        console.log(`Do you authorize enrolling this computer under "${claimedByAdminName}"?`);
        const accepted = await this.promptUser('Type "yes" to accept, or "no" to decline: ');
        const isApproved = accepted.toLowerCase().startsWith('y');
        console.log(isApproved ? '\nConfirming enrollment with backend...' : '\nRejecting pairing...');
        // Step 4: Confirm with backend
        const confirmRes = await fetch(`${serverUrl.trimEnd('/')}/api/v1/pairing/confirm`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                tempToken: data.tempToken,
                accepted: isApproved
            })
        });
        if (!confirmRes.ok) {
            throw new Error(`Failed to complete pairing: ${await confirmRes.text()}`);
        }
        const confirmData = await confirmRes.json();
        if (!isApproved) {
            throw new Error('Pairing was rejected by device owner.');
        }
        const wsUrl = serverUrl.trimEnd('/').replace(/^http/, 'ws') + '/ws';
        const savedConfig = {
            deviceId: confirmData.deviceId,
            agentToken: confirmData.agentToken,
            backendHttpUrl: serverUrl,
            backendWsUrl: wsUrl,
            deviceName: hostname,
            adminName: claimedByAdminName,
            enrolledAt: new Date().toISOString(),
            onboardingCompleted: true,
            lastConnectedAt: new Date().toISOString()
        };
        config_1.ConfigManager.save(savedConfig);
        console.log('\n\x1b[32m✓ DEVICE SUCCESSFULLY ENROLLED!\x1b[0m');
        console.log(` • Assigned Device ID: \x1b[36m${confirmData.deviceId}\x1b[0m`);
        console.log(` • Paired Administrator: \x1b[32m${claimedByAdminName}\x1b[0m`);
        console.log(` • Configuration stored at: ${config_1.ConfigManager.getFilePath()}`);
        console.log('----------------------------------------------------------------\n');
        return savedConfig;
    }
    static promptUser(query) {
        const rl = readline_1.default.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        return new Promise((resolve) => {
            rl.question(query, (ans) => {
                rl.close();
                resolve(ans.trim());
            });
        });
    }
}
exports.WindowsPairingClient = WindowsPairingClient;
