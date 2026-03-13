import { PageActionLinks } from "../components/PageChrome";
import VoteWidget from "../components/VoteWidget";
import { getRootNavItems } from "../lib/navigation";

export default function HomePage() {
  return (
    <VoteWidget
      scope="main"
      aggregateMain
      topActions={<PageActionLinks items={getRootNavItems()} small={false} />}
    />
  );
}
