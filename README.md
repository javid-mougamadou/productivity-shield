# productivity_shield

Bloque la navigation distrayante pendant vos créneaux de productivité, avec
whitelist/blacklist, pause de 10 minutes et trois profils (normal / zen /
focus). No tracking. Open source.

## Features

Voir [FEATURES.md](./FEATURES.md) pour la liste complète.

## Install (dev)

```bash
git clone ...
```

1. Ouvrir `chrome://extensions`
2. Activer le **Mode développeur**
3. Cliquer **Charger l'extension non empaquetée** → sélectionner ce dossier

> Note : les icônes fournies (`icons/`, `docs/icons/`) sont des placeholders
> repris de `tab_suspender` — à remplacer avant toute publication.

## Développement UI sans recharger l'extension

```bash
./dev/serve.sh
# ou
cd dev && docker compose up
```

Puis ouvrir `http://localhost:3457/dev/`.

## Architecture

```
background/     Service worker ES module (config, domains, schedule, pause, profiles, navigation, messages)
content/        Navbar sticky de classification de domaine
shared/         Wrapper storage + utilitaires
popup/          Popup de l'extension
pages/          blocked, settings, onboarding
dev/            Environnement de dev local (Docker + mock chrome.*)
```

## Privacy

Zéro donnée collectée. Tout est stocké localement via `chrome.storage`.

## License

MIT
