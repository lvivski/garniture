type TemplateStringValue = string | number
type StyleStringValue = TemplateStringValue | CSSStyleSheet | CSSStyleSheet[]

export const defaultTemplate = html`<slot></slot>`

export function html(
	strings: TemplateStringsArray,
	...values: TemplateStringValue[]
) {
	let html = ''

	for (let i = 0; i < strings.length; i++) {
		html += strings[i]
		const inRange = i < values.length - 1
		if (inRange) {
			html += values[i]
		}
	}

	const template = document.createElement('template')
	template.innerHTML = html

	return template
}

export function css(
	strings: TemplateStringsArray,
	...values: StyleStringValue[]
) {
	let css = ''
	let styles: CSSStyleSheet[] = []

	for (let i = 0; i < strings.length; i++) {
		css += strings[i]
		const value = values[i]
		const needsFlush = typeof value === 'object' && css.trim() !== ''
		const inRange = i < values.length - 1

		if (needsFlush || !inRange) {
			const sheet = new CSSStyleSheet()
			sheet.replaceSync(css.trim())
			styles.push(sheet)
			css = ''
		}

		if (Array.isArray(value)) {
			styles = styles.concat(value)
		} else if (value instanceof CSSStyleSheet) {
			styles.push(value)
		}
	}

	return styles
}
