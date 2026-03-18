import { PageActionLinks, PageHero, PageIntro } from "../components/PageChrome";
import VoteWidget from "../components/VoteWidget";
import { getRootNavItems } from "../lib/navigation";

export default function HomePage() {
  return (
    <VoteWidget
      scope="main"
      aggregateMain
      hero={<PageHero />}
      pageIntro={
        <PageIntro
          eyebrow="Országos"
          title="Váltani akarsz? Vagy nem?"
          intro="Egyszerű kérdés, egyszerű válasz. Itt az országos állásra tudsz igen vagy nem szavazatot adni."
        />
      }
      showDefaultHeading={false}
      topActions={<PageActionLinks items={getRootNavItems()} small={false} />}
    />
  );
}
