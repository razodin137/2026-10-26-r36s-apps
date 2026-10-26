# Cartridges

Each folder in this directory is a cartridge. The menu lists them in
alphabetical order by title.

```
my-game/
  cartridge.json      metadata, optional
  index.html          the entry point, required
  ...                 anything else the game needs
```

The shell looks for `index.html` unless `cartridge.json` names a different
entry point.

## cartridge.json

Every field is optional. The shell fills in the blanks.

```json
{
  "title": "My Game",
  "author": "Your Name",
  "version": "1.0.0",
  "description": "One line about the game, shown in the menu.",
  "entry": "index.html",
  "tags": [ "arcade" ]
}
```

| Field | Default | Notes |
| --- | --- | --- |
| `title` | The folder name, capitalised | Shown in the menu |
| `author` | `Unknown` | Shown in the menu |
| `version` | `0.0.0` | Shown in the menu |
| `description` | Empty | Shown under the list when the game is selected |
| `entry` | `index.html` | The page the shell loads |
| `slug` | The folder name | The name used for the save file |
| `tags` | `[]` | Free-form labels for your own tooling |

A folder whose metadata is missing, or whose entry point does not exist, is
left out of the menu.

## Adding a cartridge

Put the folder here and reload the page. The dev server rebuilds
`catalog.json` on every request, so the game is in the menu straight away.

`catalog.json` is generated, and it is kept in the repository so the shell
works on a plain static host too. Do not edit it by hand. Run
`python3 tools/build_catalog.py` to write it.

## Writing the game

A cartridge is a web page with one extra thing: the `R36S` object, which
gives you the buttons and the sticks.

```html
<script src="/shared/r36s-cartridge-sdk.js"></script>
```

The API is documented in [../docs/CARTRIDGE_API.md](../docs/CARTRIDGE_API.md).
A tutorial is in [../docs/MAKING_A_CARTRIDGE.md](../docs/MAKING_A_CARTRIDGE.md).
The `snake` cartridge in this folder is a complete example.
