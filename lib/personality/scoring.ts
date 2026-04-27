/**
 * 人格测评评分算法
 *
 * 大五人格：5 维度，每维度 10 题，5 点量表
 * ECR-R：2 维度（焦虑/回避），每维度 18 题，7 点量表
 * 瑞文推理：16 题，每题 1 分
 */

import { BIG_FIVE_QUESTIONS, ECRR_QUESTIONS, RAVEN_QUESTIONS } from './questions';
import type { BigFiveFactor } from './questions';

// ─── 大五人格评分 ───

export interface BigFiveScores {
  extraversion: number;
  agreeableness: number;
  conscientiousness: number;
  neuroticism: number;
  openness: number;
}

/** 将 1-5 原始分映射到 0-100 */
function scaleTo100(raw: number, min: number, max: number): number {
  if (max === min) return 50;
  return Math.round(((raw - min) / (max - min)) * 100);
}

export function scoreBigFive(answers: Record<number, number>): BigFiveScores {
  const factors: BigFiveFactor[] = ['extraversion', 'agreeableness', 'conscientiousness', 'neuroticism', 'openness'];
  const rawScores: Record<string, number> = {};

  for (const factor of factors) {
    const items = BIG_FIVE_QUESTIONS.filter((q) => q.factor === factor);
    let sum = 0;
    for (const item of items) {
      const answer = answers[item.id] ?? 3; // 默认中间值
      if (item.reverse) {
        sum += 6 - answer; // 反向计分: 1→5, 2→4, 3→3, 4→2, 5→1
      } else {
        sum += answer;
      }
    }
    const avg = sum / items.length; // 1-5
    rawScores[factor] = avg;
  }

  return {
    extraversion: scaleTo100(rawScores.extraversion - 1, 0, 4),
    agreeableness: scaleTo100(rawScores.agreeableness - 1, 0, 4),
    conscientiousness: scaleTo100(rawScores.conscientiousness - 1, 0, 4),
    neuroticism: scaleTo100(rawScores.neuroticism - 1, 0, 4),
    openness: scaleTo100(rawScores.openness - 1, 0, 4),
  };
}

// ─── ECR-R 评分 ───

export interface EcrrScores {
  anxiety: number;    // 0-100
  avoidance: number;  // 0-100
  attachmentStyle: 'secure' | 'anxious' | 'avoidant' | 'fearful';
}

export function scoreEcrr(answers: Record<number, number>): EcrrScores {
  // 焦虑维度：第 1-18 题
  let anxietySum = 0;
  let anxietyCount = 0;
  // 回避维度：第 19-36 题
  let avoidanceSum = 0;
  let avoidanceCount = 0;

  for (const [qId, score] of Object.entries(answers)) {
    const id = parseInt(qId);
    if (id <= 18) {
      anxietySum += score;
      anxietyCount++;
    } else {
      avoidanceSum += score;
      avoidanceCount++;
    }
  }

  const anxietyAvg = anxietyCount > 0 ? anxietySum / anxietyCount : 4;
  const avoidanceAvg = avoidanceCount > 0 ? avoidanceSum / avoidanceCount : 4;

  const anxietyScore = scaleTo100(anxietyAvg - 1, 0, 6);
  const avoidanceScore = scaleTo100(avoidanceAvg - 1, 0, 6);

  // 依恋类型判定（基于中位数切分）
  // 焦虑高/回避高 = 恐惧型 (fearful)
  // 焦虑高/回避低 = 焦虑型 (anxious/preoccupied)
  // 焦虑低/回避高 = 回避型 (avoidant/dismissing)
  // 焦虑低/回避低 = 安全型 (secure)
  let attachmentStyle: 'secure' | 'anxious' | 'avoidant' | 'fearful';
  // 中位数参考值：焦虑 50，回避 45
  if (anxietyScore >= 50 && avoidanceScore >= 45) {
    attachmentStyle = 'fearful';
  } else if (anxietyScore >= 50) {
    attachmentStyle = 'anxious';
  } else if (avoidanceScore >= 45) {
    attachmentStyle = 'avoidant';
  } else {
    attachmentStyle = 'secure';
  }

  return { anxiety: anxietyScore, avoidance: avoidanceScore, attachmentStyle };
}

// ─── 瑞文推理评分 ───

export interface RavenScores {
  correct: number;
  total: number;
  score: number; // 0-100
}

export function scoreRaven(answers: Record<number, number>): RavenScores {
  let correct = 0;
  const total = RAVEN_QUESTIONS.length;

  for (const q of RAVEN_QUESTIONS) {
    const userAnswer = answers[q.id];
    if (userAnswer === q.correctIndex) {
      correct++;
    }
  }

  return {
    correct,
    total,
    score: Math.round((correct / total) * 100),
  };
}

// ─── 完整结果 ───

export interface TestResults {
  bigFive: BigFiveScores;
  ecrr: EcrrScores;
  raven: RavenScores;
}

export function calculateResults(
  bigFiveAnswers: Record<number, number>,
  ecrrAnswers: Record<number, number>,
  ravenAnswers: Record<number, number>
): TestResults {
  return {
    bigFive: scoreBigFive(bigFiveAnswers),
    ecrr: scoreEcrr(ecrrAnswers),
    raven: scoreRaven(ravenAnswers),
  };
}
