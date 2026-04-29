/* ══════════════════════════════════════════════
   건덕이 탭게임 ver2  -  app.js
   건국대학교 마스코트 건덕이와 함께하는 탭게임
══════════════════════════════════════════════ */

'use strict';

/* ──────────────────────────────────────────────
   CONFIG - 정적 게임 데이터
────────────────────────────────────────────── */

const COMBO_WINDOW    = 1500;  // ms
const FEVER_THRESHOLD = 15;
const FEVER_DURATION  = 8000;  // ms
const FEVER_COOLDOWN  = 5000;
const FEVER_MULT      = 3;
const AUTO_SAVE_MS    = 5000;
const TICK_MS         = 100;   // 10 ticks/sec
const MAX_OFFLINE_H   = 6;

// 콤보 배율 테이블
function getComboMult(combo) {
  if (combo >= 40) return 3.0;
  if (combo >= 25) return 2.5;
  if (combo >= 15) return 2.0;
  if (combo >= 10) return 1.5;
  if (combo >= 5)  return 1.2;
  return 1.0;
}

// 30단계 진화 데이터
const EVOLUTIONS = [
  { level:1,  title:"새내기 건덕이",        place:"건국대학교 정문",    story:"설레는 마음으로 정문을 통과했어요! 건덕이의 캠퍼스 생활이 시작됩니다." },
  { level:2,  title:"캠퍼스 산책 건덕이",   place:"일감호",            story:"일감호 주변을 산책하며 학교 분위기를 익혀요. 오리들이 반겨줘요!" },
  { level:3,  title:"강의실 건덕이",        place:"인문학관",           story:"첫 강의! 교수님 말씀을 열심히 듣고 노트 필기를 시작했어요." },
  { level:4,  title:"도서관 건덕이",        place:"도서관",             story:"도서관 집중석에 앉아 공부 중. 조용하지만 에너지는 가득!" },
  { level:5,  title:"동아리 건덕이",        place:"학생회관",           story:"동아리에 가입했어요! 새로운 친구들과 함께라면 무엇이든 할 수 있어요." },
  { level:6,  title:"일감호 산책 건덕이",   place:"일감호",             story:"시험 스트레스를 일감호 산책으로 해소해요. 맑은 물에 건덕이의 모습이 비쳐요." },
  { level:7,  title:"학생회관 건덕이",      place:"학생회관",           story:"학생회관 편의점에서 간식을 사며 에너지를 충전! 오늘도 파이팅!" },
  { level:8,  title:"인문학관 건덕이",      place:"인문학관",           story:"인문학의 깊이에 빠졌어요. 글쓰기와 토론이 즐거워졌습니다." },
  { level:9,  title:"공학관 건덕이",        place:"공학관",             story:"코딩과 회로 실습! 공학관의 불은 늦은 밤까지 꺼지지 않아요." },
  { level:10, title:"실험실 건덕이",        place:"생명과학관",          story:"연구실에서 첫 실험을 진행했어요. 과학의 신비로움에 눈이 반짝!" },
  { level:11, title:"예술디자인 건덕이",    place:"예술디자인대학",      story:"붓을 들고 창작의 세계로! 색채와 디자인이 건덕이의 세계를 넓혀줘요." },
  { level:12, title:"경영관 건덕이",        place:"경영관",             story:"비즈니스 케이스 스터디로 전략적 사고를 키웠어요. 미래 CEO 건덕이!" },
  { level:13, title:"법학관 건덕이",        place:"법학관",             story:"법정 토론에서 명쾌한 논리를 펼쳐요. 정의로운 건덕이 탄생!" },
  { level:14, title:"생명과학 건덕이",      place:"생명과학관",          story:"세포와 유전자의 비밀을 탐구 중. 생명의 신비가 건덕이를 매료시켜요." },
  { level:15, title:"축제 준비 건덕이",     place:"대운동장",            story:"대동제 준비로 캠퍼스가 들썩여요! 건덕이도 열심히 포스터를 만들어요." },
  { level:16, title:"대동제 건덕이",        place:"대운동장",            story:"축제의 열기로 가득찬 대운동장! 건덕이도 신나게 놀며 추억을 만들어요." },
  { level:17, title:"팀플 마스터 건덕이",   place:"산학협동관",          story:"팀 프로젝트를 성공적으로 완수! 협업의 달인이 된 건덕이예요." },
  { level:18, title:"시험기간 건덕이",      place:"도서관",             story:"시험 기간, 도서관은 전쟁터... 건덕이도 필사적으로 공부 중이에요." },
  { level:19, title:"밤샘 공부 건덕이",     place:"상허연구관",          story:"새벽 2시의 연구관, 그래도 건덕이는 포기하지 않아요. 파이팅!" },
  { level:20, title:"장학 건덕이",          place:"경영관",             story:"노력의 결실! 장학금을 받은 건덕이. 건국대의 자랑스러운 학생이에요." },
  { level:21, title:"연구 건덕이",          place:"상허연구관",          story:"교수님과 함께 연구 논문 작성 중. 학문의 깊이가 더해져요." },
  { level:22, title:"창업 건덕이",          place:"새천년관",            story:"새천년관 창업지원센터에서 스타트업을 준비 중인 건덕이. 꿈을 향해!" },
  { level:23, title:"글로벌 건덕이",        place:"건국대학교 정문",      story:"교환학생 프로그램 지원! 세계로 나아가는 건덕이의 첫 걸음이에요." },
  { level:24, title:"캠퍼스 리더 건덕이",   place:"학생회관",            story:"학생회장 선거에 출마한 건덕이! 캠퍼스의 리더로 성장했어요." },
  { level:25, title:"상허 정신 건덕이",     place:"상허연구관",          story:"건국대 설립자 상허 유석창의 정신을 이어받은 건덕이. 성실, 창의, 봉사!" },
  { level:26, title:"건국 히어로 건덕이",   place:"건국대학교 캠퍼스",   story:"캠퍼스의 모든 곳에서 건덕이를 모르는 사람이 없어요. 전설의 시작!" },
  { level:27, title:"KU 스타 건덕이",       place:"건국대학교 캠퍼스",   story:"건국대의 스타가 된 건덕이! 강의, 연구, 봉사 모든 분야에서 빛나요." },
  { level:28, title:"레전드 건덕이",        place:"건국대학교 캠퍼스",   story:"수십 년 후에도 전설로 남을 건덕이의 이야기. 건국대의 역사가 되었어요." },
  { level:29, title:"캠퍼스 수호자 건덕이", place:"건국대학교 캠퍼스",   story:"캠퍼스를 지키는 수호자 건덕이! 새내기들에게 길잡이가 되어줘요." },
  { level:30, title:"마스터 건덕이",        place:"건국대학교 캠퍼스 전체", story:"드디어 마스터가 된 건덕이! 건국대학교의 영원한 마스코트로 빛나요. ✨" },
];

// 진화 필요 에너지 계산 (밸런스 조정)
function getEvoRequired(level) {
  if (level <= 1) return 0;
  const base = 80;
  const growth = 1.42;
  const cap = 8000000;
  return Math.min(Math.floor(base * Math.pow(growth, level - 1)), cap);
}

// 9가지 업그레이드
const UPGRADES = [
  {
    id: "tap_power",
    name: "탭 파워 강화",
    icon: "⚡",
    desc: "탭당 기본 에너지 획득량을 늘려줍니다",
    baseCost: 30,
    costGrowth: 1.5,
    maxLevel: 50,
    effect: (lvl) => `탭당 +${1 + lvl} 에너지`,
    getValue: (lvl) => 1 + lvl,
  },
  {
    id: "combo_amp",
    name: "콤보 증폭기",
    icon: "🔥",
    desc: "콤보 배율 보너스를 높여줍니다",
    baseCost: 50,
    costGrowth: 1.6,
    maxLevel: 20,
    effect: (lvl) => `콤보 배율 +${(lvl * 0.1).toFixed(1)}x`,
    getValue: (lvl) => lvl * 0.1,
  },
  {
    id: "combo_time",
    name: "콤보 시간 연장",
    icon: "⏱️",
    desc: "콤보가 유지되는 시간을 늘려줍니다",
    baseCost: 60,
    costGrowth: 1.5,
    maxLevel: 20,
    effect: (lvl) => `콤보 유지 +${(lvl * 0.2).toFixed(1)}초`,
    getValue: (lvl) => lvl * 0.2,
  },
  {
    id: "fever_duration",
    name: "피버 지속 강화",
    icon: "🌡️",
    desc: "피버 모드 지속 시간을 늘려줍니다",
    baseCost: 100,
    costGrowth: 1.7,
    maxLevel: 15,
    effect: (lvl) => `피버 +${(lvl * 1).toFixed(0)}초`,
    getValue: (lvl) => lvl * 1000,
  },
  {
    id: "fever_mult",
    name: "피버 배율 강화",
    icon: "💥",
    desc: "피버 중 획득량 배율을 높여줍니다",
    baseCost: 150,
    costGrowth: 1.8,
    maxLevel: 10,
    effect: (lvl) => `피버 배율 ×${(3 + lvl * 0.5).toFixed(1)}`,
    getValue: (lvl) => lvl * 0.5,
  },
  {
    id: "auto_collect",
    name: "자동 수집 효율",
    icon: "🏗️",
    desc: "모든 건물 자동 수집기 생산량을 늘려줍니다",
    baseCost: 80,
    costGrowth: 1.55,
    maxLevel: 30,
    effect: (lvl) => `자동 수집 ×${(1 + lvl * 0.15).toFixed(2)}`,
    getValue: (lvl) => 1 + lvl * 0.15,
  },
  {
    id: "growth_research",
    name: "성장 연구",
    icon: "🌱",
    desc: "진화 필요 에너지를 줄여줍니다",
    baseCost: 120,
    costGrowth: 1.65,
    maxLevel: 20,
    effect: (lvl) => `진화 필요량 -${(lvl * 3)}%`,
    getValue: (lvl) => 1 - lvl * 0.03,
  },
  {
    id: "lucky_badge",
    name: "행운의 캠퍼스 배지",
    icon: "🍀",
    desc: "일정 확률로 탭 보너스가 발동합니다",
    baseCost: 200,
    costGrowth: 1.6,
    maxLevel: 10,
    effect: (lvl) => `보너스 확률 ${lvl * 5}% (×5)`,
    getValue: (lvl) => lvl * 0.05,
  },
  {
    id: "offline_note",
    name: "저장 최적화 노트",
    icon: "📓",
    desc: "오프라인 보상 수령 시간 한도를 늘려줍니다",
    baseCost: 300,
    costGrowth: 2.0,
    maxLevel: 5,
    effect: (lvl) => `오프라인 보상 최대 ${MAX_OFFLINE_H + lvl * 2}시간`,
    getValue: (lvl) => lvl * 2,
  },
];

