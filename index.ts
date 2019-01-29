import 'signalr';
import { Observable, Subject } from 'rxjs';

// TODO : create ngrx action for connection error
interface SignalRError extends Error {
    context?: any;
    transport?: string;
    source?: string;
}

// TODO : create ngrx actions for connection state
const connecting = 'connecting';
const connected = 'connected';
const disconnected = 'disconnected';
const reconnecting = 'reconnecting';

const SignalRState = {
    connecting,
    connected,
    disconnected,
    reconnecting
}

const toSignalRState = (state: SignalR.ConnectionState): string => {
    switch (state) {
        case SignalR.ConnectionState.Connecting:
            return connecting;
        case SignalR.ConnectionState.Connected:
            return connected;
        case SignalR.ConnectionState.Disconnected:
            return disconnected;
        case SignalR.ConnectionState.Reconnecting:
            return reconnecting;
    }
}

class SignalRHub {
    private _connection: SignalR.Hub.Connection | undefined;
    private _proxy: SignalR.Hub.Proxy | undefined;
    private _startSubject = new Subject<void>();
    private _stateSubject = new Subject<string>();
    private _errorSubject = new Subject<SignalRError>();
    private _subjects: { [name: string]: Subject<any> };

    start$: Observable<void>;
    state$: Observable<string>;
    error$: Observable<SignalRError>;

    constructor(public hubName: string, public url: string | undefined) {
        this._subjects = {};

        this.start$ = this._startSubject.asObservable();
        this.state$ = this._stateSubject.asObservable();
        this.error$ = this._errorSubject.asObservable();
    }

    start() {
        if (!this._connection) {
            const { connection, error } = this.createConnection();
            if (error) {
                this._startSubject.error(error);
                return;
            }

            this._connection = connection;
        }

        if (!this._connection) {
            this._startSubject.error(new Error('Impossible to start the connection...'));
            return;
        }

        if (!this.hasSubscriptions()) {
            console.warn('No listeners have been setup. You need to setup a listener before starting the connection or you will not receive data.');
        }

        this._connection.start()
            .done(_ => this._startSubject.next())
            .fail((error) => this._startSubject.error(error));
    }

    on<T>(event: string): Observable<T> {
        if (!this._connection) {
            console.warn('The connection has not been started yet. Please start the connection by invoking the start method before attempting to listen to event type ' + event + '.');
            return new Observable<T>();
        }

        if (!this._proxy) {
            this._proxy = this._connection.createHubProxy(this.hubName);
        }

        const subject = this.getOrCreateSubject<T>(event);
        this._proxy.on(event, (data: T) => subject.next(data));

        return subject.asObservable();
    }

    send(method: string, ...args: any[]): Promise<any> {
        if (!this._connection) {
            return Promise.reject('The connection has not been started yet. Please start the connection by invoking the start method before attempting to send a message to the server.');
        }

        if (!this._proxy) {
            this._proxy = this._connection.createHubProxy(this.hubName);
        }

        return this._proxy.invoke(method, ...args);
    }

    hasSubscriptions(): boolean {
        for (let key in this._subjects) {
            if (this._subjects.hasOwnProperty(key)) {
                return true;
            }
        }

        return false;
    }

    // TODO : extract function
    private getOrCreateSubject<T>(event: string): Subject<T> {
        return this._subjects[event] || (this._subjects[event] = new Subject<T>());
    }

    // TODO : extract function
    private createConnection(): { connection?: SignalR.Hub.Connection, error?: Error } {
        if (!$) {
            return { error: new Error('jQuery is not defined.') }
        }
        if (!$.hubConnection) {
            return { error: new Error('The $.hubConnection function is not defined. Please check if you imported SignalR correctly.') }
        }

        const connection = $.hubConnection(this.url);

        if (!connection) {
            return { error: new Error("Impossible to create the hub '" + this.url + "'.") }
        }

        connection.error((error: SignalR.ConnectionError) =>
            this._errorSubject.next(error)
        );
        connection.stateChanged((state: SignalR.StateChanged) =>
            this._stateSubject.next(toSignalRState(state.newState))
        );

        return { connection };
    }
}

const hubs: SignalRHub[] = [];

const getHub = (hubName: string, url: string | undefined): SignalRHub | undefined => {
    return hubs.filter(h => h.hubName === hubName && h.url === url)[0];
}

const addHub = (hubName: string, url: string | undefined): SignalRHub => {
    const hub = new SignalRHub(hubName, url);
    hubs.push(hub);
    return hub;
}

const createSignalRHub = (hubName: string, url?: string | undefined): SignalRHub => {
    return getHub(hubName, url) || addHub(hubName, url);
}

export { SignalRError, SignalRState, createSignalRHub }; 