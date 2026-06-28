import { accounts } from "@/data/mock-accounts";
import { getDateRange } from "@/lib/calendar";
import { productPeriod } from "@/lib/constants";
import type { ContentType, GrowthTask, TaskStatus } from "@/lib/types";

const teacherContent: Array<{
  contentType: ContentType;
  suggestedTitle: string;
  hook: string;
  requiredAssets: string[];
  cta: string;
}> = [
  {
    contentType: "提问笔记",
    suggestedTitle: "重庆三升四家长，暑假英语最该查这 3 件事",
    hook: "从家长最常见的开学焦虑切入，先定位问题再决定补什么。",
    requiredAssets: ["课堂板书局部", "能力自查表", "老师出镜 10 秒"],
    cta: "评论“自查”，领取开学前英语自查表。",
  },
  {
    contentType: "资料分析",
    suggestedTitle: "孩子单词背得慢，可能不是记忆力问题",
    hook: "把单词慢拆成自然拼读、听音辨音、复现频次三个原因。",
    requiredAssets: ["资料截图局部", "练习单局部", "错题示例"],
    cta: "私信“单词”，做一次开学前词汇定位。",
  },
  {
    contentType: "课堂互动视频",
    suggestedTitle: "英语不开口的孩子，第一步不是逼他说",
    hook: "用课堂互动片段说明安全感、句型支架和正反馈的重要性。",
    requiredAssets: ["授权课堂片段", "互动问题板书", "不露脸学员手部镜头"],
    cta: "评论“开口”，领取 7 天表达练习卡。",
  },
  {
    contentType: "板书分享",
    suggestedTitle: "这块板书，能看出孩子句型到底卡在哪",
    hook: "用板书拆解句型表达问题，把家长焦虑转成可诊断问题。",
    requiredAssets: ["课堂板书", "句型框架局部", "错因标注"],
    cta: "评论“句型”，领取开学句型自查表。",
  },
  {
    contentType: "学员展示",
    suggestedTitle: "一个不敢开口的孩子，先从这 2 句开始",
    hook: "用授权片段展示表达支架，不做夸张承诺。",
    requiredAssets: ["授权学员片段", "不露姓名画面", "老师反馈局部"],
    cta: "私信“表达”，预约一次能力定位。",
  },
  {
    contentType: "开学倒计时",
    suggestedTitle: "开学倒计时 14 天，英语先别乱补",
    hook: "把倒计时变成家长行动清单，引导先测再规划。",
    requiredAssets: ["倒计时清单", "学习计划局部", "资料文件夹"],
    cta: "评论“开学”，领取 14 天准备清单。",
  },
  {
    contentType: "体检转化",
    suggestedTitle: "开学前 30 分钟，看清孩子英语短板",
    hook: "把定位课包装成家长决策工具，不直接售卖课程。",
    requiredAssets: ["测评流程图", "反馈单局部", "老师沟通场景"],
    cta: "私信“体检”，预约开学前英语能力定位课。",
  },
];