// 12개 자동 수집기 (건국대 건물)
const COLLECTORS = [
  { id:"humanities",  name:"인문학관 노트 정리팀", icon:"📝", desc:"꼼꼼한 필기로 에너지를 모아요",    baseProd:0.2, baseCost:40,   costGrowth:1.4, unlockEvo:1  },
  { id:"engineering", name:"공학관 실험 장치",      icon:"⚙️", desc:"쉬지 않고 돌아가는 실험 기기",   baseProd:0.5, baseCost:120,  costGrowth:1.4, unlockEvo:2  },
  { id:"student",     name:"학생회관 응원단",        icon:"📣", desc:"열정적인 응원으로 에너지 충전",   baseProd:1.2, baseCost:350,  costGrowth:1.4, unlockEvo:3  },
  { id:"sangheo",     name:"상허연구관 연구 노트",   icon:"🔬", desc:"새벽까지 이어지는 연구의 열정",   baseProd:3.0, baseCost:1000, costGrowth:1.4, unlockEvo:5  },
  { id:"millennium",  name:"새천년관 아이디어 랩",   icon:"💡", desc:"반짝이는 아이디어가 에너지로",    baseProd:6.5, baseCost:3000, costGrowth:1.4, unlockEvo:7  },
  { id:"industry",    name:"산학협동관 프로젝트 팀", icon:"🤝", desc:"협업 시너지로 에너지 두 배!",     baseProd:14,  baseCost:8000, costGrowth:1.4, unlockEvo:9  },
  { id:"art",         name:"예술디자인대학 스케치",  icon:"🎨", desc:"예술적 감성이 에너지로 폭발",     baseProd:30,  baseCost:22000,costGrowth:1.4, unlockEvo:11 },
  { id:"biology",     name:"생명과학관 배양 장치",   icon:"🧬", desc:"배양 중인 에너지 조직들",         baseProd:65,  baseCost:60000,costGrowth:1.4, unlockEvo:13 },
  { id:"law",         name:"법학관 토론 모임",       icon:"⚖️", desc:"날카로운 논리가 에너지를 만들어", baseProd:140, baseCost:160000,costGrowth:1.4, unlockEvo:15 },
  { id:"business",    name:"경영관 전략 회의",       icon:"💼", desc:"전략적 에너지 운용으로 성장",     baseProd:300, baseCost:400000,costGrowth:1.4, unlockEvo:18 },
  { id:"library",     name:"도서관 집중석",          icon:"📚", desc:"집중력이 에너지로 전환됩니다",    baseProd:650, baseCost:1000000,costGrowth:1.4, unlockEvo:21 },
  { id:"lake",        name:"일감호 산책 에너지",     icon:"🌊", desc:"산책할수록 샘솟는 신선한 에너지", baseProd:1400,baseCost:2500000,costGrowth:1.4, unlockEvo:25 },
];

// 14개 이상 업적
const ACHIEVEMENTS = [
  { id:"first_tap",     name:"첫 탭",          icon:"👆", desc:"건덕이를 처음 탭했습니다",           cond:s => s.tapCount >= 1,            reward:10,    rewardDesc:"⚡ 10" },
  { id:"tap_100",       name:"손끝의 새내기",   icon:"👋", desc:"탭 100회를 달성했습니다",        cond:s => s.tapCount >= 100,          reward:50,    rewardDesc:"⚡ 50" },
  { id:"tap_1000",      name:"폭풍 클릭러",     icon:"⚡", desc:"탭 1,000회를 달성했습니다",      cond:s => s.tapCount >= 1000,         reward:300,   rewardDesc:"⚡ 300" },
  { id:"tap_10000",     name:"탭의 신",          icon:"🌪️", desc:"탭 10,000회를 달성했습니다",    cond:s => s.tapCount >= 10000,        reward:2000,  rewardDesc:"⚡ 2,000" },
  { id:"combo_10",      name:"콤보 입문",        icon:"🔗", desc:"10콤보를 달성했습니다",          cond:s => s.bestCombo >= 10,          reward:30,    rewardDesc:"⚡ 30" },
  { id:"combo_30",      name:"콤보 마스터",      icon:"🔥", desc:"30콤보를 달성했습니다",          cond:s => s.bestCombo >= 30,          reward:200,   rewardDesc:"⚡ 200" },
  { id:"combo_50",      name:"콤보 전설",        icon:"💫", desc:"50콤보를 달성했습니다",          cond:s => s.bestCombo >= 50,          reward:1000,  rewardDesc:"⚡ 1,000" },
  { id:"fever_first",   name:"피버 첫 발동",     icon:"🌡️", desc:"피버 모드를 처음 발동했습니다",  cond:s => s.feverCount >= 1,          reward:100,   rewardDesc:"⚡ 100" },
  { id:"fever_20",      name:"피버 중독",        icon:"🔥", desc:"피버 20회를 발동했습니다",       cond:s => s.feverCount >= 20,         reward:800,   rewardDesc:"⚡ 800" },
  { id:"evo_1",         name:"첫 성장",          icon:"🌱", desc:"건덕이가 처음으로 성장했습니다",     cond:s => s.evolutionLevel >= 2,      reward:50,    rewardDesc:"⚡ 50" },
  { id:"evo_10",        name:"열 번째 성장",     icon:"🌿", desc:"진화 10단계를 달성했습니다",     cond:s => s.evolutionLevel >= 10,     reward:1000,  rewardDesc:"⚡ 1,000" },
  { id:"evo_20",        name:"스무 번째 성장",   icon:"🌳", desc:"진화 20단계를 달성했습니다",     cond:s => s.evolutionLevel >= 20,     reward:10000, rewardDesc:"⚡ 10,000" },
  { id:"evo_30",        name:"마스터 건덕이",        icon:"👑", desc:"진화 30단계를 달성했습니다!",    cond:s => s.evolutionLevel >= 30,     reward:50000, rewardDesc:"⚡ 50,000" },
  { id:"auto_10",       name:"캠퍼스 자동화",    icon:"🏗️", desc:"자동 수집기 총 10개를 보유",    cond:s => Object.values(s.collectors).reduce((a,b)=>a+b,0) >= 10, reward:500, rewardDesc:"⚡ 500" },
  { id:"all_collectors",name:"건물 컬렉터",      icon:"🏫", desc:"모든 자동 수집기를 해금했습니다", cond:s => COLLECTORS.every(c => (s.collectors[c.id]||0) >= 1), reward:5000, rewardDesc:"⚡ 5,000" },
  { id:"energy_1k",     name:"에너지 입문",      icon:"💰", desc:"누적 에너지 1,000 달성",        cond:s => s.totalEnergy >= 1000,      reward:100,   rewardDesc:"⚡ 100" },
  { id:"energy_100k",   name:"에너지 부자",      icon:"💎", desc:"누적 에너지 100,000 달성",      cond:s => s.totalEnergy >= 100000,    reward:5000,  rewardDesc:"⚡ 5,000" },
  { id:"energy_1m",     name:"에너지 백만장자",  icon:"🏦", desc:"누적 에너지 1,000,000 달성",    cond:s => s.totalEnergy >= 1000000,   reward:50000, rewardDesc:"⚡ 50,000" },
  { id:"reincarnate_1", name:"다시 시작하는 건덕이", icon:"♻️", desc:"전생 1회를 달성했습니다",       cond:s => s.reincarnations >= 1,      reward:0,     rewardDesc:"영구 보너스 ×1.5" },
  { id:"reincarnate_5", name:"환생의 달인",      icon:"🔄", desc:"전생 5회를 달성했습니다",       cond:s => s.reincarnations >= 5,      reward:0,     rewardDesc:"영구 보너스 누적" },
  { id:"upgrade_all",   name:"업그레이드 마스터",icon:"⬆️", desc:"모든 업그레이드를 1레벨 이상",  cond:s => UPGRADES.every(u => (s.upgrades[u.id]||0) >= 1), reward:2000, rewardDesc:"⚡ 2,000" },
];

