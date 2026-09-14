using System;
using System.Collections.Generic;
using System.Globalization;
using Jellyfin.Plugin.Link.Configuration;
using MediaBrowser.Common.Configuration;
using MediaBrowser.Common.Plugins;
using MediaBrowser.Model.Plugins;
using MediaBrowser.Model.Serialization;

namespace Jellyfin.Plugin.Link;

/// <summary>
/// The Link plugin. Adds a dedicated, Plex.tv/link-style device linking page
/// (served at <c>/Link</c>) that authorizes Jellyfin Quick Connect codes.
/// </summary>
public class Plugin : BasePlugin<PluginConfiguration>, IHasWebPages
{
    /// <summary>
    /// Initializes a new instance of the <see cref="Plugin"/> class.
    /// </summary>
    /// <param name="applicationPaths">Instance of the <see cref="IApplicationPaths"/> interface.</param>
    /// <param name="xmlSerializer">Instance of the <see cref="IXmlSerializer"/> interface.</param>
    public Plugin(IApplicationPaths applicationPaths, IXmlSerializer xmlSerializer)
        : base(applicationPaths, xmlSerializer)
    {
        Instance = this;
    }

    /// <inheritdoc />
    public override string Name => "Link";

    /// <inheritdoc />
    public override Guid Id => Guid.Parse("3cf8ee31-4bee-4afa-b838-b8df49dfeb90");

    /// <inheritdoc />
    public override string Description =>
        "Adds a dedicated /Link page for pairing devices, in the style of plex.tv/link, backed by Jellyfin Quick Connect.";

    /// <summary>
    /// Gets the current plugin instance.
    /// </summary>
    public static Plugin? Instance { get; private set; }

    /// <inheritdoc />
    public IEnumerable<PluginPageInfo> GetPages()
    {
        return new[]
        {
            new PluginPageInfo
            {
                Name = "Link",
                EmbeddedResourcePath = string.Format(
                    CultureInfo.InvariantCulture,
                    "{0}.Configuration.configPage.html",
                    GetType().Namespace)
            }
        };
    }
}
