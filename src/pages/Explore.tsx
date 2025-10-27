import { ExternalLink, Sparkles } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import Sidebar from "@/components/Sidebar";
import robloxLogo from "@/assets/roblox-logo.png";
import netlifyLogo from "@/assets/netlify-logo.png";
import facebookLogo from "@/assets/facebook-logo.png";

const Explore = () => {
  const platforms = [
    {
      name: "Roblox",
      logo: robloxLogo,
      links: [
        { url: "https://www.roblox.com/games/88482533960648/HAPI-3RD-TO-US-NINI", label: "HAPI 3RD TO US NINI" },
      ],
    },
    {
      name: "Netlify",
      logo: netlifyLogo,
      links: [
        { url: "https://hapimonthsie.netlify.app/", label: "Main Site" },
        { url: "https://hapimonthsie.netlify.app/decode", label: "Decode Page" },
        { url: "https://hapimonthsie.netlify.app/secret", label: "Secret" },
        { url: "https://hapimonthsie.netlify.app/nini", label: "Nini" },
      ],
    },
    {
      name: "Facebook",
      logo: facebookLogo,
      links: [
        { url: "https://www.facebook.com/share/p/1HCjNazzZw/", label: "Post Share" },
        { url: "https://www.facebook.com/profile.php?id=61582284120268&comment_id=Y29tbWVudDoxMjIwOTY1NzY3NDUwMzk4MDlfMTE5ODc4NjQ0MjA4MzI3Nw%3D%3D", label: "Comment Thread" },
      ],
    },
    {
      name: "Ixenos",
      icon: Sparkles,
      links: [
        { url: "https://ixenos.netlify.app/", label: "Ixenos Portal" },
      ],
    },
  ];

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar — no border, same background */}
      <div className="fixed inset-y-0 left-0 z-20 w-64 bg-background lg:static lg:inset-auto">
        <Sidebar />
      </div>

      {/* Main Content — clean, no card, no borders */}
      <main className="flex-1 lg:ml-64 mt-14 lg:mt-0">
        <div className="max-w-2xl mx-auto px-4 py-6 sm:px-6">
          {/* Page Title */}
          <h1 className="text-2xl sm:text-3xl font-bold mb-6 text-foreground">Explore</h1>

          {/* Accordion — no background, subtle hover */}
          <Accordion type="single" collapsible className="w-full space-y-3">
            {platforms.map((platform, index) => (
              <div
                key={platform.name}
                className="bg-card/50 backdrop-blur-sm rounded-xl p-1 transition-all hover:bg-card/70"
              >
                <AccordionItem value={`item-${index}`} className="border-0">
                  <AccordionTrigger className="px-4 py-3 text-lg font-medium hover:no-underline">
                    <div className="flex items-center gap-3">
                      {platform.logo ? (
                        <img
                          src={platform.logo}
                          alt={platform.name}
                          className="h-7 w-7 object-contain rounded-md"
                        />
                      ) : platform.icon ? (
                        <platform.icon className="h-6 w-6 text-primary" />
                      ) : null}
                      <span>{platform.name}</span>
                    </div>
                  </AccordionTrigger>

                  <AccordionContent className="px-4 pb-4 pt-2">
                    <div className="space-y-2 pl-10">
                      {platform.links.map((link, linkIndex) => (
                        <a
                          key={linkIndex}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2.5 text-sm text-primary hover:text-primary/80 hover:underline transition-all group"
                        >
                          <ExternalLink className="h-3.5 w-3.5 opacity-70 group-hover:opacity-100" />
                          <span className="truncate">{link.label}</span>
                        </a>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </div>
            ))}
          </Accordion>

          {/* Optional: Add subtle footer note */}
          <p className="mt-8 text-center text-xs text-muted-foreground">
            Discover hidden gems, secret pages, and more.
          </p>
        </div>
      </main>
    </div>
  );
};

export default Explore;
