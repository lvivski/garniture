export type DecoratedClass<T> = (constructor: Constructor<T>) => void

export type DecoratedProperty<T> = (proto: T, key: string) => void

export type DecoratedFunction<T, K> = (proto: T, key: string, descriptor: TypedPropertyDescriptor<K>) => void

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
