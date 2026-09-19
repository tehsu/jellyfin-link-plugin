# Jellyfin Link Plugin

A dedicated device-linking page for Jellyfin, styled and behaving like
[plex.tv/link](https://plex.tv/link) rather than Jellyfin's built-in Quick
Connect settings screen.

Jellyfin already ships Quick Connect, but authorizing a code means digging
into Settings inside the full web client. This plugin adds a single, clean,
standalone page at:

```
http://your-server:8096/link
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

### Via plugin repository (recommended)

1. In the Jellyfin admin dashboard, go to **Dashboard &rsaquo; Plugins &rsaquo;
   Repositories &rsaquo; Add Repository**.
2. Add this repository's manifest URL:

   ```
   https://raw.githubusercontent.com/tehsu/jellyfin-link-plugin/main/manifest.json
   ```

3. Go to **Dashboard &rsaquo; Plugins &rsaquo; Catalog**, find **Link** under
   the **General** category, and install it.
4. Restart Jellyfin, then visit `http://your-server:8096/link`.

Future releases published this way (new tags built by
[`.github/workflows/build.yml`](.github/workflows/build.yml)) will show up
as updates in the Catalog automatically, once `manifest.json` is updated
with their entry.

### Manual install

Jellyfin plugins are just a DLL dropped into the server's `plugins`
directory, so you can also install it by hand.

#### 1. Get `Jellyfin.Plugin.Link.dll`

Either:

- **Download a prebuilt DLL** from the `jellyfin-plugin-link` artifact of
  the latest [Actions build run](../../actions/workflows/build.yml) (or from
  the [Releases](../../releases) page, once a release has been tagged) — the
  artifact is `link.zip`, containing a `Link/Jellyfin.Plugin.Link.dll`
  folder, or
- **Build it from source** — requires the
  [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0):

  ```bash
  git clone https://github.com/tehsu/jellyfin-link-plugin.git
  cd jellyfin-link-plugin
  dotnet build Jellyfin.Plugin.Link.sln -c Release
  ```

  This produces
  `Jellyfin.Plugin.Link/bin/Release/net8.0/Jellyfin.Plugin.Link.dll`.

> The project targets the `Jellyfin.Controller`/`Jellyfin.Model` NuGet
> packages pinned to `10.9.11` in
> `Jellyfin.Plugin.Link/Jellyfin.Plugin.Link.csproj`. If you're running a
> different server version, bump those package versions (and `targetAbi` in
> `build.yaml`) to match.

#### 2. Find your Jellyfin `plugins` folder

This is the same folder every other manually-installed Jellyfin plugin goes
in:

| Setup | Typical `plugins` path |
| --- | --- |
| Linux (`.deb`/`.rpm` package) | `/var/lib/jellyfin/plugins` |
| Docker (official `jellyfin/jellyfin` image) | `<your config volume>/plugins` (i.e. `/config/plugins` inside the container) |
| Windows | `%ProgramData%\Jellyfin\Server\plugins` |
| macOS / manual install | `~/.local/share/jellyfin/plugins` (or wherever `--datadir` points) |

If you're unsure, check **Dashboard &rsaquo; General** or your server logs
at startup — Jellyfin prints the resolved data/plugins paths there.

#### 3. Copy the plugin in

Create a `Link` subfolder inside `plugins` and place the DLL there, so you
end up with:

```
plugins/
  Link/
    Jellyfin.Plugin.Link.dll
```

#### 4. Restart Jellyfin

#### 5. Confirm it loaded

Go to **Dashboard &rsaquo; Plugins &rsaquo; My Plugins** — you should see
**Link** listed. Click it to set the page heading and accent color (see
[Configuration](#configuration) below).

#### 6. Visit the page

```
http://your-server:8096/link
```

## Configuration

In the Jellyfin admin dashboard, under **Plugins > Link**, you can customize:

- **Page heading** — the text shown above the sign-in form.
- **Accent color** — the hex color used for buttons and highlights.

The config page also shows the direct URL to share or bookmark.

## Notes

- Quick Connect must be enabled on the server (Dashboard > General). If it's
  off, the `/link` page shows a message instead of the sign-in form.
- The page talks directly to the server's own API from the browser
  (`/Users/AuthenticateByName`, `/Users/Me`, `/QuickConnect/*`,
  `/System/Info/Public`) — there's no separate backend to configure.
- Requests are authenticated with Jellyfin's standard
  `Authorization: MediaBrowser ...` header. Plugin versions before 1.0.1
  used the legacy `X-Emby-Authorization`/`X-Emby-Token` headers, which
  servers ignore once legacy authorization is off (the default since
  Jellyfin 12) — that showed up as **"Sign in failed"** on the sign-in
  form. Upgrade to 1.0.1 or newer if you hit that.
- If your server is hosted under a base URL (Dashboard > Networking), the
  page lives at `http://your-server:8096/<base-url>/link`.
- Signing in on the `/link` page stores an access token in that browser's
  `localStorage` so repeat visits skip straight to the code entry step.
  "Sign in as someone else" clears it.
