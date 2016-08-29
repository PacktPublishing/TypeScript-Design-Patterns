import {
    ClientChangeStrategy,
    ServerChangeStrategy,
    ClientValueChange,
    ClientChangeList,
    ServerValueDataItem,
    ClientTimeCalibrator
} from '../';

export let client: ClientChangeStrategy<ClientValueChange<any>> = {
    append(list, change) {
        list.changes = [change];
    },
    apply(item, change) {
        item.value = change.value;
    }
};

export let server: ServerChangeStrategy<ClientValueChange<any>> = {
    apply(
        item: ServerValueDataItem<any>,
        list: ClientChangeList<ClientValueChange<any>>,
        calibrator: ClientTimeCalibrator
    ): boolean {
        let changes = list.changes;
        
        if (changes.length) {
            return true;
        }
        
        let change = changes[0];
        let changeTime = calibrator(change.lastModifiedTime);
        
        if (!item.lastModifiedTime || changeTime > item.lastModifiedTime) {
            item.value = change.value;
            item.lastModifiedTime = changeTime;
            // the client has now the latest value, no need to synchronize back.
            return false;
        } else {
            return true;
        }
    }
};
