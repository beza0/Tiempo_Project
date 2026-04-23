import { PageLayout } from "../components/layout/PageLayout";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { ImageWithFallback } from "../components/common/ImageWithFallback";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Calendar, Clock, Star } from "lucide-react";
import type { PageType } from "../App";
import { useLanguage } from "../contexts/LanguageContext";
import { formatTemplate } from "../language";

interface PastSessionsPageProps {
  onNavigate?: (page: PageType) => void;
}

type SessionRow = {
  id: string;
  title: string;
  type: "learned" | "taught";
  date: string;
  duration: string;
  rated: boolean;
  rating?: number;
  person: { name: string; image: string };
};

const pastSessions: SessionRow[] = [];

export function PastSessionsPage({ onNavigate }: PastSessionsPageProps) {
  const { t } = useLanguage();
  const p = t.pastSessions;
  const learnedSessions = pastSessions.filter((s) => s.type === "learned");
  const taughtSessions = pastSessions.filter((s) => s.type === "taught");

  return (
    <PageLayout onNavigate={onNavigate}>
      <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8">
            <h1 className="mb-2 text-3xl text-foreground">{p.title}</h1>
            <p className="text-muted-foreground">{p.subtitle}</p>
          </div>

          <Tabs defaultValue="all" className="space-y-6">
            <TabsList className="rounded-xl border border-border bg-muted p-1 shadow-lg">
              <TabsTrigger value="all" className="rounded-lg">
                {p.tabAll}
              </TabsTrigger>
              <TabsTrigger value="learned" className="rounded-lg">
                {p.tabLearned}
              </TabsTrigger>
              <TabsTrigger value="taught" className="rounded-lg">
                {p.tabTaught}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4">
              {pastSessions.length === 0 ? (
                <EmptySessions message={p.emptyAll} />
              ) : (
                pastSessions.map((session) => (
                  <SessionCard key={session.id} session={session} />
                ))
              )}
            </TabsContent>

            <TabsContent value="learned" className="space-y-4">
              {learnedSessions.length === 0 ? (
                <EmptySessions message={p.emptyLearned} />
              ) : (
                learnedSessions.map((session) => (
                  <SessionCard key={session.id} session={session} />
                ))
              )}
            </TabsContent>

            <TabsContent value="taught" className="space-y-4">
              {taughtSessions.length === 0 ? (
                <EmptySessions message={p.emptyTaught} />
              ) : (
                taughtSessions.map((session) => (
                  <SessionCard key={session.id} session={session} />
                ))
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </PageLayout>
  );
}

function EmptySessions({ message }: { message: string }) {
  return (
    <Card className="rounded-xl border border-dashed border-border bg-muted/20 p-12 text-center">
      <p className="text-muted-foreground">{message}</p>
    </Card>
  );
}

function SessionCard({ session }: { session: SessionRow }) {
  const { t } = useLanguage();
  const p = t.pastSessions;
  const person = session.person;

  return (
    <Card className="rounded-xl border border-border p-6 transition-shadow hover:shadow-md">
      <div className="flex items-start gap-4">
        <ImageWithFallback
          src={person.image}
          alt={person.name}
          className="w-16 h-16 rounded-full object-cover"
        />

        <div className="flex-1">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="mb-1 text-lg text-foreground">{session.title}</h3>
              <p className="text-sm text-muted-foreground">
                {session.type === "learned"
                  ? formatTemplate(p.learnedLine, { name: person.name })
                  : formatTemplate(p.taughtLine, { name: person.name })}
              </p>
            </div>
            <Badge variant={session.type === "learned" ? "default" : "secondary"}>
              {session.type === "learned" ? p.learned : p.taught}
            </Badge>
          </div>

          <div className="mb-4 flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>{session.date}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{session.duration}</span>
            </div>
          </div>

          {session.rated ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                {[...Array(session.rating ?? 0)].map((_, i) => (
                  <Star
                    key={i}
                    className="w-4 h-4 fill-yellow-400 text-yellow-400"
                  />
                ))}
              </div>
              <span>{p.youRated}</span>
            </div>
          ) : (
            <Button
              size="sm"
              className="bg-gradient-to-r from-blue-500 to-purple-600 text-white"
            >
              {p.rateReview}
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
