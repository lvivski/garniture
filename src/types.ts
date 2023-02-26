export type UpdateFunction = () => void

export type AnyMethod<T> = (this: T, ...args: any) => any

export type ClassDecorator<T extends abstract new (...args: any) => any> = (
	value: T,
	context: ClassDecoratorContext<T>,
) => T | void

export type ClassFieldDecorator<T, K = undefined> = (
	value: K,
	context: ClassFieldDecoratorContext<T, K>,
) => ClassFieldInitializer<K>

export type ClassFieldInitializer<K = undefined> = void

export type ClassMethodDecorator<T, K extends AnyMethod<T> = any> = (
	value: K,
	context: ClassMethodDecoratorContext<T, K>,
) => K | void

export interface Constructor<T> {
	new (...args: unknown[]): T
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

type TypedPropertyNames<T, U> = {
	[K in keyof T]: T[K] extends U ? K : never
}[keyof T]

type StringOrBoolPropertyNames<T> =
	| TypedPropertyNames<T, string>
	| TypedPropertyNames<T, boolean>

type DecoratableMemberNames<T> =
	| StringOrBoolPropertyNames<T>
	| TypedPropertyNames<T, HTMLElement[]>
	| TypedPropertyNames<T, UpdateFunction>

export type DecoratableMembers<T> = DecoratableMemberNames<
	Omit<T, keyof ObservedElement>
>

export type ObservablePropertiesList<T> = Array<
	StringOrBoolPropertyNames<Omit<T, keyof ObservedElement>>
>
