# Jellyfin Link Plugin

A dedicated device-linking page for Jellyfin, styled and behaving like
[plex.tv/link](https://plex.tv/link) rather than Jellyfin's built-in Quick
Connect settings screen.

Jellyfin already ships Quick Connect, but authorizing a code means digging
into Settings inside the full web client. This plugin adds a single, clean,
standalone page at:

```
http://your-server:8096/Link
```

Visitors:

1. Sign in with their normal server username/password (if not already
   signed in on that page).
2. Enter the 6-digit code shown on their TV, phone, or other device.
3. See a "Device linked!" confirmation — just like plex.tv/link.

Under the hood it's just a thin UI over Jellyfin's existing Quick Connect
API (`/QuickConnect/Authorize`), so every existing Jellyfin client app that
already supports Quick Connect works with it unmodified — no changes to any
client are required.

## Installing

### From a release

1. Download `link.zip` from the [Releases](../../releases) page (or the
   `jellyfin-plugin-link` build artifact from Actions).
2. Extract it into your Jellyfin `plugins` directory so you end up with
   `plugins/Link/Jellyfin.Plugin.Link.dll`.
3. Restart Jellyfin.
4. Visit `http://your-server:8096/Link`.

### Building from source

Requires the [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0).

```bash
dotnet build Jellyfin.Plugin.Link.sln -c Release
```

The compiled plugin is at
`Jellyfin.Plugin.Link/bin/Release/net8.0/Jellyfin.Plugin.Link.dll`. Copy it
into a `Link` folder under your server's `plugins` directory and restart
Jellyfin.

> The project targets the `Jellyfin.Controller`/`Jellyfin.Model` NuGet
> packages pinned to `10.9.11` in
> `Jellyfin.Plugin.Link/Jellyfin.Plugin.Link.csproj`. If you're running a
> different server version, bump those package versions (and `targetAbi` in
> `build.yaml`) to match.

## Configuration

In the Jellyfin admin dashboard, under **Plugins > Link**, you can customize:

- **Page heading** — the text shown above the sign-in form.
- **Accent color** — the hex color used for buttons and highlights.

The config page also shows the direct URL to share or bookmark.

## Notes

- Quick Connect must be enabled on the server (Dashboard > General). If it's
  off, the `/Link` page shows a message instead of the sign-in form.
- The page talks directly to the server's own API from the browser
  (`/Users/AuthenticateByName`, `/Users/Me`, `/QuickConnect/*`,
  `/System/Info/Public`) — there's no separate backend to configure.
- Signing in on the `/Link` page stores an access token in that browser's
  `localStorage` so repeat visits skip straight to the code entry step.
  "Sign in as someone else" clears it.
