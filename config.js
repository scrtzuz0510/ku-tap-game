'use strict';

/* ── 타이밍 상수 ── */
const COMBO_WINDOW    = 1500;
const FEVER_THRESHOLD = 15;
const FEVER_DURATION  = 8000;
const FEVER_COOLDOWN  = 5000;
const FEVER_MULT      = 3;
const LOCAL_SAVE_MS   = 5000;
const DB_SAVE_MS      = 60000;
const TICK_MS         = 100;
const MAX_OFFLINE_H   = 6;

function getComboMult(combo) {
  if (combo >= 40) return 3.0;
  if (combo >= 25) return 2.5;
  if (combo >= 15) return 2.0;
  if (combo >= 10) return 1.5;
  if (combo >= 5)  return 1.2;
  return 1.0;
}

/* ── 진화 데이터 (30단계) ── */
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

function getEvoRequired(level) {
  if (level <= 1) return 0;
  return Math.min(Math.floor(80 * Math.pow(1.42, level - 1)), 8000000);
}

/* ── 업그레이드 (9종) ── */
const UPGRADES = [
  { id:"tap_power",      name:"탭 파워 강화",        icon:"⚡",  desc:"탭당 기본 에너지 획득량을 늘려줍니다",    baseCost:30,  costGrowth:1.5, maxLevel:50, effect:(l)=>`탭당 +${1+l} 에너지`,                getValue:(l)=>1+l },
  { id:"combo_amp",      name:"콤보 증폭기",          icon:"🔥",  desc:"콤보 배율 보너스를 높여줍니다",           baseCost:50,  costGrowth:1.6, maxLevel:20, effect:(l)=>`콤보 배율 +${(l*0.1).toFixed(1)}x`,  getValue:(l)=>l*0.1 },
  { id:"combo_time",     name:"콤보 시간 연장",       icon:"⏱️",  desc:"콤보가 유지되는 시간을 늘려줍니다",       baseCost:60,  costGrowth:1.5, maxLevel:20, effect:(l)=>`콤보 유지 +${(l*0.2).toFixed(1)}초`, getValue:(l)=>l*0.2 },
  { id:"fever_duration", name:"피버 지속 강화",       icon:"🌡️",  desc:"피버 모드 지속 시간을 늘려줍니다",        baseCost:100, costGrowth:1.7, maxLevel:15, effect:(l)=>`피버 +${l}초`,                       getValue:(l)=>l*1000 },
  { id:"fever_mult",     name:"피버 배율 강화",       icon:"💥",  desc:"피버 중 획득량 배율을 높여줍니다",        baseCost:150, costGrowth:1.8, maxLevel:10, effect:(l)=>`피버 배율 ×${(3+l*0.5).toFixed(1)}`,  getValue:(l)=>l*0.5 },
  { id:"auto_collect",   name:"자동 수집 효율",       icon:"🏗️",  desc:"모든 건물 자동 수집기 생산량을 늘려줍니다",baseCost:80,  costGrowth:1.55,maxLevel:30, effect:(l)=>`자동 수집 ×${(1+l*0.15).toFixed(2)}`, getValue:(l)=>1+l*0.15 },
  { id:"growth_research",name:"성장 연구",            icon:"🌱",  desc:"진화 필요 에너지를 줄여줍니다",           baseCost:120, costGrowth:1.65,maxLevel:20, effect:(l)=>`진화 필요량 -${l*3}%`,               getValue:(l)=>1-l*0.03 },
  { id:"lucky_badge",    name:"행운의 캠퍼스 배지",   icon:"🍀",  desc:"일정 확률로 탭 보너스가 발동합니다",      baseCost:200, costGrowth:1.6, maxLevel:10, effect:(l)=>`보너스 확률 ${l*5}% (×5)`,           getValue:(l)=>l*0.05 },
  { id:"offline_note",   name:"저장 최적화 노트",     icon:"📓",  desc:"오프라인 보상 수령 시간 한도를 늘려줍니다",baseCost:300, costGrowth:2.0, maxLevel:5,  effect:(l)=>`오프라인 보상 최대 ${MAX_OFFLINE_H+l*2}시간`, getValue:(l)=>l*2 },
];

