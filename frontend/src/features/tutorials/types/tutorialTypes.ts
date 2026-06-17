import type { RefObject } from "react";

export type TutorialId = string;

export type TutorialTargetRef = RefObject<HTMLElement | null> | RefObject<Element | null>;

export interface TutorialStep {
  id: string;
  title: string;
  description: string;
  targetRef: TutorialTargetRef;
  allowTargetInteraction?: boolean;
  requireActionToAdvance?: boolean;
  centered?: boolean;
  noHighlight?: boolean;
  imageSrc?: string;
}

export interface TutorialStepDefinition {
  id: string;
  title: string;
  description: string;
  targetKey: string;
  allowTargetInteraction?: boolean;
  requireActionToAdvance?: boolean;
  centered?: boolean;
  noHighlight?: boolean;
  imageSrc?: string;
}

export interface TutorialDefinition<TId extends TutorialId = TutorialId> {
  id: TId;
  steps: TutorialStepDefinition[];
}
