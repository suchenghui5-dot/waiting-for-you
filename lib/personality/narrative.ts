/**
 * 人格测评结果叙事生成
 * 规则引擎拼装 25+ 种模板组合（李飞飞方案）
 */

import type { BigFiveScores, EcrrScores, RavenScores } from './scoring';

function levelLabel(score: number, low: string, mid: string, high: string): string {
  if (score < 35) return low;
  if (score < 65) return mid;
  return high;
}

// ─── 大五叙事 ───

function bigFiveNarrative(scores: BigFiveScores): { title: string; paragraphs: string[]; tags: string[] } {
  const tags: string[] = [];
  const paragraphs: string[] = [];

  // 外向性
  const eLabel = levelLabel(scores.extraversion, '内敛型', '平衡型', '外向型');
  tags.push(`性格倾向:${eLabel}`);
  paragraphs.push(
    `**外向性 — ${eLabel}（${scores.extraversion}）**\n\n${
      scores.extraversion < 35
        ? '你偏向内敛。你从独处中获得能量，在社交后需要时间恢复。你更喜欢深度的一对一交流，而非热闹的聚会。在关系中，你可能需要更多时间来打开自己，但一旦建立了信任，你的内心世界是丰富而深刻的。'
        : scores.extraversion < 65
        ? '你处于中间地带。你既能享受独处的宁静，也能融入社交场合。你不会刻意成为焦点，但也愿意在合适的场合表达自己。在关系中，你能在"需要陪伴"和"需要空间"之间找到平衡。'
        : '你天性外向。你在社交互动中充电，喜歡與他人分享想法和感受。在关系中，你倾向于主动表达，乐于一起探索新事物。不过也要注意给彼此留出独处的时间和空间。'
    }`
  );

  // 宜人性
  const aLabel = levelLabel(scores.agreeableness, '独立型', '协作型', '利他型');
  tags.push(`人际风格:${aLabel}`);
  paragraphs.push(
    `**宜人性 — ${aLabel}（${scores.agreeableness}）**\n\n${
      scores.agreeableness < 35
        ? '你在人际交往中更注重自己的立场和边界。你不容易被他人影响，敢于表达不同意见。在关系中，你需要的是一个能尊重你的独立性、不试图改变你的伴侣。'
        : scores.agreeableness < 65
        ? '你善于合作，但也懂得保护自己的边界。你能体谅他人的感受，同时不会委屈自己。在关系中，你愿意为双方的关系付出努力，但也期待对方同等的尊重。'
        : '你心地善良，乐于助人，非常在意他人的感受。在关系中，你会是付出型的那一方。但要提醒自己：你的感受同样重要。一段健康的关系需要双方的给予和接纳。'
    }`
  );

  // 尽责性
  const cLabel = levelLabel(scores.conscientiousness, '随性型', '有序型', '严谨型');
  tags.push(`行事风格:${cLabel}`);
  paragraphs.push(
    `**尽责性 — ${cLabel}（${scores.conscientiousness}）**\n\n${
      scores.conscientiousness < 35
        ? '你喜欢随性自在的生活方式，不喜歡被计划和规则束缚。你更看重当下的体验而非未来的规划。在关系中，你需要的伴侣可能是一个能包容你的随性，同时帮你稳住方向的人。'
        : scores.conscientiousness < 65
        ? '你有一定的计划性，但也懂得灵活变通。大事上认真负责，小事上不会过于苛求。在关系中，你是可靠的伴侣，懂得为共同的未来做打算，但也不会让生活失去弹性。'
        : '你严谨认真、事无巨细。你总是提前计划，对承诺非常负责。在关系中，你是值得托付的人。不过偶尔也要放松一些——不是所有事情都需要完美计划，有些美好的事情恰恰发生在计划之外。'
    }`
  );

  // 神经质
  const nLabel = levelLabel(scores.neuroticism, '情绪稳定型', '敏感型', '高敏感型');
  const reverseLabel = levelLabel(100 - scores.neuroticism, '敏感', '稳定', '非常稳定');
  tags.push(`情绪特质:${nLabel}`);
  paragraphs.push(
    `**情绪稳定性 — ${nLabel}（${scores.neuroticism}）**\n\n${
      scores.neuroticism < 35
        ? '你情绪稳定，不容易被外界波动影响。你面对压力时能保持冷静，在冲突中也能理性沟通。在关系中，你是对方的安全港。但要注意不要让对方觉得你冷漠——适当表达情感会让关系更温暖。'
        : scores.neuroticism < 65
        ? '你有正常的情绪起伏，能感知到生活中的压力，也能调节自己。你偶尔会为小事烦恼，但不至于影响日常生活。在关系中，你需要的伴侣是一个能给你安全感，但不会过度保护你的人。'
        : '你的感受力很强，对外界的变化和压力比较敏感。这不全是坏事——敏感让你更能体察情感细节，但也容易让你陷入焦虑。在关系中，一个好的伴侣不是"永远不会让你难过"，而是"在你难过时愿意理解你"。'
    }`
  );

  // 开放性
  const oLabel = levelLabel(scores.openness, '传统型', '探索型', '开拓型');
  tags.push(`思维模式:${oLabel}`);
  paragraphs.push(
    `**开放性 — ${oLabel}（${scores.openness}）**\n\n${
      scores.openness < 35
        ? '你偏好熟悉和传统的生活方式。你喜欢明确的规则和已有的经验，对新事物持谨慎态度。在关系中，你更看重稳定性和可預測性。你需要的伴侣是一个尊重你的节奏、不强迫你改变的人。'
        : scores.openness < 65
        ? '你对新事物保持开放但非盲目的态度。你愿意尝试新鲜的体验，但也尊重传统和习惯。在关系中，你能和伴侣一起探索未知，也享受日常的宁静。'
        : '你对世界充满好奇，总是渴望新的体验和知识。你富有想象力，喜欢探讨抽象概念。在关系中，你需要的伴侣是一个愿意和你一起探索、不会觉得你"想太多"的人。'
    }`
  );

  const title = `你的性格画像 — ${eLabel} · ${aLabel} · ${cLabel} · ${nLabel} · ${oLabel}`;

  return { title, paragraphs, tags };
}

