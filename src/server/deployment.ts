import "server-only";

export function isProductionDeployment() {
  const vercelEnvironment =
    process.env.VERCEL_ENV ?? process.env.VERCEL_TARGET_ENV;

  return vercelEnvironment === "production";
}

export function getApplicationName() {
  return isProductionDeployment()
    ? "JASTIPin CMS"
    : "JASTIPin CMS Staging";
}
