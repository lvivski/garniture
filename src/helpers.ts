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
}

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

ConstructableStyleSheet.prototype = Object.create(CSSStyleSheet)

Object.defineProperty(ConstructableStyleSheet.prototype, 'cssRules', {
	configurable: true,
	enumerable: true,
	get(this: ConstructableStyleSheet) {
		return this[styles]?.main.sheet?.cssRules
	}
})

// TODO implement insertRule and deleteRule
ConstructableStyleSheet.prototype.replace = function (contents: string): Promise<ConstructableStyleSheet> {
	try {
		this.replaceSync(contents)
		return Promise.resolve(this)
	} catch (e) {
		return Promise.reject(e)
	}
}

ConstructableStyleSheet.prototype.replaceSync = function (contents: string) {
	const style = this[styles]
	const css = contents.replace(/@import.+?;?$/gm, '')

	style.main.textContent = css
	for (let i = 0; i < style.adopted.length; i++) {
		const adopted = style.adopted[i]
		adopted.textContent = css
	}
}

if (!supportsConstructableStyleSheets) {
	Object.defineProperty(ShadowRoot.prototype, 'adoptedStyleSheets', {
		configurable: true,
		enumerable: true,
		get(this: ShadowRoot): ConstructableStyleSheet[] {
			return this[adopted] || []
		},
		set(this: ShadowRoot, values: ConstructableStyleSheet[]) {
			const previous = (this[adopted] || []).slice() as ConstructableStyleSheet[]
			const existing: boolean[] = []
			if (!Array.isArray(values)) {
				values = [].concat(values || [])
			}
			this[adopted] = values
			// add new styles
			for (let i = 0; i < values.length; i++) {
				const value = values[i]
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
		}
	})

	// @ts-expect-error: replaces default implementation
	window.CSSStyleSheet = ConstructableStyleSheet as CSSStyleSheet
}
