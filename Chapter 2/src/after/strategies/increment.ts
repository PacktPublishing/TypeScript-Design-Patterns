import {
    Client,
    ClientChangeStrategy,
    ClientIncrementChange,
    ClientChangeList,
    ServerChangeStrategy,
    ServerIncrementDataItem,
    ClientTimeCalibrator
} from '../';

export let client: ClientChangeStrategy<ClientIncrementChange> = {
    markSynced: true,
    append(list, change) {
        let changes = list.changes;
        let lastChange = changes[changes.length];
        
        if (!lastChange || lastChange.synced) {
            changes.push(change);
        } else {
            lastChange.increment += change.increment;
        }
    },
    apply(item, change) {
        if (item.value === undefined) {
            item.value = change.increment;
        } else {
            item.value += change.increment;
        }
    }
};

export let server: ServerChangeStrategy<ClientIncrementChange> = {
    apply(
        item: ServerIncrementDataItem,
        list: ClientChangeList<ClientIncrementChange>
    ): boolean {
        if (!item.uids) {
            item.value = 0;
            item.uids = [];
        }
        
        let changes = list.changes;
        
        for (let change of changes) {
            if (item.uids.indexOf(change.uid)) {
                continue;
            }
            
            item.value += change.increment;
            item.uids.push(change.uid);
        }
        
        return true;
    }
};
