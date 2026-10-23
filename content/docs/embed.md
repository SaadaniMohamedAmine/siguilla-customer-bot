# Embedding the widget

Copy the one-line snippet from the Widget tab and paste it before `</body>`:

```html
<script src="https://your-app.example.com/widget/v1.js" data-bot="pk_xxx" async></script>
```

## Allowed domains

For security, set the domains where your widget is allowed to appear (Settings on the agent, or the Widget tab). Leave it empty during testing.

> **Warning** — until you restrict the allowed domains, your widget can be embedded anywhere. The dashboard shows a warning while the list is empty.

## Caching

The widget's configuration is cached for 60 seconds, then refreshed in the background for up to 10 more minutes. Changes you publish from the Widget designer usually appear within a minute, and at most within about ten minutes, for visitors already on your site.

> **Tip** — refresh the page after a minute to see your latest widget changes.

## Content Security Policy

If your site sets a CSP, allow the widget's script and API calls:

```
script-src https://your-app.example.com;
connect-src https://your-app.example.com;
```

## Size

The widget is under 5 KB gzipped, has zero dependencies, and runs inside a Shadow DOM — it never inherits your page's styles, and never leaks its own styles onto your page.
