import {
    SyncingRequest,
    SyncingResponse,
    DataType,
    ClientChange,
    ClientChangeList,
    SetOperation
} from './';

import { server as valueStrategy } from './strategies/value';
import { server as incrementStrategy } from './strategies/increment';

const hasOwnProperty = Object.prototype.hasOwnProperty;

export interface ServerDataItem<T> {
    id: string;
    type: DataType;
    timestamp: number;
    value: T;
}

export interface ServerValueDataItem<T>
extends ServerDataItem<T> {
    lastModifiedTime: number;
}

export interface ServerIncrementDataItem
extends ServerDataItem<number> {
    uids: string[];
}

export interface ServerSetElementOperationInfo {
    operation: SetOperation;
    time: number;
}

export type ClientTimeCalibrator = (clientTime: number) => number;

export interface ServerChangeStrategy<T extends ClientChange> {
    /**
     * @param item Target data item to apply the change to.
     * @param list List of changes that sent from the client.
     * @return A boolean indicates whether the value of this item requires
     * to be synchronized to the client.
     */
    apply(
        item: ServerDataItem<any>,
        list: ClientChangeList<T>,
        calibrator: ClientTimeCalibrator
    ): boolean;

    /**
     * This method is for data type like 'set', of which the data is stored as
     * a hash set on server but expected to be an array on client.
     * @param item Target data item that changed during the synchronization.
     * @return A detailed value instead of a change for the client to update.
     */
    getClientValue?<T>(item: ServerDataItem<any>): T;
}

export class ServerStore {
    private items: HashTable<ServerDataItem<any>> = Object.create(null);

    get<T extends ServerDataItem<any>>(id: string): T {
        return hasOwnProperty.call(this.items, id) ?
            this.items[id] as T : undefined;
    }

    set(id: string, item: ServerDataItem<any>): void {
        this.items[id] = item;
    }

    getAll<T extends ServerDataItem<any>>(): T[] {
        let items = this.items;
        return Object
            .keys(items)
            .map(id => items[id] as T);
    }
}

/**
 * Strategy table with predefined server-side strategies.
 */
let strategies: HashTable<ServerChangeStrategy<ClientChange>> = {
    /** Strategy that handles changes of normal value. */
    value: valueStrategy,
    /** Strategy that handles changes of an increment. */
    increment: incrementStrategy
};

export class Server {
    constructor(
        public store: ServerStore
    ) { }

    /**
     * Get changed items from server-side, usually items updated by other
     * clients.
     *
     * @param lastTimestamp The timestamp from client that distinguishes
     * changes from server that needs to be sent to client.
     */
    private getChangedItems(lastTimestamp: number): ServerDataItem<any>[] {
        return this
            .store
            .getAll()
            .filter(item => item.timestamp > lastTimestamp);
    }

    /**
     * Apply changes in the change list to a item in store.
     *
     * Instead of `if` branches, we use predefined strategies that match
     * specific types of changes to handle changes from client.
     *
     * To do so, we also make the abstract operations of how changes get
     * applied to the server store much more clear.
     *
     * @param id The unique ID for the item to update.
     * @param changeList List of changes to be applied.
     * @param now Server time of the synchronizing request.
     * @param calibrator A function that calibrates client side timestamp.
     * @return A boolean indicates whether the value of this item requires
     * to be synchronized to the client.
     */
    private applyClientChangeList(
        id: string,
        changeList: ClientChangeList<ClientChange>,
        now: number,
        calibrator: ClientTimeCalibrator
    ): boolean {
        let type = changeList.type;

        let strategy = strategies[type];

        if (!strategy) {
            throw new TypeError('Invalid data type');
        }

        let item: ServerDataItem<any> = this.store.get(id);

        if (item) {
            item.timestamp = now;
        } else {
            item = {
                id,
                type,
                timestamp: now,
                value: undefined
            };
        }

        let syncToClient = strategy.apply(item, changeList, calibrator);

        this.store.set(id, item);

        return syncToClient;
    }

    /**
     * Apply client changes to items in store, it calls `applyClientChangeList`
     * to update specific items.
     *
     * @param changeLists Change lists to be applied.
     * @param now Server time of the synchronizing request.
     * @param clientTimeOffset An estimated offset between client and server
     * time.
     * @return A table of booleans in which every boolean indicates whether the
     * value of a item requires to be synchronized to the client.
     */
    private applyClientChanges(
        changeLists: HashTable<ClientChangeList<ClientChange>>,
        now: number,
        clientTimeOffset: number
    ): HashTable<boolean> {
        let clientTimeCalibrator: ClientTimeCalibrator = clientTime => {
            return Math.min(clientTime + clientTimeOffset, now);
        };

        let excludes: HashTable<boolean> = Object.create(null);

        let store = this.store;

        for (let id of Object.keys(changeLists)) {
            let syncToClient = this.applyClientChangeList(id, changeLists[id], now, clientTimeCalibrator);

            if (!syncToClient) {
                excludes[id] = true;
            }
        }

        return excludes;
    }

    /**
     * Prepare the synchronizing response to the client.
     *
     * @param lastTimestamp The timestamp from client that distinguishes
     * changes from server that needs to be sent to client.
     * @param now Server time of the synchronizing request.
     * @param excludes A hash table of booleans that represents items to
     * exclude while fetching server-side changes.
     * @return The synchronizing response generated for the client.
     */
    private prepareSyncingResponse(lastTimestamp: number, now: number, excludes: HashTable<boolean>): SyncingResponse {
        let serverChanges: HashTable<any> = Object.create(null);

        for (let item of this.getChangedItems(lastTimestamp)) {
            if (hasOwnProperty.call(excludes, item.id)) {
                continue;
            }

            let strategy = strategies[item.type];
            let value = strategy.getClientValue ? strategy.getClientValue(item) : item.value;

            serverChanges[item.id] = value;
        }

        return {
            timestamp: now,
            changes: serverChanges
        };
    }

    /**
     * In this refactored version of server-side `synchronize` method, we split
     * the code into two smaller methods `applyClientChanges` and
     * `prepareSyncingResponse`.
     *
     * Method `applyClientChanges` takes care of how changes get applied to the
     * server store, and `prepareSyncingResponse` on the other handle takes
     * care of preparing information for changes that need to be carried to
     * client.
     *
     * @param request Synchronizing request from client.
     * @return Synchronizing response generated.
     */
    synchronize(request: SyncingRequest): SyncingResponse {
        let now = Date.now();
        let clientTimeOffset = now - request.clientTime;

        let excludes = this.applyClientChanges(request.changeLists, now, clientTimeOffset);
        let response = this.prepareSyncingResponse(request.timestamp, now, excludes);

        return response;
    }
}
