/* Input.
 *
 * Three sources drive the same console: the keyboard, a mouse or finger on
 * the shell itself, and a real gamepad. Each one presses the same buttons, so
 * a cartridge never needs to know where the input came from.
 */

/* Keys are matched by `KeyboardEvent.code`, so the binding follows the
 * physical key position rather than the character it produces. */
export const KEY_BINDINGS = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
  KeyZ: "b",
  KeyX: "a",
  KeyC: "y",
  KeyV: "x",
  Enter: "start",
  ShiftRight: "select",
  ShiftLeft: "select",
  KeyQ: "l1",
  KeyE: "r1",
  Digit1: "l2",
  Digit3: "r2"
}

/* The sticks take a direction at a time, and hold as long as the key is down. */
export const KEY_STICK_BINDINGS = {
  left: { up: "KeyW", down: "KeyS", left: "KeyA", right: "KeyD" },
  right: { up: "KeyI", down: "KeyK", left: "KeyJ", right: "KeyL" }
}

/* The standard gamepad layout: 0 is the bottom button, 1 the right button,
 * 2 the left button, 3 the top one. The R36S labels them the other way
 * around, so this table maps a gamepad button onto an R36S button. */
export const GAMEPAD_BINDINGS = {
  0: "b",
  1: "a",
  2: "x",
  3: "y",
  4: "l1",
  5: "r1",
  6: "l2",
  7: "r2",
  8: "select",
  9: "start",
  12: "up",
  13: "down",
  14: "left",
  15: "right"
}

const STICK_DEAD_ZONE = 0.15

function closestMatch( target, selector ) {
  if ( !target || typeof target.closest !== "function" ) {
    return null
  }

  return target.closest( selector )
}

export class Controls {
  constructor( device, root = document ) {
    this.device = device
    this.root = root
    this.heldKeys = new Set()
    this.pointerButtons = new Map()
    this.stickKeys = { left: new Set(), right: new Set() }
    this.activePointers = new Map()
    this.gamepadButtons = new Set()
    this.enabled = true

    this.onKeyDown = this.onKeyDown.bind( this )
    this.onKeyUp = this.onKeyUp.bind( this )
    this.onPointerDown = this.onPointerDown.bind( this )
    this.onPointerMove = this.onPointerMove.bind( this )
    this.onPointerUp = this.onPointerUp.bind( this )
    this.pollGamepad = this.pollGamepad.bind( this )
    this.releaseEverything = this.releaseEverything.bind( this )
  }

  start() {
    window.addEventListener( "keydown", this.onKeyDown )
    window.addEventListener( "keyup", this.onKeyUp )
    window.addEventListener( "blur", this.releaseEverything )
    this.root.addEventListener( "pointerdown", this.onPointerDown )
    window.addEventListener( "pointermove", this.onPointerMove )
    window.addEventListener( "pointerup", this.onPointerUp )
    window.addEventListener( "pointercancel", this.onPointerUp )

    window.requestAnimationFrame( this.pollGamepad )
  }

  stop() {
    window.removeEventListener( "keydown", this.onKeyDown )
    window.removeEventListener( "keyup", this.onKeyUp )
    window.removeEventListener( "blur", this.releaseEverything )
    this.root.removeEventListener( "pointerdown", this.onPointerDown )
    window.removeEventListener( "pointermove", this.onPointerMove )
    window.removeEventListener( "pointerup", this.onPointerUp )
    window.removeEventListener( "pointercancel", this.onPointerUp )
    this.releaseEverything()
  }

  setEnabled( enabled ) {
    this.enabled = enabled

    if ( !enabled ) {
      this.releaseEverything()
    }
  }

  onKeyDown( event ) {
    if ( !this.enabled || event.repeat ) {
      return
    }

    const button = KEY_BINDINGS[ event.code ]

    if ( button ) {
      this.heldKeys.add( button )
      this.device.press( button )
      event.preventDefault()

      return
    }

    const side = this.stickSideFor( event.code )

    if ( side ) {
      this.stickKeys[ side ].add( event.code )
      this.updateStickFromKeys( side )
      event.preventDefault()
    }
  }

  onKeyUp( event ) {
    const button = KEY_BINDINGS[ event.code ]

    if ( button ) {
      this.heldKeys.delete( button )
      this.device.release( button )

      return
    }

    const side = this.stickSideFor( event.code )

    if ( side ) {
      this.stickKeys[ side ].delete( event.code )
      this.updateStickFromKeys( side )
    }
  }

  stickSideFor( code ) {
    return Object.keys( KEY_STICK_BINDINGS ).find( ( side ) => {
      return Object.values( KEY_STICK_BINDINGS[ side ] ).includes( code )
    } ) || null
  }

