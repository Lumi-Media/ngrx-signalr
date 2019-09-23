import 'signalr';
import { createAction, props, union } from '@ngrx/store';

export const createSignalRHub = createAction(
    '[NGRX SignalR]  createHub',
    props<{ hubName: string, url?: string | undefined }>()
);

export const SIGNALR_HUB_UNSTARTED = '[NGRX SignalR]  hubCreated';
export const signalrHubUnstarted = createAction(
    SIGNALR_HUB_UNSTARTED,
    props<{ hubName: string, url?: string | undefined }>()
);

export const startSignalRHub = createAction(
    '[NGRX SignalR]  startHub',
    props<{ hubName: string, url?: string | undefined, options?: SignalR.ConnectionOptions | undefined,  beforeConnectionStart?: (connection : SignalR.Hub.Connection | undefined) => void }>()
);

export const stopSignalRHub = createAction(
    '[NGRX SignalR]  stopHub',
    props<{hubName: string, url?: string, async?: boolean, notifyServer?: boolean}>()
)

export const SIGNALR_HUB_FAILED_TO_START = '[NGRX SignalR]  hubFailedToStart';
export const signalrHubFailedToStart = createAction(
    SIGNALR_HUB_FAILED_TO_START,
    props<{ hubName: string, url?: string | undefined, error: any }>()
);

export const SIGNALR_CONNECTING = '[NGRX SignalR]  connecting';
export const signalrConnecting = createAction(
    SIGNALR_CONNECTING,
    props<{ hubName: string, url?: string | undefined }>()
);

export const SIGNALR_CONNECTED = '[NGRX SignalR]  connected';
export const signalrConnected = createAction(
    SIGNALR_CONNECTED,
    props<{ hubName: string, url?: string | undefined }>()
);

export const SIGNALR_DISCONNECTED = '[NGRX SignalR]  disconnected';
export const signalrDisconnected = createAction(
    SIGNALR_DISCONNECTED,
    props<{ hubName: string, url?: string | undefined }>()
);

export const SIGNALR_RECONNECTING = '[NGRX SignalR]  reconnecting';
export const signalrReconnecting = createAction(
    SIGNALR_RECONNECTING,
    props<{ hubName: string, url?: string | undefined }>()
);

export const SIGNALR_ERROR = '[NGRX SignalR]  error';
export const signalrError = createAction(
    SIGNALR_ERROR,
    props<{ hubName: string, url?: string | undefined, error: SignalR.ConnectionError }>()
);

export const hubNotFound = createAction(
    '[NGRX SignalR]  hubNotFound',
    props<{ hubName: string, url?: string | undefined }>()
);

const signalRAction = union({
    createSignalRHub,
    signalrHubUnstarted,
    startSignalRHub,
    signalrHubFailedToStart,
    signalrConnecting,
    signalrConnected,
    signalrDisconnected,
    signalrReconnecting,
    signalrError,
    hubNotFound
});
export type SignalRAction = typeof signalRAction;