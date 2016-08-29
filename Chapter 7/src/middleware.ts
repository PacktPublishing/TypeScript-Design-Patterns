type Middleware = (host: Host) => Promise<void>;

class Host {
    middlewares: Middleware[] = [];

    start(): Promise<void> {
        return this
            .middlewares
            .reduce((promise, middleware) => {
                return promise.then(() => middleware(this));
            }, Promise.resolve());
    }
}
