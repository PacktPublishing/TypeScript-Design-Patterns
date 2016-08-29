namespace Strategy {
    type TargetType = 'a' | 'b';

    interface Target {
        type: TargetType;
    }

    interface TargetA extends Target {
        type: 'a';
        result: string;
    }

    interface TargetB extends Target {
        type: 'b';
        value: number;
    }

    interface Strategy<TTarget extends Target> {
        operationX(target: TTarget): void;
        operationY(target: TTarget): void;
    }

    let strategyA: Strategy<TargetA> = {
        operationX(target) {
            target.result = target.result + target.result;
        },
        operationY(target) {
            target.result = target.result.substr(Math.floor(target.result.length / 2));
        }
    };

    let strategyB: Strategy<TargetB> = {
        operationX(target) {
            target.value = target.value * 2;
        },
        operationY(target) {
            target.value = Math.floor(target.value / 2);
        }
    };

    let strategies: {
        [type: string]: Strategy<Target>
    } = {
        a: strategyA,
        b: strategyB
    };

    let targets: Target[] = [
        { type: 'a' },
        { type: 'a' },
        { type: 'b' }
    ];

    for (let target of targets) {
        let strategy = strategies[target.type];

        strategy.operationX

        strategy.operationX(target);
        strategy.operationY(target);
    }

    class Context implements Target {
        strategy: Strategy<this>;

        constructor(
            public type: TargetType
        ) {
            this.strategy = strategies[type];
        }
    }
}
