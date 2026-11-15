# panier-service

Microservice **Panier** de la plateforme e-commerce (Groupe 2, module DevOps II).
Il permet de consulter, d'ajouter et de retirer des articles du panier d'un utilisateur.

## Prérequis
- Node.js 22 et npm
- Docker

## Lancer en local
```
npm install
node src/server.js
```
Le service écoute sur http://localhost:3001 (test : `/health`).

## Variables d'environnement
| Variable | Rôle | Valeur par défaut |
|---|---|---|
| PORT | port du serveur | 3001 |
| CATALOGUE_URL | adresse du service Catalogue | http://localhost:3000 |
| COMMANDES_URL | adresse du service Commandes (prévue pour le checkout) | http://localhost:3002 |

## Endpoints
Voir [api-contract.md](api-contract.md).

## Tests
```
npm test
```
Les tests (Jest + Supertest) simulent le Catalogue : aucun autre service n'est nécessaire.

## Docker
```
docker build -t panier-service:local .
docker run --rm -p 3001:3001 panier-service:local
```
Le Dockerfile est multi-stage (étape de test, puis image finale Alpine légère).

## Pipeline isolation
Le pipeline Jenkins du Panier est **indépendant** des autres microservices :

- **Dépôt séparé :** le pipeline ne se déclenche que sur les commits du dépôt `panier-service`. Les autres services ont leur propre dépôt et leur propre pipeline.
- **Build sans dépendance :** la construction de l'image n'a besoin d'aucun autre service. Le Catalogue n'a pas besoin d'être en ligne.
- **Tests isolés :** le Catalogue est remplacé par un faux (`jest.mock`) dans les tests. Les tests passent donc même si le Catalogue est arrêté ou en cours de mise à jour.
- **Pas d'URL écrite en dur :** les adresses des autres services viennent des variables `CATALOGUE_URL` et `COMMANDES_URL`. Dans Kubernetes, elles sont fournies par le Deployment (ConfigMap).
- **Versions propres :** chaque build produit une image `<compte-dockerhub>/panier:v<numéro de build>`, avec son propre cycle de versions.
- **Déploiement ciblé :** l'étape Deploy exécute uniquement `kubectl set image deployment/panier ...`. Les Pods Catalogue et Commandes ne sont ni modifiés ni recréés.
- **Contrat stable :** les échanges entre services respectent [api-contract.md](api-contract.md). Tant que le contrat ne change pas, chaque service peut être mis à jour seul.
