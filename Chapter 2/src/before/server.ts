import {
    SyncingRequest,
    SyncingResponse,
    DataType,
    ClientValueChange,
    ClientIncrementChange,
    ClientSetChange,
    SetOperation
} from './';

const hasOwnProperty = Object.prototype.hasOwnProperty;

export interface ServerDataItem<T> {
    id: string;
    type: DataType;
    timestamp: number;
    uids?: string[];
    lastModifiedTime?: number;
    value: T;
}

export interface ServerDataStore {
    items: {
        [id: string]: ServerDataItem<any>;
    };
}

export interface ServerSetElementOperationInfo {
    operation: SetOperation;
    time: number;
}

export class Server {
    store: ServerDataStore;
    
    synchronize(request: SyncingRequest): SyncingResponse {
        let lastTimestamp = request.timestamp;
        let clientChangeLists = request.changeLists;
        
        let now = Date.now();
        let clientTimeOffset = now - request.clientTime;

        let items = this.store.items;
        
        for (let id of Object.keys(clientChangeLists)) {
            let clientChangeList = clientChangeLists[id];
            
            let type = clientChangeList.type;
            let clientChanges = clientChangeList.changes;
            
            if (type === 'value') {
                let clientChange = clientChanges[0] as ClientValueChange<any>;
                let lastModifiedTime = Math.min(clientChange.lastModifiedTime + clientTimeOffset, now);

                if (hasOwnProperty.call(items, id) && items[id].lastModifiedTime > lastModifiedTime) {
                    delete clientChangeLists[id];
                    continue;
                }
                
                items[id] = {
                    id,
                    type,
                    timestamp: now,
                    lastModifiedTime,
                    value: clientChange.value
                };
            } else if (type === 'increment') {
                let item: ServerDataItem<any>;

                if (hasOwnProperty.call(items, id)) {
                    item = items[id];
                    item.timestamp = now;
                } else {
                    item = items[id] = {
                        id,
                        type,
                        timestamp: now,
                        uids: [],
                        value: 0
                    };
                }
                
                for (let clientChange of clientChanges as ClientIncrementChange[]) {
                    let { uid, increment } = clientChange;
                    
                    if (item.uids.indexOf(uid) < 0) {
                        item.value += increment;
                        item.uids.push(uid);
                    }
                }
                
                delete clientChangeLists[id];
            } else if (type === 'set') {
                let item: ServerDataItem<{
                    [element: string]: ServerSetElementOperationInfo;
                }>;

                if (hasOwnProperty.call(items, id)) {
                    item = items[id];
                    item.timestamp = now;
                } else {
                    item = items[id] = {
                        id,
                        type,
                        timestamp: now,
                        value: Object.create(null)
                    };
                }
                
                let operationInfos = item.value;
                
                for (let clientChange of clientChanges as ClientSetChange[]) {
                    let operation = clientChange.operation;
                    let element = clientChange.element.toString();
                    let time = Math.min(clientChange.time + clientTimeOffset, now);
                    
                    if (
                        hasOwnProperty.call(operationInfos, element) &&
                        operationInfos[element].time > time
                    ) {
                        continue;
                    }
                    
                    operationInfos[element] = {
                        operation,
                        time
                    };
                }
                
                delete clientChangeLists[id];
            } else {
                throw new TypeError('Invalid data type');
            }
        }

        let serverChanges: {
            [id: string]: any;
        } = Object.create(null);
        
        for (let id of Object.keys(items)) {
            let item = items[id];
            
            if (item.timestamp > lastTimestamp && !hasOwnProperty.call(clientChangeLists, item.id)) {
                if (item.type === 'set') {
                    let operationInfos: {
                        [element: string]: ServerSetElementOperationInfo;
                    } = item.value;
                    
                    serverChanges[id] = Object
                        .keys(operationInfos)
                        .filter(element => operationInfos[element].operation === SetOperation.add)
                        .map(element => Number(element));
                } else {
                    serverChanges[id] = item.value;
                }
            }
        }
        
        return {
            timestamp: now,
            changes: serverChanges
        };
    }
}
