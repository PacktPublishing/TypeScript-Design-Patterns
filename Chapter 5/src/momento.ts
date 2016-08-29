namespace Memento {
    interface State { }

    class Memento {
        private state: State;

        constructor(state: State) {
            this.state = Object.assign({} as State, state);
        }

        restore(state: State): void {
            Object.assign(state, this.state);
        }
    }

    class Originator {
        state: State;

        get memento(): Memento {
            return new Memento(this.state);
        }

        set memento(memento: Memento) {
            memento.restore(this.state);
        }
    }

    class Caretaker {
        originator: Originator;
        history: Memento[] = [];

        save(): void {
            this.history.push(this.originator.memento);
        }

        restore(): void {
            this.originator.memento = this.history.shift();
        }
    }
}
