/* The cartridge menu.
 *
 * The menu is the console's firmware, so it draws on the same 320x240 screen
 * a cartridge uses. It is deliberately small: a list, the selected game's
 * details, and nothing else.
 */

const ROW_HEIGHT = 26

export class Menu {
  constructor( surface, options = {} ) {
    this.surface = surface
    this.onLaunch = options.onLaunch || ( () => {} )
    this.cartridges = []
    this.selected = 0

    this.element = document.createElement( "div" )
    this.element.className = "menu"

    this.element.innerHTML = `
      <header class="menu__header">
        <span class="menu__brand">R36S</span>
        <span class="menu__count" data-role="count">No cartridges</span>
      </header>
      <ul class="menu__list" data-role="list" role="listbox" aria-label="Cartridges"></ul>
      <footer class="menu__footer">
        <p class="menu__description" data-role="description"></p>
        <p class="menu__hint">A or START to play</p>
      </footer>
    `

    this.list = this.element.querySelector( '[data-role="list"]' )
    this.count = this.element.querySelector( '[data-role="count"]' )
    this.description = this.element.querySelector( '[data-role="description"]' )

    this.list.addEventListener( "click", ( event ) => {
      const item = event.target.closest( "[data-index]" )

      if ( !item ) {
        return
      }

      this.selected = Number( item.dataset.index )
      this.launchSelected()
    } )

    this.surface.appendChild( this.element )
  }

  get current() {
    return this.cartridges[ this.selected ] || null
  }

  setCartridges( cartridges ) {
    this.cartridges = cartridges
    this.selected = 0

    this.render()
  }

  render() {
    this.count.textContent = this.cartridges.length === 1
      ? "1 cartridge"
      : `${this.cartridges.length} cartridges`

    this.list.replaceChildren()

    if ( this.cartridges.length === 0 ) {
      const empty = document.createElement( "li" )
      empty.className = "menu__empty"
      empty.textContent = "No cartridges. Add a folder to cartridges/ and reload."

      this.list.appendChild( empty )
      this.description.textContent = ""
      this.element.classList.add( "menu--empty" )

      return
    }

    this.element.classList.remove( "menu--empty" )

    this.cartridges.forEach( ( cartridge, index ) => {
      const item = document.createElement( "li" )
      item.className = "menu__item"
      item.dataset.index = String( index )
      item.id = `menu-option-${index}`
      item.setAttribute( "role", "option" )
      item.setAttribute( "aria-selected", "false" )

      const title = document.createElement( "span" )
      title.className = "menu__title"
      title.textContent = cartridge.title

      const meta = document.createElement( "span" )
      meta.className = "menu__meta"
      meta.textContent = `${cartridge.author} · v${cartridge.version}`

      item.append( title, meta )
      this.list.appendChild( item )
    } )

    this.highlight()
  }

  highlight() {
    const items = this.list.querySelectorAll( ".menu__item" )

    items.forEach( ( item, index ) => {
      const selected = index === this.selected

      item.classList.toggle( "menu__item--selected", selected )
      item.setAttribute( "aria-selected", String( selected ) )
    } )

    const active = items[ this.selected ]

    if ( active ) {
      this.list.setAttribute( "aria-activedescendant", active.id )
    }

    this.scrollToSelected()
    this.describeCurrent()
  }

  describeCurrent() {
    const cartridge = this.current

    if ( !cartridge ) {
      this.description.textContent = ""
      return
    }

    this.description.textContent = cartridge.description || "No description."
  }

  scrollToSelected() {
    const item = this.list.querySelector( ".menu__item--selected" )

    if ( !item ) {
      return
    }

    const top = this.selected * ROW_HEIGHT
    const bottom = top + ROW_HEIGHT
    const viewTop = this.list.scrollTop
    const viewBottom = viewTop + this.list.clientHeight

    if ( top < viewTop ) {
      this.list.scrollTop = top
    } else if ( bottom > viewBottom ) {
      this.list.scrollTop = bottom - this.list.clientHeight
    }
  }

  move( delta ) {
    if ( this.cartridges.length === 0 ) {
      return
    }

    const next = ( this.selected + delta + this.cartridges.length ) % this.cartridges.length

    this.selected = next
    this.highlight()
  }

  launchSelected() {
    const cartridge = this.current

    if ( !cartridge ) {
      return
    }

    this.onLaunch( cartridge )
  }
}
