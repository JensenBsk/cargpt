export interface RepairEntry {
  id: string;
  carKey: string; // "${year}_${make}_${model}"
  repairName: string;
  date: string;
  cost?: string;
  who?: "diy" | "shop";
  shopName?: string;
}
