import { z } from "zod";

export const registerSchema = z
  .object({
    email: z.email({ error: "请输入有效的邮箱地址" }),
    nickname: z
      .string()
      .min(2, { error: "昵称至少 2 个字符" })
      .max(20, { error: "昵称最多 20 个字符" }),
    password: z
      .string()
      .min(8, { error: "密码至少 8 位" })
      .regex(/[a-zA-Z]/, { error: "密码需包含至少一个字母" })
      .regex(/[0-9]/, { error: "密码需包含至少一个数字" }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    error: "两次输入的密码不一致",
  });

export const loginSchema = z.object({
  email: z.email({ error: "请输入有效的邮箱地址" }),
  password: z.string().min(1, { error: "请输入密码" }),
});

export const emailOnlySchema = z.object({
  email: z.email({ error: "请输入有效的邮箱地址" }),
});

export const verifyEmailSchema = z.object({
  token: z.string().min(1, { error: "验证令牌不能为空" }),
});

/** 添加收藏 API 使用的 schema */
export const addFavoriteSchema = z.object({
  tutorialCardId: z.string().min(1, { error: "教程卡片 ID 不能为空" }),
  muscleGroupId: z.string().min(1, { error: "肌群 ID 不能为空" }),
});

/** 注册 API 使用的 schema（不含 confirmPassword） */
export const registerApiSchema = z.object({
  email: z.email({ error: "请输入有效的邮箱地址" }),
  nickname: z
    .string()
    .min(2, { error: "昵称至少 2 个字符" })
    .max(20, { error: "昵称最多 20 个字符" }),
  password: z
    .string()
    .min(8, { error: "密码至少 8 位" })
    .regex(/[a-zA-Z]/, { error: "密码需包含至少一个字母" })
    .regex(/[0-9]/, { error: "密码需包含至少一个数字" }),
});
