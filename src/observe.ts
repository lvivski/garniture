import { getAttrName } from './attr.js'
import { toHyphenCase } from './helpers.js'
import { Constructor, DecoratedFunction, ObservedElement } from './types.js'

const observed = Symbol()

export type UpdateFunction = () => void

declare module './types.js' {
	interface ObservedElement {
		[observed]?: {
			[key: string]: UpdateFunction[]
		}
	}
}

type OmitInheritedProperties<A, B> = Omit<A, keyof B>

type PropertyNames<T> = keyof T

type StringOrBoolPropertyNames<T> = {
	[K in keyof T]: T[K] extends string ? K : T[K] extends boolean ? K : never
}[PropertyNames<T>]

type StringOrBoolProperties<T> = Pick<T, StringOrBoolPropertyNames<T>>

type DirectPropertiesList<A, B> = Array<PropertyNames<StringOrBoolProperties<OmitInheritedProperties<A, B>>>>

export function observe<T extends ObservedElement>(
	properties?: DirectPropertiesList<T, ObservedElement>,
): DecoratedFunction<T, UpdateFunction>
export function observe<T extends ObservedElement>(
	proto: T,
	key: string,
	descriptor: TypedPropertyDescriptor<UpdateFunction>,
): void
export function observe<T extends ObservedElement>(
	propertiesOrProto?: DirectPropertiesList<T, ObservedElement> | T,
	maybeKey?: string,
	maybeDescriptor?: TypedPropertyDescriptor<UpdateFunction>,
): DecoratedFunction<T, UpdateFunction> | void {
	function decorator(proto: T, key: string, descriptor: TypedPropertyDescriptor<UpdateFunction>): void {
		let observedAttributes: string[]

		const { constructor } = proto

		if (propertiesOrProto !== proto) { // enclosed
			const properties = propertiesOrProto as DirectPropertiesList<T, ObservedElement>
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
			proto[observed]![attribute] ||= []
			proto[observed]![attribute].push(descriptor.value as UpdateFunction)
		}
	}

	if (arguments.length > 1) {
		return decorator(propertiesOrProto as T, maybeKey as string, maybeDescriptor as TypedPropertyDescriptor<UpdateFunction>) // decorate
	}

	return decorator // enclose
}
