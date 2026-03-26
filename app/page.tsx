'use client';

import Image from 'next/image';
import { useMemo, useState } from 'react';

type Shot = {
  shot_number: number;
  shot_title: string;
  framing: string;
  description: string;
  visual_prompt: string;
  mood: string;
  color_palette: string;
  image_url?: string;
  image_alt?: string;
  image_credit_name?: string;
  image_credit_url?: string;
};

type Scene = {
  scene_number: number;
  scene_title: string;
  summary: string;
  location: string;
  time_of_day: string;
  shots: Shot[];
};

type Act = {
  act_number: number;
  act_title: string;
  act_purpose: string;
  scenes: Scene[];
};

type Storyboard = {
  title: string;
  logline: string;
  style_note: string;
  acts: Act[];
};

type GenerateResponse = {
  status: 'success';
  storyboard: Storyboard;
  generation_source: 'gemini' | 'fallback';
  image_source: 'unsplash';
};

const SAMPLE_PROMPT = 'A small-town mechanic discovers a buried machine that predicts disasters one day too early.';

export default function Home() {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [storyboardData, setStoryboardData] = useState<Storyboard | null>(null);
  const [error, setError] = useState('');
  const [sources, setSources] = useState<{ generation: string; images: string } | null>(null);

  const totalShots = useMemo(() => {
    if (!storyboardData) {
      return 0;
    }

    return storyboardData.acts.reduce(
      (actTotal, act) =>
        actTotal +
        act.scenes.reduce((sceneTotal, scene) => sceneTotal + scene.shots.length, 0),
      0,
    );
  }, [storyboardData]);

  const generate = async () => {
    if (!prompt.trim()) return;

    setLoading(true);
    setError('');
    setStoryboardData(null);
    setSources(null);

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Unable to generate storyboard.');
      }

      const payload = data as GenerateResponse;
      setStoryboardData(payload.storyboard);
      setSources({
        generation: payload.generation_source,
        images: payload.image_source,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to generate storyboard.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="film-grain min-h-screen px-4 py-6 text-[var(--foreground)] sm:px-6 lg:px-10">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-8">
        <div className="glass-panel relative overflow-hidden rounded-[32px] px-5 py-6 sm:px-8 sm:py-8">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--accent-soft)] to-transparent opacity-80" />
          <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
            <div className="space-y-5">
              <div className="inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.35em] text-[var(--accent-soft)]">
                Single Prompt to 3-Act Storyboard
              </div>
              <div className="space-y-4">
                <h1 className="display-font text-6xl leading-none sm:text-7xl lg:text-8xl">
                  Auto-Director
                </h1>
                <p className="max-w-2xl text-sm leading-7 text-white/78 sm:text-base">
                  Turn one line into a film-ready narrative with a screenwriter, cinematographer,
                  and visual artist pipeline. Every run returns 3 acts, 9 scenes, and 27 shots in a
                  scrollable cinematic feed.
                </p>
              </div>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-[var(--surface-strong)] p-4 shadow-2xl">
              <label htmlFor="idea" className="mb-3 block text-xs uppercase tracking-[0.28em] text-white/55">
                Seed Idea
              </label>
              <div className="space-y-3">
                <textarea
                  id="idea"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder={SAMPLE_PROMPT}
                  rows={4}
                  className="min-h-32 w-full resize-none rounded-[22px] border border-white/10 bg-white/5 px-4 py-4 text-sm leading-7 text-white outline-none transition focus:border-[var(--accent-soft)] focus:bg-white/8"
                />
                <div className="flex flex-col gap-3 sm:flex-row">
                  <button
                    onClick={generate}
                    disabled={loading}
                    className="rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-bold uppercase tracking-[0.24em] text-slate-950 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {loading ? 'Directing...' : 'Generate Feed'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setPrompt(SAMPLE_PROMPT)}
                    className="rounded-full border border-white/12 px-6 py-3 text-sm uppercase tracking-[0.24em] text-white/82 transition hover:bg-white/6"
                  >
                    Try Example
                  </button>
                </div>
                {error ? <p className="text-sm text-amber-300">{error}</p> : null}
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="glass-panel rounded-[28px] p-5">
            <p className="text-xs uppercase tracking-[0.28em] text-white/50">Pipeline</p>
            <p className="mt-3 text-lg text-white">Screenwriter, cinematographer, and visual artist orchestration.</p>
          </div>
          <div className="glass-panel rounded-[28px] p-5">
            <p className="text-xs uppercase tracking-[0.28em] text-white/50">Required Shape</p>
            <p className="mt-3 text-lg text-white">3 acts, 3 scenes per act, and 3 framed shots per scene.</p>
          </div>
          <div className="glass-panel rounded-[28px] p-5">
            <p className="text-xs uppercase tracking-[0.28em] text-white/50">Output</p>
            <p className="mt-3 text-lg text-white">Vertical cinematic feed with image-backed shot cards.</p>
          </div>
        </div>

        {storyboardData ? (
          <section className="space-y-8 pb-16">
            <div className="glass-panel rounded-[32px] p-6 sm:p-8">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                <div className="space-y-3">
                  <p className="text-xs uppercase tracking-[0.3em] text-[var(--cool)]">Generated Storyboard</p>
                  <h2 className="display-font text-5xl leading-none sm:text-6xl">{storyboardData.title}</h2>
                  <p className="max-w-3xl text-sm leading-7 text-white/74 sm:text-base">
                    {storyboardData.logline}
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="rounded-[20px] border border-white/10 bg-white/5 px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.22em] text-white/50">Acts</p>
                    <p className="mt-2 text-2xl font-semibold">3</p>
                  </div>
                  <div className="rounded-[20px] border border-white/10 bg-white/5 px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.22em] text-white/50">Scenes</p>
                    <p className="mt-2 text-2xl font-semibold">9</p>
                  </div>
                  <div className="rounded-[20px] border border-white/10 bg-white/5 px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.22em] text-white/50">Shots</p>
                    <p className="mt-2 text-2xl font-semibold">{totalShots}</p>
                  </div>
                </div>
              </div>
              <p className="mt-5 text-sm leading-7 text-white/60">{storyboardData.style_note}</p>
              {sources ? (
                <div className="mt-4 flex flex-wrap gap-2 text-xs uppercase tracking-[0.18em] text-white/68">
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-2">
                    Story: {sources.generation}
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-2">
                    Images: {sources.images}
                  </span>
                </div>
              ) : null}
              {sources?.generation === 'fallback' ? (
                <p className="mt-4 text-sm leading-7 text-amber-300">
                  Gemini quota is unavailable right now, so the storyboard was generated using the
                  built-in fallback pipeline while images still come from Unsplash.
                </p>
              ) : null}
            </div>

            <div className="space-y-8">
              {storyboardData.acts.map((act) => (
                <article key={act.act_number} className="glass-panel rounded-[32px] p-5 sm:p-8">
                  <div className="mb-8 flex flex-col gap-3 border-b border-white/10 pb-6">
                    <p className="text-xs uppercase tracking-[0.32em] text-[var(--accent-soft)]">
                      Act {act.act_number}
                    </p>
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                      <h3 className="display-font text-4xl sm:text-5xl">{act.act_title}</h3>
                      <p className="max-w-2xl text-sm leading-7 text-white/68">{act.act_purpose}</p>
                    </div>
                  </div>

                  <div className="space-y-8">
                    {act.scenes.map((scene) => (
                      <section key={`${act.act_number}-${scene.scene_number}`} className="rounded-[28px] border border-white/10 bg-black/10 p-4 sm:p-5">
                        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                          <div>
                            <p className="text-xs uppercase tracking-[0.28em] text-white/45">
                              Scene {scene.scene_number}
                            </p>
                            <h4 className="mt-2 text-2xl font-semibold text-white">{scene.scene_title}</h4>
                          </div>
                          <div className="flex flex-wrap gap-2 text-xs uppercase tracking-[0.18em] text-white/68">
                            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-2">
                              {scene.location}
                            </span>
                            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-2">
                              {scene.time_of_day}
                            </span>
                          </div>
                        </div>
                        <p className="mb-6 max-w-4xl text-sm leading-7 text-white/70">{scene.summary}</p>

                        <div className="grid gap-5 xl:grid-cols-3">
                          {scene.shots.map((shot) => {
                            return (
                              <article
                                key={`${act.act_number}-${scene.scene_number}-${shot.shot_number}`}
                                className="overflow-hidden rounded-[26px] border border-white/10 bg-[var(--surface-strong)]"
                              >
                                <div className="image-card relative aspect-[16/10]">
                                  {shot.image_url ? (
                                    <Image
                                      src={shot.image_url}
                                      alt={shot.image_alt || `${scene.scene_title} - ${shot.shot_title}`}
                                      fill
                                      unoptimized
                                      className="object-cover"
                                    />
                                  ) : (
                                    <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(116,211,255,0.22),_transparent_34%),linear-gradient(135deg,_rgba(10,26,47,1)_0%,_rgba(22,47,78,1)_100%)] px-6 text-center text-sm leading-7 text-white/72">
                                      No Unsplash image matched this shot prompt.
                                    </div>
                                  )}
                                  <div className="absolute left-4 top-4 rounded-full border border-white/15 bg-black/35 px-3 py-2 text-[11px] uppercase tracking-[0.24em] text-[var(--accent-soft)]">
                                    {shot.framing}
                                  </div>
                                  <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between gap-3 text-[11px] uppercase tracking-[0.24em] text-white/75">
                                    <span>{shot.mood}</span>
                                    <span>Shot {shot.shot_number}</span>
                                  </div>
                                </div>
                                <div className="space-y-4 p-4 sm:p-5">
                                  <div>
                                    <p className="text-xs uppercase tracking-[0.24em] text-white/45">
                                      {shot.shot_title}
                                    </p>
                                    <p className="mt-2 text-sm leading-7 text-white/80">{shot.description}</p>
                                  </div>
                                  {shot.image_credit_name && shot.image_credit_url ? (
                                    <p className="text-xs text-white/48">
                                      Photo via{' '}
                                      <a
                                        href={shot.image_credit_url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="underline decoration-white/25 underline-offset-4"
                                      >
                                        {shot.image_credit_name}
                                      </a>
                                    </p>
                                  ) : null}
                                  <div className="rounded-[20px] border border-white/10 bg-white/5 p-4">
                                    <p className="text-xs uppercase tracking-[0.22em] text-[var(--cool)]">
                                      Visual Prompt
                                    </p>
                                    <p className="mt-2 text-sm leading-7 text-white/70">{shot.visual_prompt}</p>
                                  </div>
                                </div>
                              </article>
                            );
                          })}
                        </div>
                      </section>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : (
          <section className="glass-panel rounded-[32px] px-5 py-10 text-center sm:px-8">
            <p className="text-xs uppercase tracking-[0.32em] text-white/45">Awaiting Prompt</p>
            <h2 className="display-font mt-3 text-4xl sm:text-5xl">Your Cinematic Feed Will Land Here</h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-white/66 sm:text-base">
              Enter a single-line idea and the app will expand it into a vertically scrollable,
              presentation-ready storyboard with narrative structure, scene breakdowns, shot
              framing, and image-backed visuals.
            </p>
          </section>
        )}
      </section>
    </main>
  );
}
