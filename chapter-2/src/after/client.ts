import {
    Server,
    DataType,
    ClientChange,
    ClientIncrementChange,
    ClientValueChange,
    ClientSetChange,
    ClientChangeList,
    SyncingRequest,
    SyncingResponse
} from './';

import { client as valueStrategy } from './strategies/value';
import { client as incrementStrategy } from './strategies/increment';

const hasOwnProperty = Object.prototype.hasOwnProperty;

export interface ClientDataItem<T> {
    id: string;
    type: string;
    value: T;
}

export interface ClientDataStore {
    timestamp: number;
    items: HashTable<ClientDataItem<any>>;
    /** List of pending changes that need to be synchronized. */
    changeLists: HashTable<ClientChangeList<ClientChange>>;
}

export interface ClientChangeStrategy<T extends ClientChange> {
    /**
     * Whether a change that follows this strategy should be marked as `synced`
     * on synchronizing. This is to avoid a change from being accumulated after
     * a failed synchronization.
     */
    markSynced?: boolean;
    /**
     * Implementation of how client-side changes should be appended to the
     * change list. For example, it may control whether to combine current
     * change with previous one to make the list more compact.
     */
    append(list: ClientChangeList<T>, change: T): void;
    /**
     * Implementation of how changes should be applied to the client-side
     * store.
     */
    apply(item: ClientDataItem<any>, change: T): void;
}

/**
 * Strategy table with predefined client-side strategies.
 */
let strategies: HashTable<ClientChangeStrategy<ClientChange>> = {
    /** Strategy that handles changes of normal value. */
    value: valueStrategy,
    /** Strategy that handles changes of an increment. */
    increment: incrementStrategy
};

export class Client {
    constructor(
        public server: Server
    ) { }

    store: ClientDataStore = {
        timestamp: 0,
        items: Object.create(null),
        changeLists: Object.create(null)
    };

    /**
     * Prepare synchronizing request that contains data to the server which
     * describes changes made from this client.
     *
     * @return The generated synchronizing request.
     */
    private prepareSyncingRequest(): SyncingRequest {
        let store = this.store;
        let clientItems = store.items;

        let clientChanges: HashTable<ClientChange> = Object.create(null);

        let storedChangeLists = store.changeLists;

        for (let id of Object.keys(storedChangeLists)) {
            let changeList = storedChangeLists[id];
            let strategy = strategies[changeList.type];

            if (strategy.markSynced) {
                let changes = changeList.changes;
                if (changes.length) {
                    changes[changes.length - 1].synced = true;
                }
            }
        }

        return {
            timestamp: store.timestamp,
            clientTime: Date.now(),
            changeLists: storedChangeLists
        };
    }

    /**
     * Apply the response of a synchronizing request to the client, and keep
     * the client-side data up-to-date.
     *
     * @param response Response from the server that contains changes to apply
     * to the client.
     */
    private applySyncingResponse(response: SyncingResponse): void {
        let store = this.store;
        let clientItems = store.items;

        let serverChanges = response.changes;

        for (let id of Object.keys(serverChanges)) {
            let change = serverChanges[id];

            clientItems[id] = {
                id,
                type: change.type,
                value: change.value
            };
        }

        store.changeLists = Object.create(null);
        store.timestamp = response.timestamp;
    }

    /*
     * In this refactored version of client-side `synchronize` method, we split
     * some detailed implementations into two smaller methods
     * `prepareSyncingRequest` and `applySyncingResponse`.
     *
     * The essential structure of those two parts has already been there in the
     * previous version. By splitting them into two just makes the outline more
     * visible to us.
     */
    synchronize(): void {
        let request = this.prepareSyncingRequest();
        let response = this.server.synchronize(request);
        this.applySyncingResponse(response);
    }

    /**
     * Append a specific change to the client-side change list that will be
     * synchronized to the server.
     *
     * @param id ID of the item to append this change to.
     * @param type Type of the data item.
     * @param change The change description.
     * @param strategy Strategy of how to append this change to the list.
     */
    private appendChangeToChangeList(
        id: string,
        type: DataType,
        change: ClientChange,
        strategy: ClientChangeStrategy<ClientChange>
    ): void {
        let changeLists = this.store.changeLists;
        let changeList: ClientChangeList<ClientChange>;

        if (hasOwnProperty.call(changeLists, id)) {
            changeList = changeLists[id];
        } else {
            changeList = {
                type,
                changes: []
            };
        }

        strategy.append(changeList, change);
        changeLists[id] = changeList;
    }

    /**
     * Apply a specific change to the data item in client-side store.
     *
     * @param id ID of the item to apply this change to.
     * @param type Type of the data item.
     * @param change The change description.
     * @param strategy Strategy of how to apply this change.
     */
    private applyChangeToDataItem(
        id: string,
        type: DataType,
        change: ClientChange,
        strategy: ClientChangeStrategy<ClientChange>
    ): void {
        let items = this.store.items;
        let item: ClientDataItem<any>;

        if (hasOwnProperty.call(items, id)) {
            item = items[id];
        } else {
            item = {
                id,
                type,
                value: undefined
            };
        }

        strategy.apply(item, change);
        items[id] = item;
    }

    /**
     * Method `applyChange` here is actually a refactored version of `update`
     * in the previous one. In this version, instead of `if` branches, we use
     * predefined strategies to handle different types of changes.
     *
     * @param id ID of item to apply this change to.
     * @param type Type of data item, indicates what behavior should be applied
     * when operates the item.
     * @param change A description to this client change.
     */
    private applyChange(id: string, type: DataType, change: ClientChange): void {
        let strategy = strategies[type];

        if (!strategy) {
            throw new TypeError('Invalid data type');
        }

        this.appendChangeToChangeList(id, type, change, strategy);
        this.applyChangeToDataItem(id, type, change, strategy);
    }

    /**
     * Update the value of a specific item.
     *
     * The implementation of `update` method in this refactored version is only
     * a specific operation that relies on method `applyChange`.
     *
     * @param id ID of item to update.
     * @param value A normal new value.
     */
    update<T>(id: string, value: T): void {
        let change: ClientValueChange<T> = {
            lastModifiedTime: Date.now(),
            value
        };

        this.applyChange(id, 'value', change);
    }

    /**
     * Increment the value of a specific item.
     *
     * @param id ID of item to increase.
     * @param increment The increment of this change.
     */
    increase(id: string, increment: number): void {
        let change: ClientIncrementChange = {
            uid: Date.now().toString(),
            synced: false,
            increment
        };

        this.applyChange(id, 'increment', change);
    }
}
