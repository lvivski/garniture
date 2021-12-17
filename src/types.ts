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
