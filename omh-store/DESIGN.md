# OMH: design plan (frontend-design)

## Subject
- **What:** OMH, a shoe boutique in Morocco that sells every kind of footwear, from babouches to football boots, for the whole family.
- **Audience:** Moroccan shoppers, mostly on phones, reading French, Arabic or English.
- **Primary job of the page:** find shoes in my size quickly, then send the order on WhatsApp.

The vocabulary of the subject is where the design comes from. That means the **Brannock device** (the steel plate used in shops to measure feet), **EU sizes** (Paris points, 2/3 cm each), the **shoebox** and its end label, and the colours of the **Fès tanneries**: indigo, saffron, leather.

## Tokens
| Name | Hex | Role |
|---|---|---|
| plaster | `#EDEFF1` | page ground, cool like a shop wall |
| indigo | `#1C2867` | text, size ruler, primary buttons (Fès dye) |
| saffron | `#F2B01E` | the selected size, and only that (the one loud colour) |
| leather | `#8A4A2B` | prices and secondary links |
| white | `#FFFFFF` | sheets, drawers, table |
| (functional) WhatsApp green `#1E7F4F` | | the order button only |

**Type**
- **Big Shoulders Display** (800–900, condensed) for headlines and every size number. Its condensed letters look like the stamped digits on a shoebox and a Brannock scale.
- **Reem Kufi** for Arabic headlines, a geometric Kufi that matches the condensed Latin face.
- **Readex Pro** (300–500) for body text in Latin and Arabic.
- **Scale** (classical, *Elements of Typographic Style*): 14 / 16 / 21 / 36 / 60 / 84 px.

## Layout
Everything is left-aligned (right-aligned in Arabic). The page is one long shop: measure, then the aisle sign, then the shelves.

```
OMH                       Catalogue  Pointures  Boutique     FR ع EN  [Panier 2]
Quelle est votre pointure ?                  <- display 84px, answer changes live
[(heel)|19 |20 |21 ... 42 ... 47 ]           <- Brannock plate, saffron slider
 cm under each number
De la babouche au crampon. Livraison partout au Maroc, paiement à la livraison.
────────────────────────────────────────────────────────────────────────────────
Ville            Sport           Été            Soirée        <- aisle directory:
 Derby…  2        Baskets 3       Sandales 2     Talons 3        families -> types,
 Mocassins 2      Running 3       ...                            text links + counts
────────────────────────────────────────────────────────────────────────────────
Pour: Tout le monde | Femme | Homme | Enfant        Trier [Sélection OMH]   (sticky)
Sport                                     <- family heading, 60px condensed
  Baskets
  (shoe)   (shoe)   (shoe)                <- open shelf, no cards: shoe on a floor shadow
  Atlas    Derb     Rif Low
  449 DH   329 DH   389 DH
  36–46    36–45    35–41
...
Trouver sa pointure (how to measure + table)   |   La boutique (WhatsApp, city)
```

Rejected alternative: a single flat grid with filter chips (the v1 version). It treated 19 shoe types as 19 equal buttons and 44 identical cards, which gave no sense of a shop.

## Principles
1. **The ruler is the memorable thing.** It is the only bold element. Everything else stays quiet: no card chrome, no badges, no shadows except the floor under each shoe.
2. **Structure is information.** Families and types are real store aisles. They are headings, not decoration. There are no numbered markers, because nothing here is a sequence.
3. **Every size is shown with its length in cm.** That detail only a shoe shop would have.
4. **Motion only answers the shopper.** The slider moves to the size they picked, sheets open from where they tapped. There are no entrance animations and no hover effects on product tiles.
5. **Copy is plain and practical.** Say what is in stock, what it costs, how to order.

## Review against the generic traits, and what changed
- **v1 used the SaaS-card kit** (identical rounded white cards with tinted panels, a "Nouveau" badge, a kraft pill on every card). **Changed:** products now sit on an open shelf with no card chrome. The size range is plain text. "Nouveau" is now a word in the meta line, not a badge.
- **v1 used Bricolage Grotesque,** a face that turns up on many generated pages. **Changed:** Big Shoulders Display + Reem Kufi, chosen for the stamped-digit look.
- **v1's hero was a generic "big headline + paragraph"** with the ruler underneath. **Changed:** the headline is now the ruler's question and its answer ("Pointure 42 : 31 modèles"), so the hero is one interactive object.
- **v1 rotated every card on hover.** **Removed.**
- **v1 had 19 equal filter chips with counts.** **Changed:** they are grouped into 8 families as an aisle directory that scrolls to each shelf.
- **Checked:** the palette is not cream+terracotta and not dark+acid. There are no all-caps eyebrows, no middle-dot meta strings, no arrows on buttons, and no monospace labels.

## Notes for next passes
- Real product photos replace the drawings. Keep the floor shadow and a light ground so photos sit on the same shelf.
- If the catalogue grows past ~150 models, add search to the sticky bar before adding more filters.