// 캠퍼스 탐험 장소
const CAMPUS_LOCATIONS = [
  { id:"gate",       name:"건국대학교 정문",    icon:"🏛️", desc:"건국대학교의 상징적인 정문입니다. 모든 이야기가 시작되는 곳.",          bonus:"탭 파워 +5%",    bonusMult:1.05, unlockEvo:1  },
  { id:"lake",       name:"일감호",             icon:"🌊", desc:"캠퍼스 중심부의 아름다운 호수. 오리들이 사는 일감호에서 힐링!",          bonus:"자동 수집 +5%",  bonusMult:1.05, unlockEvo:2  },
  { id:"library",    name:"도서관",             icon:"📚", desc:"지식의 보고. 24시간 열려있는 이 공간에서 공부의 열정을 불태워요.",         bonus:"탭 파워 +10%",   bonusMult:1.10, unlockEvo:4  },
  { id:"student",    name:"학생회관",           icon:"🏢", desc:"학생들의 놀이터. 편의점, 카페, 동아리방이 모여있는 소통의 공간.",          bonus:"콤보 유지 +0.5초",bonusMult:1.0, unlockEvo:5  },
  { id:"millennium", name:"새천년관",           icon:"🏙️", desc:"현대적인 건물. 강의실과 창업지원센터가 함께 있어요.",                    bonus:"자동 수집 +15%", bonusMult:1.15, unlockEvo:8  },
  { id:"art",        name:"예술디자인대학",     icon:"🎨", desc:"창의력이 넘치는 공간. 학생들의 작품이 캠퍼스를 수놓아요.",               bonus:"탭 파워 +20%",   bonusMult:1.20, unlockEvo:11 },
  { id:"sangheo",    name:"상허연구관",         icon:"🔬", desc:"건국대학교 연구의 심장부. 밤새워 실험하는 연구원들로 가득해요.",           bonus:"자동 수집 +25%", bonusMult:1.25, unlockEvo:15 },
  { id:"stadium",    name:"대운동장",           icon:"🏟️", desc:"건국대 스포츠의 중심. 대동제와 운동회가 펼쳐지는 열정의 공간!",           bonus:"피버 시간 +2초", bonusMult:1.0,  unlockEvo:16 },
  { id:"campus_all", name:"건국대학교 캠퍼스",  icon:"🏫", desc:"건국대 전체를 품는 마스터 건덕이의 영역. 모든 에너지가 모여드는 곳!",         bonus:"전체 생산 +50%", bonusMult:1.50, unlockEvo:25 },
];

// 랜덤 이벤트
const RANDOM_EVENTS = [
  { id:"break",    name:"강의 쉬는 시간!", icon:"🎉", desc:"쉬는 시간 동안 탭 에너지가 2배!", duration:20, tapBonus:2.0, autoBonus:1.0 },
  { id:"festival", name:"축제 부스 오픈!",  icon:"🎪", desc:"축제 분위기로 모든 에너지 생산 1.5배!", duration:30, tapBonus:1.5, autoBonus:1.5 },
  { id:"lake_walk",name:"일감호 산책 타임!",icon:"🌊", desc:"상쾌한 산책으로 자동 수집 3배!", duration:25, tapBonus:1.0, autoBonus:3.0 },
  { id:"teamplay", name:"팀플 대성공!",     icon:"🤝", desc:"팀플 성공! 에너지 3배 획득!", duration:15, tapBonus:3.0, autoBonus:2.0 },
  { id:"library",  name:"도서관 집중 모드!",icon:"📚", desc:"고요한 집중력으로 자동 수집 2배!", duration:40, tapBonus:1.0, autoBonus:2.0 },
  { id:"rain",     name:"일감호 빗소리...", icon:"🌧️", desc:"빗소리를 들으며 탭 파워가 1.5배!", duration:20, tapBonus:1.5, autoBonus:1.2 },
];

// 일일 미션 템플릿
const DAILY_TEMPLATES = [
  { id:"tap_300",    name:"열심히 탭하기",       desc:"오늘 300번 탭하기",          target:300, type:"tapCount",  reward:500  },
  { id:"tap_1000",   name:"탭 1000회 달성",      desc:"오늘 1000번 탭하기",         target:1000,type:"tapCount",  reward:2000 },
  { id:"fever_3",    name:"피버 3번 발동",        desc:"피버 모드를 3번 발동시키기", target:3,   type:"feverCount",reward:1000 },
  { id:"combo_20",   name:"20콤보 달성",          desc:"20콤보를 달성하기",          target:20,  type:"maxCombo",  reward:800  },
  { id:"buy_upgrade",name:"업그레이드 구매",      desc:"업그레이드 1번 구매하기",    target:1,   type:"buyUpgrade",reward:300  },
  { id:"buy_collector",name:"자동 수집기 구매",   desc:"자동 수집기를 3개 구매",     target:3,   type:"buyCollector",reward:600 },
  { id:"energy_5k",  name:"에너지 5,000 모으기",  desc:"5,000 에너지를 모으기",      target:5000,type:"earnEnergy", reward:800  },
];

/* ──────────────────────────────────────────────
   DEFAULT STATE
────────────────────────────────────────────── */

function createDefaultState(profileId) {
  return {
    version: 2,
    profileId,
    energy: 0,
    totalEnergy: 0,
    tapCount: 0,
    bestCombo: 0,
    combo: 0,
    comboTimer: 0,
    feverActive: false,
    feverTimer: 0,
    feverCooldown: 0,
    feverCount: 0,
    evolutionLevel: 1,
    canEvolve: false,
    reincarnations: 0,
    permanentBonus: 1.0,
    upgrades: {},
    collectors: {},
    achievements: {},
    lastSavedAt: Date.now(),
    lastTickAt: Date.now(),
    currentEvent: null,
    eventTimer: 0,
    dailyMissions: null,
    dailyDate: null,
    dailyProgress: {},
  };
}

/* ──────────────────────────────────────────────
   GAME ENGINE
────────────────────────────────────────────── */

