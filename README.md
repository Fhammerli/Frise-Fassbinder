# Fassbinder Explorer — Version 3.4 modulaire

Cette version part de la construction autonome `V3.2-STANDALONE-PREVIEW-FIX` et applique l’architecture du cahier des charges V30.

## Lecteur de listes multiples

La fonction commune `splitCellList`, définie dans `assets/js/normalizer.js`, est utilisée par l’import et le validateur.

- le point-virgule et le retour à la ligne sont toujours reconnus ;
- `|` est accepté uniquement pour les champs où ce séparateur est documenté ;
- dans les cellules de liens, `|` reste réservé à la syntaxe `Libellé|URL` ;
- la virgule n’est jamais utilisée comme séparateur générique ; elle est activée explicitement pour la liste des notions afin de préserver le format existant.

## Installation

Conserver `index.html`, le dossier `assets` et les trois classeurs au même niveau. Sur GitHub Pages, déposer tout le contenu de cette archive à la racine du dépôt.

Fichiers attendus :

- `RWF_Frise.xlsx`
- `RWF_Films.xlsx`
- `RWF_Entourage.xlsx`
- `RWF_Quiz.csv` et `RWF_Flashcards.csv` lorsqu’ils sont utilisés

## Architecture

- `assets/js/data-loader.js` : import et modèle canonique
- `assets/js/normalizer.js` : colonnes, noms, alias et IDs
- `assets/js/validator.js` : erreurs, avertissements et rapport
- `assets/js/router.js` : navigation croisée
- `assets/js/views/` : Frise, Films et Entourage
- `assets/js/app.js` : démarrage, quiz, flashcards et raccourcis

Les vues utilisent uniquement `CANONICAL_MODEL`, produit par l’import et la normalisation.

## Contrôles cachés

- `Ctrl + Alt + D` : ouvre et place le focus au début de l’état des données
- `Ctrl + Alt + N` : ouvre et place le focus directement sur le rapport de normalisation
- `?admin=1` ou `?normalisation=1` : ouverture par l’URL

Sur Mac, la touche Alt correspond à Option. Pour les deux lettres, les combinaisons `Contrôle + Option` et `Commande + Option` sont reconnues.
