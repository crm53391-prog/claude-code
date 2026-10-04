# OMH, boutique de chaussures

Site boutique en français, arabe et anglais, avec un espace admin.

- **La boutique (`index.html`)** : grande photo ou vidéo d'accueil qui s'agrandit au défilement, rayons, recherche, nouveautés, promos, favoris, avis clients avec étoiles, panier, et commande sur WhatsApp avec paiement à la livraison.
- **L'admin (`admin.html`)** : le propriétaire crée ses rayons et ses produits (nom, prix, ancien prix pour une promo, photos, pointures et stock, couleurs). Il suit les commandes, gère les avis et règle le numéro WhatsApp, le bandeau du haut et l'image ou la vidéo d'accueil.

Le site ne contient aucun produit au départ : tout vient de l'admin.

## Mode démo

Tant que `js/config.js` est vide, le site tourne en **mode démo**. Tout ce qui est ajouté dans l'admin reste dans le navigateur, ce qui suffit pour essayer. Pour que les clients voient les produits, il faut brancher Supabase.

## Mettre en ligne avec Supabase (gratuit)

1. Créez un compte sur https://supabase.com, puis un nouveau projet.
2. **Base de données** : ouvrez *SQL Editor > New query*, collez tout le fichier `supabase/schema.sql`, puis cliquez sur *Run*.
3. **Compte admin** : *Authentication > Users > Add user*, avec l'e-mail et le mot de passe du propriétaire.
4. **Fermer les inscriptions** : *Authentication > Providers > Email*, puis décochez « Allow new users to sign up ». Ainsi, seul le compte admin peut modifier la boutique.
5. **Clés** : *Project Settings > API*. Copiez « Project URL » et la clé « anon public » dans `js/config.js`.
6. **Hébergement** : déposez le dossier `omh-store` sur Netlify, Vercel ou GitHub Pages. C'est un site statique, sans build.
7. Ouvrez `votre-site/admin.html`, connectez-vous, puis remplissez les Réglages (numéro WhatsApp) et ajoutez vos rayons et produits.

La clé « anon public » peut être publique : les règles de sécurité de `schema.sql` empêchent les visiteurs de modifier quoi que ce soit. Ils peuvent seulement lire la boutique, laisser un avis et enregistrer une commande.

## Fichiers

| Fichier | Rôle |
|---|---|
| `index.html`, `css/store.css`, `js/store.js` | la boutique |
| `admin.html`, `css/admin.css`, `js/admin.js` | l'espace admin |
| `js/data.js` | lecture et écriture des données (Supabase, ou navigateur en mode démo) |
| `js/i18n.js` | textes de la boutique en FR / AR / EN |
| `js/config.js` | clés Supabase |
| `supabase/schema.sql` | tables, sécurité et stockage des photos |
| `DESIGN.md` | choix de design (couleurs, polices, mise en page) |

---

## بالعربية باختصار

- الموقع كيبدا خاوي، والأدمين هو اللي كيزيد الأقسام والمنتجات من `admin.html`.
- باش الزبناء يشوفو المنتجات: دير حساب فـ Supabase، شغّل `supabase/schema.sql`، زيد حساب الأدمين، وحط Project URL و anon key فـ `js/config.js`.
- من بعد، حط الدوسي فـ Netlify أو Vercel.
