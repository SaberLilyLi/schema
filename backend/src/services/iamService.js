import { User } from '../models/user.js'
import { UserRole } from '../models/userRole.js'
import { RolePermission } from '../models/rolePermission.js'

export async function getUserWithIam(userId) {
  const user = await User.findById(userId).lean()
  if (!user) return null

  const userRoles = await UserRole.find({ userId }).populate('roleId').lean()
  const roleIds = userRoles.map((ur) => ur.roleId._id)
  const roleCodes = userRoles
    .map((ur) => ur.roleId?.code)
    .filter(Boolean)

  const rps = await RolePermission.find({ roleId: { $in: roleIds } })
    .populate('permissionId')
    .lean()

  const permissionCodes = [
    ...new Set(rps.map((rp) => rp.permissionId?.code).filter(Boolean)),
  ]

  return {
    user,
    roles: roleCodes,
    permissions: permissionCodes,
  }
}
