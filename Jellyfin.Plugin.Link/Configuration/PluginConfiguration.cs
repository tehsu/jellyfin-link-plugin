using MediaBrowser.Model.Plugins;

namespace Jellyfin.Plugin.Link.Configuration;

/// <summary>
/// Configuration for the Link plugin.
/// </summary>
public class PluginConfiguration : BasePluginConfiguration
{
    /// <summary>
    /// Initializes a new instance of the <see cref="PluginConfiguration"/> class.
    /// </summary>
    public PluginConfiguration()
    {
        PageTitle = "Link Your Device";
        AccentColor = "#e5a00d";
    }

    /// <summary>
    /// Gets or sets the heading shown at the top of the /link page.
    /// </summary>
    public string PageTitle { get; set; }

    /// <summary>
    /// Gets or sets the accent color (hex) used to style the /link page.
    /// </summary>
    public string AccentColor { get; set; }
}
