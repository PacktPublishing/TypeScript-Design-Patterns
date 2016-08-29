import {
    Server,
    DataType,
    ClientChange,
    ClientIncrementChange,
    ClientValueChange,
    ClientSetChange,
    ClientChangeList,
    SetOperation
} from './';

const hasOwnProperty = Object.prototype.hasOwnProperty;

export interface ClientDataItem<T> {
    id: string;
    type: string;
    value: T;
}

export interface ClientDataStore {
    timestamp: number;
    items: {
        [id: string]: ClientDataItem<any>;
    };
    changeLists: {
        [id: string]: ClientChangeList<ClientChange>;
    };
}

export class Client {
    constructor(
        public server: Server
    ) { }

    store: ClientDataStore = {
        timestamp: 0,
        items: Object.create(null),
        changeLists: Object.create(null)
    };
    
    synchronize(): void {
        let store = this.store;
        
        let clientItems = store.items;
        
        let clientChanges: {
            [id: string]: ClientChange;
        } = Object.create(null);
        
        let storedChangeLists = store.changeLists;

        for (let id of Object.keys(storedChangeLists)) {
            let changeList = storedChangeLists[id];
            
            if (changeList.type === 'increment') {
                let changes = changeList.changes;
                let lastChange = changes[changes.length - 1];
                
                (lastChange as ClientIncrementChange).synced = true;
            }
        }

        let response = this.server.synchronize({
            timestamp: store.timestamp,
            clientTime: Date.now(),
            changeLists: storedChangeLists
        });
        
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

    update(id: string, type: 'increment', increment: number): void;
    update(id: string, type: 'set', element: number, operation: SetOperation): void;
    update<T>(id: string, type: 'value', value: T): void;
    update<T>(id: string, type: DataType, value: T, operation?: SetOperation): void;
    update<T>(id: string, type: DataType, value: T, operation?: SetOperation): void {
        let store = this.store;
        
        let items = store.items;
        let storedChangeLists = store.changeLists;
        
        if (type === 'value') {
            let change: ClientValueChange<T> = {
                lastModifiedTime: Date.now(),
                value
            };
            
            storedChangeLists[id] = {
                type,
                changes: [change]
            };
            
            if (hasOwnProperty.call(items, id)) {
                items[id].value = value;
            } else {
                items[id] = {
                    id,
                    type,
                    value
                };
            }
        } else if (type === 'increment') {
            if (hasOwnProperty.call(storedChangeLists, id)) {
                let changeList = storedChangeLists[id];
                
                let changes = changeList.changes;
                let lastChange = changes[changes.length - 1] as ClientIncrementChange;

                if (lastChange.synced) {
                    changes.push({
                        synced: false,
                        uid: Date.now().toString(),
                        increment: <any>value as number
                    } as ClientIncrementChange);
                } else {
                    lastChange.increment += <any>value as number;
                }
            } else {
                let changeList: ClientChangeList<ClientIncrementChange> = {
                    type: 'increment',
                    changes: [
                        {
                            synced: false,
                            uid: Date.now().toString(),
                            increment: <any>value as number
                        }
                    ]
                };

                store.changeLists[id] = changeList;
            }
            
            if (hasOwnProperty.call(items, id)) {
                items[id].value += value;
            } else {
                items[id] = {
                    id,
                    type,
                    value
                };
            }
        } else if (type === 'set') {
            let element = <any>value as number;
            
            if (hasOwnProperty.call(storedChangeLists, id)) {
                let changeList = storedChangeLists[id];
                let changes = changeList.changes as ClientSetChange[];

                for (let i = 0; i < changes.length; i++) {
                    let change = changes[i];
                    
                    if (change.element === element) {
                        changes.splice(i, 1);
                        break;
                    }
                }

                changes.push({
                    element,
                    time: Date.now(),
                    operation
                });
            } else {
                let changeList: ClientChangeList<ClientSetChange> = {
                    type: 'set',
                    changes: [
                        {
                            element,
                            time: Date.now(),
                            operation
                        }
                    ]
                };
                
                storedChangeLists[id] = changeList;
            }
            
            if (hasOwnProperty.call(items, id)) {
                let item = items[id];
                let set = item.value as number[];
                
                let index = set.indexOf(element);
                
                switch (operation) {
                    case SetOperation.add:
                        if (index < 0) {
                            set.push(element);
                        }
                        break;
                    case SetOperation.remove:
                        if (index >= 0) {
                            set.splice(index, 1);
                        }
                        break;
                }
            } else {
                if (operation === SetOperation.add) {
                    items[id] = {
                        id,
                        type,
                        value: [element]
                    };
                }
            }
        } else {
            throw new TypeError('Invalid data type');
        }
    }
}
