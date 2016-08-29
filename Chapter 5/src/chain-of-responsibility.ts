namespace ChainOfResponsibility {
    function foo() {
        let value = Math.random();

        if (value < 0.5) {
            throw new Error('Awesome error');
        } else if (value < 0.8) {
            throw new TypeError('Awesome type error');
        }
    }

    function bar() {
        try {
            foo();
        } catch (error) {
            if (error instanceof TypeError) {
                console.log('Some type error occurs', error);
            } else {
                throw error;
            }
        }
    }

    function biu() {
        try {
            bar();
        } catch (error) {
            console.log('Some error occurs', error);
        }
    }

    biu();

    type RequestType = 'help' | 'feedback';

    interface Request {
        type: RequestType;
    }

    class Handler {
        private successor: Handler;

        handle(request: Request): void {
            if (this.successor) {
                this.successor.handle(request);
            }
        }
    }

    class HelpHandler extends Handler {
        handle(request: Request): void {
            if (request.type === 'help') {
                // Show help information.
            } else {
                super.handle(request);
            }
        }
    }

    class FeedbackHandler extends Handler {
        handle(request: Request): void {
            if (request.type === 'feedback') {
                // Prompt for feedback.
            } else {
                super.handle(request);
            }
        }
    }
}

