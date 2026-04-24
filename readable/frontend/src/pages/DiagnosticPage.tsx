import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";

import { startDiagnostic, submitDiagnostic } from "../api/sessions";
import { ErrorBanner } from "../components/ErrorBanner";
import { RecordButton } from "../components/RecordButton";
import { ScoreCard } from "../components/ScoreCard";
import { TextReader } from "../components/TextReader";
import { getErrorMessage } from "../lib/errors";
import { profileStore } from "../stores/profileStore";
import { sessionStore } from "../stores/sessionStore";

export const DiagnosticPage = () => {
  const { currentSession, sessionResults, setCurrentSession, setSessionResults } = sessionStore();
  const setStudentProfile = profileStore((state) => state.setStudentProfile);

  const startMutation = useMutation({
    mutationFn: startDiagnostic,
    onSuccess: (response) => {
      setCurrentSession({
        sessionId: response.session_id,
        sessionType: "diagnostic",
        expectedText: response.expected_text,
      });
      setSessionResults(null);
      toast.success("Diagnostic passage ready.");
    },
  });

  const submitMutation = useMutation({
    mutationFn: (file: File) =>
      submitDiagnostic(currentSession?.sessionId ?? 0, file, { cursor_path: [2, 4, 8, 14] }),
    onSuccess: (response) => {
      setSessionResults(response.result);
      setStudentProfile(response.profile);
      toast.success("Diagnostic submitted.");
    },
  });

  const passage = currentSession?.expectedText ?? "";

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] bg-hero-radial p-8 shadow-soft">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-sea">Diagnostic Session</p>
            <h1 className="mt-2 text-3xl font-semibold text-ink">Baseline reading check-in</h1>
            <p className="mt-3 max-w-2xl text-slate-600">
              Start a session, read the passage aloud, and review mock speech and attention
              feedback.
            </p>
          </div>
          <button
            type="button"
            onClick={() => startMutation.mutate()}
            className="rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            {startMutation.isPending ? "Preparing..." : "Start Diagnostic"}
          </button>
        </div>
      </section>

      {startMutation.isError ? <ErrorBanner message={getErrorMessage(startMutation.error)} /> : null}
      {submitMutation.isError ? <ErrorBanner message={getErrorMessage(submitMutation.error)} /> : null}

      {passage ? (
        <section className="space-y-5">
          <div className="rounded-[2rem] bg-white p-6 shadow-soft">
            <h2 className="text-lg font-semibold text-ink">Passage</h2>
            <p className="mt-4 text-lg leading-8 text-slate-700">{passage}</p>
          </div>
          <RecordButton
            label="Start Recording"
            onStop={async (file) => {
              await submitMutation.mutateAsync(file);
            }}
          />
        </section>
      ) : null}

      {sessionResults ? (
        <section className="space-y-6">
          <ScoreCard
            accuracy={sessionResults.accuracy_pct}
            wpm={sessionResults.speed_wpm}
            attention={sessionResults.attention_score}
          />
          <div>
            <h2 className="mb-3 text-xl font-semibold text-ink">Highlighted passage</h2>
            <TextReader text={[sessionResults.expected_text]} highlights={sessionResults.errors} />
          </div>
        </section>
      ) : null}
    </div>
  );
};
