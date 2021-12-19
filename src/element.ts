import { decorateInternal } from './decorate.js'
import { toHyphenCase } from './helpers.js'
import { slotted } from './slot.js'
import { defaultTemplate } from './template.js'
import { Constructor, ClassDecorator, ObservedElement, DecorationConfig, ExpectedProperties } from './types.js'

type ElementConfig<T> = {
	name?: string
	template?: HTMLTemplateElement
	style?: CSSStyleSheet[]
	decorate?: DecorationConfig<T>
}

type WithDecorated<TElement extends ObservedElement, TConfig extends ElementConfig<TConfig['decorate']>> = Constructor<TElement & ExpectedProperties<TConfig['decorate'], TElement>>

export function element<TConfig extends ElementConfig<TConfig['decorate']>, TElement extends ObservedElement, TCtor extends WithDecorated<TElement, TConfig>>(
	config?: string | TConfig
): ClassDecorator<TCtor>
export function element<TConfig extends ElementConfig<TConfig['decorate']>, TElement extends ObservedElement, TCtor extends WithDecorated<TElement, TConfig>>(
	constructor: TCtor
): TCtor
export function element<TConfig extends ElementConfig<TConfig['decorate']>, TElement extends ObservedElement, TCtor extends WithDecorated<TElement, TConfig>>(
	configOrCtor?: string | TConfig | TCtor
): ClassDecorator<TCtor> | TCtor {
	function decorator(constructor: TCtor): TCtor {
		let tagName = toHyphenCase(constructor.name)
		if (configOrCtor !== constructor) { // enclosed
			if (typeof configOrCtor === 'string') {
				tagName = configOrCtor
			} else if (configOrCtor?.name) {
				tagName = configOrCtor.name
			}
		}

		const CustomElement = class extends (constructor as Constructor<ObservedElement>) {
			constructor() {
				super()
				if (typeof configOrCtor === 'object') {
					const config = configOrCtor as ElementConfig<TConfig['decorate']>
					if (config.template || config.style) {
						const shadowRoot = this.attachShadow({ mode: 'open' })

						const template = config.template || defaultTemplate
						shadowRoot.append(template.content.cloneNode(true))

						if (config.style) {
							shadowRoot.adoptedStyleSheets = config.style
						}

						shadowRoot.addEventListener('slotchange', event => {
							const slot = event.target as HTMLSlotElement

							this[slotted] ||= {}
							this[slotted]![slot.name] = slot.assignedElements() as HTMLElement[]
						})
					}

					if (config.decorate) {
						decorateInternal<InstanceType<typeof CustomElement>>(this, config.decorate)
					}
				}
			}
		}

		Object.defineProperty(CustomElement, 'name', {
			value: `Element(${constructor.name})`
		})

		customElements.define(tagName, CustomElement)

		return CustomElement as TCtor
	}

	if (typeof configOrCtor === 'function') {
		return decorator(configOrCtor as TCtor) // decorate
	}

	return decorator as unknown as ClassDecorator<TCtor> // enclose
}

