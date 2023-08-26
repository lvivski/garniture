import { ObservedElement } from './types.js'

export function bind<T extends ObservedElement, K extends HTMLElement[] | null>(
	selector: string,
) {
	return function (
		value: ClassAccessorDecoratorTarget<T, K>,
		{ kind }: ClassAccessorDecoratorContext<T, K>,
	) {
		if (kind !== 'accessor') return value

		return {
			get(this: T): K {
				return this.querySelector(selector) as K
			},
		}
	}
}
