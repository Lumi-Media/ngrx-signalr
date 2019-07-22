/// <reference types="signalr" />
import { HubKeyDefinition } from "./models";
declare const unstarted = "unstarted";
declare const connecting = "connecting";
declare const connected = "connected";
declare const disconnected = "disconnected";
declare const reconnecting = "reconnecting";
export declare const SignalRStates: {
    unstarted: string;
    connecting: string;
    connected: string;
    disconnected: string;
    reconnecting: string;
};
export declare const toSignalRState: (state: SignalR.ConnectionState) => string;
export declare type SignalRHubState = typeof unstarted | typeof connecting | typeof connected | typeof disconnected | typeof reconnecting;
export declare type SignalRHubStatus = HubKeyDefinition & {
    state: SignalRHubState;
};
export {};
