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
    changeLists: HashTable<ClientChangeList<ClientChange>>;
}

export interface ClientChangeStrategy<T extends ClientChange> {
    markSynced?: boolean;
    append(list: ClientChangeList<T>, change: T): void;
    apply(item: ClientDataItem<any>, change: T): void;
}

let strategies: HashTable<ClientChangeStrategy<ClientChange>> = {
    value: valueStrategy,
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
    
    synchronize(): void {
        let request = this.prepareSyncingRequest();
        let response = this.server.synchronize(request);
        this.applySyncingResponse(response);
    }
    
    private applyChangeToChangeList(
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
    
    private applyChange(id: string, type: DataType, change: ClientChange): void {
        let strategy = strategies[type];
        
        if (!strategy) {
            throw new TypeError('Invalid data type');
        }
        
        this.applyChangeToChangeList(id, type, change, strategy);
        this.applyChangeToDataItem(id, type, change, strategy);
    }
    
    update<T>(id: string, value: T): void {
        let change: ClientValueChange<T> = {
            lastModifiedTime: Date.now(),
            value
        };
        
        this.applyChange(id, 'value', change);
    }
    
    increase(id: string, increment: number): void {
        let change: ClientIncrementChange = {
            uid: Date.now().toString(),
            synced: false,
            increment
        };
        
        this.applyChange(id, 'increment', change);
    }
}
