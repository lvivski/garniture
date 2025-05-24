import {
	element,
	data,
	bool,
	attr,
	observe,
	html,
	css,
	slot,
	main,
	bind,
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
		background-color: red;
	}
`

@element
class SomeTag extends HTMLElement {
	@attr
	accessor one = 'one'
	@bool
	accessor two = false
	@data
	accessor three = 'three'

	@observe(['one', 'three'])
	update() {
		console.log(this.tagName, this.one, this.two, this.three)
	}
}

@element({
	template: html` <h1><slot></slot></h1> `,
	style: css`
		${reset}
		:host {
			display: block;
		}
		${red}
		h1 {
			background-color: purple;
			color: white;
			width: 50%;
		}
	`,
})
class PurpleHeader extends HTMLElement {
	@attr({ data: true })
	accessor greeting = 'Hello'

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
	`,
})
class RedText extends HTMLElement {}

@element({
	template: html`
		<slot name="data-log"></slot>
		<slot></slot>
	`,
	style: css`
		:host {
			display: block;
		}
	`,
})
class SlotCounter extends HTMLElement {
	@slot
	accessor dataLog: HTMLElement[] = []
	@main
	accessor main: HTMLElement[] = []

	connectedCallback() {
		let counter = 0
		setInterval(() => {
			const span = document.createElement('span')
			span.textContent = `${counter++}`
			const span2 = span.cloneNode(true) as HTMLSpanElement
			this.dataLog = [span]
			this.main = [span2]
		}, 5000)
	}

	@bind('span', 'click')
	handleClick(event: Event) {
		const target = event.target as HTMLSpanElement
		console.log('Clicked:', target?.textContent)
		if (target) {
			// toggle color and log text content
			if (target.style.color === 'blue') {
				target.style.color = 'red'
			} else {
				target.style.color = 'blue'
			}
			console.log('Clicked:', target.textContent)
		}
	}
}
