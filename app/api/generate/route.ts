import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

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

type GenerationResponse = {
  status: 'success';
  storyboard: Storyboard;
  generation_source: 'gemini' | 'fallback';
  image_source: 'unsplash';
};

type UnsplashPhoto = {
  alt_description?: string | null;
  urls?: {
    regular?: string;
  };
  user?: {
    name?: string;
    links?: {
      html?: string;
    };
  };
};

type UnsplashSearchResponse = {
  results?: UnsplashPhoto[];
};

const DEFAULT_FRAMINGS = [
  'Wide Shot',
  'Medium Shot',
  'Close-Up',
  'Over-the-Shoulder',
  'Low Angle',
  'High Angle',
  'Tracking Shot',
  'Extreme Close-Up',
  'Establishing Shot',
];

const ACT_TITLES = ['The Setup', 'The Conflict', 'The Resolution'];
const ACT_PURPOSES = [
  'Introduce the world, protagonist, and inciting incident.',
  'Escalate the pressure with obstacles, reversals, and rising tension.',
  'Deliver the decisive confrontation and emotional payoff.',
];

function titleFromPrompt(prompt: string) {
  const cleaned = prompt
    .replace(/[^\w\s-]/g, ' ')
    .trim()
    .split(/\s+/)
    .slice(0, 5)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());

  return cleaned.length > 0 ? cleaned.join(' ') : 'Untitled Story';
}

function buildFallbackStoryboard(prompt: string): Storyboard {
  const seed = prompt.trim() || 'A mysterious cinematic adventure';
  const baseTitle = titleFromPrompt(seed);
  const locationHints = [
    'a rain-soaked city edge',
    'a guarded interior space',
    'a liminal transition zone',
    'a high-pressure confrontation point',
    'a quiet aftermath setting',
  ];
  const times = ['Dawn', 'Morning', 'Twilight', 'Night', 'Blue Hour'];
  const moods = ['tense', 'hopeful', 'urgent', 'dreamlike', 'triumphant'];
  const palettes = ['neon cyan and amber', 'steel blue and red', 'sepia gold', 'crimson and charcoal', 'teal and silver'];

  const acts = ACT_TITLES.map((actTitle, actIndex) => {
    const scenes = Array.from({ length: 3 }, (_, sceneIndex) => {
      const sceneNumber = sceneIndex + 1;
      const location = locationHints[(actIndex + sceneIndex) % locationHints.length];
      const time = times[(actIndex * 2 + sceneIndex) % times.length];
      const summaryPrefix = [
        'The protagonist enters the story world and senses the opportunity.',
        'The plan becomes tangible, but the environment pushes back.',
        'The stakes crystallize as the path toward the climax sharpens.',
      ][sceneIndex];

      const shots = Array.from({ length: 3 }, (_, shotIndex) => {
        const framing = DEFAULT_FRAMINGS[(actIndex * 3 + sceneIndex + shotIndex) % DEFAULT_FRAMINGS.length];
        const mood = moods[(actIndex + shotIndex) % moods.length];
        const color_palette = palettes[(sceneIndex + shotIndex) % palettes.length];
        const beat = [
          'establishes the environment and dramatic context',
          'captures a turning point in character intent',
          'lands an image that propels momentum into the next beat',
        ][shotIndex];

        return {
          shot_number: shotIndex + 1,
          shot_title: `Shot ${shotIndex + 1}`,
          framing,
          description: `${framing} that ${beat} for "${seed}".`,
          visual_prompt: `${framing}, cinematic still of ${seed}, ${location}, ${time.toLowerCase()}, ${mood} mood, ${color_palette}, highly detailed storyboard frame`,
          mood,
          color_palette,
        };
      });

      return {
        scene_number: sceneNumber,
        scene_title: `Scene ${sceneNumber}: ${['Arrival', 'Pressure', 'Shift'][sceneIndex]}`,
        summary: `${summaryPrefix} This scene interprets "${seed}" in a visually clear cinematic beat.`,
        location,
        time_of_day: time,
        shots,
      };
    });

    return {
      act_number: actIndex + 1,
      act_title: actTitle,
      act_purpose: ACT_PURPOSES[actIndex],
      scenes,
    };
  });

  return {
    title: baseTitle,
    logline: `A three-act cinematic interpretation of: ${seed}`,
    style_note: 'Designed as a vertical cinematic feed with director-ready scene and shot breakdowns.',
    acts,
  };
}

