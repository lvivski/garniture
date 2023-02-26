import { getAttrName } from './attr.js'
import { toHyphenCase } from './helpers.js'
import {
	Constructor,
	ObservablePropertiesList,
	ObservedElement,
	UpdateFunction,
	AnyMethod,
	ClassMethodDecorator,
} from './types.js'

const observed = Symbol()

declare module './types.js' {
	interface ObservedElement {
		[observed]?: {
			[key: string]: Set<UpdateFunction>
		}
	}
}

export function observe<T>(
	properties?: T extends ObservedElement
		? ObservablePropertiesList<T>
		: Array<keyof T>,
): ClassMethodDecorator<T>
export function observe<T extends ObservedElement, K extends AnyMethod<T>>(
	value: K,
	context: ClassMethodDecoratorContext<T, K>,
): void
export function observe<T extends ObservedElement, K extends AnyMethod<T>>(
	propertiesOrValue?: ObservablePropertiesList<T> | K,
	maybeContext?: ClassMethodDecoratorContext<T, K>,
): ClassMethodDecorator<T, K> | void {
	function decorator(
		value: K,
		{ addInitializer }: ClassMethodDecoratorContext<T, K>,
	): void {
		addInitializer(function () {
			const { constructor } = this
			const proto = constructor.prototype

			let observedAttributes: string[]

			if (propertiesOrValue !== value) {
				// enclosed
				const properties = propertiesOrValue as ObservablePropertiesList<T>
				observedAttributes =
					properties && properties.length
						? properties.map(
								(attribute) =>
									getAttrName(proto, attribute as string) ||
									toHyphenCase(attribute as string),
						  )
						: (constructor as Constructor<T>).observedAttributes || []
			} else {
				// decorated
				observedAttributes =
					(constructor as Constructor<T>).observedAttributes || []
			}

			if (!proto[observed]) {
				proto[observed] = {}
				const attributeChangedCallback = proto.attributeChangedCallback
				proto.attributeChangedCallback = function (
					attributeName: string,
					oldValue: string | null,
					newValue: string | null,
				): void {
					console.log(
						'attributeChangedCallback',
						attributeName,
						oldValue,
						newValue,
					)
					if (attributeChangedCallback) {
						attributeChangedCallback.call(
							this,
							attributeName,
							oldValue,
							newValue,
						)
					}
					if (oldValue === newValue) return

					const updaters = this[observed][attributeName]
					if (updaters) {
						for (const updater of updaters) {
							updater.call(this)
						}
					}
				}
			}

			for (const attribute of observedAttributes) {
				proto[observed][attribute] ||= new Set()
				proto[observed][attribute].add(value as UpdateFunction)
			}
		})
	}

	if (arguments.length > 1) {
		return decorator(
			propertiesOrValue as K,
			maybeContext as ClassMethodDecoratorContext<T, K>,
		) // decorate
	}

	return decorator // enclose
}
