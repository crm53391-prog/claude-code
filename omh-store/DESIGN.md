# OMH: design plan, v3 (frontend-design)

## Brief (from the owner)
- The admin creates every section and product (name, price, photos). The site ships empty, with no preset shoe types.
- White and black. The blue and yellow of v2 are dropped.
- A photo or video at the top of the homepage that reveals itself as you scroll.
- No size question on the homepage. The size is chosen inside the product.
- More shop features: customer ratings and reviews, favourites, search, promotions.
- An organisation that does not feel traditional.

## Subject
- **What:** OMH, a Moroccan shoe boutique. Products are photographed by the owner.
- **Audience:** shoppers on phones, in French, Arabic or English.
- **Primary job:** see the shoes, trust them (reviews), and order on WhatsApp.

The colour comes from the owner's photos. The interface is a white gallery wall with black type, so photographs of leather, suede and rubber carry all the colour.

## Tokens
| Name | Hex | Role |
|---|---|---|
| white | `#FFFFFF` | page |
| black | `#000000` | type, buttons, hero ground (true black, chosen, not a tinted near-black) |
| stone | `#F1F0EE` | photo backdrop behind each product, like a studio sweep |
| graphite | `#5E5E5E` | secondary text |
| rule | `#E2E1DE` | dividers, input borders |
| promo red | `#D0021B` | old price strike and promo label only (functional) |

**Type**
- **Archivo** (variable width 62–125). Headlines are set **expanded 125 and black 900**, and the hero wordmark is the same face at full width. Small UI text is condensed at 75 so prices and sizes stay compact. One family, two voices through width.
- **IBM Plex Sans Arabic** for all Arabic text.
- **Scale:** 13 / 16 / 20 / 32 / 56 / clamp up to 160 for the wordmark.

## Layout
```
[announcement: Livraison gratuite dès 500 DH]                     (admin text)
OMH        [search……………]           FR ع EN     ♡ 2    Panier 1
┌──────────────────────────────────────────────────────────────────┐
│  hero photo / video (admin upload)                               │  starts inset with
│                                                                  │  margins, grows to
│  OMH                                    (title + text from admin)│  full bleed as you
└──────────────────────────────────────────────────────────────────┘  scroll
Rayons:  [photo tile][photo tile][photo tile] ……    (admin categories, scrolls sideways)
Tout | Nouveautés | Promos | Favoris          Trier ▾        24 modèles
┌──────────┐ ┌────┐ ┌────┐
│ big tile │ │    │ │    │      the first product of each view is a large tile,
│          │ └────┘ └────┘      the rest a tight 4-column grid. No card chrome:
│          │ ┌────┐ ┌────┐      photo on stone, name, stars, price.
└──────────┘ └────┘ └────┘
Ce que disent nos clients: the latest reviews, scrolling sideways
Livraison partout au Maroc | Paiement à la livraison | Commande sur WhatsApp
footer: contact, city, links
```
Text is left-aligned (right in Arabic). The grid runs edge to edge with a thin gutter, like a lookbook rather than a catalogue table.

## Principles
1. **The hero is the one bold moment.** The owner's photo or video grows from a framed picture to full bleed as the page scrolls, and the OMH wordmark sits on it in white. Nothing else on the page moves on its own.
2. **Photos carry the colour.** The interface stays black and white. Red appears only for promotions.
3. **Trust is visible.** Stars and review counts sit on every product, and real reviews have their own strip.
4. **The page fills itself from the admin.** Every section, name and price comes from the database. Empty states tell the owner and the shopper what comes next.
5. **Plain words.** "Ajouter au panier", "Commander sur WhatsApp", "Donner mon avis".

## Review against the generic traits
- **Black and white could become** "near-black with one acid accent" (trait 2). **Avoided:** the ground is white, black is pure `#000`, and the only colour is functional promo red.
- **The product grid could become the SaaS-card kit** (trait 4). **Avoided:** there are no borders, shadows or rounded cards. Photos sit on a stone backdrop. The large first tile breaks the identical grid.
- **The hero could be** "big number + gradient". **Avoided:** it is the owner's own photo or video, with a scroll reveal tied to it.
- **Checked:** no eyebrow labels in caps, no middle-dot meta strings, no arrows appended to buttons, no monospace labels, and no numbered markers.

## Notes for next passes
- When real photos arrive, check the hero wordmark contrast on light photos. A bottom gradient of up to 40% black is the fallback.
- If reviews grow past a few hundred, page them on the product sheet.
