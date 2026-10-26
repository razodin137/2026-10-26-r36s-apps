/* The emulated R36S.
 *
 * One object holds the physical state of the console: which buttons are held
 * down, and where the two analog sticks are pointing. Everything else in the
 * shell reads from here, and the running cartridge receives a snapshot of it.
 */

export const BUTTON_NAMES = [
  "up", "down", "left", "right",
  "a", "b", "x", "y",
  "start", "select",
  "l1", "r1", "l2", "r2"
]

export const STICK_NAMES = [ "left", "right" ]

export const SCREEN = { width: 320, height: 240 }

function clamp( value, low, high ) {
  return Math.min( high, Math.max( low, value ) )
}

function clampStick( vector ) {
  const length = Math.sqrt( vector.x * vector.x + vector.y * vector.y )

  if ( length <= 1 ) {
    return vector
  }

  return { x: vector.x / length, y: vector.y / length }
}

export class Device extends EventTarget {
  constructor() {
    super()

    this.buttons = new Set()
    this.sticks = {
      left: { x: 0, y: 0 },
      right: { x: 0, y: 0 }
    }
    this.powered = true
  }

  press( name ) {
    if ( !BUTTON_NAMES.includes( name ) ) {
      throw new Error( `Unknown button: ${name}` )
    }

    if ( this.buttons.has( name ) ) {
      return
    }

    this.buttons.add( name )
    this.emit( "press", { name } )
    this.emitChange()
  }

  release( name ) {
    if ( !this.buttons.has( name ) ) {
      return
    }

    this.buttons.delete( name )
    this.emit( "release", { name } )
    this.emitChange()
  }

  releaseAll() {
    const pressed = Array.from( this.buttons )

    pressed.forEach( ( name ) => this.release( name ) )
  }

  setStick( side, x, y ) {
    if ( !STICK_NAMES.includes( side ) ) {
      throw new Error( `Unknown stick: ${side}` )
    }

    const vector = clampStick( { x: clamp( x, -1, 1 ), y: clamp( y, -1, 1 ) } )
    const current = this.sticks[ side ]

    if ( current.x === vector.x && current.y === vector.y ) {
      return
    }

    current.x = vector.x
    current.y = vector.y

    this.emit( "stick", { side, x: vector.x, y: vector.y } )
    this.emitChange()
  }

  centerStick( side ) {
    this.setStick( side, 0, 0 )
  }

  setPowered( powered ) {
    if ( this.powered === powered ) {
      return
    }

    this.powered = powered

    if ( !powered ) {
      this.releaseAll()
      this.centerStick( "left" )
      this.centerStick( "right" )
    }

    this.emit( "power", { powered } )
    this.emitChange()
  }

  snapshot() {
    const buttons = {}

    BUTTON_NAMES.forEach( ( name ) => {
      buttons[ name ] = this.buttons.has( name )
    } )

    return {
      buttons: buttons,
      sticks: {
        left: { x: this.sticks.left.x, y: this.sticks.left.y },
        right: { x: this.sticks.right.x, y: this.sticks.right.y }
      }
    }
  }

  emit( type, detail ) {
    this.dispatchEvent( new CustomEvent( type, { detail } ) )
  }

  emitChange() {
    this.emit( "change", this.snapshot() )
  }
}
