import { toHyphenCase } from './helpers.js'
import { slotted } from './slot.js'
import { defaultTemplate } from './template.js'
import { Constructor, ClassDecorator, ObservedElement } from './types.js'

type ElementConfig = {
	name?: string
	template?: HTMLTemplateElement
	style?: CSSStyleSheet[]
}

export function element<T extends ObservedElement>(
	config?: string | ElementConfig
): ClassDecorator<T>
export function element<T extends ObservedElement>(
	constructor: Constructor<T>
): Constructor<T>
export function element<T extends ObservedElement>(
	configOrCtor?: string | ElementConfig | Constructor<T>
): ClassDecorator<T> | Constructor<T> {
	function decorator(constructor: Constructor<T>): Constructor<T> {
		let tagName = toHyphenCase(constructor.name)
		if (configOrCtor !== constructor) { // enclosed
			if (typeof configOrCtor === 'string') {
				tagName = configOrCtor
			} else if (configOrCtor?.name) {
				tagName = configOrCtor.name
			}
		}

		const Element = class extends (constructor as Constructor<ObservedElement>) {
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

						shadowRoot.addEventListener('slotchange', event => {
							const slot = event.target as HTMLSlotElement

							this[slotted] ||= {}
							this[slotted]![slot.name] = slot.assignedElements() as HTMLElement[]
						})
					}
				}
			}
		}

		Object.defineProperty(Element, 'name', {
			value: `Element(${constructor.name})`
		})

		customElements.define(tagName, Element)

		return Element as Constructor<T>
	}

	if (typeof configOrCtor === 'function') {
		return decorator(configOrCtor as Constructor<T>) // decorate
	}

	return decorator // enclose
}

