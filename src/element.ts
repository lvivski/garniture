import { toHyphenCase } from './helpers.js'
import { slotted } from './slot.js'
import { defaultTemplate } from './template.js'
import {
	ObservedConstructor,
	ClassDecorator,
	ObservedElement,
} from './types.js'
import { getAttributes } from './attr.js'
import { getObserved, hasObserved } from './observe.js'

type ElementConfig = {
	name?: string
	template?: HTMLTemplateElement
	style?: CSSStyleSheet[]
}

export function element<
	TConfig extends ElementConfig,
	TElement extends ObservedElement,
	TCtor extends ObservedConstructor<TElement>,
>(config?: string | TConfig): ClassDecorator<TCtor>
export function element<
	TElement extends ObservedElement,
	TCtor extends ObservedConstructor<TElement>,
>(constructor: TCtor, context: ClassDecoratorContext<TCtor>): TCtor
export function element<
	TConfig extends ElementConfig,
	TElement extends ObservedElement,
	TCtor extends ObservedConstructor<TElement>,
>(
	configOrCtor?: string | TConfig | TCtor,
	maybeContext?: ClassDecoratorContext<TCtor>,
): ClassDecorator<TCtor> | TCtor {
	function decorator(
		Ctor: TCtor,
		{ kind, name, metadata }: ClassDecoratorContext<TCtor>,
	): TCtor {
		if (kind !== 'class') return Ctor

		let tagName = toHyphenCase(String(name))
		if (configOrCtor !== Ctor) {
			// enclosed
			if (typeof configOrCtor === 'string') {
				tagName = configOrCtor
			} else if (configOrCtor?.name) {
				tagName = configOrCtor.name
			}
		}

		if (hasObserved(metadata)) {
			const proto = Ctor.prototype as ObservedElement
			const attributeChangedCallback = proto.attributeChangedCallback
			proto.attributeChangedCallback = function (
				attributeName: string,
				oldValue: string | null,
				newValue: string | null,
				namespace?: string,
			): void {
				attributeChangedCallback?.call(
					this,
					attributeName,
					oldValue,
					newValue,
					namespace,
				)
				if (oldValue === newValue) return
				const updaters = getObserved(metadata)[attributeName]
				if (updaters) {
					for (const updater of updaters) {
						updater.call(this)
					}
				}
			}

			const attrs = getAttributes(metadata).concat(
				Ctor.observedAttributes ?? [],
			)

			Reflect.defineProperty(Ctor, 'observedAttributes', {
				configurable: true,
				enumerable: true,
				value: attrs,
			})
		}

		const ProxyElement = new Proxy(Ctor, {
			construct(target, args, newTarget) {
				const element = Reflect.construct(target, args, newTarget) as TElement

				if (typeof configOrCtor === 'object') {
					customElement<TElement, TConfig>(element, configOrCtor)
				}

				return element
			},
		})

		customElements.define(tagName, ProxyElement)
		return ProxyElement
	}

	if (typeof configOrCtor === 'function') {
		return decorator(configOrCtor, maybeContext!) // decorate
	}

	return decorator as ClassDecorator<TCtor> // enclose
}

function customElement<
	TElement extends ObservedElement,
	TConfig extends ElementConfig,
>(element: TElement, options: TConfig) {
	if (options.template || options.style) {
		const shadowRoot = element.attachShadow({ mode: 'open' })

		const template = options.template ?? defaultTemplate
		shadowRoot.append(template.content.cloneNode(true))

		if (options.style) {
			shadowRoot.adoptedStyleSheets = options.style
		}
	}

	if (element.shadowRoot) {
		element.shadowRoot.addEventListener('slotchange', (event) => {
			const slot = event.target as HTMLSlotElement

			element[slotted] ??= {}
			element[slotted][slot.name] = slot.assignedElements() as HTMLElement[]
		})
	}
}