// ─── 依恋类型叙事 ───

function attachmentNarrative(style: string, anxiety: number, avoidance: number): { title: string; text: string; tags: string[] } {
  const tags: string[] = [];const narratives: Record<string, { title: string; text: string }> = {
    secure: {
      title: '安全型依恋 — 你懂得爱的分寸',
      text: '你在亲密关系中感到安全，既能信任对方，也允许对方依赖你。你不害怕亲密，也不担心被抛弃。当关系中出现矛盾时，你能冷静沟通，不会过度反应或回避。\n\n你的这种安全感，往往来自于健康的成长环境或过去的自我成长。你懂得：爱是相互的，不是索取也不是牺牲。\n\n**在关系中，你是理想的伴侣——但也要注意，不要因为自己"安全"就忽略了对敏感型伴侣的理解。你的稳定，对他们来说是一种力量。**',
    },
    anxious: {
      title: '焦虑型依恋 — 你需要被看见',
      text: '你在关系中渴望亲密，但又常常担心对方不够爱自己。你需要很多确认和关注，对对方的态度变化格外敏感。当对方没有及时回应时，你容易陷入焦虑。\n\n这不是你的错。你的焦虑背后，是对被抛弃的深层恐惧。你的爱其实很热烈——你只是需要一个能给你安全感的人。\n\n**在关系中，你需要一个情绪稳定、愿意给你确认的伴侣。同时，试着学习在焦虑的时候给自己一些安慰——你的价值不取决于对方是否秒回你的消息。**',
    },
    avoidant: {
      title: '回避型依恋 — 你珍惜自己的空间',
      text: '你重视独立和自主，在亲密到一定程度时会本能地退缩。你不是不需要爱，而是害怕在爱中失去自己。你习惯自己处理情绪，不轻易向人敞开心扉。\n\n你的独立是一种保护——但有时候，真正的独立不是"不需要任何人"，而是"可以选择依赖，也可以选择独立"。\n\n**在关系中，你需要一个尊重你空间但又足够坚定的伴侣。TA不会因为你需要独处就离开，也不会因为你退缩就放弃。慢慢地，你会发现在安全的关系里，敞开心扉没有那么可怕。**',
    },
    fearful: {
      title: '恐惧型依恋 — 你渴望又害怕靠近',
      text: '你的内心同时住着渴望和恐惧。你想要亲密，但当对方靠近时，你又本能地后退。你害怕被抛弃，也害怕被困住——这让你在面对关系时常常感到矛盾和不安全。\n\n这种矛盾不是你的错。它往往来自于你在过去的关系中曾经受过伤害。你的内心在保护你，但这种保护也让你离想要的亲密越来越远。\n\n**你需要的不是"完美"的伴侣，而是一个愿意理解你的矛盾、在你不安时不会离开的人。同时，如果条件允许，一对一的心理咨询能帮助你更好地理解这种恐惧的来源。**',
    },
  };

  const n = narratives[style] || narratives.secure;
  tags.push(`依恋类型:${n.title.split('—')[0].trim()}`);

  return { ...n, tags };
}

