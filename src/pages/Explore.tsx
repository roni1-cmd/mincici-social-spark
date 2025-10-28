import { ExternalLink, Sparkles } from "lucide-react";
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

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex-1">
        <div className="container max-w-2xl mx-auto p-6">
          <h1 className="text-3xl font-bold mb-6">Explore</h1>
          <Card className="p-6">
            <Accordion type="single" collapsible className="w-full">
              {platforms.map((platform, index) => (
                <AccordionItem key={platform.name} value={`item-${index}`}>
                  <AccordionTrigger className="text-lg font-semibold">
                    <div className="flex items-center gap-2">
                      {platform.logo ? (
                        <img src={platform.logo} alt={platform.name} className="h-6 w-6 object-contain" />
                      ) : platform.icon ? (
                        <platform.icon className="h-5 w-5" />
                      ) : null}
                      {platform.name}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="flex flex-col gap-2 pt-2">
                      {platform.links.map((link, linkIndex) => (
                        <a
                          key={linkIndex}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-primary hover:underline transition-colors"
                        >
                          <ExternalLink className="h-4 w-4" />
                          {link.label}
                        </a>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Explore;
