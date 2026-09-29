# productivity_shield — Features

## Créneaux horaires

- **Créneaux configurables** — par défaut 9h-12h et 14h-18h, éditables dans les réglages
- **Plusieurs créneaux** — ajout/suppression libre
- **Portée** — la whitelist/blacklist et la navbar de classification ne s'appliquent qu'en profil Normal pendant un créneau actif (hors créneau : navigation libre)

## Whitelist / Blacklist / Neutre

- **Blacklist** — domaine bloqué pendant un créneau actif (profil Normal) ou en permanence (profil Focus)
- **Whitelist** — domaine jamais bloqué
- **Navbar de classification** — sur un domaine non classé, barre sticky en haut de page avec 3 actions : Whitelist / Blacklist / Ignorer
- **Mémorisation permanente** — "Ignorer" marque le domaine comme neutre confirmé, la navbar ne réapparaît plus jamais pour ce domaine
- **Exclusivité mutuelle** — un domaine ne peut appartenir qu'à une seule des trois listes à la fois

## Pause

- **10 minutes** de navigation libre sur les domaines blacklistés
- **1 pause par fenêtre glissante de 60 minutes**, décomptée depuis la fin de la dernière pause utilisée (pas un reset à heure fixe)
- **Bouton pause** proposé directement sur la page de blocage, si disponible
- **Bannière de décompte** — pendant une pause active, une barre sticky affiche le temps restant sur chaque page, avec un bouton "Masquer" (masquage valable pour la page courante, réaffichée sur une nouvelle navigation)
- **Indisponible en profil Focus**

## Profils

- **Normal** (par défaut) — créneaux + whitelist/blacklist + pause
- **Zen** — extension désactivée, navigation libre partout
- **Focus** — blacklist appliquée en permanence, indépendamment des créneaux, sans pause

## Interface

- **Popup** — profil actif, statut du créneau, statut de la pause, raccourcis whitelist/blacklist pour le site courant
- **Réglages** — édition des créneaux, gestion des 3 listes de domaines, sélection du profil
- **Onboarding** — page de présentation au premier lancement
- **Page de blocage** — explique la raison du blocage, propose une pause si disponible

## Privacy

- **Zéro collecte de données** — pas d'analytics, pas de télémétrie, pas de requêtes externes
- **Stockage local uniquement** — créneaux/listes/profil en `chrome.storage.sync`, état de pause en `chrome.storage.local`
