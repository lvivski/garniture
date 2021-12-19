import { toHyphenCase } from './helpers.js'
import { Constructor, ObservedElement, PropertyDecorator } from './types.js'

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

function addToObserved<T extends ObservedElement>(proto: T, key: string, attr: string) {
	proto[attributes] ||= {}
	proto[attributes]![key] = attr

	const { constructor } = proto
	let attrs = [attr]
	if ('observedAttributes' in constructor) {
		const observed = (constructor as Constructor<T>).observedAttributes!
		if (observed.includes(attr)) return
		attrs = observed.concat(observed)
	}
	Object.defineProperty(constructor, 'observedAttributes', {
		configurable: true,
		enumerable: true,
		value: attrs,
	})
}

export function getAttrName<T extends ObservedElement>(proto: T, attr: string): string | undefined {
	return proto[attributes]?.[attr]
}

export function bool<K extends string>(proto: Record<K, boolean>, key: K): void {
	return attr({ bool: true })(proto as any, key)
}

export function data<K extends string>(proto: Record<K, string>, key: K): void {
	return attr({ data: true })(proto as any, key)
}

export function attr<T extends ObservedElement>(
	config?: AttrConfig
): PropertyDecorator<T, string | boolean>
export function attr<K extends string>(
	proto: Record<K, boolean | string>,
	key: K
): void
export function attr<T extends ObservedElement, K extends string>(
	configOrProto?: AttrConfig | T,
	maybeKey?: K,
): PropertyDecorator<T, string | boolean> | void {
	function decorator(proto: T, key: string): void {
		let attrName = toHyphenCase(key)
		let descriptor
		if (configOrProto !== proto) { // enclosed
			const config = configOrProto as AttrConfig
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
					}
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
				}
			}
		}

		Object.defineProperty(proto, key, descriptor)

		addToObserved(proto, key, attrName)
	}

	if (arguments.length > 1) {
		return decorator(configOrProto as T, maybeKey as string) // decorate
	}

	return decorator // enclose
}
