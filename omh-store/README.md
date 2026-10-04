# OMH, boutique de chaussures

Site vitrine statique (HTML/CSS/JS, sans build) en français, arabe et anglais.
Le client choisit un modèle, sa pointure et sa couleur, remplit son panier, puis envoie la commande sur WhatsApp.

Ouvrir `index.html` dans un navigateur suffit. Pour tester en local : `python3 -m http.server` dans ce dossier.

## Modifier la boutique

Tout se fait dans `products.js` :

- `OMH_CONFIG.whatsapp` : le numéro WhatsApp de la boutique, format international sans `+` (ex. `212612345678`).
- `OMH_CONFIG.city`, `currency`, `freeDeliveryFrom` : ville, devise, seuil de livraison offerte.
- `OMH_CATEGORIES` : les types de chaussures affichés.
- `OMH_PRODUCTS` : un objet par modèle (`name` en 3 langues, `cat`, `gender` h/f/e/u, `price`, `sizes` [min, max], `soldOut`, `colors`, `mat`, `isNew`).
- `OMH_COLORS` : le nom de chaque couleur dans les 3 langues.

Les textes de l'interface sont dans `i18n.js`. Les dessins de chaussures sont temporaires, en attendant les vraies photos.

Lien direct vers un type : `index.html#babouches`, `index.html#sneakers`, etc.
