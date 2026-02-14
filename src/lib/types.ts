export interface Skill {
  name: string;
  level: "beginner" | "intermediate" | "advanced";
  category?: string;
}

export interface Profile {
  id: string;
  name: string;
  email: string;
  faculty: string;
  bio: string;
  avatar_url: string;
  skills_to_teach: Skill[];
  skills_to_learn: Skill[];
  availability: string[];
  preferred_mode: "online" | "offline" | "both";
  contact: string;
  rating: number;
  total_ratings: number;
  xp: number;
  last_seen: string;
  created_at: string;
}

export interface Session {
  id: string;
  teacher_id: string;
  learner_id: string;
  skill: string;
  date: string;
  time: string;
  mode: "online" | "offline";
  location: string;
  status: "pending" | "accepted" | "completed" | "cancelled";
  teacher_rating?: number;
  learner_rating?: number;
  teacher_feedback?: string;
  learner_feedback?: string;
  notes: string;
  created_at: string;
}

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  type: "text" | "resource" | "audio" | "image" | "document";
  read: boolean;
  delivered: boolean;
  created_at: string;
  reply_to?: string | null;
  reply_preview?: string | null;
  reply_sender_id?: string | null;
  deleted_at?: string | null;
  pinned?: boolean;
  edited_at?: string | null;
  forwarded_from?: string | null;
  reactions?: Reaction[];
}

export interface Reaction {
  id: string;
  message_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  link: string;
  read: boolean;
  created_at: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export const FACULTIES = [
  "College of Engineering",
  "College of Science",
  "College of Art & Built Environment",
  "College of Humanities & Social Sciences",
  "College of Health Sciences",
  "College of Agriculture & Natural Resources",
];

export const SKILL_CATEGORIES = [
  "Programming",
  "Design",
  "Mathematics",
  "Languages",
  "Science",
  "Business",
  "Engineering",
  "Music & Arts",
  "Communication",
  "Other",
];

export const DAYS_OF_WEEK = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];
