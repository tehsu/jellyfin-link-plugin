using System;
using System.Net.Mime;
using System.Reflection;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Jellyfin.Plugin.Link.Api;

/// <summary>
/// Serves the standalone, Plex.tv/link-style device linking page and its assets.
/// The page itself is plain static content; it talks to the server's existing,
/// unauthenticated-friendly APIs (login and Quick Connect) directly from the browser.
/// </summary>
[ApiController]
[AllowAnonymous]
[Route("Link")]
public class LinkController : ControllerBase
{
    private static readonly Assembly _assembly = typeof(LinkController).Assembly;

    /// <summary>
    /// Gets the device linking page.
    /// </summary>
    /// <returns>The HTML page.</returns>
    [HttpGet]
    [Produces("text/html")]
    public ActionResult Index()
    {
        return GetEmbeddedResource("link.html", "text/html");
    }

    /// <summary>
    /// Gets the stylesheet for the device linking page.
    /// </summary>
    /// <returns>The CSS file.</returns>
    [HttpGet("link.css")]
    [Produces("text/css")]
    public ActionResult Css()
    {
        return GetEmbeddedResource("link.css", "text/css");
    }

    /// <summary>
    /// Gets the client-side script for the device linking page.
    /// </summary>
    /// <returns>The JavaScript file.</returns>
    [HttpGet("link.js")]
    [Produces("application/javascript")]
    public ActionResult Js()
    {
        return GetEmbeddedResource("link.js", "application/javascript");
    }

    /// <summary>
    /// Gets the display configuration (title/accent color) for the device linking page.
    /// </summary>
    /// <returns>A small JSON payload consumed by link.js.</returns>
    [HttpGet("Config")]
    [Produces(MediaTypeNames.Application.Json)]
    public ActionResult<object> Config()
    {
        var config = Plugin.Instance?.Configuration ?? new Configuration.PluginConfiguration();

        return new
        {
            title = config.PageTitle,
            accentColor = config.AccentColor
        };
    }

    private FileStreamResult GetEmbeddedResource(string fileName, string contentType)
    {
        var resourcePath = $"Jellyfin.Plugin.Link.Web.{fileName}";
        var stream = _assembly.GetManifestResourceStream(resourcePath)
            ?? throw new InvalidOperationException($"Embedded resource '{resourcePath}' not found.");

        return File(stream, contentType);
    }
}
