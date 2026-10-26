# The cartridge API

A cartridge is a web page. The shell loads it into the console's screen and
gives it the things a web page cannot have on its own: the buttons, the
sticks, and a save file.

Everything here is available on one global object, `R36S`. Load the SDK and
start using it:

```html
<script src="/shared/r36s-cartridge-sdk.js"></script>
<script src="game.js"></script>
```

## The screen

The console has a 320x240 screen. Your page is exactly that size, and the
shell scales it up to fit the case. Do not set your own width or height on
`<body>`; fill the window and let the shell handle the rest.

```js
R36S.screen.width   // 320
R36S.screen.height  // 240
```

## Input

`R36S.input` describes the console right now. Read it any time.

```js
R36S.input.held( "a" )     // true while A is down
R36S.input.pressed( "a" )  // true only on the frame A went down
R36S.input.released( "a" ) // true only on the frame A came up
R36S.input.axis( "left" )  // { x, y }, each between -1 and 1
R36S.input.buttons         // { up: false, down: false, ... }
R36S.input.sticks          // { left: { x, y }, right: { x, y } }
```

`pressed` and `released` are edge detectors. They are true for one frame and
then false again, so poll them inside your frame callback rather than in a
timer.

### Buttons

| Name | Where it is on the console |
| --- | --- |
| `up` `down` `left` `right` | D-pad |
| `a` `b` `x` `y` | The four face buttons |
| `start` `select` | The two buttons in the middle |
| `l1` `r1` | The shoulder buttons |
| `l2` `r2` | The triggers on the back of the case |

### Sticks

Each stick reports `x` and `y` between -1 and 1. The stick is at rest at
`{ x: 0, y: 0 }`, and `y` grows downwards, the same way it does on the real
console. A stick pushed fully in one direction reports 1 or -1.

### Events

If you would rather be told when something happens than ask for it every
frame:

```js
const stop = R36S.on( "press", ( name ) => {
  console.log( name, "went down" )
} )

R36S.on( "release", ( name ) => console.log( name, "came up" ) )
R36S.on( "ready", () => console.log( "the shell is ready" ) )
R36S.on( "visibility", ( visible ) => console.log( visible ) )
R36S.on( "error", ( error ) => console.log( error ) )

stop() // unsubscribes
```

Events fire on a frame boundary, so they always arrive in the same place
your game updates.

## The frame loop

`R36S.frame` registers a callback that runs once per frame. It is the only
clock you need.

```js
R36S.frame( ( time ) => {
  if ( R36S.input.pressed( "a" ) ) {
    player.jump()
  }

  draw()
} )
```

`time` is the same timestamp the browser's `requestAnimationFrame` gives you.
The callback returns a function that unsubscribes it.

If you prefer your own loop, call `R36S.input.pressed()` from it. The edge
flags are still correct, because the shell clears them on the same clock.

## Save data

Each cartridge gets one save file. It is stored in the browser, so it survives
a reload, and it belongs to that cartridge alone.

```js
const state = R36S.load() // null when there is no save yet

R36S.save( { level: 3, score: 1200 } )

R36S.clearSave()
```

The save file holds JSON, so it can only hold JSON. `R36S.save` returns
`false` when the browser refuses to store it, which happens when the player
has turned off site data or the disk is full. `R36S.load` returns `null` in
that case too, so a missing save and a broken save look the same.

## Leaving the game

Call `R36S.exit()` to hand the console back to the menu. The shell removes
the cartridge and shows the cartridge list again.

```js
R36S.exit()
```

The player can also press the escape key, which does the same thing.

## The title bar

A cartridge can set the name shown in the shell's status area:

```js
R36S.setTitle( "Chapter 2 — The Bridge" )
```

## Sound

The console has a speaker. `R36S.tone` plays a single note.

```js
R36S.tone( 440, 0.1 )                        // a short beep
R36S.tone( 220, 0.2, { type: "sawtooth" } )  // a different waveform
R36S.tone( 880, 0.05, { gain: 0.2 } )        // a louder beep
```

The first argument is the frequency in hertz, the second is the duration in
seconds, and the options are `type` (a wave shape: `square`, `sine`,
`sawtooth`, or `triangle`) and `gain` between 0 and 1. Anything longer or
richer than one note is better built with the Web Audio API directly, which
the cartridge can use like any other page.

## Without the SDK

The SDK is a convenience. It speaks a small message protocol to the shell,
and you can speak it yourself.

The cartridge sends messages to `window.parent`:

```js
window.parent.postMessage( { type: "r36s:exit" }, "*" )
```

| Message | Payload | Meaning |
| --- | --- | --- |
| `r36s:ready` | `{ version }` | The cartridge has loaded |
| `r36s:exit` | — | Hand the console back to the menu |
| `r36s:title` | `{ title }` | Change the name in the status area |
| `r36s:error` | `{ message }` | Report a problem to the shell |

The shell sends messages to the cartridge:

| Message | Payload | Meaning |
| --- | --- | --- |
| `r36s:init` | `{ namespace, screen, version }` | The cartridge is live |
| `r36s:input` | `{ buttons, sticks }` | The console state changed |
| `r36s:visibility` | `{ visible }` | The cartridge is shown or hidden |

The shell only accepts messages from the frame it is showing, and the
cartridge only accepts messages from its parent.

## Versions

`R36S.version` is the version of the API the cartridge is running against. It
is currently `"1.0"`. Check it when you use a feature that may change:

```js
if ( R36S.version.startsWith( "1." ) ) {
  // use the current API
}
```

The `namespace` is the cartridge's own name. The shell sends it in the
`r36s:init` message, and the SDK uses it to keep save files apart.

## Running a cartridge on its own

A cartridge is a web page, so you can open it in a browser while you work on
it. Without the shell there is no console, so the SDK reports an empty input
state and never fires a press event. Everything else, including save files,
keeps working. The save file is keyed by the folder name, so a cartridge
saves the same way in the browser as it does in the console.
