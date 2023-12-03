import { toHyphenCase } from './helpers.js'
import { ClassAccessorDecorator, ObservedElement } from './types.js'

const attributesMap = new WeakMap<DecoratorMetadata, Record<string, string>>()

type AttrConfig = {
	data?: boolean
	bool?: boolean
}

function addToAttributes(
	metadata: DecoratorMetadata,
	key: string,
	attr: string,
) {
	const attributes = attributesMap.get(metadata) ?? {}
	attributes[key] = attr
	attributesMap.set(metadata, attributes)
}

export function getAttributes(metadata: DecoratorMetadata) {
	return Object.values(attributesMap.get(metadata) ?? {})
}

export function getAttrName(
	metadata: DecoratorMetadata,
	attr: string,
): string | undefined {
	return attributesMap.get(metadata)?.[attr]
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
		{ kind, name, metadata }: ClassAccessorDecoratorContext<T, K>,
	) {
		if (kind !== 'accessor') return value

		const key = String(name)
		let attrName = toHyphenCase(key)

		let result: ClassAccessorDecoratorResult<T, K> = {
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

		if (configOrValue !== value) {
			// enclosed
			const config = configOrValue as AttrConfig
			if (config.data) {
				attrName = `data-${attrName}`
			}

			if (config.bool) {
				result = {
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

		addToAttributes(metadata, key, attrName)

		return result
	}

	if (maybeContext) {
		return decorator(
			configOrValue as ClassAccessorDecoratorTarget<T, K>,
			maybeContext,
		) // decorate
	}

	return decorator as ClassAccessorDecorator<T, K> // enclose
}
