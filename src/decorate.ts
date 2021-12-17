import {
	Constructor, ObservedElement, DecoratableProperties, DecorationOptions
} from './types'

// export function decorate<T extends ObservedElement>(target: T, options: DecorationOptions<T>): T
export function decorate<T extends ObservedElement>(target: Constructor<T>, options: DecorationOptions<T>): Constructor<T>
export function decorate<T extends ObservedElement>(target: T | Constructor<T>, options: DecorationOptions<T>) {
	const object = typeof target === 'function' ? target.prototype : target
	for (const key of Object.keys(options)) {
		const decorator = options[key as DecoratableProperties<T>]!
		decorator(object, key, Object.getOwnPropertyDescriptor(object, key)!)
	}

	return target
}
