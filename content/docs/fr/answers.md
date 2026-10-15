# Comment fonctionnent les réponses

Quand un visiteur pose une question, Sigilla récupère les 6 segments les plus pertinents de vos sources (similarité cosinus sur les embeddings), puis demande au modèle de répondre **uniquement** à partir de ce contexte.

## Seuil de similarité

Chaque agent a un seuil de similarité (réglable dans les Paramètres). Si la meilleure correspondance obtient un score inférieur, Sigilla ignore complètement l'appel au modèle et renvoie le message de repli — aucune réponse inventée, aucune requête gaspillée.

Les citations ont [leur propre page](/docs/citations).

## Langue

Les agents répondent dans la même langue que le dernier message du visiteur.

## Repli

Quand le contexte ne contient pas la réponse, votre agent le dit franchement et propose de faire intervenir un humain — voir [Passage à un humain](/docs/handoff).
