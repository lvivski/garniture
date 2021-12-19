import {
	Constructor, ObservedElement, DecoratableProperties, DecorationOptions
} from './types'

/*
 We need a separate function for better error highlighting
 with overloads it highlights the entire function call, rather
 than a specific incorrect property
*/
export function decorateInternal<T extends ObservedElement>(target: T, options: DecorationOptions<T>) {
	for (const key of Object.keys(options)) {
		const decorator = options[key as DecoratableProperties<T>]!
		decorator(target as any, key, Object.getOwnPropertyDescriptor(target, key)!)
	}
	return target
}

export function decorate<T extends ObservedElement>(target: Constructor<T>, options: DecorationOptions<T>) {
	const proto = typeof target === 'function' ? target.prototype : target
	decorateInternal(proto, options)
	return target
}
