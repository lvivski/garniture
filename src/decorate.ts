import {
	Constructor, MethodDecorator, ObservedElement, UpdateFunction, PropertyDecorator, DecoratableProperties
} from './types'

type DecorationOptions<T extends ObservedElement> = {
	[K in DecoratableProperties<T>]?: PropertyDecorator<T, boolean> | PropertyDecorator<T, string> | PropertyDecorator<T, HTMLElement[]> | MethodDecorator<T, UpdateFunction>
}

export function decorate<T extends ObservedElement>(constructor: Constructor<T>, options: DecorationOptions<T>) {
	const proto = constructor.prototype
	for (const key of Object.keys(options)) {
		const decorator = options[key as DecoratableProperties<T>]!
		decorator(proto, key, Object.getOwnPropertyDescriptor(proto, key)!)
	}

	return constructor
}
