import { getAttrName } from './attr.js'
import { toHyphenCase } from './helpers.js'
import {
	Constructor, ObservablePropertiesList, MethodDecorator, ObservedElement, UpdateFunction
} from './types.js'

const observed = Symbol()

declare module './types.js' {
	interface ObservedElement {
		[observed]?: {
			[key: string]: Set<UpdateFunction>
		}
	}
}

export function observe<T>(
	properties?: T extends ObservedElement ? ObservablePropertiesList<T> : Array<keyof T>,
): MethodDecorator<T, UpdateFunction>
export function observe<T extends ObservedElement>(
	proto: T,
	key: string,
	descriptor: TypedPropertyDescriptor<UpdateFunction>,
): void
export function observe<T extends ObservedElement>(
	propertiesOrProto?: ObservablePropertiesList<T> | T,
	maybeKey?: string,
	maybeDescriptor?: TypedPropertyDescriptor<UpdateFunction>,
): MethodDecorator<T, UpdateFunction> | void {
	function decorator(proto: T, key: string, descriptor: TypedPropertyDescriptor<UpdateFunction>): void {
		let observedAttributes: string[]

		const { constructor } = proto

		if (propertiesOrProto !== proto) { // enclosed
			const properties = propertiesOrProto as ObservablePropertiesList<T>
			observedAttributes = properties && properties.length
				? properties.map((attribute) => getAttrName(proto, attribute as string) || toHyphenCase(attribute as string))
				: (constructor as Constructor<T>).observedAttributes || []
		} else { // decorated
			observedAttributes = (constructor as Constructor<T>).observedAttributes || []
		}

		if (!proto[observed]) {
			proto[observed] = {}
			const attributeChangedCallback = proto.attributeChangedCallback
			proto.attributeChangedCallback = function (
				attributeName: string,
				oldValue: string | null,
				newValue: string | null,
			): void {
				if (attributeChangedCallback) {
					attributeChangedCallback.call(this, attributeName, oldValue, newValue)
				}
				if (oldValue === newValue) return

				const updaters = this[observed]?.[attributeName]
				if (updaters) {
					for (const updater of updaters) {
						updater.call(this)
					}
				}
			}
		}

		for (const attribute of observedAttributes) {
			proto[observed]![attribute] ||= new Set()
			proto[observed]![attribute].add(descriptor.value as UpdateFunction)
		}
	}

	if (arguments.length > 1) {
		return decorator(propertiesOrProto as T, maybeKey as string, maybeDescriptor as TypedPropertyDescriptor<UpdateFunction>) // decorate
	}

	return decorator // enclose
}