/* ── 자동 수집기 (12종) ── */
const COLLECTORS = [
  { id:"humanities",  name:"인문학관 노트 정리팀", icon:"📝", desc:"꼼꼼한 필기로 에너지를 모아요",    baseProd:0.2,  baseCost:40,     costGrowth:1.4, unlockEvo:1  },
  { id:"engineering", name:"공학관 실험 장치",      icon:"⚙️", desc:"쉬지 않고 돌아가는 실험 기기",   baseProd:0.5,  baseCost:120,    costGrowth:1.4, unlockEvo:2  },
  { id:"student",     name:"학생회관 응원단",        icon:"📣", desc:"열정적인 응원으로 에너지 충전",   baseProd:1.2,  baseCost:350,    costGrowth:1.4, unlockEvo:3  },
  { id:"sangheo",     name:"상허연구관 연구 노트",   icon:"🔬", desc:"새벽까지 이어지는 연구의 열정",   baseProd:3.0,  baseCost:1000,   costGrowth:1.4, unlockEvo:5  },
  { id:"millennium",  name:"새천년관 아이디어 랩",   icon:"💡", desc:"반짝이는 아이디어가 에너지로",    baseProd:6.5,  baseCost:3000,   costGrowth:1.4, unlockEvo:7  },
  { id:"industry",    name:"산학협동관 프로젝트 팀", icon:"🤝", desc:"협업 시너지로 에너지 두 배!",     baseProd:14,   baseCost:8000,   costGrowth:1.4, unlockEvo:9  },
  { id:"art",         name:"예술디자인대학 스케치",  icon:"🎨", desc:"예술적 감성이 에너지로 폭발",     baseProd:30,   baseCost:22000,  costGrowth:1.4, unlockEvo:11 },
  { id:"biology",     name:"생명과학관 배양 장치",   icon:"🧬", desc:"배양 중인 에너지 조직들",         baseProd:65,   baseCost:60000,  costGrowth:1.4, unlockEvo:13 },
  { id:"law",         name:"법학관 토론 모임",       icon:"⚖️", desc:"날카로운 논리가 에너지를 만들어", baseProd:140,  baseCost:160000, costGrowth:1.4, unlockEvo:15 },
  { id:"business",    name:"경영관 전략 회의",       icon:"💼", desc:"전략적 에너지 운용으로 성장",     baseProd:300,  baseCost:400000, costGrowth:1.4, unlockEvo:18 },
  { id:"library",     name:"도서관 집중석",          icon:"📚", desc:"집중력이 에너지로 전환됩니다",    baseProd:650,  baseCost:1000000,costGrowth:1.4, unlockEvo:21 },
  { id:"lake",        name:"일감호 산책 에너지",     icon:"🌊", desc:"산책할수록 샘솟는 신선한 에너지", baseProd:1400, baseCost:2500000,costGrowth:1.4, unlockEvo:25 },
];

