import {
	Constructor, ObservedElement, DecoratableProperties, DecorationOptions
} from './types'

/*
 We need a separate function for better error highlighting
 with overloads it highlights the entire function call, rather
 than a specific incorrect property
*/
export function decorateInstance<T extends ObservedElement>(target: T, options: DecorationOptions<T>) {
	const proto = Object.getPrototypeOf(Object.getPrototypeOf(target))
	for (const key of Object.keys(options)) {
		const decorator = options[key as DecoratableProperties<T>]!
		const descriptor = Object.getOwnPropertyDescriptor(proto, key)!
		decorator(target as any, key, descriptor)
	}
	return target
}

export function decorate<T extends ObservedElement>(target: Constructor<T>, options: DecorationOptions<T>) {
	const proto = target.prototype
	for (const key of Object.keys(options)) {
		const decorator = options[key as DecoratableProperties<T>]!
		const descriptor = Object.getOwnPropertyDescriptor(proto, key)!
		decorator(proto, key, descriptor)
	}
	return target
}
