import { ObservedElement } from './types.js'

export function bind<T extends ObservedElement>(selector: string) {
	return function (
		_value: undefined,
		{ name, addInitializer }: ClassFieldDecoratorContext<T>,
	): void {
		addInitializer(function (this: T) {
			const { constructor } = this as T
			const proto = constructor.prototype
			Reflect.defineProperty(proto, name, {
				configurable: true,
				enumerable: true,
				get(this: T): HTMLElement | null {
					return this.querySelector(selector)
				},
			})
		})
	}
}
