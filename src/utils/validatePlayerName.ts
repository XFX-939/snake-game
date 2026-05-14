export interface PlayerNameValidation {
  isValid: boolean;
  message: string;
}

const PLAYER_NAME_PATTERN = /^[\u4e00-\u9fa5A-Za-z0-9_]{2,12}$/u;

export function normalizePlayerName(value: string): string {
  return value.trim();
}

export function validatePlayerName(value: string): PlayerNameValidation {
  const name = normalizePlayerName(value);
  const length = Array.from(name).length;

  if (length === 0) {
    return { isValid: false, message: '请输入昵称' };
  }

  if (length < 2 || length > 12) {
    return { isValid: false, message: '昵称长度需为 2 到 12 个字符' };
  }

  if (!PLAYER_NAME_PATTERN.test(name)) {
    return { isValid: false, message: '昵称只允许中文、英文、数字、下划线' };
  }

  return { isValid: true, message: '游戏开始后本局昵称会锁定' };
}
