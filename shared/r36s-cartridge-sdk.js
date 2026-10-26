/* The R36S cartridge SDK.
 *
 * A cartridge is a web page. This script gives that page the parts of a
 * console it cannot have on its own: the buttons, the sticks, the screen size,
 * and somewhere to keep a save file.
 *
 * Load it from a cartridge like this:
 *
 *   <script src="../../shared/r36s-cartridge-sdk.js"></script>
 *   <script src="game.js"></script>
 *
 * Then drive the console from game.js:
 *
 *   R36S.frame(( time ) => {
 *     if (R36S.input.pressed("a")) player.jump()
 *     if (R36S.input.axis("left").y < -0.5) player.run()
 *     draw()
 *   })
 *
 * The full reference lives in docs/CARTRIDGE_API.md.
 */
( function () {
  "use strict"

  const PROTOCOL_VERSION = "1.0"
  const SCREEN = { width: 320, height: 240 }
  const STORAGE_PREFIX = "r36s:save:"

  const host = window.parent
  let namespace = deriveNamespace()
  let ready = false
  const queue = []

  let held = new Set()
  let pendingPressed = new Set()
  let pendingReleased = new Set()
  let framePressed = new Set()
  let frameReleased = new Set()

  const sticks = {
    left: { x: 0, y: 0 },
    right: { x: 0, y: 0 }
  }

  const listeners = new Map()
  let frameCallbacks = []
  let audioContext = null
  let title = null
  let inputSnapshot = null

  function buildInput() {
    const buttons = {}

    held.forEach( function ( name ) {
      buttons[ name ] = true
    } )

    return {
      buttons: buttons,
      sticks: {
        left: { x: sticks.left.x, y: sticks.left.y },
        right: { x: sticks.right.x, y: sticks.right.y }
      },
      held: function ( name ) {
        return held.has( name )
      },
      pressed: function ( name ) {
        return framePressed.has( name )
      },
      released: function ( name ) {
        return frameReleased.has( name )
      },
      axis: function ( side ) {
        const value = sticks[ side ] || { x: 0, y: 0 }

        return { x: value.x, y: value.y }
      }
    }
  }

  function deriveNamespace() {
    const match = window.location.pathname.match( /\/cartridges\/([^/]+)\// )

    return match ? match[ 1 ] : "unfiled"
  }

  function send( type, payload ) {
    const message = { type: type, payload: payload || null }

    if ( ready ) {
      host.postMessage( message, "*" )
    } else {
      queue.push( message )
    }
  }

  function on( event, handler ) {
    if ( typeof handler !== "function" ) {
      throw new TypeError( "R36S.on expects a function" )
    }

    if ( !listeners.has( event ) ) {
      listeners.set( event, [] )
    }

    listeners.get( event ).push( handler )

    return function () {
      off( event, handler )
    }
  }

  function off( event, handler ) {
    const handlers = listeners.get( event )

    if ( !handlers ) {
      return
    }

    listeners.set( event, handlers.filter( function ( candidate ) {
      return candidate !== handler
    }) )
  }

  function emit( event, args ) {
    const handlers = listeners.get( event ) || []

    handlers.slice().forEach( function ( handler ) {
      handler.apply( null, args )
    } )
  }

  function applySnapshot( snapshot ) {
    const buttons = snapshot.buttons || {}
    const next = new Set()

    Object.keys( buttons ).forEach( function ( name ) {
      if ( buttons[ name ] ) {
        next.add( name )
      }
    } )

    next.forEach( function ( name ) {
      if ( !held.has( name ) ) {
        pendingPressed.add( name )
      }
    } )

    held.forEach( function ( name ) {
      if ( !next.has( name ) ) {
        pendingReleased.add( name )
      }
    } )

    held = next
    inputSnapshot = null

    const incomingSticks = snapshot.sticks || {}

    Object.keys( sticks ).forEach( function ( side ) {
      const incoming = incomingSticks[ side ] || { x: 0, y: 0 }

      sticks[ side ].x = incoming.x || 0
      sticks[ side ].y = incoming.y || 0
    } )
  }

  function tick( time ) {
    framePressed = pendingPressed
    frameReleased = pendingReleased
    pendingPressed = new Set()
    pendingReleased = new Set()

    frameReleased.forEach( function ( name ) {
      emit( "release", [ name ] )
    } )

    framePressed.forEach( function ( name ) {
      emit( "press", [ name ] )
    } )

    frameCallbacks.slice().forEach( function ( callback ) {
      callback( time )
    } )

    emit( "frame", [ time ] )

    window.requestAnimationFrame( tick )
  }

  function saveKey() {
    return STORAGE_PREFIX + namespace
  }

  function save( data ) {
    try {
      window.localStorage.setItem( saveKey(), JSON.stringify( data ) )
    } catch ( error ) {
      emit( "error", [ error ] )

      return false
    }

    return true
  }

  function load() {
    try {
      const raw = window.localStorage.getItem( saveKey() )
    } catch ( error ) {
      emit( "error", [ error ] )

      return null
    }

    if ( raw === null ) {
      return null
    }

    try {
      return JSON.parse( raw )
    } catch ( error ) {
      emit( "error", [ error ] )

      return null
    }
  }

  function clearSave() {
    try {
      window.localStorage.removeItem( saveKey() )
    } catch ( error ) {
      emit( "error", [ error ] )
    }
  }

  function exit() {
    send( "r36s:exit" )
  }

  function setTitle( next ) {
    title = next
    send( "r36s:title", { title: next } )
  }

  function tone( frequency, duration, options ) {
    const settings = options || {}
    const type = settings.type || "square"
    const gain = settings.gain === undefined ? 0.08 : settings.gain
    const seconds = duration || 0.1

    const AudioContext = window.AudioContext || window.webkitAudioContext

    if ( !AudioContext ) {
      return
    }

    if ( !audioContext ) {
      audioContext = new AudioContext()
    }

    const oscillator = audioContext.createOscillator()
    const amplifier = audioContext.createGain()
    const now = audioContext.currentTime

    oscillator.type = type
    oscillator.frequency.setValueAtTime( frequency, now )

    amplifier.gain.setValueAtTime( gain, now )
    amplifier.gain.exponentialRampToValueAtTime( 0.0001, now + seconds )

    oscillator.connect( amplifier )
    amplifier.connect( audioContext.destination )

    oscillator.start( now )
    oscillator.stop( now + seconds )
  }

  const api = {
    version: PROTOCOL_VERSION,

    screen: {
      width: SCREEN.width,
      height: SCREEN.height
    },

    get namespace() {
      return namespace
    },

    get title() {
      return title
    },

    get input() {
      if ( !inputSnapshot ) {
        inputSnapshot = buildInput()
      }

      return inputSnapshot
    },

    on: on,
    off: off,

    frame: function ( callback ) {
      if ( typeof callback !== "function" ) {
        throw new TypeError( "R36S.frame expects a function" )
      }

      frameCallbacks.push( callback )

      return function () {
        frameCallbacks = frameCallbacks.filter( function ( candidate ) {
          return candidate !== callback
        } )
      }
    },

    save: save,
    load: load,
    clearSave: clearSave,
    exit: exit,
    setTitle: setTitle,
    tone: tone
  }

  window.R36S = api

  window.addEventListener( "message", function ( event ) {
    if ( event.source !== host ) {
      return
    }

    const message = event.data || {}
    const payload = message.payload || {}

    if ( message.type === "r36s:init" ) {
      if ( payload.namespace ) {
        namespace = payload.namespace
      }

      if ( payload.screen ) {
        api.screen.width = payload.screen.width
        api.screen.height = payload.screen.height
      }

      ready = true
      queue.splice( 0 ).forEach( function ( queued ) {
        host.postMessage( queued, "*" )
      } )

      emit( "ready", [ api ] )
      send( "r36s:ready", { version: PROTOCOL_VERSION } )
    }

    if ( message.type === "r36s:input" ) {
      applySnapshot( payload )
    }

    if ( message.type === "r36s:visibility" ) {
      emit( "visibility", [ payload.visible !== false ] )
    }
  } )

  window.addEventListener( "error", function ( event ) {
    send( "r36s:error", { message: event.message || "Unknown error" } )
  } )

  window.addEventListener( "unhandledrejection", function ( event ) {
    send( "r36s:error", { message: String( event.reason ) } )
  } )

  window.requestAnimationFrame( tick )
})()