const game = {
  state: null,
  profiles: [],
  currentProfileId: null,
  tickInterval: null,
  saveInterval: null,
  _lastTickTime: 0,
  _pendingAchievements: [],
  _showCapture: false,
  _captureShownFor: -1,
  _selectedInitProfileId: null,  // 온보딩에서 선택된 프로필 ID

  /* ── 초기화 ── */
  init() {
    if (!api.isLoggedIn()) {
      this._showAuthModal();
      return;
    }
    this._initAfterAuth();
  },

  /* ── 로그인 후 게임 초기화 ── */
  _initAfterAuth() {
    this.profiles = this._loadProfiles();
    this._renderInitProfileList();

    // 이벤트 리스너 등록
    document.getElementById('btn-create-profile')
      .addEventListener('click', () => this._onCreateProfile());

    document.getElementById('init-profile-name')
      .addEventListener('keydown', e => { if (e.key === 'Enter') this._onCreateProfile(); });

    // 닉네임 입력 시작 시 저장 프로필 선택 해제
    document.getElementById('init-profile-name')
      .addEventListener('input', () => {
        if (document.getElementById('init-profile-name').value.length > 0) {
          this._selectedInitProfileId = null;
          document.querySelectorAll('.init-profile-item').forEach(el => el.classList.remove('selected'));
          document.getElementById('btn-create-profile').textContent = '시작하기';
        }
      });

    document.getElementById('btn-add-profile')
      .addEventListener('click', () => this._onAddProfile());

    document.getElementById('new-profile-input')
      .addEventListener('keydown', e => { if (e.key === 'Enter') this._onAddProfile(); });

    document.getElementById('btn-evolve')
      .addEventListener('click', () => this.evolve());

    document.getElementById('ku')
      .addEventListener('click', (e) => this.tap(e));

    document.getElementById('btn-reincarnate')
      .addEventListener('click', () => {
        if (!this.state) return;
        this._openModal('modal-reincarnate');
        document.getElementById('modal-ri-bonus').textContent =
          `×${(1 + (this.state.reincarnations + 1) * 0.5).toFixed(1)}`;
      });

    document.getElementById('btn-ri-confirm')
      .addEventListener('click', () => { this._closeModal('modal-reincarnate'); this.reincarnate(); });

    document.getElementById('btn-daily')
      .addEventListener('click', () => { this._refreshDailyMissions(); this._openModal('modal-daily'); this._renderDailyMissions(); });

    document.getElementById('btn-capture')
      .addEventListener('click', () => this.captureGrowth());

    // 탭바
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => this._switchTab(btn.dataset.tab));
    });

    // 모달 닫기 버튼
    document.querySelectorAll('.modal-close').forEach(btn => {
      btn.addEventListener('click', () => this._closeModal(btn.dataset.modal));
    });

    if (this.profiles.length > 0) {
      document.getElementById('saved-profiles-section').classList.remove('hidden');
    }

    // DB에서 프로필 목록 동기화 (다른 기기에서 저장된 세이브 복원)
    this._syncProfilesFromDB();
  },

  /* ── auth 모달 표시 ── */
  _showAuthModal() {
    document.getElementById('modal-profile-select').classList.add('hidden');
    document.getElementById('modal-auth').classList.remove('hidden');

    const tabLogin  = document.getElementById('auth-tab-login');
    const tabSignup = document.getElementById('auth-tab-signup');
    const formLogin  = document.getElementById('auth-form-login');
    const formSignup = document.getElementById('auth-form-signup');

    tabLogin.addEventListener('click', () => {
      tabLogin.classList.add('active');  tabSignup.classList.remove('active');
      formLogin.classList.remove('hidden'); formSignup.classList.add('hidden');
      document.getElementById('auth-error-login').textContent = '';
    });
    tabSignup.addEventListener('click', () => {
      tabSignup.classList.add('active'); tabLogin.classList.remove('active');
      formSignup.classList.remove('hidden'); formLogin.classList.add('hidden');
      document.getElementById('auth-error-signup').textContent = '';
    });

    const setLoading = (btn, loading) => {
      btn.disabled = loading;
      btn.textContent = loading ? '처리 중...' : (btn.id === 'btn-auth-login' ? '로그인' : '회원가입');
    };

    document.getElementById('btn-auth-login').addEventListener('click', async () => {
      const btn      = document.getElementById('btn-auth-login');
      const username = document.getElementById('auth-username-login').value.trim();
      const password = document.getElementById('auth-password-login').value;
      const errEl    = document.getElementById('auth-error-login');
      errEl.textContent = '';
      if (!username || !password) { errEl.textContent = '유저네임과 비밀번호를 입력해주세요'; return; }
      setLoading(btn, true);
      try {
        await api.login(username, password);
        this._onAuthSuccess();
      } catch (err) {
        errEl.textContent = err.message;
      } finally {
        setLoading(btn, false);
      }
    });

    document.getElementById('btn-auth-signup').addEventListener('click', async () => {
      const btn   = document.getElementById('btn-auth-signup');
      const uname = document.getElementById('auth-username-signup').value.trim();
      const pw1   = document.getElementById('auth-password-signup').value;
      const pw2   = document.getElementById('auth-password-signup2').value;
      const errEl = document.getElementById('auth-error-signup');
      errEl.textContent = '';
      if (!uname || !pw1) { errEl.textContent = '모든 항목을 입력해주세요'; return; }
      if (pw1 !== pw2)    { errEl.textContent = '비밀번호가 일치하지 않습니다'; return; }
      setLoading(btn, true);
      try {
        await api.signup(uname, pw1);
        this._onAuthSuccess();
      } catch (err) {
        errEl.textContent = err.message;
      } finally {
        setLoading(btn, false);
      }
    });

    // Enter 키 지원
    document.getElementById('auth-password-login').addEventListener('keydown', e => {
      if (e.key === 'Enter') document.getElementById('btn-auth-login').click();
    });
    document.getElementById('auth-password-signup2').addEventListener('keydown', e => {
      if (e.key === 'Enter') document.getElementById('btn-auth-signup').click();
    });
  },

  /* ── 로그인/회원가입 성공 후 처리 ── */
  _onAuthSuccess() {
    document.getElementById('modal-auth').classList.add('hidden');
    document.getElementById('modal-profile-select').classList.remove('hidden');
    this._initAfterAuth();
  },

  /* ── DB 세이브 → 로컬 프로필 동기화 (새 기기 복원) ── */
  async _syncProfilesFromDB() {
    if (!api.isLoggedIn()) return;
    try {
      const dbSaves = await api.listSaves();
      let changed = false;
      for (const row of dbSaves) {
        const exists = this.profiles.some(p => p.name === row.profile_name);
        if (!exists) {
          this.profiles.push({
            id: `profile_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
            name: row.profile_name,
            createdAt: Date.now(),
            lastPlayedAt: new Date(row.updated_at).getTime(),
          });
          changed = true;
        }
      }
      if (changed) {
        this._saveProfiles();
        this._renderInitProfileList();
        document.getElementById('saved-profiles-section').classList.remove('hidden');
      }
    } catch (e) {
      // DB 접근 실패 시 로컬 데이터로 계속 진행
    }
  },

  /* ── DB에서 세이브 로드 후 게임 시작 ── */
  async _loadAndStart(profileId) {
    if (api.isLoggedIn()) {
      const profile = this.profiles.find(p => p.id === profileId);
      const hasLocal = !!localStorage.getItem(`kuTapGame:save:${profileId}`);
      // 로컬에 없으면 DB에서 가져와 localStorage에 캐싱
      if (profile && !hasLocal) {
        try {
          const row = await api.loadSave(profile.name);
          if (row?.save_data) {
            localStorage.setItem(`kuTapGame:save:${profileId}`, JSON.stringify(row.save_data));
          }
        } catch (e) { /* DB 없으면 새 게임으로 시작 */ }
      }
    }
    this.startGame(profileId);
  },

  /* ── 게임 시작 ── */
  startGame(profileId) {
    this.currentProfileId = profileId;
    this.state = this._loadState(profileId);

    // 오프라인 보상 체크
    const offlineReward = this._calcOfflineReward();
    if (offlineReward > 0) {
      this.state.energy += offlineReward;
      this.state.totalEnergy += offlineReward;
      const hours = Math.floor((Date.now() - this.state.lastTickAt) / 3600000);
      document.getElementById('modal-offline-msg').innerHTML =
        `${hours}시간 동안 자동 수집기가 열심히 일했어요!<br><br>` +
        `<strong>+${this.formatNum(offlineReward)} 건덕이 에너지</strong>를 수령했습니다! 🎉`;
      this._openModal('modal-offline');
    }
    this.state.lastTickAt = Date.now();

    // 일일 미션 초기화
    this._refreshDailyMissions();

    // UI 전환: 프로필 모달 완전히 숨기고 게임 화면 표시
    const profileModal = document.getElementById('modal-profile-select');
    profileModal.classList.remove('active');   // active !important 충돌 방지
    profileModal.classList.add('hidden');
    document.getElementById('app').classList.remove('hidden');

    // 게임 루프 시작
    this._lastTickTime = Date.now();
    this.tickInterval = setInterval(() => this._tick(), TICK_MS);
    this.saveInterval = setInterval(() => this.save(), AUTO_SAVE_MS);

    this._renderAll();
    this._updateShopTab();
    this._renderProfilePanel();
  },

  /* ── 게임 루프 ── */
  _tick() {
    const now = Date.now();
    const dt = (now - this._lastTickTime) / 1000; // 초 단위
    this._lastTickTime = now;
    const s = this.state;

    // 자동 수집
    const eps = this.getEPS();
    if (eps > 0) {
      const gained = eps * dt;
      s.energy += gained;
      s.totalEnergy += gained;
      // 일일 미션 추적
      if (s.dailyProgress) {
        s.dailyProgress.earnEnergy = (s.dailyProgress.earnEnergy || 0) + gained;
      }
    }

    // 콤보 타이머 감소
    if (s.combo > 0) {
      const window = this._getComboWindow();
      s.comboTimer += dt * 1000;
      if (s.comboTimer >= window) {
        s.combo = 0;
        s.comboTimer = 0;
      }
    }

    // 피버 타이머
    if (s.feverActive) {
      s.feverTimer -= dt * 1000;
      if (s.feverTimer <= 0) {
        s.feverActive = false;
        s.feverTimer = 0;
        s.feverCooldown = FEVER_COOLDOWN;
        this._onFeverEnd();
      }
    }

    if (s.feverCooldown > 0) {
      s.feverCooldown -= dt * 1000;
      if (s.feverCooldown < 0) s.feverCooldown = 0;
    }

    // 이벤트 타이머
    if (s.currentEvent && s.eventTimer > 0) {
      s.eventTimer -= dt * 1000;
      if (s.eventTimer <= 0) {
        s.currentEvent = null;
        s.eventTimer = 0;
        this._updateEventBanner();
      }
    }

    // 랜덤 이벤트 발생 (1% per tick = 0.1s → avg 10초마다 1번, 실제론 낮게)
    if (!s.currentEvent && Math.random() < 0.0005) {
      this._triggerRandomEvent();
    }

    // 진화 체크
    const nextLvl = s.evolutionLevel + 1;
    if (nextLvl <= 30) {
      const required = Math.floor(getEvoRequired(nextLvl) * this._getGrowthReductionMult());
      s.canEvolve = s.totalEnergy >= required;
    } else {
      s.canEvolve = false;
    }

    // 업적 체크
    this._checkAchievements();

    // 렌더링 (탭 패널만 항상, 나머지는 현재 탭)
    this._renderScoreArea();
    this._renderComboFever();
    this._renderEvoSection();
    this._renderEventBanner();
    this._renderSaveBadge();

    // 상점 업데이트 (천천히)
    this._tickCount = (this._tickCount || 0) + 1;
    if (this._tickCount % 10 === 0) {
      this._updateShopTab();
    }
  },

  /* ── 탭 처리 ── */
  tap(e) {
    if (!this.state) return;
    const s = this.state;
    const tapPow = this.getTPS();
    s.energy += tapPow;
    s.totalEnergy += tapPow;
    s.tapCount++;

    // 일일 미션
    if (s.dailyProgress) {
      s.dailyProgress.tapCount = (s.dailyProgress.tapCount || 0) + 1;
    }

    // 콤보 증가
    const window = this._getComboWindow();
    s.combo++;
    s.comboTimer = 0;
    if (s.combo > s.bestCombo) s.bestCombo = s.combo;

    // 콤보 레벨 업 애니메이션
    const comboSection = document.getElementById('combo-section');
    const comboNum = document.getElementById('combo-num');
    comboNum.classList.remove('combo-low','combo-mid','combo-high','combo-max');
    if (s.combo >= 25)      comboNum.classList.add('combo-max');
    else if (s.combo >= 15) comboNum.classList.add('combo-high');
    else if (s.combo >= 5)  comboNum.classList.add('combo-mid');
    else                    comboNum.classList.add('combo-low');

    // 피버 체크
    if (!s.feverActive && s.feverCooldown <= 0 && s.combo >= FEVER_THRESHOLD) {
      this._activateFever();
    }

    // 캐릭터 바운스
    const ku = document.getElementById('ku');
    ku.classList.remove('bouncing', 'fever-bouncing');
    void ku.offsetWidth;
    ku.classList.add(s.feverActive ? 'fever-bouncing' : 'bouncing');

    // 파티클
    const rect = ku.getBoundingClientRect();
    const layerRect = document.getElementById('particle-layer').getBoundingClientRect();
    const x = rect.left - layerRect.left + rect.width / 2;
    const y = rect.top  - layerRect.top  + rect.height / 2;
    this._spawnParticles(x, y, tapPow, s.feverActive, s.combo);
  },

  /* ── 피버 활성화 ── */
  _activateFever() {
    const s = this.state;
    s.feverActive = true;
    s.feverTimer = FEVER_DURATION + (this._getUpgradeLevel('fever_duration') * 1000);
    s.feverCount++;
    if (s.dailyProgress) {
      s.dailyProgress.feverCount = (s.dailyProgress.feverCount || 0) + 1;
    }
    document.getElementById('fever-aura').classList.remove('hidden');
    document.getElementById('panel-tap').classList.add('fever-active');
    document.getElementById('combo-section').classList.add('fever-active');
    document.getElementById('combo-bar').classList.add('fever-active');
    this.showToast('🔥 FEVER MODE!', 'warning');
  },

  _onFeverEnd() {
    document.getElementById('fever-aura').classList.add('hidden');
    document.getElementById('panel-tap').classList.remove('fever-active');
    document.getElementById('combo-section').classList.remove('fever-active');
    document.getElementById('combo-bar').classList.remove('fever-active');
  },

  /* ── 진화 ── */
  evolve() {
    const s = this.state;
    if (!s.canEvolve || s.evolutionLevel >= 30) return;
    s.evolutionLevel++;
    s.canEvolve = false;
    this._showCapture = true;
    this._captureShownFor = s.evolutionLevel;

    const evo = EVOLUTIONS[s.evolutionLevel - 1];
    this.showToast(`✨ ${evo.title}로 성장했어요!`, 'success');
    document.getElementById('ku').setAttribute('data-stage', s.evolutionLevel);
    document.getElementById('capture-section').classList.remove('hidden');
    document.getElementById('display-place').textContent = evo.place;

    this.save();
    this._checkAchievements();
    this._renderEvoSection();
    this._renderCampusPanel();
    this._renderCollectors();
  },

  /* ── 전생 ── */
  reincarnate() {
    const s = this.state;
    if (s.totalEnergy < 50000 && s.energy < 50000) {
      this.showToast('전생하려면 에너지가 50,000 이상 필요합니다', 'warning');
      return;
    }
    s.reincarnations++;
    s.permanentBonus = 1 + s.reincarnations * 0.5;
    s.energy = 0;
    s.totalEnergy = 0;
    s.tapCount = 0;
    s.combo = 0;
    s.comboTimer = 0;
    s.bestCombo = 0;
    s.feverActive = false;
    s.feverTimer = 0;
    s.feverCooldown = 0;
    s.feverCount = 0;
    s.evolutionLevel = 1;
    s.canEvolve = false;
    s.upgrades = {};
    s.collectors = {};
    s.currentEvent = null;
    s.eventTimer = 0;
    document.getElementById('ku').setAttribute('data-stage', 1);
    document.getElementById('capture-section').classList.add('hidden');
    this._onFeverEnd();
    this.save();
    this._checkAchievements();
    this._renderAll();
    this.showToast(`♻️ 전생 완료! 영구 보너스 ×${s.permanentBonus.toFixed(1)}`, 'success');
  },

  /* ── 업그레이드 구매 ── */
  buyUpgrade(id) {
    const s = this.state;
    const upg = UPGRADES.find(u => u.id === id);
    if (!upg) return;
    const lvl = s.upgrades[id] || 0;
    if (lvl >= upg.maxLevel) { this.showToast('이미 최대 레벨입니다', 'warning'); return; }
    const cost = this._upgradeCost(upg, lvl);
    if (s.energy < cost) { this.showToast('에너지가 부족합니다', 'warning'); return; }
    s.energy -= cost;
    s.upgrades[id] = lvl + 1;
    if (s.dailyProgress) {
      s.dailyProgress.buyUpgrade = (s.dailyProgress.buyUpgrade || 0) + 1;
    }
    this.showToast(`⬆️ ${upg.name} Lv.${lvl+1}`, 'success');
    this.save();
    this._renderUpgrades();
    this._renderScoreArea();
    this._updateShopTab();
  },

  /* ── 수집기 구매 ── */
  buyCollector(id) {
    const s = this.state;
    const col = COLLECTORS.find(c => c.id === id);
    if (!col) return;
    if (s.evolutionLevel < col.unlockEvo) {
      this.showToast(`진화 ${col.unlockEvo}단계에서 해금됩니다`, 'warning'); return;
    }
    const cnt = s.collectors[id] || 0;
    const cost = Math.floor(col.baseCost * Math.pow(col.costGrowth, cnt));
    if (s.energy < cost) { this.showToast('에너지가 부족합니다', 'warning'); return; }
    s.energy -= cost;
    s.collectors[id] = cnt + 1;
    if (s.dailyProgress) {
      s.dailyProgress.buyCollector = (s.dailyProgress.buyCollector || 0) + 1;
    }
    this.showToast(`🏗️ ${col.name} 추가!`, 'success');
    this.save();
    this._renderCollectors();
    this._renderScoreArea();
    this._checkAchievements();
  },

  /* ──────────────────────────────────────────────
     계산 함수들
  ────────────────────────────────────────────── */

  getTPS() {
    const s = this.state;
    const baseTap = 1 + this._getUpgradeLevel('tap_power');
    const comboMult = getComboMult(s.combo) + this._getUpgradeLevel('combo_amp') * 0.1;
    const feverMult = s.feverActive ? (FEVER_MULT + this._getUpgradeLevel('fever_mult') * 0.5) : 1;
    const eventTap  = s.currentEvent ? RANDOM_EVENTS.find(e=>e.id===s.currentEvent)?.tapBonus || 1 : 1;
    const campBonus = this._getCampusBonus();
    const lucky     = this._getLuckyBonus();
    return Math.floor(baseTap * comboMult * feverMult * eventTap * s.permanentBonus * campBonus * lucky);
  },

  getEPS() {
    const s = this.state;
    if (!s) return 0;
    let total = 0;
    const autoMult = this._getUpgradeLevel('auto_collect') > 0
      ? UPGRADES.find(u=>u.id==='auto_collect').getValue(this._getUpgradeLevel('auto_collect'))
      : 1;
    const eventAuto = s.currentEvent
      ? RANDOM_EVENTS.find(e=>e.id===s.currentEvent)?.autoBonus || 1 : 1;
    const campBonus = this._getCampusBonus();
    COLLECTORS.forEach(col => {
      const cnt = s.collectors[col.id] || 0;
      if (cnt > 0) total += col.baseProd * cnt;
    });
    return total * autoMult * eventAuto * s.permanentBonus * campBonus;
  },

  _getCampusBonus() {
    const s = this.state;
    // 캠퍼스 보너스: 해금된 마지막 장소의 배율 (간소화)
    let bonus = 1.0;
    CAMPUS_LOCATIONS.forEach(loc => {
      if (s.evolutionLevel >= loc.unlockEvo) bonus = Math.max(bonus, loc.bonusMult);
    });
    return bonus;
  },

  _getLuckyBonus() {
    const lvl = this._getUpgradeLevel('lucky_badge');
    if (lvl === 0) return 1;
    const chance = UPGRADES.find(u=>u.id==='lucky_badge').getValue(lvl);
    return Math.random() < chance ? 5 : 1;
  },

  _getComboWindow() {
    const base = COMBO_WINDOW;
    const ext  = this._getUpgradeLevel('combo_time') * 200;
    return base + ext;
  },

  _getGrowthReductionMult() {
    const lvl = this._getUpgradeLevel('growth_research');
    if (lvl === 0) return 1;
    return UPGRADES.find(u=>u.id==='growth_research').getValue(lvl);
  },

  _getUpgradeLevel(id) {
    return (this.state?.upgrades[id] || 0);
  },

  _upgradeCost(upg, currentLevel) {
    return Math.floor(upg.baseCost * Math.pow(upg.costGrowth, currentLevel));
  },

  /* ──────────────────────────────────────────────
     업적 체크
  ────────────────────────────────────────────── */

  _checkAchievements() {
    const s = this.state;
    if (!s) return;
    let newCount = 0;
    ACHIEVEMENTS.forEach(ach => {
      if (s.achievements[ach.id]) return;
      if (ach.cond(s)) {
        s.achievements[ach.id] = { unlocked: true, unlockedAt: Date.now() };
        if (ach.reward > 0) {
          s.energy += ach.reward;
          s.totalEnergy += ach.reward;
        }
        this._pendingAchievements.push(ach);
        newCount++;
      }
    });
    if (newCount > 0) {
      this._flushAchievementToasts();
      this._renderAchievements();
      this._updateAchBadge();
      this.save();
    }
  },

  _flushAchievementToasts() {
    this._pendingAchievements.forEach(ach => {
      this.showToast(`🏆 업적 달성: ${ach.name}\n${ach.rewardDesc}`, 'achievement');
    });
    this._pendingAchievements = [];
  },

  /* ──────────────────────────────────────────────
     일일 미션
  ────────────────────────────────────────────── */

  _refreshDailyMissions() {
    const s = this.state;
    if (!s) return;
    const today = new Date().toDateString();
    if (s.dailyDate !== today) {
      // 무작위로 3개 선택
      const shuffled = [...DAILY_TEMPLATES].sort(() => Math.random() - 0.5);
      s.dailyMissions = shuffled.slice(0, 3).map(t => ({ ...t, done: false }));
      s.dailyDate = today;
      s.dailyProgress = {};
    }
  },

  _checkDailyMissions() {
    const s = this.state;
    if (!s?.dailyMissions) return;
    let changed = false;
    s.dailyMissions.forEach(m => {
      if (m.done) return;
      const prog = s.dailyProgress[m.type] || 0;
      if (prog >= m.target) {
        m.done = true;
        s.energy += m.reward;
        s.totalEnergy += m.reward;
        changed = true;
        this.showToast(`📋 미션 완료: ${m.name}\n+${this.formatNum(m.reward)} 에너지!`, 'success');
      }
    });
    if (changed) { this.save(); this._renderDailyMissions(); }
  },

  /* ──────────────────────────────────────────────
     랜덤 이벤트
  ────────────────────────────────────────────── */

  _triggerRandomEvent() {
    const s = this.state;
    const ev = RANDOM_EVENTS[Math.floor(Math.random() * RANDOM_EVENTS.length)];
    s.currentEvent = ev.id;
    s.eventTimer = ev.duration * 1000;

    document.getElementById('event-modal-icon').textContent = ev.icon;
    document.getElementById('event-modal-title').textContent = ev.name;
    document.getElementById('event-modal-desc').textContent = ev.desc + ` (${ev.duration}초 동안)`;
    this._openModal('modal-event');
  },

  _updateEventBanner() {
    const s = this.state;
    const banner = document.getElementById('event-banner');
    if (s?.currentEvent && s.eventTimer > 0) {
      const ev = RANDOM_EVENTS.find(e => e.id === s.currentEvent);
      if (ev) {
        banner.classList.remove('hidden');
        document.getElementById('event-text').textContent = `${ev.icon} ${ev.name}`;
        document.getElementById('event-timer').textContent = `${Math.ceil(s.eventTimer/1000)}초`;
      }
    } else {
      banner.classList.add('hidden');
    }
  },

  /* ──────────────────────────────────────────────
     저장 / 불러오기
  ────────────────────────────────────────────── */

  save() {
    if (!this.state) return;
    document.getElementById('save-indicator').textContent = '저장 중';
    document.getElementById('save-indicator').className = 'save-ing';
    this.state.lastSavedAt = Date.now();
    this.state.lastTickAt  = Date.now();
    try {
      localStorage.setItem(`kuTapGame:save:${this.currentProfileId}`, JSON.stringify(this.state));
      // 프로필 lastPlayedAt 업데이트
      const profile = this.profiles.find(p => p.id === this.currentProfileId);
      if (profile) { profile.lastPlayedAt = Date.now(); this._saveProfiles(); }
      setTimeout(() => {
        document.getElementById('save-indicator').textContent = '저장됨';
        document.getElementById('save-indicator').className = 'save-ok';
      }, 500);
    } catch(e) {
      document.getElementById('save-indicator').textContent = '저장 실패';
    }
    // DB 동기화 (로그인 시, 비동기 fire-and-forget)
    if (api.isLoggedIn()) {
      const profile = this.profiles.find(p => p.id === this.currentProfileId);
      if (profile) {
        api.upsertSave(profile.name, this.state).catch(err => {
          console.warn('DB save failed:', err.message);
        });
      }
    }
  },

  _loadState(profileId) {
    try {
      const raw = localStorage.getItem(`kuTapGame:save:${profileId}`);
      if (raw) {
        const data = JSON.parse(raw);
        // 기본값 병합
        const def = createDefaultState(profileId);
        return { ...def, ...data, upgrades: { ...(data.upgrades||{}) }, collectors: { ...(data.collectors||{}) }, achievements: { ...(data.achievements||{}) } };
      }
    } catch(e) {}
    return createDefaultState(profileId);
  },

  _calcOfflineReward() {
    const s = this.state;
    const eps = this.getEPS();
    if (eps <= 0 || !s.lastTickAt) return 0;
    const maxOfflineH = MAX_OFFLINE_H + this._getUpgradeLevel('offline_note') * 2;
    const elapsed = Math.min((Date.now() - s.lastTickAt) / 1000, maxOfflineH * 3600);
    if (elapsed < 10) return 0;
    return Math.floor(eps * elapsed * 0.5); // 50% 효율
  },

  /* ──────────────────────────────────────────────
     프로필 관리
  ────────────────────────────────────────────── */

  _loadProfiles() {
    try {
      const raw = localStorage.getItem('kuTapGame:profiles');
      if (raw) return JSON.parse(raw);
    } catch(e) {}
    return [];
  },

  _saveProfiles() {
    localStorage.setItem('kuTapGame:profiles', JSON.stringify(this.profiles));
  },

  _createProfile(name) {
    const profile = {
      id: `profile_${Date.now()}_${Math.random().toString(36).slice(2,7)}`,
      name,
      createdAt: Date.now(),
      lastPlayedAt: Date.now(),
    };
    this.profiles.push(profile);
    this._saveProfiles();
    return profile;
  },

  _deleteProfile(id) {
    const profile = this.profiles.find(p => p.id === id);
    this.profiles = this.profiles.filter(p => p.id !== id);
    this._saveProfiles();
    localStorage.removeItem(`kuTapGame:save:${id}`);
    if (api.isLoggedIn() && profile) {
      api.deleteSave(profile.name).catch(err => {
        console.warn('DB delete failed:', err.message);
      });
    }
  },

  _onCreateProfile() {
    // 저장된 프로필이 선택된 경우 → 해당 프로필로 시작
    if (this._selectedInitProfileId) {
      this._loadAndStart(this._selectedInitProfileId);
      return;
    }
    // 새 프로필 이름이 입력된 경우 → 생성 후 시작
    const input = document.getElementById('init-profile-name');
    const name = input.value.trim();
    if (name.length < 2) { this.showToast('프로필을 선택하거나 닉네임을 입력해주세요', 'warning'); return; }
    const profile = this._createProfile(name);
    this._loadAndStart(profile.id);
  },

  _onAddProfile() {
    const input = document.getElementById('new-profile-input');
    const name = input.value.trim();
    if (name.length < 2) { this.showToast('닉네임은 2자 이상 입력해주세요', 'warning'); return; }
    this._createProfile(name);
    input.value = '';
    this._renderProfilePanel();
    this.showToast('프로필이 추가되었습니다', 'success');
  },

  async switchProfile(id) {
    if (id === this.currentProfileId) return;
    this.save();
    this.currentProfileId = id;
    // DB에서 복원된 프로필은 localStorage가 비어 있을 수 있으므로 로드 시도
    if (api.isLoggedIn()) {
      const profile  = this.profiles.find(p => p.id === id);
      const hasLocal = !!localStorage.getItem(`kuTapGame:save:${id}`);
      if (profile && !hasLocal) {
        try {
          const row = await api.loadSave(profile.name);
          if (row?.save_data) {
            localStorage.setItem(`kuTapGame:save:${id}`, JSON.stringify(row.save_data));
          }
        } catch (e) { /* DB 없으면 새 게임으로 시작 */ }
      }
    }
    this.state = this._loadState(id);
    this._refreshDailyMissions();
    document.getElementById('ku').setAttribute('data-stage', this.state.evolutionLevel);
    if (this.state.evolutionLevel >= this._captureShownFor) {
      document.getElementById('capture-section').classList.add('hidden');
    }
    this._renderAll();
    this._updateShopTab();
    this.showToast(`프로필 전환: ${this.profiles.find(p=>p.id===id)?.name}`, 'success');
  },

  /* ──────────────────────────────────────────────
     렌더링 함수들
  ────────────────────────────────────────────── */

  _renderAll() {
    this._renderScoreArea();
    this._renderEvoSection();
    this._renderComboFever();
    this._renderUpgrades();
    this._renderCollectors();
    this._renderCampusPanel();
    this._renderAchievements();
    this._renderProfilePanel();
    this._updateEventBanner();
    this._updateAchBadge();
    this._updateShopTab();
    const s = this.state;
    document.getElementById('display-username').textContent = this.profiles.find(p=>p.id===this.currentProfileId)?.name || '건덕이유저';
    document.getElementById('display-place').textContent = EVOLUTIONS[s.evolutionLevel-1]?.place || '건국대학교';
    document.getElementById('ku').setAttribute('data-stage', s.evolutionLevel);
    if (s.feverActive) {
      document.getElementById('fever-aura').classList.remove('hidden');
      document.getElementById('panel-tap').classList.add('fever-active');
    }
  },

  _renderScoreArea() {
    const s = this.state;
    if (!s) return;
    document.getElementById('energy-num').textContent = this.formatNum(Math.floor(s.energy));
    document.getElementById('stat-total').textContent = this.formatNum(Math.floor(s.totalEnergy));
    document.getElementById('stat-eps').textContent   = this.formatNum(this.getEPS(), 1);
    document.getElementById('stat-tps').textContent   = this.formatNum(this.getTPS());
    this._checkDailyMissions();
  },

  _renderEvoSection() {
    const s = this.state;
    if (!s) return;
    const evo = EVOLUTIONS[s.evolutionLevel - 1];
    document.getElementById('evo-stage-badge').textContent = `Lv.${s.evolutionLevel}`;
    document.getElementById('evo-title-text').textContent  = evo.title;
    const btn = document.getElementById('btn-evolve');
    if (s.evolutionLevel >= 30) {
      btn.classList.add('hidden');
      document.getElementById('evo-bar').style.width = '100%';
      document.getElementById('evo-bar-label').textContent = '최대 단계 달성!';
    } else {
      const nextLvl = s.evolutionLevel + 1;
      const required = Math.floor(getEvoRequired(nextLvl) * this._getGrowthReductionMult());
      const pct = Math.min((s.totalEnergy / required) * 100, 100);
      document.getElementById('evo-bar').style.width = pct.toFixed(1) + '%';
      document.getElementById('evo-bar-label').textContent =
        `${this.formatNum(Math.floor(s.totalEnergy))} / ${this.formatNum(required)}`;
      if (s.canEvolve) {
        btn.classList.remove('hidden');
      } else {
        btn.classList.add('hidden');
      }
    }
  },

  _renderComboFever() {
    const s = this.state;
    if (!s) return;
    document.getElementById('combo-num').textContent = s.combo;
    const mult = getComboMult(s.combo) + this._getUpgradeLevel('combo_amp') * 0.1;
    const multBadge = document.getElementById('combo-mult-badge');
    multBadge.textContent = mult > 1 ? `×${mult.toFixed(1)}` : '';

    // 콤보 게이지
    const window = this._getComboWindow();
    const pct = s.combo > 0 ? Math.max(0, 100 - (s.comboTimer / window * 100)) : 0;
    document.getElementById('combo-bar').style.width = pct + '%';

    // 피버
    const feverInd = document.getElementById('fever-indicator');
    if (s.feverActive) {
      feverInd.classList.remove('hidden');
      document.getElementById('fever-time').textContent = `${(s.feverTimer/1000).toFixed(1)}s`;
    } else {
      feverInd.classList.add('hidden');
    }
  },

  _renderEventBanner() {
    this._updateEventBanner();
  },

  _renderSaveBadge() {
    // 5초마다 업데이트되는 저장 상태는 save()에서 처리
  },

  _renderUpgrades() {
    const s = this.state;
    if (!s) return;
    const el = document.getElementById('upgrades-list');
    el.innerHTML = '';
    UPGRADES.forEach(upg => {
      const lvl  = s.upgrades[upg.id] || 0;
      const cost = this._upgradeCost(upg, lvl);
      const maxed = lvl >= upg.maxLevel;
      const canAfford = s.energy >= cost;

      const card = document.createElement('div');
      card.className = 'upgrade-card';

      card.innerHTML = `
        <div class="card-icon">${upg.icon}</div>
        <div class="card-info">
          <div class="card-name">${upg.name}</div>
          <div class="card-level">Lv.${lvl} / ${upg.maxLevel}</div>
          <div class="card-desc">${upg.effect(lvl)}</div>
          ${lvl < upg.maxLevel ? `<div class="card-desc" style="color:var(--ku-green)">다음: ${upg.effect(lvl+1)}</div>` : ''}
        </div>
        <div class="card-buy-col">
          <button class="btn-buy" ${maxed || !canAfford ? 'disabled' : ''} data-id="${upg.id}">
            ${maxed ? 'MAX' : '⚡' + this.formatNum(cost)}
          </button>
        </div>
      `;
      card.querySelector('.btn-buy').addEventListener('click', () => this.buyUpgrade(upg.id));
      el.appendChild(card);
    });
  },

  _renderCollectors() {
    const s = this.state;
    if (!s) return;
    const el = document.getElementById('collectors-list');
    el.innerHTML = '';
    COLLECTORS.forEach(col => {
      const cnt = s.collectors[col.id] || 0;
      const cost = Math.floor(col.baseCost * Math.pow(col.costGrowth, cnt));
      const locked = s.evolutionLevel < col.unlockEvo;
      const canAfford = !locked && s.energy >= cost;

      const card = document.createElement('div');
      card.className = `collector-card${locked ? ' locked' : ''}`;
      card.innerHTML = `
        <div class="card-icon">${col.icon}</div>
        <div class="card-info">
          <div class="card-name">${col.name}</div>
          <div class="card-level">보유 ${cnt}개 · 초당 ${this.formatNum(col.baseProd * Math.max(cnt,1), 1)}</div>
          <div class="card-desc">${col.desc}</div>
          ${locked ? `<div class="card-lock-msg">🔒 진화 ${col.unlockEvo}단계 달성 시 해금</div>` : ''}
        </div>
        <div class="card-buy-col">
          ${locked ? '' : `<button class="btn-buy" ${!canAfford ? 'disabled' : ''} data-id="${col.id}">⚡${this.formatNum(cost)}</button>`}
          <div class="card-count">${cnt > 0 ? `×${cnt}` : ''}</div>
        </div>
      `;
      if (!locked) {
        card.querySelector('.btn-buy')?.addEventListener('click', () => this.buyCollector(col.id));
      }
      el.appendChild(card);
    });
  },

  _renderCampusPanel() {
    const s = this.state;
    if (!s) return;
    const el = document.getElementById('campus-list');
    el.innerHTML = '';
    CAMPUS_LOCATIONS.forEach(loc => {
      const unlocked = s.evolutionLevel >= loc.unlockEvo;
      const current  = EVOLUTIONS[s.evolutionLevel-1]?.place === loc.name;
      const card = document.createElement('div');
      card.className = `campus-card${!unlocked ? ' locked' : ''}${current ? ' current' : ''}`;
      card.innerHTML = `
        <div class="campus-icon">${loc.icon}</div>
        <div class="campus-info">
          <div class="campus-name">${loc.name}</div>
          <div class="campus-desc">${unlocked ? loc.desc : `진화 ${loc.unlockEvo}단계에서 해금됩니다`}</div>
          ${unlocked ? `<div class="campus-bonus">🌟 ${loc.bonus}</div>` : ''}
        </div>
        ${current ? '<span class="campus-badge">현재</span>' : (unlocked ? '<span class="campus-badge" style="background:var(--ku-gray3)">해금</span>' : '<span class="campus-badge locked-badge">🔒</span>')}
      `;
      el.appendChild(card);
    });

    // 전생 섹션 업데이트
    document.getElementById('ri-count').textContent = `${s.reincarnations}회`;
    document.getElementById('ri-bonus').textContent = `×${s.permanentBonus.toFixed(1)}`;
    document.getElementById('ri-next-bonus').textContent = `×${(1 + (s.reincarnations+1)*0.5).toFixed(1)}`;
    const canRI = s.totalEnergy >= 50000 || s.energy >= 50000;
    document.getElementById('btn-reincarnate').disabled = !canRI;
    document.getElementById('ri-req-text').textContent = canRI
      ? '전생 조건을 달성했습니다!'
      : `전생하려면 누적 에너지 50,000이 필요합니다 (현재: ${this.formatNum(Math.floor(s.totalEnergy))})`;
  },

  _renderAchievements() {
    const s = this.state;
    if (!s) return;
    const done  = ACHIEVEMENTS.filter(a => s.achievements[a.id]);
    const total = ACHIEVEMENTS.length;
    document.getElementById('ach-summary').innerHTML =
      `<span>달성 ${done.length} / ${total}</span>` +
      `<div style="flex:1;height:6px;background:var(--ku-gray2);border-radius:3px;overflow:hidden">` +
      `<div style="width:${(done.length/total*100).toFixed(0)}%;height:100%;background:var(--ku-green-mid)"></div></div>`;

    const el = document.getElementById('achievements-list');
    el.innerHTML = '';
    ACHIEVEMENTS.forEach(ach => {
      const achData = s.achievements[ach.id];
      const isDone  = !!achData;
      const card = document.createElement('div');
      card.className = `ach-card${isDone ? ' done' : ''}`;
      const date = isDone ? new Date(achData.unlockedAt).toLocaleDateString('ko-KR') : '';
      card.innerHTML = `
        <div class="ach-icon">${ach.icon}</div>
        <div class="ach-info">
          <div class="ach-name">${ach.name}</div>
          <div class="ach-desc">${ach.desc}</div>
          <div class="ach-reward">보상: ${ach.rewardDesc}</div>
          ${isDone ? `<span class="ach-date">${date} 달성</span>` : ''}
        </div>
        <div class="ach-status">${isDone ? '✅' : '⬜'}</div>
      `;
      el.appendChild(card);
    });
  },

  _renderProfilePanel() {
    const s = this.state;

    // 계정 정보 렌더링
    const accountEl = document.getElementById('auth-account-info');
    if (api.isLoggedIn()) {
      accountEl.innerHTML = `
        <div class="auth-account-row">
          <div>
            <div class="auth-account-name">@${api.getUser()}</div>
            <div class="auth-account-label">로그인된 계정</div>
          </div>
          <button class="btn-logout" id="btn-logout">로그아웃</button>
        </div>`;
      document.getElementById('btn-logout').addEventListener('click', () => {
        if (!confirm('로그아웃 하시겠습니까?')) return;
        api.logout();
        location.reload();
      });
    } else {
      accountEl.innerHTML = '';
    }

    const el = document.getElementById('profile-list-main');
    el.innerHTML = '';
    this.profiles.forEach(profile => {
      const item = document.createElement('div');
      item.className = `profile-item${profile.id === this.currentProfileId ? ' active-profile' : ''}`;
      const initial = profile.name.charAt(0).toUpperCase();
      const lastPlay = profile.lastPlayedAt
        ? new Date(profile.lastPlayedAt).toLocaleDateString('ko-KR') : '-';
      item.innerHTML = `
        <div class="profile-avatar">${initial}</div>
        <div class="profile-info">
          <div class="profile-name">${profile.name}</div>
          <div class="profile-meta">최근 플레이: ${lastPlay}</div>
        </div>
        <div class="profile-actions">
          ${profile.id !== this.currentProfileId
            ? `<button class="btn-profile-switch" data-id="${profile.id}">전환</button>` : '<span style="font-size:11px;color:var(--ku-green);font-weight:700">현재</span>'}
          ${this.profiles.length > 1 ? `<button class="btn-profile-delete" data-id="${profile.id}">삭제</button>` : ''}
        </div>
      `;
      item.querySelectorAll('.btn-profile-switch').forEach(btn =>
        btn.addEventListener('click', () => this.switchProfile(btn.dataset.id)));
      item.querySelectorAll('.btn-profile-delete').forEach(btn =>
        btn.addEventListener('click', () => {
          if (!confirm(`'${profile.name}' 프로필을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`)) return;
          if (profile.id === this.currentProfileId) {
            this.showToast('현재 플레이 중인 프로필은 삭제할 수 없습니다', 'warning'); return;
          }
          this._deleteProfile(profile.id);
          this._renderProfilePanel();
          this.showToast('프로필이 삭제되었습니다');
        }));
      el.appendChild(item);
    });

    // 통계
    if (s) {
      const statsEl = document.getElementById('profile-stats');
      statsEl.innerHTML = `
        <div class="stat-row"><span>탭 횟수</span><span>${this.formatNum(s.tapCount)}회</span></div>
        <div class="stat-row"><span>최고 콤보</span><span>${s.bestCombo}콤보</span></div>
        <div class="stat-row"><span>피버 횟수</span><span>${s.feverCount}회</span></div>
        <div class="stat-row"><span>진화 단계</span><span>Lv.${s.evolutionLevel}</span></div>
        <div class="stat-row"><span>전생 횟수</span><span>${s.reincarnations}회</span></div>
        <div class="stat-row"><span>영구 보너스</span><span>×${s.permanentBonus.toFixed(1)}</span></div>
        <div class="stat-row"><span>누적 에너지</span><span>${this.formatNum(Math.floor(s.totalEnergy))}</span></div>
        <div class="stat-row"><span>초당 자동 수집</span><span>${this.formatNum(this.getEPS(), 1)}/s</span></div>
      `;
    }
  },

  _renderInitProfileList() {
    const el = document.getElementById('saved-profiles-list');
    el.innerHTML = '';
    this.profiles.forEach(profile => {
      const item = document.createElement('div');
      item.className = 'init-profile-item';
      item.dataset.profileId = profile.id;
      const initial = profile.name.charAt(0).toUpperCase();
      const lastPlay = profile.lastPlayedAt
        ? new Date(profile.lastPlayedAt).toLocaleDateString('ko-KR') : '-';
      item.innerHTML = `
        <div class="profile-avatar">${initial}</div>
        <div>
          <div class="profile-name">${profile.name}</div>
          <div class="profile-meta">최근 플레이: ${lastPlay}</div>
        </div>
        <span class="init-profile-check">✓</span>
      `;
      item.addEventListener('click', () => {
        // 선택 상태 토글
        this._selectedInitProfileId = profile.id;
        // 모든 항목 선택 해제 후 현재 항목 선택
        el.querySelectorAll('.init-profile-item').forEach(el => el.classList.remove('selected'));
        item.classList.add('selected');
        // 닉네임 입력 필드 비우기 (선택과 입력이 충돌하지 않도록)
        document.getElementById('init-profile-name').value = '';
        // 시작하기 버튼 텍스트 업데이트
        document.getElementById('btn-create-profile').textContent = `${profile.name}으로 시작하기`;
      });
      el.appendChild(item);
    });
  },

  _renderDailyMissions() {
    const s = this.state;
    if (!s?.dailyMissions) return;
    const el = document.getElementById('daily-missions-list');
    el.innerHTML = '';
    s.dailyMissions.forEach(m => {
      const prog = Math.min(s.dailyProgress?.[m.type] || 0, m.target);
      const pct  = (prog / m.target * 100).toFixed(0);
      const done = m.done;
      const item = document.createElement('div');
      item.className = `daily-mission-item${done ? ' dm-done' : ''}`;
      item.innerHTML = `
        <div class="dm-check">${done ? '✅' : '⬜'}</div>
        <div class="dm-info">
          <div class="dm-name">${m.name}</div>
          <div class="dm-progress">${m.desc} (${Math.floor(prog)} / ${m.target})</div>
          <div class="dm-bar-wrap"><div class="dm-bar" style="width:${pct}%"></div></div>
        </div>
        <div class="dm-reward">+${this.formatNum(m.reward)}⚡</div>
      `;
      el.appendChild(item);
    });
  },

  _updateShopTab() {
    const s = this.state;
    if (!s) return;
    // 구매 가능한 아이템 수 배지
    let count = 0;
    UPGRADES.forEach(upg => {
      const lvl = s.upgrades[upg.id] || 0;
      if (lvl < upg.maxLevel && s.energy >= this._upgradeCost(upg, lvl)) count++;
    });
    COLLECTORS.forEach(col => {
      if (s.evolutionLevel < col.unlockEvo) return;
      const cnt  = s.collectors[col.id] || 0;
      const cost = Math.floor(col.baseCost * Math.pow(col.costGrowth, cnt));
      if (s.energy >= cost) count++;
    });
    const badge = document.getElementById('shop-badge');
    if (count > 0) { badge.textContent = count; badge.classList.remove('hidden'); }
    else badge.classList.add('hidden');
  },

  _updateAchBadge() {
    const s = this.state;
    if (!s) return;
    const newAch = ACHIEVEMENTS.filter(a => s.achievements[a.id]).length;
    const badge  = document.getElementById('ach-badge');
    badge.classList.add('hidden');
  },

  /* ──────────────────────────────────────────────
     탭 전환
  ────────────────────────────────────────────── */

  _switchTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelector(`.tab-btn[data-tab="${tabName}"]`).classList.add('active');
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    document.getElementById(`panel-${tabName}`).classList.add('active');

    // 탭 전환 시 렌더링 갱신
    if (tabName === 'shop') { this._renderUpgrades(); this._renderCollectors(); }
    if (tabName === 'campus') this._renderCampusPanel();
    if (tabName === 'achievements') this._renderAchievements();
    if (tabName === 'profile') this._renderProfilePanel();
  },

  /* ──────────────────────────────────────────────
     파티클 효과
  ────────────────────────────────────────────── */

  _spawnParticles(cx, cy, value, isFever, combo) {
    const layer = document.getElementById('particle-layer');
    const rect  = layer.getBoundingClientRect();

    // +숫자 팝업
    const pop = document.createElement('div');
    pop.className = 'particle';
    const col = isFever ? '#ff6600' : combo >= 25 ? '#e00' : combo >= 10 ? '#f5a623' : 'var(--ku-green)';
    const sz  = isFever ? 20 : combo >= 15 ? 16 : 14;
    pop.style.cssText = `
      left: ${cx - rect.left + (Math.random()-0.5)*30}px;
      top:  ${cy - rect.top  - 20}px;
      color: ${col};
      font-size: ${sz}px;
    `;
    pop.textContent = `+${this.formatNum(value)}`;
    layer.appendChild(pop);
    setTimeout(() => pop.remove(), 900);

    // 도트 파티클
    const colors = isFever
      ? ['#ff6600','#ffaa00','#ff3300']
      : ['var(--ku-green-light)','var(--ku-yellow)','var(--ku-sky)','var(--ku-pink)'];
    const count = isFever ? 8 : 4;
    for (let i = 0; i < count; i++) {
      const dot = document.createElement('div');
      dot.className = 'particle-dot';
      const angle = (i / count) * Math.PI * 2;
      const dist  = 30 + Math.random() * 30;
      dot.style.cssText = `
        left: ${cx - rect.left}px;
        top:  ${cy - rect.top}px;
        background: ${colors[i % colors.length]};
        --tx: ${Math.cos(angle)*dist}px;
        --ty: ${Math.sin(angle)*dist}px;
      `;
      layer.appendChild(dot);
      setTimeout(() => dot.remove(), 700);
    }
  },

  /* ──────────────────────────────────────────────
     캡쳐 기능
  ────────────────────────────────────────────── */

  captureGrowth() {
    const s = this.state;
    const canvas = document.getElementById('capture-canvas');
    const ctx    = canvas.getContext('2d');
    canvas.width  = 400;
    canvas.height = 500;

    // 배경
    const bg = ctx.createLinearGradient(0, 0, 400, 500);
    bg.addColorStop(0, '#e8f7ee');
    bg.addColorStop(1, '#d0eedd');
    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.roundRect(0, 0, 400, 500, 24);
    ctx.fill();

    // 헤더 배경
    ctx.fillStyle = '#1b8a4a';
    ctx.beginPath();
    ctx.roundRect(0, 0, 400, 80, [24, 24, 0, 0]);
    ctx.fill();

    // 헤더 텍스트
    ctx.fillStyle = 'white';
    ctx.font = 'bold 28px Pretendard, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('건덕이 탭게임 ver2', 200, 38);
    ctx.font = '16px Pretendard, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.fillText('건국대학교 마스코트 건덕이', 200, 62);

    // 캐릭터 이모지 (단계별)
    const stageEmojis = ['🐣','🐥','📚','🎓','🎸','🌊','📣','📝','⚙️','🧪','🎨','💼','⚖️','🔬','🎪','🎆','🤝','😰','🌙','🏅','🔭','💡','🌍','👑','📜','🦸','⭐','🏆','🛡️','✨'];
    ctx.font = '80px serif';
    ctx.textAlign = 'center';
    ctx.fillText(stageEmojis[(s.evolutionLevel - 1) % stageEmojis.length], 200, 200);

    // 진화 단계
    ctx.fillStyle = '#1b8a4a';
    ctx.font = 'bold 32px Pretendard, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`Lv.${s.evolutionLevel}`, 200, 260);

    ctx.fillStyle = '#333';
    ctx.font = 'bold 22px Pretendard, sans-serif';
    const evo = EVOLUTIONS[s.evolutionLevel - 1];
    ctx.fillText(evo.title, 200, 295);

    // 구분선
    ctx.strokeStyle = '#c0ddc8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(40, 315); ctx.lineTo(360, 315);
    ctx.stroke();

    // 스토리
    ctx.fillStyle = '#555';
    ctx.font = '14px Pretendard, sans-serif';
    const storyLines = this._wrapText(ctx, evo.story, 320);
    storyLines.forEach((line, i) => {
      ctx.fillText(line, 200, 340 + i * 22);
    });

    // 하단 정보
    ctx.fillStyle = '#888';
    ctx.font = '13px Pretendard, sans-serif';
    const profile = this.profiles.find(p => p.id === this.currentProfileId);
    ctx.fillText(`${profile?.name || '건덕이유저'} · 누적 ${this.formatNum(Math.floor(s.totalEnergy))} 에너지`, 200, 440);
    ctx.fillText(new Date().toLocaleDateString('ko-KR', { year:'numeric', month:'long', day:'numeric' }), 200, 462);

    // 건국대 태그
    ctx.fillStyle = '#1b8a4a';
    ctx.font = 'bold 13px Pretendard, sans-serif';
    ctx.fillText('🏫 건국대학교 마스코트 건덕이와 함께', 200, 487);

    // 다운로드
    const link = document.createElement('a');
    const stagePad = String(s.evolutionLevel).padStart(2, '0');
    const pName    = (profile?.name || 'ku').replace(/[^a-zA-Z0-9가-힣]/g, '_');
    link.download = `ku-growth-stage-${stagePad}-${pName}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    this.showToast('📸 성장 기념 사진이 저장되었습니다!', 'success');
  },

  _wrapText(ctx, text, maxWidth) {
    const words = text.split('');
    const lines = [];
    let line = '';
    for (const char of words) {
      const test = line + char;
      if (ctx.measureText(test).width > maxWidth && line) {
        lines.push(line);
        line = char;
      } else {
        line = test;
      }
    }
    if (line) lines.push(line);
    return lines;
  },

  /* ──────────────────────────────────────────────
     유틸
  ────────────────────────────────────────────── */

  formatNum(n, decimals = 0) {
    if (n === undefined || n === null) return '0';
    if (n >= 1e12) return (n / 1e12).toFixed(1) + 'T';
    if (n >= 1e9)  return (n / 1e9).toFixed(1)  + 'B';
    if (n >= 1e6)  return (n / 1e6).toFixed(1)  + 'M';
    if (n >= 1e4)  return (n / 1e3).toFixed(1)  + 'K';
    if (decimals > 0) return n.toFixed(decimals);
    return Math.floor(n).toLocaleString('ko-KR');
  },

  showToast(msg, type = '') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = msg;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 2600);
  },

  _openModal(id) {
    document.getElementById(id).classList.remove('hidden');
  },

  _closeModal(id) {
    document.getElementById(id).classList.add('hidden');
  },
};

/* ──────────────────────────────────────────────
   초기 실행
────────────────────────────────────────────── */

window.addEventListener('DOMContentLoaded', () => {
  game.init();
});
