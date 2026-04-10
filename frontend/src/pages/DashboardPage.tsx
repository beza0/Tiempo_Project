import { PageLayout } from "../components/layout/PageLayout";
import type { PageType } from "../App";
import { StatCard } from "../components/dashboard/StatCard";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Clock, TrendingUp, BookOpen, Award, Plus } from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";
import { useAuth } from "../contexts/AuthContext";
import { formatTemplate } from "../language";
import { useEffect, useState } from "react";
import { fetchMyDashboard, type UserDashboardDto } from "../api/user";
import {
  fetchReceivedExchangeRequests,
  fetchSentExchangeRequests,
  type ExchangeRequestDto,
} from "../api/exchange";

interface DashboardPageProps {
  onNavigate?: (page: PageType) => void;
}

const statIcons = [Clock, BookOpen, TrendingUp, Award] as const;
const statGradients = [
  "from-blue-500 to-cyan-500",
  "from-purple-500 to-pink-500",
  "from-orange-500 to-red-500",
  "from-green-500 to-emerald-500",
] as const;

function formatBookedDuration(minutes: number, loc: string): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (loc === "tr") {
    if (h > 0 && m === 0) return `${h} sa`;
    if (h > 0) return `${h} sa ${m} dk`;
    return `${m} dk`;
  }
  if (h > 0 && m === 0) return `${h} h`;
  if (h > 0) return `${h} h ${m} min`;
  return `${m} min`;
}

function formatDashCredits(minutes: number, loc: string): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (loc === "tr") {
    if (h > 0 && m === 0) return `${h} saat`;
    if (h > 0) return `${h} sa ${m} dk`;
    return `${m} dk`;
  }
  if (h > 0 && m === 0) return `${h} h`;
  if (h > 0) return `${h} h ${m} min`;
  return `${m} min`;
}

export function DashboardPage({ onNavigate }: DashboardPageProps) {
  const { t, locale } = useLanguage();
  const d = t.dashboard;
  const { user, token } = useAuth();
  const myId = user?.id;
  const displayName = user?.name ?? "";
  const [dash, setDash] = useState<UserDashboardDto | null>(null);
  const [upcoming, setUpcoming] = useState<ExchangeRequestDto[]>([]);

  useEffect(() => {
    if (!token) {
      setDash(null);
      return;
    }
    fetchMyDashboard(token)
      .then(setDash)
      .catch(() => setDash(null));
  }, [token]);

  useEffect(() => {
    if (!token || !myId) {
      setUpcoming([]);
      return;
    }
    Promise.all([
      fetchSentExchangeRequests(token),
      fetchReceivedExchangeRequests(token),
    ])
      .then(([sent, received]) => {
        const map = new Map<string, ExchangeRequestDto>();
        for (const e of sent) map.set(e.id, e);
        for (const e of received) map.set(e.id, e);
        const accepted = Array.from(map.values()).filter(
          (e) => e.status.toUpperCase() === "ACCEPTED",
        );
        accepted.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
        setUpcoming(accepted);
      })
      .catch(() => setUpcoming([]));
  }, [token, myId]);

  const statValues: [string, string, string, string] = dash
    ? [
        formatDashCredits(dash.timeCreditMinutes, locale),
        String(dash.mySkillsCount),
        String(dash.sentRequestsCount),
        String(dash.receivedRequestsCount),
      ]
    : ["—", "—", "—", "—"];

  return (
    <PageLayout onNavigate={onNavigate}>
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl sm:text-4xl text-white mb-2">
            {formatTemplate(d.welcome, { name: displayName })}
          </h1>
          <p className="text-lg text-white/90">{d.subtitle}</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 pb-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {d.stats.map((stat, index) => (
            <StatCard
              key={index}
              title={stat.title}
              value={statValues[index]}
              icon={statIcons[index]}
              gradient={statGradients[index]}
              description={stat.description || undefined}
            />
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card className="rounded-2xl border-0 p-6 shadow-lg">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-xl text-foreground">{d.upcomingTitle}</h2>
                <Button
                  size="sm"
                  className="bg-gradient-to-r from-blue-500 to-purple-600 text-white"
                  onClick={() => onNavigate?.("browse")}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  {d.bookNew}
                </Button>
              </div>

              <div className="space-y-4">
                {upcoming.length === 0 ? (
                  <p className="py-8 text-center text-muted-foreground">
                    {d.upcomingEmpty}
                  </p>
                ) : (
                  upcoming.map((ex) => {
                    const partnerName =
                      ex.requesterId === myId
                        ? ex.ownerName
                        : ex.requesterName;
                    const dur = formatBookedDuration(ex.bookedMinutes, locale);
                    return (
                      <Card
                        key={ex.id}
                        className="rounded-xl border border-border p-4"
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <h4 className="font-medium text-foreground">
                              {ex.skillTitle}
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              {formatTemplate(d.upcomingWith, {
                                name: partnerName,
                              })}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {formatTemplate(d.upcomingBooked, {
                                duration: dur,
                              })}
                            </p>
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="shrink-0"
                            onClick={() => {
                              try {
                                sessionStorage.setItem(
                                  "timelink_open_exchange",
                                  ex.id,
                                );
                              } catch {
                                /* ignore */
                              }
                              onNavigate?.("messages");
                            }}
                          >
                            {d.upcomingMessages}
                          </Button>
                        </div>
                      </Card>
                    );
                  })
                )}
              </div>

              <Button
                variant="ghost"
                className="w-full mt-4"
                onClick={() => onNavigate?.("past-sessions")}
              >
                {d.viewAllSessions}
              </Button>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="rounded-2xl border-0 p-6 shadow-lg">
              <h3 className="mb-4 text-lg text-foreground">{d.quickActions}</h3>
              <div className="space-y-3">
                <Button
                  className="w-full justify-start bg-gradient-to-r from-blue-500 to-purple-600 text-white"
                  onClick={() => onNavigate?.("add-skill")}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {d.offerSkill}
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => onNavigate?.("browse")}
                >
                  <BookOpen className="w-4 h-4 mr-2" />
                  {d.browseSkills}
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => onNavigate?.("past-sessions")}
                >
                  <Clock className="w-4 h-4 mr-2" />
                  {d.viewPastSessions}
                </Button>
              </div>
            </Card>

            <Card className="rounded-2xl border-0 p-6 shadow-lg">
              <h3 className="mb-4 text-lg text-foreground">
                {d.learningProgress}
              </h3>
              <p className="py-6 text-center text-sm text-muted-foreground">
                {d.learningEmpty}
              </p>
            </Card>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
