export interface LoginUser {
  id: string
  displayName: string
  username: string
  roles: string[]
  permissions: string[]
}

export interface LoginRsp {
  accessToken: string
  expiresIn: string
  user: LoginUser
}
