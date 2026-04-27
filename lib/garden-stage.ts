export interface GardenState {
  stage: number;           // 0种子/1破土/2展叶/3花苞/4开花
  stageName: string;
  stageNameCN: string;
  progressInStage: number; // 当前阶段内百分比 0-1
  totalProgress: number;   // 总进度 0-1
  growthMinutes: number;
  activeDays: number;      // 活跃自然日数
  nextStageName: string;
  message: string;
  color: string;
}

/**
 * 计算花园生长阶段
 * @param growthMinutes - 累计活跃分钟数
 * @param activeDays - 累计活跃自然日数
 *
 * 开花条件：
 *   ① 累计活跃时间 ≥ 12小时（720分钟）
 *   ② 活跃自然日 ≥ 5天
 *
 * 设计（Don Norman）：用户看到的是"花园日记"而非"进度条"
 */
export function calculateGardenStage(
  growthMinutes: number,
  activeDays: number
): GardenState {
  const hours = growthMinutes / 60;

  // 基础阶段（仅按活跃时长计算）
  let stage: number;
  let progressInStage: number;

  if (hours < 2) {
    stage = 0;
    progressInStage = hours / 2;
  } else if (hours < 5) {
    stage = 1;
    progressInStage = (hours - 2) / 3;
  } else if (hours < 8) {
    stage = 2;
    progressInStage = (hours - 5) / 3;
  } else if (hours < 12) {
    stage = 3;
    progressInStage = (hours - 8) / 4;
  } else {
    stage = 4;
    progressInStage = 1;
  }

  // 如果活跃时长够了但自然日不够，卡在花苞阶段
  if (stage >= 4 && activeDays < 5) {
    stage = 3;
    progressInStage = Math.min(activeDays / 5, 0.99);
  }

  const stages = [
    {
      name: 'seed',
      nameCN: '种子',
      color: '#5C4033',
      message: '一颗种子落入了土壤。',
      next: '破土',
    },
    {
      name: 'sprout',
      nameCN: '破土',
      color: '#7BA05B',
      message: '嫩芽破土而出。它很脆弱，也很勇敢。',
      next: '展叶',
    },
    {
      name: 'leaf',
      nameCN: '展叶',
      color: '#4A8C3F',
      message: '第一片叶子展开了。它在吸收阳光。',
      next: '花苞',
    },
    {
      name: 'bud',
      nameCN: '花苞',
      color: '#E8A87C',
      message: activeDays < 5
        ? `花苞在积蓄力量。还需要在花园里待上${5 - activeDays}天。`
        : '花苞形成了。它正在积蓄力量。',
      next: '开花',
    },
    {
      name: 'bloom',
      nameCN: '开花',
      color: '#F4D03F',
      message: '花开了。你已经准备好了。',
      next: '已经开花',
    },
  ];

  return {
    stage,
    stageName: stages[stage].name,
    stageNameCN: stages[stage].nameCN,
    progressInStage,
    totalProgress: Math.min(hours / 12, 1),
    growthMinutes,
    activeDays,
    nextStageName: stages[stage].next,
    message: stages[stage].message,
    color: stages[stage].color,
  };
}
