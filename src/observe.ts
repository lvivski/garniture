import { getAttrName, getAttributes } from './attr.js'
import { toHyphenCase } from './helpers.js'
import {
	ObservablePropertiesList,
	ObservedElement,
	UpdateFunction,
	AnyMethod,
	ClassMethodDecorator,
} from './types.js'

const observedMap = new WeakMap<
	DecoratorMetadata,
	Record<string, Set<UpdateFunction>>
>()

export function getObserved(metadata: DecoratorMetadata) {
	return observedMap.get(metadata) ?? {}
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
		{ metadata }: ClassMethodDecoratorContext<T, K>,
	): void {
		let observedAttributes: string[]

		if (propertiesOrValue !== value) {
			// enclosed
			const properties = propertiesOrValue as ObservablePropertiesList<T>
			observedAttributes =
				properties && properties.length
					? properties.map(
							(attribute) =>
								getAttrName(metadata, attribute as string) ||
								toHyphenCase(attribute as string),
					  )
					: getAttributes(metadata) || []
		} else {
			// decorated
			observedAttributes = getAttributes(metadata) || []
		}

		const observed = observedMap.get(metadata) ?? {}
		for (const attribute of observedAttributes) {
			observed[attribute] ??= new Set()
			observed[attribute].add(value as UpdateFunction)
		}
		observedMap.set(metadata, observed)
	}

	if (arguments.length > 1) {
		return decorator(
			propertiesOrValue as K,
			maybeContext as ClassMethodDecoratorContext<T, K>,
		) // decorate
	}

	return decorator // enclose
}
