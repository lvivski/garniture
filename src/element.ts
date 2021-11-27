import { toHyphenCase } from './helpers.js'
import { defaultTemplate } from './template.js'
import { Constructor, DecoratedClass, ObservedElement } from './types.js'

type ElementConfig = {
	name?: string
	template?: HTMLTemplateElement
	style?: CSSStyleSheet[]
}

export function element<T extends ObservedElement>(
	config?: string | ElementConfig
): DecoratedClass<T>
export function element<T extends ObservedElement>(
	constructor: Constructor<T>
): void
export function element<T extends ObservedElement>(
	configOrCtor?: string | ElementConfig | Constructor<T>
): DecoratedClass<T> | void {
	function decorator(constructor: Constructor<T>): void {
		let tagName
		if (configOrCtor !== constructor) { // enclosed
			if (typeof configOrCtor === 'string') {
				tagName = configOrCtor
			} else {
				tagName = configOrCtor?.name || null
			}
		}

		if (!tagName) {
			tagName = toHyphenCase(constructor.name)
		}

		customElements.define(
			tagName,
			class extends (constructor as Constructor<ObservedElement>) {
				constructor() {
					super()
					if (typeof configOrCtor === 'object') {
						if (configOrCtor.template || configOrCtor.style) {
							const shadowRoot = this.attachShadow({ mode: 'open' })

							const template = configOrCtor.template || defaultTemplate
							shadowRoot.append(template.content.cloneNode(true))

							if (configOrCtor.style) {
								shadowRoot.adoptedStyleSheets = configOrCtor.style
							}
						}
					}
				}
			})
	}

	if (typeof configOrCtor === 'function') {
		return decorator(configOrCtor as Constructor<T>) // decorate
	}

	return decorator // enclose
}