function normalizeStoryboard(input: unknown, prompt: string): Storyboard {
  const fallback = buildFallbackStoryboard(prompt);

  if (!input || typeof input !== 'object') {
    return fallback;
  }

  const source = input as Partial<Storyboard>;

  const acts = Array.from({ length: 3 }, (_, actIndex) => {
    const fallbackAct = fallback.acts[actIndex];
    const rawAct = Array.isArray(source.acts) ? source.acts[actIndex] : undefined;
    const actSource = rawAct && typeof rawAct === 'object' ? (rawAct as Partial<Act>) : undefined;

    const scenes = Array.from({ length: 3 }, (_, sceneIndex) => {
      const fallbackScene = fallbackAct.scenes[sceneIndex];
      const rawScene = Array.isArray(actSource?.scenes) ? actSource?.scenes[sceneIndex] : undefined;
      const sceneSource = rawScene && typeof rawScene === 'object' ? (rawScene as Partial<Scene>) : undefined;

      const shots = Array.from({ length: 3 }, (_, shotIndex) => {
        const fallbackShot = fallbackScene.shots[shotIndex];
        const rawShot = Array.isArray(sceneSource?.shots) ? sceneSource?.shots[shotIndex] : undefined;
        const shotSource = rawShot && typeof rawShot === 'object' ? (rawShot as Partial<Shot>) : undefined;

        return {
          shot_number: shotIndex + 1,
          shot_title:
            typeof shotSource?.shot_title === 'string' && shotSource.shot_title.trim()
              ? shotSource.shot_title.trim()
              : fallbackShot.shot_title,
          framing:
            typeof shotSource?.framing === 'string' && shotSource.framing.trim()
              ? shotSource.framing.trim()
              : fallbackShot.framing,
          description:
            typeof shotSource?.description === 'string' && shotSource.description.trim()
              ? shotSource.description.trim()
              : fallbackShot.description,
          visual_prompt:
            typeof shotSource?.visual_prompt === 'string' && shotSource.visual_prompt.trim()
              ? shotSource.visual_prompt.trim()
              : fallbackShot.visual_prompt,
          mood:
            typeof shotSource?.mood === 'string' && shotSource.mood.trim()
              ? shotSource.mood.trim()
              : fallbackShot.mood,
          color_palette:
            typeof shotSource?.color_palette === 'string' && shotSource.color_palette.trim()
              ? shotSource.color_palette.trim()
              : fallbackShot.color_palette,
        };
      });

      return {
        scene_number: sceneIndex + 1,
        scene_title:
          typeof sceneSource?.scene_title === 'string' && sceneSource.scene_title.trim()
            ? sceneSource.scene_title.trim()
            : fallbackScene.scene_title,
        summary:
          typeof sceneSource?.summary === 'string' && sceneSource.summary.trim()
            ? sceneSource.summary.trim()
            : fallbackScene.summary,
        location:
          typeof sceneSource?.location === 'string' && sceneSource.location.trim()
            ? sceneSource.location.trim()
            : fallbackScene.location,
        time_of_day:
          typeof sceneSource?.time_of_day === 'string' && sceneSource.time_of_day.trim()
            ? sceneSource.time_of_day.trim()
            : fallbackScene.time_of_day,
        shots,
      };
    });

    return {
      act_number: actIndex + 1,
      act_title:
        typeof actSource?.act_title === 'string' && actSource.act_title.trim()
          ? actSource.act_title.trim()
          : fallbackAct.act_title,
      act_purpose:
        typeof actSource?.act_purpose === 'string' && actSource.act_purpose.trim()
          ? actSource.act_purpose.trim()
          : fallbackAct.act_purpose,
      scenes,
    };
  });

  return {
    title:
      typeof source.title === 'string' && source.title.trim() ? source.title.trim() : fallback.title,
    logline:
      typeof source.logline === 'string' && source.logline.trim() ? source.logline.trim() : fallback.logline,
    style_note:
      typeof source.style_note === 'string' && source.style_note.trim()
        ? source.style_note.trim()
        : fallback.style_note,
    acts,
  };
}

function tryParseJson(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    return match ? JSON.parse(match[0]) : null;
  }
}

async function generateWithModel(prompt: string) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error('Missing GEMINI_API_KEY in .env.local');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.8,
    },
  });

  const instruction = `
You are The Auto-Director, a cinematic multi-agent pipeline.

You must internally simulate these roles:
1. Screenwriter: turn the seed idea into a coherent 3-act narrative.
2. Cinematographer: for each act, create exactly 3 scenes; for each scene, create exactly 3 shots.
3. Visual Artist: for each shot, provide a vivid visual prompt suitable for an image generator.

Rules:
- Return valid JSON only.
- Create exactly 3 acts.
- Each act must contain exactly 3 scenes.
- Each scene must contain exactly 3 shots.
- Every shot must include framing, description, visual_prompt, mood, and color_palette.
- Keep descriptions concise but cinematic.
- Keep the story coherent from setup to conflict to resolution.
- The output is for a vertical cinematic feed UI.

Return this exact shape:
{
  "title": "string",
  "logline": "string",
  "style_note": "string",
  "acts": [
    {
      "act_number": 1,
      "act_title": "string",
      "act_purpose": "string",
      "scenes": [
        {
          "scene_number": 1,
          "scene_title": "string",
          "summary": "string",
          "location": "string",
          "time_of_day": "string",
          "shots": [
            {
              "shot_number": 1,
              "shot_title": "string",
              "framing": "string",
              "description": "string",
              "visual_prompt": "string",
              "mood": "string",
              "color_palette": "string"
            }
          ]
        }
      ]
    }
  ]
}`.trim();

  const result = await model.generateContent(`${instruction}\n\nSeed idea: ${prompt}`);
  const parsed = tryParseJson(result.response.text());

  if (!parsed) {
    throw new Error('Gemini returned invalid JSON.');
  }

  return parsed;
}

