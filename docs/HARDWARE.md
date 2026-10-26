# The console

The shell draws an Anbernic R36S, a landscape handheld. This is the console it
draws, control by control, and the names the cartridge API uses for them.

## The case

The front face is roughly 148 x 84 millimetres, so about 1.76 to one. The
shell draws it at that ratio and scales it to fit the page, so the layout
holds at any size. The case has rounded corners and a seam around the
perimeter.

```
  ┌──────────────────────────────────────────────────────────────┐
  │   L1                                    R1        ⏻          │
  │  ┌─────────┐                            ┌──────────┐         │
  │  │         │        ┌────────────┐      │    Y     │         │
  │  │         │        │            │      │          │         │
  │  │  D-PAD  │        │   SCREEN   │      │  X    A  │         │
  │  │         │        │  320x240   │      │          │         │
  │  │         │        │            │      │    B     │         │
  │  └─────────┘        └────────────┘      └──────────┘         │
  │    ╭─────╮                             ╭─────╮                │
  │    │  ●  │        SELECT   START       │  ●  │                │
  │    ╰─────╯                             ╰─────╯                │
  └──────────────────────────────────────────────────────────────┘
```

The screen sits in the upper middle. The D-pad is on the far left and the
face buttons are on the far right, both level with the screen. The two
analog sticks sit below them, and START and SELECT are in the bottom middle.

## The screen

A 3.5 inch IPS panel, 320x240, so 4:3. The cartridge's page is exactly that
size, and the shell scales it to fit the panel. The shell does not letterbox
and does not crop.

## The controls

| Name | On the console | Keyboard | Gamepad |
| --- | --- | --- | --- |
| `up` `down` `left` `right` | The D-pad | Arrow keys | D-pad |
| `x` | Left of the face buttons | `V` | Left |
| `y` | Above the face buttons | `C` | Top |
| `a` | Right of the face buttons | `X` | Right |
| `b` | Below the face buttons | `Z` | Bottom |
| `start` | Bottom middle, right | `Enter` | Start |
| `select` | Bottom middle, left | `Shift` | Select |
| `l1` | Top edge, left | `Q` | Left shoulder |
| `r1` | Top edge, right | `E` | Right shoulder |
| `l2` | Back of the case, left | `1` | Left trigger |
| `r2` | Back of the case, right | `3` | Right trigger |
| `left` stick | Bottom left | `W` `A` `S` `D` | Left stick |
| `right` stick | Bottom right | `I` `J` `K` `L` | Right stick |

The sticks report a value between -1 and 1 on each axis. At rest they are at
0. `y` grows downwards, the same way the real sticks do.

The face buttons are labelled the Nintendo way round: A on the right, B at
the bottom, X on the left, and Y at the top. A gamepad is labelled the other
way, so the shell swaps the two when it reads one.

## The back of the case

The L2 and R2 triggers are on the back, near the top. They are the index
triggers of a controller with the thumb sticks under your thumbs.

Press `F`, or use the "Turn over" button, to flip the device and use them.
The device turns in three dimensions, so the back face is a real rotation of
the case rather than a swapped image.

The back also carries the battery door and a label. Neither does anything.

## Power

The power button is on the top edge. Switching the console off blanks the
screen, puts out the power light, and stops the input. Switching it back on
puts the cartridge back where it was.

## What the shell does not model

There is no speaker, no rumble, no battery, and no clock. `R36S.tone` plays
a note through the browser's audio, which is close enough for a cartridge
that wants a beep.

There is also no second player, no link cable, and no video output.
