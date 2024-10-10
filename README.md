# probi-oh - The Simply Complex Yu-Gi-Oh! Probability Simulator

You have hit the client code... Well kind of. For the moment this is entirely client side but the distinction is made for when the code will change to server side. To view the server side, please visit [probi-oh](https://github.com/CodeFatherG/probi-oh-server).

## Overview

This project is an advanced Yu-Gi-Oh! probability calculator designed to provide more sophisticated simulation capabilities compared to traditional deck simulators. Our goal is to offer a more flexible and powerful tool for Yu-Gi-Oh! players and deck builders to analyze their strategies.

While there are many Yu-Gi-Oh! simulators available, our project aims to provide a more comprehensive approach:

1. **Flexible Tagging**: By allowing cards to be tagged, users can create more general conditions based on card types or attributes rather than specific cards.
2. **Free Card Integration**: The inclusion of free card draws in our simulations more accurately reflects real game scenarios.
3. **Advanced Condition Specification**: Users can create complex, nested conditions to model intricate deck strategies and win conditions.

We strive to offer these advanced features while maintaining a user-friendly interface, making it accessible to both casual players and competitive duelists.

## Input Format

The calculator uses YAML as its input format. You can read the [full specification here](docs/yaml-spec.md).

### Deck

```yaml
deck:
  Card Name:
    qty: <number>  # Required
    tags: [<tag1>, <tag2>]  # Optional
    free:  # Optional
      oncePerTurn: <boolean>  # Required if 'free' is specified
      count: <number>  # Optional
      cost:  # Optional
        type: <CostType>
        value: <number or string[]>
      # Other optional properties: condition, restriction, excavate
```

### Conditions

```yaml
conditions:
  - "Blue-Eyes White Dragon"  # At least one Blue-Eyes White Dragon
  - "2+ Dragon"  # At least two cards with the Dragon tag
  - "(2+ Monster AND 1 Spell) OR (3+ Spell IN Deck AND 1- Trap IN Hand)"
```

### Example

```yaml
deck:
  "Blue-Eyes White Dragon":
    qty: 3
    tags: [Dragon, Normal Monster]
  "Sage with Eyes of Blue":
    qty: 3
    tags: [Spellcaster, Tuner]
  "Pot of Desires":
    qty: 2
    tags: [Spell, Draw]
    free:
      oncePerTurn: true
      count: 2
      cost:
        type: BanishFromDeck
        value: 10

conditions:
  - "1+ 'Blue-Eyes White Dragon' AND 1+ Tuner"
  - "(1+ Draw AND 3+ Dragon IN Deck) OR 2+ Search"
```

This example demonstrates cards with multiple tags, a free card with cost, and various condition types.

# License

This project is licensed under the GNU General Public License v3.0 (GPL-3.0). You are free to use, modify, and distribute this software under the conditions of the license. For full terms, see the LICENSE file or visit the GNU GPL v3.0 page.
