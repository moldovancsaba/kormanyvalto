import Link from "next/link";
import VoteWidget from "../components/VoteWidget";

export default function HomePage() {
  return (
    <>
      <div className="nav-strip">
        <Link href="/ogy2026/egyeni-valasztokeruletek" className="nav-link-button">
          OGY 2026 körzetek listája
        </Link>
      </div>
      <VoteWidget scope="main" aggregateMain />
    </>
  );
}
