import { ObservedElement } from './types.js'

type BindMethodTarget<T> = (this: T, event: Event) => void

// Map to track delegated event listeners per instance
const delegatedListeners = new WeakMap<
	ObservedElement,
	Map<string, EventListener>
>()

export function bind<T extends ObservedElement, K extends HTMLElement[] | null>(
	selector: string,
): (
	value: ClassAccessorDecoratorTarget<T, K>,
	context: ClassAccessorDecoratorContext<T, K>,
) => void
export function bind<T extends ObservedElement>(
	selector: string,
	event: string,
): (
	value: BindMethodTarget<T>,
	context: ClassMethodDecoratorContext<T, (event: Event) => void>,
) => void
export function bind<T extends ObservedElement, K extends HTMLElement[] | null>(
	selector: string,
	event?: string,
) {
	return function (
		value: ClassAccessorDecoratorTarget<T, K> | BindMethodTarget<T>,
		context:
			| ClassAccessorDecoratorContext<T, K>
			| ClassMethodDecoratorContext<T, (event: Event) => void>,
	) {
		const { kind } = context
		if (kind === 'accessor') {
			return {
				get(this: T): K {
					return this.querySelector(selector) as K
				},
			}
		} else if (kind === 'method' && event) {
			const method = value as BindMethodTarget<T>

			context.addInitializer(function (this: T) {
				const listeners =
					delegatedListeners.get(this) ?? new Map<string, EventListener>()
				delegatedListeners.set(this, listeners)

				const key = `${selector}:${event}`

				if (listeners.has(key)) {
					return
				}

				const handler = function (this: T, e: Event) {
					const target = e.target as Element
					if (target && target.matches(selector)) {
						method.call(this, e)
					}
				}

				listeners.set(key, handler)

				const connectedCallback = this.connectedCallback
				this.connectedCallback = function () {
					connectedCallback?.call(this)
					this.addEventListener(event, handler)
				}

				const disconnectedCallback = this.disconnectedCallback
				this.disconnectedCallback = function () {
					disconnectedCallback?.call(this)
					this.removeEventListener(event, handler)
				}

				if (this.isConnected) {
					this.addEventListener(event, handler)
				}
			})

			return method
		}

		return value
	}
}
