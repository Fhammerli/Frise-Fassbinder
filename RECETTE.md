# Recette de la version 3.4 modulaire

Date : 26 juillet 2026

## Résultats fonctionnels hérités de la V3.3

- Import de `RWF_Frise.xlsx` : 9 périodes et 32 années.
- Import de `RWF_Films.xlsx` : 40 œuvres.
- Import de `RWF_Entourage.xlsx` : 23 personnes.
- Contrôle de cohérence : 0 erreur bloquante, 16 avertissements éditoriaux.
- Cas Effi Briest : 7 personnes reconnues et cliquables ; aucun faux positif « référence d’entourage introuvable ».
- Lecteur de listes : point-virgule, LF et CRLF reconnus ; `|` activé seulement pour les champs documentés ; virgules préservées.
- Cellules de liens : plusieurs liens séparés par point-virgule ou retour à la ligne ; syntaxe `Libellé|URL` préservée.
- Quiz : quatre propositions distinctes et réponses fonctionnelles.
- Flashcards : ouverture, retournement et navigation fonctionnels.
- Index Films et Entourage : ouverture et recherche fonctionnelles.
- Fiches Film et Personne : aucun identifiant technique visible.
- Raccourcis `Ctrl + Alt + D` et `Ctrl + Alt + N` : le panneau est déplié ; `D` replace le panneau au début et donne le focus à « État des données », tandis que `N` place directement le focus sur le rapport de normalisation. Sur Mac, `Commande + Option` est également accepté.
- Erreurs JavaScript pendant la recette : aucune.

## Contrôles propres à la V3.4

- Syntaxe vérifiée pour tous les modules JavaScript.
- Six tests automatisés du lecteur commun réussis.
- Les lecteurs de liens, de références Films et de références Entourage appellent tous `splitCellList`.
- La virgule n’est pas un séparateur générique.

Commande de contrôle : `node tests/list-reader.test.js`.

## Architecture vérifiée

L’HTML, le CSS et le JavaScript sont séparés. Les fichiers d’import, de normalisation, de validation, de routage et les trois vues ont chacun une responsabilité distincte. Toutes les vues utilisent le même objet `CANONICAL_MODEL`.

La bibliothèque XLSX est fournie localement dans `assets/vendor`, sans dépendance au CDN utilisé par la version 3.2.
