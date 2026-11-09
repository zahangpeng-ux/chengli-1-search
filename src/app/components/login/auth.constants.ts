// 暂无后端接口，先用本地固定账号做校验
export const AUTH_STORAGE_KEY = 'chengli-1-session';
export const PASSWORD_STORAGE_KEY = 'chengli-1-password';

export const SESSION_DAYS = 7;

export const LOCAL_ACCOUNT = {
  email: '176848@qq.com',
  password: '123456',
};

export function getLocalPassword(): string {
  return localStorage.getItem(PASSWORD_STORAGE_KEY) || LOCAL_ACCOUNT.password;
}

export function setLocalPassword(password: string): void {
  localStorage.setItem(PASSWORD_STORAGE_KEY, password);
}
