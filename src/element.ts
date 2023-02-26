import { toHyphenCase } from './helpers.js'
import { slotted } from './slot.js'
import { defaultTemplate } from './template.js'
import { Constructor, ClassDecorator, ObservedElement } from './types.js'

type ElementConfig = {
	name?: string
	template?: HTMLTemplateElement
	style?: CSSStyleSheet[]
}

export function element<
	TConfig extends ElementConfig,
	TElement extends ObservedElement,
	TCtor extends Constructor<TElement>,
>(config?: string | TConfig): ClassDecorator<TCtor>
export function element<
	TElement extends ObservedElement,
	TCtor extends Constructor<TElement>,
>(constructor: TCtor, context: ClassDecoratorContext<TCtor>): TCtor
export function element<
	TConfig extends ElementConfig,
	TElement extends ObservedElement,
	TCtor extends Constructor<TElement>,
>(
	configOrCtor?: string | TConfig | TCtor,
	maybeContext?: ClassDecoratorContext<TCtor>,
): ClassDecorator<TCtor> | TCtor {
	function decorator(
		constructor: TCtor,
		{ name, addInitializer }: ClassDecoratorContext<TCtor>,
	): TCtor {
		addInitializer(function (this: TCtor) {
			let tagName = toHyphenCase(String(name))
			if (configOrCtor !== constructor) {
				// enclosed
				if (typeof configOrCtor === 'string') {
					tagName = configOrCtor
				} else if (configOrCtor?.name) {
					tagName = configOrCtor.name
				}
			}

			customElements.define(tagName, this)
		})

		const ProxyElement = new Proxy(constructor, {
			construct(target, args, newTarget) {
				const element: TElement = Reflect.construct(target, args, newTarget)

				if (typeof configOrCtor === 'object') {
					customElement<TElement, TConfig>(element, configOrCtor)
				}

				return element
			},
		})

		return ProxyElement as TCtor
	}

	if (typeof configOrCtor === 'function') {
		return decorator(
			configOrCtor as TCtor,
			maybeContext as ClassDecoratorContext<TCtor>,
		) // decorate
	}

	return decorator as ClassDecorator<TCtor> // enclose
}

function customElement<
	TElement extends ObservedElement,
	TConfig extends ElementConfig,
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
		element.shadowRoot.addEventListener('slotchange', (event) => {
			const slot = event.target as HTMLSlotElement

			element[slotted] ||= {}
			element[slotted][slot.name] = slot.assignedElements() as HTMLElement[]
		})
	}
}