/* ── 업적 (21종) ── */
const ACHIEVEMENTS = [
  { id:"first_tap",     name:"첫 탭",              icon:"👆", desc:"건덕이를 처음 탭했습니다",           cond:s=>s.tapCount>=1,           reward:10,    rewardDesc:"⚡ 10" },
  { id:"tap_100",       name:"손끝의 새내기",       icon:"👋", desc:"탭 100회를 달성했습니다",            cond:s=>s.tapCount>=100,         reward:50,    rewardDesc:"⚡ 50" },
  { id:"tap_1000",      name:"폭풍 클릭러",         icon:"⚡", desc:"탭 1,000회를 달성했습니다",          cond:s=>s.tapCount>=1000,        reward:300,   rewardDesc:"⚡ 300" },
  { id:"tap_10000",     name:"탭의 신",             icon:"🌪️", desc:"탭 10,000회를 달성했습니다",         cond:s=>s.tapCount>=10000,       reward:2000,  rewardDesc:"⚡ 2,000" },
  { id:"combo_10",      name:"콤보 입문",           icon:"🔗", desc:"10콤보를 달성했습니다",              cond:s=>s.bestCombo>=10,         reward:30,    rewardDesc:"⚡ 30" },
  { id:"combo_30",      name:"콤보 마스터",         icon:"🔥", desc:"30콤보를 달성했습니다",              cond:s=>s.bestCombo>=30,         reward:200,   rewardDesc:"⚡ 200" },
  { id:"combo_50",      name:"콤보 전설",           icon:"💫", desc:"50콤보를 달성했습니다",              cond:s=>s.bestCombo>=50,         reward:1000,  rewardDesc:"⚡ 1,000" },
  { id:"fever_first",   name:"피버 첫 발동",        icon:"🌡️", desc:"피버 모드를 처음 발동했습니다",     cond:s=>s.feverCount>=1,         reward:100,   rewardDesc:"⚡ 100" },
  { id:"fever_20",      name:"피버 중독",           icon:"🔥", desc:"피버 20회를 발동했습니다",           cond:s=>s.feverCount>=20,        reward:800,   rewardDesc:"⚡ 800" },
  { id:"evo_1",         name:"첫 성장",             icon:"🌱", desc:"건덕이가 처음으로 성장했습니다",     cond:s=>s.evolutionLevel>=2,     reward:50,    rewardDesc:"⚡ 50" },
  { id:"evo_10",        name:"열 번째 성장",        icon:"🌿", desc:"진화 10단계를 달성했습니다",         cond:s=>s.evolutionLevel>=10,    reward:1000,  rewardDesc:"⚡ 1,000" },
  { id:"evo_20",        name:"스무 번째 성장",      icon:"🌳", desc:"진화 20단계를 달성했습니다",         cond:s=>s.evolutionLevel>=20,    reward:10000, rewardDesc:"⚡ 10,000" },
  { id:"evo_30",        name:"마스터 건덕이",       icon:"👑", desc:"진화 30단계를 달성했습니다!",        cond:s=>s.evolutionLevel>=30,    reward:50000, rewardDesc:"⚡ 50,000" },
  { id:"auto_10",       name:"캠퍼스 자동화",       icon:"🏗️", desc:"자동 수집기 총 10개를 보유",         cond:s=>Object.values(s.collectors).reduce((a,b)=>a+b,0)>=10, reward:500, rewardDesc:"⚡ 500" },
  { id:"all_collectors",name:"건물 컬렉터",         icon:"🏫", desc:"모든 자동 수집기를 해금했습니다",    cond:s=>COLLECTORS.every(c=>(s.collectors[c.id]||0)>=1), reward:5000, rewardDesc:"⚡ 5,000" },
  { id:"energy_1k",     name:"에너지 입문",         icon:"💰", desc:"누적 에너지 1,000 달성",             cond:s=>s.totalEnergy>=1000,     reward:100,   rewardDesc:"⚡ 100" },
  { id:"energy_100k",   name:"에너지 부자",         icon:"💎", desc:"누적 에너지 100,000 달성",           cond:s=>s.totalEnergy>=100000,   reward:5000,  rewardDesc:"⚡ 5,000" },
  { id:"energy_1m",     name:"에너지 백만장자",     icon:"🏦", desc:"누적 에너지 1,000,000 달성",         cond:s=>s.totalEnergy>=1000000,  reward:50000, rewardDesc:"⚡ 50,000" },
  { id:"reincarnate_1", name:"다시 시작하는 건덕이",icon:"♻️", desc:"전생 1회를 달성했습니다",            cond:s=>s.reincarnations>=1,     reward:0,     rewardDesc:"영구 보너스 ×1.5" },
  { id:"reincarnate_5", name:"환생의 달인",         icon:"🔄", desc:"전생 5회를 달성했습니다",            cond:s=>s.reincarnations>=5,     reward:0,     rewardDesc:"영구 보너스 누적" },
  { id:"upgrade_all",   name:"업그레이드 마스터",   icon:"⬆️", desc:"모든 업그레이드를 1레벨 이상",       cond:s=>UPGRADES.every(u=>(s.upgrades[u.id]||0)>=1), reward:2000, rewardDesc:"⚡ 2,000" },
];

