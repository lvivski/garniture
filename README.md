# Garniture

A modern TypeScript library for creating Web Components using decorators.

## Features

- 🎯 **Type-safe decorators** for Web Components
- 🔧 **Attribute binding** with automatic type conversion
- 📡 **Reactive property observation**
- 🎪 **Event delegation** with declarative binding
- 🧩 **Slot management** for content projection
- 🎨 **CSS-in-JS** with constructable stylesheets
- 🏗️ **Template system** with trusted types support

## Installation

```bash
npm install garniture
```

## Quick Start

```typescript
import { element, attr, observe, html, css } from 'garniture'

@element({
  template: html`<h1>Hello <span id="name"></span>!</h1>`,
  style: css`
    :host {
      display: block;
      color: blue;
    }
  `
})
class GreetingElement extends HTMLElement {
  @attr
  accessor name = 'World'

  @observe(['name'])
  updateName() {
    const span = this.shadowRoot?.querySelector('#name')
    if (span) span.textContent = this.name
  }
}
```

## API Reference

### Decorators

#### `@element(config?)`
Defines a custom element.

#### `@attr(config?)`
Creates an attribute-property binding.

#### `@bool` / `@data`
Shorthand decorators for boolean and data attributes.

#### `@observe(properties?)`
Observes property changes and triggers updates.

#### `@bind(selector, event?)`
Binds event handlers or queries elements.

#### `@slot(config?)` / `@main`
Manages slotted content.

### Template Functions

#### `html\`...\``
Creates HTML templates with trusted types support.

#### `css\`...\``
Creates constructable stylesheets.

## Examples

See the `/example` directory for complete examples.

## License

MIT
