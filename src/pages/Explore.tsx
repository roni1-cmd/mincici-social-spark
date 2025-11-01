import { ExternalLink, Sparkles, Music } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card } from "@/components/ui/card";
import Sidebar from "@/components/Sidebar";
import robloxLogo from "@/assets/roblox-logo.png";
import netlifyLogo from "@/assets/netlify-logo.png";
import facebookLogo from "@/assets/facebook-logo.png";
import { Separator } from "@/components/ui/separator";

const Explore = () => {
  const platforms = [
    {
      name: "Roblox",
      logo: robloxLogo,
      links: [
        {
          url: "https://www.roblox.com/games/88482533960648/HAPI-3RD-TO-US-NINI",
          label: "What's this?",
        },
      ],
    },
    {
      name: "Netlify",
      logo: netlifyLogo,
      links: [
        {
          url: "https://hapimonthsie.netlify.app/",
          label: "What's this?",
        },
        {
          url: "https://hapimonthsie.netlify.app/decode",
          label: "What's this?",
        },
        {
          url: "https://hapimonthsie.netlify.app/secret",
          label: "What's this?",
        },
        {
          url: "https://hapimonthsie.netlify.app/nini",
          label: "What's this?",
        },
      ],
    },
    {
      name: "Facebook",
      logo: facebookLogo,
      links: [
        {
          url: "https://www.facebook.com/share/p/1HCjNazzZw/",
          label: "What's this?",
        },
        {
          url: "https://www.facebook.com/profile.php?id=61582284120268&comment_id=Y29tbWVudDoxMjIwOTY1NzY3NDUwMzk4MDlfMTE5ODc4NjQ0MjA4MzI3Nw%3D%3D",
          label: "What's this?",
        },
      ],
    },
    {
      name: "Ixenos",
      icon: Sparkles,
      links: [
        {
          url: "https://ixenos.netlify.app/",
          label: "What's this?",
        },
      ],
    },
  ];

  const spotifyPlaylists = [
    {
      id: "0S6E710cHNzkVaCZ5LFDof",
      name: "Playlist 1",
    },
    {
      id: "5qiwExlOCykM5tczNv6L31",
      name: "Playlist 2",
    },
    {
      id: "3T4V3TCCWA8hqbVKSO7k30",
      name: "Playlist 3",
    },
  ];

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 lg:ml-0 mt-14 lg:mt-0">
        <div className="max-w-4xl mx-auto">
          <div className="sticky top-0 z-10 bg-card/95 backdrop-blur border-b border-border p-4">
            <h2 className="text-2xl font-bold">Explore</h2>
          </div>

          <div className="p-4 space-y-6">
            {/* Platforms Section */}
            <Card className="p-6">
              <h3 className="text-xl font-bold mb-4">Platforms</h3>
              <Accordion type="single" collapsible className="w-full">
                {platforms.map((platform, index) => (
                  <AccordionItem key={platform.name} value={`item-${index}`}>
                    <AccordionTrigger className="text-lg font-semibold hover:no-underline">
                      <div className="flex items-center gap-3">
                        {platform.logo ? (
                          <div className="h-10 w-10 flex items-center justify-center bg-muted rounded-lg">
                            <img src={platform.logo} alt={platform.name} className="h-6 w-6 object-contain" />
                          </div>
                        ) : platform.icon ? (
                          <div className="h-10 w-10 flex items-center justify-center bg-muted rounded-lg">
                            <platform.icon className="h-6 w-6 text-primary" />
                          </div>
                        ) : null}
                        <span>{platform.name}</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="flex flex-col gap-3 pt-3 pl-14">
                        {platform.links.map((link, linkIndex) => (
                          <a
                            key={linkIndex}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-primary hover:underline transition-colors p-2 hover:bg-muted rounded-md"
                          >
                            <ExternalLink className="h-4 w-4 flex-shrink-0" />
                            <span className="break-all">{link.label}</span>
                          </a>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </Card>

            {/* Spotify Playlists Section */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Music className="h-6 w-6 text-green-500" />
                <h3 className="text-xl font-bold">Spotify Playlists</h3>
              </div>
              <div className="space-y-4">
                {spotifyPlaylists.map((playlist, index) => (
                  <div key={playlist.id}>
                    <iframe
                      style={{ borderRadius: "12px" }}
                      src={`https://open.spotify.com/embed/playlist/${playlist.id}?utm_source=generator`}
                      width="100%"
                      height="152"
                      frameBorder="0"
                      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                      loading="lazy"
                      className="w-full"
                    />
                    {index < spotifyPlaylists.length - 1 && <Separator className="my-4" />}
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Explore;
