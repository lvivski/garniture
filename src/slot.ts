import { toHyphenCase } from './helpers.js'
import { DecoratedProperty, ObservedElement } from './types.js'

const slotted = Symbol()

declare module './types.js' {
	interface ObservedElement {
		[slotted]?: {
			[key: string]: HTMLElement[]
		}
	}
}

type SlotConfig = {
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
		const slotName = toHyphenCase(key)
		let config: SlotConfig
		if (configOrProto !== proto) { // enclosed
			config = configOrProto as SlotConfig
		}

		Object.defineProperty(proto, key, {
			configurable: true,
			enumerable: true,
			get(): HTMLElement[] {
				return this[slotted] || []
			},
			set(values: HTMLElement[]): void {
				const previous = (this[slotted] || []).slice() as HTMLElement[]
				const existing = []
				if (!Array.isArray(values)) {
					values = [].concat(values || [])
				}
				this[slotted] = values
				// add new elements
				for (let i = 0; i < values.length; i++) {
					const value = values[i]
					value.setAttribute('slot', slotName)
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
		return decorator(configOrProto as T, maybeKey!) // decorate
	}

	return decorator // enclose
}
