"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WindowsAgent = void 0;
const ws_1 = __importDefault(require("ws"));
const crypto_1 = __importDefault(require("crypto"));
const shared_1 = require("@mera/shared");
const config_1 = require("./config");
const commands_1 = require("./commands");
const telemetry_1 = require("./telemetry");
class WindowsAgent {
    config;
    ws = null;
    isRunning = false;
    connectionState = 'DISCONNECTED';
    currentSession = null;
    telemetryInterval = null;
    heartbeatInterval = null;
    reconnectTimeout = null;
    retryAttempt = 0;
    // Event callbacks for UI/Dashboard
    onStateChanged;
    onSessionStarted;
    onSessionEnded;
    constructor(config) {
        this.config = config;
    }
    getState() {
        return this.connectionState;
    }
    getCurrentSession() {
        return this.currentSession;
    }
    getConfig() {
        return this.config;
    }
    start() {
        if (this.isRunning)
            return;
        this.isRunning = true;
        console.log(`[WindowsAgent] Starting agent for device: ${this.config.deviceName} (${this.config.deviceId})`);
        this.connect();
    }
    stop() {
        this.isRunning = false;
        this.cleanup();
        if (this.ws) {
            try {
                this.ws.close(1000, 'Agent stopped by user');
            }
            catch { }
            this.ws = null;
        }
        this.updateState('DISCONNECTED');
        console.log('[WindowsAgent] Agent stopped.');
    }
    reconnect() {
        if (this.reconnectTimeout)
            clearTimeout(this.reconnectTimeout);
        if (this.ws) {
            try {
                this.ws.close();
            }
            catch { }
            this.ws = null;
        }
        this.retryAttempt = 0;
        this.connect();
    }
    connect() {
        if (!this.isRunning)
            return;
        this.updateState('CONNECTING');
        const wsUrl = `${this.config.backendWsUrl}?deviceId=${encodeURIComponent(this.config.deviceId)}&token=${encodeURIComponent(this.config.agentToken)}`;
        console.log(`[WindowsAgent] Connecting to ${this.config.backendWsUrl}...`);
        try {
            this.ws = new ws_1.default(wsUrl);
            this.ws.on('open', () => {
                this.retryAttempt = 0;
                this.updateState('CONNECTED');
                console.log('\n\x1b[32m✓ [WindowsAgent] Connected to MERA Cloud Control Plane.\x1b[0m');
                console.log(`  Device ID : ${this.config.deviceId}`);
                console.log(`  Presence  : ONLINE (Standby for authorized sessions)\n`);
                this.config.lastConnectedAt = new Date().toISOString();
                config_1.ConfigManager.save(this.config);
                this.startHeartbeat();
            });
            this.ws.on('message', (data) => {
                try {
                    const msg = JSON.parse(data.toString());
                    this.handleMessage(msg);
                }
                catch (err) {
                    console.error('[WindowsAgent] Failed to parse message:', err);
                }
            });
            this.ws.on('close', (code, reason) => {
                console.log(`[WindowsAgent] Disconnected (Code: ${code}, Reason: ${reason.toString()})`);
                this.cleanup();
                this.updateState('DISCONNECTED');
                if (this.isRunning) {
                    const backoffMs = Math.min(30000, 3000 * Math.pow(2, Math.min(this.retryAttempt, 3)));
                    this.retryAttempt++;
                    console.log(`[WindowsAgent] Reconnecting in ${Math.round(backoffMs / 1000)} seconds (Attempt ${this.retryAttempt})...`);
                    this.reconnectTimeout = setTimeout(() => this.connect(), backoffMs);
                }
            });
            this.ws.on('error', (err) => {
                console.error('[WindowsAgent] WebSocket error:', err.message);
            });
        }
        catch (err) {
            console.error('[WindowsAgent] Error initializing connection:', err.message);
            this.cleanup();
            if (this.isRunning) {
                this.reconnectTimeout = setTimeout(() => this.connect(), 5000);
            }
        }
    }
    startHeartbeat() {
        if (this.heartbeatInterval)
            clearInterval(this.heartbeatInterval);
        this.heartbeatInterval = setInterval(() => {
            if (this.ws && this.ws.readyState === ws_1.default.OPEN) {
                this.sendMessage({
                    id: crypto_1.default.randomUUID(),
                    type: shared_1.WSMessageType.HEARTBEAT_PING,
                    timestamp: new Date().toISOString(),
                    payload: {}
                });
            }
        }, 25000);
    }
    handleMessage(msg) {
        switch (msg.type) {
            case shared_1.WSMessageType.HEARTBEAT_PONG:
                // Keepalive acknowledged
                break;
            case shared_1.WSMessageType.SESSION_REQUEST: {
                const payload = msg.payload;
                console.log('\n\x1b[41m\x1b[97m=================================================================\x1b[0m');
                console.log(`\x1b[1;31m⚠️ REMOTE SESSION REQUEST RECEIVED\x1b[0m`);
                console.log(` Administrator : \x1b[1m${payload.adminName || 'Admin'}\x1b[0m`);
                console.log(` Stated Purpose: ${payload.reason || 'Remote assistance'}`);
                console.log(` Session ID    : ${payload.sessionId}`);
                console.log('\x1b[41m\x1b[97m=================================================================\x1b[0m\n');
                const sessionInfo = {
                    sessionId: payload.sessionId,
                    adminName: payload.adminName || 'Admin',
                    reason: payload.reason || 'Remote support',
                    startedAt: new Date().toISOString()
                };
                this.currentSession = sessionInfo;
                this.updateState('ACTIVE_SESSION');
                // Respond with explicit authorization
                this.sendMessage({
                    id: crypto_1.default.randomUUID(),
                    type: shared_1.WSMessageType.SESSION_RESPONSE,
                    sessionId: payload.sessionId,
                    timestamp: new Date().toISOString(),
                    payload: {
                        sessionId: payload.sessionId,
                        accepted: true,
                        reason: 'Authorized per enrollment policy'
                    }
                });
                if (this.onSessionStarted) {
                    this.onSessionStarted(sessionInfo);
                }
                this.startTelemetryStreaming();
                break;
            }
            case shared_1.WSMessageType.SESSION_TERMINATED: {
                const termBy = msg.payload?.terminatedBy || 'Administrator';
                console.log(`\n\x1b[33m[WindowsAgent] Remote session terminated by ${termBy}.\x1b[0m`);
                this.stopActiveSessionInternal('Terminated by administrator');
                break;
            }
            case shared_1.WSMessageType.COMMAND_EXECUTE: {
                const payload = msg.payload;
                this.handleCommand(payload, msg.sessionId);
                break;
            }
            case shared_1.WSMessageType.ERROR: {
                console.warn('[WindowsAgent] Backend error notice:', msg.payload?.message);
                break;
            }
        }
    }
    async handleCommand(payload, sessionId) {
        const outcome = await commands_1.WindowsCommandHandler.execute(this.config.deviceId, payload.commandType, payload.payload);
        this.sendMessage({
            id: crypto_1.default.randomUUID(),
            type: shared_1.WSMessageType.COMMAND_RESULT,
            sessionId,
            timestamp: new Date().toISOString(),
            payload: {
                commandId: payload.commandId,
                success: outcome.success,
                result: outcome.result,
                error: outcome.error
            }
        });
    }
    stopActiveSession(reason = 'Terminated by computer owner') {
        if (!this.currentSession)
            return;
        const sessionId = this.currentSession.sessionId;
        console.log(`\x1b[31m[KillSwitch] Stopping active session: ${sessionId}\x1b[0m`);
        this.sendMessage({
            id: crypto_1.default.randomUUID(),
            type: shared_1.WSMessageType.SESSION_TERMINATED,
            sessionId,
            timestamp: new Date().toISOString(),
            payload: { sessionId, reason, terminatedBy: 'AGENT' }
        });
        this.stopActiveSessionInternal(reason);
    }
    stopActiveSessionInternal(reason) {
        this.stopTelemetryStreaming();
        this.currentSession = null;
        this.updateState(this.ws?.readyState === ws_1.default.OPEN ? 'CONNECTED' : 'DISCONNECTED');
        if (this.onSessionEnded) {
            this.onSessionEnded(reason);
        }
    }
    startTelemetryStreaming() {
        if (this.telemetryInterval)
            clearInterval(this.telemetryInterval);
        // Stream telemetry every 5 seconds during active session
        this.telemetryInterval = setInterval(() => {
            if (this.ws && this.ws.readyState === ws_1.default.OPEN && this.currentSession) {
                const telemetry = telemetry_1.WindowsTelemetryCollector.collect(this.config.deviceId);
                this.sendMessage({
                    id: crypto_1.default.randomUUID(),
                    type: shared_1.WSMessageType.TELEMETRY_STREAM,
                    sessionId: this.currentSession.sessionId,
                    timestamp: new Date().toISOString(),
                    payload: telemetry
                });
            }
        }, 5000);
    }
    stopTelemetryStreaming() {
        if (this.telemetryInterval) {
            clearInterval(this.telemetryInterval);
            this.telemetryInterval = null;
        }
    }
    sendMessage(msg) {
        if (this.ws && this.ws.readyState === ws_1.default.OPEN) {
            this.ws.send(JSON.stringify(msg));
        }
    }
    updateState(newState) {
        this.connectionState = newState;
        if (this.onStateChanged) {
            this.onStateChanged(newState);
        }
    }
    cleanup() {
        if (this.heartbeatInterval)
            clearInterval(this.heartbeatInterval);
        if (this.telemetryInterval)
            clearInterval(this.telemetryInterval);
        if (this.reconnectTimeout)
            clearTimeout(this.reconnectTimeout);
        this.currentSession = null;
    }
}
exports.WindowsAgent = WindowsAgent;