const kocContent: Array<{
  contentType: ContentType;
  suggestedTitle: string;
  hook: string;
  requiredAssets: string[];
  cta: string;
}> = [
  {
    contentType: "生活化定位内容",
    suggestedTitle: "开学前，我给孩子整理了这张英语自查清单",
    hook: "以真实陪学视角分享开学准备，不做机构推荐口吻。",
    requiredAssets: ["书桌场景", "清单局部", "资料文件夹"],
    cta: "评论“清单”，一起对照孩子目前状态。",
  },
  {
    contentType: "真实问题收集",
    suggestedTitle: "三年级孩子英语不开口，是正常的吗？",
    hook: "提出同龄家长普遍困惑，收集问题和年级信息。",
    requiredAssets: ["亲子学习场景", "手写问题卡", "绘本或练习册"],
    cta: "评论孩子年级和最头疼的问题。",
  },
  {
    contentType: "资料分享",
    suggestedTitle: "开学倒计时，这 7 天英语打卡表挺实用",
    hook: "分享资料整理过程，强调自查和陪伴。",
    requiredAssets: ["打卡表局部", "文具和资料", "不含联系方式二维码"],
    cta: "评论“打卡”，互相提醒坚持 7 天。",
  },
  {
    contentType: "家长共情",
    suggestedTitle: "孩子一到英语就沉默，家长真的会很焦虑",
    hook: "承认真实陪学情绪，再引导家长说出年级和问题。",
    requiredAssets: ["陪学桌面", "手写问题", "绘本或练习册"],
    cta: "评论孩子年级，看看是不是同一类问题。",
  },
  {
    contentType: "校区周边内容",
    suggestedTitle: "在凯德等娃的时候，我会顺手做这件事",
    hook: "从商圈和陪学场景切入，引出开学准备和英语问题。",
    requiredAssets: ["商圈外景", "资料夹", "亲子动线照片"],
    cta: "同城家长可以交流开学准备经验。",
  },
];

const statuses: TaskStatus[] = ["todo", "drafting", "published", "data_filled", "reviewed"];

function buildWeeklyDates() {
  const allDates = getDateRange(productPeriod.start, productPeriod.end);
  const chunks: string[][] = [];
  for (let index = 0; index < allDates.length; index += 7) {
    chunks.push(allDates.slice(index, index + 7));
  }

  return chunks.flatMap((chunk) => {
    if (chunk.length <= 4) return chunk;
    const offsets = Array.from(new Set([0, 2, 4, chunk.length - 1]));
    return offsets.map((offset) => chunk[offset]).filter(Boolean);
  });
}

const publishingDates = buildWeeklyDates();

export const tasks: GrowthTask[] = publishingDates.flatMap((date, dateIndex) =>
  accounts.map((account, accountIndex) => {
    const source = account.type === "teacher" ? teacherContent : kocContent;
    const template = source[(dateIndex + accountIndex) % source.length];
    const status = statuses[(dateIndex + accountIndex) % statuses.length];
    const publishedLike = ["published", "data_filled", "reviewed"].includes(status);

    return {
      id: `task-${date}-${account.id}`,
      createdAt: `${date}T08:00:00`,
      updatedAt: `${date}T20:40:00`,
      assignedDate: date,
      assignedAccountId: account.id,
      campus: account.campus,
      contentType: template.contentType,
      suggestedTitle: template.suggestedTitle,
      hook: template.hook,
      requiredAssets: template.requiredAssets,
      cta: template.cta,
      complianceNote:
        account.type === "koc"
          ? "保持真实生活化表达，不伪装报名体验，不诱导虚假互动。"
          : "不夸大提分，不展示学生完整隐私，不承诺必然效果。",
      status,
      noteUrl: publishedLike ? `https://www.xiaohongshu.com/explore/${date.replaceAll("-", "")}-${accountIndex}` : undefined,
      sourceLeadIds: publishedLike && dateIndex < 12 ? [`lead-${String((accountIndex % 11) + 1).padStart(3, "0")}`] : [],
      metrics: publishedLike
        ? {
            likes: 24 + ((dateIndex + 3) * (accountIndex + 2)) % 180,
            saves: 8 + ((dateIndex + 5) * (accountIndex + 1)) % 62,
            comments: 3 + ((dateIndex + accountIndex) % 28),
            dm: account.type === "teacher" ? 1 + ((dateIndex + accountIndex) % 9) : (dateIndex + accountIndex) % 5,
            assessments: account.type === "teacher" ? (dateIndex + accountIndex) % 5 : (dateIndex + accountIndex) % 3,
            bookings: account.type === "teacher" ? (dateIndex + accountIndex) % 3 : (dateIndex + accountIndex) % 2,
          }
        : undefined,
    };
  }),
);

export const today = "2026-07-24";
