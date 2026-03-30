"use client";

import { useEffect, useState } from "react";

type LeaderboardUser = {
  nickname: string;
  totalVotes: number;
  totalWeight: number;
};

type LeaderboardDistrict = {
  scope: string;
  label: string;
  county: string;
  city: string;
  totalVotes: number;
  totalWeight: number;
};

export default function VipLeaderboard() {
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [districts, setDistricts] = useState<LeaderboardDistrict[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/vip/leaderboard", { cache: "no-store" });
        if (res.ok) {
          const body = await res.json();
          setUsers(body.users || []);
          setDistricts(body.districts || []);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  if (loading) {
    return <p className="empty">Betöltés...</p>;
  }

  return (
    <>
      <section className="vip-leaderboard" aria-label="VIP ranglista - felhasználók">
        <h2>VIP ranglista - felhasználók</h2>
        {users.length === 0 ? (
          <p className="empty">Még nincs adat.</p>
        ) : (
          <ol className="vip-leaderboard-list">
            {users.map((user, idx) => (
              <li key={user.nickname} className="vip-leaderboard-item">
                <span className="vip-leaderboard-rank">{idx + 1}.</span>
                <span className="vip-leaderboard-name">{user.nickname}</span>
                <span className="vip-leaderboard-score">
                  {user.totalWeight} súly ({user.totalVotes} szavazat)
                </span>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section className="vip-leaderboard" aria-label="VIP ranglista - körzetek">
        <h2>VIP ranglista - legtöbb szavazatú körzetek</h2>
        {districts.length === 0 ? (
          <p className="empty">Még nincs adat.</p>
        ) : (
          <ol className="vip-leaderboard-list">
            {districts.map((district, idx) => (
              <li key={district.scope} className="vip-leaderboard-item">
                <span className="vip-leaderboard-rank">{idx + 1}.</span>
                <span className="vip-leaderboard-name">{district.label}</span>
                <span className="vip-leaderboard-meta">{district.county}</span>
                <span className="vip-leaderboard-score">
                  {district.totalWeight} súly ({district.totalVotes} szavazat)
                </span>
              </li>
            ))}
          </ol>
        )}
      </section>
    </>
  );
}
