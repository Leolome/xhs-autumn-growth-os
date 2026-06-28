import { CrawlerError, type NoteMetrics, type ProfileMetrics } from "./types";

function stripHtml(input: string) {
  return input
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function readTitle(input: string) {
  const title = input.match(/<title[^>]*>(.*?)<\/title>/i)?.[1]?.trim();
  if (title) return title.replace(/\s*-\s*小红书.*$/i, "");
  return input.match(/"title"\s*:\s*"([^"]+)"/)?.[1] ?? "未命名内容";
}

export function parseCount(value: string | undefined) {
  if (!value) return 0;
  const normalized = value.replace(/,/g, "").trim().toLowerCase();
  const number = Number.parseFloat(normalized);
  if (Number.isNaN(number)) return 0;
  if (normalized.includes("万")) return Math.round(number * 10000);
  if (normalized.includes("千")) return Math.round(number * 1000);
  if (normalized.includes("k")) return Math.round(number * 1000);
  if (normalized.includes("m")) return Math.round(number * 1000000);
  return Math.round(number);
}

function pickCount(text: string, patterns: RegExp[]) {
  for (const pattern of patterns) {
    const value = text.match(pattern)?.[1];
    if (value) return parseCount(value);
  }
  return 0;
}

function parseJson(content: string) {
  try {
    return JSON.parse(content) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function parseProfile(content: string, url: string, accountId?: string): ProfileMetrics {
  const json = parseJson(content);
  if (json) {
    return {
      targetType: "profile",
      accountId: String(accountId ?? json.account_id ?? json.accountId ?? ""),
      profileUrl: String(json.profile_url ?? json.profileUrl ?? url),
      displayName: String(json.display_name ?? json.displayName ?? json.name ?? "公开账号"),
      followers: Number(json.followers ?? 0),
      totalLikesCollects: Number(json.total_likes_collects ?? json.totalLikesCollects ?? json.total_engagement ?? 0),
      postCount: Number(json.post_count ?? json.postCount ?? json.posts ?? 0),
      rawData: json,
    };
  }

  const text = stripHtml(content);
  const followers = pickCount(text, [/粉丝\s*([0-9.,万千kKmM]+)/, /followers["':\s]+([0-9.,万千kKmM]+)/i]);
  const totalLikesCollects = pickCount(text, [/获赞(?:与收藏)?\s*([0-9.,万千kKmM]+)/, /赞藏\s*([0-9.,万千kKmM]+)/, /likesCollects["':\s]+([0-9.,万千kKmM]+)/i]);
  const postCount = pickCount(text, [/笔记\s*([0-9.,万千kKmM]+)/, /posts?["':\s]+([0-9.,万千kKmM]+)/i]);

  if (!followers && !totalLikesCollects && !postCount) {
    throw new CrawlerError("parse_error", "未能从公开主页解析粉丝、赞藏或笔记数。");
  }

  return {
    targetType: "profile",
    accountId: accountId ?? "",
    profileUrl: url,
    displayName: readTitle(content),
    followers,
    totalLikesCollects,
    postCount,
    rawData: { title: readTitle(content), extractedTextSample: text.slice(0, 500) },
  };
}

export function parseNote(content: string, url: string, accountId?: string, noteId?: string): NoteMetrics {
  const json = parseJson(content);
  if (json) {
    return {
      targetType: "note",
      accountId: String(accountId ?? json.account_id ?? json.accountId ?? ""),
      noteId: String(noteId ?? json.note_id ?? json.noteId ?? ""),
      noteUrl: String(json.note_url ?? json.noteUrl ?? url),
      title: String(json.title ?? "公开笔记"),
      likes: Number(json.likes ?? 0),
      collects: Number(json.collects ?? json.saves ?? 0),
      comments: Number(json.comments ?? 0),
      publishTime: json.publish_time ? String(json.publish_time) : undefined,
      rawData: json,
    };
  }

  const text = stripHtml(content);
  const likes = pickCount(text, [/点赞\s*([0-9.,万千kKmM]+)/, /likes["':\s]+([0-9.,万千kKmM]+)/i]);
  const collects = pickCount(text, [/收藏\s*([0-9.,万千kKmM]+)/, /collects?["':\s]+([0-9.,万千kKmM]+)/i, /saves?["':\s]+([0-9.,万千kKmM]+)/i]);
  const comments = pickCount(text, [/评论\s*([0-9.,万千kKmM]+)/, /comments?["':\s]+([0-9.,万千kKmM]+)/i]);

  if (!likes && !collects && !comments) {
    throw new CrawlerError("parse_error", "未能从公开笔记解析点赞、收藏或评论数。");
  }

  return {
    targetType: "note",
    accountId,
    noteId,
    noteUrl: url,
    title: readTitle(content),
    likes,
    collects,
    comments,
    rawData: { title: readTitle(content), extractedTextSample: text.slice(0, 500) },
  };
}
