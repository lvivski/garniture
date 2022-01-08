export type UpdateFunction = () => void

export type ClassDecorator<T> = (constructor: T) => void

export type PropertyDecorator<T, U> = <K extends string>(proto: T & Record<K, U>, key: K) => void

export type MethodDecorator<T, U> = <K extends string>(proto: T & Record<K, U>, key: K, descriptor: TypedPropertyDescriptor<U>) => void

export interface Constructor<T> {
	new(...args: unknown[]): T
	observedAttributes?: string[]
	decorate?: DecorationOptions<T>
	template?: HTMLTemplateElement
	style?: CSSStyleSheet[]
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

type TypedPropertyNames<T, U> = {
	[K in keyof T]: T[K] extends U ? K : never
}[keyof T]

type StringOrBoolPropertyNames<T> = TypedPropertyNames<T, string> | TypedPropertyNames<T, boolean>

type DecoratableMemberNames<T> = StringOrBoolPropertyNames<T> | TypedPropertyNames<T, HTMLElement[]> | TypedPropertyNames<T, UpdateFunction>

export type DecoratableMembers<T> = DecoratableMemberNames<Omit<T, keyof ObservedElement>>

export type ObservablePropertiesList<T> = Array<StringOrBoolPropertyNames<Omit<T, keyof ObservedElement>>>

type MemberDecorator<T> = PropertyDecorator<T, boolean> | PropertyDecorator<T, string> | PropertyDecorator<T, HTMLElement[]> | MethodDecorator<T, UpdateFunction>

export type DecorationOptions<T> = {
	[K in DecoratableMembers<T>]?: MemberDecorator<T>
}

export type DecorationConfig<T> = {
	[key: string]: MemberDecorator<T>
}

export type ExpectedMembers<T, U> = T extends object ? {
	[K in keyof T]:
	T[K] extends PropertyDecorator<U, infer V> ? V :
	T[K] extends MethodDecorator<U , infer V> ? V :
	T[K] extends MethodDecorator<T, infer V> ? V :
	never
} : unknown
