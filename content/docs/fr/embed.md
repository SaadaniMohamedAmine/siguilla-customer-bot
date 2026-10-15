# Intégrer le widget

Copiez la ligne d'intégration depuis l'onglet Widget et collez-la avant `</body>` :

```html
<script src="https://your-app.example.com/widget/v1.js" data-bot="pk_xxx" async></script>
```

## Domaines autorisés

Pour la sécurité, indiquez les domaines sur lesquels votre widget peut apparaître (Paramètres de l'agent, ou onglet Widget). Laissez le champ vide pendant vos tests.

> **Attention** — tant que vous ne restreignez pas les domaines autorisés, votre widget peut être intégré n'importe où. Le tableau de bord affiche un avertissement tant que la liste est vide.

## Mise en cache

La configuration du widget est mise en cache pendant 60 secondes. Les changements que vous publiez depuis le designer de widget peuvent prendre jusqu'à une minute pour atteindre les visiteurs déjà présents sur votre site.

> **Astuce** — rechargez la page au bout d'une minute pour voir vos derniers changements.

## Content Security Policy

Si votre site définit une CSP, autorisez le script du widget et ses appels à l'API :

```
script-src https://your-app.example.com;
connect-src https://your-app.example.com;
```

## Taille

Le widget pèse moins de 5 Ko compressé, n'a aucune dépendance et s'exécute dans un Shadow DOM — il n'hérite jamais des styles de votre page et ne laisse jamais fuiter les siens sur elle.
