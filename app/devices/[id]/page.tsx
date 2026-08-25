import { notFound } from "next/navigation";
import { DeviceMediaSlide } from "../../component/device-media-carousel";
import DeviceScreen from "../../component/device-screen";
import { resolveDeviceTemplate } from "../../component/device-templates";
import { getActiveDeviceAlertForDevice, getPublishedInventory, listInventoryAdvertiserResources, listMediaResources } from "../../lib/db";
import { isDigitalInventory } from "../../lib/inventory-delivery";
import { translate } from "../../i18n/messages";

type DevicePublicPageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function deriveCity(address: string) {
  const parts = address.split(",").map((part) => part.trim()).filter(Boolean);
  return parts.length > 1 ? parts.slice(-1)[0] : "Thunder Bay, ON";
}

export default async function DevicePublicPage({ params, searchParams }: DevicePublicPageProps) {
  const { id } = await params;
  const query = (await searchParams) ?? {};
  const inventory = await getPublishedInventory(id);
  if (!inventory || !isDigitalInventory(inventory)) notFound();
  const displayLanguage = inventory.displayLanguage ?? "en";
  const t = (message: string) => translate(displayLanguage, message);

  const templateParam = Array.isArray(query.template) ? query.template[0] : query.template;
  const template = resolveDeviceTemplate(templateParam, inventory.displayTemplate);
  const city = deriveCity(inventory.address);
  const activeAlert = await getActiveDeviceAlertForDevice(inventory.id);

  const deviceSlides: DeviceMediaSlide[] = (await listMediaResources(id))
    .filter((resource) => resource.approvalStatus === "approved" && (resource.mediaType === "image" || resource.mediaType === "video"))
    .map((resource) => ({
      id: resource.id,
      title: resource.title,
      subtitle: `${t(resource.mediaType)} - ${resource.originalName}`,
      mediaType: resource.mediaType === "video" ? "video" : "image",
      publicUrl: resource.publicUrl,
      createdAt: resource.createdAt,
    }));

  const advertiserSlides: DeviceMediaSlide[] = (await listInventoryAdvertiserResources(id))
    .filter((resource) => Boolean(resource.publicUrl))
    .map((resource) => ({
      id: resource.id,
      title: resource.campaign,
      subtitle: `${t("Advertiser creative")} - ${resource.advertiser} - ${resource.originalName ?? t("uploaded media")}`,
      mediaType: resource.mimeType?.startsWith("video/") ? "video" : "image",
      publicUrl: resource.publicUrl ?? "",
      createdAt: resource.createdAt,
    }));

  const slides = [...deviceSlides, ...advertiserSlides].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <DeviceScreen
      inventoryName={inventory.name}
      city={city}
      imageInterval={inventory.imageInterval}
      slides={slides}
      template={template}
      displayLanguage={displayLanguage}
      activeAlert={activeAlert}
    />
  );
}
