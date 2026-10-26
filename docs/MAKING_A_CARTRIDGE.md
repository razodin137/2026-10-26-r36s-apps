# Making a cartridge

This walks through a cartridge from an empty folder to a game in the menu.

## 1. Make the folder

Every cartridge is a folder under `cartridges/`. The name is the game's name
until you say otherwise.

```
cartridges/
  my-game/
```

## 2. Add the entry point

The shell loads `index.html` from the cartridge's folder. Give it a canvas
the size of the console's screen, and nothing else.

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <title>My Game</title>
    <link rel="stylesheet" href="style.css">
  </head>
  <body>
    <canvas id="screen" width="320" height="240"></canvas>

    <script src="../../shared/r36s-cartridge-sdk.js"></script>
    <script src="game.js"></script>
  </body>
</html>
```

The canvas is 320x240 because that is the console's screen. The shell scales
it to fit the case, so a canvas that is a different size will look wrong.

## 3. Fill the screen

```css
html, body {
  margin: 0;
  height: 100%;
  overflow: hidden;
  background: #000;
}

canvas {
  display: block;
  width: 100%;
  height: 100%;
}
```

The page is exactly 320x240 CSS pixels, so `width: 100%` and `height: 100%`
keep the canvas filling it.

## 4. Load the SDK

The SDK is one file, served from the root of the site.

```html
<script src="../../shared/r36s-cartridge-sdk.js"></script>
```

It puts a `R36S` object on the window. That object is the console: the
buttons, the sticks, the screen size, and a save file.

## 5. Read the buttons

Poll the input inside a frame callback.

```js
const canvas = document.getElementById( "screen" )
const context = canvas.getContext( "2d" )

let x = 160
let y = 120

R36S.frame( ( time ) => {
  if ( R36S.input.pressed( "a" ) ) {
    x = 160
    y = 120
  }

  if ( R36S.input.held( "left" ) ) {
    x -= 2
  }

  if ( R36S.input.held( "right" ) ) {
    x += 2
  }

  context.fillStyle = "#000"
  context.fillRect( 0, 0, 320, 240 )

  context.fillStyle = "#7ee787"
  context.fillRect( x - 4, y - 4, 8, 8 )
} )
```

`pressed` is true for one frame, right after the button goes down. `held` is
true for as long as it is down.

The sticks work the same way, and report a value between -1 and 1:

```js
const axis = R36S.input.axis( "left" )

if ( axis.y < -0.5 ) {
  player.jump()
}
```

## 6. Keep a save

```js
const save = R36S.load()

const highScore = save ? save.highScore : 0

R36S.save( { highScore: 1200 } )
```

Each cartridge has one save file, kept in the browser. It belongs to that
cartridge alone.

## 7. Name it

The title shows in the menu, and the description shows when the game is
selected.

```json
{
  "title": "My Game",
  "author": "Your Name",
  "version": "1.0.0",
  "description": "One line about the game."
}
```

Put that in `cartridges/my-game/cartridge.json`. Every field is optional.

## 8. Play it

Reload the page. The game is in the menu.

The dev server rebuilds the catalog on every request, so there is nothing to
restart. If you are serving the site some other way, run
`python3 tools/build_catalog.py` to rebuild `cartridges/catalog.json` by hand.

## Things worth knowing

**The game gets the whole screen.** A cartridge fills the console's screen
completely. There is no chrome, no menu bar, and no letterboxing.

**A cartridge is a web page.** It can use the DOM, CSS, images, audio, and
the network, exactly like any other page. It runs on the same origin as the
shell, so it can reach the shell's storage. Treat cartridges as trusted code.

**The frame callback is the clock.** Use it for everything that moves. A
game loop built on `setInterval` will drift against the screen and look
wrong next to a cartridge that uses `R36S.frame`.

**A cartridge can leave.** Call `R36S.exit()` to hand the console back to the
menu. The player can also press escape.

**Save files are per cartridge.** The key is the cartridge's folder name, so
two cartridges never see each other's saves.
