import { toHyphenCase } from './helpers.js'
import { ClassFieldDecorator, ObservedElement } from './types.js'

export const slotted = Symbol()

declare module './types.js' {
	interface ObservedElement {
		[slotted]?: {
			[key: string]: HTMLElement[]
		}
	}
}

type SlotConfig = {
	default: boolean
}

export function slot<T>(config?: SlotConfig): ClassFieldDecorator<T>
export function slot<K extends undefined>(
	value: K,
	context: ClassFieldDecoratorContext,
): void
export function slot<T extends ObservedElement, K extends undefined>(
	configOrValue?: SlotConfig | K,
	maybeContext?: ClassFieldDecoratorContext<T, K>,
): ClassFieldDecorator<T, K> | void {
	function decorator(
		value: K,
		{ name, addInitializer }: ClassFieldDecoratorContext<T, K>,
	): void {
		addInitializer(function () {
			const key = String(name)
			let slotName = toHyphenCase(key)

			let config: SlotConfig
			if (configOrValue !== value) {
				// enclosed
				config = configOrValue as SlotConfig
				if (config.default) {
					slotName = ''
				}
			}
			Reflect.defineProperty((this as any).__proto__, key, {
				configurable: true,
				enumerable: true,
				get(this: T): HTMLElement[] {
					return this[slotted]?.[slotName] || []
				},
				set(this: T, values: HTMLElement[] = []): void {
					if (!Array.isArray(values)) {
						throw new TypeError('Value must be an Array')
					}
					const previous = (
						this[slotted]?.[slotName] || []
					).slice() as HTMLElement[]
					const existing: boolean[] = []

					this[slotted] ||= {}
					this[slotted][slotName] = values

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
			})
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
