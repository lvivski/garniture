import {
	element, data, bool, attr, observe, html, css, slot, decorate,
	DecorationOptions, CustomElement
} from '../src/index.js'

const reset = css`
* {
	margin: 0;
	padding: 0;
	border: 0;
	font-size: 100%;
	font: inherit;
	vertical-align: baseline;
}
`

const red = css`
:host {
	background-color: red
}
`

@element
class SomeTag extends HTMLElement {
	@attr one!: string
	@bool two!: boolean
	@data three!: string

	@observe<SomeTag>(['one', 'three'])
	update() {
		console.log(this.tagName, this.one, this.two, this.three)
	}
}

@element({
	template: html`
	<h1><slot></slot></h1>
	`,
	style: css`
	${reset}
	:host {
		display: block;
	}
	${red}
	h1 {
		background-color: purple;
		color: white;
		width: 50%
	}
	`
})
class PurpleHeader extends HTMLElement {
	@attr greeting: string = 'Hello'

	constructor() {
		super()
		this.textContent = this.greeting
	}
}

@element({
	style: css`
	:host {
		color: red;
	}
	`
})
class RedText extends HTMLElement {
}

@element({
	template: html`
	<slot name="data-log"></slot>
	<slot></slot>
	`,
	style: css`
	:host {
		display: block;
	}
	`
})
class SlotCounter extends HTMLElement {

	@slot dataLog!: HTMLElement[]
	@slot({
		default: true
	})
	main!: HTMLElement[]

	connectedCallback() {
		let counter = 0
		setInterval(() => {
			const span = document.createElement('span')
			span.textContent = `${counter++}`
			const span2 = span.cloneNode(true) as HTMLSpanElement
			this.dataLog = [span]
			this.main = [span2]
		}, 500)
	}
}

element(decorate(class SomeTag2 extends HTMLElement {
	one!: string
	two!: boolean
	three!: string

	update() {
		console.log(this.tagName, this.one, this.two, this.three)
	}
}, {
	one: attr,
	two: bool,
	three: data,
	update: observe(['one', 'three']),
}))

element({
	template: html`
	<slot name="data-log"></slot>
	<slot></slot>
	`,
	style: css`
	:host {
		display: block;
	}
	`
})(decorate(class SlotCounter2 extends HTMLElement {

	dataLog!: HTMLElement[]
	main!: HTMLElement[]

	connectedCallback() {
		let counter = 0
		setInterval(() => {
			const span = document.createElement('span')
			span.textContent = `${counter++}`
			const span2 = span.cloneNode(true) as HTMLSpanElement
			this.dataLog = [span]
			this.main = [span2]
		}, 1000)
	}
}, {
	dataLog: slot,
	main: slot({ default: true }),
}))

element({
	decorate: {
		one: attr,
		two: bool,
		three: data,
		update: observe(['one', 'three']),
	}
})(class SomeTag3 extends HTMLElement {
	one!: string
	two!: boolean
	three!: string

	update() {
		console.log(this.tagName, this.one, this.two, this.three)
	}
})

element({
	template: html`
	<slot name="data-log"></slot>
	<slot></slot>
	`,
	style: css`
	:host {
		display: block;
	}
	`,
	decorate: {
		dataLog: slot,
		main: slot({ default: true }),
	}
})(class SlotCounter3 extends HTMLElement {

	dataLog!: HTMLElement[]
	main!: HTMLElement[]

	connectedCallback() {
		let counter = 0
		setInterval(() => {
			const span = document.createElement('span')
			span.textContent = `${counter++}`
			const span2 = span.cloneNode(true) as HTMLSpanElement
			this.dataLog = [span]
			this.main = [span2]
		}, 2000)
	}
})

element(class SlotCounter4 extends CustomElement {
	static template = html`
	<slot name="data-log"></slot>
	<slot></slot>
	`
	static style = css`
	:host {
		display: block;
	}
	`
	static decorate: DecorationOptions<SlotCounter4> = {
		dataLog: slot,
		main: slot({ default: true }),
	}

	dataLog!: HTMLElement[]
	main!: HTMLElement[]

	constructor() {
		super()
		let counter = 500
		const span = document.createElement('span')
		span.textContent = `${counter++}`
		const span2 = span.cloneNode(true) as HTMLSpanElement
		this.dataLog = [span]
		this.main = [span2]
	}
})

