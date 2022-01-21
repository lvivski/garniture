import { ObservedElement, PropertyDecorator } from './types.js'

export function bind<T extends ObservedElement>(
	selector: string
): PropertyDecorator<T, HTMLElement> {
	return function (proto: T, key: string): void {
		Reflect.defineProperty(proto, key, {
			configurable: true,
			enumerable: true,
			get(this: T): HTMLElement | null {
				return this.querySelector(selector)
			}
		})
	}
}
