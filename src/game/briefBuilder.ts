import type {
  ChoiceRecord,
  MissionBriefReport,
  MissionCompletionStatus,
  MissionLevel,
  ResourceComparisonRow,
  Resources,
} from './types';
import {
  ALL_RESOURCE_KEYS,
  RESOURCE_LABELS,
  getResourceHealth,
  getWarningResources,
  hasExhaustedResource,
} from './resourceEngine';
import { resolveScienceFacts } from '../science/scienceFacts';

export function buildMissionBrief(
  level: MissionLevel,
  finalResources: Resources,
  choiceHistory: ChoiceRecord[]
): MissionBriefReport {
  const isStabilizationProtocol = hasExhaustedResource(finalResources);
  const warnings = getWarningResources(finalResources);

  let status: MissionCompletionStatus = 'Mission Reviewed';
  if (isStabilizationProtocol) {
    status = 'Crew Stabilized';
  } else if (warnings.length > 0) {
    status = 'Support Needed';
  }

  const resourceComparisons: ResourceComparisonRow[] = ALL_RESOURCE_KEYS.map((key) => {
    const before = level.initialResources[key];
    const after = finalResources[key];
    return {
      key,
      label: RESOURCE_LABELS[key].label,
      before,
      after,
      delta: after - before,
      health: getResourceHealth(after),
    };
  });

  const collectedFactIds: string[] = [...level.briefScienceFactIds];
  for (const record of choiceHistory) {
    collectedFactIds.push(...record.scienceFactIds);
  }
  const scienceFacts = resolveScienceFacts(collectedFactIds).slice(0, 3);

  const avgResourceHealth =
    ALL_RESOURCE_KEYS.reduce((acc, k) => acc + finalResources[k], 0) / ALL_RESOURCE_KEYS.length;
  const optimalChoicesCount = choiceHistory.filter((c) =>
    level.events
      .find((e) => e.id === c.eventId)
      ?.choices.find((opt) => opt.id === c.choiceId)?.isOptimalHint
  ).length;

  const planningScore = Math.max(
    100,
    Math.min(1000, Math.round(avgResourceHealth * 8 + optimalChoicesCount * 65))
  );

  const headlineMessage = isStabilizationProtocol
    ? 'Our support team helped secure the base. Let’s review how we could respond earlier.'
    : warnings.length > 0
    ? `Mission complete! ${warnings.map((w) => RESOURCE_LABELS[w].label).join(', ')} dipped below 30 — review the trade-offs below to strengthen your next run.`
    : level.pipClosing;

  const tryNextTime = isStabilizationProtocol
    ? `Watch ${warnings.map((w) => RESOURCE_LABELS[w].label).join(' and ')} when it drops below 30, and pick a conserving option before it reaches 0.`
    : level.briefTryNextTime;

  return {
    levelId: level.id,
    levelNumber: level.levelNumber,
    missionTitle: level.title,
    status,
    isStabilizationProtocol,
    headlineMessage,
    pipClosingMessage: level.pipClosing,
    initialResources: { ...level.initialResources },
    finalResources: { ...finalResources },
    resourceComparisons,
    choiceHistory: [...choiceHistory],
    scienceFacts,
    tryNextTime,
    planningScore,
  };
}