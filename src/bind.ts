import { ObservedElement } from './types.js'

export function bind<T extends ObservedElement>(selector: string) {
	return function (
		_value: undefined,
		{ name, addInitializer }: ClassFieldDecoratorContext<T>,
	): void {
		addInitializer(function () {
			Reflect.defineProperty(this, name, {
				configurable: true,
				enumerable: true,
				get(): HTMLElement | null {
					return this.querySelector(selector)
				},
			})
		})
	}
}