function buildUnsplashQueries(query: string) {
  const normalized = query.replace(/[^\w\s-]/g, ' ').replace(/\s+/g, ' ').trim();
  const words = normalized.split(' ').filter(Boolean);
  const short = words.slice(0, 8).join(' ');
  const broad = words
    .filter((word) => word.length > 3)
    .slice(0, 4)
    .join(' ');

  return [normalized, short, broad].filter((value, index, array) => value && array.indexOf(value) === index);
}

async function fetchUnsplashImage(query: string, fallbackAlt: string) {
  const accessKey = process.env.UNSPLASH_ACCESS_KEY;

  if (!accessKey) {
    throw new Error('Missing UNSPLASH_ACCESS_KEY in .env.local');
  }

  for (const candidate of buildUnsplashQueries(query)) {
    const endpoint = new URL('https://api.unsplash.com/search/photos');
    endpoint.searchParams.set('query', candidate);
    endpoint.searchParams.set('page', '1');
    endpoint.searchParams.set('per_page', '5');
    endpoint.searchParams.set('orientation', 'landscape');
    endpoint.searchParams.set('content_filter', 'high');

    const response = await fetch(endpoint.toString(), {
      headers: {
        Authorization: `Client-ID ${accessKey}`,
        'Accept-Version': 'v1',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      const details = await response.text();
      throw new Error(`Unsplash request failed (${response.status}): ${details}`);
    }

    const data = (await response.json()) as UnsplashSearchResponse;
    const results: UnsplashPhoto[] = Array.isArray(data?.results) ? data.results : [];
    const first = results.find((item: UnsplashPhoto) => item?.urls?.regular);

    if (!first?.urls?.regular) {
      continue;
    }

    const photographer = first.user?.name ?? 'Unsplash';
    const profile = first.user?.links?.html
      ? `${first.user.links.html}${first.user.links.html.includes('?') ? '&' : '?'}utm_source=auto_director&utm_medium=referral`
      : 'https://unsplash.com/?utm_source=auto_director&utm_medium=referral';

    return {
      image_url: first.urls.regular as string,
      image_alt: (first.alt_description as string) || fallbackAlt,
      image_credit_name: photographer,
      image_credit_url: profile,
    };
  }

  return {
    image_url: '',
    image_alt: fallbackAlt,
    image_credit_name: '',
    image_credit_url: '',
  };
}

async function attachUnsplashImages(storyboard: Storyboard) {
  const acts = await Promise.all(
    storyboard.acts.map(async (act) => {
      const scenes = await Promise.all(
        act.scenes.map(async (scene) => {
          const shots = await Promise.all(
            scene.shots.map(async (shot) => {
              const image = await fetchUnsplashImage(
                `${scene.scene_title} ${scene.location} ${shot.mood} ${shot.framing} ${shot.visual_prompt}`,
                `${scene.scene_title} - ${shot.shot_title}`,
              );

              return {
                ...shot,
                ...image,
              };
            }),
          );

          return {
            ...scene,
            shots,
          };
        }),
      );

      return {
        ...act,
        scenes,
      };
    }),
  );

  return {
    ...storyboard,
    acts,
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const prompt = typeof body?.prompt === 'string' ? body.prompt.trim() : '';

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required.' }, { status: 400 });
    }

    let storyboard = buildFallbackStoryboard(prompt);
    let generationSource: GenerationResponse['generation_source'] = 'fallback';

    try {
      const modelOutput = await generateWithModel(prompt);
      storyboard = normalizeStoryboard(modelOutput, prompt);
      generationSource = 'gemini';
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      if (!message) {
        throw error;
      }
    }

    const storyboardWithImages = await attachUnsplashImages(storyboard);

    const response: GenerationResponse = {
      status: 'success',
      storyboard: storyboardWithImages,
      generation_source: generationSource,
      image_source: 'unsplash',
    };

    return NextResponse.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected server error.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
