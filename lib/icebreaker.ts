/**
 * 破冰问题生成 — 规则引擎（唐岩建议）
 *
 * 基于双方开放式问题答案 + 人格测评结果交叉匹配
 */

export interface IcebreakerProfile {
  answers: { question_id: number; answer_text: string }[];
  personality: {
    attachment_style: string;
    openness: number;
    agreeableness: number;
  };
}

/** 默认问题池（5-8条轮换，不重复） */
const DEFAULT_QUESTIONS = [
  '如果你们可以一起度过一个完全自由的周末，你们各自最想做什么？',
  '你们觉得，一段好的关系里最重要的三件事是什么？',
  '最近有没有一件小事让你感到特别温暖？',
  '如果可以用一个季节来形容自己，你会选哪个？为什么？',
  '你们各自最想向对方学习的一件事是什么？',
  '你们心中最理想的"约会"是什么样的？',
  '有没有一个地方，对你有特别的意义？',
];

let defaultQuestionIndex = 0;

export function getNextDefaultQuestion(): string {
  const question = DEFAULT_QUESTIONS[defaultQuestionIndex % DEFAULT_QUESTIONS.length];
  defaultQuestionIndex++;
  return question;
}

export function generateIcebreaker(
  userA: IcebreakerProfile,
  userB: IcebreakerProfile
): string {
  // 规则1：共同提到电影/书 → 互相猜测
  const aHasMedia = userA.answers.find(
    (a) => a.answer_text.includes('电影') || a.answer_text.includes('书')
  );
  const bHasMedia = userB.answers.find(
    (a) => a.answer_text.includes('电影') || a.answer_text.includes('书')
  );
  if (aHasMedia && bHasMedia) {
    return '你们都提到了一部改变爱情观的电影/书。你们猜对方写的是哪一部？';
  }

  // 规则2：人格互补 → 好奇式提问
  if (userA.personality.openness > 70 && userB.personality.openness < 40) {
    return '一个人对新体验充满好奇，另一个人更珍惜熟悉的事物。你们最想带对方体验的一件小事是什么？';
  }

  // 规则3：相同依恋类型 → 共鸣式提问
  if (userA.personality.attachment_style === userB.personality.attachment_style) {
    const styleMap: Record<string, string> = {
      secure: '安全型',
      anxious: '焦虑型',
      avoidant: '回避型',
      fearful: '恐惧型',
    };
    return `你们都是${styleMap[userA.personality.attachment_style]}依恋类型。你们觉得，两个相似的人在一起，最大的好处和最大的挑战分别是什么？`;
  }

  // 规则4：依恋互补 → Esther Perel 式提问
  const complementaryPairs = [
    ['anxious', 'secure'],
    ['avoidant', 'secure'],
    ['anxious', 'avoidant'],
  ];
  const pair = [
    userA.personality.attachment_style,
    userB.personality.attachment_style,
  ].sort();
  if (complementaryPairs.some((p) => p[0] === pair[0] && p[1] === pair[1])) {
    return '你们的依恋风格不同——但这恰好是很多深度连接的起点。你们觉得，对方最需要被理解的一件事是什么？';
  }

  // 默认：轮换使用默认问题池
  return getNextDefaultQuestion();
}
