import Link from "next/link";
import VoteWidget from "../components/VoteWidget";

export default function HomePage() {
  return (
    <VoteWidget
      scope="main"
      aggregateMain
      topActions={
        <>
          <Link href="/ogy2026/egyeni-valasztokeruletek" className="nav-link-button">
            OGY 2026 körzetek listája
          </Link>
          <Link href="/dashboard" className="nav-link-button">
            Grafikon
          </Link>
        </>
      }
    />
  );
}
