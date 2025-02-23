import { RoleType } from "@/types/enums.types";
import permissions from "./permissions.json";

/**
 * Check if user has permission to perform action on resource
 *
 * @param {string} role - User role e.g. 'admin' or 'member' etc.
 * @param {string} action - Action to perform e.g. 'create' or 'read' etc.
 * @param {string} resourceKind - Resource kind e.g. 'product' or 'category' etc.
 *
 * @returns {boolean}
 */
const checkPermissions = (
  role: RoleType,
  action: string,
  resourceKind: string
): boolean => {
  const resourcePolicy = permissions.resourcePolicies.find(
    (policy) => policy.resource === resourceKind
  );
  if (!resourcePolicy) {
    return false;
  }

  for (const rule of resourcePolicy.rules) {
    // Allow all actions for the role on the resource
    if (rule.actions.includes("*") && rule.roles.includes(role)) {
      return rule.effect === "EFFECT_ALLOW";
    }

    // Allow specific action for the role on the resource
    if (rule.actions.includes(action) && rule.roles.includes(role)) {
      return rule.effect === "EFFECT_ALLOW";
    }
  }

  return false;
};

export const permissionService = {
  checkPermissions,
};
