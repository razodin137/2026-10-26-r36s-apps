/* The shell application.
 *
 * Wires the pieces together: the emulated console, the input sources, the
 * cartridge menu, and the player that runs the game.
 */

import { loadCatalog } from "./catalog.js"
import { Controls } from "./controls.js"
import { Device } from "./device.js"
import { Menu } from "./menu.js"
import { Player } from "./player.js"
import { Shell } from "./shell.js"

class R36SApp {
  constructor() {
    this.device = new Device()
    this.shell = new Shell( document.querySelector( ".device" ), this.device )
    this.controls = new Controls( this.device )

    const surface = document.querySelector( "[data-screen-surface]" )

    this.surface = surface
    this.menu = new Menu( surface, {
      onLaunch: ( cartridge ) => this.launch( cartridge )
    } )

    this.player = new Player( surface )

    this.state = "menu"
    this.cartridge = null
    this.status = document.querySelector( "[data-status]" )
    this.nowPlaying = document.querySelector( "[data-now-playing]" )

    this.device.addEventListener( "change", ( event ) => {
      this.shell.render( event.detail )
      this.player.sendInput( event.detail )
    } )

    this.device.addEventListener( "press", ( event ) => {
      this.onPress( event.detail.name )
    } )

    this.device.addEventListener( "power", ( event ) => {
      this.shell.setPowered( event.detail.powered )
      this.controls.setEnabled( event.detail.powered )
      this.player.setVisible( event.detail.powered )
      this.setStatus( event.detail.powered ? "" : "The console is switched off." )
    } )

    this.player.addEventListener( "exit", () => this.showMenu() )

    this.player.addEventListener( "title", ( event ) => {
      this.setNowPlaying( event.detail.title, this.cartridge )
    } )

    this.player.addEventListener( "error", ( event ) => {
      this.setStatus( `Cartridge error: ${event.detail.message}` )
    } )

    this.player.addEventListener( "load", () => {
      this.setStatus( "" )
    } )

    window.addEventListener( "keydown", ( event ) => this.onKeyDown( event ) )
  }

  async start() {
    this.controls.start()
    this.player.start()

    try {
      const catalog = await loadCatalog()

      this.menu.setCartridges( catalog.cartridges )
      this.setStatus( "" )
    } catch ( error ) {
      this.setStatus( error.message )
    }
  }

  onPress( name ) {
    if ( !this.device.powered || this.state !== "menu" ) {
      return
    }

    if ( name === "up" ) {
      this.menu.move( -1 )
    }

    if ( name === "down" ) {
      this.menu.move( 1 )
    }

    if ( name === "a" || name === "start" ) {
      this.menu.launchSelected()
    }
  }

  onKeyDown( event ) {
    if ( event.code === "Escape" ) {
      event.preventDefault()
      this.showMenu()
    }

    if ( event.code === "KeyF" ) {
      this.toggleFlip()
    }

    if ( event.code === "KeyP" ) {
      this.device.setPowered( !this.device.powered )
    }
  }

  launch( cartridge ) {
    if ( !this.device.powered ) {
      this.device.setPowered( true )
    }

    this.cartridge = cartridge
    this.state = "running"

    this.surface.dataset.view = "game"
    this.player.load( cartridge )
    this.setNowPlaying( cartridge.title, cartridge )
  }

  showMenu() {
    if ( this.state === "menu" ) {
      return
    }

    this.state = "menu"
    this.player.unload()
    this.cartridge = null

    this.surface.dataset.view = "menu"
    this.setNowPlaying( null )
  }

  toggleFlip() {
    const flipped = this.shell.toggle()
    const button = document.querySelector( "[data-flip]" )

    if ( button ) {
      button.setAttribute( "aria-pressed", String( flipped ) )
    }
  }

  setStatus( message ) {
    if ( this.status ) {
      this.status.textContent = message
    }
  }

  setNowPlaying( title, cartridge ) {
    if ( !this.nowPlaying ) {
      return
    }

    if ( !title && !cartridge ) {
      this.nowPlaying.textContent = "Menu"
      this.nowPlaying.classList.remove( "is-running" )

      return
    }

    const name = title || cartridge.title
    const author = cartridge ? ` by ${cartridge.author}` : ""

    this.nowPlaying.textContent = `${name}${author}`
    this.nowPlaying.classList.add( "is-running" )
  }
}

const app = new R36SApp()

app.start()

document.querySelectorAll( "[data-flip]" ).forEach( ( button ) => {
  button.addEventListener( "click", () => app.toggleFlip() )
} )

document.querySelectorAll( "[data-power]" ).forEach( ( button ) => {
  button.addEventListener( "click", () => app.device.setPowered( !app.device.powered ) )
} )

document.querySelectorAll( "[data-menu]" ).forEach( ( button ) => {
  button.addEventListener( "click", () => app.showMenu() )
} )
