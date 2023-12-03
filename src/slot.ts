import { toHyphenCase } from './helpers.js'
import { ClassAccessorDecorator, ObservedElement } from './types.js'

const slottedMap = new WeakMap<ObservedElement, Record<string, HTMLElement[]>>()

function getSlotted<T extends ObservedElement>(
	element: T,
	slotName = '',
): HTMLElement[] {
	const slotted = slottedMap.get(element)
	return slotted?.[slotName] ?? []
}

export function setSlotted<T extends ObservedElement>(
	element: T,
	slotName: string,
	values: HTMLElement[],
): void {
	const slotted = slottedMap.get(element) ?? {}
	slotted[slotName] = values
	slottedMap.set(element, slotted)
}

type SlotConfig = {
	main?: boolean
}

export function main<T extends ObservedElement, K extends HTMLElement[]>(
	value: ClassAccessorDecoratorTarget<T, K>,
	context: ClassAccessorDecoratorContext<T, K>,
): ClassAccessorDecoratorResult<T, K> {
	return slot<T, K>({ main: true })(value, context)
}

export function slot<T extends ObservedElement, K extends HTMLElement[]>(
	config?: SlotConfig,
): ClassAccessorDecorator<T, K>
export function slot<T extends ObservedElement, K extends HTMLElement[]>(
	value: ClassAccessorDecoratorTarget<T, K>,
	context: ClassAccessorDecoratorContext<T, K>,
): ClassAccessorDecoratorResult<T, K>
export function slot<T extends ObservedElement, K extends HTMLElement[]>(
	configOrValue?: SlotConfig | ClassAccessorDecoratorTarget<T, K>,
	maybeContext?: ClassAccessorDecoratorContext<T, K>,
): ClassAccessorDecorator<T, K> | ClassAccessorDecoratorResult<T, K> {
	function decorator(
		value: ClassAccessorDecoratorTarget<T, K>,
		{ kind, name }: ClassAccessorDecoratorContext<T, K>,
	): ClassAccessorDecoratorResult<T, K> {
		if (kind !== 'accessor') return value

		const key = String(name)
		let slotName = toHyphenCase(key)

		let config: SlotConfig
		if (configOrValue !== value) {
			// enclosed
			config = configOrValue as SlotConfig
			if (config.main) {
				slotName = ''
			}
		}

		return {
			get(this: T): K {
				return getSlotted(this, slotName) as K
			},
			set(this: T, values: HTMLElement[] = []): void {
				if (!Array.isArray(values)) {
					throw new TypeError('Value must be an Array')
				}
				const previous = getSlotted(this, slotName).slice()
				const existing: boolean[] = []

				setSlotted(this, slotName, values)

				// add new elements
				for (const value of values) {
					if (slotName) {
						value.setAttribute('slot', slotName)
					}
					const index = previous.indexOf(value)
					if (index === -1) {
						this.append(value)
					} else {
						existing[index] = true
					}
				}

				// remove old elements
				for (let i = 0; i < previous.length; i++) {
					if (existing[i] !== true) {
						const value = previous[i]
						value.removeAttribute('slot')
						value.remove()
					}
				}
			},
		}
	}

	if (maybeContext) {
		return decorator(
			configOrValue as ClassAccessorDecoratorTarget<T, K>,
			maybeContext,
		) // decorate
	}

	return decorator as ClassAccessorDecorator<T, K> // enclose
}
