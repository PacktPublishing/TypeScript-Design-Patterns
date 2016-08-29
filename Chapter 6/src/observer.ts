import { EventEmitter } from 'events';

namespace Observer {
    type Observer = () => void;

    class StateManager extends EventEmitter{
        constructor(
            private state: any
        ) {
            super();
        }

        private _get(identifiers: string[]): any {
            let node = this.state;

            for (let identifier of identifiers) {
                node = node[identifier];
            }

            return node;
        }

        set(key: string, value: any): void {
            let identifiers = key.split('.');
            let lastIndex = identifiers.length - 1;

            let node = this._get(identifiers.slice(0, lastIndex));

            node[identifiers[lastIndex]] = value;

            for (let i = identifiers.length; i > 0; i--) {
                let key = identifiers.slice(0, i).join('.');
                this.emit(key);
            }
        }

        get(key: string): any {
            let identifiers = key.split('.');
            return this._get(identifiers);
        }

        on(state: string, listener: Observer): this;
        on(states: string[], listener: Observer): this;
        on(states: string | string[], listener: Observer): this {
            if (typeof states === 'string') {
                super.on(states, listener);
            } else {
                for (let state of states) {
                    super.on(state, listener);
                }
            }

            return this;
        }
    }
}
