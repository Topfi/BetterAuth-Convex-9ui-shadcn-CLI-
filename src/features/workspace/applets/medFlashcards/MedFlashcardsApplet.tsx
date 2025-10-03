import { useState } from "react";

type CardStatus = "unseen" | "review" | "confident";

type Flashcard = {
  prompt: string;
  answer: string;
  hint: string;
};

const MED_FLASHCARDS: Flashcard[] = [
  {
    prompt:
      "A 24-year-old presents with fever, stiff neck, and photophobia. What is the first diagnostic step?",
    answer:
      "Collect cerebrospinal fluid via lumbar puncture after ruling out elevated ICP with imaging if indicated.",
    hint: "Think about confirming meningitis safely before treatment.",
  },
  {
    prompt:
      "During systole, which heart valve prevents regurgitation from the aorta into the left ventricle?",
    answer:
      "The aortic semilunar valve closes to prevent blood from flowing backward into the left ventricle.",
    hint: "It sits between the left ventricle and the aorta.",
  },
  {
    prompt: "Which cranial nerve innervates the lateral rectus muscle?",
    answer:
      "Cranial nerve VI, the abducens nerve, innervates the lateral rectus muscle.",
    hint: "LR6, SO4, all the rest are III.",
  },
  {
    prompt:
      "What is the hallmark laboratory finding for diabetic ketoacidosis?",
    answer:
      "An elevated anion gap metabolic acidosis with positive serum or urine ketones.",
    hint: "Look for a metabolic imbalance tied to ketone bodies.",
  },
  {
    prompt: "Name the antidote for acetaminophen toxicity.",
    answer:
      "Administer N-acetylcysteine to replenish glutathione and detoxify NAPQI.",
    hint: "It replenishes glutathione stores.",
  },
];

export function MedFlashcardsApplet() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [statuses, setStatuses] = useState<CardStatus[]>(() =>
    MED_FLASHCARDS.map(() => "unseen"),
  );

  const currentCard = MED_FLASHCARDS[currentIndex];

  const reviewCount = statuses.filter((status) => status === "review").length;
  const confidentCount = statuses.filter(
    (status) => status === "confident",
  ).length;

  const cycleCard = () => {
    setShowAnswer(false);
    setCurrentIndex((value) => (value + 1) % MED_FLASHCARDS.length);
  };

  const markCard = (status: CardStatus) => {
    setStatuses((prev) => {
      const next = [...prev];
      next[currentIndex] = status;
      return next;
    });
    cycleCard();
  };

  return (
    <div className="flex h-full flex-col gap-4 p-4 text-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-col">
          <h2 className="text-base font-semibold">Med Flashcards</h2>
          <p className="text-muted-foreground">
            Rapid recall for high-yield clinical pearls.
          </p>
        </div>
        <div className="flex gap-3 text-xs" aria-live="polite">
          <span className="rounded-md bg-muted px-2 py-1 font-medium">
            Review: {reviewCount}
          </span>
          <span className="rounded-md bg-muted px-2 py-1 font-medium">
            Confident: {confidentCount}
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 rounded-md border p-4">
        <p className="font-medium" aria-live="polite">
          {currentCard.prompt}
        </p>
        <p className="text-xs text-muted-foreground">
          Hint: {currentCard.hint}
        </p>
        {showAnswer ? (
          <p
            className="rounded-md bg-muted px-3 py-2 text-sm"
            aria-live="polite"
          >
            {currentCard.answer}
          </p>
        ) : (
          <button
            type="button"
            className="self-start rounded-md border px-3 py-1 text-xs font-medium transition hover:bg-muted"
            onClick={() => setShowAnswer(true)}
          >
            Reveal answer
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="rounded-md border px-3 py-1 text-xs font-medium transition hover:bg-muted"
          onClick={() => markCard("review")}
        >
          Needs review
        </button>
        <button
          type="button"
          className="rounded-md border px-3 py-1 text-xs font-medium transition hover:bg-muted"
          onClick={() => markCard("confident")}
        >
          Nailed it
        </button>
        <button
          type="button"
          className="rounded-md border px-3 py-1 text-xs font-medium transition hover:bg-muted"
          onClick={cycleCard}
        >
          Skip
        </button>
      </div>
    </div>
  );
}
