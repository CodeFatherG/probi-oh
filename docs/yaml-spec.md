# yaml Input Specification

## Deck

Deck specification is a list of cards in your deck. Card duplicates can be specified with the qty property instead of duplicating the entry. The `Card Name:` specifies the exact name of the card, all properties following are considered details of the card.

```yaml
deck:
  Card Name:
    qty: <number>  # Required
    tags:  # Optional, default: null
      - <tag1>
      - <tag2>
    free:  # Optional, default: null
      count: <number>  # Optional, default: 0
      oncePerTurn: <boolean>  # Required if 'free' is specified
      cost:  # Optional, default: null
        type: <CostType>
        value: <number or string[]>
      condition:  # Optional, default: null
        type: <ConditionType>
        value: <number or string>
      restriction: [<RestrictionType>]  # Optional, default: []
      excavate:  # Optional, default: null
        count: <number>
        pick: <number>
```

### Property Details:

1. `qty: <number>`
   - **Usage**: Specifies the number of copies of this card in the deck.
   - **Required**: Yes
   - **Example**: `qty: 3`

2. `tags: [<tag1>, <tag2>, ...]`
   - **Usage**: Assigns categories or attributes to the card for condition checking.
   - **Optional**: Yes (default: null)
   - **Example**: `tags: [Monster, Dragon, Normal]`

3. `free:`
   - **Usage**: Specifies if the card has any "free" effects (e.g., can be used without counting towards normal summon/activation limits).
   - **Optional**: Yes (default: null)
   - **Sub-properties**:

     a. `count: <number>`
     - **Usage**: The number of times this free effect can be used.
     - **Optional**: Yes (default: 0)
     - **Example**: `count: 1`

     b. `oncePerTurn: <boolean>`
     - **Usage**: Specifies if the free effect can only be used once per turn.
     - **Required** if 'free' is specified
     - **Example**: `oncePerTurn: true`

     c. `cost:`
     - **Usage**: Specifies any cost associated with using the free effect.
     - **Optional**: Yes (default: null)
     - **Sub-properties**:
       - `type: <CostType>`
         - **Possible values** (CostType enum):
           - `BanishFromDeck`
           - `BanishFromHand`
           - `PayLife`
           - `Discard`
       - `value: <number or string[]>`
         - **Usage**: The amount or specific cards for the cost.
     - **Example**:
       ```yaml
       cost:
         type: Discard
         value: 1
       ```

     d. `condition:`
     - **Usage**: Specifies any condition that must be met to use the free effect.
     - **Optional**: Yes (default: null)
     - **Sub-properties**:
       - `type: <ConditionType>`
         - **Possible values** (ConditionType enum):
           - `Discard`
           - `BanishFromHand`
           - `BanishFromDeck`
       - `value: <number or string>`
         - **Usage**: The amount or specific requirement for the condition.
     - **Example**:
       ```yaml
       condition:
         type: BanishFromHand
         value: 1
       ```

     e. `restriction: [<RestrictionType>]`
     - **Usage**: Specifies any restrictions imposed when using the free effect.
     - **Optional**: Yes (default: [])
     - **Possible values** (RestrictionType enum):
       - `NoSpecialSummon`
       - `NoMoreDraws`
       - `NoPreviousDraws`
     - **Example**: `restriction: [NoSpecialSummon, NoMoreDraws]`

     f. `excavate:`
     - **Usage**: Specifies if the free effect involves excavating cards from the deck.
     - **Optional**: Yes (default: null)
     - **Sub-properties**:
       - `count: <number>`: Number of cards to excavate
       - `pick: <number>`: Number of excavated cards to select
     - **Example**:
       ```yaml
       excavate:
         count: 3
         pick: 1
       ```

### Example of a Complete Card Specification:

```yaml
deck:
  "Blue-Eyes White Dragon":
    qty: 3
    tags: [Monster, Dragon, Normal]
  
  "Pot of Desires":
    qty: 2
    tags: [Spell, Draw]
    free:
      count: 1
      oncePerTurn: true
      cost:
        type: BanishFromDeck
        value: 10
      condition:
        type: BanishFromHand
        value: 1
      restriction: [NoMoreDraws]
      excavate:
        count: 2
        pick: 1
```

