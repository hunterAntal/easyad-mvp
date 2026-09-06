import { getActiveDeviceMedia } from "../../lib/public-device-media";
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

  const media=await getActiveDeviceMedia(id);
  const slides:DeviceMediaSlide[]=(media?.items??[]).map(item=>({id:item.id,title:item.title,subtitle:"",mediaType:item.mediaType,publicUrl:item.publicUrl,createdAt:item.createdAt}));

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
