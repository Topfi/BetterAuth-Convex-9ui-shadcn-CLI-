import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const FLASHCARDS = [
  {
    id: "cardiology-preload",
    prompt:
      "What happens to stroke volume when preload increases in a healthy heart?",
    answer:
      "Stroke volume rises because of the Frank-Starling mechanism: increased preload stretches sarcomeres, enhancing contractility until the plateau.",
    tag: "Cardiology",
    insight: "Pair with pressure-volume loops for exam visuals.",
  },
  {
    id: "pharm-half-life",
    prompt:
      "How many half-lives are required for a medication to reach >95% steady state?",
    answer:
      "About 5 half-lives. Each half-life halves the remaining gap to steady state.",
    tag: "Pharmacology",
    insight: "Useful when timing antibiotic loading doses.",
  },
  {
    id: "neuro-tract",
    prompt: "Where do dorsal column fibers decussate?",
    answer:
      "They cross in the caudal medulla as internal arcuate fibers before forming the medial lemniscus.",
    tag: "Neuroscience",
    insight:
      "Sketch it next to the spinothalamic tract to highlight differences.",
  },
  {
    id: "micro-code-switch",
    prompt:
      "When you see green colonies on TCBS agar, what pathogen should you consider?",
    answer:
      "Vibrio parahaemolyticus—contrast with yellow V. cholerae colonies on the same medium.",
    tag: "Microbiology",
    insight: "Remember: green = parahaemolyticus, yellow = cholerae.",
  },
  {
    id: "respiratory-abg",
    prompt: "Which primary disturbance fits pH 7.52, PaCO₂ 28, HCO₃⁻ 23?",
    answer:
      "Acute respiratory alkalosis. Elevated pH with low CO₂ and near-normal bicarbonate means minimal renal compensation so far.",
    tag: "Pulmonology",
    insight: "Think panic attack or early high-altitude ascent in stems.",
  },
] as const;

type FlashcardConfidence = "unseen" | "review" | "known";

const INITIAL_CONFIDENCE: Record<string, FlashcardConfidence> =
  FLASHCARDS.reduce(
    (accumulator, card) => {
      accumulator[card.id] = "unseen";
      return accumulator;
    },
    {} as Record<string, FlashcardConfidence>,
  );

const shuffleOrder = (items: readonly string[]) => {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
};

