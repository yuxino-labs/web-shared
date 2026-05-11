export type UserProfile = {
  id: string;
  name: string;
  avatar: string;
  birthday?: string;
  accent?: string;
};

export const USERS: UserProfile[] = [
  {
    id: "dog",
    name: "WenWen",
    avatar: "https://img.yuxino.cn/static/baku.jpg",
    birthday: "1998-05-08",
    accent: "#f97316",
  },
  {
    id: "cat",
    name: "JiaJia",
    avatar: "https://img.yuxino.cn/static/kuluomi.jpg",
    birthday: "1998-06-11",
    accent: "#ec4899",
  },
  {
    id: "doro",
    name: "Doro",
    avatar: "https://img.yuxino.cn/static/doro.png",
    birthday: "2026-03-14",
    accent: "#14b8a6",
  },
  {
    id: "hazlank",
    name: "Hazlank",
    avatar: "https://img.yuxino.cn/static/hazalnk.png",
    birthday: "1998-02-13",
    accent: "#8b5cf6",
  },
];
