export function toHyphenCase(str: string): string {
	return str.replace(/([a-zA-Z])(?=[A-Z])/g, '$1-').toLowerCase()
}

const adopted = Symbol()
declare global {
	interface CSSStyleSheet {
		replace(text: string): Promise<ConstructableStyleSheet>
		replaceSync(text: string): void
	}

	interface ShadowRoot {
		[adopted]?: ConstructableStyleSheet[]
		adoptedStyleSheets: CSSStyleSheet[]
	}

	interface TrustedTypesPolicy {
		createHTML(html: string): string
	}

	interface TrustedTypes {
		createPolicy(name: string, rules: TrustedTypesPolicy): TrustedTypesPolicy
	}

	interface Window {
		trustedTypes: TrustedTypes
	}

}

if (typeof window.trustedTypes == 'undefined') {
	window.trustedTypes = { createPolicy: (_, rules) => rules }
}

export const htmlPolicy = window.trustedTypes.createPolicy('html', {
	createHTML: (html: string) => html,
})

const supportsConstructableStyleSheets = 'replace' in CSSStyleSheet.prototype
const doc = document.implementation.createHTMLDocument('')
const styles = Symbol()

type ConstructableStyles = {
	main: HTMLStyleElement,
	adopted: HTMLStyleElement[]
}

interface ConstructableStyleSheet extends CSSStyleSheet {
	[styles]: ConstructableStyles
}

function ConstructableStyleSheet(this: ConstructableStyleSheet) {
	const style = doc.createElement('style')
	doc.body.appendChild(style)
	style.appendChild(doc.createTextNode(''))
	this[styles] = {
		main: style,
		adopted: []
	}
}

ConstructableStyleSheet.prototype = Object.create(
	CSSStyleSheet,
) as CSSStyleSheet

Object.defineProperty(ConstructableStyleSheet.prototype, 'cssRules', {
	configurable: true,
	enumerable: true,
	get(this: ConstructableStyleSheet) {
		return this[styles]?.main.sheet?.cssRules
	},
})

// TODO implement insertRule and deleteRule
ConstructableStyleSheet.prototype.replace = function (
	this: ConstructableStyleSheet,
	contents: string,
): Promise<ConstructableStyleSheet> {
	try {
		this.replaceSync(contents)
		return Promise.resolve(this)
	} catch (e) {
		return Promise.reject(e as Error)
	}
}

ConstructableStyleSheet.prototype.replaceSync = function (
	this: ConstructableStyleSheet,
	contents: string,
) {
	const style = this[styles]
	const css = contents.replace(/@import.+?;?$/gm, '')

	style.main.textContent = css
	for (const adopted of style.adopted) {
		adopted.textContent = css
	}
}

if (!supportsConstructableStyleSheets) {
	Object.defineProperty(ShadowRoot.prototype, 'adoptedStyleSheets', {
		configurable: true,
		enumerable: true,
		get(this: ShadowRoot): ConstructableStyleSheet[] {
			return this[adopted] ?? []
		},
		set(this: ShadowRoot, values: ConstructableStyleSheet[] = []) {
			if (!Array.isArray(values)) {
				throw new TypeError('Value must be an Array')
			}
			const previous = (this[adopted] ?? []).slice()
			const existing: boolean[] = []

			this[adopted] = values
			// add new styles
			for (const value of values) {
				const index = previous.indexOf(value)
				if (index === -1) {
					const style = value[styles]
					const clone = style.main.cloneNode(true) as HTMLStyleElement
					style.adopted.push(clone)
					this.append(clone)
				} else {
					existing[index] = true
				}
			}

			// remove old styles
			for (let i = 0; i < previous.length; i++) {
				if (existing[i] !== true) {
					const prevStyle = previous[i][styles]
					for (let j = 0; j < prevStyle.adopted.length; j++) {
						const sheet = prevStyle.adopted[j]
						if (sheet.parentNode === this) {
							sheet.remove()
							prevStyle.adopted.splice(j, 1)
							break
						}
					}
				}
			}
		},
	})

	// @ts-expect-error: replaces default implementation
	window.CSSStyleSheet = ConstructableStyleSheet as CSSStyleSheet
}

// @ts-expect-error: replaces default implementation
Symbol.metadata ??= Symbol('metadata')