export function MedFlashcardsApplet() {
  const [order, setOrder] = useState<string[]>(() =>
    FLASHCARDS.map((card) => card.id),
  );
  const [position, setPosition] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);
  const [confidence, setConfidence] =
    useState<Record<string, FlashcardConfidence>>(INITIAL_CONFIDENCE);

  const currentCardId = order[position];
  const currentCard =
    FLASHCARDS.find((card) => card.id === currentCardId) ?? FLASHCARDS[0];

  const confidenceValues = Object.values(confidence);
  const progress = {
    known: confidenceValues.filter((value) => value === "known").length,
    review: confidenceValues.filter((value) => value === "review").length,
    unseen: confidenceValues.filter((value) => value === "unseen").length,
  };
  const completion =
    FLASHCARDS.length === 0
      ? 0
      : Math.round((progress.known / FLASHCARDS.length) * 100);

  const queuePreview = order
    .slice(position + 1)
    .concat(order.slice(0, position))
    .slice(0, 3);

  const updatePosition = (next: number) => {
    if (order.length === 0) return;
    const safeNext = (next + order.length) % order.length;
    setPosition(safeNext);
    setIsRevealed(false);
  };

  const handleMark = (state: FlashcardConfidence) => {
    const cardId = currentCard.id;
    setConfidence((current) => ({
      ...current,
      [cardId]: state,
    }));
    updatePosition(position + 1);
  };

  const handleShuffle = () => {
    setOrder((current) => shuffleOrder(current));
    setPosition(0);
    setIsRevealed(false);
  };

  const handleReveal = () => {
    setIsRevealed((current) => !current);
  };

  const handleJump = (cardId: string) => {
    const nextIndex = order.indexOf(cardId);
    if (nextIndex === -1) return;
    setPosition(nextIndex);
    setIsRevealed(false);
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-4">
        <CardTitle>Med School Flashcards</CardTitle>
        <CardDescription>
          Keep core systems sharp with fast prompts that fit between rounds or
          coding lab.
        </CardDescription>
        <div className="flex flex-wrap gap-2 pt-2 text-xs">
          <Badge variant={progress.known > 0 ? "success" : "outline"}>
            {progress.known} confident
          </Badge>
          <Badge variant={progress.review > 0 ? "info" : "secondary"}>
            {progress.review} on review
          </Badge>
          <Badge variant="outline">{progress.unseen} unseen</Badge>
        </div>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-4 overflow-auto">
        <section className="rounded-lg border p-4" aria-live="polite">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Current
              </p>
              <p className="text-lg font-semibold leading-snug">
                {currentCard.prompt}
              </p>
              <div className="mt-2 flex flex-wrap gap-2 text-xs">
                <Badge variant="secondary">{currentCard.tag}</Badge>
                <Badge variant="outline">
                  Card {position + 1} of {order.length}
                </Badge>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleShuffle}
            >
              Shuffle deck
            </Button>
          </div>
          <Separator className="my-4" />
          {isRevealed ? (
            <div>
              <p className="font-medium">Key answer</p>
              <p className="mt-1 text-sm leading-relaxed">
                {currentCard.answer}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                {currentCard.insight}
              </p>
            </div>
          ) : (
            <div className="rounded-md bg-muted/60 p-3 text-sm">
              Peek when you are ready—try recalling the mechanism first.
            </div>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            <Button type="button" onClick={handleReveal}>
              {isRevealed ? "Hide answer" : "Reveal answer"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => updatePosition(position - 1)}
            >
              Previous
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => updatePosition(position + 1)}
            >
              Next
            </Button>
          </div>
        </section>

        <section
          className="grid gap-3 rounded-lg border p-4"
          aria-label="Confidence tracker"
        >
          <div className="flex flex-wrap items-center gap-3">
            <p className="font-medium text-sm">How did that feel?</p>
            <Badge variant="outline">{completion}% mastery</Badge>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={() => handleMark("known")}>
              Nailed it
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => handleMark("review")}
            >
              Need to review
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => handleMark("unseen")}
            >
              Reset card
            </Button>
          </div>
        </section>

        <section className="rounded-lg border p-4" aria-label="Upcoming cards">
          <p className="text-sm font-medium">Queue preview</p>
          {queuePreview.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Deck complete—shuffle to keep momentum.
            </p>
          ) : (
            <ul className="mt-3 space-y-2 text-sm">
              {queuePreview.map((cardId) => {
                const card = FLASHCARDS.find((item) => item.id === cardId);
                if (!card) return null;
                const cardConfidence = confidence[card.id];
                return (
                  <li key={card.id}>
                    <button
                      type="button"
                      onClick={() => handleJump(card.id)}
                      className="hover:bg-muted/70 focus-visible:ring-ring/40 focus-visible:outline-none focus-visible:ring-2 w-full rounded-md border p-3 text-left transition"
                    >
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <Badge variant="outline">{card.tag}</Badge>
                        <span className="text-muted-foreground capitalize">
                          {cardConfidence}
                        </span>
                      </div>
                      <p className="mt-2 font-medium">{card.prompt}</p>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </CardContent>

      <CardFooter className="flex justify-between gap-4 text-xs text-muted-foreground">
        <span>
          Tip: blend these with Anki intervals—log confident cards as "easy" to
          stretch spacing.
        </span>
        <span aria-live="polite">
          {progress.known} / {FLASHCARDS.length} mastered
        </span>
      </CardFooter>
    </Card>
  );
}
