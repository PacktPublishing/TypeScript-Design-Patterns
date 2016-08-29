export type DataType = 'value' | 'increment' | 'set';

export interface ClientChange {
    synced?: boolean;
}

export interface ClientValueChange<T> extends ClientChange {
    lastModifiedTime: number;
    value: T;
}

export interface ClientIncrementChange extends ClientChange {
    uid: string;
    increment: number;
}

export enum SetOperation {
    add,
    remove
}

export interface ClientSetChange extends ClientChange {
    element: number;
    time: number;
    operation: SetOperation;
}

export interface ClientChangeList<T extends ClientChange> {
    type: DataType;
    changes: T[];
}

export interface SyncingRequest {
    timestamp: number;
    clientTime: number;
    changeLists: {
        [id: string]: ClientChangeList<ClientChange>;
    };
}

export interface SyncingResponse {
    timestamp: number;
    changes: {
        [id: string]: any;
    };
}
