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
     * @return A boolean indicates whether the value of this item still needs to be synchronized to the client.
     */
    apply(
        item: ServerDataItem<any>,
        list: ClientChangeList<T>,
        calibrator: ClientTimeCalibrator
    ): boolean;
    
    /**
     * This method is for data type like 'set', of which the data is stored as a hash set on server but expected to be an array on client.
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

let strategies: HashTable<ServerChangeStrategy<ClientChange>> = {
    value: valueStrategy,
    increment: incrementStrategy
};

export class Server {
    constructor(
        public store: ServerStore
    ) { }
    
    private getChangedItems(lastTimestamp: number): ServerDataItem<any>[] {
        return this
            .store
            .getAll()
            .filter(item => item.timestamp > lastTimestamp);
    }
    
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
    
    synchronize(request: SyncingRequest): SyncingResponse {
        let now = Date.now();
        let clientTimeOffset = now - request.clientTime;
        
        let excludes = this.applyClientChanges(request.changeLists, now, clientTimeOffset);
        let response = this.prepareSyncingResponse(request.timestamp, now, excludes);
        
        return response;
    }
}