This example shows a deck with two cards: "Blue-Eyes White Dragon" as a normal monster, and "Pot of Desires" as a spell card with a complex free effect.

## Conditions

```yaml
conditions:  # Required, must contain at least one condition
  - <condition1>
  - <condition2>
```

Conditions define the criteria for evaluating a successful hand or game state. They can be simple or complex. It's not necessary for a single condition to specify all branches; multiple conditions can be used to make specification easier.

### Tokens and Syntax

Conditions are tokenized into the following types:

1. **Quantity**:
   - Format: `<number>[+|-]`
   - Examples: `2+`, `3-`, `1`
   - Usage: Specifies a card/tag quantity requirement.
   - Restrictions:
     - Must be followed by a card name or tag.
     - `+` means "greater than or equal to".
     - `-` means "less than or equal to".
     - No symbol means "exactly".

2. **Name**:
   - Format: Any string of letters, numbers, spaces, and certain special characters (-, ', &, :, !, ?, ")
   - Examples: `"Blue-Eyes White Dragon"`, `"Pot of Greed"`, `"Level Up!"`
   - Usage: Represents a card name or tag.
   - Restrictions:
     - Can be used alone or following a quantity.
     - Must not contain illegal characters (e.g., @, #, $, %, ^, *, (, ), [, ], {, }, <, >, /, \, |).

3. **Location**:
   - Format: `IN (Hand|Deck)`
   - Examples: `IN Hand`, `IN Deck`
   - Usage: Specifies the location to check for the card/tag.
   - Restrictions:
     - Must follow a card name or tag.
     - Case insensitive.

4. **Logical Operators**:
   - Valid operators: `AND`, `OR`
   - Usage: Combines multiple conditions.
   - Restrictions:
     - Must be surrounded by valid conditions or parentheses.

5. **Parentheses**:
   - Valid symbols: `(`, `)`
   - Usage: Groups conditions to control precedence.
   - Restrictions:
     - Must be balanced (equal number of opening and closing parentheses).

### Syntax Rules

1. A condition must start with either a quantity, a name, or an opening parenthesis.
2. A quantity must always be followed by a name.
3. A name can optionally be preceded by a quantity and/or followed by a location.
4. Logical operators must have valid conditions on both sides.
5. Parentheses can enclose any valid condition or combination of conditions.
6. Location and Logical Operator trigger words (`IN`, `AND`, `OR`) are case sensitive
7. Card names or tags beginning with numbers must specify a quantity to differentiate a name from a quantity token

### Examples

Simple conditions:
```yaml
conditions:
  - "Blue-Eyes White Dragon"  # At least one Blue-Eyes White Dragon
  - "2+ Dragon"  # At least two cards with the Dragon tag
  - "3 Spell IN Deck"  # Exactly three cards with the Spell tag in the deck
```

Complex conditions:
```yaml
conditions:
  - "(2+ Monster AND 1 Spell) OR (3+ Spell IN Deck AND 1- Trap IN Hand)"
  - "('Blue-Eyes White Dragon' OR 'Dark Magician') AND 2+ Spell"
```

### Default Behavior

- If no quantity is specified, `1+` (at least one) is assumed.
- If no location is specified, `IN Hand` is assumed.

### Error Handling

The parser will throw errors for invalid syntax, including:
- Unbalanced parentheses
- Invalid characters in card names
- Incorrect token order (e.g., location before name)
- Missing required tokens (e.g., name after quantity)

By following these rules and syntax, you can create a wide variety of conditions to evaluate your Yu-Gi-Oh! deck probabilities.

## Notes on Defaults and Requirements

- The `deck` section is required and must contain at least one card.
- The `deck` section need not specify 40 cards. Where at least 40 cards are not specified up to a total count of 40 cards will be filled with empty cards (to complete probability estimates)
- The `conditions` section is required and must contain at least one condition.
- For free cards:
  - The `oncePerTurn` field is required if the `free` section is specified.
  - All other fields within `free` are optional and will use their respective defaults if not specified.
