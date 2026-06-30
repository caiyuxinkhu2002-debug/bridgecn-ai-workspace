import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useWorkspace, type KnowledgeBase } from "@/lib/workspace-context";
import { Sparkles, ArrowRight, ArrowLeft, Loader2, CheckCircle2, Plus, X, Wand2 } from "lucide-react";
import { BUILDER_STEPS, BUILDER_STEP_KEY, type BuilderStep } from "@/lib/ai/project-builder";
import { extractKnowledgeFromWebsite } from "@/lib/ai/extract-knowledge.functions";
import { useServerFn } from "@tanstack/react-start";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/_app/start")({
  head: () => ({
    meta: [
      { title: "Start Your China Expansion — BridgeCN AI" },
      {
        name: "description",
        content:
          "Tell BridgeCN AI about your business and expansion goals. AI will generate a complete China market entry strategy.",
      },
    ],
  }),
  component: StartPage,
});

const targetMarkets = [
  "Mainland · Tier 1",
  "Mainland · Tier 1.5",
  "Mainland · Tier 2",
  "Hong Kong",
  "Taiwan",
];

function StartPage() {
  const router = useRouter();
  const { createProject, workspaceId } = useWorkspace();
  const t = useT();
  const extract = useServerFn(extractKnowledgeFromWebsite);

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [name, setName] = useState("");
  const [website, setWebsite] = useState("");
  const [targetMarket, setTargetMarket] = useState(targetMarkets[0]);

  // Builder progress
  const [activeStep, setActiveStep] = useState<BuilderStep | null>(null);
  const [doneSteps, setDoneSteps] = useState<BuilderStep[]>([]);
  const cancelledRef = useRef(false);

  // KB draft (step 3)
  const [kb, setKb] = useState<KnowledgeBase>({});
  const [saving, setSaving] = useState(false);

  function startBuild() {
    if (!name.trim() && !website.trim()) {
      toast.error(t("start.toast.needInput"));
      return;
    }
    if (!workspaceId) { toast.error(t("start.toast.noWorkspace")); return; }
    cancelledRef.current = false;
    setStep(2);
    setActiveStep(BUILDER_STEPS[0]);
    setDoneSteps([]);

    // Kick off the real extraction in parallel with the visual pipeline.
    const extractionPromise = extract({
      data: { brandName: name.trim(), website: website.trim(), targetMarket },
    }).catch((err: unknown) => {
      console.error("[builder] extraction failed", err);
      return null;
    });

    // Visual pipeline: tick through steps. Hold on the last "active" step
    // until the network call resolves so progress reflects reality.
    let i = 0;
    const tick = async () => {
      if (cancelledRef.current) return;
      const s = BUILDER_STEPS[i];
      setActiveStep(s);
      setDoneSteps((d) => (d.includes(s) ? d : [...d, s]));
      i += 1;
      if (i < BUILDER_STEPS.length - 1) {
        setTimeout(tick, 700 + Math.random() * 400);
      } else {
        // Wait for the real call, then complete.
        const ext = await extractionPromise;
        if (cancelledRef.current) return;
        const finalStep = BUILDER_STEPS[BUILDER_STEPS.length - 1];
        setActiveStep(finalStep);
        setDoneSteps((d) => (d.includes(finalStep) ? d : [...d, finalStep]));

        if (!ext) {
          // Network/AI failed — keep what the user typed and let them edit.
          setKb({
            company: name || undefined,
            website: website || undefined,
            products: [], brandTone: [], keywords: [], competitors: [], socialChannels: [],
          });
          toast.error(t("start.toast.extractFailed") || "Could not read the website. You can fill in the details manually.");
        } else {
          // Drop fields not part of KnowledgeBase (e.g. brandPositioning,
          // _confidence) but fold positioning into the brand story.
          const story = [ext.brandPositioning, ext.brandStory].filter(Boolean).join("\n\n").trim();
          const merged: KnowledgeBase = {
            company: ext.company,
            industry: ext.industry,
            category: ext.category,
            products: ext.products || [],
            brandStory: story,
            brandTone: ext.brandTone || [],
            keywords: ext.keywords || [],
            competitors: ext.competitors || [],
            targetAudience: ext.targetAudience,
            koreanCopy: ext.koreanCopy,
            website: ext.website || website,
            socialChannels: ext.socialChannels || [],
          };
          setKb(merged);
        }
        setTimeout(() => { if (!cancelledRef.current) setStep(3); }, 350);
      }
    };
    setTimeout(tick, 250);
  }

  function cancelBuild() {
    cancelledRef.current = true;
    setStep(1);
    setActiveStep(null);
    setDoneSteps([]);
  }

  async function saveProject() {
    if (!workspaceId) { toast.error(t("start.toast.noWorkspace")); return; }
    setSaving(true);
    try {
      const created = await createProject({
        name: kb.company || name || website,
        industry: kb.industry,
        targetMarket,
        description: kb.brandStory,
        website: kb.website || website,
        knowledgeBase: kb,
      });
      if (!created) { toast.error(t("start.toast.createFailed")); return; }
      toast.success(t("start.toast.created"));
      router.navigate({ to: "/projects/$projectId", params: { projectId: created.id } });
    } catch (e) {
      console.error(e);
      toast.error(t("start.toast.createFailed"));
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => () => { cancelledRef.current = true; }, []);

  return (
    <div className="mx-auto max-w-3xl py-6 md:py-12">
      <div className="text-center">
        <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--background)] px-3 py-1 text-xs font-medium text-[var(--muted-foreground)]">
          <Sparkles className="h-3.5 w-3.5 text-[var(--primary)]" />
          {t("start.badge", { n: step })}
        </div>
        <h1 className="mt-6 text-4xl font-semibold tracking-[-0.025em] md:text-5xl">
          {step === 1 && t("start.title.1")}
          {step === 2 && t("start.title.2")}
          {step === 3 && t("start.title.3")}
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-[var(--muted-foreground)]">
          {step === 1 && t("start.sub.1")}
          {step === 2 && t("start.sub.2")}
          {step === 3 && t("start.sub.3")}
        </p>
      </div>

      {step === 1 && (
        <StepOne
          name={name} setName={setName}
          website={website} setWebsite={setWebsite}
          targetMarket={targetMarket} setTargetMarket={setTargetMarket}
          onSubmit={startBuild}
        />
      )}

      {step === 2 && (
        <StepTwo activeStep={activeStep} doneSteps={doneSteps} onCancel={cancelBuild} />
      )}

      {step === 3 && (
        <StepThree
          kb={kb} setKb={setKb}
          saving={saving}
          onBack={() => setStep(1)}
          onSave={saveProject}
        />
      )}
    </div>
  );
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-3 text-xs font-medium uppercase tracking-wider text-[var(--muted-foreground)]">
        {label}
      </div>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-sm font-medium transition-all ${
        active
          ? "border-[var(--foreground)] bg-[var(--foreground)] text-[var(--background)]"
          : "border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] hover:bg-[var(--muted)]"
      }`}
    >
      {children}
    </button>
  );
}

// ============= Step 1 =============
function StepOne(props: {
  name: string; setName: (v: string) => void;
  website: string; setWebsite: (v: string) => void;
  targetMarket: string; setTargetMarket: (v: string) => void;
  onSubmit: () => void;
}) {
  const { name, setName, website, setWebsite, targetMarket, setTargetMarket, onSubmit } = props;
  const t = useT();
  const ready = name.trim().length > 0 || website.trim().length > 0;
  return (
    <>
      <div className="mt-10">
        <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-[var(--muted-foreground)]">{t("start.field.brandName")}</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("start.field.brandName.placeholder")}
          maxLength={120}
          className="block w-full rounded-2xl border border-[var(--border)] bg-[var(--background)] px-5 py-4 text-[15px] text-[var(--foreground)] shadow-[var(--shadow-card)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-4 focus:ring-[var(--primary-soft)]"
        />
      </div>
      <div className="mt-6">
        <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-[var(--muted-foreground)]">{t("start.field.website")}</label>
        <input
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          placeholder={t("start.field.website.placeholder")}
          maxLength={300}
          className="block w-full rounded-2xl border border-[var(--border)] bg-[var(--background)] px-5 py-4 text-[15px] text-[var(--foreground)] shadow-[var(--shadow-card)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-4 focus:ring-[var(--primary-soft)]"
        />
        <p className="mt-2 text-xs text-[var(--muted-foreground)]">{t("start.field.either")}</p>
      </div>
      <div className="mt-10">
        <Group label={t("start.field.targetMarket")}>
          {targetMarkets.map((m) => (
            <Chip key={m} active={targetMarket === m} onClick={() => setTargetMarket(m)}>{m}</Chip>
          ))}
        </Group>
      </div>
      <div className="mt-12 flex flex-col items-center gap-3">
        <button
          type="button"
          onClick={onSubmit}
          disabled={!ready}
          className="group inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[var(--foreground)] px-6 text-sm font-medium text-[var(--background)] shadow-[var(--shadow-card)] transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:px-8"
        >
          <Wand2 className="h-4 w-4" />
          {t("start.cta.build")}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </button>
      </div>
    </>
  );
}

// ============= Step 2 =============
function StepTwo({ activeStep, doneSteps, onCancel }: { activeStep: BuilderStep | null; doneSteps: BuilderStep[]; onCancel: () => void }) {
  const t = useT();
  return (
    <div className="mt-10 rounded-2xl border border-[var(--border)] bg-[var(--background)] p-6 shadow-[var(--shadow-card)]">
      <ol className="space-y-3">
        {BUILDER_STEPS.map((s) => {
          const done = doneSteps.includes(s) && s !== activeStep;
          const active = s === activeStep;
          const pending = !done && !active;
          return (
            <li key={s} className="flex items-center gap-3 text-sm">
              {done ? (
                <CheckCircle2 className="h-4 w-4 text-[var(--primary)]" />
              ) : active ? (
                <Loader2 className="h-4 w-4 animate-spin text-[var(--primary)]" />
              ) : (
                <div className="h-4 w-4 rounded-full border border-[var(--border)]" />
              )}
              <span className={pending ? "text-[var(--muted-foreground)]" : "text-[var(--foreground)]"}>
                {t(BUILDER_STEP_KEY[s])}
              </span>
            </li>
          );
        })}
      </ol>
      <div className="mt-6 flex justify-end">
        <button onClick={onCancel} className="rounded-md border border-[var(--border)] px-3 py-1.5 text-xs font-medium hover:bg-[var(--muted)]">
          {t("start.cta.cancel")}
        </button>
      </div>
    </div>
  );
}

// ============= Step 3 =============
function StepThree(props: { kb: KnowledgeBase; setKb: (v: KnowledgeBase) => void; saving: boolean; onBack: () => void; onSave: () => void }) {
  const { kb, setKb, saving, onBack, onSave } = props;
  const t = useT();
  const set = <K extends keyof KnowledgeBase>(k: K, v: KnowledgeBase[K]) => setKb({ ...kb, [k]: v });
  return (
    <div className="mt-10 space-y-6">
      <Section title={t("kb.section.brand")}>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label={t("kb.field.company")} value={kb.company || ""} onChange={(v) => set("company", v)} />
          <TextField label={t("kb.field.industry")} value={kb.industry || ""} onChange={(v) => set("industry", v)} />
          <TextField label={t("kb.field.category")} value={kb.category || ""} onChange={(v) => set("category", v)} />
          <TextField label={t("kb.field.website")} value={kb.website || ""} onChange={(v) => set("website", v)} />
        </div>
      </Section>

      <Section title={t("kb.section.products")}>
        <ListEditor items={kb.products || []} onChange={(v) => set("products", v)} placeholder={t("kb.add.product")} />
      </Section>

      <Section title={t("kb.section.story")}>
        <TextArea value={kb.brandStory || ""} onChange={(v) => set("brandStory", v)} rows={5} />
      </Section>

      <Section title={t("kb.section.tone")}>
        <ListEditor items={kb.brandTone || []} onChange={(v) => set("brandTone", v)} placeholder={t("kb.add.tone")} />
      </Section>

      <Section title={t("kb.section.keywords")}>
        <ListEditor items={kb.keywords || []} onChange={(v) => set("keywords", v)} placeholder={t("kb.add.keyword")} />
      </Section>

      <Section title={t("kb.section.competitors")}>
        <ListEditor items={kb.competitors || []} onChange={(v) => set("competitors", v)} placeholder={t("kb.add.competitor")} />
      </Section>

      <Section title={t("kb.section.audience")}>
        <TextArea value={kb.targetAudience || ""} onChange={(v) => set("targetAudience", v)} rows={3} />
      </Section>

      <Section title={t("kb.section.koreanCopy")}>
        <TextArea value={kb.koreanCopy || ""} onChange={(v) => set("koreanCopy", v)} rows={3} />
      </Section>

      <Section title={t("kb.section.channels")}>
        <ChannelEditor items={kb.socialChannels || []} onChange={(v) => set("socialChannels", v)} />
      </Section>

      <div className="flex items-center justify-between gap-3 pt-2">
        <button onClick={onBack} className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] px-4 py-2 text-xs font-medium hover:bg-[var(--muted)]">
          <ArrowLeft className="h-3.5 w-3.5" /> {t("common.back")}
        </button>
        <button
          onClick={onSave}
          disabled={saving}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[var(--foreground)] px-6 text-sm font-medium text-[var(--background)] shadow-[var(--shadow-card)] hover:-translate-y-0.5 transition-transform disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
          {t("start.cta.save")}
        </button>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-6 shadow-[var(--shadow-card)]">
      <h3 className="mb-4 text-sm font-semibold">{title}</h3>
      {children}
    </div>
  );
}

function TextField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-[var(--muted-foreground)]">{label}</span>
      <input value={value} onChange={(e) => onChange(e.target.value)} className="h-9 w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-2 text-sm" />
    </label>
  );
}

function TextArea({ value, onChange, rows = 4 }: { value: string; onChange: (v: string) => void; rows?: number }) {
  return (
    <textarea value={value} rows={rows} onChange={(e) => onChange(e.target.value)} className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] p-2 text-sm leading-relaxed" />
  );
}

function ListEditor({ items, onChange, placeholder }: { items: string[]; onChange: (v: string[]) => void; placeholder: string }) {
  const t = useT();
  const [draft, setDraft] = useState("");
  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {items.map((it, i) => (
          <span key={`${it}-${i}`} className="inline-flex items-center gap-1.5 rounded-full bg-[var(--muted)] px-3 py-1 text-xs">
            {it}
            <button onClick={() => onChange(items.filter((_, idx) => idx !== i))} className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
      </div>
      <div className="mt-3 flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && draft.trim()) { onChange([...items, draft.trim()]); setDraft(""); } }}
          placeholder={placeholder}
          className="h-9 flex-1 rounded-md border border-[var(--border)] bg-[var(--background)] px-2 text-sm"
        />
        <button
          onClick={() => { if (draft.trim()) { onChange([...items, draft.trim()]); setDraft(""); } }}
          className="inline-flex items-center gap-1 rounded-md border border-[var(--border)] px-3 text-xs font-medium hover:bg-[var(--muted)]"
        >
          <Plus className="h-3.5 w-3.5" /> {t("kb.add.button")}
        </button>
      </div>
    </div>
  );
}

function ChannelEditor({ items, onChange }: { items: { label: string; url: string }[]; onChange: (v: { label: string; url: string }[]) => void }) {
  const t = useT();
  const update = (i: number, patch: Partial<{ label: string; url: string }>) =>
    onChange(items.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));
  return (
    <div className="space-y-2">
      {items.map((c, i) => (
        <div key={i} className="flex gap-2">
          <input value={c.label} onChange={(e) => update(i, { label: e.target.value })} placeholder={t("kb.add.channelLabel")} className="h-9 w-40 rounded-md border border-[var(--border)] bg-[var(--background)] px-2 text-sm" />
          <input value={c.url} onChange={(e) => update(i, { url: e.target.value })} placeholder="https://" className="h-9 flex-1 rounded-md border border-[var(--border)] bg-[var(--background)] px-2 text-sm" />
          <button onClick={() => onChange(items.filter((_, idx) => idx !== i))} className="rounded-md border border-[var(--border)] px-2 text-xs hover:bg-[var(--muted)]">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
      <button onClick={() => onChange([...items, { label: "", url: "" }])} className="inline-flex items-center gap-1 rounded-md border border-[var(--border)] px-3 py-1.5 text-xs font-medium hover:bg-[var(--muted)]">
        <Plus className="h-3.5 w-3.5" /> {t("kb.add.channel")}
      </button>
    </div>
  );
}
