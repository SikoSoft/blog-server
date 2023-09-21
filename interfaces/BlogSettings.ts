export enum BlogSetting {
  ROLE_ADMIN = "role_admin",
  ROLE_GUEST = "role_guest",
  ENABLE_COMMENTS = "enable_comments",
  USE_CAPTCHA = "use_captcha",
  MIN_SCORE_AUTO_PUBLISH = "min_score_auto_publish",
  TOAST_LIFE = "toast_life",
  TEASER_MODE = "teaser_mode",
  PER_LOAD = "per_load",
  AUTO_ENTRY_URL = "auto_entry_url",
  FURTHER_READING_MIN_TAGS = "further_reading_min_tags",
  FURTHER_READING_MAX = "further_reading_max",
  SHOW_SIDEBAR = "show_sidebar",
  GITHUB_FEED = "github_feed",
  SHOW_POWERED_BY = "show_powered_by",
  ANALYZE_COMMENTS_SENTIMENT = "analyze_comments_sentiment",
  HEADER_BANNER = "header_banner",
  TOKEN_FLOOD_ATTEMPTS = "token_flood_attempts",
  TOKEN_FLOOD_TIMESPAN = "token_flood_timespan",
  SIDEBAR_BLOCK = "sidebar_block",
  FOOTER_BLOCK = "footer_block",
  USE_SRCSET = "use_srcset",
}

export interface BlogSettings {
  [BlogSetting.ROLE_ADMIN]: number;
  [BlogSetting.ROLE_GUEST]: number;
  [BlogSetting.ENABLE_COMMENTS]: 0 | 1;
  [BlogSetting.USE_CAPTCHA]: 0 | 1;
  [BlogSetting.MIN_SCORE_AUTO_PUBLISH]: number;
  [BlogSetting.TOAST_LIFE]: number;
  [BlogSetting.PER_LOAD]: number;
  [BlogSetting.TEASER_MODE]: 0 | 1;
  [BlogSetting.AUTO_ENTRY_URL]: 0 | 1;
  [BlogSetting.FURTHER_READING_MIN_TAGS]: number;
  [BlogSetting.FURTHER_READING_MAX]: number;
  [BlogSetting.SHOW_SIDEBAR]: 0 | 1;
  [BlogSetting.GITHUB_FEED]: string;
  [BlogSetting.SHOW_POWERED_BY]: 0 | 1;
  [BlogSetting.ANALYZE_COMMENTS_SENTIMENT]: 0 | 1;
  [BlogSetting.HEADER_BANNER]: number[];
  [BlogSetting.TOKEN_FLOOD_ATTEMPTS]: number;
  [BlogSetting.TOKEN_FLOOD_TIMESPAN]: number;
  [BlogSetting.SIDEBAR_BLOCK]: number;
  [BlogSetting.FOOTER_BLOCK]: number;
  [BlogSetting.USE_SRCSET]: 0 | 1;
}
