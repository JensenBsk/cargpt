import type { PartNeeded } from "@/types/diagnostic";

export interface PartLink {
  name: string;
  url: string;
}

export function buildPartLinks(part: PartNeeded, year: string, make: string, model: string): PartLink[] {
  const generalQuery = encodeURIComponent(`${part.partName} ${year} ${make} ${model}`);
  const oemQuery = part.oemPartNumber
    ? encodeURIComponent(`${part.oemPartNumber} ${make} ${model}`)
    : generalQuery;

  return [
    {
      name: "RockAuto",
      url: `https://www.rockauto.com/en/catalog/${encodeURIComponent(make.toLowerCase())},${encodeURIComponent(model.toLowerCase())},${year}`,
    },
    {
      name: "AutoZone",
      url: `https://www.autozone.com/searchresult?searchText=${oemQuery}`,
    },
    {
      name: "Amazon",
      url: `https://www.amazon.com/s?k=${oemQuery}`,
    },
    {
      name: "eBay",
      url: `https://www.ebay.com/sch/i.html?_nkw=${oemQuery}`,
    },
  ];
}
