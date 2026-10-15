# Sources

Un agent ne connaît que ce que vous lui donnez. Sigilla prend en charge trois types de sources.

## PDF

Importez des fichiers PDF de 10 Mo maximum chacun. Sigilla lit le texte, le découpe en segments et calcule un embedding pour chaque segment afin de le retrouver.

## Sites web

Donnez à Sigilla une URL de départ. Il suit votre `sitemap.xml` s'il existe, sinon il explore les liens du même domaine, en respectant `robots.txt`. Le nombre de pages explorées par site est plafonné par votre offre.

## Notion (Pro et Team)

Connectez un espace Notion et choisissez les pages à indexer. Sigilla les resynchronise comme n'importe quelle autre source.

## Resynchroniser et supprimer

Cliquez sur **Resynchroniser** sur n'importe quelle source pour la réexplorer ou la relire — seuls les segments modifiés sont recalculés, et les anciens sont supprimés. Supprimer une source supprime immédiatement ses segments ; votre agent cesse de la citer aussitôt.