  updateStickFromKeys( side ) {
    const bindings = KEY_STICK_BINDINGS[ side ]
    const held = this.stickKeys[ side ]

    const x = ( held.has( bindings.right ) ? 1 : 0 ) - ( held.has( bindings.left ) ? 1 : 0 )
    const y = ( held.has( bindings.down ) ? 1 : 0 ) - ( held.has( bindings.up ) ? 1 : 0 )

    this.device.setStick( side, x, y )
  }

  onPointerDown( event ) {
    if ( !this.enabled ) {
      return
    }

    const target = closestMatch( event.target, "[data-button], [data-stick]" )

    if ( !target ) {
      return
    }

    event.preventDefault()
    target.setPointerCapture( event.pointerId )

    const button = target.dataset.button
    const stick = target.dataset.stick

    if ( button ) {
      this.pointerButtons.set( button, ( this.pointerButtons.get( button ) || 0 ) + 1 )
      this.device.press( button )
    }

    if ( stick ) {
      this.activePointers.set( event.pointerId, { target, stick } )
      this.updateStick( event.pointerId, event )
    }
  }

  onPointerMove( event ) {
    if ( !this.activePointers.has( event.pointerId ) ) {
      return
    }

    event.preventDefault()
    this.updateStick( event.pointerId, event )
  }

  onPointerUp( event ) {
    const target = closestMatch( event.target, "[data-button]" )

    if ( target ) {
      const button = target.dataset.button
      const count = this.pointerButtons.get( button ) || 0

      if ( count > 0 ) {
        this.pointerButtons.set( button, count - 1 )
        this.device.release( button )
      }
    }

    const active = this.activePointers.get( event.pointerId )

    if ( active ) {
      this.activePointers.delete( event.pointerId )
      this.device.centerStick( active.stick )
    }
  }

  updateStick( pointerId, event ) {
    const active = this.activePointers.get( pointerId )

    if ( !active ) {
      return
    }

    const bounds = active.target.getBoundingClientRect()
    const centerX = bounds.left + bounds.width / 2
    const centerY = bounds.top + bounds.height / 2
    const radius = bounds.width / 2
    const offsetX = event.clientX - centerX
    const offsetY = event.clientY - centerY
    const length = Math.sqrt( offsetX * offsetX + offsetY * offsetY )
    const scale = length > radius ? radius / length : 1

    this.device.setStick(
      active.stick,
      ( offsetX * scale ) / radius,
      ( offsetY * scale ) / radius
    )
  }

  pollGamepad() {
    if ( this.enabled ) {
      this.readGamepad()
    }

    window.requestAnimationFrame( this.pollGamepad )
  }

  readGamepad() {
    const pads = navigator.getGamepads ? navigator.getGamepads() : []
    const pad = Array.from( pads ).find( ( candidate ) => candidate )

    if ( !pad ) {
      this.gamepadButtons.forEach( ( name ) => this.device.release( name ) )
      this.gamepadButtons.clear()

      return
    }

    const pressed = new Set()

    pad.buttons.forEach( ( button, index ) => {
      if ( !button.pressed ) {
        return
      }

      const name = GAMEPAD_BINDINGS[ index ]

      if ( name ) {
        pressed.add( name )
      }
    } )

    pressed.forEach( ( name ) => {
      if ( !this.gamepadButtons.has( name ) ) {
        this.device.press( name )
      }
    } )

    this.gamepadButtons.forEach( ( name ) => {
      if ( !pressed.has( name ) ) {
        this.device.release( name )
      }
    } )

    this.gamepadButtons = pressed

    if ( pad.axes.length >= 2 ) {
      this.device.setStick( "left", ...this.applyDeadZone( pad.axes[ 0 ], pad.axes[ 1 ] ) )
    }

    if ( pad.axes.length >= 4 ) {
      this.device.setStick( "right", ...this.applyDeadZone( pad.axes[ 2 ], pad.axes[ 3 ] ) )
    }
  }

  applyDeadZone( x, y ) {
    const length = Math.sqrt( x * x + y * y )

    if ( length < STICK_DEAD_ZONE ) {
      return [ 0, 0 ]
    }

    const scaled = ( length - STICK_DEAD_ZONE ) / ( 1 - STICK_DEAD_ZONE )
    const ratio = Math.min( 1, scaled ) / length

    return [ x * ratio, y * ratio ]
  }

  releaseEverything() {
    this.heldKeys.forEach( ( name ) => this.device.release( name ) )
    this.heldKeys.clear()

    this.pointerButtons.forEach( ( count, name ) => {
      if ( count > 0 ) {
        this.device.release( name )
      }
    } )
    this.pointerButtons.clear()

    this.stickKeys.left.clear()
    this.stickKeys.right.clear()
    this.activePointers.clear()
    this.gamepadButtons.clear()
  }
}
