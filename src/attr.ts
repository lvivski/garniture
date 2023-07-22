import { toHyphenCase } from './helpers.js'
import { ClassFieldDecorator, Constructor, ObservedElement } from './types.js'

const attributes = Symbol()

declare module './types.js' {
	interface ObservedElement {
		[attributes]?: {
			[key: string]: string
		}
	}
}

type AttrConfig = {
	data?: boolean
	bool?: boolean
}

export function addToObserved<T extends ObservedElement>(
	proto: T,
	key: string,
) {
	const attr = toHyphenCase(key)
	proto[attributes] ||= {}
	proto[attributes][key] = attr

	const { constructor } = proto
	let attrs = [attr]

	if ('observedAttributes' in constructor) {
		const observed = (constructor as Constructor<T>).observedAttributes!
		if (observed.includes(attr)) return
		attrs = observed.concat(attrs)
	}

	Reflect.defineProperty(constructor, 'observedAttributes', {
		configurable: true,
		enumerable: true,
		value: attrs,
	})
}

export function getAttrName<T extends ObservedElement>(
	proto: T,
	attr: string,
): string | undefined {
	return proto[attributes]?.[attr]
}

export function bool<K extends undefined>(
	value: K,
	context: ClassFieldDecoratorContext,
) {
	return attr({ bool: true })(value, context)
}

export function data<K extends undefined>(
	value: K,
	context: ClassFieldDecoratorContext,
) {
	return attr({ data: true })(value, context)
}

export function attr<T extends ObservedElement, K>(
	config?: AttrConfig,
): ClassFieldDecorator<T, K>
export function attr<K>(value: K, context: ClassFieldDecoratorContext): void
export function attr<T extends ObservedElement, K>(
	configOrValue?: AttrConfig | K,
	maybeContext?: ClassFieldDecoratorContext<T, K>,
): ClassFieldDecorator<T, K> | void {
	function decorator(
		value: K,
		{ name, addInitializer }: ClassFieldDecoratorContext<T, K>,
	): void {
		addInitializer(function () {
			const key = String(name)
			let attrName = toHyphenCase(key)

			let descriptor: PropertyDescriptor | undefined
			if (configOrValue !== value) {
				// enclosed
				const config = configOrValue as AttrConfig
				if (config.data) {
					attrName = `data-${attrName}`
				}

				if (config.bool) {
					descriptor = {
						configurable: true,
						enumerable: true,
						get(this: T): boolean {
							return this.hasAttribute(attrName)
						},
						set(this: T, value: boolean): boolean {
							if (value) {
								this.setAttribute(attrName, '')
							} else {
								this.removeAttribute(attrName)
							}
							return value
						},
					}
				}
			}

			if (!descriptor) {
				descriptor = {
					configurable: true,
					enumerable: true,
					get(this: T): string | null {
						return this.getAttribute(attrName)
					},
					set(this: T, value: string): string {
						this.setAttribute(attrName, value)
						return value
					},
				}
			}

			Reflect.defineProperty(this, key, descriptor)
		})
	}

	if (arguments.length > 1) {
		return decorator(
			configOrValue as K,
			maybeContext as ClassFieldDecoratorContext<T, K>,
		) // decorate
	}

	return decorator // enclose
}
