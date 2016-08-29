namespace State {
    interface State {
        render(hover: boolean): void;
        click(): void;
    }

    class StateEnabled implements State {
        constructor(
            public context: Context
        ) { }

        render(hover: boolean): void {
            this
                .context
                .$element
                .removeClass('disabled')
                .toggleClass('hover', hover);
        }

        click(): void {
            this.context.onclick();
        }
    }

    class StateDisabled implements State {
        constructor(
            public context: Context
        ) { }

        render(): void {
            this
                .context
                .$element
                .addClass('disabled')
                .removeClass('hover');
        }

        click(): void {
            // Do nothing.
        }
    }

    class Context {
        $element = $(document.createElement('div')).addClass('button');

        private stateEnabled = new StateEnabled(this);
        private stateDisabled = new StateDisabled(this);

        state: State = this.stateEnabled;

        constructor() {
            this
                .$element
                .hover(
                    () => this.render(true),
                    () => this.render(false)
                )
                .click(() => this.click());

            this.render(false);
        }

        private render(hover: boolean): void {
            this.state.render(hover);
        }

        private click(): void {
            this.state.click();
        }

        onclick(): void {
            console.log('I am clicked.');
        }
    }
}
