import { ExperienceProvider } from "@/components/experience/ExperienceProvider";
import { Entrance } from "@/components/experience/Entrance";
import { MusicToggle } from "@/components/experience/MusicToggle";
import { Invitation } from "@/components/sections/Invitation";
import { ScratchReveal } from "@/components/sections/ScratchReveal";
import { Countdown } from "@/components/sections/Countdown";
import { OurStory } from "@/components/sections/OurStory";
import { EventCelebration } from "@/components/sections/EventCelebration";
import { Venue } from "@/components/sections/Venue";
import { Details } from "@/components/sections/Details";
import { Rsvp } from "@/components/sections/Rsvp";
import { Closing } from "@/components/sections/Closing";
import { eventConfig } from "@/config/event";
import { shortDate } from "@/lib/event";

export default function Home() {
  const { partnerOne, partnerTwo } = eventConfig.couple;
  return (
    <ExperienceProvider>
      <Entrance />
      <main id="main">
        <Invitation />
        <ScratchReveal />
        <Countdown />
        <OurStory />
        <EventCelebration />
        <Venue />
        <Details />
        <Rsvp />
        <Closing />
      </main>
      <footer
        className="px-5 pt-6 text-center"
        style={{ paddingBottom: "max(5.5rem, calc(env(safe-area-inset-bottom) + 4.5rem))" }}
      >
        <p className="text-[0.75rem] tracking-[0.12em] text-brown/80">
          {partnerOne} &amp; {partnerTwo}, {shortDate}
        </p>
      </footer>
      <MusicToggle />
    </ExperienceProvider>
  );
}
