import { toHyphenCase } from './helpers.js'
import {
	ClassAccessorDecorator,
	Constructor,
	ObservedElement,
} from './types.js'

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

	Object.defineProperty(constructor, 'observedAttributes', {
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

export function bool<T extends ObservedElement, K extends boolean>(
	value: ClassAccessorDecoratorTarget<T, K>,
	context: ClassAccessorDecoratorContext,
) {
	return attr<T, K>({ bool: true })(value, context)
}

export function data<T extends ObservedElement, K extends string>(
	value: ClassAccessorDecoratorTarget<T, K>,
	context: ClassAccessorDecoratorContext,
) {
	return attr<T, K>({ data: true })(value, context)
}

export function attr<T extends ObservedElement, K extends string | boolean>(
	config?: AttrConfig,
): ClassAccessorDecorator<T, K>
export function attr<T extends ObservedElement, K extends string | boolean>(
	value: ClassAccessorDecoratorTarget<T, K>,
	context: ClassAccessorDecoratorContext<T, K>,
): ClassAccessorDecoratorResult<T, K>
export function attr<
	T extends ObservedElement,
	K extends string | null | boolean,
>(
	configOrValue?: AttrConfig | ClassAccessorDecoratorTarget<T, K>,
	maybeContext?: ClassAccessorDecoratorContext<T, K>,
): ClassAccessorDecorator<T, K> | ClassAccessorDecoratorResult<T, K> {
	function decorator(
		value: ClassAccessorDecoratorTarget<T, K>,
		{ name }: ClassAccessorDecoratorContext<T, K>,
	): ClassAccessorDecoratorResult<T, K> {
		const key = String(name)
		let attrName = toHyphenCase(key)

		if (configOrValue !== value) {
			// enclosed
			const config = configOrValue as AttrConfig
			if (config.data) {
				attrName = `data-${attrName}`
			}

			if (config.bool) {
				return {
					get(this: T): K {
						return this.hasAttribute(attrName) as K
					},
					set(this: T, value: K): K {
						if (value) {
							this.setAttribute(attrName, '')
						} else {
							this.removeAttribute(attrName)
						}
						return value
					},
					init(this: T, initialValue: K) {
						if (initialValue) {
							this.setAttribute(attrName, '')
						}
						return initialValue
					},
				}
			}
		}

		return {
			get(this: T): K {
				return this.getAttribute(attrName) as K
			},
			set(this: T, value: K): K {
				this.setAttribute(attrName, (value as string) ?? '')
				return value
			},
			init(this: T, initialValue: K) {
				this.setAttribute(attrName, (initialValue as string) ?? '')
				return initialValue
			},
		}
	}

	if (arguments.length > 1) {
		return decorator(
			configOrValue as ClassAccessorDecoratorTarget<T, K>,
			maybeContext as ClassAccessorDecoratorContext<T, K>,
		) // decorate
	}

	return decorator as ClassAccessorDecorator<T, K> // enclose
}
