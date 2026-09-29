// 团内定位定义。
// max = 1 的定位是"全团唯一"定位（已有人占用时，其他人不能再选）。
// 想加新定位：往数组里加一条即可，游戏逻辑不用改。
export const POSITIONS = [
  { id: 'leader', label: '队长', max: 1 },
  { id: 'mainVocal', label: '主唱', max: 0 },
  { id: 'leadVocal', label: '领唱', max: 0 },
  { id: 'mainDance', label: '主舞', max: 0 },
  { id: 'leadDance', label: '领舞', max: 0 },
  { id: 'mainRap', label: '主Rapper', max: 0 },
  { id: 'leadRap', label: '领Rapper', max: 0 },
  { id: 'center', label: 'Center', max: 1 },
  { id: 'visual', label: '门面', max: 0 },
  { id: 'fotg', label: 'Face of the Group', max: 1 },
  { id: 'allrounder', label: '全能', max: 0 },
  { id: 'ace', label: 'ACE', max: 0 },
  { id: 'maknae', label: '忙内', max: 0, auto: 'maknae' },
];

// max = 0 表示不限人数；max = 1 表示全团最多 1 人。
export const UNIQUE_POSITIONS = POSITIONS.filter((p) => p.max === 1).map((p) => p.label);

export const POSITION_LABELS = POSITIONS.map((p) => p.label);

export const positionByLabel = (label) => POSITIONS.find((p) => p.label === label) || null;

export const MAKNAE_LABEL = '忙内';
