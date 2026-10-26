# R36S

An emulated R36S handheld, and a place to put the games that run on it.

The console is a web page. It draws a 320x240 screen, a case with the real
controls, and a menu of the cartridges you have installed. Each cartridge is
its own folder of HTML, CSS, and JavaScript. Drop a folder into
`cartridges/` and the game shows up in the menu.

## Running it

The shell is static. Any web server will serve it, but the bundled one
rebuilds the cartridge catalog on every request, so newly added cartridges
appear without a restart.

```bash
python3 tools/serve.py
```

Then open <http://127.0.0.1:8000/>.

To rebuild the catalog by hand:

```bash
python3 tools/build_catalog.py
```

## Writing a cartridge

A cartridge is a folder under `cartridges/` with an `index.html` in it. The
shortest useful cartridge looks like this:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <title>My Game</title>
    <style>
      html, body { margin: 0; height: 100%; background: #000; }
      canvas { display: block; width: 100%; height: 100%; }
    </style>
  </head>
  <body>
    <canvas id="screen" width="320" height="240"></canvas>

    <script src="/shared/r36s-cartridge-sdk.js"></script>
    <script src="game.js"></script>
  </body>
</html>
```

And `game.js`:

```js
R36S.frame( ( time ) => {
  if ( R36S.input.pressed( "a" ) ) {
    player.jump()
  }

  draw()
} )
```

The SDK gives a cartridge the buttons, the two analog sticks, the screen
size, and a save file. The full reference is in
[docs/CARTRIDGE_API.md](docs/CARTRIDGE_API.md), and
[docs/MAKING_A_CARTRIDGE.md](docs/MAKING_A_CARTRIDGE.md) walks through
building one from scratch.

`cartridges/snake` is a working cartridge you can read in one sitting. It is
the reference implementation of the API.

## The layout of a cartridge

```
cartridges/
  catalog.json          the list the menu reads, rebuilt by the server
  my-game/
    cartridge.json      title, author, version, description
    index.html          the entry point
    game.js             the game
    style.css           the game's styles
```

`cartridge.json` is optional. A folder with an `index.html` and no metadata
still appears in the menu, using the folder name as the title. See
[cartridges/README.md](cartridges/README.md) for every field.

## The console

The shell models the R36S: a landscape case, a screen in the middle, a
D-pad, the four face buttons, two analog sticks, the shoulder buttons, and
the two triggers on the back. Press `F` to turn the device over and use the
rear triggers.

| Input | Keyboard | Gamepad |
| --- | --- | --- |
| D-pad | Arrow keys | D-pad |
| A / B / X / Y | `X` / `Z` / `V` / `C` | Face buttons |
| Left stick | `W` `A` `S` `D` | Left stick |
| Right stick | `I` `J` `K` `L` | Right stick |
| Start / Select | `Enter` / `Shift` | Start / Select |
| L1 / R1 | `Q` / `E` | Shoulder buttons |
| L2 / R2 | `1` / `3` | Triggers |
| Back to the menu | `Escape` | — |
| Turn the device over | `F` | — |
| Power | `P` | — |

The buttons, sticks, and triggers also work when you press them on screen.

[docs/HARDWARE.md](docs/HARDWARE.md) describes the console the shell draws,
including where every control sits.

## How it fits together

| Path | What it is |
| --- | --- |
| `index.html` | The shell |
| `assets/css/` | The page, the console, and the menu |
| `assets/js/` | The console model, the input sources, the menu, the player |
| `shared/r36s-cartridge-sdk.js` | The SDK every cartridge uses |
| `cartridges/` | The games |
| `tools/` | The catalog builder and the dev server |
| `docs/` | The references |

The console state lives in one object, `Device`. The keyboard, the pointer,
and a gamepad all press the same buttons on it. The player copies that state
into the running cartridge once per change, so a cartridge never has to know
where the input came from.

## Style

The code follows the [Basecamp house style](https://github.com/basecamp/house-style):
double quotes, no semicolons, two-space indentation, and `const` over `var`.
The prose follows the same house rules, which mostly means short sentences
and no adjectives that do not earn their place.
