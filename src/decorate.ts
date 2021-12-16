import { ObservedElement } from './types'

type Decorator<T> = (
	proto: T,
	key: string,
	descriptor?: PropertyDescriptor
) => void

type DecorationOptions<T> = {
	[K in keyof T]?: unknown
}

export function decorate<T extends ObservedElement>(target: T, options: DecorationOptions<T>) {
	const proto = Object.getPrototypeOf(target)
	for (const key of Object.keys(options)) {
		const decorator = options[key as keyof T] as Decorator<typeof proto>
		decorator(proto, key, Object.getOwnPropertyDescriptor(proto, key))
	}
}
