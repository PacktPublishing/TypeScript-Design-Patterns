namespace Decorator {
    abstract class UIComponent {
        abstract draw(): void;
    }

    class Text {
        content: string;

        setColor(color: string): void { }
        setFont(font: string): void { }

        draw(): void { }
    }

    class TextComponent extends UIComponent {
        texts: Text[];

        draw(): void {
            for (let text of this.texts) {
                text.draw();
            }
        }
    }

    class Decorator extends UIComponent {
        constructor(
            public component: TextComponent
        ) {
            super();
        }

        get texts(): Text[] {
            return this.component.texts;
        }

        draw(): void {
            this.component.draw();
        }
    }

    class ColorDecorator extends Decorator {
        constructor(
            component: TextComponent,
            public color: string
        ) {
            super(component);
        }

        draw(): void {
            for (let text of this.texts) {
                text.setColor(this.color);
            }

            super.draw();
        }
    }

    class FontDecorator extends Decorator {
        constructor(
            component: TextComponent,
            public font: string
        ) {
            super(component);
        }

        draw(): void {
            for (let text of this.texts) {
                text.setFont(this.font);
            }

            super.draw();
        }
    }

    let decoratedComponent = new ColorDecorator(
        new FontDecorator(
            new TextComponent(),
            'sans-serif'
        ),
        'black'
    );

    function prefix(target: Object, name: string, descriptor: PropertyDescriptor): PropertyDescriptor {
        let method = descriptor.value as Function;

        if (typeof method !== 'function') {
            throw new Error('Expecting decorating a method');
        }

        return {
            value: function () {
                return '[prefix] ' + method.apply(this, arguments);
            },
            enumerable: descriptor.enumerable,
            configurable: descriptor.configurable,
            writable: descriptor.writable
        };
    }

    function suffix(target: Object, name: string, descriptor: PropertyDescriptor): PropertyDescriptor {
        let method = descriptor.value as Function;

        if (typeof method !== 'function') {
            throw new Error('Expecting decorating a method');
        }

        return {
            value: function () {
                return method.apply(this, arguments) + ' [suffix]';
            },
            enumerable: descriptor.enumerable,
            configurable: descriptor.configurable,
            writable: descriptor.writable
        };
    }

    class Foo {
        @prefix
        @suffix
        getContent(): string {
            return '...';
        }
    }
}

