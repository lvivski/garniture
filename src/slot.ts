import { toHyphenCase } from './helpers.js'
import { DecoratedProperty, ObservedElement } from './types.js'

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

export function slot<T extends ObservedElement>(
	config?: SlotConfig
): DecoratedProperty<T>
export function slot<K extends string>(
	proto: Record<K, HTMLElement[]>,
	key: K
): void
export function slot<T extends ObservedElement, K extends string>(
	configOrProto?: SlotConfig | T,
	maybeKey?: K,
): DecoratedProperty<T> | void {
	function decorator(proto: T, key: string): void {
		let slotName = toHyphenCase(key)
		let config: SlotConfig
		if (configOrProto !== proto) { // enclosed
			config = configOrProto as SlotConfig
			if (config.default) {
				slotName = ''
			}
		}

		Object.defineProperty(proto, key, {
			configurable: true,
			enumerable: true,
			get(this: T): HTMLElement[] {
				return this[slotted]?.[slotName] || []
			},
			set(this: T, values: HTMLElement[] = []): void {
				if (!Array.isArray(values)) {
					throw new TypeError('Value must be an Array')
				}
				const previous = (this[slotted]?.[slotName] || []).slice() as HTMLElement[]
				const existing: boolean[] = []

				this[slotted] ||= {}
				this[slotted]![slotName] = values
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
			}
		})
	}

	if (arguments.length > 1) {
		return decorator(configOrProto as T, maybeKey as string) // decorate
	}

	return decorator // enclose
}
