import {
	Constructor, MethodDecorator, ObservedElement, UpdateFunction, PropertyDecorator
} from './types'

type DecorationOptions<T> = {
	[K in keyof T]?: PropertyDecorator<T, boolean> | PropertyDecorator<T, string> | PropertyDecorator<T, HTMLElement[]> | MethodDecorator<T, UpdateFunction>
}

export function decorate<T extends ObservedElement>(constructor: Constructor<T>, options: DecorationOptions<T>) {
	const proto = constructor.prototype
	for (const key of Object.keys(options)) {
		const decorator = options[key as keyof T]!
		decorator(proto, key, Object.getOwnPropertyDescriptor(proto, key)!)
	}

	return constructor
}