// ─── 瑞文推理叙事 ───

function ravenNarrative(scores: RavenScores): { text: string; tags: string[] } {
  const tags: string[] = [];
  let text: string;

  if (scores.score >= 80) {
    tags.push('推理能力:优秀');
    text = `你在瑞文推理测试中答对了 ${scores.correct}/${scores.total} 题（得分 ${scores.score}）。你的抽象推理能力很强，善于发现模式和规律。在处理复杂问题时，你能够快速抓住本质。`;
  } else if (scores.score >= 50) {
    tags.push('推理能力:良好');
    text = `你在瑞文推理测试中答对了 ${scores.correct}/${scores.total} 题（得分 ${scores.score}）。你的抽象推理能力处于正常偏上水平，在大多数情境中都能有效分析问题。`;
  } else {
    tags.push('推理能力:一般');
    text = `你在瑞文推理测试中答对了 ${scores.correct}/${scores.total} 题（得分 ${scores.score}）。抽象推理能力是需要练习的——就像肌肉一样。多做逻辑训练游戏，这方面的能力会逐步提高。`;
  }

  return { text, tags };
}

// ─── 完整报告 ───

export interface PersonalityReport {
  title: string;
  summary: string;
  bigFive: { title: string; paragraphs: string[]; tags: string[] };
  attachment: { title: string; text: string; tags: string[] };
  raven: { text: string; tags: string[] };
  allTags: string[];
  matchSuggestion: string;
}

export function buildReport(
  bigFive: BigFiveScores,
  ecrr: EcrrScores,
  raven: RavenScores
): PersonalityReport {
  const b5 = bigFiveNarrative(bigFive);
  const att = attachmentNarrative(ecrr.attachmentStyle, ecrr.anxiety, ecrr.avoidance);
  const rav = ravenNarrative(raven);

  const allTags = [
    ...b5.tags,
    ...att.tags,
    ...rav.tags,
  ];

  // 匹配建议
  const matchCandidates: string[] = [];
  if (ecrr.attachmentStyle === 'anxious') matchCandidates.push('安全型或回避型');
  else if (ecrr.attachmentStyle === 'avoidant') matchCandidates.push('安全型');
  else if (ecrr.attachmentStyle === 'fearful') matchCandidates.push('安全型');
  else matchCandidates.push('任何类型，但最佳匹配是焦虑型或回避型');

  const matchSuggestion = `根据你的人格特质，你在关系中更容易与**${matchCandidates[0]}**的伴侣建立深度连接。当然，人格类别只是参考——真正的关系是两个真实的人，在理解彼此差异的基础上共同成长。`;

  // 一句话总结
  const eLabel = levelLabel(bigFive.extraversion, '内敛', '平衡', '外向');
  const cLabel = levelLabel(bigFive.conscientiousness, '随性', '有序', '严谨');
  const nLabel = levelLabel(bigFive.neuroticism, '情绪稳定', '敏感', '高敏感');

  const summary = `你是一个${eLabel}、${cLabel}、${nLabel}的人。在关系中，你是${ecrr.attachmentStyle === 'secure' ? '安全型——你能自然地在亲密和独立之间找到平衡' : ecrr.attachmentStyle === 'anxious' ? '焦虑型——你渴望亲密，需要安全感' : ecrr.attachmentStyle === 'avoidant' ? '回避型——你珍惜独立，需要空间' : '恐惧型——你既渴望亲密又害怕靠近'}。`;

  return {
    title: b5.title,
    summary,
    bigFive: b5,
    attachment: att,
    raven: rav,
    allTags,
    matchSuggestion,
  };
}
