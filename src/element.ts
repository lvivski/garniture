import { decorate, decorateInstance } from './decorate.js'
import { toHyphenCase } from './helpers.js'
import { slotted } from './slot.js'
import { defaultTemplate } from './template.js'
import {
	Constructor, ClassDecorator, ObservedElement, DecorationConfig, DecorationOptions, ExpectedMembers
} from './types.js'

type ElementConfig<TConfig extends ElementConfig<TConfig>> = {
	name?: string
	template?: HTMLTemplateElement
	style?: CSSStyleSheet[]
	decorate?: DecorationConfig<TConfig['decorate']>
}

type WithDecorated<TConfig extends ElementConfig<TConfig>, U>
	= Constructor<U & ExpectedMembers<TConfig['decorate'], U>>

export function element<
	TConfig extends ElementConfig<TConfig>,
	TElement extends ObservedElement,
	TCtor extends WithDecorated<TConfig, TElement>
>(
	config?: string | TConfig
): ClassDecorator<TCtor>
export function element<
	TConfig extends ElementConfig<TConfig>,
	TElement extends ObservedElement,
	TCtor extends WithDecorated<TConfig, TElement>
>(
	constructor: TCtor
): TCtor
export function element<
	TConfig extends ElementConfig<TConfig>,
	TElement extends ObservedElement,
	TCtor extends WithDecorated<TConfig, TElement>
>(
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

		const config = configOrCtor as TConfig
		if (config.decorate) {
			decorate<ObservedElement>(constructor, config.decorate)
		}

		const ProxyElement = new Proxy(constructor, {
			construct(target, args, newTarget) {
				const element: TElement = Reflect.construct(target, args, newTarget)

				if (!(element instanceof CustomElement) && typeof configOrCtor === 'object') {
					customElement<TElement, TConfig>(element, configOrCtor)
				}

				return element
			}
		})

		customElements.define(tagName, ProxyElement)
		return ProxyElement as TCtor
	}

	if (typeof configOrCtor === 'function') {
		return decorator(configOrCtor as TCtor) // decorate
	}

	return decorator as unknown as ClassDecorator<TCtor> // enclose
}

function customElement<
	TElement extends ObservedElement,
	TConfig extends ElementConfig<TConfig>
>(element: TElement, options: TConfig) {
	if (options.template || options.style) {
		const shadowRoot = element.attachShadow({ mode: 'open' })

		const template = options.template || defaultTemplate
		shadowRoot.append(template.content.cloneNode(true))

		if (options.style) {
			shadowRoot.adoptedStyleSheets = options.style
		}
	}

	if (element.shadowRoot) {
		element.shadowRoot.addEventListener('slotchange', event => {
			const slot = event.target as HTMLSlotElement

			element[slotted] ||= {}
			element[slotted][slot.name] = slot.assignedElements() as HTMLElement[]
		})
	}

	if (options.decorate) {
		// Needed for decorating instance fields
		decorateInstance(element, options.decorate as unknown as DecorationOptions<TElement>)
	}
}

export class CustomElement extends HTMLElement {
	constructor() {
		super()
		const ctor = this.constructor
		customElement(this, ctor)
	}
}

