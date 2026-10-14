# Embedding the widget

Copy the one-line snippet from the Widget tab and paste it before `</body>`:

```html
<script src="https://your-app.example.com/widget/v1.js" data-bot="pk_xxx" async></script>
```

## Allowed domains

For security, set the domains where your widget is allowed to appear (Settings on the agent, or the Widget tab). Leave it empty during testing — the dashboard shows a warning that your widget can be embedded anywhere until you restrict it.

## Caching

The widget's configuration is cached for 60 seconds. Changes you publish from the Widget designer can take up to a minute to reach visitors already on your site.

## Content Security Policy

If your site sets a CSP, allow the widget's script and API calls:

```
script-src https://your-app.example.com;
connect-src https://your-app.example.com;
```

## Size

The widget is under 5 KB gzipped, has zero dependencies, and runs inside a Shadow DOM — it never inherits your page's styles, and never leaks its own styles onto your page.
