export interface UserInfo {
  username: string
  name?: string
  imgUrl?: string
  phone?: string
  points?: number
  [key: string]: any
}

const USER_INFO_KEY = 'eatease_user_info'

export function getUserInfo(): UserInfo | null {
  try {
    const data = localStorage.getItem(USER_INFO_KEY)
    return data ? JSON.parse(data) : null
  } catch {
    return null
  }
}

export function setUserInfo(info: UserInfo): void {
  localStorage.setItem(USER_INFO_KEY, JSON.stringify(info))
}

export function removeUserInfo(): void {
  localStorage.removeItem(USER_INFO_KEY)
}
