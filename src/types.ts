export type UpdateFunction = () => void

export type AnyMethod<T> = (this: T, ...args: unknown[]) => unknown
export type AnyConstructor = abstract new (...args: unknown[]) => unknown

export type ClassDecorator<T extends AnyConstructor> = (
	value: T,
	context: ClassDecoratorContext<T>,
) => T | void

export type ClassAccessorDecorator<T, K = unknown> = (
	value: ClassAccessorDecoratorTarget<T, K>,
	context: ClassAccessorDecoratorContext,
) => ClassAccessorDecoratorResult<T, K>

export type ClassMethodDecorator<T, K extends AnyMethod<T> = AnyMethod<T>> = (
	value: K,
	context: ClassMethodDecoratorContext<T, K>,
) => K | void

export interface ObservedConstructor<T> {
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

export type ObservablePropertiesList<T> = StringOrBoolPropertyNames<
	Omit<T, keyof ObservedElement>
>[]
