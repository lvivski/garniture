export type UpdateFunction = () => void

export type ClassDecorator<T> = (constructor: Constructor<T>) => void

export type PropertyDecorator<T, U> = <K extends string>(proto: T & Record<K, U>, key: K) => void

export type MethodDecorator<T, U> = <K extends string>(proto: T & Record<K, U>, key: K, descriptor: TypedPropertyDescriptor<U>) => void

export interface Constructor<T> {
	new(...args: unknown[]): T
	observedAttributes?: string[]
}

export interface ObservedElement extends HTMLElement {
	connectedCallback?(): void
	disconnectedCallback?(): void
	attributeChangedCallback?(
		attributeName: string,
		oldValue: string | null,
		newValue: string | null,
		namespace?: string,
	): void
}

type PropertyNames<T> = keyof T

type TypedPropertyNames<T, U> = {
	[K in keyof T]: T[K] extends U ? K : never
}[PropertyNames<T>]

type StringOrBoolPropertyNames<T> = TypedPropertyNames<T, string> | TypedPropertyNames<T, boolean>

type DecoratablePropertyNames<T> = StringOrBoolPropertyNames<T> | TypedPropertyNames<T, HTMLElement[]> | TypedPropertyNames<T, UpdateFunction>

type OmitInheritedProperties<A, B> = Omit<A, keyof B>

export type DecoratableProperties<T extends ObservedElement> = DecoratablePropertyNames<OmitInheritedProperties<T, ObservedElement>>

export type ObservablePropertiesList<T extends ObservedElement> = Array<StringOrBoolPropertyNames<OmitInheritedProperties<T, ObservedElement>>>
