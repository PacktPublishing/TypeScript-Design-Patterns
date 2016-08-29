namespace Singleton {
    const singletonA = {
        foo(): void {
            console.log('bar');
        }
    };
    
    const singletonB = (() => {
        let bar = 'bar';

        return {
            foo(): void {
                console.log(bar);
            }
        };
    })();
    
    const singletonC = new class {
        private bar = 'bar';
        
        foo(): void {
            console.log(this.bar);
        }
    };
    
    class Singleton {
        private static _default: Singleton;

        static get default(): Singleton {
            if (Singleton._default) {
                return Singleton._default;
            } else {
                let singleton = new Singleton();
                Singleton._default = singleton;
                return singleton;
            }
        }
    }
}
