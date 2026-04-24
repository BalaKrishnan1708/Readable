import { useEffect, useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Link, useParams, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";

import { startReading, submitReading } from "../api/sessions";
import { ErrorBanner } from "../components/ErrorBanner";
import { RecordButton } from "../components/RecordButton";
import { ScoreCard } from "../components/ScoreCard";
import { TextReader } from "../components/TextReader";
import { getErrorMessage } from "../lib/errors";
import { profileStore } from "../stores/profileStore";
import { sessionStore } from "../stores/sessionStore";

export const LessonPage = () => {
  const { lessonId } = useParams();
  const [searchParams] = useSearchParams();
  const contentId = Number(searchParams.get("contentId"));
  const [activeWordIndex, setActiveWordIndex] = useState<number | null>(null);
  const { currentSession, sessionResults, setCurrentSession, setSessionResults } = sessionStore();
  const setStudentProfile = profileStore((state) => state.setStudentProfile);

  const startMutation = useMutation({
    mutationFn: startReading,
    onSuccess: (response) => {
      setCurrentSession({
        sessionId: response.session_id,
        sessionType: "reading",
        content: response.content,
      });
      setSessionResults(null);
      toast.success("Reading session ready.");
    },
  });

  const submitMutation = useMutation({
    mutationFn: (file: File) =>
      submitReading(currentSession?.sessionId ?? 0, file, {
        focused_word: activeWordIndex,
        click_path: [activeWordIndex ?? 0],
      }),
    onSuccess: (response) => {
      setSessionResults(response.result);
      setStudentProfile(response.profile);
      toast.success("Reading session submitted.");
    },
  });

  useEffect(() => {
    if (!Number.isNaN(contentId) && contentId > 0 && currentSession?.content?.id !== contentId) {
      startMutation.mutate({ personalized_content_id: contentId });
    }
  }, [contentId, currentSession?.content?.id, startMutation]);

  const content = currentSession?.content;
  const attentionTips = useMemo(() => {
    if (!sessionResults) return [];
    return [
      "Tap through each chunk to simulate gaze focus before recording.",
      sessionResults.attention_score < 0.75
        ? "Shorten the reading burst and pause between segments."
        : "Attention looked steady during this practice round.",
      sessionResults.speed_wpm < 100
        ? "Try one smoother reread to build pacing confidence."
        : "Pacing is in a comfortable range for supported reading.",
    ];
  }, [sessionResults]);

  if (Number.isNaN(contentId) || contentId <= 0) {
    return (
      <div className="rounded-[2rem] bg-white p-8 shadow-soft">
        <h1 className="text-2xl font-semibold text-ink">Reading session</h1>
        <p className="mt-3 text-slate-600">
          Open this page with a personalized content id, for example{" "}
          <code className="rounded bg-slate-100 px-2 py-1">/lesson/{lessonId}?contentId=1</code>.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] bg-hero-radial p-8 shadow-soft">
        <p className="text-sm uppercase tracking-[0.25em] text-sea">Guided Reading</p>
        <h1 className="mt-2 text-3xl font-semibold text-ink">Lesson {lessonId}</h1>
        <p className="mt-3 max-w-2xl text-slate-600">
          Tap words to simulate the eye-tracking cursor, then record a read-aloud and review the
          mock feedback.
        </p>
      </section>

      {startMutation.isError ? <ErrorBanner message={getErrorMessage(startMutation.error)} /> : null}
      {submitMutation.isError ? <ErrorBanner message={getErrorMessage(submitMutation.error)} /> : null}

      {content ? (
        <section className="space-y-5">
          <TextReader
            text={content.segments}
            highlights={sessionResults?.errors ?? []}
            activeWordIndex={activeWordIndex}
            onWordClick={setActiveWordIndex}
            fontSize={content.font_size}
            lineSpacing={content.line_spacing}
          />
          <div className="flex flex-wrap items-center gap-3">
            <RecordButton
              label="Start Reading"
              onStop={async (file) => {
                await submitMutation.mutateAsync(file);
              }}
            />
            <Link
              to="/dashboard"
              className="rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:border-sea hover:text-sea"
            >
              Back to Dashboard
            </Link>
          </div>
        </section>
      ) : null}

      {sessionResults ? (
        <section className="grid gap-6 xl:grid-cols-[1.2fr,0.8fr]">
          <div className="space-y-6">
            <ScoreCard
              accuracy={sessionResults.accuracy_pct}
              wpm={sessionResults.speed_wpm}
              attention={sessionResults.attention_score}
            />
            <div className="rounded-[2rem] bg-white p-6 shadow-soft">
              <h2 className="text-lg font-semibold text-ink">Errors and pacing</h2>
              <ul className="mt-4 space-y-3 text-sm text-slate-600">
                {sessionResults.errors.map((error) => (
                  <li key={`${error.word}-${error.position}`} className="rounded-2xl bg-blush px-4 py-3">
                    <span className="font-semibold text-ink">{error.word}</span> at position{" "}
                    {error.position + 1} was marked as <span className="text-amber-700">{error.type}</span>.
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="rounded-[2rem] bg-white p-6 shadow-soft">
            <h2 className="text-lg font-semibold text-ink">Feedback panel</h2>
            <div className="mt-4 space-y-3 text-sm text-slate-600">
              {attentionTips.map((tip) => (
                <p key={tip} className="rounded-2xl bg-mist px-4 py-3">
                  {tip}
                </p>
              ))}
              <p className="rounded-2xl bg-amber-50 px-4 py-3">
                Hesitation points: {sessionResults.hesitation_points.join(", ")}
              </p>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
};
