export type UpdateFunction = () => void

export type ClassDecorator<T> = (constructor: T) => void

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

export type DecoratableProperties<T> = DecoratablePropertyNames<OmitInheritedProperties<T, ObservedElement>>

export type ObservablePropertiesList<T> = Array<StringOrBoolPropertyNames<OmitInheritedProperties<T, ObservedElement>>>

export type DecorationOptions<T> = {
	[K in DecoratableProperties<T>]?: PropertyDecorator<T, boolean> | PropertyDecorator<T, string> | PropertyDecorator<T, HTMLElement[]> | MethodDecorator<T, UpdateFunction>
}

export type DecorationConfig<T> = {
	[key: string]: PropertyDecorator<T, boolean> | PropertyDecorator<T, string> | PropertyDecorator<ObservedElement & T, HTMLElement[]> | MethodDecorator<T, UpdateFunction>
}

export type ExpectedProperties<T, U> = T extends object ? {
	[K in keyof T]:
	T[K] extends PropertyDecorator<U, string | boolean> ? string :
	T[K] extends PropertyDecorator<U, boolean> ? boolean :
	T[K] extends PropertyDecorator<U, string> ? string :
	T[K] extends PropertyDecorator<U, HTMLElement[]> ? HTMLElement[] :
	T[K] extends MethodDecorator<U, UpdateFunction> ? UpdateFunction :
	T[K] extends MethodDecorator<T, UpdateFunction> ? UpdateFunction :
	never
} : unknown
