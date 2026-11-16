"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("./config");
const pairing_1 = require("./pairing");
const agent_1 = require("./agent");
const telemetry_1 = require("./telemetry");
const dashboard_1 = require("./dashboard");
const service_installer_1 = require("./service-installer");
async function main() {
    const args = process.argv.slice(2);
    if (args.includes('--help') || args.includes('-h')) {
        console.log('\x1b[1mMERA REMOTE MANAGEMENT — WINDOWS CLIENT AGENT\x1b[0m\n');
        console.log('Usage: mera-agent [OPTIONS]\n');
        console.log('Options:');
        console.log('  --pair               Run interactive first-launch enrollment wizard');
        console.log('  --status             Display device enrollment and live telemetry snapshot');
        console.log('  --dashboard          Launch the interactive terminal dashboard');
        console.log('  --unpair             Revoke and wipe local credentials');
        console.log('  --install-service    Register legitimate Windows background startup task');
        console.log('  --uninstall-service  Unregister Windows background startup task');
        console.log('  --service-status     Check Windows background task status');
        console.log('  --background         Run in headless background daemon mode');
        console.log('  --help, -h           Show this help message\n');
        return;
    }
    if (args.includes('--install-service')) {
        service_installer_1.WindowsServiceManager.install();
        return;
    }
    if (args.includes('--uninstall-service')) {
        service_installer_1.WindowsServiceManager.uninstall();
        return;
    }
    if (args.includes('--service-status')) {
        const status = service_installer_1.WindowsServiceManager.status();
        console.log(`Windows Background Service Installed: ${status.installed}`);
        if (status.details)
            console.log(status.details);
        return;
    }
    if (args.includes('--unpair')) {
        config_1.ConfigManager.clear();
        service_installer_1.WindowsServiceManager.uninstall();
        console.log('\x1b[32m✓ Device un-enrolled. Local credentials erased and background task removed.\x1b[0m');
        return;
    }
    if (args.includes('--status')) {
        const config = config_1.ConfigManager.load();
        if (!config) {
            console.log('\x1b[33mStatus: Device is NOT enrolled.\x1b[0m');
            console.log('Run "mera-agent --pair" to enroll this computer.');
        }
        else {
            console.log('\x1b[1mMERA Device Enrollment Status:\x1b[0m');
            console.log(` • Status        : \x1b[32mENROLLED\x1b[0m`);
            console.log(` • Device ID     : \x1b[36m${config.deviceId}\x1b[0m`);
            console.log(` • Computer Name : \x1b[1m${config.deviceName}\x1b[0m`);
            console.log(` • Paired Admin  : \x1b[32m${config.adminName || 'Administrator'}\x1b[0m`);
            console.log(` • Server HTTP   : ${config.backendHttpUrl}`);
            console.log(` • Server WS     : ${config.backendWsUrl}`);
            console.log(` • Enrolled At   : ${config.enrolledAt}`);
            console.log(` • Config Path   : ${config_1.ConfigManager.getFilePath()}\n`);
            console.log('\x1b[1mTelemetry Snapshot:\x1b[0m');
            console.log(JSON.stringify(telemetry_1.WindowsTelemetryCollector.collect(config.deviceId), null, 2));
        }
        return;
    }
    if (args.includes('--pair')) {
        try {
            const serverUrl = process.env.MERA_SERVER_URL || config_1.ConfigManager.getDefaultServerUrl();
            const config = await pairing_1.WindowsPairingClient.startPairing(serverUrl);
            const agent = new agent_1.WindowsAgent(config);
            agent.start();
            const dashboard = new dashboard_1.WindowsAgentDashboard(agent);
            dashboard.start();
        }
        catch (err) {
            console.error('\n\x1b[31mEnrollment failed:\x1b[0m', err.message);
            process.exit(1);
        }
        return;
    }
    // Default behavior
    let config = config_1.ConfigManager.load();
    if (!config) {
        pairing_1.WindowsPairingClient.printBranding();
        console.log('\x1b[33mNo existing enrollment found on this computer.\x1b[0m');
        console.log('Initiating interactive device enrollment wizard...\n');
        try {
            const serverUrl = process.env.MERA_SERVER_URL || config_1.ConfigManager.getDefaultServerUrl();
            config = await pairing_1.WindowsPairingClient.startPairing(serverUrl);
        }
        catch (err) {
            console.error('\x1b[31mEnrollment aborted:\x1b[0m', err.message);
            process.exit(1);
        }
    }
    const agent = new agent_1.WindowsAgent(config);
    agent.start();
    const isBackground = args.includes('--background') || !process.stdin.isTTY;
    if (!isBackground) {
        const dashboard = new dashboard_1.WindowsAgentDashboard(agent);
        dashboard.start();
    }
    else {
        console.log('[WindowsAgent] Running in background daemon mode.');
    }
    const shutdown = () => {
        console.log('\nStopping Windows Agent...');
        agent.stop();
        process.exit(0);
    };
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
}
main().catch((err) => {
    console.error('Fatal error in Windows Agent:', err);
    process.exit(1);
});