/* ── 캠퍼스 탐험 장소 ── */
const CAMPUS_LOCATIONS = [
  { id:"gate",       name:"건국대학교 정문",   icon:"🏛️", desc:"건국대학교의 상징적인 정문입니다. 모든 이야기가 시작되는 곳.",            bonus:"탭 파워 +5%",     bonusMult:1.05, unlockEvo:1  },
  { id:"lake",       name:"일감호",            icon:"🌊", desc:"캠퍼스 중심부의 아름다운 호수. 오리들이 사는 일감호에서 힐링!",           bonus:"자동 수집 +5%",   bonusMult:1.05, unlockEvo:2  },
  { id:"library",    name:"도서관",            icon:"📚", desc:"지식의 보고. 24시간 열려있는 이 공간에서 공부의 열정을 불태워요.",          bonus:"탭 파워 +10%",    bonusMult:1.10, unlockEvo:4  },
  { id:"student",    name:"학생회관",          icon:"🏢", desc:"학생들의 놀이터. 편의점, 카페, 동아리방이 모여있는 소통의 공간.",           bonus:"콤보 유지 +0.5초",bonusMult:1.0,  unlockEvo:5  },
  { id:"millennium", name:"새천년관",          icon:"🏙️", desc:"현대적인 건물. 강의실과 창업지원센터가 함께 있어요.",                    bonus:"자동 수집 +15%",  bonusMult:1.15, unlockEvo:8  },
  { id:"art",        name:"예술디자인대학",    icon:"🎨", desc:"창의력이 넘치는 공간. 학생들의 작품이 캠퍼스를 수놓아요.",               bonus:"탭 파워 +20%",    bonusMult:1.20, unlockEvo:11 },
  { id:"sangheo",    name:"상허연구관",        icon:"🔬", desc:"건국대학교 연구의 심장부. 밤새워 실험하는 연구원들로 가득해요.",           bonus:"자동 수집 +25%",  bonusMult:1.25, unlockEvo:15 },
  { id:"stadium",    name:"대운동장",          icon:"🏟️", desc:"건국대 스포츠의 중심. 대동제와 운동회가 펼쳐지는 열정의 공간!",           bonus:"피버 시간 +2초",  bonusMult:1.0,  unlockEvo:16 },
  { id:"campus_all", name:"건국대학교 캠퍼스", icon:"🏫", desc:"건국대 전체를 품는 마스터 건덕이의 영역. 모든 에너지가 모여드는 곳!",     bonus:"전체 생산 +50%",  bonusMult:1.50, unlockEvo:25 },
];

/* ── 랜덤 이벤트 ── */
const RANDOM_EVENTS = [
  { id:"break",    name:"강의 쉬는 시간!", icon:"🎉", desc:"쉬는 시간 동안 탭 에너지가 2배!",      duration:20, tapBonus:2.0, autoBonus:1.0 },
  { id:"festival", name:"축제 부스 오픈!",  icon:"🎪", desc:"축제 분위기로 모든 에너지 생산 1.5배!", duration:30, tapBonus:1.5, autoBonus:1.5 },
  { id:"lake_walk",name:"일감호 산책 타임!",icon:"🌊", desc:"상쾌한 산책으로 자동 수집 3배!",       duration:25, tapBonus:1.0, autoBonus:3.0 },
  { id:"teamplay", name:"팀플 대성공!",     icon:"🤝", desc:"팀플 성공! 에너지 3배 획득!",          duration:15, tapBonus:3.0, autoBonus:2.0 },
  { id:"library",  name:"도서관 집중 모드!",icon:"📚", desc:"고요한 집중력으로 자동 수집 2배!",      duration:40, tapBonus:1.0, autoBonus:2.0 },
  { id:"rain",     name:"일감호 빗소리...", icon:"🌧️", desc:"빗소리를 들으며 탭 파워가 1.5배!",     duration:20, tapBonus:1.5, autoBonus:1.2 },
];

/* ── 일일 미션 템플릿 ── */
const DAILY_TEMPLATES = [
  { id:"tap_300",      name:"열심히 탭하기",      desc:"오늘 300번 탭하기",          target:300,  type:"tapCount",    reward:500  },
  { id:"tap_1000",     name:"탭 1000회 달성",     desc:"오늘 1000번 탭하기",         target:1000, type:"tapCount",    reward:2000 },
  { id:"fever_3",      name:"피버 3번 발동",       desc:"피버 모드를 3번 발동시키기", target:3,    type:"feverCount",  reward:1000 },
  { id:"combo_20",     name:"20콤보 달성",         desc:"20콤보를 달성하기",          target:20,   type:"maxCombo",    reward:800  },
  { id:"buy_upgrade",  name:"업그레이드 구매",     desc:"업그레이드 1번 구매하기",    target:1,    type:"buyUpgrade",  reward:300  },
  { id:"buy_collector",name:"자동 수집기 구매",    desc:"자동 수집기를 3개 구매",     target:3,    type:"buyCollector",reward:600  },
  { id:"energy_5k",    name:"에너지 5,000 모으기", desc:"5,000 에너지를 모으기",      target:5000, type:"earnEnergy",  reward:800  },
];

/* ── 기본 상태 생성 ── */
function createDefaultState(username) {
  return {
    version: 3,
    username,
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
