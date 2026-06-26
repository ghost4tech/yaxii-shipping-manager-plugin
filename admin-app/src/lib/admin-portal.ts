const MOUNT_ID = "yaxii-shipping-manager-admin-app";
const PORTAL_ID = "yaxii-shipping-manager-admin-portal";

export function getAdminPortalContainer(): HTMLElement | undefined {
  return document.getElementById(PORTAL_ID) ?? document.getElementById(MOUNT_ID) ?? undefined;
}
