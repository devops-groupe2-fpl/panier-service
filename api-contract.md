# Contrat d'API — Panier ↔ Commandes (Groupe 2)

Statut : **validé par Zineb (Panier) et Hasna (Commandes) le 15/11/2026**

## Conventions
- Toutes les requêtes et réponses sont en JSON.
- Erreur : toujours `{ "error": "message" }`.
- Codes utilisés : 200, 201, 400, 404, 500, 502.
- Via l'Ingress, les URLs commencent par `/api/panier` ou `/api/commandes` ; les routes internes ci-dessous n'ont pas ce préfixe.
- Item de panier : `{ productId, name, quantity, unitPrice }`.

## Service Panier (port 3001)

### GET /health
Réponse 200 : `{ "status": "ok" }`

### GET /cart/:userId
Réponse 200 :
```json
{
  "userId": "user1",
  "items": [
    { "productId": 1, "name": "Clavier", "quantity": 2, "unitPrice": 25.5 }
  ],
  "totalAmount": 51
}
```
Panier vide : `{ "userId": "user1", "items": [], "totalAmount": 0 }`

### POST /cart/:userId/add
Corps : `{ "productId": 1, "quantity": 2 }` (`quantity` vaut 1 par défaut)
- 200 : le panier mis à jour (même format que GET)
- 400 : `productId` manquant ou `quantity` n'est pas un entier >= 1
- 404 : produit inconnu du Catalogue
- 500 : erreur interne (par exemple Catalogue injoignable)

Si le produit est déjà dans le panier, sa quantité augmente de `quantity`.

### DELETE /cart/:userId/remove/:productId
- 200 : le panier mis à jour
- 404 : produit absent du panier

### POST /cart/:userId/checkout
Envoie le panier au service Commandes puis vide le panier.
- 201 : `{ "orderId": 12, "status": "pending", "createdAt": "2026-11-15T12:00:00Z" }`
- 400 : panier vide
- 502 : service Commandes injoignable

## Service Commandes (port 3002)

### POST /orders
Corps (envoyé par le Panier) :
```json
{
  "userId": "user1",
  "items": [
    { "productId": 1, "name": "Clavier", "quantity": 2, "unitPrice": 25.5 }
  ],
  "totalAmount": 51
}
```
- 201 : `{ "orderId": 12, "status": "pending", "createdAt": "2026-11-15T12:00:00Z" }`
- 400 : données manquantes ou invalides

## Variables d'environnement du Panier
| Variable | Rôle | Valeur par défaut |
|---|---|---|
| PORT | port du serveur | 3001 |
| CATALOGUE_URL | adresse du Catalogue | http://localhost:3000 |
| COMMANDES_URL | adresse de Commandes | http://localhost:3002 |

Dans Kubernetes : `http://catalogue-service:3000` et `http://commandes-service:3002`.

## Questions ouvertes
- Le code 409 (stock insuffisant) est-il utile ? Seul le Catalogue connaît le stock.
- Quel `userId` le frontend utilisera-t-il (par exemple une valeur fixe « user1 ») ?
