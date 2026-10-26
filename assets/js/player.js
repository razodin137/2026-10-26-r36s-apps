/* The player.
 *
 * A cartridge is a web page. The player loads it into an iframe the size of
 * the console's screen and talks to it with a small message protocol. The
 * cartridge never reaches into the shell, and the shell never reaches into
 * the cartridge.
 */

import { SCREEN } from "./device.js"

export class Player extends EventTarget {
  constructor( surface ) {
    super()

    this.surface = surface
    this.frame = null
    this.cartridge = null
    this.ready = false

    this.onMessage = this.onMessage.bind( this )
  }

  start() {
    window.addEventListener( "message", this.onMessage )
  }

  stop() {
    window.removeEventListener( "message", this.onMessage )
    this.unload()
  }

  get running() {
    return Boolean( this.frame )
  }

  load( cartridge ) {
    this.unload()

    this.cartridge = cartridge
    this.ready = false

    const frame = document.createElement( "iframe" )
    frame.className = "screen__frame"
    frame.title = cartridge.title
    frame.setAttribute( "allow", "autoplay; gamepad; fullscreen" )
    frame.addEventListener( "load", () => this.initialize( frame ) )

    this.frame = frame
    this.surface.appendChild( frame )

    frame.src = cartridge.url

    this.emit( "load", { cartridge } )
  }

  unload() {
    if ( !this.frame ) {
      return
    }

    this.frame.remove()
    this.frame = null
    this.cartridge = null
    this.ready = false

    this.emit( "unload", {} )
  }

  initialize( frame ) {
    if ( frame !== this.frame ) {
      return
    }

    this.post( "r36s:init", {
      namespace: this.cartridge.slug,
      screen: { width: SCREEN.width, height: SCREEN.height },
      version: "1.0"
    } )
  }

  post( type, payload ) {
    if ( !this.frame ) {
      return
    }

    this.frame.contentWindow.postMessage( { type, payload }, "*" )
  }

  sendInput( snapshot ) {
    this.post( "r36s:input", snapshot )
  }

  setVisible( visible ) {
    this.post( "r36s:visibility", { visible } )
  }

  onMessage( event ) {
    if ( !this.frame || event.source !== this.frame.contentWindow ) {
      return
    }

    const message = event.data || {}
    const payload = message.payload || {}

    if ( message.type === "r36s:ready" ) {
      this.ready = true
      this.emit( "ready", { cartridge: this.cartridge, payload } )
    }

    if ( message.type === "r36s:exit" ) {
      this.emit( "exit", { cartridge: this.cartridge } )
    }

    if ( message.type === "r36s:title" ) {
      this.emit( "title", { title: payload.title } )
    }

    if ( message.type === "r36s:error" ) {
      this.emit( "error", { message: payload.message || "Unknown cartridge error" } )
    }
  }

  emit( type, detail ) {
    this.dispatchEvent( new CustomEvent( type, { detail } ) )
  }
}
