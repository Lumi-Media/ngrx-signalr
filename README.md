# ngrx-signalr

A library to handle realtime SignalR (.NET Framework) events using angular, rxjs and the @ngrx library.

*This library is made for the SignalR client using .NET Framework. If you need target .NET Core, please check this repository : https://github.com/Odonno/ngrx-signalr-core*

## Get started

### Install dependencies

Once you created your angular project, you need to install all the libraries required to create the communication between angular and a SignalR hub.

```
npm install rxjs --save
npm install @ngrx/store @ngrx/effects --save
npm install ngrx-signalr --save
```

Don't forget to add the dependency in the `angular.json` file so angular will automatically inject the `$` and `$.hubConnection` function used to initialize signalr.

```
npm install jquery signalr --save
npm install @types/signalr @types/jquery --save-dev
```

```json
{
    "projects": {
        "architect": {
            "build": {
                "scripts": [
                    "./node_modules/jquery/dist/jquery.js",
                    "./node_modules/signalr/jquery.signalR.js"
                ]
            }
        }
    }
}
```

Once everything is installed, you can use the reducer and the effects inside the `AppModule`.

```js
@NgModule({
    ...,
    imports: [
        StoreModule.forRoot({ signalr: signalrReducer }),
        EffectsModule.forRoot([SignalREffects, AppEffects])
    ],
    ...
})
export class AppModule { }
```

### Start with a single Hub

First, you will start the application by dispatching the creation of one Hub.

```ts
const hub = {
    name: 'hub name',
    url: 'https://localhost/path'
};

this.store.dispatch(
    createSignalRHub(hub)
);
```

Then you will create an effect to start listening to events before starting the Hub.

```ts
initRealtime$ = createEffect(() => 
    this.actions$.pipe(
        ofType(SIGNALR_HUB_UNSTARTED),
        mergeMap(action => {
            const hub = findHub(action);

            if (!hub) {
                return of(realtimeError(new Error('No SignalR Hub found...')));
            }

            // add event listeners
            const whenEvent$ = hub.on('eventName').pipe(
                map(x => createAction(x))
            );

            return merge(
                whenEvent$,
                of(startSignalRHub(hub))
            );
        })
    )
);
```

You can also send events at anytime.

```ts
sendEvent$ = createEffect(() => 
    this.actions$.pipe(
        ofType(SEND_EVENT),
        mergeMap(action => {
            const hub = findHub(action);

            if (!hub) {
                return of(realtimeError(new Error('No SignalR Hub found...')));
            }

            return hub.send('eventName', params).pipe(
                map(_ => sendEventFulfilled()),
                catchError(error => of(sendEventFailed(error)))
            );
        })
    )
);
```

### Using multiple Hubs

Now, start with multiple hubs at a time.

```ts
const dispatchHubCreation = (hub) => this.store.dispatch(createSignalRHub(hub));

const hub1 = {}; // define name and url
const hub2 = {}; // define name and url
const hub3 = {}; // define name and url

dispatchHubCreation(hub1);
dispatchHubCreation(hub2);
dispatchHubCreation(hub3);
```

You will then initialize your hubs in the same way but you need to know which one is initialized.

```ts
const hub1 = {}; // define name and url
const hub2 = {}; // define name and url

initHubOne$ = createEffect(() => 
    this.actions$.pipe(
        ofType(SIGNALR_HUB_UNSTARTED),
        ofHub(hub1),
        mergeMap(action => {
            // TODO : init hub 1
        })
    )
);

initHubTwo$ = createEffect(() => 
    this.actions$.pipe(
        ofType(SIGNALR_HUB_UNSTARTED),
        ofHub(hub2),
        mergeMap(action => {
            // TODO : init hub 2
        })
    )
);
```

And then you can start your app when all hubs are connected the first time.

```ts
appStarted$ = createEffect(() => 
    this.store.select(selectAreAllHubsConnected).pipe(
        filter(areAllHubsConnected => !!areAllHubsConnected),
        first(),
        map(_ => of(appStarted()))
    )
);
```

## Features

### SignalR Hub

The SignalR Hub is an abstraction of the hub connection. It contains function you can use to:

* start the connection
* listen to events emitted
* send a new event

```ts
interface ISignalRHub {
    hubName: string;
    url: string | undefined;
    
    start$: Observable<void>;
    state$: Observable<string>;
    error$: Observable<SignalR.ConnectionError>;

    constructor(hubName: string, url: string | undefined);

    start(options?: SignalR.ConnectionOptions | undefined): Observable<void>;
    on<T>(event: string): Observable<T>;
    send(method: string, ...args: any[]): Observable<any>;
    hasSubscriptions(): boolean;
}
```

You can find an existing hub by its name and url.

```ts
function findHub(hubName: string, url?: string | undefined): ISignalRHub | undefined;
function findHub({ hubName, url }: {
    hubName: string;
    url?: string | undefined;
}): ISignalRHub | undefined;
```

And create a new hub.

```ts
function createHub(hubName: string, url?: string | undefined): ISignalRHub;
```

### State

The state contains all existing hubs that was created with their according status (unstarted, connecting, connected, disconnected, reconnecting).

```ts
const unstarted = "unstarted";
const connecting = "connecting";
const connected = "connected";
const disconnected = "disconnected";
const reconnecting = "reconnecting";

type SignalRHubState = 
    | typeof unstarted 
    | typeof connecting 
    | typeof connected 
    | typeof disconnected 
    | typeof reconnecting;

type SignalRHubStatus = {
    hubName: string;
    url: string | undefined;
    state: SignalRHubState | undefined;
};
```

```ts
class BaseSignalRStoreState {
    hubStatuses: SignalRHubStatus[];
}
```

### Actions

#### Actions to dispatch

`createSignalRHub` will initialize a new hub connection but it won't start the connection so you can create event listeners.

```ts
const createSignalRHub = createAction(
    '@ngrx/signalr/createHub',
    props<{ hubName: string, url?: string | undefined }>()
);
```

`startSignalRHub` will start the hub connection so you can send and receive events.

```ts
const startSignalRHub = createAction(
    '@ngrx/signalr/startHub',
    props<{ hubName: string, url?: string | undefined, options?: SignalR.ConnectionOptions | undefined }>()
);
```

### Effects

```ts
// create hub automatically
createHub$: Observable<{
    type: string;
    hubName: string;
    url: string | undefined;
}>;
```

```ts
// listen to start result (success/fail)
// listen to change connection state (connecting, connected, disconnected, reconnecting)
// listen to hub error
beforeStartHub$: Observable<{
    type: string;
    hubName: string;
    url: string | undefined;
    error: any;
} | {
    type: string;
    hubName: string;
    url: string | undefined;
} | {
    type: string;
    hubName: string;
    url: string | undefined;
    error: SignalR.ConnectionError;
}>;
```

```ts
// start hub automatically
startHub$: Observable<SignalRStartHubAction>;
```

### Selectors

```ts
// used to select all hub statuses in state
const hubStatuses$ = store.select(selectHubsStatuses);

// used to select a single hub status based on its name and url
const hubStatus$ = store.select(selectHubStatus, { hubName, url });

// used to know if all hubs are connected
const areAllHubsConnected$ = store.select(selectAreAllHubsConnected);
```

## Publish a new version

First compile using `tsc` and then publish to npm registry.

```
tsc
npm publish --access public
```
